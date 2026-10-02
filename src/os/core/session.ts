/**
 * Wer arbeitet gerade, und was darf er?
 * Rechte sind nach Fähigkeiten getrennt (lesen, schreiben, geld, veröffentlichen, löschen, admin).
 * Macher (KI/Automation) hält sich an dieselben Rechte wie der Mensch, für den es arbeitet.
 */
import { db, setAktuellerNutzer } from './db';
import { betriebsSchluessel } from './betriebe';
import { einstellung, useEinstellung } from './einstellungen';
import type { ID, Mitarbeiter, Rolle } from './objects';

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

export function rechteMatrix(): Record<Rolle, Recht[]> {
  return einstellung('rollen.rechte', STANDARD_RECHTE);
}

/** je Betrieb: Mitarbeiter-IDs gibt es nur im eigenen Betrieb */
const ICH_KEY = betriebsSchluessel('macher-os:ich');

export function ichId(): ID | undefined {
  try {
    return globalThis.localStorage?.getItem(ICH_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

export function setzeIch(id: ID) {
  try {
    globalThis.localStorage?.setItem(ICH_KEY, id);
  } catch {
    /* egal */
  }
  setAktuellerNutzer(id);
  // Neu rendern erzwingen
  db.mitarbeiter.update(id, {}, { leise: true });
}

export function ich(): Mitarbeiter | undefined {
  const id = ichId();
  return (id && db.mitarbeiter.get(id)) || db.mitarbeiter.all().find((m) => m.rolle === 'chef');
}

export function useIch(): Mitarbeiter | undefined {
  const alle = db.mitarbeiter.use();
  const id = ichId();
  return alle.find((m) => m.id === id) ?? alle.find((m) => m.rolle === 'chef') ?? alle[0];
}

export function darf(recht: Recht, m: Mitarbeiter | undefined = ich()): boolean {
  if (!m) return true; // vor dem Onboarding
  return rechteMatrix()[m.rolle]?.includes(recht) ?? false;
}

export function useDarf(recht: Recht): boolean {
  const m = useIch();
  const [matrix] = useEinstellung('rollen.rechte', STANDARD_RECHTE);
  if (!m) return true;
  return matrix[m.rolle]?.includes(recht) ?? false;
}

/** Büro/Chef sehen alles, Monteure vor allem ihre eigene Arbeit */
export function istBuero(m: Mitarbeiter | undefined = ich()) {
  return !m || m.rolle === 'chef' || m.rolle === 'buero';
}
