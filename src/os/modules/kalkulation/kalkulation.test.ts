import { describe, expect, it } from 'vitest';
import type { Artikel, Mitarbeiter } from '@core/objects';
import { alsPositionen, gkAusStundensatz, materialAufschlag, mittellohn, rechne, rechneZeile, zeileAusLeistung, type Kalkulation } from './daten';

const k: Kalkulation = {
  id: 'k', erstelltAm: '', geaendertAm: '', auftragId: 'a', titel: 'T',
  lohnkosten: 4000, gemeinkostenProzent: 50, materialZuschlagProzent: 20, wagnisGewinnProzent: 10,
  zeilen: [{ id: 'z', text: 'Steckdose', menge: 4, einheit: 'Stk', minuten: 30, material: 500, fremd: 0 }],
};

describe('Kalkulation', () => {
  it('rechnet Lohn, Material, Zuschläge und Deckungsbeitrag', () => {
    const e = rechne(k);
    const z = e.zeilen[0];
    // 4 × 30 Min = 2 Std × 40 € = 80 €; GK 40 €; Material 20 € + 4 €; SK 144 €; W&G 14,40 €
    expect(z).toMatchObject({ stunden: 2, lohn: 8000, gemeinkosten: 4000, material: 2000, materialZuschlag: 400, selbstkosten: 14400, wagnisGewinn: 1440, preis: 15840, einheitspreis: 3960 });
    expect(z.deckungsbeitrag).toBe(15840 - 10000);
    expect(e.summe.dbProzent).toBe(36.9);
    expect(e.verrechnungssatz).toBe(6600);
  });

  it('übernimmt Einheitspreise als Angebotspositionen', () => {
    expect(alsPositionen(k)[0]).toMatchObject({ text: 'Steckdose', menge: 4, einzelpreis: 3960 });
    expect(alsPositionen({ ...k, zeilen: [{ ...k.zeilen[0], menge: 0 }] })).toEqual([]);
  });

  it('belegt Sätze aus echten Betriebsdaten vor', () => {
    const m = [{ aktiv: true, rolle: 'monteur', kostensatz: 3800 }, { aktiv: true, rolle: 'chef', kostensatz: 4400 }, { aktiv: true, rolle: 'azubi', kostensatz: 1400 }] as Mitarbeiter[];
    expect(mittellohn(m)).toBe(4100);
    expect(mittellohn([])).toBeUndefined();
    // 66 € = 40 € × (1 + gk) × 1,1  →  gk = 50 %
    expect(gkAusStundensatz(6600, 4000, 10)).toBe(50);
    expect(materialAufschlag([{ ek: 100, vk: 150 }, { ek: 200, vk: 300 }] as Artikel[])).toBe(50);
  });
});

describe('Katalogpreis und Marge', () => {
  const saetze = { lohnkosten: 4000, gemeinkostenProzent: 50, materialZuschlagProzent: 0, wagnisGewinnProzent: 10 };
  const zeile = { id: 'z', text: 'Steckdose', menge: 6, einheit: 'Stk' as const, minuten: 30, material: 0, fremd: 0 };

  it('ohne Festpreis gilt der kalkulierte Preis', () => {
    const r = rechneZeile(zeile, saetze);
    expect(r).toMatchObject({ selbstkosten: 18000, kalkuliert: 19800, preis: 19800, einheitspreis: 3300, marge: 1800 });
  });

  it('mit Katalogpreis gilt der Katalogpreis, die Marge zeigt, was übrig bleibt', () => {
    const r = rechneZeile({ ...zeile, festpreis: 4500 }, saetze);
    expect(r).toMatchObject({ kalkuliert: 19800, preis: 27000, einheitspreis: 4500, marge: 9000 });
    const unter = rechneZeile({ ...zeile, festpreis: 2500 }, saetze);
    expect(unter.marge).toBe(-3000);
  });

  it('Zeile aus Leistung übernimmt den Katalogpreis', () => {
    const l = { id: 'l', name: 'Steckdose', einheit: 'Stk' as const, preis: 6900, minuten: 35, aktiv: true, erstelltAm: '', geaendertAm: '' };
    expect(zeileAusLeistung(l, []).festpreis).toBe(6900);
    const summe = rechne({ ...saetze, zeilen: [{ ...zeile, festpreis: 4500 }] }).summe;
    expect(summe).toMatchObject({ preis: 27000, kalkuliert: 19800, marge: 9000, margeProzent: 33.3 });
  });
});
