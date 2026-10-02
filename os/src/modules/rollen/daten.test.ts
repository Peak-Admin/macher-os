import { describe, expect, it } from 'vitest';
import { RECHTE, STANDARD_RECHTE } from '@core/session';
import { bereinigen, gleich, rechtSetzen } from './daten';

describe('Rechte-Matrix', () => {
  it('lässt Chef-Rechte unverändert', () => {
    expect(rechtSetzen(STANDARD_RECHTE, 'chef', 'admin', false)).toBe(STANDARD_RECHTE);
  });
  it('gibt beim Einschalten automatisch „Ansehen“ dazu', () => {
    const m = rechtSetzen({ ...STANDARD_RECHTE, azubi: [] }, 'azubi', 'schreiben', true);
    expect(m.azubi.sort()).toEqual(['lesen', 'schreiben']);
  });
  it('nimmt beim Entziehen von „Ansehen“ alles weg', () => {
    expect(rechtSetzen(STANDARD_RECHTE, 'monteur', 'lesen', false).monteur).toEqual([]);
  });
  it('entzieht einzelne Rechte', () => {
    expect(rechtSetzen(STANDARD_RECHTE, 'buero', 'geld', false).buero).not.toContain('geld');
    expect(STANDARD_RECHTE.buero).toContain('geld');
  });
  it('stellt Chef-Rechte wieder her und vergleicht Matrizen', () => {
    const kaputt = { ...STANDARD_RECHTE, chef: ['lesen' as const] };
    const b = bereinigen(kaputt, RECHTE.map((r) => r.id));
    expect(gleich(b, STANDARD_RECHTE)).toBe(true);
    expect(gleich(kaputt, STANDARD_RECHTE)).toBe(false);
  });
});
