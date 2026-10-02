import { beforeEach, describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from './db';
import {
  AUFTRAGSNUMMER_IM_TEXT,
  auftragsnummerFehler,
  naechsteNummer,
  naechsteNummerFuer,
  nummerAnzeige,
  nummerFehler,
  projektNummerFuer,
  projektPraefix,
} from './nummern';

describe('Nummernkreise für Module', () => {
  it('zählt je Präfix und Jahr fortlaufend weiter', () => {
    expect(naechsteNummerFuer('BR', [], { jahr: 2026 })).toBe('BR-2026-0001');
    expect(naechsteNummerFuer('BR', ['BR-2026-0007', 'BR-2025-0099', undefined, 'B-2026-0042'], { jahr: 2026 })).toBe('BR-2026-0008');
  });
  it('trennt ähnliche Präfixe und kennt die Stellenzahl', () => {
    expect(naechsteNummerFuer('B', ['BR-2026-0005', 'B-2026-0002'], { jahr: 2026 })).toBe('B-2026-0003');
    expect(naechsteNummerFuer('SV', ['SV-2026-009'], { jahr: 2026, stellen: 3 })).toBe('SV-2026-010');
  });
});

describe('Projektnummer YYMM-XXX', () => {
  const okt = new Date(2026, 9, 2);
  it('erstes Projekt im Oktober 2026 ist 2610-001', () => {
    expect(projektPraefix(okt)).toBe('2610');
    expect(projektNummerFuer([], okt)).toBe('2610-001');
  });
  it('zählt je Monat und beginnt im neuen Monat wieder bei 001', () => {
    expect(projektNummerFuer(['2610-001', '2610-007', '2609-042', 'A-2026-0099', undefined], okt)).toBe('2610-008');
    expect(projektNummerFuer(['2610-007'], new Date(2026, 10, 1))).toBe('2611-001');
    expect(projektNummerFuer([], new Date(2027, 0, 15))).toBe('2701-001');
  });
  it('ignoriert fremde Formate und läuft über 999 hinaus', () => {
    expect(projektNummerFuer(['2610-01a', '2610-', '#2610-003', 'X2610-050'], okt)).toBe('2610-004');
    expect(projektNummerFuer(['2610-999'], okt)).toBe('2610-1000');
  });
  it('zeigt die Nummer mit # an', () => {
    expect(nummerAnzeige('2610-001')).toBe('#2610-001');
    expect(nummerAnzeige(undefined)).toBe('');
  });
});

describe('Eigene Nummer prüfen', () => {
  it('erkennt Doppel – auch mit # und anderer Schreibweise', () => {
    expect(nummerFehler('2610-001', ['2610-001'])).toMatch(/gibt es schon/);
    expect(nummerFehler(' #a-2026-0001 ', ['A-2026-0001'])).toMatch(/gibt es schon/);
    expect(nummerFehler('2610-002', ['2610-001', undefined])).toBeUndefined();
  });
  it('verlangt eine sinnvolle Nummer', () => {
    expect(nummerFehler('  ', [])).toMatch(/Trag/);
    expect(nummerFehler('Bau 12', [])).toMatch(/Buchstaben/);
    expect(nummerFehler('x'.repeat(21), [])).toMatch(/20 Zeichen/);
    expect(nummerFehler('BV-Müller/3', [])).toBeUndefined();
  });
  it('findet alte und neue Nummern im Text', () => {
    expect('Was ist mit #2610-004?'.match(AUFTRAGSNUMMER_IM_TEXT)?.[0]).toBe('2610-004');
    expect('Auftrag A-2026-0001 bitte'.match(AUFTRAGSNUMMER_IM_TEXT)?.[0]).toBe('A-2026-0001');
    expect('Datum 2026-10-02'.match(AUFTRAGSNUMMER_IM_TEXT)).toBeNull();
  });
});

describe('Kreis „auftrag“ in der Datenbank', () => {
  beforeEach(() => zuruecksetzen());
  it('vergibt Projektnummern, alte Nummern bleiben, Angebote bleiben beim alten Format', () => {
    const okt = new Date(2026, 9, 2);
    expect(naechsteNummer('auftrag', 2026, okt)).toBe('2610-001');
    const a = db.auftraege.create({ nummer: 'A-2026-0001', titel: 'Alt', art: 'projekt', phase: 'anfrage', kundeId: 'k' });
    db.auftraege.create({ nummer: '2610-001', titel: 'Neu', art: 'projekt', phase: 'anfrage', kundeId: 'k' });
    expect(naechsteNummer('auftrag', 2026, okt)).toBe('2610-002');
    expect(naechsteNummer('angebot', 2026)).toBe('AN-2026-0001');
    expect(auftragsnummerFehler('2610-001')).toMatch(/gibt es schon/);
    expect(auftragsnummerFehler('A-2026-0001', a.id)).toBeUndefined();
  });
  it('zählt gelöschte Aufträge mit', () => {
    const okt = new Date(2026, 9, 2);
    const a = db.auftraege.create({ nummer: '2610-001', titel: 'Weg', art: 'projekt', phase: 'anfrage', kundeId: 'k' });
    db.auftraege.remove(a.id);
    expect(naechsteNummer('auftrag', 2026, okt)).toBe('2610-002');
    expect(auftragsnummerFehler('2610-001')).toMatch(/gibt es schon/);
  });
});
