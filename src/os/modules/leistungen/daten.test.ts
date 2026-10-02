import { describe, expect, it } from 'vitest';
import type { Leistung } from '@core/objects';
import { istBetrag, lohnanteilJeStunde, preisAnpassen, preisVorschau, prozentAus, stundensatzBerechnen, unterStundensatz } from './daten';

const l = (x: Partial<Leistung>): Leistung => ({ id: 'l', erstelltAm: '', geaendertAm: '', name: 'X', einheit: 'Stk', preis: 1000, aktiv: true, ...x });

describe('Preisanpassung', () => {
  it('erhöht und senkt prozentual', () => {
    expect(preisAnpassen(6800, 5)).toBe(7140);
    expect(preisAnpassen(6800, -10)).toBe(6120);
  });
  it('rundet auf Schritte', () => {
    expect(preisAnpassen(1449, 3, '10ct')).toBe(1490); // 14,92 → 14,90
    expect(preisAnpassen(1449, 3, '50ct')).toBe(1500);
    expect(preisAnpassen(6800, 4, '1euro')).toBe(7100); // 70,72 → 71
  });
  it('geht nie unter 0', () => {
    expect(preisAnpassen(500, -150)).toBe(0);
  });
  it('zeigt in der Vorschau nur Änderungen', () => {
    const v = preisVorschau([l({ id: 'a', preis: 1000 }), l({ id: 'b', preis: 0 })], 10, 'keine');
    expect(v).toHaveLength(1);
    expect(v[0].neu).toBe(1100);
  });
  it('liest Prozent- und Betragseingaben', () => {
    expect(prozentAus('5')).toBe(5);
    expect(prozentAus('-3,5 %')).toBe(-3.5);
    expect(prozentAus('abc')).toBeUndefined();
    expect(istBetrag('68,50')).toBe(true);
    expect(istBetrag('1.290,00')).toBe(true);
    expect(istBetrag('12,345')).toBe(false);
    expect(istBetrag('')).toBe(false);
  });
});

describe('Stundensatz-Rechner', () => {
  const basis = {
    lohn: 2000,
    lohnnebenkostenProzent: 80,
    bezahlteStunden: 1800,
    produktiveStunden: 1350,
    gemeinkostenJahr: 13_500_000,
    produktiveMitarbeiter: 4,
    gewinnProzent: 10,
  };
  it('rechnet Lohn, Gemeinkosten und Gewinn auf die produktive Stunde', () => {
    const r = stundensatzBerechnen(basis)!;
    expect(r.lohnkostenBezahlt).toBe(3600);
    expect(r.lohnkostenProduktiv).toBe(4800); // 36 € × 1800 / 1350
    expect(r.gemeinkostenJeStunde).toBe(2500); // 135.000 € / (1350 × 4)
    expect(r.selbstkosten).toBe(7300);
    expect(r.gewinn).toBe(730);
    expect(r.verrechnungssatz).toBe(8030);
    expect(r.produktivQuote).toBeCloseTo(0.75);
  });
  it('liefert nichts bei unvollständigen oder unstimmigen Angaben', () => {
    expect(stundensatzBerechnen({ ...basis, produktiveStunden: 0 })).toBeUndefined();
    expect(stundensatzBerechnen({ ...basis, produktiveStunden: 2000 })).toBeUndefined();
    expect(stundensatzBerechnen({ ...basis, lohn: Number.NaN })).toBeUndefined();
  });
});

describe('Lohnanteil', () => {
  const artikel = (id: string) => (id === 'dose' ? { ek: 390 } : undefined) as never;
  it('zieht Material ab und rechnet auf die Stunde', () => {
    const x = l({ preis: 6900, minuten: 30, material: [{ artikelId: 'dose', menge: 2 }] });
    expect(lohnanteilJeStunde(x, artikel)).toBe(12240); // (69 − 7,80) × 2
  });
  it('findet Leistungen unter dem Stundensatz', () => {
    const billig = l({ id: 'b', preis: 2000, minuten: 30 }); // 40 €/h
    const gut = l({ id: 'g', preis: 5000, minuten: 30 }); // 100 €/h
    const ohne = l({ id: 'o', preis: 100 });
    expect(unterStundensatz([billig, gut, ohne], 6800, artikel).map((x) => x.id)).toEqual(['b']);
  });
});
