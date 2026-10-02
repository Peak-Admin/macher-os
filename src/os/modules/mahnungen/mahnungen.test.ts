import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@core/db';
import { heute, plusTage } from '@core/format';
import { festschreiben, rechnungErstellen } from '../rechnungen/logik';
import { rechnungAendern, rechnungX } from '../rechnungen/typen';
import { testBetrieb, vorTagen } from '../rechnungen/testdaten';
import { zahlungBuchen } from '../zahlungen/logik';
import { STANDARD_REGELN, berechnen, mahntext, mahnungen, naechsteStufe, pruefen, senden, verzugszinsen, warten, zinsSatz } from './daten';

let t: ReturnType<typeof testBetrieb>;

function ueberfaellig(tage: number, kundeId = t.kunde.id) {
  const a = db.auftraege.create({ nummer: `A-${Math.random()}`, titel: 'Arbeit', art: 'kundendienst', phase: 'abrechnung', kundeId });
  const r = rechnungErstellen(a.id)!;
  rechnungAendern(r.id, { leistungszeitraum: 'August', positionen: [{ id: 'p', art: 'leistung', text: 'Arbeit', menge: 1, einheit: 'Psch', einzelpreis: 100000 }] });
  festschreiben(r.id);
  return rechnungAendern(r.id, { datum: plusTage(heute(), -tage - 14), faelligAm: plusTage(heute(), -tage) })!;
}

beforeEach(() => {
  t = testBetrieb();
});

describe('Verzugszinsen', () => {
  it('5 Punkte über Basiszins bei Verbrauchern, 9 bei Unternehmen', () => {
    expect(zinsSatz(true, 1.27)).toBe(6.27);
    expect(zinsSatz(false, 1.27)).toBe(10.27);
    expect(zinsSatz(true, -0.88)).toBe(4.12);
  });
  it('rechnet tagesgenau auf 365 Tage', () => {
    // 1.000 € × 10,27 % × 30/365 = 8,44 €
    expect(verzugszinsen(100000, 10.27, 30)).toBe(844);
    expect(verzugszinsen(100000, 10.27, 0)).toBe(0);
  });
});

describe('Mahnstufen', () => {
  it('Erinnerung nach X Tagen, dann 1. und 2. Mahnung', () => {
    const r = ueberfaellig(5);
    expect(naechsteStufe(r)).toBeUndefined();
    const r2 = rechnungAendern(r.id, { faelligAm: vorTagen(7) })!;
    expect(naechsteStufe(r2)).toBe(1);
    const r3 = rechnungAendern(r.id, { mahnstufe: 1, letzteMahnungAm: vorTagen(13) })!;
    expect(naechsteStufe(r3)).toBeUndefined();
    const r4 = rechnungAendern(r.id, { letzteMahnungAm: vorTagen(14) })!;
    expect(naechsteStufe(r4)).toBe(2);
    const r5 = rechnungAendern(r.id, { mahnstufe: 3, letzteMahnungAm: vorTagen(30) })!;
    expect(naechsteStufe(r5)).toBeUndefined();
  });

  it('bereitet vor, fragt per Freigabe-Hinweis und sendet erst nach Freigabe', () => {
    const r = ueberfaellig(10);
    const { neu } = pruefen();
    expect(neu).toHaveLength(1);
    const m = neu[0];
    expect(m.stufe).toBe(1);
    expect(m.status).toBe('vorbereitet');
    expect(m.gebuehr).toBe(0);
    expect(m.zinsen).toBe(0);
    expect(rechnungX(r.id)?.mahnstufe).toBe(0);
    const h = db.hinweise.all().find((x) => x.schluessel === `mahnung-freigabe:${m.id}`)!;
    expect(h.status).toBe('offen');
    expect(h.aktionen?.map((a) => a.label)).toEqual(['Senden', 'Noch warten', 'Schreiben ansehen']);
    // zweimal prüfen erzeugt nichts doppelt
    expect(pruefen().neu).toHaveLength(0);
    expect(mahnungen.all()).toHaveLength(1);

    senden(m.id);
    expect(mahnungen.get(m.id)?.status).toBe('versendet');
    expect(rechnungX(r.id)?.mahnstufe).toBe(1);
    expect(rechnungX(r.id)?.letzteMahnungAm).toBe(heute());
    expect(db.hinweise.get(h.id)?.status).toBe('erledigt');
  });

  it('„Noch warten“ stellt die Frage zurück', () => {
    ueberfaellig(10);
    const m = pruefen().neu[0];
    warten(m.id, 7);
    expect(db.hinweise.where((h) => h.status === 'offen')).toHaveLength(0);
    pruefen();
    expect(db.hinweise.where((h) => h.status === 'offen')).toHaveLength(0);
    expect(mahnungen.get(m.id)?.wartenBis).toBe(plusTage(heute(), 7));
  });

  it('verwirft vorbereitete Schreiben, wenn inzwischen bezahlt wurde', () => {
    const r = ueberfaellig(10);
    const m = pruefen().neu[0];
    zahlungBuchen({ rechnungId: r.id, betrag: 119000 });
    const e = pruefen();
    expect(e.verworfen.map((x) => x.id)).toEqual([m.id]);
    expect(mahnungen.get(m.id)?.status).toBe('verworfen');
  });

  it('1. Mahnung mit Gebühr und Zinsen ab Verzugsbeginn, Kulanz ohne', () => {
    const r = ueberfaellig(40, t.firma.id);
    rechnungAendern(r.id, { mahnstufe: 1, letzteMahnungAm: vorTagen(20) });
    const b = berechnen(rechnungX(r.id)!, 2, { ...STANDARD_REGELN, basiszins: 1.27, pauschale40: true });
    expect(b.gebuehr).toBe(500 + 4000);
    // Verzug ab Fälligkeit + 30 Tage (keine versendete Erinnerung im System) → 10 Tage
    expect(b.zinsTage).toBe(10);
    expect(b.zinsen).toBe(verzugszinsen(119000, 10.27, 10));
    const k = berechnen(rechnungX(r.id)!, 2, STANDARD_REGELN, heute(), true);
    expect(k.gebuehr + k.zinsen).toBe(0);
  });

  it('Mahntext nennt Betrag, Frist und bei der 2. Mahnung das Mahnverfahren', () => {
    const r = ueberfaellig(60);
    rechnungAendern(r.id, { mahnstufe: 2, letzteMahnungAm: vorTagen(20) });
    const m = pruefen().neu[0];
    expect(m.stufe).toBe(3);
    const text = mahntext(m);
    expect(text.betreff).toMatch(/2\. Mahnung/);
    expect(text.absaetze.join(' ')).toMatch(/gerichtliche Mahnverfahren/);
    expect(text.gesamt).toBe(m.offen + m.gebuehr + m.zinsen);
  });
});
