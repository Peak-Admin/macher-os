/** Zeitangaben aus Alltagssprache lesen: „morgen“, „bis Freitag“, „nächste Woche“, „am 12.10.“ */
import { plusTage } from '@core/format';
import type { Datum } from '@core/objects';

export interface Zeitraum {
  von: Datum;
  bis: Datum;
  /** „morgen“, „nächste Woche“ … für die Antwort */
  label: string;
  /** genau ein Tag? */
  tag: boolean;
}

const WOCHENTAGE = ['sonntag', 'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag'];
const KURZ = ['so', 'mo', 'di', 'mi', 'do', 'fr', 'sa'];

/** 0 = Sonntag … 6 = Samstag */
export function wochentag(d: Datum): number {
  return new Date(d + 'T12:00:00').getDay();
}

/** Montag der Woche, in der `d` liegt */
export function montagVon(d: Datum): Datum {
  const wt = wochentag(d);
  return plusTage(d, wt === 0 ? -6 : 1 - wt);
}

const norm = (t: string) => t.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');

/** Nächster genannter Wochentag ab heute (heute eingeschlossen) */
function naechster(wt: number, heute: Datum): Datum {
  const diff = (wt - wochentag(heute) + 7) % 7;
  return plusTage(heute, diff);
}

const tag = (d: Datum, label: string): Zeitraum => ({ von: d, bis: d, label, tag: true });

/** Liest den ersten erkennbaren Zeitraum aus einem Text. */
export function zeitraumAus(text: string, heute: Datum): Zeitraum | undefined {
  const t = norm(text);
  if (/\buebermorgen\b/.test(t)) return tag(plusTage(heute, 2), 'übermorgen');
  if (/\bmorgen\b/.test(t)) return tag(plusTage(heute, 1), 'morgen');
  if (/\bheute\b/.test(t)) return tag(heute, 'heute');
  if (/\bgestern\b/.test(t)) return tag(plusTage(heute, -1), 'gestern');

  if (/\b(naechste|kommende)n? woche\b/.test(t)) {
    const mo = plusTage(montagVon(heute), 7);
    return { von: mo, bis: plusTage(mo, 6), label: 'nächste Woche', tag: false };
  }
  if (/\b(diese|dieser|aktuelle)n? woche\b/.test(t)) {
    return { von: heute, bis: plusTage(montagVon(heute), 6), label: 'diese Woche', tag: false };
  }
  const inTagen = t.match(/\bin (\d{1,2}) tagen?\b/);
  if (inTagen) {
    const d = plusTage(heute, Number(inTagen[1]));
    return tag(d, `in ${inTagen[1]} Tagen`);
  }
  const datum = t.match(/\b(\d{1,2})\.(\d{1,2})\.(\d{2,4})?/);
  if (datum) {
    const [, tt, mm, jj] = datum;
    let jahr = jj ? Number(jj.length === 2 ? `20${jj}` : jj) : Number(heute.slice(0, 4));
    let d = `${jahr}-${mm.padStart(2, '0')}-${tt.padStart(2, '0')}`;
    // „am 03.01.“ im Dezember meint das nächste Jahr
    if (!jj && d < heute) {
      jahr += 1;
      d = `${jahr}-${mm.padStart(2, '0')}-${tt.padStart(2, '0')}`;
    }
    if (!Number.isNaN(new Date(d + 'T12:00:00').getTime())) return tag(d, `am ${tt.padStart(2, '0')}.${mm.padStart(2, '0')}.`);
  }
  for (let i = 0; i < 7; i++) {
    if (new RegExp(`\\b${WOCHENTAGE[i]}s?\\b`).test(t)) {
      return tag(naechster(i, heute), `${WOCHENTAGE[i][0].toUpperCase()}${WOCHENTAGE[i].slice(1)}`);
    }
  }
  return undefined;
}

/** Alle Tage eines Zeitraums */
export function tageIn(z: { von: Datum; bis: Datum }): Datum[] {
  const tage: Datum[] = [];
  for (let d = z.von; d <= z.bis && tage.length < 62; d = plusTage(d, 1)) tage.push(d);
  return tage;
}

export const istWerktag = (d: Datum) => wochentag(d) >= 1 && wochentag(d) <= 5;

export const wochentagKurz = (d: Datum) => KURZ[wochentag(d)];
