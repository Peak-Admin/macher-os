import { beforeEach, describe, expect, it } from 'vitest';
import { zuruecksetzen } from '@core/db';
import type { Abwesenheit, Mitarbeiter, Zeiteintrag } from '@core/objects';
import { tageKurz, zeitraumSumme } from './zusammenfassung';

let n = 0;
const z = (x: Partial<Zeiteintrag>): Zeiteintrag =>
  ({
    id: `z${n++}`,
    erstelltAm: '',
    geaendertAm: '',
    mitarbeiterId: 'm1',
    datum: '2026-10-05',
    start: '07:00',
    ende: '15:00',
    pauseMinuten: 30,
    art: 'arbeit',
    ...x,
  }) as Zeiteintrag;

const ma = (x: Partial<Mitarbeiter> = {}): Mitarbeiter =>
  ({
    id: 'm1',
    erstelltAm: '',
    geaendertAm: '',
    vorname: 'Jonas',
    nachname: 'Becker',
    rolle: 'monteur',
    wochenstunden: 40,
    urlaubstageJahr: 30,
    kostensatz: 0,
    aktiv: true,
    ...x,
  }) as Mitarbeiter;

const abw = (x: Partial<Abwesenheit>): Abwesenheit =>
  ({
    id: `a${n++}`,
    erstelltAm: '',
    geaendertAm: '',
    mitarbeiterId: 'm1',
    art: 'urlaub',
    von: '2026-10-07',
    bis: '2026-10-07',
    status: 'genehmigt',
    ...x,
  }) as Abwesenheit;

const ARBEITSTAGE = [1, 2, 3, 4, 5];
// KW 41/2026: Mo 05.10. – So 11.10., kein Feiertag
const MO = '2026-10-05';
const SO = '2026-10-11';

beforeEach(() => zuruecksetzen());

describe('Zeitraum-Übersicht', () => {
  it('ist leer, wenn nichts gebucht ist', () => {
    const s = zeitraumSumme([ma()], MO, SO, {
      zeiten: [],
      abw: [],
      modelle: [],
      arbeitstage: ARBEITSTAGE,
    });
    expect(s).toMatchObject({ arbeit: 0, fahrt: 0, eintraege: 0, leer: true });
    expect(s.urlaub).toEqual({ tage: 0, minuten: 0 });
  });

  it('trennt Arbeitszeit und Fahrzeit nach der Pausenregel', () => {
    const zeiten = [
      z({ start: '07:00', ende: '07:30', pauseMinuten: 0, art: 'fahrt' }),
      z({ start: '07:30', ende: '15:30', pauseMinuten: 30, art: 'arbeit' }),
      z({
        datum: '2026-10-06',
        start: '07:00',
        ende: '11:00',
        pauseMinuten: 0,
        art: 'werkstatt',
      }),
    ];
    const s = zeitraumSumme([ma()], MO, SO, {
      zeiten,
      abw: [],
      modelle: [],
      arbeitstage: ARBEITSTAGE,
      autoPause: true,
    });
    expect(s.fahrt).toBe(30);
    expect(s.baustelle).toBe(450);
    expect(s.intern).toBe(240);
    expect(s.arbeit).toBe(450 + 240);
    expect(s.eintraege).toBe(3);
    expect(s.leer).toBe(false);
  });

  it('zieht fehlende Pausen nach ArbZG ab wie im Stundenkonto', () => {
    const s = zeitraumSumme([ma()], MO, SO, {
      zeiten: [z({ start: '07:00', ende: '14:00', pauseMinuten: 0 })],
      abw: [],
      modelle: [],
      arbeitstage: ARBEITSTAGE,
      autoPause: true,
    });
    expect(s.arbeit).toBe(420 - 30);
  });

  it('zählt nur Zeiten im Zeitraum und nur der gewählten Mitarbeiter', () => {
    const zeiten = [z({}), z({ datum: '2026-10-12' }), z({ mitarbeiterId: 'm2' }), z({ geloeschtAm: '2026-10-05T10:00:00Z' })];
    const s = zeitraumSumme([ma()], MO, SO, {
      zeiten,
      abw: [],
      modelle: [],
      arbeitstage: ARBEITSTAGE,
    });
    expect(s.eintraege).toBe(1);
    const team = zeitraumSumme([ma(), ma({ id: 'm2' })], MO, SO, {
      zeiten,
      abw: [],
      modelle: [],
      arbeitstage: ARBEITSTAGE,
    });
    expect(team.eintraege).toBe(2);
    expect(team.arbeit).toBe(2 * 450);
  });

  it('laufende Zeiten zählen nur bis jetzt, ohne „jetzt“ gar nicht', () => {
    const zeiten = [z({ ende: undefined, pauseMinuten: 0 })];
    expect(
      zeitraumSumme([ma()], MO, SO, {
        zeiten,
        abw: [],
        modelle: [],
        arbeitstage: ARBEITSTAGE,
      }).arbeit,
    ).toBe(0);
    const s = zeitraumSumme([ma()], MO, SO, {
      zeiten,
      abw: [],
      modelle: [],
      arbeitstage: ARBEITSTAGE,
      jetzt: { datum: MO, uhr: '09:00' },
    });
    expect(s.arbeit).toBe(120);
    expect(s.laufend).toBe(1);
  });

  it('rechnet Urlaub, Krank und Überstundenabbau in Tagen und Soll-Stunden', () => {
    const liste = [
      abw({ art: 'urlaub', von: '2026-10-07', bis: '2026-10-08' }),
      abw({
        art: 'krank',
        von: '2026-10-09',
        bis: '2026-10-09',
        halbtags: true,
      }),
      abw({ art: 'frei', von: '2026-10-05', bis: '2026-10-05' }),
      // Wochenende ohne Soll zählt nicht
      abw({ art: 'urlaub', von: '2026-10-10', bis: '2026-10-11' }),
      // nur Genehmigtes zählt
      abw({
        art: 'urlaub',
        von: '2026-10-06',
        bis: '2026-10-06',
        status: 'beantragt',
      }),
      // andere Arten bleiben außen vor
      abw({ art: 'schule', von: '2026-10-06', bis: '2026-10-06' }),
    ];
    const s = zeitraumSumme([ma()], MO, SO, {
      zeiten: [],
      abw: liste,
      modelle: [],
      arbeitstage: ARBEITSTAGE,
    });
    expect(s.urlaub).toEqual({ tage: 2, minuten: 2 * 480 });
    expect(s.krank).toEqual({ tage: 0.5, minuten: 240 });
    expect(s.abbau).toEqual({ tage: 1, minuten: 480 });
    expect(s.leer).toBe(false);
  });

  it('nimmt die Soll-Stunden aus dem Arbeitszeitmodell (Teilzeit)', () => {
    const modelle = [
      {
        id: 'mo1',
        erstelltAm: '',
        geaendertAm: '',
        mitarbeiterId: 'm1',
        gueltigAb: '2000-01-01',
        minuten: [360, 360, 360, 360, 0, 0, 0],
      },
    ];
    const s = zeitraumSumme([ma({ wochenstunden: 24 })], MO, SO, {
      zeiten: [],
      abw: [abw({ art: 'urlaub', von: '2026-10-08', bis: '2026-10-09' })],
      modelle,
      arbeitstage: ARBEITSTAGE,
    });
    // Freitag hat im Modell kein Soll → nur 1 Urlaubstag
    expect(s.urlaub).toEqual({ tage: 1, minuten: 360 });
  });

  it('gibt bei leerem Zeitraum nichts zurück', () => {
    expect(
      zeitraumSumme([ma()], SO, MO, {
        zeiten: [z({})],
        abw: [],
        modelle: [],
        arbeitstage: ARBEITSTAGE,
      }).leer,
    ).toBe(true);
  });

  it('formatiert Tage', () => {
    expect(tageKurz(1)).toBe('1 Tag');
    expect(tageKurz(2.5)).toBe('2,5 Tage');
    expect(tageKurz(0)).toBe('0 Tage');
  });
});
