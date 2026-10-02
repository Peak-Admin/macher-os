/**
 * Arbeitszeiten – reine Logik: Dauer, Stempeln, Pausen, ArbZG-Prüfung, Soll/Ist, CSV.
 * Zeiteinträge sind Kernobjekte (`db.zeiten`). Eine laufende Pause wird – weil der Kern
 * dafür kein Feld hat – als Einstellung `zeiten.pause.<id>` gemerkt (Kernwunsch: `pauseSeit`).
 */
import { db } from '@core/db';
import { einstellung, setzeEinstellung } from '@core/einstellungen';
import { heute as heuteDatum, plusTage, datum as datumFmt, minutenAus, minutenVon, uhrAus } from '@core/format';
import { betriebsArbeitstage, istArbeitstag } from '@core/kalender';
import type { Abwesenheit, Datum, ID, Mitarbeiter, Zeiteintrag } from '@core/objects';
import { abwesenheitAm } from '@modules/abwesenheiten/daten';

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

// ------------------------------------------------------------------ Soll / Ist

/**
 * Soll-Minuten eines Tages: Wochenstunden verteilt auf die Arbeitstage des Betriebs (Standard Mo–Fr = / 5);
 * an Feiertagen und freien Tagen 0, Abwesenheiten werden gutgeschrieben (Soll 0, halbtags die Hälfte).
 */
export function sollTag(m: Pick<Mitarbeiter, 'id' | 'wochenstunden' | 'eintritt' | 'austritt'>, d: Datum, abw: Abwesenheit[], arbeitstage = betriebsArbeitstage()): number {
  if (!istArbeitstag(d, arbeitstage)) return 0;
  if (m.eintritt && d < m.eintritt) return 0;
  if (m.austritt && d > m.austritt) return 0;
  const voll = Math.round((m.wochenstunden * 60) / arbeitstage.length);
  const a = abwesenheitAm(m.id, d, abw);
  if (!a) return voll;
  return a.halbtags ? Math.round(voll / 2) : 0;
}

export interface Konto {
  von: Datum;
  bis: Datum;
  soll: number;
  ist: number;
  saldo: number;
}

/**
 * Stundenkonto im Zeitraum. Beginn = spätester von (Jahresanfang, Eintritt, erster erfasster Zeit),
 * damit Zeiträume vor der Nutzung von Macher OS nicht als Minus zählen.
 */
export function stundenkonto(m: Mitarbeiter, zeiten: Zeiteintrag[], abw: Abwesenheit[], bis: Datum, jahrBeginn?: Datum): Konto | undefined {
  const eigene = zeiten.filter((z) => z.mitarbeiterId === m.id && !z.geloeschtAm);
  const erste = eigene.map((z) => z.datum).sort()[0];
  if (!erste) return undefined;
  const kandidaten = [jahrBeginn ?? `${bis.slice(0, 4)}-01-01`, erste, m.eintritt].filter(Boolean) as Datum[];
  const von = kandidaten.sort().pop()!;
  if (von > bis) return { von, bis, soll: 0, ist: 0, saldo: 0 };
  let soll = 0;
  const arbeitstage = betriebsArbeitstage();
  for (let d = von; d <= bis; d = plusTage(d, 1)) soll += sollTag(m, d, abw, arbeitstage);
  const ist = eigene.filter((z) => z.datum >= von && z.datum <= bis).reduce((s, z) => s + dauer(z), 0);
  return { von, bis, soll, ist, saldo: ist - soll };
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
