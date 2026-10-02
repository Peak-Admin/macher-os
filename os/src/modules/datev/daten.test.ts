import { describe, expect, it } from 'vitest';
import type { Beleg, Kunde, Lieferant, Position, Rechnung } from '@core/objects';
import {
  abschlussPunkte,
  aufwandAus,
  aufwandKonto,
  belegdatumDatev,
  belegfeld,
  betragDatev,
  buchungenErzeugen,
  cp1252Bytes,
  cp1252Text,
  dateiname,
  einstellungenPruefen,
  erloesKonto,
  extfDatei,
  kopfzeile,
  monatsSpanne,
  personenkonto,
  SPALTEN,
  steuersatzAus,
  zeitraumPruefen,
  type ExportOptionen,
} from './daten';

const basis = { id: '', erstelltAm: '', geaendertAm: '' };
const pos = (einzelpreis: number): Position => ({ id: 'p', art: 'leistung', text: 't', menge: 1, einheit: 'Stk', einzelpreis });
const r = (id: string, x: Partial<Rechnung> = {}): Rechnung => ({ ...basis, id, nummer: `R-2026-${id}`, art: 'rechnung', kundeId: 'k1', titel: '', positionen: [pos(100000)], status: 'versendet', datum: '2026-09-05', faelligAm: '2026-09-19', mahnstufe: 0, ...x });
const beleg = (id: string, x: Partial<Beleg> = {}): Beleg => ({ ...basis, id, art: 'eingangsrechnung', datum: '2026-09-10', netto: 10000, ust: 1900, status: 'geprueft', ...x });
const kunden: Kunde[] = [
  { ...basis, id: 'k1', art: 'privat', name: 'Familie Hoffmann', ansprechpartner: [] },
  { ...basis, id: 'k2', art: 'firma', name: 'Mehmet Yılmaz "Bau"', ansprechpartner: [] },
];
const lieferanten: Lieferant[] = [{ ...basis, id: 'l1', name: 'Elektro-Großhandel Süd' }];
const opt = (x: Partial<ExportOptionen> = {}): ExportOptionen => ({ von: '2026-09-01', bis: '2026-09-30', rahmen: 'SKR03', ustSatz: 19, debitoren: {}, kreditoren: {}, rechnungenExportiert: {}, ...x });

describe('Konten', () => {
  it('kennt Erlöskonten in SKR03 und SKR04', () => {
    expect(erloesKonto('SKR03', 19)).toBe(8400);
    expect(erloesKonto('SKR04', 19)).toBe(4400);
    expect(erloesKonto('SKR03', 7)).toBe(8300);
    expect(erloesKonto('SKR04', 19, true)).toBe(4185);
  });
  it('ordnet Belegkategorien Aufwandskonten zu', () => {
    expect(aufwandAus({ kategorie: 'Material', art: 'eingangsrechnung' })).toBe('material');
    expect(aufwandAus({ art: 'tankbeleg' })).toBe('fahrzeug');
    expect(aufwandAus({ kategorie: 'Werkzeug', art: 'quittung' })).toBe('werkzeug');
    expect(aufwandAus({ kategorie: 'Kaffee', art: 'quittung' })).toBe('sonstiges');
    expect(aufwandKonto('SKR03', 'material', 19)).toEqual({ konto: 3400 });
    expect(aufwandKonto('SKR04', 'material', 7)).toEqual({ konto: 5300 });
    expect(aufwandKonto('SKR03', 'fahrzeug', 19)).toEqual({ konto: 4530, bu: '9' });
    expect(aufwandKonto('SKR04', 'fahrzeug', 7)).toEqual({ konto: 6530, bu: '8' });
    expect(aufwandKonto('SKR04', 'buero', 0)).toEqual({ konto: 6815, bu: undefined });
  });
  it('erkennt Steuersätze mit Rundungstoleranz', () => {
    expect(steuersatzAus(61240, 11636)).toBe(19);
    expect(steuersatzAus(1000, 70)).toBe(7);
    expect(steuersatzAus(1000, 0)).toBe(0);
    expect(steuersatzAus(1000, 123)).toBeUndefined();
  });
  it('vergibt Personenkonten fortlaufend und stabil', () => {
    let v: Record<string, number> = {};
    const a = personenkonto(v, 'k1', 10000);
    v = a.vergeben;
    const b = personenkonto(v, 'k2', 10000);
    expect([a.nr, b.nr]).toEqual([10000, 10001]);
    expect(personenkonto(b.vergeben, 'k1', 10000).nr).toBe(10000);
  });
});

describe('Formatierung', () => {
  it('Beträge mit Komma, ohne Tausenderpunkt', () => {
    expect(betragDatev(123456)).toBe('1234,56');
    expect(betragDatev(5)).toBe('0,05');
    expect(betragDatev(-1990)).toBe('19,90');
  });
  it('Belegdatum TTMM und Belegfeld 1 bereinigt', () => {
    expect(belegdatumDatev('2026-09-05')).toBe('0509');
    expect(belegfeld('R-2026-0001')).toBe('R-2026-0001');
    expect(belegfeld('re nr. 4711_ä')).toBe('RENR4711');
    expect(belegfeld('x'.repeat(50))).toHaveLength(36);
  });
  it('macht Text Windows-1252-tauglich', () => {
    expect(cp1252Text('Yılmaz – Größe „gut“ €')).toBe('Yilmaz – Größe „gut“ €');
    expect(cp1252Text('Łódź 😀')).toBe('Lódz ?');
    expect([...cp1252Bytes('Ä€–')]).toEqual([0xc4, 0x80, 0x96]);
  });
});

describe('Buchungen', () => {
  const daten = {
    rechnungen: [
      r('0001'),
      r('0002', { kundeId: 'k2', art: 'gutschrift', positionen: [pos(10000)], datum: '2026-09-20' }),
      r('0003', { status: 'entwurf' }),
      r('0004', { datum: '2026-10-01' }),
    ],
    belege: [
      beleg('b1', { lieferantId: 'l1', kategorie: 'Material', nummer: 'RE 4711' }),
      beleg('b2', { art: 'tankbeleg', netto: 5000, ust: 950 }),
      beleg('b3', { lieferantName: 'Baumarkt', kategorie: 'Werkzeug', exportiertAm: '2026-09-30T10:00:00Z' }),
    ],
    kunden,
    lieferanten,
  };

  it('bucht Rechnungen gegen Erlöse und Belege gegen Kreditor bzw. Kasse', () => {
    const e = buchungenErzeugen(daten, opt());
    expect(e.buchungen).toHaveLength(4);
    const [re, gs, mat, tank] = e.buchungen;
    expect(re).toMatchObject({ umsatz: 119000, sh: 'S', konto: 10000, gegenkonto: 8400, belegfeld1: 'R-2026-0001' });
    expect(gs).toMatchObject({ umsatz: 11900, sh: 'H', konto: 10001, gegenkonto: 8400 });
    expect(gs.text).toContain('Gutschrift');
    expect(mat).toMatchObject({ umsatz: 11900, konto: 3400, gegenkonto: 70000, bu: undefined });
    expect(tank).toMatchObject({ umsatz: 5950, konto: 4530, gegenkonto: 1000, bu: '9' });
    expect(e.uebersprungen).toBe(1);
    expect(e.debitoren).toEqual({ k1: 10000, k2: 10001 });
    expect(e.kreditoren).toEqual({ l1: 70000 });
  });

  it('verhindert doppelte Exporte und meldet sie', () => {
    const e = buchungenErzeugen(daten, opt({ rechnungenExportiert: { '0001': '2026-09-30T00:00:00Z' } }));
    expect(e.rechnungIds).toEqual(['0002']);
    expect(e.doppelt).toEqual({ rechnungen: ['0001'], belege: ['b3'] });
    const nochmal = buchungenErzeugen(daten, opt({ rechnungenExportiert: { '0001': 'x' }, auchExportierte: true }));
    expect(nochmal.rechnungIds).toEqual(['0001', '0002']);
    expect(nochmal.belegIds).toContain('b3');
  });

  it('nutzt SKR04 und warnt bei unklarem Steuersatz', () => {
    const e = buchungenErzeugen({ ...daten, belege: [beleg('x', { netto: 10000, ust: 1234, kategorie: 'Büro' })] }, opt({ rahmen: 'SKR04' }));
    expect(e.buchungen[0].gegenkonto).toBe(4400);
    expect(e.buchungen.at(-1)).toMatchObject({ konto: 6815, bu: '9', gegenkonto: 70000 });
    expect(e.warnungen.some((w) => w.includes('Steuersatz nicht eindeutig'))).toBe(true);
  });

  it('übernimmt vergebene Personenkonten', () => {
    const e = buchungenErzeugen(daten, opt({ debitoren: { k2: 10007 } }));
    expect(e.debitoren).toEqual({ k2: 10007, k1: 10008 });
  });
});

describe('EXTF-Datei', () => {
  const kopf = { beraterNr: '29098', mandantNr: '55003', von: '2026-09-01', bis: '2026-09-30', rahmen: 'SKR03' as const, erzeugtAm: new Date(2026, 9, 2, 14, 5, 9, 7) };

  it('hat eine korrekte Kopfzeile mit 31 Feldern', () => {
    const k = kopfzeile(kopf).split(';');
    expect(k).toHaveLength(31);
    expect(k.slice(0, 6)).toEqual(['"EXTF"', '700', '21', '"Buchungsstapel"', '13', '20261002140509007']);
    expect(k[10]).toBe('29098');
    expect(k[11]).toBe('55003');
    expect(k[12]).toBe('20260101');
    expect(k[13]).toBe('4');
    expect(k[14]).toBe('20260901');
    expect(k[15]).toBe('20260930');
    expect(k[21]).toBe('"EUR"');
    expect(k[26]).toBe('"03"');
    expect(kopfzeile({ ...kopf, rahmen: 'SKR04' }).split(';')[26]).toBe('"04"');
  });

  it('schreibt Spaltenköpfe und Buchungszeilen mit Semikolon und CRLF', () => {
    const e = buchungenErzeugen({ rechnungen: [r('0001', { kundeId: 'k2' })], belege: [], kunden, lieferanten }, opt());
    const datei = extfDatei(e.buchungen, kopf);
    const zeilen = datei.split('\r\n');
    expect(zeilen).toHaveLength(4); // Kopf, Spalten, 1 Buchung, leere letzte Zeile
    expect(zeilen[1].split(';')).toHaveLength(SPALTEN.length);
    const b = zeilen[2].split(';');
    expect(b).toHaveLength(SPALTEN.length);
    expect(b.slice(0, 11)).toEqual(['1190,00', '"S"', '"EUR"', '', '', '""', '10000', '8400', '""', '0509', '"R-2026-0001"']);
    expect(b[13]).toBe('"Rechnung Mehmet Yilmaz ""Bau"""');
    expect(datei).not.toMatch(/ı/);
  });

  it('benennt die Datei nach Zeitraum', () => {
    expect(dateiname('2026-09-01', '2026-09-30')).toBe('EXTF_Buchungsstapel_20260901_20260930.csv');
  });
});

describe('Prüfungen', () => {
  it('prüft Berater- und Mandantennummer', () => {
    expect(einstellungenPruefen({ rahmen: 'SKR03', beraterNr: '29098', mandantNr: '55003' })).toEqual({});
    const f = einstellungenPruefen({ rahmen: 'SKR03', beraterNr: '12', mandantNr: 'abc' });
    expect(f.beraterNr).toBeDefined();
    expect(f.mandantNr).toBeDefined();
  });
  it('erlaubt nur ein Wirtschaftsjahr je Stapel', () => {
    expect(zeitraumPruefen('2026-09-01', '2026-09-30')).toBeUndefined();
    expect(zeitraumPruefen('2025-12-01', '2026-01-31')).toMatch(/Wirtschaftsjahr/);
    expect(zeitraumPruefen('2026-09-30', '2026-09-01')).toBeDefined();
  });
});

describe('Monatsabschluss', () => {
  it('berechnet die Spanne eines Monats', () => {
    expect(monatsSpanne('2026-02')).toEqual({ von: '2026-02-01', bis: '2026-02-28' });
  });
  it('prüft automatisch, was die Daten hergeben', () => {
    const p = abschlussPunkte(
      {
        rechnungen: [r('1'), r('2', { status: 'entwurf' })],
        belege: [beleg('b1', { status: 'neu' }), beleg('b2', { exportiertAm: 'x' })],
        zeiten: [{ datum: '2026-09-02', freigegeben: true, ende: '16:00' }, { datum: '2026-09-03' }],
      },
      '2026-09',
      { 'belege-vollstaendig': true },
      {},
    );
    const nach = Object.fromEntries(p.map((x) => [x.id, x]));
    expect(nach['belege-vollstaendig'].erledigt).toBe(true);
    expect(nach['belege-vollstaendig'].text).toContain('2 Belege');
    expect(nach['belege-geprueft'].erledigt).toBe(false);
    expect(nach['rechnungen-raus'].text).toContain('1 Rechnungsentwurf');
    expect(nach['zeiten-freigegeben'].erledigt).toBe(false);
    expect(nach['kasse-bank'].erledigt).toBe(false);
    expect(nach['export'].text).toContain('2 Buchungen');
  });
});
