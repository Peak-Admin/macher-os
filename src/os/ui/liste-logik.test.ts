import { describe, expect, it } from 'vitest';
import { uhrLesen, uhrMinuten, uhrzeiten } from './liste-logik';

describe('uhrLesen', () => {
  it('liest übliche Schreibweisen', () => {
    expect(uhrLesen('8')).toBe('08:00');
    expect(uhrLesen('830')).toBe('08:30');
    expect(uhrLesen('0830')).toBe('08:30');
    expect(uhrLesen('8:30')).toBe('08:30');
    expect(uhrLesen('8.3')).toBe('08:30');
    expect(uhrLesen('16,45 Uhr')).toBe('16:45');
    expect(uhrLesen('17 Uhr')).toBe('17:00');
    expect(uhrLesen('24')).toBe('00:00');
  });
  it('leer leert, Unsinn ist ungültig', () => {
    expect(uhrLesen('  ')).toBe('');
    expect(uhrLesen('25')).toBeUndefined();
    expect(uhrLesen('8:75')).toBeUndefined();
    expect(uhrLesen('morgens')).toBeUndefined();
  });
});

describe('uhrzeiten', () => {
  it('erzeugt den Tag im Takt', () => {
    const z = uhrzeiten(15);
    expect(z).toHaveLength(96);
    expect(z[0]).toBe('00:00');
    expect(z[33]).toBe('08:15');
    expect(uhrMinuten('08:15')).toBe(495);
  });
});
