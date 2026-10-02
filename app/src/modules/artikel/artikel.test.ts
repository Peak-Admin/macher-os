import { beforeEach, describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import { artikelImportieren, aufschlagProzent, csvParsen, einheitAus, margeProzent, spaltenRaten, vkAusAufschlag, zeilenUmwandeln } from './daten';
import { zahlAus } from '@ui/index';

describe('Artikel', () => {
  beforeEach(() => zuruecksetzen());

  it('rechnet Aufschlag und Marge', () => {
    expect(aufschlagProzent(1000, 1500)).toBe(50);
    expect(margeProzent(1000, 1500)).toBeCloseTo(33.3);
    expect(vkAusAufschlag(1234, 30)).toBe(1604);
    expect(aufschlagProzent(0, 100)).toBeUndefined();
  });

  it('liest deutsche Zahlen', () => {
    expect(zahlAus('1.234,50')).toBe(1234.5);
    expect(zahlAus('12.5')).toBe(12.5);
    expect(zahlAus('3,99 €')).toBe(3.99);
    expect(zahlAus('')).toBeUndefined();
  });

  it('parst CSV mit Semikolon und Anführungszeichen', () => {
    const t = '﻿Artikelnummer;Bezeichnung;EK\r\n"A-1";"Kabel ""NYM""; 3x1,5";0,45\n\nA-2;Dose;1,20\n';
    expect(csvParsen(t)).toEqual([
      ['Artikelnummer', 'Bezeichnung', 'EK'],
      ['A-1', 'Kabel "NYM"; 3x1,5', '0,45'],
      ['A-2', 'Dose', '1,20'],
    ]);
  });

  it('errät Spalten', () => {
    expect(spaltenRaten(['Art.-Nr.', 'Bezeichnung', 'Hersteller-Nr.', 'EAN', 'ME', 'EK-Preis', 'Listenpreis', 'Warengruppe'])).toEqual({
      nummer: 0, name: 1, herstellerNummer: 2, ean: 3, einheit: 4, ek: 5, vk: 6, kategorie: 7,
    });
  });

  it('kennt Einheiten', () => {
    expect(einheitAus('Stück')).toBe('Stk');
    expect(einheitAus('qm')).toBe('m²');
    expect(einheitAus('?')).toBe('Stk');
  });

  it('importiert neu und aktualisiert vorhandene ohne leere Felder zu überschreiben', () => {
    const alt = db.artikel.create({ name: 'Alt', nummer: 'A-1', einheit: 'm', ek: 40, vk: 80, aktiv: true, kategorie: 'Kabel' });
    const zeilen = zeilenUmwandeln(
      [
        ['A-1', 'Kabel NYM', '0,45', ''],
        ['A-2', 'Dose', '1,20', '2,50'],
        ['A-3', '', '1', '2'],
      ],
      { nummer: 0, name: 1, ek: 2, vk: 3 },
      { aufschlag: 100 },
    );
    expect(artikelImportieren(zeilen)).toEqual({ neu: 1, aktualisiert: 1, uebersprungen: 1 });
    const a = db.artikel.get(alt.id)!;
    expect(a.name).toBe('Kabel NYM');
    expect(a.ek).toBe(45);
    expect(a.vk).toBe(90); // aus Aufschlag
    expect(a.einheit).toBe('m');
    expect(a.kategorie).toBe('Kabel');
  });
});
