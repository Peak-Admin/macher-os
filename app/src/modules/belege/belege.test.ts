import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@core/db';
import { heute, plusTage, zeitpunkt } from '@core/format';
import { testBetrieb, vorTagen } from '../rechnungen/testdaten';
import type { BelegX } from '../rechnungen/typen';
import { auftragVorschlaege, ausBrutto, fristenAusKonditionen, konditionenLesen, naechsteFrist, sichererVorschlag } from './logik';
import { belegAusWerten, leereWerte } from './Formular';

let t: ReturnType<typeof testBetrieb>;
beforeEach(() => {
  t = testBetrieb();
});

describe('Konditionen', () => {
  it('liest Skonto und Zahlungsziel in gängigen Schreibweisen', () => {
    expect(konditionenLesen('3 % Skonto 10 Tage, 30 Tage netto')).toEqual({ skontoProzent: 3, skontoTage: 10, zielTage: 30 });
    expect(konditionenLesen('2,5% Skonto innerhalb 14 Tagen; zahlbar in 30 Tagen')).toEqual({ skontoProzent: 2.5, skontoTage: 14, zielTage: 30 });
    expect(konditionenLesen('14 Tage 2 % Skonto')).toMatchObject({ skontoProzent: 2, skontoTage: 14 });
    expect(konditionenLesen('Bitte deine Konditionen eintragen')).toEqual({});
  });

  it('leitet Fristen vom Lieferanten ab', () => {
    const l = db.lieferanten.create({ name: 'Sonepar', konditionen: '3 % Skonto 10 Tage, 30 Tage netto' });
    const f = fristenAusKonditionen({ datum: '2026-09-01', lieferantId: l.id, faelligAm: undefined, skontoBis: undefined, skontoProzent: undefined });
    expect(f).toEqual({ faelligAm: '2026-10-01', skontoBis: '2026-09-11', skontoProzent: 3 });
  });

  it('rechnet Brutto in Netto und USt', () => {
    expect(ausBrutto(11900, 19)).toEqual({ netto: 10000, ust: 1900 });
    expect(ausBrutto(1070, 7)).toEqual({ netto: 1000, ust: 70 });
    expect(ausBrutto(500, 0)).toEqual({ netto: 500, ust: 0 });
  });

  it('übernimmt bekannten Lieferanten als Verweis statt Name', () => {
    const l = db.lieferanten.create({ name: 'Sonepar', konditionen: '2 % Skonto 8 Tage' });
    const b = belegAusWerten({ ...leereWerte(), lieferant: 'sonepar', brutto: 11900 });
    expect(b.lieferantId).toBe(l.id);
    expect(b.lieferantName).toBeUndefined();
    expect(b.skontoProzent).toBe(2);
    const frei = belegAusWerten({ ...leereWerte(), lieferant: 'Tankstelle Nord', brutto: 5000 });
    expect(frei.lieferantName).toBe('Tankstelle Nord');
  });
});

describe('Fristen', () => {
  const beleg = (x: Partial<BelegX>): BelegX => ({ id: 'b', erstelltAm: '', geaendertAm: '', art: 'eingangsrechnung', datum: heute(), netto: 10000, ust: 1900, status: 'neu', ...x });

  it('zeigt erst Skonto, danach die Fälligkeit', () => {
    const b = beleg({ skontoBis: plusTage(heute(), 2), skontoProzent: 3, faelligAm: plusTage(heute(), 20) });
    expect(naechsteFrist(b)).toMatchObject({ art: 'skonto', tage: 2, betrag: 357 });
    const spaeter = beleg({ skontoBis: vorTagen(1), faelligAm: plusTage(heute(), 5) });
    expect(naechsteFrist(spaeter)).toMatchObject({ art: 'faellig', tage: 5 });
    expect(naechsteFrist(beleg({ status: 'bezahlt', faelligAm: heute() }))).toBeUndefined();
  });
});

describe('Auftrag vorschlagen', () => {
  it('bevorzugt Auftrag mit Material vom selben Lieferanten und Einsatz am Belegtag', () => {
    const l = db.lieferanten.create({ name: 'Sonepar' });
    const art = db.artikel.create({ name: 'Kabel', einheit: 'm', ek: 100, vk: 200, lieferantId: l.id, aktiv: true });
    const anderer = db.auftraege.create({ nummer: 'A-2', titel: 'Anderes', art: 'kundendienst', phase: 'in_arbeit', kundeId: t.firma.id });
    db.material.create({ auftragId: t.auftrag.id, artikelId: art.id, text: 'Kabel', menge: 10, einheit: 'm', ek: 100, status: 'verbraucht' });
    db.termine.create({ art: 'einsatz', titel: 'x', start: zeitpunkt(heute(), '07:00'), ende: zeitpunkt(heute(), '12:00'), auftragId: t.auftrag.id, mitarbeiterIds: [], status: 'erledigt' });
    db.termine.create({ art: 'einsatz', titel: 'y', start: zeitpunkt(vorTagen(6), '07:00'), ende: zeitpunkt(vorTagen(6), '12:00'), auftragId: anderer.id, mitarbeiterIds: [], status: 'erledigt' });
    const v = auftragVorschlaege({ datum: heute(), lieferantId: l.id, kategorie: 'Material' });
    expect(v[0].auftragId).toBe(t.auftrag.id);
    expect(v[0].gruende.join(' ')).toMatch(/selben Lieferanten/);
    expect(sichererVorschlag(v)?.auftragId).toBe(t.auftrag.id);
  });

  it('ordnet nicht automatisch zu, wenn es knapp ist', () => {
    const b = db.auftraege.create({ nummer: 'A-3', titel: 'Zweiter', art: 'kundendienst', phase: 'in_arbeit', kundeId: t.firma.id });
    for (const id of [t.auftrag.id, b.id]) db.termine.create({ art: 'einsatz', titel: 'x', start: zeitpunkt(heute(), '07:00'), ende: zeitpunkt(heute(), '12:00'), auftragId: id, mitarbeiterIds: [], status: 'erledigt' });
    const v = auftragVorschlaege({ datum: heute(), lieferantName: 'Tankstelle', kategorie: 'Fahrzeug' });
    expect(v).toHaveLength(2);
    expect(sichererVorschlag(v)).toBeUndefined();
  });
});
