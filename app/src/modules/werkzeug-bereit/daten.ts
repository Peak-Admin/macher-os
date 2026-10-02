/**
 * Werkzeug & Fahrzeug bereit? Prüft die Betriebsmittel eines Termins:
 * ausdrücklich eingeplante (`termin.betriebsmittelIds`) + Fahrzeuge der eingeplanten Mitarbeiter
 * (`betriebsmittel.mitarbeiterId`). Defekt, in Prüfung, Prüffrist abgelaufen, gleichzeitig doppelt verplant.
 */
import { datum as datumFmt, plusTage } from '@core/format';
import type { Betriebsmittel, ID, Termin } from '@core/objects';
import { aktiverTermin, finde, terminDatum, ueberlappen, type Kontext, type Pruefung } from '../autoplanung/basis';

export interface MittelPruefung extends Pruefung {
  betriebsmittelId?: ID;
}

/** Alle Betriebsmittel, die ein Termin nutzt (ohne Doppelte) */
export function genutzteMittel(ctx: Kontext, t: Termin): { mittel: Betriebsmittel; ausdruecklich: boolean }[] {
  const ausdruecklich = new Set(t.betriebsmittelIds ?? []);
  const ids = new Set<ID>(ausdruecklich);
  for (const b of ctx.betriebsmittel) {
    if (b.art === 'fahrzeug' && b.mitarbeiterId && t.mitarbeiterIds.includes(b.mitarbeiterId) && b.status !== 'ausgemustert') ids.add(b.id);
  }
  return [...ids]
    .map((id) => finde(ctx.betriebsmittel, id))
    .filter((b): b is Betriebsmittel => !!b && !b.geloeschtAm)
    .map((mittel) => ({ mittel, ausdruecklich: ausdruecklich.has(mittel.id) }));
}

const name = (b: Betriebsmittel) => `${b.name}${b.kennzeichen ? ` (${b.kennzeichen})` : b.inventarnummer ? ` (${b.inventarnummer})` : ''}`;

/** Ersatz gleicher Art, der zur Terminzeit frei, in Ordnung und geprüft ist */
export function ersatzFuer(ctx: Kontext, b: Betriebsmittel, t: Termin): Betriebsmittel | undefined {
  const tag = terminDatum(t);
  return ctx.betriebsmittel.find(
    (x) =>
      x.id !== b.id &&
      !x.geloeschtAm &&
      x.art === b.art &&
      (x.status === 'verfuegbar' || x.status === 'im_einsatz') &&
      (!x.naechstePruefung || x.naechstePruefung >= tag) &&
      !belegtVonAnderem(ctx, x.id, t) &&
      (x.art !== 'fahrzeug' || !x.mitarbeiterId || t.mitarbeiterIds.includes(x.mitarbeiterId)),
  );
}

/** Welcher andere, gleichzeitige Termin nutzt dieses Betriebsmittel auch? */
export function belegtVonAnderem(ctx: Kontext, id: ID, t: Termin): Termin | undefined {
  return ctx.termine.find(
    (o) => o.id !== t.id && aktiverTermin(o) && o.status !== 'erledigt' && ueberlappen(o, t) && genutzteMittel(ctx, o).some((g) => g.mittel.id === id),
  );
}

export function pruefeWerkzeug(ctx: Kontext, t: Termin): MittelPruefung[] {
  const tag = terminDatum(t);
  const genutzt = genutzteMittel(ctx, t);
  const r: MittelPruefung[] = [];
  for (const { mittel: b } of genutzt) {
    const ersatz = () => {
      const e = ersatzFuer(ctx, b, t);
      return e ? `Stattdessen ${name(e)} mitnehmen.` : undefined;
    };
    if (b.status === 'defekt' || b.status === 'ausgemustert') {
      r.push({ betriebsmittelId: b.id, ergebnis: 'problem', text: `${name(b)} ist ${b.status === 'defekt' ? 'defekt' : 'ausgemustert'}.`, loesung: ersatz() ?? 'Reparatur klären oder Ersatz besorgen.' });
      continue;
    }
    if (b.status === 'in_pruefung') {
      r.push({ betriebsmittelId: b.id, ergebnis: 'warnung', text: `${name(b)} ist gerade in der Prüfung.`, loesung: ersatz() ?? 'Klären, ob es bis zum Einsatz zurück ist.' });
      continue;
    }
    if (b.naechstePruefung && b.naechstePruefung < tag) {
      r.push({
        betriebsmittelId: b.id,
        ergebnis: 'problem',
        text: `${name(b)}: ${b.pruefungArt ?? 'Prüfung'} war am ${datumFmt(b.naechstePruefung)} fällig – am Einsatztag nicht geprüft.`,
        loesung: ersatz() ?? (tag <= ctx.heute ? 'Nicht einsetzen, bis die Prüfung erledigt ist.' : `${b.pruefungArt ?? 'Prüfung'} vor dem ${datumFmt(tag)} erledigen.`),
      });
      continue;
    }
    const anderer = belegtVonAnderem(ctx, b.id, t);
    if (anderer) {
      r.push({ betriebsmittelId: b.id, ergebnis: 'problem', text: `${name(b)} ist gleichzeitig bei „${anderer.titel}“ verplant.`, loesung: ersatz() ?? 'Einen der Termine verschieben.' });
      continue;
    }
    if (b.naechstePruefung && b.naechstePruefung <= plusTage(tag, 7)) {
      r.push({ betriebsmittelId: b.id, ergebnis: 'warnung', text: `${name(b)}: ${b.pruefungArt ?? 'Prüfung'} fällig am ${datumFmt(b.naechstePruefung)}.`, loesung: 'Prüfung rechtzeitig einplanen.' });
      continue;
    }
    r.push({ betriebsmittelId: b.id, ergebnis: 'ok', text: `${name(b)}: einsatzbereit.` });
  }
  const braucheFahrzeug = (t.ortId || t.auftragId) && !['intern', 'schulung'].includes(t.art) && t.mitarbeiterIds.length > 0;
  if (braucheFahrzeug && !genutzt.some((g) => g.mittel.art === 'fahrzeug')) {
    const frei = ctx.betriebsmittel.find(
      (b) => !b.geloeschtAm && b.art === 'fahrzeug' && !b.mitarbeiterId && b.status === 'verfuegbar' && (!b.naechstePruefung || b.naechstePruefung >= tag) && !belegtVonAnderem(ctx, b.id, t),
    );
    r.push({
      ergebnis: 'warnung',
      text: 'Kein Fahrzeug eingeplant.',
      loesung: frei ? `${name(frei)} ist frei.` : 'Kläre, wie das Team zum Einsatzort kommt.',
    });
  }
  if (!r.length) r.push({ ergebnis: 'ok', text: 'Kein Werkzeug und kein Fahrzeug eingeplant.' });
  return r;
}

/** Alle anstehenden Termine (heute bis +tage) mit Werkzeug-/Fahrzeugproblemen */
export function werkzeugProbleme(ctx: Kontext, tage = 7): { termin: Termin; pruefungen: MittelPruefung[] }[] {
  const bis = plusTage(ctx.heute, tage);
  return ctx.termine
    .filter((t) => aktiverTermin(t) && t.status !== 'erledigt' && terminDatum(t) >= ctx.heute && terminDatum(t) <= bis)
    .sort((a, b) => a.start.localeCompare(b.start))
    .map((termin) => ({ termin, pruefungen: pruefeWerkzeug(ctx, termin).filter((p) => p.ergebnis !== 'ok') }))
    .filter((x) => x.pruefungen.length > 0);
}
