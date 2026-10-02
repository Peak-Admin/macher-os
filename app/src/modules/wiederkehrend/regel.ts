/**
 * Wiederholungsregeln – reine Logik ohne Datenzugriff (testbar).
 * Wird auch von Wartung und Serviceverträgen genutzt (Monatsrechnung mit Monatsende).
 */
import { plusMonate, plusTage, tageZwischen } from '@core/format';
import { naechsteArbeitstage } from '@core/kalender';
import type { Datum } from '@core/objects';

export type RegelArt = 'woechentlich' | 'monatlich' | 'jaehrlich' | 'monate';

export interface Regel {
  art: RegelArt;
  /** alle N Wochen / Monate (bei `monate`); bei wöchentlich/monatlich/jährlich Standard 1 */
  alle: number;
}

export const REGEL_ARTEN: { wert: RegelArt; label: string }[] = [
  { wert: 'woechentlich', label: 'Wöchentlich' },
  { wert: 'monatlich', label: 'Monatlich' },
  { wert: 'monate', label: 'Alle N Monate' },
  { wert: 'jaehrlich', label: 'Jährlich' },
];

/** Abstand der Regel in Monaten (0 = wochenbasiert) */
export function regelMonate(r: Regel): number {
  switch (r.art) {
    case 'monatlich':
      return Math.max(1, r.alle || 1);
    case 'monate':
      return Math.max(1, r.alle || 1);
    case 'jaehrlich':
      return 12 * Math.max(1, r.alle || 1);
    default:
      return 0;
  }
}

/** n-tes Vorkommen ab Start (n = 0 ist der Start selbst) */
export function vorkommenNr(start: Datum, r: Regel, n: number): Datum {
  if (r.art === 'woechentlich') return plusTage(start, n * 7 * Math.max(1, r.alle || 1));
  return plusMonate(start, n * regelMonate(r));
}

/**
 * Alle Termine der Regel im Zeitraum [von, bis] (inklusive), höchstens bis `ende` der Serie.
 */
export function vorkommen(start: Datum, r: Regel, von: Datum, bis: Datum, ende?: Datum): Datum[] {
  const grenze = ende && ende < bis ? ende : bis;
  const out: Datum[] = [];
  // Einstieg schätzen, damit lange Serien nicht ab Tag 0 durchgezählt werden
  let n = 0;
  if (von > start) {
    const tage = tageZwischen(start, von);
    n = r.art === 'woechentlich' ? Math.floor(tage / (7 * Math.max(1, r.alle || 1))) : Math.floor(tage / 31 / regelMonate(r));
    n = Math.max(0, n - 1);
  }
  for (let i = 0; i < 2000; i++, n++) {
    const d = vorkommenNr(start, r, n);
    if (d > grenze) break;
    if (d >= von) out.push(d);
  }
  return out;
}

/** Fällt der Tag auf einen freien Tag (Wochenende, Feiertag), auf den nächsten Arbeitstag schieben (`@core/kalender`) */
export function werktag(d: Datum): Datum {
  return naechsteArbeitstage(d, 1)[0] ?? d;
}

const WOCHENTAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

/** „Alle 2 Wochen am Dienstag“, „Jeden Monat am 15.“, „Alle 6 Monate am 3.“ */
export function regelText(start: Datum, r: Regel): string {
  const d = new Date(start + 'T12:00:00');
  const n = Math.max(1, r.alle || 1);
  switch (r.art) {
    case 'woechentlich':
      return n === 1 ? `Jede Woche am ${WOCHENTAGE[d.getDay()]}` : `Alle ${n} Wochen am ${WOCHENTAGE[d.getDay()]}`;
    case 'monatlich':
    case 'monate':
      return n === 1 ? `Jeden Monat am ${d.getDate()}.` : `Alle ${n} Monate am ${d.getDate()}.`;
    case 'jaehrlich':
      return n === 1
        ? `Jedes Jahr am ${d.getDate()}.${d.getMonth() + 1}.`
        : `Alle ${n} Jahre am ${d.getDate()}.${d.getMonth() + 1}.`;
  }
}

/** Intervall in Monaten als Text: 1 → „monatlich“, 12 → „jährlich“ */
export function intervallText(monate: number | undefined): string {
  if (!monate) return 'ohne Intervall';
  if (monate === 1) return 'monatlich';
  if (monate === 3) return 'vierteljährlich';
  if (monate === 6) return 'halbjährlich';
  if (monate === 12) return 'jährlich';
  if (monate % 12 === 0) return `alle ${monate / 12} Jahre`;
  return `alle ${monate} Monate`;
}
