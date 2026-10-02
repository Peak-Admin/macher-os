import { describe, expect, it } from 'vitest';
import { db, defineCollection } from '@core/db';
import { on } from '@core/events';
import type { Basis, Bezug, ID, Kunde } from '@core/objects';
import { aehnlicheKunden, dublettenGruende, findeDubletten, kundenZusammenfuehren, naechsteKundennummer, normName, normTelefon, paarSchluessel } from './daten';

const k = (x: Partial<Kunde>): Kunde => ({ id: x.id ?? Math.random().toString(36), erstelltAm: '', geaendertAm: '', art: 'privat', name: '', ansprechpartner: [], ...x });

describe('Kunden: Normalisieren', () => {
  it('entfernt Anreden, Rechtsformen und Umlaute', () => {
    expect(normName('Familie Müller')).toBe('mueller');
    expect(normName('Bäckerei Sommer KG')).toBe('baeckerei sommer');
    expect(normName('Herr Dr. Weiß')).toBe('weiss');
  });
  it('vereinheitlicht Telefonnummern', () => {
    expect(normTelefon('+49 171 234-5678')).toBe('01712345678');
    expect(normTelefon('0049 (171) 2345678')).toBe('01712345678');
    expect(normTelefon('0171 / 23 45 678')).toBe('01712345678');
  });
});

describe('Kunden: Dubletten', () => {
  it('erkennt gleiche Telefonnummer trotz anderer Schreibweise', () => {
    expect(dublettenGruende(k({ name: 'P. Schulz', telefon: '0160 1112233' }), k({ name: 'Petra Schulz', telefon: '+49 160 111 22 33' }))).toContain('gleiche Telefonnummer');
  });
  it('erkennt vertauschte Namen und Anrede', () => {
    expect(dublettenGruende(k({ name: 'Schulz Petra' }), k({ name: 'Frau Petra Schulz' }))).toContain('gleicher Name');
  });
  it('erkennt gleiche E-Mail ohne Groß/klein', () => {
    expect(dublettenGruende(k({ name: 'A', email: 'Info@Firma.de ' }), k({ name: 'B', email: 'info@firma.de' }))).toEqual(['gleiche E-Mail']);
  });
  it('erkennt ähnlichen Namen an gleicher Adresse', () => {
    const adresse = { strasse: 'Lindenweg 12', plz: '34117', ort: 'Kassel' };
    expect(dublettenGruende(k({ name: 'Familie Hoffmann', adresse }), k({ name: 'Klaus Hoffmann', adresse: { ...adresse, strasse: 'Lindenweg 12 ' } }))).toEqual(['ähnlicher Name und gleiche Adresse']);
  });
  it('meldet verschiedene Kunden nicht', () => {
    expect(dublettenGruende(k({ name: 'Petra Schulz', telefon: '0160 1' }), k({ name: 'Thomas Richter', telefon: '0160 2' }))).toEqual([]);
  });
  it('respektiert „sind verschiedene Kunden“', () => {
    const a = k({ id: 'a', name: 'Meier' });
    const b = k({ id: 'b', name: 'Meier' });
    expect(findeDubletten([a, b])).toHaveLength(1);
    expect(findeDubletten([a, b], new Set([paarSchluessel('b', 'a')]))).toHaveLength(0);
  });
  it('warnt beim Anlegen vor ähnlichen Kunden', () => {
    expect(aehnlicheKunden({ name: 'Petra Schulz', ansprechpartner: [] }, [k({ name: 'Schulz, Petra' }), k({ name: 'Hans' })])).toHaveLength(1);
  });
});

describe('Kunden: Zusammenführen', () => {
  it('hängt Verweise um, ergänzt Daten und legt die Dublette in den Papierkorb', () => {
    const ziel = db.kunden.create({ art: 'privat', name: 'Petra Schulz', ansprechpartner: [] });
    const quelle = db.kunden.create({ art: 'privat', name: 'Schulz', telefon: '0160 1112233', ansprechpartner: [{ id: 'x', name: 'Hausmeister' }] });
    const ort = db.orte.create({ kundeId: quelle.id, bezeichnung: 'Wohnung', art: 'wohnung', adresse: { strasse: 'A', plz: '1', ort: 'B' } });
    const auftrag = db.auftraege.create({ nummer: 'A-1', titel: 'T', art: 'kundendienst', phase: 'anfrage', kundeId: quelle.id });
    const aufgabe = db.aufgaben.create({ titel: 'Rückruf', erledigt: false, prioritaet: 'normal', bezug: { typ: 'kunden', id: quelle.id } });
    let event: unknown;
    const aus = on('kunde.zusammengefuehrt', (e) => (event = e.daten));

    const n = kundenZusammenfuehren(ziel.id, quelle.id);
    aus();

    expect(n).toBe(3);
    expect(db.orte.get(ort.id)?.kundeId).toBe(ziel.id);
    expect(db.auftraege.get(auftrag.id)?.kundeId).toBe(ziel.id);
    expect(db.aufgaben.get(aufgabe.id)?.bezug?.id).toBe(ziel.id);
    expect(db.kunden.get(ziel.id)?.telefon).toBe('0160 1112233');
    expect(db.kunden.get(ziel.id)?.ansprechpartner.map((a) => a.name)).toEqual(['Hausmeister']);
    expect(db.kunden.get(quelle.id)?.geloeschtAm).toBeTruthy();
    expect(db.auftraege.all().filter((a) => a.kundeId === quelle.id)).toHaveLength(0);
    expect(event).toEqual({ zielId: ziel.id, quelleId: quelle.id });
  });
  it('hängt auch Verweise in Modul-Sammlungen um, der Zeitstrahl bleibt', () => {
    const vertraege = defineCollection<Basis & { kundeId: ID; titel: string }>('test-kunden-vertraege');
    const notizen = defineCollection<Basis & { bezug: Bezug; text: string }>('test-kunden-notizen');
    const ziel = db.kunden.create({ art: 'privat', name: 'Petra Schulz', ansprechpartner: [] });
    const quelle = db.kunden.create({ art: 'privat', name: 'P. Schulz', ansprechpartner: [] });
    const v = vertraege.create({ kundeId: quelle.id, titel: 'Wartung' });
    const notiz = notizen.create({ bezug: { typ: 'kunden', id: quelle.id }, text: 'Hund im Garten' });
    const verlauf = db.ereignisse.where((e) => e.bezug.typ === 'kunden' && e.bezug.id === quelle.id).length;

    expect(kundenZusammenfuehren(ziel.id, quelle.id)).toBe(2);
    expect(vertraege.get(v.id)?.kundeId).toBe(ziel.id);
    expect(notizen.get(notiz.id)?.bezug.id).toBe(ziel.id);
    // ursprüngliche Einträge im Zeitstrahl der Quelle bleiben dort (plus Papierkorb- und Zusammenführen-Vermerk)
    expect(db.ereignisse.where((e) => e.bezug.typ === 'kunden' && e.bezug.id === quelle.id).length).toBeGreaterThanOrEqual(verlauf);
  });
  it('verweigert Zusammenführen mit sich selbst', () => {
    const a = db.kunden.create({ art: 'privat', name: 'X', ansprechpartner: [] });
    expect(() => kundenZusammenfuehren(a.id, a.id)).toThrow();
  });
});

describe('Kunden: Nummern', () => {
  it('vergibt die nächste freie Kundennummer', () => {
    expect(naechsteKundennummer([])).toBe('K-1001');
    expect(naechsteKundennummer([{ nummer: 'K-1005' }, { nummer: 'K-1002' }, { nummer: 'X' }, {}])).toBe('K-1006');
  });
});
