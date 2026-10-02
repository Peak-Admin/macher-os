/**
 * Serien (wiederkehrende Termine). Eine Serie erzeugt echte `termine` mit `serieId` –
 * der Kalender zeigt sie wie jeden anderen Termin. Die Serie merkt sich nur die Regel,
 * welche Vorkommen schon erzeugt wurden und welche ausgelassen werden.
 */
import { batch, db, defineCollection, vermerken } from '@core/db';
import { heute, plusTage, zeitpunkt, personName, plusMonate } from '@core/format';
import type { Basis, Datum, ID, TerminArt } from '@core/objects';
import { vorkommen, werktag, type Regel } from './regel';

export interface Serie extends Basis {
  titel: string;
  regel: Regel;
  /** erstes Vorkommen */
  start: Datum;
  /** „HH:MM“ */
  uhrzeit: string;
  dauerMinuten: number;
  /** Serie endet nach diesem Tag (leer = läuft weiter) */
  ende?: Datum;
  terminArt: TerminArt;
  mitarbeiterIds: ID[];
  kundeId?: ID;
  ortId?: ID;
  /** Anlagen, für die diese Serie die Wartungstermine stellt */
  anlageIds?: ID[];
  /** Servicevertrag, aus dem die Serie kommt (Sammlung `servicevertraege`) */
  vertragId?: ID;
  /** fester Auftrag, an den alle Termine gehängt werden (z. B. Hausmeisterdienst) */
  auftragId?: ID;
  /** Vorkommen, die bewusst ausgelassen werden */
  ausnahmen: Datum[];
  /** Vorkommen, für die schon ein Termin erzeugt wurde (auch wenn er später verschoben/gelöscht wurde) */
  erzeugt: Datum[];
  notiz?: string;
  /** Termine am Wochenende auf Montag schieben */
  werktags?: boolean;
}

export const serien = defineCollection<Serie>('serien');

/** Wie weit im Voraus Termine angelegt werden */
export const HORIZONT_MONATE = 3;

export function serieAktiv(s: Serie, stichtag: Datum = heute()) {
  return !s.ende || s.ende >= stichtag;
}

/** Datum eines Termins (lokal) */
const terminDatum = (iso: string) => {
  const d = new Date(iso);
  const z = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};

function endeZeit(datum: Datum, uhrzeit: string, minuten: number) {
  return new Date(new Date(zeitpunkt(datum, uhrzeit)).getTime() + minuten * 60_000).toISOString();
}

/**
 * Erzeugt fehlende Termine einer Serie bis zum Horizont. Idempotent.
 * Gibt die Anzahl neu angelegter Termine zurück.
 */
export function termineErzeugen(s: Serie, stichtag: Datum = heute(), horizontMonate = HORIZONT_MONATE): number {
  if (!serieAktiv(s, stichtag)) return 0;
  const bis = plusMonate(stichtag, horizontMonate);
  const offen = vorkommen(s.start, s.regel, stichtag, bis, s.ende).filter(
    (d) => !s.erzeugt.includes(d) && !s.ausnahmen.includes(d),
  );
  if (!offen.length) return 0;
  batch(() => {
    for (const vorkommenAm of offen) {
      const d = s.werktags ? werktag(vorkommenAm) : vorkommenAm;
      db.termine.create({
        art: s.terminArt,
        titel: s.titel,
        start: zeitpunkt(d, s.uhrzeit),
        ende: endeZeit(d, s.uhrzeit, s.dauerMinuten),
        auftragId: s.auftragId,
        kundeId: s.kundeId,
        ortId: s.ortId,
        mitarbeiterIds: [...s.mitarbeiterIds],
        status: 'geplant',
        serieId: s.id,
        notiz: s.notiz,
        beispiel: s.beispiel,
      });
    }
    // alte Einträge aufräumen, damit die Liste nicht endlos wächst
    const grenze = plusTage(stichtag, -400);
    serien.update(s.id, { erzeugt: [...s.erzeugt.filter((d) => d >= grenze), ...offen] }, { leise: true });
  });
  return offen.length;
}

/** Termine einer Serie (ohne Papierkorb), nach Start sortiert */
export function serienTermine(serieId: ID) {
  return db.termine.where((t) => t.serieId === serieId).sort((a, b) => a.start.localeCompare(b.start));
}

/** Einzelnen Termin auslassen: Termin weg, Datum als Ausnahme merken */
export function terminAuslassen(terminId: ID) {
  const t = db.termine.get(terminId);
  if (!t?.serieId) return;
  const s = serien.get(t.serieId);
  const am = terminDatum(t.start);
  // Vorkommen finden (bei Werktag-Verschiebung bis zu 2 Tage vorher)
  const d = s ? [am, plusTage(am, -1), plusTage(am, -2)].find((x) => s.erzeugt.includes(x)) ?? am : am;
  batch(() => {
    db.termine.remove(t.id);
    if (s && !s.ausnahmen.includes(d)) serien.update(s.id, { ausnahmen: [...s.ausnahmen, d] });
  });
  vermerken({ typ: 'termine', id: t.id }, 'serie.ausgelassen', 'Aus der Serie ausgelassen');
}

/** Einzelnen Termin verschieben – die Serie selbst bleibt unverändert */
export function terminVerschieben(terminId: ID, neuesDatum: Datum, neueUhrzeit: string) {
  const t = db.termine.get(terminId);
  if (!t) return;
  const dauer = new Date(t.ende).getTime() - new Date(t.start).getTime();
  const start = zeitpunkt(neuesDatum, neueUhrzeit);
  db.termine.update(
    t.id,
    { start, ende: new Date(new Date(start).getTime() + dauer).toISOString() },
    { text: `Serientermin verschoben auf ${neuesDatum.split('-').reverse().join('.')} ${neueUhrzeit}` },
  );
}

/** Serie beenden: ab `ab` keine neuen Termine, künftige offene Termine absagen (Papierkorb) */
export function serieBeenden(serieId: ID, ab: Datum = heute()): number {
  const s = serien.get(serieId);
  if (!s) return 0;
  const weg = serienTermine(serieId).filter((t) => terminDatum(t.start) > ab && ['geplant', 'bestaetigt'].includes(t.status));
  batch(() => {
    serien.update(s.id, { ende: ab });
    weg.forEach((t) => db.termine.remove(t.id));
  });
  return weg.length;
}

/**
 * Serientermine in den nächsten Tagen, bei denen ein eingeteilter Mitarbeiter abwesend ist
 * (genehmigt oder beantragt).
 */
export function abwesenheitsKonflikte(stichtag: Datum = heute(), tage = 30) {
  const bis = plusTage(stichtag, tage);
  const abw = db.abwesenheiten.where((a) => a.status !== 'abgelehnt');
  const out: { terminId: ID; serieId: ID; datum: Datum; mitarbeiterId: ID; art: string; beantragt: boolean }[] = [];
  for (const t of db.termine.where((t) => !!t.serieId && ['geplant', 'bestaetigt'].includes(t.status))) {
    const d = terminDatum(t.start);
    if (d < stichtag || d > bis) continue;
    for (const mId of t.mitarbeiterIds) {
      const a = abw.find((x) => x.mitarbeiterId === mId && x.von <= d && x.bis >= d);
      if (a) out.push({ terminId: t.id, serieId: t.serieId!, datum: d, mitarbeiterId: mId, art: a.art, beantragt: a.status === 'beantragt' });
    }
  }
  return out;
}

export const mitarbeiterNamen = (ids: ID[]) =>
  ids.map((id) => personName(db.mitarbeiter.get(id))).join(', ') || 'niemand eingeteilt';

export { terminDatum };
