/**
 * Gemeinsame Grundlage der Planprüfungen (Paket planpruefung):
 * Prüfergebnis-Typ und Datenschnappschuss (`Kontext`, auch für reine Tests ohne Datenbank).
 *
 * Verfügbarkeit (Abwesenheiten, Termine, freie Fenster, Arbeitstage, Feiertage …) wird hier NICHT
 * gerechnet, sondern kommt ausschließlich aus `verfuegbarkeit/daten.ts`. `planKontext(ctx)` macht
 * aus dem Schnappschuss den dort erwarteten `PlanKontext`.
 */
import { db } from '@core/db';
import { heute as heuteDatum } from '@core/format';
import { betriebsArbeitstage, betriebsBundesland, STANDARD_ARBEITSTAGE, type Bundesland } from '@core/kalender';
import type {
  Abwesenheit,
  Artikel,
  Auftrag,
  Betrieb,
  Betriebsmittel,
  Datum,
  ID,
  Kunde,
  Leistung,
  Materialbuchung,
  Mitarbeiter,
  Nachweis,
  Ort,
  Qualifikation,
  Termin,
} from '@core/objects';
import type { PlanKontext } from '../verfuegbarkeit/daten';

// ------------------------------------------------------------------ Prüfergebnis

export type Stufe = 'ok' | 'warnung' | 'problem';

/** Ergebnis jeder Prüfung: Stufe, ein Satz Klartext, optional ein konkreter Lösungsvorschlag */
export interface Pruefung {
  ergebnis: Stufe;
  text: string;
  loesung?: string;
}

const RANG: Record<Stufe, number> = { ok: 0, warnung: 1, problem: 2 };

/** schlimmste Stufe einer Liste (leer = ok) */
export function schlimmste(liste: Pruefung[]): Stufe {
  return liste.reduce<Stufe>((s, p) => (RANG[p.ergebnis] > RANG[s] ? p.ergebnis : s), 'ok');
}

/** Für `<Status ton>` */
export function tonFuer(s: Stufe): 'erfolg' | 'aktiv' | 'achtung' {
  return s === 'ok' ? 'erfolg' : s === 'warnung' ? 'aktiv' : 'achtung';
}

export function stufeLabel(s: Stufe): string {
  return s === 'ok' ? 'Passt' : s === 'warnung' ? 'Prüfen' : 'Problem';
}

// ------------------------------------------------------------------ Kontext

/** Schnappschuss aller Daten, die die Prüfungen brauchen */
export interface Kontext {
  heute: Datum;
  betrieb?: Betrieb;
  /** Arbeitstage 1 = Mo … 7 = So (Standard Mo–Fr) */
  arbeitstage?: number[];
  /** für Landesfeiertage (leer = nur bundesweite) */
  bundesland?: Bundesland | null;
  mitarbeiter: Mitarbeiter[];
  qualifikationen: Qualifikation[];
  nachweise: Nachweis[];
  abwesenheiten: Abwesenheit[];
  auftraege: Auftrag[];
  leistungen: Leistung[];
  termine: Termin[];
  orte: Ort[];
  kunden: Kunde[];
  material: Materialbuchung[];
  artikel: Artikel[];
  betriebsmittel: Betriebsmittel[];
}

export function kontextAusDb(): Kontext {
  return {
    heute: heuteDatum(),
    betrieb: db.betrieb.get('betrieb') ?? db.betrieb.all()[0],
    arbeitstage: betriebsArbeitstage(),
    bundesland: betriebsBundesland() ?? null,
    mitarbeiter: db.mitarbeiter.all(),
    qualifikationen: db.qualifikationen.all(),
    nachweise: db.nachweise.all(),
    abwesenheiten: db.abwesenheiten.all(),
    auftraege: db.auftraege.all(),
    leistungen: db.leistungen.all(),
    termine: db.termine.all(),
    orte: db.orte.all(),
    kunden: db.kunden.all(),
    material: db.material.all(),
    artikel: db.artikel.all(),
    betriebsmittel: db.betriebsmittel.all(),
  };
}

/** leerer Kontext – für Tests, mit Überschreibungen */
export function leererKontext(x: Partial<Kontext> = {}): Kontext {
  return {
    heute: heuteDatum(),
    mitarbeiter: [],
    qualifikationen: [],
    nachweise: [],
    abwesenheiten: [],
    auftraege: [],
    leistungen: [],
    termine: [],
    orte: [],
    kunden: [],
    material: [],
    artikel: [],
    betriebsmittel: [],
    ...x,
  };
}

export const finde = <T extends { id: ID }>(liste: T[], id: ID | undefined) => (id ? liste.find((x) => x.id === id) : undefined);

/** Der Schnappschuss als Planungskontext für `verfuegbarkeit` */
export function planKontext(ctx: Kontext): PlanKontext {
  return {
    arbeitsbeginn: ctx.betrieb?.arbeitsbeginn || '07:00',
    arbeitsende: ctx.betrieb?.arbeitsende || '16:00',
    arbeitstage: ctx.arbeitstage ?? STANDARD_ARBEITSTAGE,
    bundesland: ctx.bundesland ?? null,
    mitarbeiter: ctx.mitarbeiter,
    abwesenheiten: ctx.abwesenheiten,
    termine: ctx.termine,
  };
}
