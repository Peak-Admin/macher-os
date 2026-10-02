import { plusMonate } from '@core/format';
import { describe, expect, it } from 'vitest';
import { db } from '@core/db';
import { intervallText, regelText, vorkommen } from './regel';
import { abwesenheitsKonflikte, serieBeenden, serien, serienTermine, terminAuslassen, termineErzeugen, terminVerschieben, terminDatum } from './daten';

describe('Wiederholungsregeln', () => {
  it('rechnet Monate mit Monatsende', () => {
    expect(plusMonate('2026-01-31', 1)).toBe('2026-02-28');
    expect(plusMonate('2028-01-31', 1)).toBe('2028-02-29');
    expect(plusMonate('2026-01-31', 2)).toBe('2026-03-31');
    expect(plusMonate('2026-11-15', 3)).toBe('2027-02-15');
    expect(plusMonate('2026-03-31', -1)).toBe('2026-02-28');
  });

  it('der 31. wandert nicht auf den 28.', () => {
    const v = vorkommen('2026-01-31', { art: 'monatlich', alle: 1 }, '2026-01-01', '2026-05-31');
    expect(v).toEqual(['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30', '2026-05-31']);
  });

  it('wöchentlich, alle 2 Wochen, mit Ende', () => {
    const v = vorkommen('2026-10-06', { art: 'woechentlich', alle: 2 }, '2026-10-01', '2026-12-31', '2026-11-10');
    expect(v).toEqual(['2026-10-06', '2026-10-20', '2026-11-03']);
  });

  it('jährlich und alle N Monate, Einstieg mitten in der Serie', () => {
    expect(vorkommen('2020-03-15', { art: 'jaehrlich', alle: 1 }, '2026-01-01', '2027-12-31')).toEqual(['2026-03-15', '2027-03-15']);
    expect(vorkommen('2025-01-10', { art: 'monate', alle: 6 }, '2026-01-01', '2026-12-31')).toEqual(['2026-01-10', '2026-07-10']);
  });

  it('beschreibt Regeln in Handwerkersprache', () => {
    expect(regelText('2026-10-06', { art: 'woechentlich', alle: 1 })).toBe('Jede Woche am Dienstag');
    expect(regelText('2026-10-15', { art: 'monate', alle: 6 })).toBe('Alle 6 Monate am 15.');
    expect(intervallText(12)).toBe('jährlich');
    expect(intervallText(24)).toBe('alle 2 Jahre');
  });
});

describe('Serien erzeugen Termine', () => {
  const neu = () =>
    serien.create({
      titel: 'Sichtprüfung',
      regel: { art: 'monatlich', alle: 1 },
      start: '2026-10-05',
      uhrzeit: '08:00',
      dauerMinuten: 60,
      terminArt: 'wartung',
      mitarbeiterIds: ['m1'],
      ausnahmen: [],
      erzeugt: [],
    });

  it('legt Termine bis zum Horizont an – idempotent', () => {
    const s = neu();
    expect(termineErzeugen(s, '2026-10-01', 3)).toBe(3); // 5.10., 5.11., 5.12.
    expect(termineErzeugen(serien.get(s.id)!, '2026-10-01', 3)).toBe(0);
    const t = serienTermine(s.id);
    expect(t.map((x) => terminDatum(x.start))).toEqual(['2026-10-05', '2026-11-05', '2026-12-05']);
    expect(new Date(t[0].ende).getTime() - new Date(t[0].start).getTime()).toBe(3_600_000);
  });

  it('Auslassen und Verschieben erzeugen den Termin nicht neu', () => {
    const s = neu();
    termineErzeugen(s, '2026-10-01', 3);
    const [a, b] = serienTermine(s.id);
    terminAuslassen(a.id);
    terminVerschieben(b.id, '2026-11-07', '10:00');
    expect(termineErzeugen(serien.get(s.id)!, '2026-10-01', 3)).toBe(0);
    expect(serien.get(s.id)!.ausnahmen).toEqual(['2026-10-05']);
    expect(serienTermine(s.id).map((x) => terminDatum(x.start))).toEqual(['2026-11-07', '2026-12-05']);
  });

  it('Serie beenden räumt künftige Termine weg', () => {
    const s = neu();
    termineErzeugen(s, '2026-10-01', 3);
    expect(serieBeenden(s.id, '2026-10-20')).toBe(2);
    expect(termineErzeugen(serien.get(s.id)!, '2026-10-21', 6)).toBe(0);
  });

  it('meldet Abwesenheiten bei Serienterminen', () => {
    const s = neu();
    termineErzeugen(s, '2026-10-01', 2);
    db.abwesenheiten.create({ mitarbeiterId: 'm1', art: 'urlaub', von: '2026-11-03', bis: '2026-11-10', status: 'beantragt' });
    const k = abwesenheitsKonflikte('2026-10-01', 60).filter((x) => x.serieId === s.id);
    expect(k).toHaveLength(1);
    expect(k[0].datum).toBe('2026-11-05');
    expect(k[0].beantragt).toBe(true);
  });
});

describe('Werktage', () => {
  it('schiebt Samstag/Sonntag auf Montag', async () => {
    const { werktag } = await import('./regel');
    expect(werktag('2026-12-19')).toBe('2026-12-21');
    expect(werktag('2026-12-20')).toBe('2026-12-21');
    expect(werktag('2026-12-18')).toBe('2026-12-18');
  });
});
