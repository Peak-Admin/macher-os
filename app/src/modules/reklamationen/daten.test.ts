import { describe, expect, it } from 'vitest';
import { db } from '@core/db';
import { nacharbeitAnlegen, pruefeGewaehrleistung, pruefen, reklamationen, statusAusNacharbeit } from './daten';

describe('Gewährleistung prüfen', () => {
  it('BGB Bauwerk: 5 Jahre ab Abnahme', () => {
    const p = pruefeGewaehrleistung({ gemeldetAm: '2026-10-02', grundlage: 'bgb_bau', abnahmeAm: '2022-03-15' });
    expect(p.ergebnis).toBe('gewaehrleistung');
    expect(p.bis).toBe('2027-03-14');
  });

  it('BGB sonstige Arbeiten: 2 Jahre – danach kostenpflichtig', () => {
    const p = pruefeGewaehrleistung({ gemeldetAm: '2026-10-02', grundlage: 'bgb', abnahmeAm: '2024-09-01' });
    expect(p.ergebnis).toBe('kostenpflichtig');
    expect(p.restTage).toBeLessThan(0);
  });

  it('VOB/B Bauwerk: 4 Jahre', () => {
    expect(pruefeGewaehrleistung({ gemeldetAm: '2026-10-02', grundlage: 'vob_bau', abnahmeAm: '2022-10-03' }).bis).toBe('2026-10-02');
  });

  it('Gewährleistungsende der Anlage hat Vorrang, ohne Datum ist es unklar', () => {
    expect(pruefeGewaehrleistung({ gemeldetAm: '2026-10-02', grundlage: 'bgb_bau', abnahmeAm: '2025-01-01', anlageGewaehrleistungBis: '2026-01-01' }).ergebnis).toBe('kostenpflichtig');
    expect(pruefeGewaehrleistung({ gemeldetAm: '2026-10-02', grundlage: 'bgb' }).ergebnis).toBe('unklar');
  });
});

describe('Nacharbeit', () => {
  it('nimmt das Abschlussdatum aus dem Auftrag und legt Nacharbeit genau einmal an', () => {
    const a = db.auftraege.create({ nummer: 'A-1', titel: 'Bad', art: 'projekt', phase: 'erledigt', kundeId: 'k1', ortId: 'o1', abgeschlossenAm: '2025-06-30T10:00:00.000Z' });
    const r = reklamationen.create({ nummer: 'RK-1', titel: 'Fuge gerissen', kundeId: 'k1', auftragId: a.id, gemeldetAm: '2026-10-01', grundlage: 'bgb_bau', bewertung: 'gewaehrleistung', status: 'neu' });
    expect(pruefen(r).ergebnis).toBe('gewaehrleistung');
    const n = nacharbeitAnlegen(r.id)!;
    expect(n.art).toBe('reklamation');
    expect(n.phase).toBe('beauftragt');
    expect(n.ortId).toBe('o1');
    expect(nacharbeitAnlegen(r.id)!.id).toBe(n.id);
    expect(reklamationen.get(r.id)!.status).toBe('in_arbeit');
    expect(statusAusNacharbeit(reklamationen.get(r.id)!, { ...n, phase: 'erledigt' })).toBe('erledigt');
  });
});
