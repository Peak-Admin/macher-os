import { describe, expect, it } from 'vitest';
import { naechsteNummerFuer } from './nummern';

describe('Nummernkreise für Module', () => {
  it('zählt je Präfix und Jahr fortlaufend weiter', () => {
    expect(naechsteNummerFuer('BR', [], { jahr: 2026 })).toBe('BR-2026-0001');
    expect(naechsteNummerFuer('BR', ['BR-2026-0007', 'BR-2025-0099', undefined, 'B-2026-0042'], { jahr: 2026 })).toBe('BR-2026-0008');
  });
  it('trennt ähnliche Präfixe und kennt die Stellenzahl', () => {
    expect(naechsteNummerFuer('B', ['BR-2026-0005', 'B-2026-0002'], { jahr: 2026 })).toBe('B-2026-0003');
    expect(naechsteNummerFuer('SV', ['SV-2026-009'], { jahr: 2026, stellen: 3 })).toBe('SV-2026-010');
  });
});
