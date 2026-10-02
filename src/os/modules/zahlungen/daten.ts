/**
 * Banktransaktionen (Kontoumsätze) – eigener Objekttyp des Zahlungsabgleichs.
 *
 * Ein Umsatz auf dem Konto ist keine Zahlung: Er kann zu einer, zu mehreren oder zu keiner Rechnung gehören.
 * Erst die Zuordnung erzeugt `zahlungen` (Kernobjekt) mit Verweis `umsatzId`. Der Umsatz selbst wird genau
 * einmal gespeichert (Schlüssel `referenz`), egal ob er aus CSV, CAMT.053 oder der Bankverbindung kommt.
 */
import { defineCollection } from '@core/db';
import type { Basis, Cent, Datum, ID } from '@core/objects';
import type { ZahlungX } from '../rechnungen/typen';

export type UmsatzQuelle = 'csv' | 'camt' | 'bank';

/**
 * - `neu`: noch nicht abgeglichen (z. B. gerade von der Bank gekommen)
 * - `zugeordnet`: Zahlung(en) gebucht (`zahlungIds`)
 * - `vorschlag`: Macher hat eine passende Rechnung, ist sich aber nicht sicher (`vorschlagIds`)
 * - `offen`: keine passende Rechnung gefunden
 * - `ignoriert`: gehört zu keiner Rechnung (Privateinlage, Erstattung …)
 */
export type UmsatzStatus = 'neu' | 'zugeordnet' | 'vorschlag' | 'offen' | 'ignoriert';

export interface Bankumsatz extends Basis {
  /** eindeutig je Konto (Bankreferenz oder Prüfsumme) – verhindert doppelte Importe */
  referenz: string;
  quelle: UmsatzQuelle;
  datum: Datum;
  /** Eingang in Cent (immer > 0) */
  betrag: Cent;
  name?: string;
  iban?: string;
  zweck: string;
  status: UmsatzStatus;
  zahlungIds?: ID[];
  /** vorgeschlagene Rechnungen, beste zuerst */
  vorschlagIds?: ID[];
  /** ein Satz: warum so zugeordnet / warum nicht */
  grund?: string;
  /** von Macher ohne Rückfrage zugeordnet */
  automatisch?: boolean;
  bearbeitetAm?: string;
}

export const bankumsaetze = defineCollection<Bankumsatz>('bankumsaetze');

/** Zahlung mit Verweis auf den Kontoumsatz – `umsatzId` steht inzwischen am Kernobjekt */
export type ZahlungMitUmsatz = ZahlungX;

export const brauchtDich = (u: Bankumsatz) => u.status === 'vorschlag' || u.status === 'offen';
