import { describe, expect, it } from 'vitest';
import { db } from '@core/db';
import { betriebEinrichten, kundenAusCsv, vorbereitet } from './daten';

describe('Kunden-CSV', () => {
  it('liest Excel-CSV mit Semikolon, Anführungszeichen und Umlauten', () => {
    const csv = '﻿Kundennummer;Name;Straße;PLZ;Ort;Telefon;E-Mail\n1001;"Müller, Anna";Lindenweg 1;34117;Kassel;0561 1;anna@example.de\n1002;Bäckerei Sommer;Hauptstr. 4;34246;Vellmar;;\n;;;;;;\n1003;Müller, Anna;x;34117;Kassel;;';
    const r = kundenAusCsv(csv);
    expect(r.fehler).toBeUndefined();
    expect(r.kunden).toHaveLength(2);
    expect(r.kunden[0]).toMatchObject({ name: 'Müller, Anna', nummer: '1001', email: 'anna@example.de', adresse: { strasse: 'Lindenweg 1', plz: '34117', ort: 'Kassel' } });
    expect(r.kunden[1].telefon).toBeUndefined();
    expect(r.hinweise.some((h) => h.includes('doppelt'))).toBe(true);
  });

  it('setzt Vor- und Nachname zusammen und erkennt Firmen', () => {
    const r = kundenAusCsv('Vorname,Nachname,Firma,Tel\nPetra,Schulz,,0160\nKarl,Neumann,Hausverwaltung Nord,0561');
    expect(r.kunden.map((k) => [k.name, k.art])).toEqual([
      ['Petra Schulz', 'privat'],
      ['Hausverwaltung Nord', 'firma'],
    ]);
    expect(r.kunden[1].ansprechpartner[0].name).toBe('Karl Neumann');
  });

  it('erklärt, wenn die Namensspalte fehlt', () => {
    expect(kundenAusCsv('a;b\n1;2').fehler).toMatch(/Namen/);
    expect(kundenAusCsv('Name').fehler).toMatch(/keine Kunden/);
  });
});

describe('Einrichten', () => {
  it('richtet ohne Beispieldaten ein, importiert Kunden und zählt nur Vorhandenes', () => {
    betriebEinrichten({
      gewerk: 'shk',
      leistungen: ['Arbeitsstunde Geselle'],
      arbeitsweisen: ['wartung'],
      team: 'klein',
      start: 'csv',
      kunden: kundenAusCsv('Name;Ort\nA;Kassel\nB;Baunatal').kunden,
      betriebName: ' Heizung Meier ',
      vorname: 'Eva',
      nachname: 'Meier',
    });
    expect(db.betrieb.get('betrieb')).toMatchObject({ name: 'Heizung Meier', gewerk: 'shk', teamgroesse: 4, arbeitsweisen: ['wartung'], onboardingFertig: true });
    expect(db.leistungen.all()).toHaveLength(1);
    expect(db.kunden.all().map((k) => k.nummer)).toEqual(['K-1001', 'K-1002']);
    expect(db.auftraege.all()).toHaveLength(0);
    const v = vorbereitet();
    expect(v.find((x) => x.label === 'Leistungen mit Preisen')?.anzahl).toBe(1);
    expect(v.every((x) => x.anzahl > 0)).toBe(true);
  });
});
