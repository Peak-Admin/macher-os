/**
 * Reihenfolge der Mitarbeiter auf der Plantafel. Der Chef ordnet sein Team so, wie er denkt
 * (Kolonnen zusammen, Azubi unter dem Gesellen). Gilt für den ganzen Betrieb, nicht nur für ein Gerät.
 * Kernwunsch: Feld `planReihe` am Mitarbeiter – bis dahin ein einziger Eintrag in der eigenen Sammlung.
 */
import { auditAusnehmen, defineCollection } from '@core/db';
import type { Basis, ID, Mitarbeiter, Rolle } from '@core/objects';

export interface PlanReihe extends Basis {
  mitarbeiterIds: ID[];
}

export const planReihen = defineCollection<PlanReihe>('planReihen');
auditAusnehmen('planReihen');

const SCHLUESSEL = 'plantafel';
const ROLLEN_REIHE: Record<Rolle, number> = { chef: 1, monteur: 0, azubi: 2, buero: 3 };

/** Standard ohne eigene Reihenfolge: Monteure zuerst, dann Chef, Azubis, Büro – je alphabetisch */
export function standardSortiert(liste: Mitarbeiter[]): Mitarbeiter[] {
  return [...liste].sort((a, b) => ROLLEN_REIHE[a.rolle] - ROLLEN_REIHE[b.rolle] || a.vorname.localeCompare(b.vorname, 'de'));
}

/** Gespeicherte Reihenfolge anwenden; Neue (noch nicht einsortiert) kommen in Standardreihenfolge ans Ende */
export function geordnet(liste: Mitarbeiter[], reihe: ID[] | undefined): Mitarbeiter[] {
  const basis = standardSortiert(liste);
  if (!reihe?.length) return basis;
  const pos = new Map(reihe.map((id, i) => [id, i]));
  return basis
    .map((m, i) => ({ m, i }))
    .sort((a, b) => (pos.get(a.m.id) ?? reihe.length + a.i) - (pos.get(b.m.id) ?? reihe.length + b.i))
    .map((x) => x.m);
}

/** Eintrag `id` an die Stelle `nach` verschieben (Index in der Liste nach dem Herausnehmen) */
export function verschoben(ids: ID[], id: ID, nach: number): ID[] {
  const ohne = ids.filter((x) => x !== id);
  if (ohne.length === ids.length) return ids;
  const ziel = Math.max(0, Math.min(nach, ohne.length));
  return [...ohne.slice(0, ziel), id, ...ohne.slice(ziel)];
}

export function gespeicherteReihe(): ID[] | undefined {
  return planReihen.get(SCHLUESSEL)?.mitarbeiterIds;
}

export function reiheSpeichern(ids: ID[]) {
  if (planReihen.get(SCHLUESSEL)) planReihen.update(SCHLUESSEL, { mitarbeiterIds: ids }, { leise: true });
  else planReihen.create({ id: SCHLUESSEL, mitarbeiterIds: ids }, { leise: true });
}

/** Zurück zur Standardreihenfolge */
export function reiheZuruecksetzen() {
  if (planReihen.get(SCHLUESSEL)) planReihen.purge(SCHLUESSEL);
}
