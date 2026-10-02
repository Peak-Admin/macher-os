import { beforeEach, describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import { ausgeben, ausstattung, defektMelden, woIst, zurueckgeben } from './daten';

describe('Werkzeuge', () => {
  beforeEach(() => zuruecksetzen());

  function aufbau() {
    const jonas = db.mitarbeiter.create({ vorname: 'Jonas', nachname: 'Becker', rolle: 'monteur', wochenstunden: 39, urlaubstageJahr: 30, kostensatz: 0, aktiv: true });
    const crafter = db.betriebsmittel.create({ art: 'fahrzeug', name: 'VW Crafter', kennzeichen: 'KS-MO 101', status: 'verfuegbar' });
    const hammer = db.betriebsmittel.create({ art: 'maschine', name: 'Bohrhammer', status: 'verfuegbar', standort: 'Lager' });
    return { jonas, crafter, hammer };
  }

  it('beantwortet „Wer hat den Bohrhammer?“', () => {
    const { jonas, crafter, hammer } = aufbau();
    expect(woIst(db.betriebsmittel.get(hammer.id)!).text).toBe('Standort: Lager');
    ausgeben(hammer.id, { typ: 'mitarbeiter', id: jonas.id });
    expect(woIst(db.betriebsmittel.get(hammer.id)!).text).toBe('Bei Jonas Becker');
    expect(db.betriebsmittel.get(hammer.id)!.status).toBe('im_einsatz');
    ausgeben(hammer.id, { typ: 'fahrzeug', id: crafter.id });
    expect(woIst(db.betriebsmittel.get(hammer.id)!).text).toBe('Im Fahrzeug VW Crafter (KS-MO 101)');
    expect(ausstattung(crafter.id).map((b) => b.id)).toEqual([hammer.id]);
    zurueckgeben(hammer.id);
    expect(woIst(db.betriebsmittel.get(hammer.id)!).text).toBe('Standort: Lager');
  });

  it('Fahrzeug bekommt einen Fahrer', () => {
    const { jonas, crafter } = aufbau();
    expect(ausgeben(crafter.id, { typ: 'ort', text: 'Hof' })).toMatch(/Fahrer/);
    ausgeben(crafter.id, { typ: 'mitarbeiter', id: jonas.id });
    expect(woIst(db.betriebsmittel.get(crafter.id)!).text).toBe('Fahrer: Jonas Becker');
  });

  it('Defekt bleibt bei Ausgabe erhalten', () => {
    const { jonas, hammer } = aufbau();
    defektMelden(hammer.id, 'Schlagwerk klemmt');
    ausgeben(hammer.id, { typ: 'mitarbeiter', id: jonas.id });
    const b = db.betriebsmittel.get(hammer.id)!;
    expect(b.status).toBe('defekt');
    expect(b.notiz).toContain('Schlagwerk klemmt');
  });
});
