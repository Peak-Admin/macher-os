import { beforeEach, describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import { bestandJeOrt, buchen, fahrzeugOrt, HAUPTLAGER, inventurBuchen, inventurDifferenzen, pruefeBuchung, unterMindestbestand } from './daten';

const artikel = (bestand?: number, mindestbestand?: number) =>
  db.artikel.create({ name: 'NYM-J 3x1,5', einheit: 'm', ek: 50, vk: 90, aktiv: true, bestand, mindestbestand, lagerort: bestand != null ? 'Hauptlager' : undefined });
const fahrzeug = () => db.betriebsmittel.create({ art: 'fahrzeug', name: 'Crafter', kennzeichen: 'KS-MO 1', status: 'verfuegbar' });

describe('Lager', () => {
  beforeEach(() => zuruecksetzen());

  it('legt Altbestand ohne Bewegung an den Standardort', () => {
    const a = artikel(30);
    expect(bestandJeOrt(a)).toEqual({ [HAUPTLAGER]: 30 });
  });

  it('Zugang und Entnahme ändern die Summe, Umbuchung nicht', () => {
    const a = artikel(30);
    const f = fahrzeug();
    buchen({ art: 'zugang', artikelId: a.id, menge: 20, nach: HAUPTLAGER });
    expect(db.artikel.get(a.id)!.bestand).toBe(50);
    buchen({ art: 'umbuchung', artikelId: a.id, menge: 15, von: HAUPTLAGER, nach: fahrzeugOrt(f.id) });
    expect(db.artikel.get(a.id)!.bestand).toBe(50);
    buchen({ art: 'entnahme', artikelId: a.id, menge: 5, von: fahrzeugOrt(f.id) });
    const neu = db.artikel.get(a.id)!;
    expect(neu.bestand).toBe(45);
    expect(bestandJeOrt(neu)).toEqual({ [HAUPTLAGER]: 35, [fahrzeugOrt(f.id)]: 10 });
  });

  it('macht aus einem Nicht-Lagerartikel beim ersten Zugang einen Lagerartikel', () => {
    const a = artikel();
    buchen({ art: 'zugang', artikelId: a.id, menge: 3, nach: HAUPTLAGER });
    expect(db.artikel.get(a.id)!.bestand).toBe(3);
  });

  it('prüft Eingaben', () => {
    const a = artikel(1);
    expect(pruefeBuchung({ art: 'zugang', artikelId: a.id, menge: 0, nach: HAUPTLAGER })).toMatch(/Menge/);
    expect(pruefeBuchung({ art: 'umbuchung', artikelId: a.id, menge: 1, von: HAUPTLAGER, nach: HAUPTLAGER })).toMatch(/gleich/);
    expect(pruefeBuchung({ art: 'entnahme', artikelId: a.id, menge: 1 })).toMatch(/Woher/);
  });

  it('Inventur bucht nur Differenzen', () => {
    const a = artikel(30);
    const b = db.artikel.create({ name: 'Dose', einheit: 'Stk', ek: 10, vk: 20, aktiv: true, bestand: 10 });
    expect(inventurDifferenzen(HAUPTLAGER, { [a.id]: 26, [b.id]: 10 })).toHaveLength(1);
    expect(inventurBuchen(HAUPTLAGER, { [a.id]: 26, [b.id]: 10 })).toBe(1);
    expect(db.artikel.get(a.id)!.bestand).toBe(26);
    expect(db.artikel.get(b.id)!.bestand).toBe(10);
  });

  it('erkennt Unterschreitung des Mindestbestands', () => {
    expect(unterMindestbestand(artikel(4, 5))).toBe(true);
    expect(unterMindestbestand(artikel(5, 5))).toBe(false);
    expect(unterMindestbestand(artikel(undefined, undefined))).toBe(false);
  });
});
