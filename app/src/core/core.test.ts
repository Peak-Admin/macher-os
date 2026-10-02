import { describe, expect, it } from 'vitest';
import { db, defineCollection } from './db';
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
