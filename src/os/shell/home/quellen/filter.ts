/** Auswahlregeln für Inhalte – rein, testbar */
import type { Rolle } from '@core/objects';
import type { Ankuendigung } from '../typen';

/** Für eine Rolle sichtbar und (bei Ankündigungen) noch nicht abgelaufen */
export function fuerRolle<T extends { targetAudience?: Rolle[] }>(liste: T[], rolle: Rolle): T[] {
  return liste.filter((x) => !x.targetAudience?.length || x.targetAudience.includes(rolle));
}

export function aktuelleAnkuendigung(liste: Ankuendigung[], rolle: Rolle, heute: string, weg: string[]): Ankuendigung | null {
  return fuerRolle(liste, rolle).find((a) => !weg.includes(a.id) && (!a.bis || a.bis >= heute)) ?? null;
}
