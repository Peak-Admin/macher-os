import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { alleSammlungen, db, exportieren, zuruecksetzen } from '@core/db';
import { hatEchtenBetrieb, hatGesicherteDaten, istSpielwiese, setzeSicherungsSpeicher, spielwieseStarten, spielwieseVerlassen } from '@core/seed';
import { demoGewerk, LEERER_BRIEFKOPF, setupEinrichten } from './daten';

let gesichert: ReturnType<typeof exportieren> | undefined;
const beispiele = () => alleSammlungen().reduce((n, c) => n + c.allMitGeloeschten().filter((x) => x.beispiel).length, 0);

describe('Spielwiese', () => {
  beforeEach(() => {
    zuruecksetzen();
    gesichert = undefined;
    setzeSicherungsSpeicher({
      lesen: async () => gesichert && structuredClone(gesichert),
      schreiben: async (s) => void (gesichert = structuredClone(s)),
      loeschen: async () => void (gesichert = undefined),
    });
  });
  afterEach(() => setzeSicherungsSpeicher(undefined));

  it('legt echte Daten zur Seite und holt sie ohne Reste zurück', async () => {
    setupEinrichten({ gewerk: 'elektro', briefkopf: { ...LEERER_BRIEFKOPF, name: 'Elektro Echt', inhaber: 'Eva' }, kunden: [{ art: 'privat', name: 'Echter Kunde', ansprechpartner: [] }], preise: { art: 'vorlage', prozent: 0 }, team: [] });
    expect(hatEchtenBetrieb()).toBe(true);

    await spielwieseStarten('elektro');
    expect(istSpielwiese()).toBe(true);
    expect(db.betrieb.get('betrieb')?.name).toBe('Musterbetrieb');
    expect(db.kunden.all().every((k) => k.beispiel)).toBe(true);
    expect(db.kunden.all().some((k) => k.name === 'Echter Kunde')).toBe(false);
    expect(await hatGesicherteDaten()).toBe(true);

    expect(await spielwieseVerlassen()).toBe('zurueck');
    expect(istSpielwiese()).toBe(false);
    expect(db.betrieb.get('betrieb')?.name).toBe('Elektro Echt');
    expect(db.kunden.all().map((k) => k.name)).toEqual(['Echter Kunde']);
    expect(beispiele()).toBe(0);
    expect(await hatGesicherteDaten()).toBe(false);
  });

  it('ohne echten Betrieb: Verlassen räumt alles leer, das Setup beginnt', async () => {
    await spielwieseStarten('shk');
    expect(beispiele()).toBeGreaterThan(0);
    expect(await spielwieseVerlassen()).toBe('leer');
    expect(db.betrieb.get('betrieb')).toBeUndefined();
    expect(beispiele()).toBe(0);
  });

  it('eigenes Setup von der Spielwiese aus mischt nichts', async () => {
    await spielwieseStarten('elektro');
    setupEinrichten({ gewerk: 'elektro', briefkopf: { ...LEERER_BRIEFKOPF, name: 'Neu', inhaber: 'Max' }, kunden: [], preise: { art: 'vorlage', prozent: 0 }, team: [] });
    expect(istSpielwiese()).toBe(false);
    expect(beispiele()).toBe(0);
  });

  it('startet die Spielwiese nicht, wenn die Sicherung nicht lesbar ist', async () => {
    setupEinrichten({ gewerk: 'elektro', briefkopf: { ...LEERER_BRIEFKOPF, name: 'Elektro Echt', inhaber: 'Eva' }, kunden: [], preise: { art: 'vorlage', prozent: 0 }, team: [] });
    setzeSicherungsSpeicher({ lesen: async () => undefined, schreiben: async () => {}, loeschen: async () => {} });
    await expect(spielwieseStarten()).rejects.toThrow(/sicher/);
    expect(db.betrieb.get('betrieb')?.name).toBe('Elektro Echt');
  });

  it('Demo mit anderem Gewerk: Beispielbetrieb wechselt, echte Daten bleiben zur Seite gelegt', async () => {
    setupEinrichten({ gewerk: 'elektro', briefkopf: { ...LEERER_BRIEFKOPF, name: 'Elektro Echt', inhaber: 'Eva' }, kunden: [], preise: { art: 'vorlage', prozent: 0 }, team: [] });
    await spielwieseStarten('elektro');
    await spielwieseStarten('shk');
    expect(istSpielwiese()).toBe(true);
    expect(db.betrieb.get('betrieb')?.gewerk).toBe('shk');
    expect(await spielwieseVerlassen()).toBe('zurueck');
    expect(db.betrieb.get('betrieb')?.name).toBe('Elektro Echt');
  });

  it('Demo-Adresse: Gewerk der Website wird zum Gewerk der Software', () => {
    expect(demoGewerk('shk')).toBe('shk');
    expect(demoGewerk('allgemein')).toBe('sonstiges');
    expect(demoGewerk('quatsch')).toBe('elektro');
    expect(demoGewerk(null)).toBe('elektro');
  });
});
