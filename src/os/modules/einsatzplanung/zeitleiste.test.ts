import { describe, expect, it } from 'vitest';
import { laeufe, spuren, zusammenfassen } from './zeitleiste';

describe('Zeitleiste der Plantafel', () => {
  it('verteilt überlappende Balken auf Spuren', () => {
    const a = { von: 0, bis: 2 };
    const b = { von: 1, bis: 3 };
    const c = { von: 3, bis: 4 };
    const d = { von: 4, bis: 5 };
    expect(spuren([a, b, c, d]).map((x) => x.spur)).toEqual([0, 1, 0, 1]);
  });

  it('fasst gleiche Aufträge über das Wochenende zusammen, andere nicht', () => {
    // Index 5 und 6 = Sa/So
    const frei = (i: number) => i === 5 || i === 6;
    const r = zusammenfassen(
      [
        { von: 3, bis: 4, schluessel: 'A' },
        { von: 7, bis: 7, schluessel: 'A' },
        { von: 9, bis: 9, schluessel: 'A' },
        { von: 3, bis: 3, schluessel: 'B' },
        { von: 4, bis: 4 },
        { von: 5, bis: 5 },
      ],
      frei,
    );
    expect(r.map((x) => [x.schluessel ?? '-', x.von, x.bis, x.teile.length])).toEqual([
      ['B', 3, 3, 1],
      ['A', 3, 7, 2],
      ['-', 4, 4, 1],
      ['-', 5, 5, 1],
      ['A', 9, 9, 1],
    ]);
  });

  it('gruppiert Tage für die Kopfzeilen', () => {
    expect(laeufe(['2026-09-29', '2026-09-30', '2026-10-01'], (d) => d.slice(0, 7))).toEqual([
      { schluessel: '2026-09', von: 0, bis: 1 },
      { schluessel: '2026-10', von: 2, bis: 2 },
    ]);
  });
});
