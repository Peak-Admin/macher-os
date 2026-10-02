import { describe, expect, it } from 'vitest';
import { db, defineCollection, ueberlagern } from './db';
import { summen } from './format';
import { naechsteNummer } from './nummern';
import { on } from './events';

describe('Kern', () => {
  it('erlaubt jeden Sammlungsnamen nur einmal', () => {
    expect(() => defineCollection('kunden')).toThrow(/existiert bereits/);
  });

  it('legt an, ändert, löscht weich und protokolliert', () => {
    const k = db.kunden.create({ art: 'privat', name: 'Test', ansprechpartner: [] });
    db.kunden.update(k.id, { name: 'Test 2' });
    expect(db.kunden.get(k.id)?.name).toBe('Test 2');
    db.kunden.remove(k.id);
    expect(db.kunden.all().find((x) => x.id === k.id)).toBeUndefined();
    db.kunden.restore(k.id);
    expect(db.kunden.get(k.id)?.geloeschtAm).toBeUndefined();
    expect(db.ereignisse.where((e) => e.bezug.id === k.id).length).toBe(4);
  });

  it('feuert Events', () => {
    let n = 0;
    const aus = on('kunden.*', () => n++);
    db.kunden.create({ art: 'privat', name: 'X', ansprechpartner: [] });
    aus();
    expect(n).toBe(1);
  });

  it('rechnet Summen in Cent', () => {
    const s = summen(
      [
        { id: '1', art: 'leistung', text: 'a', menge: 2, einheit: 'Stk', einzelpreis: 1050 },
        { id: '2', art: 'material', text: 'b', menge: 1, einheit: 'Stk', einzelpreis: 999, optional: true },
      ],
      19,
      10,
    );
    expect(s).toEqual({ netto: 1890, rabatt: 210, ust: 359, brutto: 2249 });
  });

  it('vergibt fortlaufende Nummern', () => {
    const j = new Date().getFullYear();
    expect(naechsteNummer('auftrag')).toBe(`A-${j}-0001`);
  });
});

describe('Speichern über mehrere Tabs', () => {
  it('schreibt nur eigene Änderungen in den gespeicherten Stand und behält fremde', () => {
    const gespeichert = { rechnungen: { r1: { id: 'r1', status: 'entwurf' }, r2: { id: 'r2', status: 'versendet' } }, kunden: { k1: { id: 'k1' } } } as never;
    const eigen = { rechnungen: { r1: { id: 'r1', status: 'versendet' }, r2: { id: 'r2', status: 'entwurf' } }, kunden: {} } as never;
    const neu = ueberlagern(gespeichert, new Map([['rechnungen', new Set(['r1'])], ['kunden', new Set(['k1'])]]), eigen) as Record<string, Record<string, { status?: string }>>;
    expect(neu.rechnungen.r1.status).toBe('versendet');
    // r2 hat dieser Tab nicht geändert – der gespeicherte (fremde) Stand bleibt
    expect(neu.rechnungen.r2.status).toBe('versendet');
    // k1 hat dieser Tab gelöscht
    expect(neu.kunden.k1).toBeUndefined();
  });
});

describe('Beispieldaten entfernen', () => {
  it('nimmt Hinweise und Benachrichtigungen zu Beispielen mit, eigene Daten bleiben', async () => {
    const { beispieleEntfernen } = await import('./seed');
    const bsp = db.auftraege.create({ nummer: 'A-B', titel: 'Beispiel', art: 'kundendienst', phase: 'anfrage', kundeId: 'k', beispiel: true });
    const echt = db.auftraege.create({ nummer: 'A-E', titel: 'Echt', art: 'kundendienst', phase: 'anfrage', kundeId: 'k' });
    db.hinweise.create({ art: 'problem', titel: 'zum Beispiel', gewicht: 50, status: 'offen', bezug: { typ: 'auftraege', id: bsp.id } });
    db.hinweise.create({ art: 'problem', titel: 'zum echten', gewicht: 50, status: 'offen', bezug: { typ: 'auftraege', id: echt.id } });
    db.benachrichtigungen.create({ titel: 'B', gelesen: false, bezug: { typ: 'auftraege', id: bsp.id } });
    const jonas = db.mitarbeiter.create({ vorname: 'Jonas', nachname: 'B', rolle: 'monteur', wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 0, aktiv: true, beispiel: true });
    const tBsp = db.termine.create({ art: 'einsatz', titel: 'zum Beispiel', start: '2026-10-06T07:00:00Z', ende: '2026-10-06T09:00:00Z', auftragId: bsp.id, mitarbeiterIds: [], status: 'geplant' });
    const tEcht = db.termine.create({ art: 'einsatz', titel: 'echt', start: '2026-10-06T07:00:00Z', ende: '2026-10-06T09:00:00Z', auftragId: echt.id, mitarbeiterIds: [jonas.id, 'max'], status: 'geplant' });
    beispieleEntfernen();
    expect(db.termine.get(tBsp.id)).toBeUndefined();
    expect(db.termine.get(tEcht.id)?.mitarbeiterIds).toEqual(['max']);
    expect(db.auftraege.get(bsp.id)).toBeUndefined();
    expect(db.hinweise.all().map((h) => h.titel)).toContain('zum echten');
    expect(db.hinweise.all().map((h) => h.titel)).not.toContain('zum Beispiel');
    expect(db.benachrichtigungen.where((b) => b.bezug?.id === bsp.id)).toHaveLength(0);
  });
});
