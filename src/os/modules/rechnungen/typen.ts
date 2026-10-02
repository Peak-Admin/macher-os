/**
 * Typen des Pakets „geld“. Rechnung und Zahlung tragen alle Felder direkt im Kern (`objects.ts`);
 * nur der Beleg hat noch Erweiterungen (Skonto, Zuordnungsgrund).
 */
import { db } from '@core/db';
import type { Datum, ID, Rechnung, Zahlung, Beleg } from '@core/objects';

/** Die Felder stehen inzwischen direkt am Kernobjekt (`objects.ts`) – die Namen bleiben als Kurzform. */
export type RechnungX = Rechnung;
export type ZahlungX = Zahlung;

export type BelegX = Beleg & {
  skontoBis?: Datum;
  skontoProzent?: number;
  /** vorgeschlagener oder automatisch zugeordneter Auftrag – Grund */
  zuordnungGrund?: string;
};

export const rechnungX = (id: ID | undefined) => db.rechnungen.get(id);
export const alleRechnungen = () => db.rechnungen.all();

export function rechnungAendern(id: ID, patch: Partial<RechnungX>, opts?: { leise?: boolean; text?: string }) {
  return db.rechnungen.update(id, patch, opts);
}

export function belegAendern(id: ID, patch: Partial<BelegX>, opts?: { leise?: boolean; text?: string }) {
  return db.belege.update(id, patch as Partial<Beleg>, opts) as BelegX | undefined;
}
