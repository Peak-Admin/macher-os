import { describe, expect, it } from 'vitest';
import { BREITE_MAX, BREITE_MIN, BREITE_STANDARD, leisteBreite } from './seitenleiste';

describe('Breite der Seitenleiste', () => {
  it('bleibt zwischen 200 und 400 px', () => {
    expect(leisteBreite(120)).toBe(BREITE_MIN);
    expect(leisteBreite(999)).toBe(BREITE_MAX);
    expect(leisteBreite(300.4)).toBe(300);
  });
  it('fällt bei ungültigen Werten auf die Standardbreite zurück', () => {
    expect(leisteBreite(undefined)).toBe(BREITE_STANDARD);
    expect(leisteBreite('breit')).toBe(BREITE_STANDARD);
    expect(leisteBreite(Number.NaN)).toBe(BREITE_STANDARD);
  });
});
