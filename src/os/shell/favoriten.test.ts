import { describe, expect, test } from 'vitest';
import type { Mitarbeiter, Rolle } from '@core/objects';
import { ladeModule } from './module';
import { STRUKTUR, modulVerzeichnis, zieleVon } from './struktur';
import { FAVORITEN_MAX, STANDARD_FAVORITEN, favoritenModule } from './favoriten';

ladeModule();

const als = (rolle: Rolle) => ({ id: `test-${rolle}`, rolle }) as Mitarbeiter;

describe('Modulverzeichnis unter Betrieb', () => {
  test('enthält jedes Modul mit eigener Ansicht genau einmal', () => {
    const erwartet = new Set(STRUKTUR.flatMap((h) => zieleVon(h).flatMap((z) => z.ansichten.flatMap((a) => a.module))));
    const ids = modulVerzeichnis(undefined).flatMap((g) => g.module.map((m) => m.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(ids)).toEqual(erwartet);
  });

  test('Betrieb-Kategorien zuerst, dann Aufträge und Planen', () => {
    expect(modulVerzeichnis(undefined).map((g) => g.titel)).toEqual(['Geld', 'Team', 'Ausstattung', 'Unternehmen', 'Aus Aufträge', 'Aus Planen']);
  });

  test('zeigt nur, was die Rolle sehen darf', () => {
    const monteur = modulVerzeichnis(als('monteur')).flatMap((g) => g.module.map((m) => m.id));
    expect(monteur).not.toContain('rechnungen');
    expect(monteur).toContain('arbeitszeiten');
  });
});

describe('Favoriten', () => {
  test.each(Object.keys(STANDARD_FAVORITEN) as Rolle[])('Startauswahl für %s: höchstens drei, alle sichtbar', (rolle) => {
    const ids = STANDARD_FAVORITEN[rolle];
    expect(ids.length).toBeLessThanOrEqual(FAVORITEN_MAX);
    expect(favoritenModule(ids, als(rolle)).map((m) => m.id)).toEqual(ids);
  });

  test('höchstens drei in der Navigation, unsichtbare fallen weg', () => {
    expect(favoritenModule(['rechnungen', 'kunden', 'kalender', 'lager', 'mitarbeiter'], undefined)).toHaveLength(FAVORITEN_MAX);
    expect(favoritenModule(['rechnungen', 'fotos', 'gibt-es-nicht', 'kunden'], als('monteur')).map((m) => m.id)).toEqual(['kunden']);
  });
});
