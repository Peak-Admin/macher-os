import { beforeEach, describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import { registriereModule, defineModul } from '@core/modul';
import { eigeneTreffer, gruppieren, merkeSuche, ohneDoppelte } from './daten';

describe('Suche', () => {
  beforeEach(() => {
    zuruecksetzen();
    registriereModule([
      defineModul({ id: 'r', titel: 'R', bereich: 'betrieb', beschreibung: '', detail: [{ objekt: 'rechnungen', pfad: (id) => `/r/${id}` }] }),
      defineModul({ id: 'a', titel: 'A', bereich: 'auftraege', beschreibung: '', detail: [{ objekt: 'auftraege', pfad: (id) => `/a/${id}` }] }),
    ]);
  });

  it('findet Rechnungsnummern exakt zuerst', () => {
    const k = db.kunden.create({ art: 'privat', name: 'Schulz', ansprechpartner: [] });
    db.rechnungen.create({ nummer: 'R-2026-0012', art: 'rechnung', kundeId: k.id, titel: 'Bad', positionen: [], status: 'versendet', datum: '2026-10-01', faelligAm: '2026-10-15', mahnstufe: 0 });
    db.rechnungen.create({ nummer: 'R-2026-0001', art: 'rechnung', kundeId: k.id, titel: 'Küche', positionen: [], status: 'versendet', datum: '2026-10-01', faelligAm: '2026-10-15', mahnstufe: 0 });
    const t = eigeneTreffer('R-2026-0012');
    expect(t[0]).toMatchObject({ typ: 'Rechnung', relevanz: 95 });
    expect(eigeneTreffer('schulz').filter((x) => x.typ === 'Rechnung')).toHaveLength(2);
  });

  it('verlinkt Termine ohne Kalender-Modul auf den Auftrag und lässt unverlinkbare weg', () => {
    const k = db.kunden.create({ art: 'privat', name: 'Hoffmann', ansprechpartner: [] });
    const a = db.auftraege.create({ nummer: 'A-1', titel: 'Wartung', art: 'wartung', phase: 'beauftragt', kundeId: k.id });
    db.termine.create({ art: 'wartung', titel: 'Wartung Hoffmann', auftragId: a.id, start: '2026-10-02T08:00:00.000Z', ende: '2026-10-02T09:00:00.000Z', mitarbeiterIds: [], status: 'geplant' });
    db.termine.create({ art: 'intern', titel: 'Wartung intern', start: '2026-10-02T08:00:00.000Z', ende: '2026-10-02T09:00:00.000Z', mitarbeiterIds: [], status: 'geplant' });
    const t = eigeneTreffer('wartung');
    expect(t).toHaveLength(1);
    expect(t[0].pfad).toBe(`/a/${a.id}`);
  });

  it('entfernt Doppelte und gruppiert nach Typ', () => {
    const liste = ohneDoppelte([
      { typ: 'Kunde', titel: 'A', pfad: '/k/1', relevanz: 60 },
      { typ: 'Kunde', titel: 'A (alt)', pfad: '/k/1', relevanz: 20 },
      { typ: 'Rechnung', titel: 'R', pfad: '/r/1', relevanz: 95 },
      { typ: 'Kunde', titel: 'B', pfad: '/k/2', relevanz: 50 },
    ]);
    expect(liste.map((t) => t.titel)).toEqual(['R', 'A', 'B']);
    expect(gruppieren(liste).map((g) => [g.typ, g.treffer.length])).toEqual([['Rechnung', 1], ['Kunde', 2]]);
  });

  it('merkt sich die letzten Suchen', () => {
    let l: string[] = [];
    for (const q of ['hoffmann', 'R-2026', 'Hoffmann', 'x']) l = merkeSuche(l, q);
    expect(l).toEqual(['Hoffmann', 'R-2026']);
  });
});
