import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@core/db';
import { heute } from '@core/format';
import { festschreiben, korrigieren, rechnungsSummen } from './logik';
import { alleRechnungen, rechnungX, type RechnungX } from './typen';
import { berechnet, betragCsv, csvText, listenArt, rechnungenCsv, RECHNUNG_CSV_SPALTEN } from './liste';
import { testBetrieb } from './testdaten';

let t: ReturnType<typeof testBetrieb>;
beforeEach(() => {
  t = testBetrieb();
});

const rechnung = (x: Partial<RechnungX> = {}) =>
  db.rechnungen.create({
    nummer: '',
    art: 'rechnung',
    kundeId: t.kunde.id,
    auftragId: t.auftrag.id,
    titel: 'Bad',
    positionen: [{ id: 'p', art: 'leistung', text: 'Arbeit', menge: 10, einheit: 'h', einzelpreis: 6000 }],
    status: 'entwurf',
    datum: heute(),
    faelligAm: heute(),
    leistungszeitraum: 'September 2026',
    mahnstufe: 0,
    ...x,
  });

describe('Rechnungsliste: Art', () => {
  it('zeigt Storno als eigene Art, obwohl es technisch eine Gutschrift ist', () => {
    expect(listenArt({ art: 'gutschrift', stornoFuerId: 'r1' })).toBe('storno');
    expect(listenArt({ art: 'gutschrift' })).toBe('gutschrift');
    expect(listenArt({ art: 'abschlag' })).toBe('abschlag');
  });
});

describe('CSV', () => {
  it('schreibt Beträge mit Komma und maskiert Semikolon und Anführungszeichen', () => {
    expect(betragCsv(123456)).toBe('1234,56');
    expect(betragCsv(-5)).toBe('-0,05');
    expect(csvText([['a;b', 'c"d', 'e']])).toBe('﻿"a;b";"c""d";e\r\n');
  });

  it('exportiert Nummer, Art, Datum, Kunde, Auftrag, Beträge, Status und Offen', () => {
    const r = rechnung();
    expect(festschreiben(r.id).ok).toBe(true);
    const fest = rechnungX(r.id)!;
    const zeilen = rechnungenCsv([fest]).replace('﻿', '').trim().split('\r\n');
    expect(zeilen[0]).toBe(RECHNUNG_CSV_SPALTEN.join(';'));
    const z = zeilen[1].split(';');
    expect(z[0]).toBe(fest.nummer);
    expect(z[1]).toBe('Rechnung');
    expect(z[2]).toBe(`${heute().slice(8, 10)}.${heute().slice(5, 7)}.${heute().slice(0, 4)}`);
    expect(z[3]).toBe('Familie Hoffmann');
    expect(z[4]).toBe('A-2026-0001');
    expect(z.slice(5, 8)).toEqual(['600,00', '114,00', '714,00']);
    expect(z[8]).toBe('Offen');
    expect(z[9]).toBe('714,00');
  });

  it('rechnet bei der Schlussrechnung nur den eigenen Teil (ohne Abschläge)', () => {
    const r = rechnung();
    const abschlag = rechnung({ art: 'abschlag', positionen: [{ id: 'p', art: 'leistung', text: 'Abschlag', menge: 1, einheit: 'Psch', einzelpreis: 20000 }] });
    festschreiben(abschlag.id);
    const schluss = db.rechnungen.update(r.id, { art: 'schluss', abzugRechnungIds: [abschlag.id] })!;
    expect(berechnet(schluss)).toEqual({ netto: 40000, ust: 7600, brutto: 47600 });
    expect(rechnungsSummen(schluss).netto).toBe(60000);
  });
});

describe('Rechnung korrigieren', () => {
  it('storniert die festgeschriebene Rechnung und legt eine Kopie als Entwurf an', () => {
    const r = rechnung();
    expect(festschreiben(r.id).ok).toBe(true);
    const k = korrigieren(r.id, 'falscher Stundensatz')!;
    expect(k).toBeDefined();
    expect(rechnungX(r.id)).toMatchObject({ status: 'storniert', stornoDurchId: k.storno.id });
    expect(k.storno).toMatchObject({ stornoFuerId: r.id, status: 'versendet', bemerkung: 'Grund: falscher Stundensatz' });
    expect(listenArt(k.storno)).toBe('storno');
    expect(k.entwurf).toMatchObject({ status: 'entwurf', nummer: '', art: r.art, auftragId: r.auftragId });
    expect(k.entwurf.positionen.map((p) => p.text)).toEqual(r.positionen.map((p) => p.text));
  });

  it('geht nicht bei Entwürfen und nicht zweimal', () => {
    const r = rechnung();
    expect(korrigieren(r.id)).toBeUndefined();
    festschreiben(r.id);
    expect(korrigieren(r.id)).toBeDefined();
    expect(korrigieren(r.id)).toBeUndefined();
  });
});
