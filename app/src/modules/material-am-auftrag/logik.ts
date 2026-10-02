/** Reine Regeln für Material am Auftrag: Status, Summen, Übergabe an die Rechnung. */
import type { Artikel, Cent, ID, Materialbuchung, Position } from '@core/objects';

export type MaterialStatus = Materialbuchung['status'];

export const STATUS_REIHE: MaterialStatus[] = ['geplant', 'bestellt', 'bereit', 'verbraucht'];
export const STATUS_LABEL: Record<MaterialStatus, string> = { geplant: 'Geplant', bestellt: 'Bestellt', bereit: 'Bereit', verbraucht: 'Verbraucht' };
/** Beschriftung für den Knopf, der den nächsten Status setzt */
export const WEITER_LABEL: Partial<Record<MaterialStatus, string>> = { geplant: 'Ist bestellt', bestellt: 'Ist da', bereit: 'Ist verbaut' };

export function naechsterStatus(s: MaterialStatus): MaterialStatus | undefined {
  const i = STATUS_REIHE.indexOf(s);
  return i >= 0 && i < STATUS_REIHE.length - 1 ? STATUS_REIHE[i + 1] : undefined;
}

export const wert = (b: Pick<Materialbuchung, 'menge' | 'ek'>): Cent => Math.round(b.menge * b.ek);

export function summeEk(liste: Pick<Materialbuchung, 'menge' | 'ek' | 'status'>[], status?: MaterialStatus): Cent {
  return liste.filter((b) => !status || b.status === status).reduce((s, b) => s + wert(b), 0);
}

/** verbraucht, aber noch in keiner Rechnung */
export const offenFuerRechnung = (b: Pick<Materialbuchung, 'status' | 'abgerechnetIn'>) => b.status === 'verbraucht' && !b.abgerechnetIn;

/**
 * Verbrauchtes, noch nicht abgerechnetes Material als Rechnungspositionen.
 * VK aus dem Artikel; ohne Artikel EK + Aufschlag (Prozent).
 */
export function alsPositionen(liste: Materialbuchung[], artikel: (id: ID | undefined) => Artikel | undefined, aufschlagProzent = 20): Position[] {
  return liste.filter(offenFuerRechnung).map((b) => {
    const a = artikel(b.artikelId);
    return {
      id: `mat_${b.id}`,
      art: 'material',
      text: b.text,
      menge: b.menge,
      einheit: b.einheit,
      einzelpreis: a?.vk ?? Math.round(b.ek * (1 + aufschlagProzent / 100)),
      artikelId: b.artikelId,
    };
  });
}

/** Welche Buchungen gehören zu den Positionen einer Rechnung? (gleicher Artikel oder gleicher Text) */
export function inRechnung(liste: Materialbuchung[], positionen: Pick<Position, 'artikelId' | 'text' | 'id'>[]): Materialbuchung[] {
  const ids = new Set(positionen.map((p) => p.id));
  const artikel = new Set(positionen.map((p) => p.artikelId).filter(Boolean));
  const texte = new Set(positionen.map((p) => p.text.trim().toLowerCase()));
  return liste.filter(offenFuerRechnung).filter((b) => ids.has(`mat_${b.id}`) || (b.artikelId && artikel.has(b.artikelId)) || texte.has(b.text.trim().toLowerCase()));
}

