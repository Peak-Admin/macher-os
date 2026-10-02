import { beforeEach, describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import { registriereModule, defineModul } from '@core/modul';
import { ALLE, artFilter, bezugAus, eigeneTreffer, gruppieren, merkeGeoeffnet, merkeSuche, ohneDoppelte, schnellaktion, sortieren } from './daten';

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

  it('zeigt nur Arten mit Treffern als Filter, mit Zähler', () => {
    const chips = artFilter([
      { typ: 'Kunde', titel: 'A', pfad: '/k/1' },
      { typ: 'Rechnung', titel: 'R', pfad: '/r/1' },
      { typ: 'Kunde', titel: 'B', pfad: '/k/2' },
    ]);
    expect(chips).toEqual([
      { wert: ALLE, label: 'Alle', zaehler: 3 },
      { wert: 'Kunde', label: 'Kunden', zaehler: 2 },
      { wert: 'Rechnung', label: 'Rechnungen', zaehler: 1 },
    ]);
    const viele = ['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((typ) => ({ typ, titel: typ, pfad: `/${typ}` }));
    expect(artFilter(viele).map((c) => c.wert)).toEqual([ALLE, 'A', 'B', 'C', 'D', 'E']);
  });

  it('sortiert nach Neueste, Treffer ohne Datum danach in Relevanz-Reihenfolge', () => {
    const liste = [
      { typ: 'Funktion', titel: 'F', pfad: '/f' },
      { typ: 'Kunde', titel: 'alt', pfad: '/k/1' },
      { typ: 'Kunde', titel: 'neu', pfad: '/k/2' },
      { typ: 'Einstellung', titel: 'E', pfad: '/e' },
    ];
    const zeit = (t: { pfad: string }) => ({ '/k/1': '2026-01-01', '/k/2': '2026-09-01' })[t.pfad];
    expect(sortieren(liste, 'relevanz', zeit)).toBe(liste);
    expect(sortieren(liste, 'neueste', zeit).map((t) => t.titel)).toEqual(['neu', 'alt', 'F', 'E']);
  });

  it('findet das Objekt hinter einem Treffer und bietet je Art eine passende Nebenaktion', () => {
    const mitTel = db.kunden.create({ art: 'privat', name: 'Schulz', telefon: '0171 / 123 45', ansprechpartner: [] });
    const ohneTel = db.kunden.create({ art: 'privat', name: 'Meier', ansprechpartner: [] });
    const a = db.auftraege.create({ nummer: 'A-1', titel: 'Bad', art: 'projekt', phase: 'beauftragt', kundeId: mitTel.id });
    const r = db.rechnungen.create({ nummer: 'R-1', art: 'rechnung', kundeId: mitTel.id, titel: 'Bad', positionen: [], status: 'versendet', datum: '2026-10-01', faelligAm: '2026-10-15', mahnstufe: 0 });
    const alles = { geld: true, schreiben: true, zeit: true };
    const kb = bezugAus({ typ: 'Kunde', titel: 'Schulz', pfad: `/auftraege/kunden/${mitTel.id}` });
    expect(kb).toEqual({ typ: 'kunden', id: mitTel.id });
    expect(bezugAus({ typ: 'Kunde', titel: 'weg', pfad: '/auftraege/kunden/gibtsnicht' })).toBeUndefined();
    expect(bezugAus({ typ: 'Funktion', titel: 'x', pfad: '/betrieb/x' })).toBeUndefined();
    expect(schnellaktion(kb, alles)).toMatchObject({ label: 'Anrufen', href: 'tel:017112345' });
    expect(schnellaktion({ typ: 'kunden', id: ohneTel.id }, alles)).toMatchObject({ label: 'Auftrag anlegen', to: `/auftraege/auftraege/neu?kunde=${ohneTel.id}` });
    expect(schnellaktion({ typ: 'auftraege', id: a.id }, alles)).toMatchObject({ label: 'Zeit erfassen', erfassen: { aktion: 'zeit', auftragId: a.id } });
    expect(schnellaktion({ typ: 'rechnungen', id: r.id }, alles)).toMatchObject({ label: 'PDF', fenster: `/druck/rechnung/${r.id}` });
    // ohne Geld-Recht kein PDF, ohne Zeiterfassung kein „Zeit erfassen“
    expect(schnellaktion({ typ: 'rechnungen', id: r.id }, { ...alles, geld: false })).toBeUndefined();
    expect(schnellaktion({ typ: 'auftraege', id: a.id }, { ...alles, zeit: false })).toBeUndefined();
  });

  it('merkt sich zuletzt geöffnete Treffer ohne Doppelte, höchstens fünf', () => {
    let l: { titel: string; typ: string; pfad: string }[] = [];
    for (const n of [1, 2, 3, 4, 5, 6, 2]) l = merkeGeoeffnet(l, { titel: `T${n}`, typ: 'Kunde', pfad: `/k/${n}` });
    expect(l.map((x) => x.pfad)).toEqual(['/k/2', '/k/6', '/k/5', '/k/4', '/k/3']);
  });
});
