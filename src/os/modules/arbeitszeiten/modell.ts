/**
 * Arbeitszeitmodell und Stundenbuchungen – die Grundlage für Soll-Zeit und Stundenkonto.
 *
 * - `arbeitsmodelle`: Soll-Minuten je Wochentag ab einem Datum (Teilzeit, kurzer Freitag, Samstag …).
 *   Jede Änderung ist eine neue Version mit `gueltigAb` – vergangene Wochen rechnen weiter mit dem alten Modell.
 *   Ohne Modell gilt: Wochenstunden des Mitarbeiters gleichmäßig auf die Arbeitstage des Betriebs verteilt.
 * - `stundenbuchungen`: Startsaldo aus dem alten System, ausgezahlte Überstunden, Korrekturen – immer mit Grund.
 *
 * Die Wochenstunden am Mitarbeiter bleiben die Summe des aktuellen Modells (Planung und Auslastung lesen sie).
 */
import { db, defineCollection } from '@core/db';
import { heute, wochenStart, wochentag } from '@core/format';
import { betriebsArbeitstage } from '@core/kalender';
import type { Basis, Datum, ID, Mitarbeiter } from '@core/objects';

export interface Arbeitsmodell extends Basis {
  mitarbeiterId: ID;
  /** gilt ab diesem Tag (bis zum nächsten Modell) */
  gueltigAb: Datum;
  /** Soll-Minuten je Wochentag, Index 0 = Montag … 6 = Sonntag */
  minuten: number[];
  notiz?: string;
}

export type BuchungsArt = 'startsaldo' | 'auszahlung' | 'korrektur';

export interface Stundenbuchung extends Basis {
  mitarbeiterId: ID;
  datum: Datum;
  /** + Gutschrift aufs Konto, − Abzug (z. B. ausgezahlte Überstunden) */
  minuten: number;
  art: BuchungsArt;
  /** Pflicht: warum gebucht wurde (nachvollziehbar) */
  grund: string;
}

export const arbeitsmodelle = defineCollection<Arbeitsmodell>('arbeitsmodelle');
export const stundenbuchungen = defineCollection<Stundenbuchung>('stundenbuchungen');

export const BUCHUNG_LABEL: Record<BuchungsArt, string> = {
  startsaldo: 'Übertrag aus altem System',
  auszahlung: 'Überstunden ausgezahlt',
  korrektur: 'Korrektur',
};

export const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

/** Wochenstunden gleichmäßig auf die Arbeitstage verteilt (1 = Mo … 7 = So) */
export function standardMinuten(wochenstunden: number, arbeitstage: number[] = betriebsArbeitstage()): number[] {
  const tage = arbeitstage.length ? arbeitstage : [1, 2, 3, 4, 5];
  const jeTag = Math.round((wochenstunden * 60) / tage.length);
  return [1, 2, 3, 4, 5, 6, 7].map((t) => (tage.includes(t) ? jeTag : 0));
}

export const wochenSumme = (minuten: number[]) => minuten.reduce((s, x) => s + (x || 0), 0);

/** Das am Tag gültige Modell (neuestes mit `gueltigAb` ≤ Tag) oder `undefined` */
export function modellAm(maId: ID, d: Datum, modelle: Arbeitsmodell[]): Arbeitsmodell | undefined {
  let treffer: Arbeitsmodell | undefined;
  for (const x of modelle) {
    if (x.mitarbeiterId !== maId || x.geloeschtAm || x.gueltigAb > d) continue;
    if (!treffer || x.gueltigAb > treffer.gueltigAb || (x.gueltigAb === treffer.gueltigAb && x.erstelltAm > treffer.erstelltAm)) treffer = x;
  }
  return treffer;
}

/** Soll-Minuten je Wochentag am Tag `d` (Modell oder Standard aus Wochenstunden) */
export function minutenAm(m: Pick<Mitarbeiter, 'id' | 'wochenstunden'>, d: Datum, modelle: Arbeitsmodell[], arbeitstage = betriebsArbeitstage()): number[] {
  return modellAm(m.id, d, modelle)?.minuten ?? standardMinuten(m.wochenstunden, arbeitstage);
}

/** Planmäßige Soll-Minuten an einem Wochentag laut Modell – ohne Feiertage und Abwesenheiten */
export function modellSollAm(m: Pick<Mitarbeiter, 'id' | 'wochenstunden'>, d: Datum, modelle: Arbeitsmodell[], arbeitstage = betriebsArbeitstage()): number {
  return minutenAm(m, d, modelle, arbeitstage)[wochentag(d) - 1] ?? 0;
}

/** „Mo–Fr je 8 h“, „Mo–Do 8 h, Fr 6 h“ … */
export function modellText(minuten: number[]): string {
  const h = (n: number) => `${String(Math.round((n / 60) * 100) / 100).replace('.', ',')} h`;
  const gruppen: { von: number; bis: number; min: number }[] = [];
  minuten.forEach((min, i) => {
    if (!min) return;
    const letzte = gruppen[gruppen.length - 1];
    if (letzte && letzte.bis === i - 1 && letzte.min === min) letzte.bis = i;
    else gruppen.push({ von: i, bis: i, min });
  });
  if (!gruppen.length) return 'Keine Soll-Zeit';
  const teile = gruppen.map((g) => `${g.von === g.bis ? WOCHENTAGE[g.von] : `${WOCHENTAGE[g.von]}–${WOCHENTAGE[g.bis]}`} ${g.von === g.bis ? '' : 'je '}${h(g.min)}`);
  return teile.join(', ');
}

/**
 * Neues Modell ab `ab` speichern und die Wochenstunden am Mitarbeiter angleichen.
 * Gibt es noch kein Modell, wird das bisherige (Wochenstunden gleichmäßig verteilt) als erste Version
 * gesichert – so rechnen vergangene Wochen weiter mit der alten Soll-Zeit.
 */
export function modellSpeichern(maId: ID, minuten: number[], ab: Datum = wochenStart(heute()), notiz?: string): Arbeitsmodell | undefined {
  const m = db.mitarbeiter.get(maId);
  if (!m) return undefined;
  const sauber = Array.from({ length: 7 }, (_, i) => Math.max(0, Math.round(minuten[i] || 0)));
  const vorhanden = arbeitsmodelle.where((x) => x.mitarbeiterId === maId);
  if (!vorhanden.length) bisherSichern(m, m.wochenstunden, ab);
  // gleiche Version am selben Tag ersetzen statt stapeln
  for (const x of vorhanden.filter((x) => x.gueltigAb === ab)) arbeitsmodelle.remove(x.id);
  const neu = arbeitsmodelle.create({ mitarbeiterId: maId, gueltigAb: ab, minuten: sauber, notiz });
  const std = Math.round((wochenSumme(sauber) / 60) * 100) / 100;
  if (std !== m.wochenstunden) db.mitarbeiter.update(maId, { wochenstunden: std }, { text: `Arbeitszeitmodell ab ${ab}: ${modellText(sauber)}` });
  return neu;
}

/**
 * Wochenstunden wurden im Mitarbeiterformular geändert: Gibt es ein Modell, wird die Verteilung
 * auf die Wochentage beibehalten und auf die neue Summe umgerechnet (neue Version ab dieser Woche).
 */
export function wochenstundenGeaendert(maId: ID, alt: number, neu: number, ab: Datum = wochenStart(heute())): Arbeitsmodell | undefined {
  if (alt === neu) return undefined;
  const m = db.mitarbeiter.get(maId);
  if (!m) return undefined;
  const modelle = arbeitsmodelle.all();
  const aktuell = modellAm(maId, ab, modelle);
  const basis = aktuell?.minuten ?? standardMinuten(alt);
  const summe = wochenSumme(basis);
  const minuten = summe ? basis.map((x) => Math.round(((x / summe) * neu * 60) / 5) * 5) : standardMinuten(neu);
  // Rundungsrest auf den ersten Arbeitstag, damit die Summe stimmt
  const rest = Math.round(neu * 60) - wochenSumme(minuten);
  const erster = minuten.findIndex((x) => x > 0);
  if (rest && erster >= 0) minuten[erster] += rest;
  // ohne Modell: alte Wochenstunden sichern, damit die Vergangenheit stimmt
  if (!modelle.some((x) => x.mitarbeiterId === maId)) bisherSichern(m, alt, ab);
  for (const x of arbeitsmodelle.where((x) => x.mitarbeiterId === maId && x.gueltigAb === ab)) arbeitsmodelle.remove(x.id);
  return arbeitsmodelle.create({ mitarbeiterId: maId, gueltigAb: ab, minuten, notiz: `Wochenstunden ${alt} → ${neu}` });
}

/** Bisherige Soll-Zeit (Wochenstunden gleichmäßig verteilt) als erste Version sichern */
function bisherSichern(m: Mitarbeiter, wochenstunden: number, ab: Datum) {
  const start = m.eintritt ?? '2000-01-01';
  if (start < ab) arbeitsmodelle.create({ mitarbeiterId: m.id, gueltigAb: start, minuten: standardMinuten(wochenstunden), notiz: 'Bisherige Wochenstunden' });
}

/** Stunden aufs Konto buchen (Übertrag, Auszahlung, Korrektur) – Grund ist Pflicht */
export function stundenBuchen(b: Omit<Stundenbuchung, keyof Basis>): Stundenbuchung {
  if (!b.grund.trim()) throw new Error('Grund fehlt');
  if (!Number.isFinite(b.minuten) || b.minuten === 0) throw new Error('Stunden fehlen');
  return stundenbuchungen.create({ ...b, grund: b.grund.trim(), minuten: Math.round(b.minuten) });
}
