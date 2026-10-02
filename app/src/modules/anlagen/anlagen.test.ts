import { describe, expect, it } from 'vitest';
import type { Anlage, Auftrag } from '@core/objects';
import { gewaehrleistungStatus, historie, naechsteWartungBerechnen, offenerWartungsauftrag, plusMonate, wartungFortschreiben, wartungsStatus } from './daten';

const anlage = (x: Partial<Anlage>): Anlage => ({ id: 'an', erstelltAm: '', geaendertAm: '', ortId: 'o', kundeId: 'k', typ: 'Gasheizung', ...x });
const auftrag = (x: Partial<Auftrag>): Auftrag => ({ id: 'a', erstelltAm: '2026-01-01', geaendertAm: '', nummer: 'A', titel: '', art: 'wartung', phase: 'beauftragt', kundeId: 'k', ...x });

describe('Anlagen: Wartung', () => {
  it('rechnet Monate inkl. Monatsende', () => {
    expect(plusMonate('2026-01-31', 1)).toBe('2026-02-28');
    expect(plusMonate('2026-10-02', 12)).toBe('2027-10-02');
    expect(plusMonate('2026-11-15', 3)).toBe('2027-02-15');
  });
  it('berechnet die nächste Wartung aus letzter Wartung oder Einbau', () => {
    expect(naechsteWartungBerechnen({ letzteWartung: '2026-03-01', wartungMonate: 12 })).toBe('2027-03-01');
    expect(naechsteWartungBerechnen({ eingebautAm: '2026-03-01', wartungMonate: 6 })).toBe('2026-09-01');
    expect(naechsteWartungBerechnen({ wartungMonate: 6 })).toBeUndefined();
  });
  it('bewertet den Wartungsstatus', () => {
    expect(wartungsStatus(anlage({ naechsteWartung: '2026-09-30' }), '2026-10-02')).toBe('ueberfaellig');
    expect(wartungsStatus(anlage({ naechsteWartung: '2026-10-20' }), '2026-10-02')).toBe('bald');
    expect(wartungsStatus(anlage({ naechsteWartung: '2027-01-01' }), '2026-10-02')).toBe('ok');
    expect(wartungsStatus(anlage({}), '2026-10-02')).toBe('keine');
  });
  it('schreibt die Wartung nach Erledigung fort', () => {
    expect(wartungFortschreiben(anlage({ wartungMonate: 12, letzteWartung: '2025-09-01' }), '2026-10-02')).toEqual({ letzteWartung: '2026-10-02', naechsteWartung: '2027-10-02' });
    expect(wartungFortschreiben(anlage({ letzteWartung: '2026-10-02' }), '2026-10-02')).toBeUndefined();
  });
});

describe('Anlagen: Gewährleistung & Historie', () => {
  it('bewertet die Gewährleistung', () => {
    expect(gewaehrleistungStatus(anlage({ gewaehrleistungBis: '2026-10-20' }), '2026-10-02')).toBe('endet_bald');
    expect(gewaehrleistungStatus(anlage({ gewaehrleistungBis: '2026-01-01' }), '2026-10-02')).toBe('abgelaufen');
    expect(gewaehrleistungStatus(anlage({}), '2026-10-02')).toBe('keine');
  });
  it('findet Aufträge mit der Anlage, neueste zuerst', () => {
    const liste = [auftrag({ id: '1', anlageIds: ['an'], erstelltAm: '2025-01-01' }), auftrag({ id: '2', anlageIds: ['x'] }), auftrag({ id: '3', anlageIds: ['an'], erstelltAm: '2026-05-01' })];
    expect(historie('an', liste).map((a) => a.id)).toEqual(['3', '1']);
  });
  it('findet nur offene Wartungsaufträge', () => {
    expect(offenerWartungsauftrag('an', [auftrag({ anlageIds: ['an'], phase: 'erledigt' })])).toBeUndefined();
    expect(offenerWartungsauftrag('an', [auftrag({ anlageIds: ['an'] })])?.id).toBe('a');
    expect(offenerWartungsauftrag('an', [auftrag({ anlageIds: ['an'], art: 'kundendienst' })])).toBeUndefined();
  });
});
