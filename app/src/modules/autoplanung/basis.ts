/**
 * Gemeinsame Grundlage der Planprüfungen (Paket planpruefung):
 * Prüfergebnis-Typ, Datenschnappschuss (`Kontext`), Zeit-Helfer und eine
 * MINIMALE Verfügbarkeit (Arbeitszeit, Abwesenheiten, belegte Termine).
 *
 * Kernwunsch: Paket plan baut parallel das Modul `verfuegbarkeit`. Sobald es da ist,
 * sollen `istAbwesend`, `belegteZeiten` und `freieFenster` dorthin umziehen bzw. dessen
 * Funktionen nutzen. Bis dahin bewusst klein und ohne Import aus `verfuegbarkeit`.
 *
 * Alle Prüfungen sind reine Funktionen auf einem `Kontext` – testbar ohne Datenbank.
 */
import { db } from '@core/db';
import { heute as heuteDatum, isoDatum, plusTage } from '@core/format';
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

// ------------------------------------------------------------------ Zeit

/** Minuten seit Mitternacht (lokale Zeit) eines ISO-Zeitpunkts */
export function minutenVon(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

/** "07:30" → 450 */
export function minutenAus(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** 450 → "07:30" */
export function hhmm(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Datum eines Termins (lokal) */
export function terminDatum(t: Pick<Termin, 'start'>): Datum {
  return isoDatum(new Date(t.start));
}

/** Termin zählt für die Planung (nicht abgesagt, nicht gelöscht) */
export const aktiverTermin = (t: Termin) => t.status !== 'abgesagt' && !t.geloeschtAm;

/** überlappen sich zwei Termine zeitlich? */
export function ueberlappen(a: Pick<Termin, 'start' | 'ende'>, b: Pick<Termin, 'start' | 'ende'>): boolean {
  return new Date(a.start).getTime() < new Date(b.ende).getTime() && new Date(b.start).getTime() < new Date(a.ende).getTime();
}

/** Mo–Fr */
export function istArbeitstag(d: Datum): boolean {
  const w = new Date(d + 'T12:00:00').getDay();
  return w >= 1 && w <= 5;
}

/** die nächsten n Arbeitstage ab (inkl.) `ab` */
export function arbeitstage(ab: Datum, n: number): Datum[] {
  const r: Datum[] = [];
  let d = ab;
  for (let i = 0; r.length < n && i < n * 3 + 7; i++) {
    if (istArbeitstag(d)) r.push(d);
    d = plusTage(d, 1);
  }
  return r;
}

export function arbeitszeit(ctx: Kontext): { beginn: number; ende: number } {
  return {
    beginn: minutenAus(ctx.betrieb?.arbeitsbeginn || '07:00'),
    ende: minutenAus(ctx.betrieb?.arbeitsende || '16:00'),
  };
}

// ------------------------------------------------------------------ Verfügbarkeit (minimal)

/** Abwesend an diesem Tag? Beantragter Urlaub zählt für die Planung schon mit – sicher ist sicher. */
export function abwesenheitAm(ctx: Kontext, mitarbeiterId: ID, d: Datum): Abwesenheit | undefined {
  return ctx.abwesenheiten.find(
    (a) => a.mitarbeiterId === mitarbeiterId && a.status !== 'abgelehnt' && a.von <= d && a.bis >= d && !a.geloeschtAm,
  );
}

/** Termine eines Mitarbeiters an einem Tag, nach Beginn sortiert */
export function termineAm(ctx: Kontext, mitarbeiterId: ID, d: Datum): Termin[] {
  return ctx.termine
    .filter((t) => aktiverTermin(t) && t.mitarbeiterIds.includes(mitarbeiterId) && terminDatum(t) === d)
    .sort((a, b) => a.start.localeCompare(b.start));
}

export interface Fenster {
  von: number;
  bis: number;
}

/** Freie Zeitfenster (Minuten) eines Mitarbeiters an einem Tag innerhalb der Arbeitszeit */
export function freieFenster(ctx: Kontext, mitarbeiterId: ID, d: Datum): Fenster[] {
  const az = arbeitszeit(ctx);
  const abw = abwesenheitAm(ctx, mitarbeiterId, d);
  if (abw && !abw.halbtags) return [];
  let frei: Fenster[] = [{ von: az.beginn, bis: abw?.halbtags ? Math.round((az.beginn + az.ende) / 2) : az.ende }];
  for (const t of termineAm(ctx, mitarbeiterId, d)) {
    if (t.ganztags) return [];
    const s = minutenVon(t.start);
    const e = minutenVon(t.ende);
    frei = frei.flatMap((f) => {
      if (e <= f.von || s >= f.bis) return [f];
      const r: Fenster[] = [];
      if (s > f.von) r.push({ von: f.von, bis: s });
      if (e < f.bis) r.push({ von: e, bis: f.bis });
      return r;
    });
  }
  return frei.filter((f) => f.bis - f.von > 0);
}

/** Ist der Mitarbeiter in diesem Zeitraum frei (keine Abwesenheit, kein anderer Termin)? */
export function istVerfuegbar(ctx: Kontext, mitarbeiterId: ID, start: string, ende: string, ausserTerminId?: ID): boolean {
  const d = isoDatum(new Date(start));
  const abw = abwesenheitAm(ctx, mitarbeiterId, d);
  if (abw && !abw.halbtags) return false;
  return !ctx.termine.some(
    (t) => t.id !== ausserTerminId && aktiverTermin(t) && t.mitarbeiterIds.includes(mitarbeiterId) && ueberlappen(t, { start, ende }),
  );
}

/** verplante Stunden eines Mitarbeiters in den Tagen `tage` */
export function verplanteStunden(ctx: Kontext, mitarbeiterId: ID, tage: Datum[]): number {
  const set = new Set(tage);
  return ctx.termine
    .filter((t) => aktiverTermin(t) && t.mitarbeiterIds.includes(mitarbeiterId) && set.has(terminDatum(t)))
    .reduce((s, t) => s + (new Date(t.ende).getTime() - new Date(t.start).getTime()) / 3_600_000, 0);
}

/** Wer kann überhaupt ausführend eingeplant werden? (kein Büro, aktiv, nicht ausgetreten) */
export function planbareMitarbeiter(ctx: Kontext): Mitarbeiter[] {
  return ctx.mitarbeiter.filter(
    (m) => m.aktiv && m.rolle !== 'buero' && (!m.austritt || m.austritt >= ctx.heute) && !m.geloeschtAm,
  );
}
