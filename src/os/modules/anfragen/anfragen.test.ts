import { beforeEach, describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import type { Kunde } from '@core/objects';
import { anfrageAnlegen, findeKunden, istUnbearbeitet, nameWoerter, normTelefon, qualifizieren } from './daten';

const kunde = (x: Partial<Kunde>): Kunde => ({ id: x.name ?? 'k', erstelltAm: '', geaendertAm: '', art: 'privat', name: '', ansprechpartner: [], ...x });

describe('Kunden wiedererkennen', () => {
  const kunden = [
    kunde({ id: 'h', name: 'Familie Hoffmann', telefon: '0171 2345678', email: 'Hoffmann@Example.de' }),
    kunde({ id: 'hv', name: 'Hausverwaltung Nord GmbH', ansprechpartner: [{ id: 'a', name: 'Frau Neumann', telefon: '0561 998870' }] }),
    kunde({ id: 's', name: 'Petra Schulz' }),
  ];

  it('normalisiert Telefonnummern', () => {
    expect(normTelefon('+49 171 / 234 56-78')).toBe('01712345678');
    expect(normTelefon('0049 171 2345678')).toBe('01712345678');
    expect(normTelefon(undefined)).toBe('');
  });

  it('ignoriert Anrede und Rechtsform im Namen', () => {
    expect(nameWoerter('Familie Hoffmann')).toEqual(['hoffmann']);
    expect(nameWoerter('Hausverwaltung Nord GmbH')).toEqual(['hausverwaltung', 'nord']);
  });

  it('findet Kunden über Telefon, E-Mail und Ansprechpartner', () => {
    expect(findeKunden({ telefon: '+49 171 2345678' }, kunden)[0]).toMatchObject({ grund: 'telefon', sicherheit: 100 });
    expect(findeKunden({ email: ' hoffmann@example.de ' }, kunden)[0].kunde.id).toBe('h');
    expect(findeKunden({ telefon: '0561-998870' }, kunden)[0].kunde.id).toBe('hv');
  });

  it('schlägt bei ähnlichem Namen vor, aber nicht bei Zufallstreffern', () => {
    expect(findeKunden({ name: 'Hoffmann' }, kunden)[0]).toMatchObject({ grund: 'name' });
    expect(findeKunden({ name: 'Frau Schulz' }, kunden)[0].kunde.id).toBe('s');
    expect(findeKunden({ name: 'Max Müller' }, kunden)).toEqual([]);
    expect(findeKunden({ telefon: '123' }, kunden)).toEqual([]);
  });
});

describe('Anfrage anlegen und qualifizieren', () => {
  beforeEach(() => zuruecksetzen());

  it('legt Kunde, Ort und Auftrag in Phase Anfrage an', () => {
    const r = anfrageAnlegen({ neuerKunde: { name: 'Neu Kunde', telefon: '0170 1', adresse: { strasse: 'Weg 1', plz: '12345', ort: 'Kassel' } }, titel: 'Steckdose', quelle: 'telefon' });
    expect(r.kundeNeu).toBe(true);
    expect(r.auftrag.phase).toBe('anfrage');
    expect(r.auftrag.ortId).toBeTruthy();
    expect(db.orte.get(r.auftrag.ortId)?.kundeId).toBe(r.kunde.id);
  });

  it('nutzt bestehenden Kunden statt Dublette', () => {
    const k = db.kunden.create({ art: 'privat', name: 'Alt', ansprechpartner: [] });
    const r = anfrageAnlegen({ kundeId: k.id, titel: 'X', quelle: 'email' });
    expect(r.kundeNeu).toBe(false);
    expect(db.kunden.all()).toHaveLength(1);
  });

  it('Rückruf legt Aufgabe an, Absage legt mit Grund ab', () => {
    const { auftrag } = anfrageAnlegen({ neuerKunde: { name: 'A' }, titel: 'X', quelle: 'telefon', dringend: true });
    qualifizieren(auftrag.id, 'rueckruf');
    const aufgabe = db.aufgaben.all()[0];
    expect(aufgabe).toMatchObject({ quelle: 'rueckruf', prioritaet: 'hoch', auftragId: auftrag.id, erledigt: false });
    qualifizieren(auftrag.id, 'absagen', { grund: 'Zu weit weg' });
    expect(db.auftraege.get(auftrag.id)).toMatchObject({ phase: 'verloren', verlorenGrund: 'Zu weit weg' });
    expect(db.aufgaben.get(aufgabe.id)?.erledigt).toBe(true);
  });

  it('erkennt unbearbeitete Anfragen nach 24 Stunden', () => {
    const jetzt = new Date('2026-10-02T12:00:00Z');
    const a = { phase: 'anfrage', erstelltAm: '2026-10-01T10:00:00Z' } as never;
    expect(istUnbearbeitet(a, false, jetzt)).toBe(true);
    expect(istUnbearbeitet(a, true, jetzt)).toBe(false);
    expect(istUnbearbeitet({ phase: 'anfrage', erstelltAm: '2026-10-02T01:00:00Z' } as never, false, jetzt)).toBe(false);
  });
});
