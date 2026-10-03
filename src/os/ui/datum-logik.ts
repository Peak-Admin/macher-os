/**
 * Reine Logik der Datumswahl (`DatumEingabe`): Tippen lesen, Kalenderwochen, Monatsraster.
 * Datumswerte sind ISO-Tage (`JJJJ-MM-TT`) wie überall in Macher OS.
 */
import { isoDatum, plusTage, wochentag } from '@core/format';
import type { Datum } from '@core/objects';

export const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
export const MONATE_KURZ = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
export const WOCHENTAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

const ISO = /^\d{4}-\d{2}-\d{2}$/;
export const istIsoDatum = (s: string | undefined): s is Datum => !!s && ISO.test(s);

/** 03.10.2026 */
export function datumKurz(d: Datum): string {
  const [j, m, t] = d.split('-');
  return `${t}.${m}.${j}`;
}

/** Samstag, 3. Oktober 2026 */
export function datumLang(d: Datum): string {
  const [j, m, t] = d.split('-').map(Number);
  return `${WOCHENTAGE[wochentag(d) - 1]}, ${t}. ${MONATE[m - 1]} ${j}`;
}

/** Kalenderwoche nach ISO 8601 (Woche mit dem ersten Donnerstag ist KW 1) */
export function kalenderwoche(d: Datum): number {
  const donnerstag = new Date(`${plusTage(d, 4 - wochentag(d))}T12:00:00`);
  const jahresanfang = new Date(donnerstag.getFullYear(), 0, 1, 12);
  return 1 + Math.floor(Math.round((donnerstag.getTime() - jahresanfang.getTime()) / 864e5) / 7);
}

/** Gleicher Tag n Monate weiter; am Monatsende auf den letzten Tag gekürzt (31.01. + 1 → 28./29.02.) */
export function plusMonate(d: Datum, n: number): Datum {
  const [j, m, t] = d.split('-').map(Number);
  const ziel = new Date(j, m - 1 + n, 1, 12);
  const letzter = new Date(ziel.getFullYear(), ziel.getMonth() + 1, 0, 12).getDate();
  ziel.setDate(Math.min(t, letzter));
  return isoDatum(ziel);
}

export const monatsanfang = (d: Datum): Datum => `${d.slice(0, 8)}01`;

/** Sechs Wochen ab dem Montag vor dem Monatsersten – immer gleich hoch, damit nichts springt */
export function monatsraster(monat: Datum): Datum[][] {
  let tag = plusTage(monatsanfang(monat), 1 - wochentag(monatsanfang(monat)));
  return Array.from({ length: 6 }, () =>
    Array.from({ length: 7 }, () => {
      const d = tag;
      tag = plusTage(tag, 1);
      return d;
    }),
  );
}

/**
 * Getipptes Datum lesen: „03.10.2026“, „3.10.26“, „3.10.“ (laufendes Jahr), „031026“, „03102026“,
 * „heute“, „morgen“, „übermorgen“ oder ISO. Leer → `''`, Unlesbares → `undefined`.
 */
export function datumLesen(text: string, heute: Datum): Datum | '' | undefined {
  const t = text.trim().toLowerCase();
  if (!t) return '';
  if (t === 'heute') return heute;
  if (t === 'morgen') return plusTage(heute, 1);
  if (t === 'übermorgen' || t === 'uebermorgen') return plusTage(heute, 2);
  if (ISO.test(t)) return gueltig(+t.slice(0, 4), +t.slice(5, 7), +t.slice(8, 10));
  const m = t.match(/^(\d{1,2})[./-](\d{1,2})[./-]?(\d{2}|\d{4})?$/) ?? t.match(/^(\d{2})(\d{2})(\d{2}|\d{4})$/);
  if (!m) return undefined;
  let jahr = m[3] ? +m[3] : +heute.slice(0, 4);
  if (jahr < 100) jahr += 2000;
  return gueltig(jahr, +m[2], +m[1]);
}

function gueltig(jahr: number, monat: number, tag: number): Datum | undefined {
  const d = new Date(jahr, monat - 1, tag, 12);
  return d.getFullYear() === jahr && d.getMonth() === monat - 1 && d.getDate() === tag ? isoDatum(d) : undefined;
}

/** Liegt der Tag außerhalb von `min`/`max`? (ISO-Strings lassen sich direkt vergleichen) */
export const ausserhalb = (d: Datum, min?: string, max?: string) => (!!min && istIsoDatum(min) && d < min) || (!!max && istIsoDatum(max) && d > max);

/** Schnellwahl unter dem Monatskopf („Heute“ steht unten im Kalender) */
export function schnellwahl(heute: Datum): { label: string; datum: Datum }[] {
  return [
    { label: 'Morgen', datum: plusTage(heute, 1) },
    { label: 'Nächster Montag', datum: plusTage(heute, 8 - wochentag(heute)) },
    { label: 'In 2 Wochen', datum: plusTage(heute, 14) },
  ];
}
