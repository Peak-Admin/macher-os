import { describe, expect, it } from 'vitest';
import { db } from '@core/db';
import { erledigt } from '@core/macher';
import { betrifft, erledigungenIm, minutenText, zeitraumStart, zusammenfassen } from './logik';
import { aufbauen, JETZT } from '../mein-tag/testdaten';

describe('Erledigt', () => {
  it('rechnet Zeiträume ab Montag bzw. 30 Tage zurück', () => {
    expect(zeitraumStart('heute', JETZT)).toBe('2026-10-02');
    expect(zeitraumStart('woche', JETZT)).toBe('2026-09-28'); // 2.10.2026 ist ein Freitag
    expect(zeitraumStart('monat', JETZT)).toBe('2026-09-03');
  });

  it('formuliert gesparte Zeit immer als Schätzung', () => {
    expect(minutenText(0)).toBe('–');
    expect(minutenText(12)).toBe('ca. 12 Min.');
    expect(minutenText(60)).toBe('ca. 1 Std.');
    expect(minutenText(80)).toBe('ca. 1 Std. 20 Min.');
  });

  it('fasst zusammen und zählt nur Einträge mit Schätzung', () => {
    aufbauen();
    erledigt('a', 'A', { minuten: 5 });
    erledigt('b', 'B');
    erledigt('c', 'C', { minuten: 3 });
    const s = zusammenfassen(erledigungenIm('heute', undefined));
    expect(s).toEqual({ anzahl: 3, minuten: 8, mitSchaetzung: 2 });
  });

  it('zeigt Monteuren nur, was sie betrifft', () => {
    const { chef, jonas, lukas, t } = aufbauen();
    const termin = t('07:00', '09:00', [jonas.id]);
    const a = erledigt('a', 'Termin Jonas', { bezug: { typ: 'termine', id: termin.id } });
    const b = erledigt('b', 'Rechnung', { bezug: { typ: 'rechnungen', id: 'r1' } });
    expect(betrifft(a, jonas)).toBe(true);
    expect(betrifft(a, lukas)).toBe(false);
    expect(betrifft(b, jonas)).toBe(false);
    expect(betrifft(b, chef)).toBe(true);
    expect(db.erledigungen.all()).toHaveLength(2);
  });
});
