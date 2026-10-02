/** Filter der Angebotsliste – rein, ohne Datenbank testbar. Die Filter stehen in der URL. */
import type { Datum } from '@core/objects';

export type Zeitraum = 'monat' | 'quartal' | 'jahr' | 'alle';
export type BetragArt = 'netto' | 'brutto';

export const ZEITRAEUME: { wert: Zeitraum; label: string }[] = [
  { wert: 'alle', label: 'Alle' },
  { wert: 'monat', label: 'Dieser Monat' },
  { wert: 'quartal', label: 'Letzte 3 Monate' },
  { wert: 'jahr', label: 'Dieses Jahr' },
];

/** Einstellung je Gerät: Beträge netto oder brutto zeigen */
export const BETRAG_EINSTELLUNG = 'angebote.liste.betrag';

export const istZeitraum = (w: string | null): w is Zeitraum => w === 'monat' || w === 'quartal' || w === 'jahr' || w === 'alle';

/** Erster Tag des Zeitraums (inklusive) oder `undefined` für „alle“ */
export function zeitraumAb(z: Zeitraum, tag: Datum): Datum | undefined {
  const [j, m, t] = tag.split('-').map(Number);
  if (z === 'monat') return `${tag.slice(0, 7)}-01`;
  if (z === 'jahr') return `${tag.slice(0, 4)}-01-01`;
  if (z === 'quartal') {
    // gleicher Kalendertag drei Monate zurück, am Monatsende gekappt (31.05. → 28./29.02.)
    const ziel = new Date(Date.UTC(j, m - 1 - 3, 1));
    const letzter = new Date(Date.UTC(ziel.getUTCFullYear(), ziel.getUTCMonth() + 1, 0)).getUTCDate();
    return `${ziel.getUTCFullYear()}-${String(ziel.getUTCMonth() + 1).padStart(2, '0')}-${String(Math.min(t, letzter)).padStart(2, '0')}`;
  }
  return undefined;
}

/** Liegt das Angebotsdatum im Zeitraum? */
export function imZeitraum(datum: Datum, z: Zeitraum, tag: Datum): boolean {
  const ab = zeitraumAb(z, tag);
  return !ab || datum.slice(0, 10) >= ab;
}

/** Wie viele Zusatzfilter sind gesetzt? (für „Filter (2)“ auf dem Handy) */
export function aktiveFilter(f: { zeit: Zeitraum; auftragId?: string }): number {
  return (f.zeit !== 'alle' ? 1 : 0) + (f.auftragId ? 1 : 0);
}
