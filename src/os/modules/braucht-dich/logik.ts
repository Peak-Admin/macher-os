import type { OffenerHinweis } from '@core/macher';
import type { TypTon } from '@core/zeichen';

export type HinweisArt = OffenerHinweis['art'];

export const ART_LABEL: Record<HinweisArt, string> = {
  problem: 'Problem',
  entscheidung: 'Entscheidung',
  freigabe: 'Freigabe',
  info: 'Info',
};

/** Hinweisart als Typ-Kachel: Strich-Icon und Farbton (gelb nur für Probleme) */
export const HINWEISART_ICON: Record<HinweisArt, string> = {
  problem: 'achtung',
  entscheidung: 'auswahl',
  freigabe: 'unterschrift',
  info: 'info',
};

export const HINWEISART_TON: Record<HinweisArt, TypTon> = {
  problem: 'gelb',
  entscheidung: 'blau',
  freigabe: 'sand',
  info: 'neutral',
};

/** Hinweise nach Art gruppieren (Reihenfolge innerhalb bleibt nach Gewicht) */
export function nachArt(liste: OffenerHinweis[]): Record<HinweisArt, OffenerHinweis[]> {
  const g: Record<HinweisArt, OffenerHinweis[]> = { problem: [], entscheidung: [], freigabe: [], info: [] };
  for (const h of liste) g[h.art].push(h);
  return g;
}

/**
 * Nur Aktionen zeigen, die gerade ein Modul ausführen kann – sonst entsteht ein toter Knopf.
 * Primäre Aktion zuerst.
 */
export function sichtbareAktionen(h: OffenerHinweis, vorhanden: (id: string) => boolean) {
  return (h.aktionen ?? []).filter((a) => vorhanden(a.aktion)).sort((a, b) => Number(!!b.primaer) - Number(!!a.primaer));
}
