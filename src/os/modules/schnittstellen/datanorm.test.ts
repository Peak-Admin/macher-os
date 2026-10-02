import { beforeEach, describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import { artikelImportieren } from '@modules/artikel/daten';
import { cp850, datanormEinheit, datanormLesen, datanormPreis, datanormText } from './datanorm';
import { artikelDeaktivieren } from './DatanormImport';

const D4 = [
  'V 011026Elektro-Großhandel Nord GmbH'.padEnd(123) + '04',
  'A;N;4711;00;NYM-J 3x1,5 mm²;Ring 100 m;2;2;M;4800;12;345;',
  'A;N;4712;00;Schalter Aus/Wechsel;reinweiß;1;0;Stck;695;12;346;',
  'B;N;4711;NYMJ315;;;;;4012345000017;;;;;',
  'B;N;4712;SCHALTER;;;;;0000000000000;;;;;',
  'T;N;4711;1;Langtext Zeile 1;',
  'A;L;9999;00;Alter Artikel;;2;0;Stck;100;;;',
  'P;A;4711;2;4900;;',
].join('\r\n');

const D5 = ['V;050;Haustechnik Süd KG;01.10.2026;EUR;', 'A;N;HT-100;00;Kupferrohr 15x1;Stange 5 m;2;0;m;12,35;;KU;', 'A;A;HT-200;00;Pressfitting 15;;2;1;St;8990;;KU;'].join('\n');

beforeEach(() => zuruecksetzen());

describe('DATANORM lesen', () => {
  it('liest DATANORM 4: Artikel, Preiseinheit, Mengeneinheit, EAN aus Satz B', () => {
    const e = datanormLesen(D4);
    expect(e.fehler).toBeUndefined();
    expect(e.version).toBe(4);
    expect(e.zeilen).toHaveLength(2);
    expect(e.zeilen[0]).toMatchObject({ nummer: '4711', name: 'NYM-J 3x1,5 mm² Ring 100 m', einheit: 'm', ek: 48, ean: '4012345000017', kategorie: 'Warengruppe 345' });
    expect(e.zeilen[0].vk).toBeUndefined();
    // Preiskennzeichen 1 = Listenpreis → Verkauf, Einkauf bleibt offen
    expect(e.zeilen[1]).toMatchObject({ nummer: '4712', einheit: 'Stk', vk: 695 });
    expect(e.zeilen[1].ek).toBeUndefined();
    expect(e.zeilen[1].ean).toBeUndefined(); // 000… ist keine EAN
    expect(e.loeschen).toEqual(['9999']);
    expect(e.uebersprungen).toEqual({ T: 1, P: 1 });
  });

  it('rechnet mit deinem Rabatt den Einkaufspreis aus dem Listenpreis', () => {
    const e = datanormLesen(D4, { rabattProzent: 30 });
    expect(e.zeilen[1]).toMatchObject({ vk: 695, ek: 487 });
  });

  it('liest DATANORM 5 mit Kommapreisen und Lieferant aus dem Vorlauf', () => {
    const e = datanormLesen(D5);
    expect(e.version).toBe(5);
    expect(e.lieferant).toBe('Haustechnik Süd KG');
    expect(e.zeilen.map((z) => [z.nummer, z.ek, z.einheit])).toEqual([
      ['HT-100', 1235, 'm'],
      ['HT-200', 899, 'Stk'],
    ]);
  });

  it('meldet DATANORM 3 und fremde Dateien verständlich', () => {
    expect(datanormLesen('A' + ' '.repeat(127)).fehler).toMatch(/DATANORM 3/);
    expect(datanormLesen('Artikelnummer;Bezeichnung\nK-1;Kabel').fehler).toMatch(/keine Artikel/);
    expect(datanormLesen('').fehler).toMatch(/leer/);
  });

  it('Preis und Preiseinheit', () => {
    expect(datanormPreis('4800', '2')).toBe(48);
    expect(datanormPreis('4800', '0')).toBe(4800);
    expect(datanormPreis('12,35', '0')).toBe(1235);
    expect(datanormPreis('1.234,50', '1')).toBe(12345);
    expect(datanormPreis('', '0')).toBeUndefined();
    expect(datanormEinheit('Stck')).toBe('Stk');
    expect(datanormEinheit('MTR')).toBe('m');
    expect(datanormEinheit('Pak')).toBe('Pkt');
  });

  it('erkennt den Zeichensatz (UTF-8, CP850, Windows-1252)', () => {
    const utf8 = new TextEncoder().encode('A;N;1;00;Türöffner;;2;0;Stck;100;;;');
    expect(datanormText(utf8)).toContain('Türöffner');
    // „Türöffner“ in CP850: ü = 0x81, ö = 0x94
    const dos = new Uint8Array([0x54, 0x81, 0x72, 0x94, 0x66, 0x66, 0x6e, 0x65, 0x72]);
    expect(cp850(dos)).toBe('Türöffner');
    expect(datanormText(dos)).toBe('Türöffner');
    const win = new Uint8Array([0x54, 0xfc, 0x72, 0xf6, 0x66, 0x66, 0x6e, 0x65, 0x72]);
    expect(datanormText(win)).toBe('Türöffner');
  });
});

describe('DATANORM übernehmen', () => {
  it('legt Artikel an, aktualisiert beim zweiten Mal und deaktiviert Gelöschte', () => {
    db.artikel.create({ nummer: '9999', name: 'Alt', einheit: 'Stk', ek: 1, vk: 2, aktiv: true });
    const e = datanormLesen(D4);
    expect(artikelImportieren(e.zeilen)).toEqual({ neu: 2, aktualisiert: 0, uebersprungen: 0 });
    expect(artikelImportieren(datanormLesen(D4.replace(';4800;', ';5000;')).zeilen)).toEqual({ neu: 0, aktualisiert: 2, uebersprungen: 0 });
    expect(db.artikel.all().find((a) => a.nummer === '4711')?.ek).toBe(50);
    expect(artikelDeaktivieren(e.loeschen)).toBe(1);
    expect(db.artikel.all().find((a) => a.nummer === '9999')?.aktiv).toBe(false);
  });
});
