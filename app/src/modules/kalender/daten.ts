/** Kalender: reine Hilfsfunktionen rund um Termine (Labels, Zeiträume, Verschieben, ICS). */
import { isoDatum } from '@core/format';
import type { Datum, ID, Termin, TerminArt } from '@core/objects';
import type { Ton } from '@core/modul';

export const TERMINART_LABEL: Record<TerminArt, string> = {
  einsatz: 'Einsatz',
  besichtigung: 'Besichtigung',
  wartung: 'Wartung',
  intern: 'Intern',
  schulung: 'Schulung',
  abnahme: 'Abnahme',
};

export const TERMINSTATUS: Record<Termin['status'], { label: string; ton: Ton }> = {
  geplant: { label: 'Geplant', ton: 'neutral' },
  bestaetigt: { label: 'Bestätigt', ton: 'erfolg' },
  unterwegs: { label: 'Unterwegs', ton: 'aktiv' },
  vor_ort: { label: 'Vor Ort', ton: 'aktiv' },
  erledigt: { label: 'Erledigt', ton: 'erfolg' },
  abgesagt: { label: 'Abgesagt', ton: 'achtung' },
};

/** Termin liegt (ganz oder teilweise) an diesem Tag */
export function terminAmTag(t: Pick<Termin, 'start' | 'ende'>, tag: Datum): boolean {
  const von = isoDatum(new Date(t.start));
  const bis = isoDatum(new Date(new Date(t.ende).getTime() - 1));
  return von <= tag && (bis < von ? von : bis) >= tag;
}

/** Termine im Zeitraum, optional für einen Mitarbeiter, nach Startzeit sortiert */
export function termineIm(termine: Termin[], von: Datum, bis: Datum, opts: { mitarbeiterId?: ID; mitAbgesagten?: boolean } = {}): Termin[] {
  return termine
    .filter((t) => !t.geloeschtAm && (opts.mitAbgesagten || t.status !== 'abgesagt'))
    .filter((t) => !opts.mitarbeiterId || t.mitarbeiterIds.includes(opts.mitarbeiterId))
    .filter((t) => {
      const s = isoDatum(new Date(t.start));
      const e = isoDatum(new Date(new Date(t.ende).getTime() - 1));
      return s <= bis && (e < s ? s : e) >= von;
    })
    .sort((a, b) => a.start.localeCompare(b.start));
}

/** Termin auf einen anderen Tag (und optional andere Startzeit) legen – Dauer bleibt gleich */
export function verschoben(t: Pick<Termin, 'start' | 'ende'>, neuerTag: Datum, neueStartUhr?: string): { start: string; ende: string } {
  const alt = new Date(t.start);
  const dauer = new Date(t.ende).getTime() - alt.getTime();
  const neu = new Date(`${neuerTag}T00:00:00`);
  if (neueStartUhr) {
    const [h, m] = neueStartUhr.split(':').map(Number);
    neu.setHours(h || 0, m || 0, 0, 0);
  } else neu.setHours(alt.getHours(), alt.getMinutes(), 0, 0);
  return { start: neu.toISOString(), ende: new Date(neu.getTime() + dauer).toISOString() };
}

/** Künftige (oder laufende), nicht abgesagte Termine eines Auftrags */
export function kuenftigeTermine(termine: Termin[], auftragId: ID, jetzt = new Date()): Termin[] {
  const j = jetzt.toISOString();
  return termine
    .filter((t) => t.auftragId === auftragId && !t.geloeschtAm && t.status !== 'abgesagt' && t.status !== 'erledigt' && t.ende >= j)
    .sort((a, b) => a.start.localeCompare(b.start));
}

/** Dauer in Stunden */
export const dauerStunden = (t: Pick<Termin, 'start' | 'ende'>) => (new Date(t.ende).getTime() - new Date(t.start).getTime()) / 3_600_000;

// ------------------------------------------------------------------ ICS

const icsZeit = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const icsDatum = (iso: string) => isoDatum(new Date(iso)).replace(/-/g, '');
const icsText = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Lange Zeilen nach RFC 5545 bei 75 Zeichen falten */
function falten(zeile: string): string {
  const teile: string[] = [];
  let rest = zeile;
  while (rest.length > 75) {
    teile.push(rest.slice(0, 75));
    rest = ' ' + rest.slice(75);
  }
  teile.push(rest);
  return teile.join('\r\n');
}

/** Ein Termin als iCalendar-Datei (für Outlook, Google, Apple) */
export function terminAlsIcs(
  t: Pick<Termin, 'id' | 'titel' | 'start' | 'ende' | 'ganztags' | 'status'>,
  info: { ort?: string; beschreibung?: string; betrieb?: string; erstellt?: Date } = {},
): string {
  const ende = t.ganztags ? icsDatum(new Date(new Date(t.ende).getTime() + 86_400_000).toISOString()) : '';
  const zeilen = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Macher OS//Kalender//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${t.id}@macher-os`,
    `DTSTAMP:${icsZeit((info.erstellt ?? new Date()).toISOString())}`,
    t.ganztags ? `DTSTART;VALUE=DATE:${icsDatum(t.start)}` : `DTSTART:${icsZeit(t.start)}`,
    t.ganztags ? `DTEND;VALUE=DATE:${ende}` : `DTEND:${icsZeit(t.ende)}`,
    `SUMMARY:${icsText(info.betrieb ? `${t.titel} (${info.betrieb})` : t.titel)}`,
    info.ort ? `LOCATION:${icsText(info.ort)}` : '',
    info.beschreibung ? `DESCRIPTION:${icsText(info.beschreibung)}` : '',
    `STATUS:${t.status === 'abgesagt' ? 'CANCELLED' : t.status === 'geplant' ? 'TENTATIVE' : 'CONFIRMED'}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);
  return zeilen.map(falten).join('\r\n') + '\r\n';
}

/** Dateiname für den Download, z. B. `termin-2026-10-02-wartung.ics` */
export function icsDateiname(t: Pick<Termin, 'start' | 'titel'>): string {
  const slug = t.titel
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return `termin-${isoDatum(new Date(t.start))}${slug ? '-' + slug : ''}.ics`;
}

/** ISO-Kalenderwoche */
export function kalenderwoche(datum: Datum): number {
  const d = new Date(`${datum}T12:00:00`);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const w1 = new Date(d.getFullYear(), 0, 4, 12);
  return 1 + Math.round(((d.getTime() - w1.getTime()) / 86_400_000 - 3 + ((w1.getDay() + 6) % 7)) / 7);
}

/** Erster Tag des Monats und Monat verschieben */
export function monatsAnfang(datum: Datum, plusMonate = 0): Datum {
  const d = new Date(`${datum.slice(0, 7)}-01T12:00:00`);
  d.setMonth(d.getMonth() + plusMonate);
  return isoDatum(d);
}
