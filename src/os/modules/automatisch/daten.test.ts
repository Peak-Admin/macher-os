import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import { defineModul, registriereModule } from '@core/modul';
import { setzeAutomation } from '@core/macher';
import { INTERVALL_MS, PRUEFUNG_ID, pruefeAlle, pruefungAutomation, statistik, zeitText } from './daten';
import type { Erledigung } from '@core/objects';

const e = (regel: string, tageAlt: number, minuten?: number): Erledigung => ({
  id: Math.random().toString(),
  regel,
  titel: 'x',
  minutenGespart: minuten,
  erstelltAm: new Date(Date.now() - tageAlt * 86_400_000).toISOString(),
  geaendertAm: '',
});

describe('Automatisch erledigen', () => {
  let laeufe = 0;
  beforeEach(() => {
    zuruecksetzen();
    laeufe = 0;
    db.betrieb.create({ id: 'betrieb', name: 'T', gewerk: 'elektro', arbeitsweisen: [], teamgroesse: 1, adresse: { strasse: '', plz: '', ort: '' }, telefon: '', email: '', stundensatz: 0, zahlungszielTage: 14, ustSatz: 19, arbeitsbeginn: '07:00', arbeitsende: '16:00', onboardingFertig: true });
    registriereModule([
      defineModul({
        id: 'test',
        titel: 'Test',
        bereich: 'betrieb',
        beschreibung: '',
        automationen: [
          { id: 'test.an', titel: 'An', beschreibung: '', standardAn: true, start: () => () => {}, pruefen: () => laeufe++ },
          { id: 'test.aus', titel: 'Aus', beschreibung: '', standardAn: false, start: () => () => {}, pruefen: () => (laeufe += 100) },
        ],
      }),
      defineModul({ id: 'automatisch', titel: 'A', bereich: 'macher', beschreibung: '', automationen: [pruefungAutomation] }),
    ]);
  });
  afterEach(() => vi.useRealTimers());

  it('zählt Ausführungen und geschätzte Minuten je Regel', () => {
    const liste = [e('a', 1, 5), e('a', 3, 5), e('a', 40, 5), e('b', 1)];
    const seit = new Date(Date.now() - 30 * 86_400_000).toISOString();
    expect(statistik(liste, 'a', seit)).toMatchObject({ anzahl: 2, minuten: 10 });
    expect(statistik(liste, 'c', seit)).toEqual({ anzahl: 0, minuten: 0, zuletzt: undefined });
    expect(zeitText(0)).toBe('–');
    expect(zeitText(20)).toBe('ca. 20 Min.');
    expect(zeitText(150)).toBe('ca. 2,5 Std.');
  });

  it('prüft nur eingeschaltete Regeln und protokolliert einmal am Tag', () => {
    expect(pruefeAlle()).toBe(1);
    expect(laeufe).toBe(1);
    pruefeAlle();
    expect(laeufe).toBe(2);
    expect(db.erledigungen.where((x) => x.regel === PRUEFUNG_ID)).toHaveLength(1);
  });

  it('läuft alle 30 Minuten, solange die Regel an ist', () => {
    vi.useFakeTimers();
    setzeAutomation(PRUEFUNG_ID, true);
    vi.advanceTimersByTime(INTERVALL_MS * 2);
    expect(laeufe).toBe(2);
    setzeAutomation(PRUEFUNG_ID, false);
    vi.advanceTimersByTime(INTERVALL_MS * 2);
    expect(laeufe).toBe(2);
  });
});
