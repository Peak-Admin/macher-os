import { describe, expect, it } from 'vitest';
import { BUNDESLAENDER, feiertage, istArbeitstag } from '@core/kalender';
import { feiertageImJahr, istArbeitstagServer } from './feiertage';

describe('Feiertage auf dem Server', () => {
  it('stimmen mit @core/kalender überein – für jedes Bundesland und ohne', () => {
    for (const jahr of [2026, 2027, 2028, 2030]) {
      for (const land of [null, ...BUNDESLAENDER.map((b) => b.wert)]) {
        expect([...feiertageImJahr(jahr, land)].sort(), `${jahr} ${land}`).toEqual([...feiertage(jahr, land).keys()].sort());
      }
    }
  });
  it('Arbeitstage: Tag der Deutschen Einheit und Wochenende frei', () => {
    expect(istArbeitstagServer('2026-10-02', [1, 2, 3, 4, 5])).toBe(true);
    expect(istArbeitstagServer('2027-10-04', [1, 2, 3, 4, 5])).toBe(true);
    expect(istArbeitstagServer('2026-10-03', [1, 2, 3, 4, 5, 6])).toBe(false);
    expect(istArbeitstagServer('2026-11-18', [1, 2, 3, 4, 5], 'SN')).toBe(false);
    expect(istArbeitstagServer('2026-11-18', [1, 2, 3, 4, 5], 'HE')).toBe(istArbeitstag('2026-11-18', [1, 2, 3, 4, 5], 'HE'));
  });
});
