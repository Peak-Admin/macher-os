/**
 * Arbeitszeiten – reine Logik: Dauer, Stempeln, Pausen, ArbZG-Prüfung und automatischer Pausenabzug,
 * Zeitarten, Soll/Ist (Arbeitszeitmodell, Feiertage, Abwesenheiten), Stundenkonto, CSV.
 * Zeiteinträge sind Kernobjekte (`db.zeiten`). Eine laufende Pause wird – weil der Kern
 * dafür kein Feld hat – als Einstellung `zeiten.pause.<id>` gemerkt (Kernwunsch: `pauseSeit`).
 */
import { db } from '@core/db';
import { einstellung, setzeEinstellung } from '@core/einstellungen';
import { heute as heuteDatum, plusTage, datum as datumFmt, minutenAus, minutenVon, uhrAus, wochentag } from '@core/format';
import { betriebsArbeitstage, betriebsBundesland, istFeiertag } from '@core/kalender';
import type { Abwesenheit, Datum, ID, Mitarbeiter, Zeiteintrag } from '@core/objects';
import { abwesenheitAm } from '@modules/abwesenheiten/daten';
import { arbeitsmodelle, modellAm, stundenbuchungen, type Arbeitsmodell, type Stundenbuchung } from './modell';

export const ART_LABEL: Record<Zeiteintrag['art'], string> = {
  arbeit: 'Arbeit',
  fahrt: 'Fahrt',
  werkstatt: 'Werkstatt',
  buero: 'Büro',
};

// ------------------------------------------------------------------ Uhrzeiten

export function jetztUhr(d = new Date()): string {
  return uhrAus(minutenVon(d));
}

/** 8,25 h */
export function stunden(min: number): string {
  const v = Math.round((min / 60) * 100) / 100;
  return `${String(v).replace('.', ',')} h`;
}

/** +2,5 h / −1 h */
export function saldoText(min: number): string {
  const v = Math.round((Math.abs(min) / 60) * 100) / 100;
  const z = String(v).replace('.', ',');
  return min > 0 ? `+${z} h` : min < 0 ? `−${z} h` : '0 h';
}

/** Brutto-Spanne von Start bis Ende (über Mitternacht möglich) */
export function spanne(start: string, ende: string): number {
  const d = minutenAus(ende) - minutenAus(start);
  return d < 0 ? d + 1440 : d;
}

/** Netto-Arbeitszeit in Minuten. Läuft der Eintrag noch, zählt `jetzt` (HH:MM, gleicher Tag) bzw. Tagesende. */
export function dauer(z: Pick<Zeiteintrag, 'start' | 'ende' | 'pauseMinuten' | 'datum'>, jetzt?: { datum: Datum; uhr: string }): number {
  let ende = z.ende;
  if (!ende) {
    if (!jetzt) return 0;
    ende = jetzt.datum === z.datum ? jetzt.uhr : '23:59';
  }
  return Math.max(0, spanne(z.start, ende) - (z.pauseMinuten || 0));
}

// ------------------------------------------------------------------ Stempeln

export function laufende(maId: ID): Zeiteintrag[] {
  return db.zeiten.where((z) => z.mitarbeiterId === maId && !z.ende);
}

const pauseKey = (id: ID) => `zeiten.pause.${id}`;

export function pauseSeit(z: Zeiteintrag): string | undefined {
  return einstellung<string | undefined>(pauseKey(z.id), undefined) || undefined;
}

export function pauseStarten(z: Zeiteintrag, jetzt = jetztUhr()) {
  setzeEinstellung(pauseKey(z.id), jetzt);
  db.zeiten.update(z.id, {}, { text: `Pause ab ${jetzt}` });
}

export function pauseBeenden(z: Zeiteintrag, jetzt = jetztUhr()): Zeiteintrag | undefined {
  const seit = pauseSeit(z);
  setzeEinstellung(pauseKey(z.id), '');
  if (!seit) return z;
  return db.zeiten.update(z.id, { pauseMinuten: (z.pauseMinuten || 0) + spanne(seit, jetzt) }, { text: `Pause bis ${jetzt}` });
}

export function stoppen(z: Zeiteintrag, ende = jetztUhr(), text?: string): Zeiteintrag | undefined {
  const aktuell = pauseSeit(z) ? pauseBeenden(z, ende) ?? z : z;
  // Ein Eintrag hört nie vor seinem Start auf (gleicher Tag) – dann gilt der Start als Ende.
  const e = aktuell.datum === heuteDatum() && minutenAus(ende) < minutenAus(aktuell.start) ? aktuell.start : ende;
  return db.zeiten.update(z.id, { ende: e }, { text: text ?? `Gestoppt um ${e}` });
}

export interface StartOpts {
  art?: Zeiteintrag['art'];
  auftragId?: ID;
  terminId?: ID;
  notiz?: string;
  datum?: Datum;
  uhr?: string;
}

/** Startet eine Zeit. Eine laufende Zeit desselben Mitarbeiters wird vorher beendet (ein Tap = Wechsel). */
export function starten(maId: ID, o: StartOpts = {}): Zeiteintrag {
  const jetzt = o.uhr ?? jetztUhr();
  for (const z of laufende(maId)) stoppen(z, z.datum === (o.datum ?? heuteDatum()) ? jetzt : '23:59');
  return db.zeiten.create({
    mitarbeiterId: maId,
    datum: o.datum ?? heuteDatum(),
    start: jetzt,
    pauseMinuten: 0,
    art: o.art ?? (o.auftragId || o.terminId ? 'arbeit' : 'werkstatt'),
    auftragId: o.auftragId,
    terminId: o.terminId,
    notiz: o.notiz,
    freigegeben: false,
  });
}

// ------------------------------------------------------------------ ArbZG

export interface TagesPruefung {
  arbeitMin: number;
  pauseMin: number;
  probleme: string[];
}

/**
 * Prüft einen Arbeitstag nach Arbeitszeitgesetz:
 * §3 höchstens 10 h, §4 Pausen (30 min ab mehr als 6 h, 45 min ab mehr als 9 h).
 * Lücken zwischen Einträgen von mindestens 15 Minuten zählen als Pause.
 */
export function pruefeTag(eintraege: Pick<Zeiteintrag, 'start' | 'ende' | 'pauseMinuten' | 'datum'>[]): TagesPruefung {
  const fertig = eintraege.filter((z) => z.ende).sort((a, b) => a.start.localeCompare(b.start));
  const arbeitMin = fertig.reduce((s, z) => s + dauer(z), 0);
  let pauseMin = fertig.reduce((s, z) => s + (z.pauseMinuten || 0), 0);
  for (let i = 1; i < fertig.length; i++) {
    const luecke = minutenAus(fertig[i].start) - minutenAus(fertig[i - 1].ende!);
    if (luecke >= 15) pauseMin += luecke;
  }
  const probleme: string[] = [];
  if (arbeitMin > 600) probleme.push(`Mehr als 10 Stunden gearbeitet (${stunden(arbeitMin)})`);
  if (arbeitMin > 540 && pauseMin < 45) probleme.push('Über 9 Stunden Arbeit: 45 Minuten Pause sind Pflicht');
  else if (arbeitMin > 360 && pauseMin < 30) probleme.push('Über 6 Stunden Arbeit: 30 Minuten Pause sind Pflicht');
  return { arbeitMin, pauseMin, probleme };
}

/** §5 ArbZG: mindestens 11 Stunden Ruhezeit zwischen zwei Arbeitstagen */
export function ruhezeitVerletzt(endeVortag: string | undefined, startHeute: string | undefined): boolean {
  if (!endeVortag || !startHeute) return false;
  const ruhe = 1440 - minutenAus(endeVortag) + minutenAus(startHeute);
  return ruhe < 11 * 60;
}

export function pruefeMitarbeiterTag(maId: ID, d: Datum, zeiten: Zeiteintrag[]): TagesPruefung {
  const tag = zeiten.filter((z) => z.mitarbeiterId === maId && z.datum === d);
  const p = pruefeTag(tag);
  const vortag = zeiten.filter((z) => z.mitarbeiterId === maId && z.datum === plusTage(d, -1) && z.ende);
  const endeVortag = vortag.map((z) => z.ende!).sort().pop();
  const startHeute = tag.map((z) => z.start).sort()[0];
  if (vortag.length && ruhezeitVerletzt(endeVortag, startHeute)) p.probleme.push('Weniger als 11 Stunden Ruhezeit seit gestern');
  return p;
}

// ------------------------------------------------------------------ Zeitarten & Pausenregel

/** Für Lohn und Auswertung: Baustelle (Arbeit beim Kunden), Fahrt, intern (Werkstatt, Büro) */
export type Zeitart = 'baustelle' | 'fahrt' | 'intern';

export const ZEITART_LABEL: Record<Zeitart, string> = {
  baustelle: 'Baustelle',
  fahrt: 'Fahrt',
  intern: 'Intern',
};

export function zeitart(art: Zeiteintrag['art']): Zeitart {
  return art === 'arbeit' ? 'baustelle' : art === 'fahrt' ? 'fahrt' : 'intern';
}

/** Automatischen Pausenabzug nach ArbZG anwenden? (Einstellung `arbeitszeiten.autoPause`, Standard an) */
export function autoPauseAn(): boolean {
  return einstellung<boolean>('arbeitszeiten.autoPause', true) !== false;
}

/** §4 ArbZG: Pflichtpause bei mehr als 6 h Arbeit 30 min, bei mehr als 9 h 45 min */
export function pflichtPause(arbeitMin: number): number {
  return arbeitMin > 540 ? 45 : arbeitMin > 360 ? 30 : 0;
}

/**
 * Fehlende Pause, die automatisch abgezogen wird (gestaffelt nach §4 ArbZG).
 * Es wird nie mehr abgezogen, als nötig ist, um unter die jeweilige Schwelle zu kommen:
 * 6:10 h ohne Pause → 10 min (bleiben 6:00 h), 7 h ohne Pause → 30 min, 9:20 h mit 30 min → 15 min.
 */
export function autoPause(arbeitMin: number, pauseMin: number): number {
  let arbeit = arbeitMin;
  let pause = pauseMin;
  let abzug = 0;
  for (const [schwelle, pflicht] of [
    [540, 45],
    [360, 30],
  ] as const) {
    if (arbeit > schwelle && pause < pflicht) {
      const d = Math.min(pflicht - pause, arbeit - schwelle);
      arbeit -= d;
      pause += d;
      abzug += d;
    }
  }
  return abzug;
}

export interface TagesWerte {
  /** Summe der Spannen Beginn–Ende (ohne Lücken zwischen Einträgen) */
  anwesenheit: number;
  /** eingetragene Pausen plus Lücken ab 15 Minuten zwischen Einträgen */
  pauseErfasst: number;
  /** automatisch abgezogene Pause (fehlte nach ArbZG) */
  pauseAuto: number;
  /** gearbeitete Minuten nach allen Pausen */
  netto: number;
  jeArt: Record<Zeitart, number>;
  /** mindestens ein Eintrag läuft noch (dann wird die Pause erst zum Feierabend geprüft) */
  laeuft: boolean;
}

/**
 * Ein Arbeitstag eines Mitarbeiters nach den Regeln: Netto-Zeit, Pausen, automatischer Pausenabzug, Zeitarten.
 * Der automatische Abzug geht von der Zeitart mit den meisten Minuten ab.
 */
export function tagAuswerten(
  eintraege: Pick<Zeiteintrag, 'start' | 'ende' | 'pauseMinuten' | 'datum' | 'art'>[],
  opts: { autoPause?: boolean; jetzt?: { datum: Datum; uhr: string } } = {},
): TagesWerte {
  const jeArt: Record<Zeitart, number> = { baustelle: 0, fahrt: 0, intern: 0 };
  const laeuft = eintraege.some((z) => !z.ende);
  const mitEnde = eintraege
    .map((z) => ({ z, ende: z.ende ?? (opts.jetzt ? (opts.jetzt.datum === z.datum ? opts.jetzt.uhr : '23:59') : undefined) }))
    .filter((x): x is { z: (typeof eintraege)[number]; ende: string } => !!x.ende)
    .sort((a, b) => a.z.start.localeCompare(b.z.start));
  let anwesenheit = 0;
  let pauseErfasst = 0;
  let netto = 0;
  mitEnde.forEach(({ z, ende }, i) => {
    const sp = spanne(z.start, ende);
    const n = Math.max(0, sp - (z.pauseMinuten || 0));
    anwesenheit += sp;
    pauseErfasst += Math.min(sp, z.pauseMinuten || 0);
    netto += n;
    jeArt[zeitart(z.art)] += n;
    if (i > 0) {
      const luecke = minutenAus(z.start) - minutenAus(mitEnde[i - 1].ende);
      if (luecke >= 15) pauseErfasst += luecke;
    }
  });
  const pauseAuto = (opts.autoPause ?? autoPauseAn()) && !laeuft ? autoPause(netto, pauseErfasst) : 0;
  if (pauseAuto) {
    const groesste = (Object.keys(jeArt) as Zeitart[]).reduce((a, b) => (jeArt[b] > jeArt[a] ? b : a), 'baustelle');
    jeArt[groesste] -= pauseAuto;
  }
  return { anwesenheit, pauseErfasst, pauseAuto, netto: netto - pauseAuto, jeArt, laeuft };
}

/**
 * Prüfung eines Tages für Anzeige und Hinweise: wie `pruefeMitarbeiterTag`, aber eine fehlende Pause, die Lotte
 * automatisch abgezogen hat, erscheint als „Pause fehlte – 30 min automatisch abgezogen“.
 */
export function tagesProbleme(maId: ID, d: Datum, zeiten: Zeiteintrag[], autoPause = autoPauseAn()): { probleme: string[]; pauseAuto: number } {
  const p = pruefeMitarbeiterTag(maId, d, zeiten);
  const tag = zeiten.filter((z) => z.mitarbeiterId === maId && z.datum === d);
  const pauseAuto = autoPause && tag.length ? tagAuswerten(tag, { autoPause }).pauseAuto : 0;
  const probleme = p.probleme.map((x) => (pauseAuto && /Pause sind Pflicht/.test(x) ? `Pause fehlte – ${pauseAuto} min automatisch abgezogen` : x));
  return { probleme, pauseAuto };
}

// ------------------------------------------------------------------ Soll / Ist

/**
 * Planmäßige Soll-Minuten eines Tages laut Arbeitszeitmodell (ohne Modell: Wochenstunden verteilt auf
 * die Arbeitstage des Betriebs). Feiertage (`@core/kalender`, Bundesland aus `plan.bundesland`) sowie
 * Tage vor Eintritt und nach Austritt haben kein Soll. Abwesenheiten sind hier NICHT abgezogen.
 */
export function sollPlanTag(
  m: Pick<Mitarbeiter, 'id' | 'wochenstunden' | 'eintritt' | 'austritt'>,
  d: Datum,
  arbeitstage = betriebsArbeitstage(),
  modelle: Arbeitsmodell[] = arbeitsmodelle.all(),
): number {
  if (m.eintritt && d < m.eintritt) return 0;
  if (m.austritt && d > m.austritt) return 0;
  if (istFeiertag(d, betriebsBundesland() ?? null)) return 0;
  const modell = modellAm(m.id, d, modelle);
  if (modell) return modell.minuten[wochentag(d) - 1] ?? 0;
  if (!arbeitstage.includes(wochentag(d))) return 0;
  return Math.round((m.wochenstunden * 60) / (arbeitstage.length || 5));
}

/**
 * Gutschrift für eine wirksame Abwesenheit: Urlaub, Krankheit, Berufsschule, Schulung, Sonstiges zählen als
 * erfüllt (halbtags die Hälfte). „Frei / Überstundenabbau“ wird nicht gutgeschrieben – er baut das Konto ab.
 */
export function gutschriftTag(maId: ID, d: Datum, abw: Abwesenheit[], planMin: number): number {
  if (!planMin) return 0;
  const a = abwesenheitAm(maId, d, abw);
  if (!a || a.art === 'frei') return 0;
  return a.halbtags ? Math.round(planMin / 2) : planMin;
}

/**
 * Soll-Minuten eines Tages nach Abzug der Gutschrift für Abwesenheiten:
 * Feiertage und freie Tage 0, Urlaub/Krank 0 (halbtags die Hälfte), Überstundenabbau voll.
 */
export function sollTag(
  m: Pick<Mitarbeiter, 'id' | 'wochenstunden' | 'eintritt' | 'austritt'>,
  d: Datum,
  abw: Abwesenheit[],
  arbeitstage = betriebsArbeitstage(),
  modelle: Arbeitsmodell[] = arbeitsmodelle.all(),
): number {
  const plan = sollPlanTag(m, d, arbeitstage, modelle);
  return plan - gutschriftTag(m.id, d, abw, plan);
}

export interface Konto {
  von: Datum;
  bis: Datum;
  /** Soll nach Abzug der Abwesenheiten */
  soll: number;
  /** gearbeitet (nach Pausen, inklusive automatischem Pausenabzug) */
  ist: number;
  /** Summe der Stundenbuchungen (Übertrag, Auszahlung, Korrektur) im Zeitraum */
  gebucht: number;
  /** ist − soll + gebucht */
  saldo: number;
}

export interface KontoOpts {
  modelle?: Arbeitsmodell[];
  buchungen?: Stundenbuchung[];
  autoPause?: boolean;
}

/** Zeiten eines Mitarbeiters nach Tag gruppiert */
export function nachTag(zeiten: Zeiteintrag[], maId: ID): Map<Datum, Zeiteintrag[]> {
  const m = new Map<Datum, Zeiteintrag[]>();
  for (const z of zeiten) {
    if (z.mitarbeiterId !== maId || z.geloeschtAm) continue;
    const l = m.get(z.datum);
    if (l) l.push(z);
    else m.set(z.datum, [z]);
  }
  return m;
}

/**
 * Stundenkonto bis einschließlich `bis`. Beginn = spätester von (erste erfasste Zeit, Eintritt,
 * letzter Übertrag aus dem alten System, optional `jahrBeginn`) – Zeiträume vor der Nutzung zählen nicht als Minus.
 * Das Konto läuft über den Jahreswechsel weiter.
 */
export function stundenkonto(m: Mitarbeiter, zeiten: Zeiteintrag[], abw: Abwesenheit[], bis: Datum, jahrBeginn?: Datum, opts: KontoOpts = {}): Konto | undefined {
  const tage = nachTag(zeiten, m.id);
  const buchungen = (opts.buchungen ?? stundenbuchungen.all()).filter((b) => b.mitarbeiterId === m.id && !b.geloeschtAm);
  const erste = [...tage.keys()].sort()[0];
  const startsaldo = buchungen.filter((b) => b.art === 'startsaldo' && b.datum <= bis).map((b) => b.datum).sort().pop();
  if (!erste && !startsaldo) return undefined;
  const kandidaten = [jahrBeginn, startsaldo ?? erste, m.eintritt].filter(Boolean) as Datum[];
  const von = kandidaten.sort().pop()!;
  if (von > bis) return { von, bis, soll: 0, ist: 0, gebucht: 0, saldo: 0 };
  const arbeitstage = betriebsArbeitstage();
  const modelle = opts.modelle ?? arbeitsmodelle.all();
  let soll = 0;
  for (let d = von; d <= bis; d = plusTage(d, 1)) soll += sollTag(m, d, abw, arbeitstage, modelle);
  let ist = 0;
  for (const [d, liste] of tage) if (d >= von && d <= bis) ist += tagAuswerten(liste, { autoPause: opts.autoPause }).netto;
  const gebucht = buchungen.filter((b) => b.datum >= von && b.datum <= bis).reduce((s, b) => s + b.minuten, 0);
  return { von, bis, soll, ist, gebucht, saldo: ist - soll + gebucht };
}

// ------------------------------------------------------------------ CSV für die Lohnabrechnung

export function csvExport(
  zeiten: Zeiteintrag[],
  mitarbeiter: (id: ID) => Pick<Mitarbeiter, 'vorname' | 'nachname'> | undefined,
  auftrag: (id: ID | undefined) => string,
): string {
  const kopf = ['Datum', 'Nachname', 'Vorname', 'Art', 'Auftrag', 'Beginn', 'Ende', 'Pause (min)', 'Stunden', 'Freigegeben', 'Notiz'];
  const esc = (s: string) => (/[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const zeilen = [...zeiten]
    .filter((z) => z.ende)
    .sort((a, b) => (a.datum + a.start).localeCompare(b.datum + b.start))
    .map((z) => {
      const m = mitarbeiter(z.mitarbeiterId);
      return [
        datumFmt(z.datum),
        m?.nachname ?? '',
        m?.vorname ?? '',
        ART_LABEL[z.art],
        auftrag(z.auftragId),
        z.start,
        z.ende ?? '',
        String(z.pauseMinuten || 0),
        (Math.round((dauer(z) / 60) * 100) / 100).toFixed(2).replace('.', ','),
        z.freigegeben ? 'ja' : 'nein',
        z.notiz ?? '',
      ]
        .map(esc)
        .join(';');
    });
  return [kopf.join(';'), ...zeilen].join('\r\n');
}

export function herunterladen(dateiname: string, inhalt: string, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob(['﻿' + inhalt], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = dateiname;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
