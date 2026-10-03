/**
 * Rechte je Rolle – rein, ohne Datenzugriff. Gilt in der App (`session.ts`) und auf dem Server
 * (Partner-Schnittstelle): KI und Partner haben nie mehr Rechte als der Mensch, für den sie handeln.
 */
import type { Rolle } from './objects';

export type Recht =
  | 'lesen'
  | 'schreiben'
  /** Preise, Kosten, Rechnungen, Ertrag sehen und ändern */
  | 'geld'
  /** an Kunden senden (Angebot, Rechnung, Nachricht) */
  | 'veroeffentlichen'
  | 'loeschen'
  /** Einstellungen, Rollen, Schnittstellen */
  | 'admin'
  /** Planung anderer Mitarbeiter ändern */
  | 'planen'
  /** Team-Daten (Lohn, Abwesenheiten anderer) */
  | 'personal';

export const RECHTE: { id: Recht; label: string }[] = [
  { id: 'lesen', label: 'Ansehen' },
  { id: 'schreiben', label: 'Bearbeiten' },
  { id: 'planen', label: 'Einsätze planen' },
  { id: 'geld', label: 'Preise & Geld' },
  { id: 'veroeffentlichen', label: 'An Kunden senden' },
  { id: 'personal', label: 'Personaldaten' },
  { id: 'loeschen', label: 'Löschen' },
  { id: 'admin', label: 'Einstellungen' },
];

export const ROLLEN: { id: Rolle; label: string }[] = [
  { id: 'chef', label: 'Chef' },
  { id: 'buero', label: 'Büro' },
  { id: 'monteur', label: 'Monteur / Geselle' },
  { id: 'azubi', label: 'Azubi' },
];

export const STANDARD_RECHTE: Record<Rolle, Recht[]> = {
  chef: ['lesen', 'schreiben', 'planen', 'geld', 'veroeffentlichen', 'personal', 'loeschen', 'admin'],
  buero: ['lesen', 'schreiben', 'planen', 'geld', 'veroeffentlichen', 'loeschen'],
  monteur: ['lesen', 'schreiben'],
  azubi: ['lesen', 'schreiben'],
};

/** Darf eine Rolle das? `matrix` ist die Einstellung `rollen.rechte` des Betriebs (fehlt sie: Standard). */
export function rolleDarf(rolle: Rolle, recht: Recht, matrix: Partial<Record<Rolle, Recht[]>> = STANDARD_RECHTE): boolean {
  return matrix[rolle]?.includes(recht) ?? false;
}
