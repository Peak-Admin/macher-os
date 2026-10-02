import { beforeEach, describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import { isoDatum, plusTage } from '@core/format';
import { defektMelden, wiederEinsatzbereit } from '../werkzeuge/daten';
import { lageVon } from './daten';

const tag = isoDatum(new Date());
const um = (h: number, m = 0) => {
  const d = new Date(`${tag}T00:00:00`);
  d.setHours(h, m);
  return d;
};

describe('Fahrzeug-Ampel', () => {
  beforeEach(() => zuruecksetzen());

  function aufbau() {
    const jonas = db.mitarbeiter.create({ vorname: 'Jonas', nachname: 'Becker', rolle: 'monteur', wochenstunden: 39, urlaubstageJahr: 30, kostensatz: 0, aktiv: true });
    const crafter = db.betriebsmittel.create({ art: 'fahrzeug', name: 'Crafter', hersteller: 'VW', kennzeichen: 'KS-MO 101', status: 'im_einsatz', mitarbeiterId: jonas.id });
    const termin = (von: Date, bis: Date) =>
      db.termine.create({ art: 'einsatz', titel: 'Einsatz', start: von.toISOString(), ende: bis.toISOString(), mitarbeiterIds: [jonas.id], status: 'geplant' });
    return { jonas, crafter, termin };
  }

  it('ist grün ohne Einsatz', () => {
    const { crafter } = aufbau();
    expect(lageVon(crafter, um(10))).toEqual({ ampel: 'frei', text: 'Verfügbar' });
  });

  it('ist gelb im Einsatz des Fahrers und nennt das Ende des Einsatzblocks', () => {
    const { crafter, termin } = aufbau();
    termin(um(8), um(12));
    termin(um(12, 20), um(15, 30)); // kurze Pause → zählt mit
    termin(um(17), um(18)); // lange Pause → eigener Block
    const lage = lageVon(crafter, um(10));
    expect(lage.ampel).toBe('belegt');
    expect(lage.info).toMatch(/Frei ab 15:30/);
  });

  it('zeigt den nächsten Einsatz, solange es frei ist', () => {
    const { crafter, termin } = aufbau();
    termin(um(14), um(16));
    const lage = lageVon(crafter, um(10));
    expect(lage.ampel).toBe('frei');
    expect(lage.info).toMatch(/Bis 14:00/);
  });

  it('ist rot bei Defekt und nennt, wann es wieder da ist', () => {
    const { crafter } = aufbau();
    const morgen = plusTage(tag, 1);
    defektMelden(crafter.id, 'Kupplung', morgen);
    const lage = lageVon(db.betriebsmittel.get(crafter.id)!, um(10));
    expect(lage.ampel).toBe('gesperrt');
    expect(lage.info).toMatch(/Wieder da ab/);
    wiederEinsatzbereit(crafter.id);
    expect(lageVon(db.betriebsmittel.get(crafter.id)!, um(10)).ampel).toBe('frei');
  });

  it('ist rot bei überfälligem TÜV', () => {
    const { crafter } = aufbau();
    db.betriebsmittel.update(crafter.id, { naechstePruefung: plusTage(tag, -3), pruefungArt: 'TÜV/HU' });
    expect(lageVon(db.betriebsmittel.get(crafter.id)!, um(10)).text).toBe('TÜV/HU überfällig');
  });

  it('ist frei, wenn der Fahrer im Urlaub ist', () => {
    const { crafter, jonas } = aufbau();
    db.abwesenheiten.create({ mitarbeiterId: jonas.id, art: 'urlaub', von: tag, bis: plusTage(tag, 4), status: 'genehmigt' });
    const lage = lageVon(crafter, um(10));
    expect(lage.ampel).toBe('frei');
    expect(lage.info).toMatch(/Jonas ist bis/);
  });
});
