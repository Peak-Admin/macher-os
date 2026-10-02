/**
 * Urlaub & Krankheit – reine Logik (Arbeitstage, Feiertage, Urlaubskonto, Kollisionen).
 * Wird auch von Arbeitszeiten (Soll-Stunden) und anderen Team-Modulen genutzt.
 */
import { isoDatum, plusTage, datumVon } from '@core/format';
import type { Abwesenheit, AbwesenheitsArt, Datum, ID, Mitarbeiter, Termin } from '@core/objects';

export const ART_LABEL: Record<AbwesenheitsArt, string> = {
  urlaub: 'Urlaub',
  krank: 'Krank',
  schule: 'Berufsschule',
  schulung: 'Schulung',
  frei: 'Frei / Überstundenabbau',
  sonstiges: 'Sonstiges',
};

export const STATUS_LABEL: Record<Abwesenheit['status'], string> = {
  beantragt: 'Beantragt',
  genehmigt: 'Genehmigt',
  abgelehnt: 'Abgelehnt',
};

// ------------------------------------------------------------------ Feiertage

/** Ostersonntag (gregorianisch, Algorithmus nach Meeus/Jones/Butcher) */
export function ostersonntag(jahr: number): Datum {
  const a = jahr % 19;
  const b = Math.floor(jahr / 100);
  const c = jahr % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const monat = Math.floor((h + l - 7 * m + 114) / 31);
  const tag = ((h + l - 7 * m + 114) % 31) + 1;
  return isoDatum(new Date(jahr, monat - 1, tag, 12));
}

const feiertagCache = new Map<number, Set<Datum>>();

/** Bundesweite gesetzliche Feiertage (Landesfeiertage fehlen bewusst – siehe Bericht). */
export function feiertage(jahr: number): Set<Datum> {
  const vorhanden = feiertagCache.get(jahr);
  if (vorhanden) return vorhanden;
  const ostern = ostersonntag(jahr);
  const s = new Set<Datum>([
    `${jahr}-01-01`,
    plusTage(ostern, -2),
    plusTage(ostern, 1),
    `${jahr}-05-01`,
    plusTage(ostern, 39),
    plusTage(ostern, 50),
    `${jahr}-10-03`,
    `${jahr}-12-25`,
    `${jahr}-12-26`,
  ]);
  feiertagCache.set(jahr, s);
  return s;
}

export function wochentag(d: Datum): number {
  // 0 = Sonntag … 6 = Samstag
  return new Date(d + 'T12:00:00').getDay();
}

/** Montag bis Freitag und kein bundesweiter Feiertag */
export function istArbeitstag(d: Datum): boolean {
  const w = wochentag(d);
  if (w === 0 || w === 6) return false;
  return !feiertage(Number(d.slice(0, 4))).has(d);
}

/** Arbeitstage im Zeitraum (inklusive), halbtags = 0,5 je Tag */
export function arbeitstage(von: Datum, bis: Datum, halbtags = false): number {
  if (bis < von) return 0;
  let n = 0;
  for (let d = von; d <= bis; d = plusTage(d, 1)) if (istArbeitstag(d)) n++;
  return halbtags ? n / 2 : n;
}

/** Zeitraum auf ein Kalenderjahr zuschneiden */
export function imJahr(a: Pick<Abwesenheit, 'von' | 'bis'>, jahr: number): { von: Datum; bis: Datum } | undefined {
  const von = a.von < `${jahr}-01-01` ? `${jahr}-01-01` : a.von;
  const bis = a.bis > `${jahr}-12-31` ? `${jahr}-12-31` : a.bis;
  return bis < von ? undefined : { von, bis };
}

export function tageImJahr(a: Abwesenheit, jahr: number): number {
  const z = imJahr(a, jahr);
  return z ? arbeitstage(z.von, z.bis, a.halbtags) : 0;
}

// ------------------------------------------------------------------ Urlaubskonto

export interface Urlaubskonto {
  anspruch: number;
  genehmigt: number;
  beantragt: number;
  /** Anspruch minus genehmigt */
  rest: number;
  kranktage: number;
}

export function urlaubskonto(m: Pick<Mitarbeiter, 'id' | 'urlaubstageJahr'>, alle: Abwesenheit[], jahr: number): Urlaubskonto {
  const eigene = alle.filter((a) => a.mitarbeiterId === m.id && !a.geloeschtAm);
  const summe = (f: (a: Abwesenheit) => boolean) => eigene.filter(f).reduce((s, a) => s + tageImJahr(a, jahr), 0);
  const genehmigt = summe((a) => a.art === 'urlaub' && a.status === 'genehmigt');
  const beantragt = summe((a) => a.art === 'urlaub' && a.status === 'beantragt');
  const kranktage = summe((a) => a.art === 'krank' && a.status !== 'abgelehnt');
  return { anspruch: m.urlaubstageJahr, genehmigt, beantragt, rest: m.urlaubstageJahr - genehmigt, kranktage };
}

// ------------------------------------------------------------------ Abwesend? Kollisionen

/** Zählt (bzw. zählt bald): genehmigt oder Krankmeldung */
export function wirksam(a: Abwesenheit) {
  return a.status === 'genehmigt';
}

export function abwesenheitAm(maId: ID, d: Datum, alle: Abwesenheit[]): Abwesenheit | undefined {
  return alle.find((a) => a.mitarbeiterId === maId && !a.geloeschtAm && wirksam(a) && a.von <= d && a.bis >= d);
}

/** Termine des Mitarbeiters im Zeitraum, die noch nicht erledigt/abgesagt sind */
export function kollisionen(a: Abwesenheit, termine: Termin[]): Termin[] {
  return termine
    .filter((t) => !t.geloeschtAm && t.mitarbeiterIds.includes(a.mitarbeiterId))
    .filter((t) => t.status !== 'abgesagt' && t.status !== 'erledigt')
    .filter((t) => !(a.art === 'schulung' && t.art === 'schulung'))
    .filter((t) => datumVon(t.start) <= a.bis && datumVon(t.ende) >= a.von)
    .sort((x, y) => x.start.localeCompare(y.start));
}

/** Überschneidet sich der neue Zeitraum mit einer bestehenden Abwesenheit? */
export function ueberschneidung(maId: ID, von: Datum, bis: Datum, alle: Abwesenheit[], ohneId?: ID): Abwesenheit | undefined {
  return alle.find((a) => a.id !== ohneId && a.mitarbeiterId === maId && !a.geloeschtAm && a.status !== 'abgelehnt' && a.von <= bis && a.bis >= von);
}

export function zeitraumText(a: Pick<Abwesenheit, 'von' | 'bis' | 'halbtags'>): string {
  const f = (d: Datum) => `${d.slice(8, 10)}.${d.slice(5, 7)}.`;
  const t = a.von === a.bis ? f(a.von) : `${f(a.von)}–${f(a.bis)}`;
  return a.halbtags ? `${t} (halbtags)` : t;
}

export function tageText(n: number) {
  const s = String(n).replace('.', ',');
  return n === 1 ? '1 Arbeitstag' : `${s} Arbeitstage`;
}
