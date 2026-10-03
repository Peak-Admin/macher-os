/**
 * Wer arbeitet gerade, und was darf er?
 * Rechte sind nach Fähigkeiten getrennt (lesen, schreiben, geld, veröffentlichen, löschen, admin).
 * Lotte (KI/Automation) hält sich an dieselben Rechte wie der Mensch, für den es arbeitet.
 */
import { db, setAktuellerNutzer } from './db';
import { betriebsSchluessel } from './betriebe';
import { einstellung, useEinstellung } from './einstellungen';
import type { ID, Mitarbeiter, Rolle } from './objects';

export { RECHTE, ROLLEN, STANDARD_RECHTE, type Recht } from './rechte';
import { STANDARD_RECHTE, type Recht } from './rechte';

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
