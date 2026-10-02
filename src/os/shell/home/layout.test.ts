import { describe, expect, it } from 'vitest';
import { baender, groesseSetzen, kannSchritt, mobileReihenfolge, normalisieren, schritt, sichtbare, sichtbarSetzen, spalteSetzen, standardLayout, verschieben } from './layout';
import type { HomeLayout, WidgetDefinition } from './typen';

const def = (id: string, extra: Partial<WidgetDefinition> = {}): WidgetDefinition => ({
  id,
  name: id,
  description: '',
  icon: 'info',
  kategorie: 'kern',
  component: () => null,
  availableSizes: ['klein', 'gross'],
  defaultSize: 'klein',
  ...extra,
});

const DEFS = [def('naechster-schritt'), def('arbeit'), def('ansprechpartner', { defaultSpalte: 'rechts' }), def('neu', { defaultSpalte: 'rechts' }), def('notiz', { availableSizes: ['klein'] }), def('zahlen')];
const ids = (l: HomeLayout) => sichtbare(l).map((w) => w.widgetId);

describe('Standard-Home', () => {
  it('zeigt für den Chef genau die vier Kern-Widgets in der vorgegebenen Reihenfolge', () => {
    const l = standardLayout('chef', DEFS, 'm1');
    expect(ids(l)).toEqual(['naechster-schritt', 'ansprechpartner', 'arbeit', 'neu']);
    expect(l.widgets).toHaveLength(DEFS.length);
    expect(l.widgets.filter((w) => !w.visible).map((w) => w.widgetId)).toEqual(['notiz', 'zahlen']);
  });

  it('teilt sich zwei Spalten: links nächster Schritt + Arbeit, rechts Ansprechpartner + News', () => {
    const [band] = baender(standardLayout('chef', DEFS));
    expect(band.typ).toBe('spalten');
    if (band.typ !== 'spalten') return;
    expect(band.links.map((w) => w.widgetId)).toEqual(['naechster-schritt', 'arbeit']);
    expect(band.rechts.map((w) => w.widgetId)).toEqual(['ansprechpartner', 'neu']);
  });

  it('liest sich auf dem Handy: nächster Schritt, Arbeit, Ansprechpartner, News', () => {
    expect(mobileReihenfolge(standardLayout('chef', DEFS))).toEqual(['naechster-schritt', 'arbeit', 'ansprechpartner', 'neu']);
  });

  it('lässt nicht erlaubte Widgets weg', () => {
    const l = standardLayout('chef', DEFS.filter((d) => d.id !== 'ansprechpartner'));
    expect(ids(l)).toEqual(['naechster-schritt', 'arbeit', 'neu']);
  });
});

describe('normalisieren', () => {
  it('nimmt ohne gespeichertes Layout den Standard der Rolle', () => {
    expect(ids(normalisieren(undefined, DEFS, 'buero'))).toEqual(ids(standardLayout('buero', DEFS)));
  });

  it('entfernt Unbekanntes und Doppeltes, ergänzt neue Widgets verborgen, korrigiert Größen', () => {
    const gespeichert = {
      widgets: [
        { widgetId: 'zahlen', visible: true, order: 0, size: 'gross', spalte: 'links' },
        { widgetId: 'weg', visible: true, order: 1, size: 'klein', spalte: 'links' },
        { widgetId: 'zahlen', visible: false, order: 2, size: 'klein', spalte: 'rechts' },
        { widgetId: 'notiz', visible: true, order: 3, size: 'gross', spalte: 'rechts' },
      ],
    } as Partial<HomeLayout>;
    const l = normalisieren(gespeichert, DEFS, 'chef');
    expect(ids(l)).toEqual(['zahlen', 'notiz']);
    expect(l.widgets.find((w) => w.widgetId === 'notiz')!.size).toBe('klein');
    expect(l.widgets).toHaveLength(DEFS.length);
    expect(l.widgets.map((w) => w.order)).toEqual(DEFS.map((_, i) => i));
  });
});

describe('verschieben', () => {
  const start = standardLayout('chef', DEFS);

  it('setzt ein Widget vor ein anderes und übernimmt dessen Spalte', () => {
    const l = verschieben(start, 'neu', { vor: 'naechster-schritt', spalte: 'links' });
    expect(ids(l)[0]).toBe('neu');
    expect(l.widgets.find((w) => w.widgetId === 'neu')!.spalte).toBe('links');
    expect(l.angepasst).toBe(true);
  });

  it('holt ein verborgenes Widget aus der Bibliothek an die Ablagestelle', () => {
    const l = verschieben(start, 'zahlen', { nach: 'ansprechpartner', spalte: 'rechts' });
    expect(ids(l)).toEqual(['naechster-schritt', 'ansprechpartner', 'zahlen', 'arbeit', 'neu']);
    const band = baender(l)[0];
    expect(band.typ === 'spalten' && band.rechts.map((w) => w.widgetId)).toEqual(['ansprechpartner', 'zahlen', 'neu']);
  });

  it('hängt ohne Ziel hinter das letzte sichtbare Widget, nicht hinter die verborgenen', () => {
    const l = sichtbarSetzen(start, 'zahlen', true);
    expect(ids(l)).toEqual(['naechster-schritt', 'ansprechpartner', 'arbeit', 'neu', 'zahlen']);
    expect(sichtbare(l).at(-1)!.order).toBe(4);
  });

  it('ändert nichts bei unbekannter ID', () => {
    expect(verschieben(start, 'gibtsnicht', {})).toBe(start);
  });
});

describe('Größe und Bänder', () => {
  it('ein großes Widget geht über die volle Breite und teilt die Spalten in zwei Bänder', () => {
    const l = groesseSetzen(standardLayout('chef', DEFS), 'arbeit', 'gross', DEFS);
    expect(baender(l).map((b) => b.typ)).toEqual(['spalten', 'breit', 'spalten']);
    expect(mobileReihenfolge(l)).toEqual(['naechster-schritt', 'ansprechpartner', 'arbeit', 'neu']);
  });

  it('erlaubt keine Größe, die das Widget nicht kann', () => {
    const l = groesseSetzen(standardLayout('chef', DEFS), 'notiz', 'gross', DEFS);
    expect(l.widgets.find((w) => w.widgetId === 'notiz')!.size).toBe('klein');
  });

  it('Spalte wechseln macht ein großes Widget wieder klein', () => {
    let l = groesseSetzen(standardLayout('chef', DEFS), 'arbeit', 'gross', DEFS);
    l = spalteSetzen(l, 'arbeit', 'rechts');
    const w = l.widgets.find((x) => x.widgetId === 'arbeit')!;
    expect([w.size, w.spalte]).toEqual(['klein', 'rechts']);
  });
});

describe('schritt (Tastatur/Menü)', () => {
  const start = standardLayout('chef', DEFS);

  it('verschiebt innerhalb der eigenen Spalte', () => {
    const l = schritt(start, 'arbeit', -1);
    const band = baender(l)[0];
    expect(band.typ === 'spalten' && band.links.map((w) => w.widgetId)).toEqual(['arbeit', 'naechster-schritt']);
    expect(band.typ === 'spalten' && band.rechts.map((w) => w.widgetId)).toEqual(['ansprechpartner', 'neu']);
  });

  it('kennt die Ränder', () => {
    expect(kannSchritt(start, 'naechster-schritt', -1)).toBe(false);
    expect(kannSchritt(start, 'neu', 1)).toBe(false);
    expect(kannSchritt(start, 'arbeit', -1)).toBe(true);
    expect(schritt(start, 'naechster-schritt', -1)).toBe(start);
  });

  it('springt über ein großes Widget ins nächste Band und bleibt in seiner Spalte', () => {
    let l = groesseSetzen(start, 'arbeit', 'gross', DEFS); // Band 1: nächster Schritt | Ansprechpartner · breit: Arbeit · Band 3: – | News
    l = schritt(l, 'ansprechpartner', 1);
    const b = baender(l);
    expect(b.map((x) => x.typ)).toEqual(['spalten', 'breit', 'spalten']);
    expect(b[2].typ === 'spalten' && b[2].rechts.map((w) => w.widgetId)).toEqual(['ansprechpartner', 'neu']);
  });

  it('ein großes Widget springt um ein ganzes Band', () => {
    let l = groesseSetzen(start, 'arbeit', 'gross', DEFS);
    l = schritt(l, 'arbeit', -1);
    expect(baender(l)[0].typ).toBe('breit');
    expect(ids(l)[0]).toBe('arbeit');
  });
});
