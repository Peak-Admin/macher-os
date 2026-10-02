import { describe, expect, it } from 'vitest';
import type { Abwesenheit, Termin } from '@core/objects';
import { feiertage, istArbeitstag, ostersonntag } from '@core/kalender';
import { arbeitstage, kollisionen, tageImJahr, ueberschneidung, urlaubskonto } from './daten';

const abw = (x: Partial<Abwesenheit>): Abwesenheit =>
  ({ id: Math.random().toString(), erstelltAm: '', geaendertAm: '', mitarbeiterId: 'm1', art: 'urlaub', von: '2026-01-01', bis: '2026-01-01', status: 'genehmigt', ...x }) as Abwesenheit;

describe('Feiertage & Arbeitstage', () => {
  it('berechnet Ostern richtig', () => {
    expect(ostersonntag(2024)).toBe('2024-03-31');
    expect(ostersonntag(2025)).toBe('2025-04-20');
    expect(ostersonntag(2026)).toBe('2026-04-05');
  });

  it('kennt die bundesweiten Feiertage', () => {
    const f = feiertage(2026);
    expect(f.has('2026-04-03')).toBe(true); // Karfreitag
    expect(f.has('2026-04-06')).toBe(true); // Ostermontag
    expect(f.has('2026-05-14')).toBe(true); // Christi Himmelfahrt
    expect(f.has('2026-05-25')).toBe(true); // Pfingstmontag
    expect(f.has('2026-10-03')).toBe(true);
    expect(f.size).toBe(9);
  });

  it('zählt nur Werktage ohne Feiertage', () => {
    expect(istArbeitstag('2026-10-03')).toBe(false); // Samstag + Feiertag
    expect(istArbeitstag('2026-10-02')).toBe(true);
    // Woche mit Ostermontag: Mo 06.04. frei → 4 Tage
    expect(arbeitstage('2026-04-06', '2026-04-12')).toBe(4);
    expect(arbeitstage('2026-10-05', '2026-10-09', true)).toBe(2.5);
    expect(arbeitstage('2026-10-09', '2026-10-05')).toBe(0);
  });

  it('schneidet Zeiträume am Jahreswechsel', () => {
    // 29.12.2025 (Mo) – 02.01.2026 (Fr): 2025 → 29., 30., 31. = 3; 2026 → 2. = 1 (1.1. Feiertag)
    const a = abw({ von: '2025-12-29', bis: '2026-01-02' });
    expect(tageImJahr(a, 2025)).toBe(3);
    expect(tageImJahr(a, 2026)).toBe(1);
  });
});

describe('Urlaubskonto', () => {
  it('rechnet Rest aus genehmigtem Urlaub, Beantragtes separat, Krankheit zählt nicht', () => {
    const liste = [
      abw({ von: '2026-08-03', bis: '2026-08-14' }), // 10 Tage
      abw({ von: '2026-12-21', bis: '2026-12-23', status: 'beantragt' }), // 3 Tage
      abw({ von: '2026-03-02', bis: '2026-03-03', art: 'krank' }), // 2 Kranktage
      abw({ von: '2026-06-01', bis: '2026-06-05', status: 'abgelehnt' }),
      abw({ mitarbeiterId: 'm2', von: '2026-08-03', bis: '2026-08-14' }),
    ];
    const k = urlaubskonto({ id: 'm1', urlaubstageJahr: 30 }, liste, 2026);
    expect(k).toEqual({ anspruch: 30, genehmigt: 10, beantragt: 3, rest: 20, kranktage: 2 });
  });

  it('erkennt Überschneidungen (abgelehnte zählen nicht)', () => {
    const liste = [abw({ id: 'a', von: '2026-08-03', bis: '2026-08-07' }), abw({ id: 'b', von: '2026-09-01', bis: '2026-09-02', status: 'abgelehnt' })];
    expect(ueberschneidung('m1', '2026-08-07', '2026-08-10', liste)?.id).toBe('a');
    expect(ueberschneidung('m1', '2026-09-01', '2026-09-01', liste)).toBeUndefined();
    expect(ueberschneidung('m1', '2026-08-07', '2026-08-10', liste, 'a')).toBeUndefined();
  });
});

describe('Kollisionen mit Terminen', () => {
  const termin = (x: Partial<Termin>): Termin =>
    ({ id: Math.random().toString(), erstelltAm: '', geaendertAm: '', art: 'einsatz', titel: 'T', start: '2026-10-05T07:00:00.000Z', ende: '2026-10-05T15:00:00.000Z', mitarbeiterIds: ['m1'], status: 'geplant', ...x }) as Termin;

  it('findet offene Termine des Mitarbeiters im Zeitraum', () => {
    const a = abw({ art: 'krank', von: '2026-10-05', bis: '2026-10-06' });
    const t = [
      termin({ id: 'drin' }),
      termin({ id: 'anderer', mitarbeiterIds: ['m2'] }),
      termin({ id: 'erledigt', status: 'erledigt' }),
      termin({ id: 'spaeter', start: '2026-10-08T07:00:00.000Z', ende: '2026-10-08T15:00:00.000Z' }),
    ];
    expect(kollisionen(a, t).map((x) => x.id)).toEqual(['drin']);
  });
});
