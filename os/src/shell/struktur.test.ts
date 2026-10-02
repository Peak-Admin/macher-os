import { describe, expect, test } from 'vitest';
import { ladeModule } from './module';
import { STRUKTUR, funktionsTreffer, ortVonModul, ortVonPfad, zieleVon } from './struktur';

const module = ladeModule();

describe('Zielstruktur', () => {
  test('genau vier Hauptbereiche', () => {
    expect(STRUKTUR.map((h) => h.titel)).toEqual(['Heute', 'Aufträge', 'Planen', 'Betrieb']);
  });

  test('jede Ebene hat höchstens vier gleichrangige Ziele', () => {
    for (const h of STRUKTUR) {
      expect((h.ziele ?? []).length).toBeLessThanOrEqual(4);
      expect((h.kategorien ?? []).length).toBeLessThanOrEqual(4);
      for (const k of h.kategorien ?? []) expect(k.ziele.length).toBeLessThanOrEqual(4);
      for (const z of zieleVon(h)) expect(z.ansichten.length, z.titel).toBeLessThanOrEqual(4);
    }
    expect(STRUKTUR.find((h) => h.id === 'betrieb')!.kategorien!.map((k) => k.titel)).toEqual(['Geld', 'Team', 'Ausstattung', 'Unternehmen']);
  });

  test('jedes Modul hat genau einen Ort', () => {
    const vorkommen = new Map<string, number>();
    const zaehle = (id: string) => vorkommen.set(id, (vorkommen.get(id) ?? 0) + 1);
    for (const h of STRUKTUR) {
      h.kontext?.forEach(zaehle);
      for (const z of zieleVon(h)) {
        z.ansichten.forEach((a) => a.module.forEach(zaehle));
        z.kontext?.forEach(zaehle);
      }
    }
    for (const m of module) expect(vorkommen.get(m.id), `Modul ${m.id} fehlt in struktur.ts`).toBe(1);
    for (const id of vorkommen.keys()) expect(module.some((m) => m.id === id), `${id} ist kein Modul`).toBe(true);
  });

  test('Pfade werden dem richtigen Ort zugeordnet', () => {
    expect(ortVonPfad('/auftrag/abc')?.ziel?.id).toBe('uebersicht');
    expect(ortVonPfad('/auftrag/abc')?.detail).toBe(true);
    expect(ortVonPfad('/auftraege/besichtigungen')?.haupt.id).toBe('plan');
    expect(ortVonPfad('/plan/terminbuchung')?.kategorie?.id).toBe('unternehmen');
    expect(ortVonPfad('/betrieb/abwesenheiten')?.ziel?.id).toBe('zeiten');
    expect(ortVonPfad('/betrieb/abwesenheiten')?.detail).toBe(false);
    expect(ortVonPfad('/betrieb/team')?.kategorie?.id).toBe('team');
    expect(ortVonPfad('/macher/automatisch')?.ansicht?.titel).toBe('Automationen');
    expect(ortVonModul('mein-tag')?.haupt.id).toBe('heute');
  });

  test('Funktionen sind unter Synonymen auffindbar', () => {
    expect(funktionsTreffer('Urlaub', undefined)[0]).toMatchObject({ titel: 'Zeiten & Abwesenheit', untertitel: 'Betrieb › Team › Zeiten & Abwesenheit' });
    expect(funktionsTreffer('TÜV', undefined)[0]?.titel).toBe('Geräte & Fahrzeuge');
    expect(funktionsTreffer('Fotos', undefined).some((t) => t.pfad === '/auftraege/fotos')).toBe(true);
  });
});
