import { describe, expect, it } from 'vitest';
import type { Leistung } from '@core/objects';
import { alsPositionen, menge, neueZeile, rechenweg, zusammenfassen, type MassZeile } from './daten';

const z = (x: Partial<MassZeile>): MassZeile => ({ ...neueZeile(), ...x });

describe('Aufmaß', () => {
  it('rechnet Fläche, Länge, Stück und Volumen', () => {
    expect(menge(z({ art: 'flaeche', laenge: 4, breite: 3.5 }))).toBe(14);
    expect(menge(z({ art: 'laenge', laenge: 12.5, anzahl: 2 }))).toBe(25);
    expect(menge(z({ art: 'stueck', anzahl: 6 }))).toBe(6);
    expect(menge(z({ art: 'volumen', laenge: 2, breite: 1, hoehe: 0.5 }))).toBe(1);
  });

  it('zieht Fenster und Türen von Wandflächen ab', () => {
    const wand = z({ art: 'wand', laenge: 4, breite: 3, hoehe: 2.5, abzuege: [{ id: 'f', text: 'Fenster', breite: 1.2, hoehe: 1.4, anzahl: 2 }, { id: 't', text: 'Tür', breite: 0.885, hoehe: 2.01, anzahl: 1 }] });
    // 2 × (4 + 3) × 2,5 = 35 − 3,36 − 1,77885 = 29,86
    expect(menge(wand)).toBe(29.86);
    expect(rechenweg(wand)).toBe('2 × (4 + 3) × 2,5 − 5,14 = 29,86 m²');
  });

  it('wird nie negativ und ignoriert Abzüge bei Stückzahlen', () => {
    expect(menge(z({ art: 'flaeche', laenge: 1, breite: 1, abzuege: [{ id: 'x', text: '', breite: 2, hoehe: 2, anzahl: 1 }] }))).toBe(0);
    expect(menge(z({ art: 'stueck', anzahl: 3, abzuege: [{ id: 'x', text: '', breite: 2, hoehe: 2, anzahl: 1 }] }))).toBe(3);
  });

  it('fasst gleiche Leistungen über Räume zusammen und übernimmt Preise', () => {
    const l = { id: 'L', name: 'Wand streichen', einheit: 'm²', preis: 1250, aktiv: true } as Leistung;
    const a = {
      raeume: [
        { id: '1', name: 'Bad', zeilen: [z({ art: 'flaeche', laenge: 2, breite: 2, leistungId: 'L' }), z({ art: 'stueck', anzahl: 2, text: 'Steckdose' })] },
        { id: '2', name: 'Flur', zeilen: [z({ art: 'flaeche', laenge: 3, breite: 1, leistungId: 'L' })] },
      ],
    };
    const s = zusammenfassen(a, [l]);
    expect(s).toHaveLength(2);
    expect(s[0]).toMatchObject({ text: 'Wand streichen', menge: 7, raeume: ['Bad', 'Flur'] });
    const p = alsPositionen(a, [l]);
    expect(p[0]).toMatchObject({ text: 'Wand streichen (Bad, Flur)', menge: 7, einheit: 'm²', einzelpreis: 1250, leistungId: 'L' });
    expect(p[1]).toMatchObject({ text: 'Steckdose (Bad)', einzelpreis: 0, art: 'pauschal' });
  });
});
