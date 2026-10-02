import { beforeEach, describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import type { Ort, Termin } from '@core/objects';
import { hatVorOrtInfos, kundenAnschriftAusOrt, ortInfosLesen, ortInfosSchreiben, orteOhneInfosVorTermin, passenderOrt } from './daten';

const ort = (x: Partial<Ort>): Ort => ({ id: 'o', erstelltAm: '', geaendertAm: '', kundeId: 'k', bezeichnung: 'O', art: 'gewerbe', adresse: { strasse: 'S', plz: '1', ort: 'O' }, ...x });
const termin = (x: Partial<Termin>): Termin => ({ id: 't', erstelltAm: '', geaendertAm: '', art: 'einsatz', titel: '', start: '2026-10-03T07:00:00.000Z', ende: '2026-10-03T12:00:00.000Z', mitarbeiterIds: [], status: 'geplant', ...x });

describe('Orte: Vor-Ort-Infos', () => {
  it('liest strukturierte Zeilen', () => {
    expect(ortInfosLesen('Zugang: Hintereingang\nParken: im Hof\nSchlüssel: Safe 1234')).toEqual({ zugang: 'Hintereingang', parken: 'im Hof', schluessel: 'Safe 1234' });
  });
  it('ordnet Freitext nach Stichworten zu', () => {
    const i = ortInfosLesen('Schlüssel beim Hausmeister, Herr Albers. Zufahrt über Feldweg. Baustrom vorhanden.');
    expect(i.schluessel).toBe('Schlüssel beim Hausmeister, Herr Albers.');
    expect(i.parken).toBe('Zufahrt über Feldweg.');
    expect(i.sonstiges).toBe('Baustrom vorhanden.');
  });
  it('schreibt und liest verlustfrei', () => {
    const i = { zugang: 'Tor links', parken: 'Straße', schluessel: 'Nachbar', sonstiges: 'Hund' };
    expect(ortInfosLesen(ortInfosSchreiben(i))).toEqual(i);
    expect(ortInfosSchreiben({})).toBeUndefined();
  });
  it('erkennt fehlende Infos', () => {
    expect(hatVorOrtInfos(ort({}))).toBe(false);
    expect(hatVorOrtInfos(ort({ telefonVorOrt: '0170' }))).toBe(true);
  });
});

describe('Orte: Regeln', () => {
  it('meldet Gewerbe-Orte ohne Infos vor einem Einsatz in den nächsten Tagen', () => {
    const orte = [ort({ id: 'a' }), ort({ id: 'b', art: 'haus' }), ort({ id: 'c', hinweise: 'Zugang: ok' })];
    const termine = [termin({ id: '1', ortId: 'a' }), termin({ id: '2', ortId: 'b' }), termin({ id: '3', ortId: 'c' }), termin({ id: '4', ortId: 'a', start: '2026-10-20T07:00:00.000Z' })];
    const r = orteOhneInfosVorTermin(orte, termine, 3, '2026-10-02');
    expect(r.map((x) => x.ort.id)).toEqual(['a']);
  });
  it('ignoriert abgesagte Termine', () => {
    expect(orteOhneInfosVorTermin([ort({ id: 'a' })], [termin({ ortId: 'a', status: 'abgesagt' })], 3, '2026-10-02')).toEqual([]);
  });
  it('schlägt nur bei genau einem Ort automatisch vor', () => {
    expect(passenderOrt({ kundeId: 'k' }, [ort({ id: 'a' })])?.id).toBe('a');
    expect(passenderOrt({ kundeId: 'k' }, [ort({ id: 'a' }), ort({ id: 'b' })])).toBeUndefined();
    expect(passenderOrt({ kundeId: 'k', ortId: 'x' }, [ort({ id: 'a' })])).toBeUndefined();
  });
});

describe('Orte: Anschrift des Kunden', () => {
  beforeEach(() => zuruecksetzen());
  it('übernimmt den ersten Ort eines Privatkunden ohne Anschrift als Anschrift', () => {
    const k = db.kunden.create({ art: 'privat', name: 'Hartmann', ansprechpartner: [], telefon: '0561' });
    const o = db.orte.create({ kundeId: k.id, bezeichnung: 'Wohnhaus', art: 'haus', adresse: { strasse: 'Lindenweg 12', plz: '34117', ort: 'Kassel' } });
    expect(kundenAnschriftAusOrt(o)).toBe(true);
    expect(db.kunden.get(k.id)?.adresse).toEqual({ strasse: 'Lindenweg 12', plz: '34117', ort: 'Kassel' });
    const o2 = db.orte.create({ kundeId: k.id, bezeichnung: 'Ferienhaus', art: 'haus', adresse: { strasse: 'See 1', plz: '12345', ort: 'X' } });
    expect(kundenAnschriftAusOrt(o2)).toBe(false);
  });
  it('lässt Firmen und vorhandene Anschriften in Ruhe', () => {
    const f = db.kunden.create({ art: 'firma', name: 'GmbH', ansprechpartner: [] });
    expect(kundenAnschriftAusOrt(db.orte.create({ kundeId: f.id, bezeichnung: 'Baustelle', art: 'baustelle', adresse: { strasse: 'A 1', plz: '1', ort: 'B' } }))).toBe(false);
    expect(db.kunden.get(f.id)?.adresse).toBeUndefined();
  });
});
