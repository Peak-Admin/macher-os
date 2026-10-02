import { describe, expect, it } from 'vitest';
import { fortschritt, phase, planFuer, ueberfaellig, type Einarbeitung } from './daten';

const uw = [
  { id: 'u1', titel: 'Leitern', rollen: ['monteur' as const, 'azubi' as const], aktiv: true },
  { id: 'u2', titel: 'Büro-Ergonomie', rollen: ['buero' as const], aktiv: true },
  { id: 'u3', titel: 'Pausiert', rollen: ['monteur' as const], aktiv: false },
];

describe('Einarbeitungsplan', () => {
  it('passt den Plan an die Rolle an und hängt aktive Unterweisungen an', () => {
    const monteur = planFuer('monteur', uw);
    const titel = monteur.map((s) => s.titel);
    expect(titel).toContain('Fahrzeug zeigen, Führerschein kontrollieren');
    expect(titel).toContain('Unterweisung „Leitern“ bestätigen');
    expect(titel).not.toContain('Unterweisung „Büro-Ergonomie“ bestätigen');
    expect(titel).not.toContain('Unterweisung „Pausiert“ bestätigen');
    expect(monteur.find((s) => s.unterweisungId === 'u1')?.art).toBe('unterweisung');
    const azubi = planFuer('azubi', uw).map((s) => s.titel);
    expect(azubi).toContain('Ausbildungsnachweis (Berichtsheft) erklären');
    expect(azubi).not.toContain('Fahrzeug zeigen, Führerschein kontrollieren');
    // sortiert nach Fälligkeit, alle offen, eindeutige IDs
    expect(monteur.map((s) => s.tag)).toEqual([...monteur.map((s) => s.tag)].sort((a, b) => a - b));
    expect(new Set(monteur.map((s) => s.id)).size).toBe(monteur.length);
  });

  it('zählt Fortschritt und überfällige Schritte', () => {
    const e = { start: '2026-09-01', schritte: planFuer('monteur', uw) } as Einarbeitung;
    e.schritte[0].erledigt = true;
    expect(fortschritt(e).fertig).toBe(1);
    const ueber = ueberfaellig(e, '2026-09-10');
    expect(ueber.every((s) => s.tag < 9 && !s.erledigt)).toBe(true);
    expect(ueberfaellig({ ...e, abgeschlossenAm: 'x' }, '2026-12-31')).toEqual([]);
    expect([phase(0), phase(3), phase(28), phase(150)]).toEqual(['Erster Tag', 'Erste Woche', 'Erster Monat', 'Probezeit']);
  });
});
