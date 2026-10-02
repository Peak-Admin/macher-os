import { describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import { dateiTeil, icsErzeugen, icsFalten, icsText, jsonExport, termineFuerIcs } from './daten';

describe('ICS', () => {
  it('maskiert Sonderzeichen', () => {
    expect(icsText('Wartung; Heizung, Keller\nTür offen \\ ok')).toBe('Wartung\; Heizung\\, Keller\\nTür offen \\\\ ok');
  });
  it('faltet lange Zeilen auf 75 Byte, auch mit Umlauten', () => {
    const lang = 'DESCRIPTION:' + 'Ä'.repeat(100);
    const gefaltet = icsFalten(lang);
    const zeilen = gefaltet.split('\r\n');
    expect(zeilen.length).toBeGreaterThan(1);
    for (const z of zeilen) expect(new TextEncoder().encode(z).length).toBeLessThanOrEqual(75);
    expect(zeilen.slice(1).every((z) => z.startsWith(' '))).toBe(true);
    expect(zeilen.map((z, i) => (i ? z.slice(1) : z)).join('')).toBe(lang);
  });
  it('erzeugt gültigen Kalender mit Zeit- und Ganztagsterminen', () => {
    const ics = icsErzeugen(
      [
        { uid: 't1@macher-os', start: '2026-10-02T05:00:00.000Z', ende: '2026-10-02T10:00:00.000Z', titel: 'Wartung, Hoffmann', ort: 'Lindenweg 12, 34117 Kassel', status: 'CONFIRMED' },
        { uid: 't2@macher-os', start: '2026-10-05T10:00:00', ende: '2026-10-06T10:00:00', ganztags: true, titel: 'Schulung' },
      ],
      { kalendername: 'Elektro Muster', jetzt: '2026-10-01T12:00:00.000Z' },
    );
    expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('DTSTART:20261002T050000Z');
    expect(ics).toContain('DTEND:20261002T100000Z');
    expect(ics).toContain('SUMMARY:Wartung\\, Hoffmann');
    expect(ics).toContain('DTSTART;VALUE=DATE:20261005');
    expect(ics).toContain('DTEND;VALUE=DATE:20261007');
    expect(ics).toContain('DTSTAMP:20261001T120000Z');
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics.split('\r\n').every((z) => !z.includes('\n'))).toBe(true);
  });
  it('übersetzt Termine aus der Datenbank mit Kunde, Ort und Team', () => {
    zuruecksetzen();
    const k = db.kunden.create({ art: 'privat', name: 'Petra Schulz', ansprechpartner: [], telefon: '0160 1' });
    const o = db.orte.create({ kundeId: k.id, bezeichnung: 'Wohnung', art: 'wohnung', adresse: { strasse: 'Am Hang 4', plz: '34128', ort: 'Kassel' } });
    const m = db.mitarbeiter.create({ vorname: 'Jonas', nachname: 'Becker', rolle: 'monteur', wochenstunden: 39, urlaubstageJahr: 30, kostensatz: 0, aktiv: true });
    db.termine.create({ art: 'einsatz', titel: 'Steckdosen', start: '2026-10-02T05:00:00.000Z', ende: '2026-10-02T07:00:00.000Z', kundeId: k.id, ortId: o.id, mitarbeiterIds: [m.id], status: 'bestaetigt' });
    db.termine.create({ art: 'intern', titel: 'Abgesagt', start: '2026-10-03T05:00:00.000Z', ende: '2026-10-03T07:00:00.000Z', mitarbeiterIds: [], status: 'abgesagt' });
    const t = termineFuerIcs();
    expect(t).toHaveLength(1);
    expect(t[0].titel).toBe('Steckdosen – Petra Schulz');
    expect(t[0].ort).toBe('Am Hang 4, 34128 Kassel');
    expect(t[0].beschreibung).toContain('Team: Jonas Becker');
    expect(termineFuerIcs({ mitarbeiterId: 'niemand' })).toHaveLength(0);
    expect(termineFuerIcs({ mitAbgesagten: true })).toHaveLength(2);
  });
});

describe('JSON-Export', () => {
  it('lässt Papierkorb und interne Sammlungen weg', () => {
    const d = {
      kunden: { a: { id: 'a', erstelltAm: '', geaendertAm: '' }, b: { id: 'b', erstelltAm: '', geaendertAm: '', geloeschtAm: 'x' } },
      ereignisse: { e: { id: 'e', erstelltAm: '', geaendertAm: '' } },
      leer: {},
    };
    const j = jsonExport(d, '2026-10-02T00:00:00Z');
    expect(Object.keys(j.sammlungen)).toEqual(['kunden']);
    expect(j.sammlungen.kunden.map((x) => x.id)).toEqual(['a']);
    expect(j.format).toBe('macher-os-export');
  });
  it('baut saubere Dateinamen', () => {
    expect(dateiTeil('Müller & Söhne GmbH')).toBe('mueller-soehne-gmbh');
    expect(dateiTeil('')).toBe('macher-os');
  });
});
