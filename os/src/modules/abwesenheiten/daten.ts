/**
 * Urlaub & Krankheit – reine Logik (Urlaubstage, Urlaubskonto, Kollisionen).
 * Feiertage/Arbeitstage: `@core/kalender`; Abwesenheit an einem Tag: `verfuegbarkeit`.
 * Wird auch von Arbeitszeiten (Soll-Stunden) und anderen Team-Modulen genutzt.
 */
import { datumVon } from '@core/format';
import { arbeitstageZwischen } from '@core/kalender';
import type { Abwesenheit, AbwesenheitsArt, Datum, ID, Mitarbeiter, Termin } from '@core/objects';
import { abwesenheitAm as planAbwesenheitAm } from '@modules/verfuegbarkeit/daten';

export const ART_LABEL: Record<AbwesenheitsArt, string> = {
  urlaub: 'Urlaub',
  krank: 'Krank',
  schule: 'Berufsschule',
  schulung: 'Schulung',
  frei: 'Frei / Überstundenabbau',
  sonstiges: 'Sonstiges',
};

export const STATUS_LABEL: Record<Abwesenheit['status'], string> = {
  beantragt: 'Beantragt',
  genehmigt: 'Genehmigt',
  abgelehnt: 'Abgelehnt',
};

// ------------------------------------------------------------------ Arbeitstage

// Feiertage und Arbeitstage kommen aus `@core/kalender` (Einstellungen `plan.arbeitstage`, `plan.bundesland`).

/** Arbeitstage im Zeitraum (inklusive), halbtags = 0,5 je Tag */
export function arbeitstage(von: Datum, bis: Datum, halbtags = false): number {
  if (bis < von) return 0;
  const n = arbeitstageZwischen(von, bis);
  return halbtags ? n / 2 : n;
}

/** Zeitraum auf ein Kalenderjahr zuschneiden */
export function imJahr(a: Pick<Abwesenheit, 'von' | 'bis'>, jahr: number): { von: Datum; bis: Datum } | undefined {
  const von = a.von < `${jahr}-01-01` ? `${jahr}-01-01` : a.von;
  const bis = a.bis > `${jahr}-12-31` ? `${jahr}-12-31` : a.bis;
  return bis < von ? undefined : { von, bis };
}

export function tageImJahr(a: Abwesenheit, jahr: number): number {
  const z = imJahr(a, jahr);
  return z ? arbeitstage(z.von, z.bis, a.halbtags) : 0;
}

// ------------------------------------------------------------------ Urlaubskonto

export interface Urlaubskonto {
  anspruch: number;
  genehmigt: number;
  beantragt: number;
  /** Anspruch minus genehmigt */
  rest: number;
  kranktage: number;
}

export function urlaubskonto(m: Pick<Mitarbeiter, 'id' | 'urlaubstageJahr'>, alle: Abwesenheit[], jahr: number): Urlaubskonto {
  const eigene = alle.filter((a) => a.mitarbeiterId === m.id && !a.geloeschtAm);
  const summe = (f: (a: Abwesenheit) => boolean) => eigene.filter(f).reduce((s, a) => s + tageImJahr(a, jahr), 0);
  const genehmigt = summe((a) => a.art === 'urlaub' && a.status === 'genehmigt');
  const beantragt = summe((a) => a.art === 'urlaub' && a.status === 'beantragt');
  const kranktage = summe((a) => a.art === 'krank' && a.status !== 'abgelehnt');
  return { anspruch: m.urlaubstageJahr, genehmigt, beantragt, rest: m.urlaubstageJahr - genehmigt, kranktage };
}

// ------------------------------------------------------------------ Abwesend? Kollisionen

/** Wirksame (genehmigte) Abwesenheit an einem Tag – Logik aus `verfuegbarkeit` */
export function abwesenheitAm(maId: ID, d: Datum, alle: Abwesenheit[]): Abwesenheit | undefined {
  return planAbwesenheitAm(maId, d, { abwesenheiten: alle }, { nurGenehmigt: true });
}

/** Termine des Mitarbeiters im Zeitraum, die noch nicht erledigt/abgesagt sind */
export function kollisionen(a: Abwesenheit, termine: Termin[]): Termin[] {
  return termine
    .filter((t) => !t.geloeschtAm && t.mitarbeiterIds.includes(a.mitarbeiterId))
    .filter((t) => t.status !== 'abgesagt' && t.status !== 'erledigt')
    .filter((t) => !(a.art === 'schulung' && t.art === 'schulung'))
    .filter((t) => datumVon(t.start) <= a.bis && datumVon(t.ende) >= a.von)
    .sort((x, y) => x.start.localeCompare(y.start));
}

/** Überschneidet sich der neue Zeitraum mit einer bestehenden Abwesenheit? */
export function ueberschneidung(maId: ID, von: Datum, bis: Datum, alle: Abwesenheit[], ohneId?: ID): Abwesenheit | undefined {
  return alle.find((a) => a.id !== ohneId && a.mitarbeiterId === maId && !a.geloeschtAm && a.status !== 'abgelehnt' && a.von <= bis && a.bis >= von);
}

export function zeitraumText(a: Pick<Abwesenheit, 'von' | 'bis' | 'halbtags'>): string {
  const f = (d: Datum) => `${d.slice(8, 10)}.${d.slice(5, 7)}.`;
  const t = a.von === a.bis ? f(a.von) : `${f(a.von)}–${f(a.bis)}`;
  return a.halbtags ? `${t} (halbtags)` : t;
}

export function tageText(n: number) {
  const s = String(n).replace('.', ',');
  return n === 1 ? '1 Arbeitstag' : `${s} Arbeitstage`;
}
