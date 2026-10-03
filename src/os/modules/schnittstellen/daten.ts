/**
 * Schnittstellen: ehrliche Übersicht (verfügbar/geplant) und echte Exporte –
 * Kalender (ICS, RFC 5545) und JSON-Datenexport.
 */
import { db, defineCollection, exportieren } from '@core/db';
import { adresseText, personName } from '@core/format';
import type { Basis, ID, Termin } from '@core/objects';

/** Protokoll: was wurde wann exportiert (für „zuletzt exportiert“) */
export interface SchnittstellenExport extends Basis {
  art: 'ics' | 'json';
  dateiname: string;
  anzahl: number;
}

export const schnittstellen = defineCollection<SchnittstellenExport>('schnittstellen');

// ------------------------------------------------------------------ ICS

export interface IcsTermin {
  uid: string;
  start: string; // ISO
  ende: string; // ISO
  ganztags?: boolean;
  titel: string;
  ort?: string;
  beschreibung?: string;
  status?: 'TENTATIVE' | 'CONFIRMED' | 'CANCELLED';
  geaendert?: string; // ISO
}

/** Text für ICS maskieren: Backslash, Semikolon, Komma, Zeilenumbruch */
export function icsText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** ISO → `20261002T070000Z` (UTC) */
export function icsZeit(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** ISO → `20261002` (lokales Datum, für ganztägige Termine) */
export function icsDatum(iso: string): string {
  const d = new Date(iso);
  const z = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}`;
}

const enc = new TextEncoder();

/** Zeilen nach RFC 5545 auf 75 Byte falten (UTF-8-sicher, Fortsetzung mit Leerzeichen) */
export function icsFalten(zeile: string): string {
  const teile: string[] = [];
  let aktuell = '';
  let bytes = 0;
  for (const z of zeile) {
    const b = enc.encode(z).length;
    const grenze = teile.length ? 74 : 75; // Folgezeilen beginnen mit einem Leerzeichen
    if (bytes + b > grenze) {
      teile.push(aktuell);
      aktuell = '';
      bytes = 0;
    }
    aktuell += z;
    bytes += b;
  }
  teile.push(aktuell);
  return teile.join('\r\n ');
}

export function icsErzeugen(termine: IcsTermin[], opts: { kalendername: string; jetzt?: string }): string {
  const stempel = icsZeit(opts.jetzt ?? new Date().toISOString());
  const z: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Handwerk OS//Termine//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${icsText(opts.kalendername)}`,
  ];
  for (const t of termine) {
    z.push('BEGIN:VEVENT', `UID:${t.uid}`, `DTSTAMP:${t.geaendert ? icsZeit(t.geaendert) : stempel}`);
    if (t.ganztags) {
      const ende = new Date(t.ende);
      // DTEND ist bei ganztägigen Terminen exklusiv
      const endeExklusiv = new Date(ende.getFullYear(), ende.getMonth(), ende.getDate() + 1);
      z.push(`DTSTART;VALUE=DATE:${icsDatum(t.start)}`, `DTEND;VALUE=DATE:${icsDatum(endeExklusiv.toISOString())}`);
    } else {
      z.push(`DTSTART:${icsZeit(t.start)}`, `DTEND:${icsZeit(t.ende)}`);
    }
    z.push(`SUMMARY:${icsText(t.titel)}`);
    if (t.ort) z.push(`LOCATION:${icsText(t.ort)}`);
    if (t.beschreibung) z.push(`DESCRIPTION:${icsText(t.beschreibung)}`);
    if (t.status) z.push(`STATUS:${t.status}`);
    z.push('END:VEVENT');
  }
  z.push('END:VCALENDAR');
  return z.map(icsFalten).join('\r\n') + '\r\n';
}

const TERMINART: Record<Termin['art'], string> = {
  einsatz: 'Einsatz',
  besichtigung: 'Besichtigung',
  wartung: 'Wartung',
  intern: 'Intern',
  schulung: 'Schulung',
  abnahme: 'Abnahme',
};

/** Termine aus der Datenbank in ICS-Termine übersetzen (Kunde, Ort, Team aufgelöst) */
export function termineFuerIcs(opts: { mitarbeiterId?: ID; abDatum?: string; mitAbgesagten?: boolean } = {}): IcsTermin[] {
  return db.termine
    .where((t) => !!t.start && !!t.ende)
    .filter((t) => opts.mitAbgesagten || t.status !== 'abgesagt')
    .filter((t) => !opts.mitarbeiterId || t.mitarbeiterIds.includes(opts.mitarbeiterId))
    .filter((t) => !opts.abDatum || t.ende.slice(0, 10) >= opts.abDatum)
    .sort((a, b) => a.start.localeCompare(b.start))
    .map((t) => {
      const kunde = db.kunden.get(t.kundeId);
      const ort = db.orte.get(t.ortId);
      const auftrag = db.auftraege.get(t.auftragId);
      const team = t.mitarbeiterIds.map((id) => db.mitarbeiter.get(id)).filter(Boolean).map((m) => personName(m));
      const beschreibung = [
        `${TERMINART[t.art]}${auftrag ? ` · ${auftrag.nummer}` : ''}`,
        kunde ? `Kunde: ${kunde.name}${kunde.telefon ? `, ${kunde.telefon}` : ''}` : '',
        team.length ? `Team: ${team.join(', ')}` : '',
        ort?.hinweise ? `Hinweis: ${ort.hinweise}` : '',
        t.notiz ?? '',
      ].filter(Boolean);
      return {
        uid: `${t.id}@macher-os`,
        start: t.start,
        ende: t.ende,
        ganztags: t.ganztags,
        titel: kunde && !t.titel.includes(kunde.name) ? `${t.titel} – ${kunde.name}` : t.titel,
        ort: ort ? adresseText(ort.adresse) : kunde?.adresse ? adresseText(kunde.adresse) : undefined,
        beschreibung: beschreibung.join('\n'),
        status: t.status === 'abgesagt' ? 'CANCELLED' : t.status === 'geplant' ? 'TENTATIVE' : 'CONFIRMED',
        geaendert: t.geaendertAm,
      } satisfies IcsTermin;
    });
}

// ------------------------------------------------------------------ JSON

/** Sammlungen, die für andere Programme keinen Sinn ergeben */
const INTERN = new Set(['ereignisse', 'einstellungen']);

/**
 * Lesbarer Datenexport für andere Programme: je Sammlung eine Liste,
 * ohne Papierkorb, ohne interne Protokolle.
 */
export function jsonExport(daten: Record<string, Record<string, Basis>> = exportieren(), jetzt = new Date().toISOString()) {
  const sammlungen: Record<string, Basis[]> = {};
  for (const [name, tabelle] of Object.entries(daten)) {
    if (INTERN.has(name)) continue;
    const liste = Object.values(tabelle).filter((x) => !x.geloeschtAm);
    if (liste.length) sammlungen[name] = liste;
  }
  return {
    format: 'macher-os-export',
    version: 1,
    exportiertAm: jetzt,
    hinweis: 'Geldbeträge in Cent, Datum als JJJJ-MM-TT, Verweise per ID.',
    sammlungen,
  };
}

// ------------------------------------------------------------------ Download

/** Datei im Browser herunterladen */
export function herunterladen(dateiname: string, inhalt: string, mime: string) {
  const blob = new Blob([inhalt], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = dateiname;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** „Mein Betrieb GmbH“ → „mein-betrieb-gmbh“ */
export function dateiTeil(s: string | undefined): string {
  return (s ?? 'macher-os')
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'macher-os';
}
