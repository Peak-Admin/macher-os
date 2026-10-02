import { beforeEach, describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import { heute, plusTage, zeitpunkt } from '@core/format';
import { berechneBedarf, bestellvorschlag } from './daten';
import { alsBestelltMarkieren, bestellungen } from '../bestellungen/daten';

function aufbau() {
  const l = db.lieferanten.create({ name: 'GH', lieferzeitTage: 1 });
  const kabel = db.artikel.create({ name: 'Kabel', einheit: 'm', ek: 50, vk: 90, aktiv: true, bestand: 30, lieferantId: l.id });
  const dose = db.artikel.create({ name: 'Dose', einheit: 'Stk', ek: 100, vk: 200, aktiv: true, bestand: 3, mindestbestand: 10, lieferantId: l.id });
  const a1 = db.auftraege.create({ nummer: 'A-1', titel: 'Bald', art: 'projekt', phase: 'beauftragt', kundeId: 'k' });
  const a2 = db.auftraege.create({ nummer: 'A-2', titel: 'Angebot', art: 'projekt', phase: 'angebot', kundeId: 'k' });
  db.termine.create({ art: 'einsatz', titel: 'x', start: zeitpunkt(plusTage(heute(), 3), '07:00'), ende: zeitpunkt(plusTage(heute(), 3), '12:00'), auftragId: a1.id, mitarbeiterIds: [], status: 'geplant' });
  return { l, kabel, dose, a1, a2 };
}

describe('Bedarf', () => {
  beforeEach(() => zuruecksetzen());

  it('rechnet Fehlmenge aus Bedarf, Bestand und offenen Bestellungen', () => {
    const { kabel, a1, a2 } = aufbau();
    db.material.create({ auftragId: a1.id, artikelId: kabel.id, text: 'Kabel', menge: 50, einheit: 'm', ek: 50, status: 'geplant' });
    // Angebotsphase ohne Termin zählt nicht
    db.material.create({ auftragId: a2.id, artikelId: kabel.id, text: 'Kabel', menge: 999, einheit: 'm', ek: 50, status: 'geplant' });
    const z = berechneBedarf().find((x) => x.artikelId === kabel.id)!;
    expect(z.benoetigt).toBe(50);
    expect(z.verfuegbar).toBe(30);
    expect(z.fehl).toBe(20);
    expect(z.grund).toBe('auftrag');
    expect(z.fruehestens).toBe(plusTage(heute(), 3));
  });

  it('zieht bereitgelegtes Material vom verfügbaren Bestand ab', () => {
    const { kabel, a1 } = aufbau();
    db.material.create({ auftragId: a1.id, artikelId: kabel.id, text: 'Kabel', menge: 25, einheit: 'm', ek: 50, status: 'bereit' });
    db.material.create({ auftragId: a1.id, artikelId: kabel.id, text: 'Kabel', menge: 10, einheit: 'm', ek: 50, status: 'geplant' });
    expect(berechneBedarf().find((x) => x.artikelId === kabel.id)!.fehl).toBe(5);
  });

  it('füllt auf Mindestbestand auf', () => {
    const { dose } = aufbau();
    const z = berechneBedarf().find((x) => x.artikelId === dose.id)!;
    expect(z.fehl).toBe(7);
    expect(z.grund).toBe('mindestbestand');
  });

  it('Bestellvorschlag deckt den Bedarf ab und verknüpft das Material', () => {
    const { kabel, dose, a1 } = aufbau();
    const m = db.material.create({ auftragId: a1.id, artikelId: kabel.id, text: 'Kabel', menge: 50, einheit: 'm', ek: 50, status: 'geplant' });
    const [b] = bestellvorschlag();
    expect(b.positionen.map((p) => [p.artikelId, p.menge])).toEqual(expect.arrayContaining([[kabel.id, 20], [dose.id, 7]]));
    expect(berechneBedarf()).toHaveLength(0);
    // zweiter Klick ändert nichts
    bestellvorschlag();
    expect(bestellungen.all()).toHaveLength(1);
    alsBestelltMarkieren(b.id);
    expect(db.material.get(m.id)!.status).toBe('bestellt');
    expect(berechneBedarf()).toHaveLength(0);
  });

  it('führt Freitext-Material ohne Artikel als eigene Zeile', () => {
    const { a1 } = aufbau();
    db.material.create({ auftragId: a1.id, text: 'Sonderteil', menge: 2, einheit: 'Stk', ek: 0, status: 'geplant' });
    const z = berechneBedarf().find((x) => !x.artikelId)!;
    expect(z.fehl).toBe(2);
    bestellvorschlag([z]);
    expect(berechneBedarf().find((x) => !x.artikelId)).toBeUndefined();
  });
});
