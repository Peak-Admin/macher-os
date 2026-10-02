import { describe, expect, it } from 'vitest';
import { aktiveFilter, imZeitraum, istZeitraum, zeitraumAb } from './liste';

describe('Angebotsliste: Zeitraum', () => {
  it('berechnet den Beginn', () => {
    expect(zeitraumAb('monat', '2026-10-02')).toBe('2026-10-01');
    expect(zeitraumAb('jahr', '2026-10-02')).toBe('2026-01-01');
    expect(zeitraumAb('quartal', '2026-10-02')).toBe('2026-07-02');
    expect(zeitraumAb('quartal', '2026-05-31')).toBe('2026-02-28');
    expect(zeitraumAb('quartal', '2026-02-15')).toBe('2025-11-15');
    expect(zeitraumAb('alle', '2026-10-02')).toBeUndefined();
  });

  it('filtert Angebotsdaten', () => {
    expect(imZeitraum('2026-09-30', 'monat', '2026-10-02')).toBe(false);
    expect(imZeitraum('2026-10-01', 'monat', '2026-10-02')).toBe(true);
    expect(imZeitraum('2026-07-02', 'quartal', '2026-10-02')).toBe(true);
    expect(imZeitraum('2026-07-01', 'quartal', '2026-10-02')).toBe(false);
    expect(imZeitraum('2025-12-31', 'jahr', '2026-10-02')).toBe(false);
    expect(imZeitraum('2019-01-01', 'alle', '2026-10-02')).toBe(true);
  });

  it('prüft URL-Werte und zählt Zusatzfilter', () => {
    expect([istZeitraum('monat'), istZeitraum('woche'), istZeitraum(null)]).toEqual([true, false, false]);
    expect(aktiveFilter({ zeit: 'alle' })).toBe(0);
    expect(aktiveFilter({ zeit: 'jahr', auftragId: 'a1' })).toBe(2);
  });
});
