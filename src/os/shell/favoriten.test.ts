import { describe, expect, test } from 'vitest';
import type { Mitarbeiter, Rolle } from '@core/objects';
import { ladeModule } from './module';
import { STRUKTUR, modulVerzeichnis, zieleVon } from './struktur';
import { sichtbareModulIds } from './favoriten';
import {
  LEER,
  LEISTE_MAX,
  STANDARD_LEISTE,
  bereinigen,
  elternVon,
  flach,
  hinzufuegen,
  kannSchieben,
  modulDrin,
  modulUmschalten,
  schieben,
  standardLeiste,
  verschieben,
  ziele,
  type Leiste,
  type LeistenEintrag,
} from './seitenleiste';

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

describe('Seitenleiste', () => {
  const sichtbar = (rolle?: Rolle) => sichtbareModulIds(rolle ? als(rolle) : undefined);

  test.each(Object.keys(STANDARD_LEISTE) as Rolle[])('Startauswahl für %s: nur Module, die die Rolle sehen darf', (rolle) => {
    const l = bereinigen(standardLeiste(rolle), (id) => sichtbar(rolle).has(id));
    expect(l.eintraege.map((e) => e.modulId)).toEqual(STANDARD_LEISTE[rolle]);
  });

  test('bereinigen: unsichtbare Module, kaputte Pfade, Doppelte und Unbekanntes fallen weg', () => {
    const roh = {
      eintraege: [
        { id: 'a1', art: 'modul', titel: '', modulId: 'rechnungen' },
        { id: 'a2', art: 'modul', titel: '', modulId: 'kunden' },
        { id: 'a2', art: 'modul', titel: '', modulId: 'kalender' },
        { id: 'a3', art: 'seite', titel: 'Böse', pfad: '//fremd.de' },
        { id: 'a4', art: 'seite', titel: '', pfad: '/auftraege?status=offen' },
        { id: 'a5', art: 'quatsch', titel: 'x' },
        { id: 'a6', art: 'smart', titel: '' },
      ],
    };
    const l = bereinigen(roh, (id) => sichtbar('monteur').has(id));
    expect(l.eintraege.map((e) => e.id)).toEqual(['a2', 'a4', 'a6']);
    expect(l.eintraege[1]).toMatchObject({ titel: 'Seite', pfad: '/auftraege?status=offen' });
    expect(l.eintraege[2].titel).toBe('Smart View');
  });

  test('Ordner: hinzufügen, verschieben, nicht in sich selbst und nicht zu tief', () => {
    let l: Leiste = LEER;
    const ordner = (id: string): LeistenEintrag => ({ id, art: 'ordner', titel: id, offen: true, kinder: [] });
    l = hinzufuegen(l, ordner('o1'));
    l = hinzufuegen(l, ordner('o2'), 'o1');
    l = hinzufuegen(l, ordner('o3'), 'o2');
    expect(hinzufuegen(l, ordner('o4'), 'o3')).toBe(l); // vierte Ebene: nein
    l = hinzufuegen(l, { id: 'm1', art: 'modul', titel: '', modulId: 'kunden' });
    expect(verschieben(l, 'o1', 'o3')).toBe(l); // nie in den eigenen Inhalt
    expect(verschieben(l, 'm1', 'm1')).toBe(l);
    const neu = verschieben(l, 'm1', 'o2');
    expect(elternVon(neu.eintraege, 'm1')).toBe('o2');
    // o3 liegt schon auf der dritten Ebene – darin wäre es die vierte
    expect(ziele(neu, 'm1').map((z) => z.pfad)).toEqual(['o1']);
  });

  test('sortieren innerhalb einer Ebene', () => {
    let l = bereinigen(standardLeiste('chef'));
    expect(kannSchieben(l, 'std-angebote', -1)).toBe(false);
    l = schieben(l, 'std-angebote', 1);
    expect(l.eintraege.map((e) => e.modulId)).toEqual(['rechnungen', 'angebote', 'auswertung']);
  });

  test('Stern: Modul hinein und überall wieder heraus', () => {
    let l = bereinigen(standardLeiste('chef'));
    expect(modulDrin(l, 'kunden')).toBe(false);
    l = modulUmschalten(l, 'kunden');
    expect(modulDrin(l, 'kunden')).toBe(true);
    l = modulUmschalten(l, 'angebote');
    expect(flach(l.eintraege).map((e) => e.modulId)).toEqual(['rechnungen', 'auswertung', 'kunden']);
  });

  test('höchstens LEISTE_MAX Einträge', () => {
    let l: Leiste = LEER;
    for (let i = 0; i < LEISTE_MAX + 5; i++) l = hinzufuegen(l, { id: `s-${i}`, art: 'smart', titel: `V${i}` });
    expect(l.eintraege).toHaveLength(LEISTE_MAX);
    const roh = { eintraege: Array.from({ length: LEISTE_MAX + 5 }, (_, i) => ({ id: `s-${i}`, art: 'smart', titel: 'x' })) };
    expect(bereinigen(roh).eintraege).toHaveLength(LEISTE_MAX);
  });
});
