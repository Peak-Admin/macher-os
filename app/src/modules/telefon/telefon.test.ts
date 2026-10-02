import { beforeEach, describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import { anrufErfassen, betreffFuer, erkenneAnrufer, rueckrufNummer } from './daten';

describe('Telefon & Empfang', () => {
  beforeEach(() => zuruecksetzen());

  it('erkennt Anrufer an der Nummer – auch über Telefon vor Ort', () => {
    const k = db.kunden.create({ art: 'privat', name: 'Hoffmann', telefon: '0171 2345678', ansprechpartner: [] });
    const hv = db.kunden.create({ art: 'hausverwaltung', name: 'HV', ansprechpartner: [] });
    db.orte.create({ kundeId: hv.id, bezeichnung: 'Anlage', art: 'gewerbe', adresse: { strasse: '', plz: '', ort: '' }, telefonVorOrt: '0175 1231231' });
    expect(erkenneAnrufer('+491712345678')?.id).toBe(k.id);
    expect(erkenneAnrufer('0175/1231231')?.id).toBe(hv.id);
    expect(erkenneAnrufer('0999 000000')).toBeUndefined();
  });

  it('macht aus einem Anruf eine Anfrage mit neuem Kunden', () => {
    const r = anrufErfassen({ nummer: '0160 555', name: 'Frau Berg', anliegen: 'Licht flackert\nim Flur', dringlichkeit: 'heute', schritt: 'anfrage' });
    expect(r.kundeNeu).toBe(true);
    expect(r.auftrag).toMatchObject({ phase: 'anfrage', dringend: true, titel: 'Licht flackert', quelle: 'telefon' });
    expect(r.nachricht).toMatchObject({ kanal: 'telefon', richtung: 'ein', auftragId: r.auftrag!.id });
    expect(db.kunden.get(r.auftrag!.kundeId)?.telefon).toBe('0160 555');
  });

  it('Rückruf von Unbekannt behält die Nummer', () => {
    anrufErfassen({ nummer: '0151 7778899', anliegen: 'Bitte zurückrufen', dringlichkeit: 'normal', schritt: 'rueckruf' });
    const a = db.aufgaben.all()[0];
    expect(a.quelle).toBe('rueckruf');
    expect(rueckrufNummer(a)).toBe('0151 7778899');
    expect(db.kunden.all()).toHaveLength(0);
  });

  it('verlangt ein Anliegen und schreibt einen klaren Betreff', () => {
    expect(() => anrufErfassen({ nummer: '1', anliegen: ' ', dringlichkeit: 'normal', schritt: 'notiz' })).toThrow();
    expect(betreffFuer({ nummer: '0171', dringlichkeit: 'notfall' })).toBe('Anruf von 0171 · Notfall');
  });
});
