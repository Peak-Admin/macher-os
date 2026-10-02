/**
 * Erweiterungen der Kernobjekte Rechnung und Zahlung, die das Paket „geld“ braucht.
 * Die Felder werden direkt am Kernobjekt gespeichert (eine Quelle, keine Kopie).
 * Kernwunsch: diese Felder in `objects.ts` aufnehmen.
 */
import { db } from '@core/db';
import type { Cent, Datum, ID, Rechnung, Zahlung, Beleg } from '@core/objects';

export type RechnungX = Rechnung & {
  /** diese Rechnung ist die Stornorechnung zu … */
  stornoFuerId?: ID;
  /** diese Rechnung wurde storniert durch … */
  stornoDurchId?: ID;
  /** Steuerschuldnerschaft des Leistungsempfängers (§ 13b UStG) */
  reverseCharge?: boolean;
  angebotId?: ID;
  /** Materialbuchungen, die in dieser Rechnung stehen */
  materialIds?: ID[];
  /** Zeiteinträge, die in dieser Rechnung stehen */
  zeitIds?: ID[];
  /** Zusatzleistungen (Sammlung des Pakets doku), die in dieser Rechnung stehen */
  zusatzleistungIds?: ID[];
  leistungVon?: Datum;
  leistungBis?: Datum;
  /** von Macher automatisch vorbereitet */
  vonMacher?: boolean;
  abschlagProzent?: number;
  /** freier Text unter den Positionen */
  bemerkung?: string;
};

export type ZahlungX = Zahlung & {
  /** abgezogenes Skonto (zählt als beglichen) */
  skonto?: Cent;
  quelle?: 'manuell' | 'kontoauszug';
  /** Name des Zahlers laut Kontoauszug */
  zahler?: string;
};

export type BelegX = Beleg & {
  skontoBis?: Datum;
  skontoProzent?: number;
  /** vorgeschlagener oder automatisch zugeordneter Auftrag – Grund */
  zuordnungGrund?: string;
};

export const rechnungX = (id: ID | undefined) => db.rechnungen.get(id) as RechnungX | undefined;
export const alleRechnungen = () => db.rechnungen.all() as RechnungX[];

export function rechnungAendern(id: ID, patch: Partial<RechnungX>, opts?: { leise?: boolean; text?: string }) {
  return db.rechnungen.update(id, patch as Partial<Rechnung>, opts) as RechnungX | undefined;
}

export function belegAendern(id: ID, patch: Partial<BelegX>, opts?: { leise?: boolean; text?: string }) {
  return db.belege.update(id, patch as Partial<Beleg>, opts) as BelegX | undefined;
}
