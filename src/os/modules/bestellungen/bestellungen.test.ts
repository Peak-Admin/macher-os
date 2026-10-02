import { beforeEach, describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import { alsBestelltMarkieren, bestelltext, bestellungen, inEntwurfUebernehmen, mailtoLink, naechsteBestellnummer, offeneMengen, stornieren, ueberfaellig, wareneingang } from './daten';
import { HAUPTLAGER, lagerbewegungen } from '../lager/daten';

function aufbau() {
  const l = db.lieferanten.create({ name: 'Großhandel Nord', email: 'bestellung@gh.example', kundennummer: '4711', lieferzeitTage: 2 });
  const a = db.artikel.create({ name: 'Abzweigdose', nummer: 'AD-1', einheit: 'Stk', ek: 120, vk: 250, aktiv: true, bestand: 2, lieferantId: l.id });
  const auftrag = db.auftraege.create({ nummer: 'A-1', titel: 'Test', art: 'projekt', phase: 'beauftragt', kundeId: 'k' });
  const m1 = db.material.create({ auftragId: auftrag.id, artikelId: a.id, text: a.name, menge: 6, einheit: 'Stk', ek: 120, status: 'geplant' });
  const m2 = db.material.create({ auftragId: auftrag.id, artikelId: a.id, text: a.name, menge: 4, einheit: 'Stk', ek: 120, status: 'geplant' });
  return { l, a, m1, m2 };
}

describe('Bestellungen', () => {
  beforeEach(() => zuruecksetzen());

  it('vergibt fortlaufende Nummern', () => {
    const j = new Date().getFullYear();
    expect(naechsteBestellnummer()).toBe(`B-${j}-0001`);
    inEntwurfUebernehmen(undefined, []);
    expect(naechsteBestellnummer()).toBe(`B-${j}-0002`);
  });

  it('bündelt Positionen im offenen Entwurf des Lieferanten', () => {
    const { l, a, m1, m2 } = aufbau();
    const b1 = inEntwurfUebernehmen(l.id, [{ artikelId: a.id, text: a.name, menge: 6, einheit: 'Stk', ek: 120, materialIds: [m1.id] }]);
    const b2 = inEntwurfUebernehmen(l.id, [{ artikelId: a.id, text: a.name, menge: 4, einheit: 'Stk', ek: 120, materialIds: [m2.id] }]);
    expect(b2.id).toBe(b1.id);
    expect(b2.positionen).toHaveLength(1);
    expect(b2.positionen[0].menge).toBe(10);
    expect(offeneMengen().get(a.id)).toBe(10);
  });

  it('bestellen setzt Material auf bestellt und Liefertermin', () => {
    const { l, a, m1 } = aufbau();
    const b = inEntwurfUebernehmen(l.id, [{ artikelId: a.id, text: a.name, menge: 6, einheit: 'Stk', ek: 120, materialIds: [m1.id] }]);
    expect(alsBestelltMarkieren(b.id)).toBeUndefined();
    const neu = bestellungen.get(b.id)!;
    expect(neu.status).toBe('bestellt');
    expect(neu.erwartetAm).toBeTruthy();
    expect(db.material.get(m1.id)!.status).toBe('bestellt');
    expect(ueberfaellig(neu, '2999-01-01')).toBe(true);
    expect(ueberfaellig(neu, '2000-01-01')).toBe(false);
  });

  it('Wareneingang bucht Lager und setzt abgedecktes Material auf bereit', () => {
    const { l, a, m1, m2 } = aufbau();
    const b = inEntwurfUebernehmen(l.id, [{ artikelId: a.id, text: a.name, menge: 10, einheit: 'Stk', ek: 120, materialIds: [m1.id, m2.id] }]);
    alsBestelltMarkieren(b.id);
    const pos = bestellungen.get(b.id)!.positionen[0];
    const r1 = wareneingang(b.id, { [pos.id]: 7 });
    expect(r1.bereit).toBe(1);
    expect(bestellungen.get(b.id)!.status).toBe('teilgeliefert');
    expect(db.material.get(m1.id)!.status).toBe('bereit');
    expect(db.material.get(m2.id)!.status).toBe('bestellt');
    expect(db.artikel.get(a.id)!.bestand).toBe(9);
    wareneingang(b.id, { [pos.id]: 3 });
    expect(bestellungen.get(b.id)!.status).toBe('geliefert');
    expect(db.material.get(m2.id)!.status).toBe('bereit');
    expect(db.artikel.get(a.id)!.bestand).toBe(12);
    expect(lagerbewegungen.all().every((x) => x.nach === HAUPTLAGER)).toBe(true);
  });

  it('Stornieren setzt bestelltes Material zurück auf geplant', () => {
    const { l, a, m1 } = aufbau();
    const b = inEntwurfUebernehmen(l.id, [{ artikelId: a.id, text: a.name, menge: 6, einheit: 'Stk', ek: 120, materialIds: [m1.id] }]);
    alsBestelltMarkieren(b.id);
    stornieren(b.id);
    expect(db.material.get(m1.id)!.status).toBe('geplant');
  });

  it('erzeugt Bestelltext und mailto-Link', () => {
    const { l, a } = aufbau();
    const b = inEntwurfUebernehmen(l.id, [{ artikelId: a.id, text: a.name, menge: 6, einheit: 'Stk', ek: 120 }]);
    const text = bestelltext(b);
    expect(text).toContain('6 Stk Abzweigdose (Art.-Nr. AD-1)');
    expect(text).toContain('Kundennummer: 4711');
    expect(mailtoLink(b)).toMatch(/^mailto:bestellung%40gh\.example\?subject=/);
  });

  it('verweigert Bestellen ohne Lieferant oder Positionen', () => {
    const b = inEntwurfUebernehmen(undefined, []);
    expect(alsBestelltMarkieren(b.id)).toMatch(/Lieferanten/);
  });
});
