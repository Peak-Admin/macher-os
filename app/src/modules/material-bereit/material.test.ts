import { describe, expect, it } from 'vitest';
import { naechsterEinsatz, pruefeMaterial, pruefeMaterialFuerTermin } from './daten';
import { auftrag, ctx, material, MO, termin } from '../autoplanung/testhilfe';
import type { Artikel } from '@core/objects';

const artikel = (id: string, bestand?: number): Artikel => ({ id, name: id, einheit: 'Stk', ek: 0, vk: 0, aktiv: true, bestand, erstelltAm: '', geaendertAm: '' });

describe('Material bereit?', () => {
  it('findet den nächsten Einsatz (keine Besichtigung, nichts Erledigtes)', () => {
    const c = ctx({
      termine: [
        termin('b', MO, '08:00', '09:00', { auftragId: 'a1', art: 'besichtigung' }),
        termin('alt', '2026-10-01', '08:00', '09:00', { auftragId: 'a1' }),
        termin('t2', '2026-10-07', '08:00', '09:00', { auftragId: 'a1' }),
        termin('t1', '2026-10-06', '08:00', '09:00', { auftragId: 'a1' }),
      ],
    });
    expect(naechsterEinsatz(c, 'a1')?.id).toBe('t1');
  });

  it('verteilt den Lagerbestand nach Einsatzdatum – der spätere Einsatz bekommt den Mangel', () => {
    const c = ctx({
      auftraege: [auftrag('frueh'), auftrag('spaet')],
      termine: [termin('t2', '2026-10-08', '08:00', '12:00', { auftragId: 'spaet' }), termin('t1', '2026-10-06', '08:00', '12:00', { auftragId: 'frueh' })],
      artikel: [artikel('kabel', 10)],
      material: [material('m1', 'frueh', { artikelId: 'kabel', menge: 8 }), material('m2', 'spaet', { artikelId: 'kabel', menge: 5 })],
    });
    const r = pruefeMaterial(c, 5);
    expect(r.map((x) => x.auftrag.id)).toEqual(['frueh', 'spaet']);
    expect(r[0].ergebnis).toBe('ok');
    expect(r[1].ergebnis).toBe('problem');
    expect(r[1].zeilen[0].fehlt).toBe(3);
    expect(r[1].zeilen[0].pruefung.loesung).toContain('07.10.2026');
  });

  it('bewertet bereit, bestellt, kein Lagerartikel und Vorlauf richtig', () => {
    const c = ctx({
      auftraege: [auftrag('a1')],
      termine: [termin('t1', '2026-10-08', '08:00', '12:00', { auftragId: 'a1' })],
      artikel: [artikel('frei')],
      material: [
        material('bereit', 'a1', { status: 'bereit' }),
        material('bestellt', 'a1', { status: 'bestellt' }),
        material('frei', 'a1', { artikelId: 'frei' }),
        material('weg', 'a1', { status: 'verbraucht' }),
      ],
    });
    const [r] = pruefeMaterial(c, 5);
    expect(r.zeilen.map((z) => z.pruefung.ergebnis)).toEqual(['ok', 'warnung', 'warnung']);
    expect(pruefeMaterial(c, 2)).toEqual([]);
    // am Vortag wird aus "bestellt" ein Problem
    const morgen = { ...c, heute: '2026-10-07' };
    expect(pruefeMaterial(morgen, 5)[0].zeilen[1].pruefung.ergebnis).toBe('problem');
  });

  it('liefert die Prüfung für einen Termin', () => {
    const c = ctx({
      auftraege: [auftrag('a1'), auftrag('leer')],
      termine: [termin('t1', '2026-10-08', '08:00', '12:00', { auftragId: 'a1' }), termin('t2', '2026-10-08', '13:00', '14:00', { auftragId: 'leer' })],
      artikel: [artikel('x', 0)],
      material: [material('m', 'a1', { artikelId: 'x', menge: 2 })],
    });
    expect(pruefeMaterialFuerTermin(c, c.termine[0])[0].ergebnis).toBe('problem');
    expect(pruefeMaterialFuerTermin(c, c.termine[1])[0].ergebnis).toBe('ok');
  });
});

describe('Material bereit? – Lösung bei Einsatz heute', () => {
  it('rät zum sofortigen Besorgen statt einem Datum in der Vergangenheit', () => {
    const c = ctx({
      auftraege: [auftrag('a1')],
      termine: [termin('t1', MO, '08:00', '12:00', { auftragId: 'a1' })],
      artikel: [artikel('x', 0)],
      material: [material('m', 'a1', { artikelId: 'x', menge: 2 })],
    });
    expect(pruefeMaterial(c, 5)[0].zeilen[0].pruefung.loesung).toContain('sofort');
  });
});
