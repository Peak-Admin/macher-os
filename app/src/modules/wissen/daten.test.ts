import { describe, expect, it } from 'vitest';
import { fettTeile, istSichererLink, passendeArtikel, textBloecke, type WissensArtikel } from './daten';
import { STARTARTIKEL } from './start';

const a = (x: Partial<WissensArtikel>): WissensArtikel => ({ id: x.titel ?? 'a', erstelltAm: '', geaendertAm: '', titel: 'A', kategorie: 'Wartung', text: '', ...x });

describe('Text', () => {
  it('erkennt Überschriften, Listen und Absätze', () => {
    const b = textBloecke('# Ablauf\nErst lesen.\nDann machen.\n\n1. Strom aus\n2. Prüfen\n- Handschuhe\n## Ende');
    expect(b).toEqual([
      { typ: 'h1', text: 'Ablauf' },
      { typ: 'p', text: 'Erst lesen. Dann machen.' },
      { typ: 'ol', punkte: ['Strom aus', 'Prüfen'] },
      { typ: 'ul', punkte: ['Handschuhe'] },
      { typ: 'h2', text: 'Ende' },
    ]);
  });
  it('markiert fetten Text', () => {
    expect(fettTeile('Vorher **Gas zu** drehen')).toEqual([
      { text: 'Vorher ', fett: false },
      { text: 'Gas zu', fett: true },
      { text: ' drehen', fett: false },
    ]);
  });
  it('lässt nur http(s)-Links zu', () => {
    expect(istSichererLink('https://www.vaillant.de')).toBe(true);
    expect(istSichererLink('javascript:alert(1)')).toBe(false);
  });
});

describe('Passende Artikel', () => {
  const gas = a({ titel: 'Wartung Gas', anlagentypen: ['Gasheizung'], leistungIds: ['l-wartung'], gewerk: 'shk' });
  const wallbox = a({ titel: 'Wallbox', anlagentypen: ['Wallbox'], gewerk: 'elektro' });
  const allgemein = a({ titel: 'Abnahme', leistungIds: ['l-wartung'] });
  it('findet über Anlagentyp und Leistung und sortiert nach Treffern', () => {
    const v = passendeArtikel([allgemein, gas, wallbox], { anlagentypen: ['gasheizung'], leistungIds: ['l-wartung'], gewerk: 'shk' }, () => 'Wartung');
    expect(v.map((x) => x.artikel.titel)).toEqual(['Wartung Gas', 'Abnahme']);
    expect(v[0].gruende).toEqual(['Anlage: Gasheizung', 'Leistung: Wartung']);
  });
  it('blendet Artikel anderer Gewerke aus', () => {
    expect(passendeArtikel([wallbox], { anlagentypen: ['Wallbox'], gewerk: 'shk' })).toHaveLength(0);
  });
  it('liefert nichts ohne Bezug', () => {
    expect(passendeArtikel([gas, wallbox], {})).toEqual([]);
  });
});

describe('Startartikel', () => {
  it('gibt es für jedes Gewerk und alle Links sind https', () => {
    for (const g of ['elektro', 'shk', 'maler', 'dach', 'tischler', 'fliesen', 'garten', 'metall', 'bau', 'sonstiges'] as const) {
      expect(STARTARTIKEL(g).length).toBeGreaterThanOrEqual(2);
    }
    for (const g of ['elektro', 'shk'] as const) for (const x of STARTARTIKEL(g)) for (const l of x.links ?? []) expect(l.url.startsWith('https://')).toBe(true);
  });
});
