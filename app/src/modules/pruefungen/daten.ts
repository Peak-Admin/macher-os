/**
 * Prüfungen & Wartung für Betriebsmittel: DGUV V3, TÜV/HU, UVV, Leiterprüfung, Kalibrierung …
 * Frist steht am Betriebsmittel (`naechstePruefung`, `pruefungArt`).
 * Jede dokumentierte Prüfung ist ein Eintrag im Zeitstrahl des Geräts (typ `betriebsmittel.geprueft`),
 * das Prüfprotokoll ein `Dokument` mit Bezug auf das Gerät.
 */
import { batch, db, vermerken, zeitstrahl } from '@core/db';
import { heute, isoDatum, tageZwischen } from '@core/format';
import type { Ton } from '@core/modul';
import type { Betriebsmittel, Datum, ID } from '@core/objects';
import { bmx, type BetriebsmittelX } from '../werkzeuge/daten';

export const PRUEFARTEN: { art: string; monate: number; beschreibung: string }[] = [
  { art: 'DGUV V3', monate: 12, beschreibung: 'Elektrische Geräte (Baustelle: oft 3–6 Monate)' },
  { art: 'TÜV/HU', monate: 24, beschreibung: 'Hauptuntersuchung Fahrzeug' },
  { art: 'UVV', monate: 12, beschreibung: 'Unfallverhütung Fahrzeug' },
  { art: 'Leiterprüfung', monate: 12, beschreibung: 'Leitern und Tritte' },
  { art: 'Kalibrierung', monate: 12, beschreibung: 'Messgeräte' },
  { art: 'Wartung', monate: 12, beschreibung: 'Herstellerwartung' },
];

export function standardIntervall(art: string | undefined): number {
  return PRUEFARTEN.find((p) => p.art.toLowerCase() === (art ?? '').toLowerCase())?.monate ?? 12;
}

export function intervall(b: Betriebsmittel): number {
  return bmx(b).pruefIntervallMonate ?? standardIntervall(b.pruefungArt);
}

/** Datum + n Monate (Monatsende sauber: 31.01. + 1 → 28./29.02.) */
export function plusMonate(d: Datum, monate: number): Datum {
  const [j, m, t] = d.split('-').map(Number);
  const ziel = new Date(j, m - 1 + monate, 1, 12);
  const letzter = new Date(ziel.getFullYear(), ziel.getMonth() + 1, 0).getDate();
  ziel.setDate(Math.min(t, letzter));
  return isoDatum(ziel);
}

export type Stufe = 'ueberfaellig' | 'tage14' | 'tage30' | 'ok' | 'keine';

export interface Faelligkeit {
  stufe: Stufe;
  tage?: number;
  text: string;
  ton: Ton;
}

export function faelligkeit(b: Betriebsmittel, t: Datum = heute()): Faelligkeit {
  if (!b.naechstePruefung) return { stufe: 'keine', text: 'Keine Frist hinterlegt', ton: 'neutral' };
  const tage = tageZwischen(t, b.naechstePruefung);
  if (tage < 0) return { stufe: 'ueberfaellig', tage, text: `Seit ${-tage} ${-tage === 1 ? 'Tag' : 'Tagen'} überfällig – nicht verwenden`, ton: 'achtung' };
  if (tage === 0) return { stufe: 'tage14', tage, text: 'Heute fällig', ton: 'achtung' };
  if (tage <= 14) return { stufe: 'tage14', tage, text: `Fällig in ${tage} ${tage === 1 ? 'Tag' : 'Tagen'}`, ton: 'achtung' };
  if (tage <= 30) return { stufe: 'tage30', tage, text: `Fällig in ${tage} Tagen`, ton: 'aktiv' };
  return { stufe: 'ok', tage, text: 'In Ordnung', ton: 'erfolg' };
}

/** Alle Betriebsmittel mit Frist, früheste zuerst */
export function pruefliste(t: Datum = heute()) {
  return db.betriebsmittel
    .where((b) => b.status !== 'ausgemustert' && !!b.naechstePruefung)
    .map((b) => ({ b, f: faelligkeit(b, t) }))
    .sort((x, y) => x.b.naechstePruefung!.localeCompare(y.b.naechstePruefung!));
}

export type Ergebnis = 'bestanden' | 'maengel' | 'nicht_bestanden';

export const ERGEBNIS_LABEL: Record<Ergebnis, string> = {
  bestanden: 'Bestanden',
  maengel: 'Bestanden mit Mängeln',
  nicht_bestanden: 'Nicht bestanden',
};

export interface PruefungEingabe {
  datum: Datum;
  ergebnis: Ergebnis;
  pruefer: string;
  art?: string;
  intervallMonate?: number;
  dokumentId?: ID;
  bemerkung?: string;
}

export interface PruefEintrag extends PruefungEingabe {
  id: ID;
  naechste: Datum;
  erfasstAm: string;
}

/** Prüfung dokumentieren → nächste Frist automatisch nach Intervall */
export function pruefungDokumentieren(id: ID, e: PruefungEingabe): Datum | undefined {
  const b = db.betriebsmittel.get(id);
  if (!b) return undefined;
  const art = e.art?.trim() || b.pruefungArt || 'Prüfung';
  const monate = e.intervallMonate && e.intervallMonate > 0 ? e.intervallMonate : intervall(b);
  const naechste = plusMonate(e.datum, monate);
  const status: Betriebsmittel['status'] =
    e.ergebnis === 'nicht_bestanden' ? 'defekt' : b.status === 'in_pruefung' || b.status === 'defekt' ? (b.mitarbeiterId ? 'im_einsatz' : 'verfuegbar') : b.status;
  batch(() => {
    db.betriebsmittel.update(
      id,
      {
        naechstePruefung: naechste,
        pruefungArt: art,
        pruefIntervallMonate: monate === standardIntervall(art) ? undefined : monate,
        status,
      } as Partial<BetriebsmittelX>,
      { text: `${art} ${ERGEBNIS_LABEL[e.ergebnis].toLowerCase()} – nächste Prüfung ${naechste.split('-').reverse().join('.')}` },
    );
    vermerken({ typ: 'betriebsmittel', id }, 'betriebsmittel.geprueft', `${art}: ${ERGEBNIS_LABEL[e.ergebnis]} (Prüfer: ${e.pruefer})`, {
      ...e,
      art,
      intervallMonate: monate,
      naechste,
    });
  });
  return naechste;
}

/** Prüfhistorie eines Geräts (neueste zuerst) */
export function pruefhistorie(id: ID): PruefEintrag[] {
  return zeitstrahl({ typ: 'betriebsmittel', id })
    .filter((e) => e.typ === 'betriebsmittel.geprueft' && e.daten)
    .map((e) => ({ ...(e.daten as PruefungEingabe & { naechste: Datum }), id: e.id, erfasstAm: e.erstelltAm }));
}
