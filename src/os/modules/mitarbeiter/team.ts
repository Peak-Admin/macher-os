/** Gemeinsame Helfer der Team-Module (Mitarbeiter, Zeiten, Abwesenheiten …). */
import { db } from '@core/db';
import { heute as heuteDatum } from '@core/format';
import type { ID, Mitarbeiter, Rolle } from '@core/objects';
import { ROLLEN, darf, ich, istBuero } from '@core/session';
import type { IconName } from '@ui/index';

export const ROLLE_LABEL = Object.fromEntries(ROLLEN.map((r) => [r.id, r.label])) as Record<Rolle, string>;

/** Strich-Icon je Rolle (Umschalter Rolle) */
export const ROLLEN_ICON: Record<Rolle, IconName> = { chef: 'stern', buero: 'notiz', monteur: 'werkzeug', azubi: 'wissen' };

/** Kennfarben aus der Markenpalette */
export const FARBEN = ['#2F9250', '#1F6135', '#69AF44', '#06480C', '#767676', '#374040'];

export function naechsteFarbe(): string {
  const genutzt = db.mitarbeiter.all().map((m) => m.farbe);
  return FARBEN.find((f) => !genutzt.includes(f)) ?? FARBEN[db.mitarbeiter.all().length % FARBEN.length];
}

/** Darf der aktuelle Nutzer die Team-Daten von Mitarbeiter X sehen (Zeiten, Abwesenheiten …)? */
export function darfTeamDaten(maId: ID): boolean {
  return istBuero() || darf('personal') || ich()?.id === maId;
}

/** Ist der Mitarbeiter (noch) beschäftigt? */
export function istAktiv(m: Mitarbeiter, heute = heuteDatum()): boolean {
  return m.aktiv && !m.geloeschtAm && (!m.austritt || m.austritt >= heute);
}

export function sortiert(liste: Mitarbeiter[]): Mitarbeiter[] {
  const reihe: Rolle[] = ['chef', 'buero', 'monteur', 'azubi'];
  return [...liste].sort((a, b) => reihe.indexOf(a.rolle) - reihe.indexOf(b.rolle) || a.vorname.localeCompare(b.vorname, 'de'));
}
