import { describe, expect, test } from 'vitest';
import { ladeModule } from './module';
import { STRUKTUR, ansichtPfad, funktionsTreffer, ortVonModul, ortVonPfad, zieleVon } from './struktur';

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

  test('Katalog: Material und Leistungen unter einem Ziel, frühere Adressen bleiben erreichbar', () => {
    const katalog = zieleVon(STRUKTUR.find((h) => h.id === 'betrieb')!).find((z) => z.id === 'katalog')!;
    expect(katalog.ansichten.map((a) => [a.titel, a.module])).toEqual([
      ['Material', ['artikel']],
      ['Leistungen', ['leistungen']],
    ]);
    expect(ansichtPfad(katalog.ansichten[0])).toBe('/betrieb/katalog/material');
    expect(ansichtPfad(katalog.ansichten[1])).toBe('/betrieb/katalog/leistungen');
    for (const pfad of ['/betrieb/katalog/material', '/betrieb/katalog/leistungen', '/betrieb/katalog/leistungen/stundensatz']) {
      expect(ortVonPfad(pfad, module)?.ziel?.id, pfad).toBe('katalog');
      expect(ortVonPfad(pfad, module)?.detail, pfad).toBe(false);
    }
    expect(ortVonPfad('/betrieb/katalog/material/a1', module)?.ansicht?.titel).toBe('Material');
    expect(ortVonPfad('/betrieb/katalog/material/a1', module)?.detail).toBe(true);
    expect(ortVonPfad('/betrieb/katalog/leistungen/l1', module)?.ansicht?.titel).toBe('Leistungen');
    // alte Lesezeichen: eigene Weiterleitungsrouten der Module
    expect(ortVonPfad('/betrieb/artikel/a1', module)?.modulId).toBe('artikel');
    expect(ortVonPfad('/betrieb/leistungen/stundensatz', module)?.modulId).toBe('leistungen');
    expect(funktionsTreffer('Katalog', undefined)[0]).toMatchObject({ titel: 'Katalog', untertitel: 'Betrieb › Unternehmen › Katalog', pfad: '/betrieb/katalog/material' });
    expect(funktionsTreffer('Material', undefined).some((t) => t.pfad === '/betrieb/katalog/material')).toBe(true);
  });

  test('Funktionen sind unter Synonymen auffindbar', () => {
    expect(funktionsTreffer('Urlaub', undefined)[0]).toMatchObject({ titel: 'Zeiten & Abwesenheit', untertitel: 'Betrieb › Team › Zeiten & Abwesenheit' });
    expect(funktionsTreffer('TÜV', undefined)[0]?.titel).toBe('Geräte & Fahrzeuge');
    expect(funktionsTreffer('Fotos', undefined).some((t) => t.pfad === '/auftraege/fotos')).toBe(true);
  });
});
