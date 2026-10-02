import { describe, expect, it } from 'vitest';
import { aktuelleAnkuendigung, fuerRolle } from './filter';
import { BEISPIEL_ANKUENDIGUNGEN, BEISPIEL_NEUIGKEITEN } from './beispiel-inhalte';

describe('Inhalte von Mission Mittelstand', () => {
  it('filtert nach Zielgruppe', () => {
    expect(fuerRolle(BEISPIEL_NEUIGKEITEN, 'monteur').every((n) => !n.targetAudience || n.targetAudience.includes('monteur'))).toBe(true);
    expect(fuerRolle(BEISPIEL_NEUIGKEITEN, 'chef').length).toBeGreaterThan(fuerRolle(BEISPIEL_NEUIGKEITEN, 'monteur').length);
  });

  it('zeigt höchstens eine Ankündigung – nicht geschlossen, nicht abgelaufen', () => {
    const a = BEISPIEL_ANKUENDIGUNGEN[0];
    expect(aktuelleAnkuendigung(BEISPIEL_ANKUENDIGUNGEN, 'chef', '2026-10-02', [])?.id).toBe(a.id);
    expect(aktuelleAnkuendigung(BEISPIEL_ANKUENDIGUNGEN, 'chef', '2026-10-02', [a.id])).toBeNull();
    expect(aktuelleAnkuendigung(BEISPIEL_ANKUENDIGUNGEN, 'chef', '2026-10-09', [])).toBeNull();
    expect(aktuelleAnkuendigung(BEISPIEL_ANKUENDIGUNGEN, 'monteur', '2026-10-02', [])).toBeNull();
  });

  it('alle Beispielinhalte sind als Beispiel gekennzeichnet', () => {
    expect([...BEISPIEL_NEUIGKEITEN, ...BEISPIEL_ANKUENDIGUNGEN].every((x) => x.beispiel)).toBe(true);
  });
});
