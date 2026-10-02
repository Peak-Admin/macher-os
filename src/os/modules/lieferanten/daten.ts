/**
 * Lieferanten (Kernobjekt `db.lieferanten`).
 * Ansprechpartner kennt der Kern beim Lieferanten noch nicht – sie werden am selben Objekt
 * gespeichert (Kernwunsch: `Lieferant.ansprechpartner: Ansprechpartner[]`).
 */
import { db } from '@core/db';
import type { Ansprechpartner, ID, Lieferant } from '@core/objects';

export type LieferantX = Lieferant & { ansprechpartner?: Ansprechpartner[] };

export const lx = (l: Lieferant) => l as LieferantX;

export function hauptAnsprechpartner(l: Lieferant): Ansprechpartner | undefined {
  return lx(l).ansprechpartner?.[0];
}

export function artikelVon(lieferantId: ID) {
  return db.artikel.where((a) => a.lieferantId === lieferantId);
}

export function lieferzeitText(l: Lieferant): string {
  if (l.lieferzeitTage == null) return 'Lieferzeit offen';
  if (l.lieferzeitTage === 0) return 'Lieferung am selben Tag';
  return l.lieferzeitTage === 1 ? 'Lieferzeit 1 Tag' : `Lieferzeit ${l.lieferzeitTage} Tage`;
}
