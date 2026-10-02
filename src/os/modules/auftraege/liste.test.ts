import { describe, expect, it } from 'vitest';
import type { Auftrag, Termin } from '@core/objects';
import { auftraegeFiltern, istBeteiligt, zeitraumGrenzen, zusatzFilterAnzahl, type ListenKontext } from './liste';

const basis = { erstelltAm: '2026-09-01T08:00:00Z', geaendertAm: '2026-09-01T08:00:00Z' };
const auftrag = (id: string, x: Partial<Auftrag> = {}): Auftrag => ({ ...basis, id, nummer: id, titel: `Auftrag ${id}`, art: 'projekt', phase: 'anfrage', kundeId: 'k1', ...x });
const termin = (auftragId: string, start: string, x: Partial<Termin> = {}): Termin => ({
  ...basis,
  id: `t-${auftragId}-${start}`,
  art: 'einsatz',
  titel: '',
  start: `${start}T08:00`,
  ende: `${start}T12:00`,
  auftragId,
  mitarbeiterIds: [],
  status: 'geplant',
  ...x,
});

const kunden: Record<string, { name: string }> = { k1: { name: 'Zander' }, k2: { name: 'Albers' } };
const kontext = (termine: Termin[] = [], meine: string[] = []): ListenKontext => ({
  heute: '2026-10-07', // Mittwoch
  meine: new Set(meine),
  kunde: (id) => kunden[id],
  ortText: () => undefined,
  termine: (id) => termine.filter((t) => t.auftragId === id),
});
const ids = (l: Auftrag[]) => l.map((a) => a.id);

describe('Auftragsliste filtern', () => {
  const alle = [
    auftrag('2610-001', { phase: 'in_arbeit', dringend: true, mitarbeiterIds: ['m1'] }),
    auftrag('2610-002', { phase: 'angebot', kundeId: 'k2', erstelltAm: '2026-10-06T08:00:00Z' }),
    auftrag('A-2026-0001', { phase: 'erledigt', abgeschlossenAm: '2026-09-20T08:00:00Z' }),
    auftrag('2609-004', { phase: 'verloren', verantwortlichId: 'm1' }),
  ];

  it('Schnellfilter wie bisher: aktiv, meine, abgeschlossen', () => {
    expect(ids(auftraegeFiltern(alle, {}, kontext()))).toEqual(['2610-001', '2610-002']);
    expect(ids(auftraegeFiltern(alle, { sicht: 'meine' }, kontext([], ['2610-002'])))).toEqual(['2610-002']);
    expect(ids(auftraegeFiltern(alle, { sicht: 'abgeschlossen' }, kontext()))).toEqual(['A-2026-0001', '2609-004']);
  });

  it('genaue Phase ersetzt aktiv/abgeschlossen, „Meine“ gilt weiter', () => {
    expect(ids(auftraegeFiltern(alle, { phase: 'verloren' }, kontext()))).toEqual(['2609-004']);
    expect(ids(auftraegeFiltern(alle, { phase: 'angebot', sicht: 'meine' }, kontext()))).toEqual([]);
  });

  it('Mitarbeiter: verantwortlich, im Team oder eingeplant', () => {
    const t = [termin('2610-002', '2026-10-08', { mitarbeiterIds: ['m2'] })];
    expect(ids(auftraegeFiltern(alle, { mitarbeiterId: 'm1', phase: 'verloren' }, kontext(t)))).toEqual(['2609-004']);
    expect(ids(auftraegeFiltern(alle, { mitarbeiterId: 'm1' }, kontext(t)))).toEqual(['2610-001']);
    expect(ids(auftraegeFiltern(alle, { mitarbeiterId: 'm2' }, kontext(t)))).toEqual(['2610-002']);
    expect(istBeteiligt(alle[0], 'm9', t)).toBe(false);
  });

  it('Zeitraum: Termin oder angelegt im Zeitraum', () => {
    const t = [termin('2610-001', '2026-10-30')];
    expect(ids(auftraegeFiltern(alle, { zeitraum: 'woche' }, kontext(t)))).toEqual(['2610-002']);
    expect(ids(auftraegeFiltern(alle, { zeitraum: 'monat' }, kontext(t)))).toEqual(['2610-001', '2610-002']);
    expect(ids(auftraegeFiltern(alle, { zeitraum: 'frei', von: '2026-10-20' }, kontext(t)))).toEqual(['2610-001']);
    expect(ids(auftraegeFiltern(alle, { zeitraum: 'monat' }, kontext([termin('2610-001', '2026-10-30', { status: 'abgesagt' })])))).toEqual(['2610-002']);
  });

  it('Suche findet die Nummer auch mit #', () => {
    expect(ids(auftraegeFiltern(alle, { q: '#2610-002' }, kontext()))).toEqual(['2610-002']);
    expect(ids(auftraegeFiltern(alle, { q: 'albers' }, kontext()))).toEqual(['2610-002']);
  });

  it('sortiert nach Nummer, Kunde, Neueste und Termin', () => {
    const offen = [auftrag('2610-002'), auftrag('2610-010', { kundeId: 'k2' }), auftrag('2609-099', { erstelltAm: '2026-10-05T08:00:00Z' })];
    expect(ids(auftraegeFiltern(offen, { sort: 'nummer' }, kontext()))).toEqual(['2610-010', '2610-002', '2609-099']);
    expect(ids(auftraegeFiltern(offen, { sort: 'kunde' }, kontext()))[0]).toBe('2610-010');
    expect(ids(auftraegeFiltern(offen, { sort: 'neueste' }, kontext()))[0]).toBe('2609-099');
    const t = [termin('2610-010', '2026-10-09'), termin('2609-099', '2026-10-08'), termin('2610-002', '2026-10-01')];
    expect(ids(auftraegeFiltern(offen, { sort: 'termin' }, kontext(t)))).toEqual(['2609-099', '2610-010', '2610-002']);
  });

  it('Standard: dringend zuerst', () => {
    expect(ids(auftraegeFiltern(alle, {}, kontext()))[0]).toBe('2610-001');
  });
});

describe('Zeitraum und Zähler', () => {
  it('kennt Woche (Mo–So) und Monat', () => {
    expect(zeitraumGrenzen({ zeitraum: 'woche' }, '2026-10-07')).toEqual({ von: '2026-10-05', bis: '2026-10-11' });
    expect(zeitraumGrenzen({ zeitraum: 'monat' }, '2026-02-10')).toEqual({ von: '2026-02-01', bis: '2026-02-28' });
    expect(zeitraumGrenzen({ zeitraum: 'frei' }, '2026-02-10')).toBeUndefined();
  });
  it('zählt nur gesetzte Zusatzfilter', () => {
    expect(zusatzFilterAnzahl({})).toBe(0);
    expect(zusatzFilterAnzahl({ phase: 'angebot', sort: 'wichtig', zeitraum: 'woche' })).toBe(2);
  });
});
