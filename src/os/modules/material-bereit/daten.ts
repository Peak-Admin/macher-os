/**
 * Material bereit? Prüft für Einsätze in den nächsten Tagen, ob das Material des Auftrags
 * (`db.material`, Status geplant/bestellt/bereit) da ist – gegen den Lagerbestand.
 *
 * Lagerbestand wird in Terminreihenfolge verteilt: Der früheste Einsatz bekommt den Bestand zuerst.
 */
import { datum as datumFmt, datumVon, plusTage, tageZwischen, zahl } from '@core/format';
import type { Auftrag, Datum, ID, Materialbuchung, Termin } from '@core/objects';
import { finde, type Kontext, type Pruefung } from '../autoplanung/basis';
import { terminZaehlt } from '../verfuegbarkeit/daten';

export const OFFENE_STATUS: Materialbuchung['status'][] = ['geplant', 'bestellt', 'bereit'];

/** Nächster anstehender Einsatz eines Auftrags ab `ab` */
export function naechsterEinsatz(ctx: Kontext, auftragId: ID, ab: Datum = ctx.heute): Termin | undefined {
  return ctx.termine
    .filter((t) => terminZaehlt(t) && t.auftragId === auftragId && t.status !== 'erledigt' && datumVon(t.start) >= ab && t.art !== 'besichtigung')
    .sort((a, b) => a.start.localeCompare(b.start))[0];
}

export interface MaterialZeile {
  buchung: Materialbuchung;
  pruefung: Pruefung;
  /** fehlende Menge (nur bei Lagerknappheit) */
  fehlt?: number;
}

export interface MaterialCheck {
  auftrag: Auftrag;
  termin: Termin;
  zeilen: MaterialZeile[];
  ergebnis: Pruefung['ergebnis'];
}

/**
 * Prüft alle Aufträge mit Einsatz in den nächsten `vorlaufTage` Tagen.
 * Ergebnis je Auftrag, nach Einsatzdatum sortiert.
 */
export function pruefeMaterial(ctx: Kontext, vorlaufTage = 5): MaterialCheck[] {
  const bis = plusTage(ctx.heute, vorlaufTage);
  const auftraege = ctx.auftraege
    .filter((a) => !a.geloeschtAm && !['erledigt', 'verloren', 'abrechnung'].includes(a.phase))
    .map((a) => ({ auftrag: a, termin: naechsterEinsatz(ctx, a.id) }))
    .filter((x): x is { auftrag: Auftrag; termin: Termin } => !!x.termin && datumVon(x.termin.start) <= bis)
    .sort((a, b) => a.termin.start.localeCompare(b.termin.start));

  // Lagerbestand, der noch verteilt werden kann
  const rest = new Map<ID, number>();
  for (const art of ctx.artikel) if (art.bestand != null) rest.set(art.id, art.bestand);

  return auftraege
    .map(({ auftrag, termin }) => {
      const buchungen = ctx.material.filter((m) => !m.geloeschtAm && m.auftragId === auftrag.id && OFFENE_STATUS.includes(m.status));
      const zeilen = buchungen.map((b) => pruefeBuchung(ctx, b, termin, rest));
      return { auftrag, termin, zeilen, ergebnis: schlimmsteZeile(zeilen) };
    })
    .filter((c) => c.zeilen.length > 0);
}

function schlimmsteZeile(z: MaterialZeile[]): Pruefung['ergebnis'] {
  if (z.some((x) => x.pruefung.ergebnis === 'problem')) return 'problem';
  if (z.some((x) => x.pruefung.ergebnis === 'warnung')) return 'warnung';
  return 'ok';
}

function pruefeBuchung(ctx: Kontext, b: Materialbuchung, termin: Termin, rest: Map<ID, number>): MaterialZeile {
  const tag = datumVon(termin.start);
  const knapp = tag <= plusTage(ctx.heute, 1);
  const menge = `${zahl(b.menge)} ${b.einheit} ${b.text}`;
  if (b.status === 'bereit') return { buchung: b, pruefung: { ergebnis: 'ok', text: `${menge}: liegt bereit.` } };
  if (b.status === 'bestellt') {
    return {
      buchung: b,
      pruefung: {
        ergebnis: knapp ? 'problem' : 'warnung',
        text: `${menge}: bestellt, aber noch nicht da.`,
        loesung: knapp ? 'Beim Lieferanten nachhaken oder Abholung organisieren.' : 'Lieferung im Blick behalten.',
      },
    };
  }
  // geplant
  const artikel = finde(ctx.artikel, b.artikelId);
  if (!artikel || artikel.bestand == null) {
    return {
      buchung: b,
      pruefung: {
        ergebnis: knapp ? 'problem' : 'warnung',
        text: `${menge}: kein Lagerartikel und noch nicht bestellt.`,
        loesung: 'Material bestellen.',
      },
    };
  }
  const verfuegbar = rest.get(artikel.id) ?? 0;
  if (verfuegbar >= b.menge) {
    rest.set(artikel.id, verfuegbar - b.menge);
    return { buchung: b, pruefung: { ergebnis: 'ok', text: `${menge}: aus dem Lager (Bestand reicht).` } };
  }
  rest.set(artikel.id, 0);
  const fehlt = Math.round((b.menge - verfuegbar) * 100) / 100;
  return {
    buchung: b,
    fehlt,
    pruefung: {
      ergebnis: 'problem',
      text: `${menge}: im Lager ${verfuegbar > 0 ? `nur ${zahl(verfuegbar)} ${b.einheit}` : 'nichts'} frei, es fehlen ${zahl(fehlt)} ${b.einheit}.`,
      loesung:
        plusTage(tag, -1) < ctx.heute
          ? `${zahl(fehlt)} ${b.einheit} sofort besorgen – beim Großhandel abholen oder Expresslieferung.`
          : `${zahl(fehlt)} ${b.einheit} bis ${datumFmt(plusTage(tag, -1))} bestellen.`,
    },
  };
}

/** Prüfung für einen einzelnen Termin (Panel) – nutzt dieselbe Verteilung */
export function pruefeMaterialFuerTermin(ctx: Kontext, t: Termin): Pruefung[] {
  if (!t.auftragId) return [];
  const tage = Math.max(0, tageZwischen(ctx.heute, datumVon(t.start)));
  const check = pruefeMaterial(ctx, tage).find((c) => c.auftrag.id === t.auftragId);
  if (!check) {
    const offen = ctx.material.some((m) => !m.geloeschtAm && m.auftragId === t.auftragId && OFFENE_STATUS.includes(m.status));
    return offen ? [] : [{ ergebnis: 'ok', text: 'Kein offenes Material am Auftrag.' }];
  }
  return check.zeilen.map((z) => z.pruefung);
}
