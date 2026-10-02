import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import { fehlendePlatzhalter, kontextAus, platzhalterErsetzen, startVorlagen, vorlageAnwenden, vorlagen, betreffAnwenden } from './daten';
import { briefkopf } from '@ui/index';

beforeEach(() => {
  zuruecksetzen();
  db.betrieb.create({
    id: 'betrieb',
    name: 'Elektro Muster',
    gewerk: 'elektro',
    arbeitsweisen: [],
    teamgroesse: 3,
    adresse: { strasse: 'Weg 1', plz: '34117', ort: 'Kassel' },
    telefon: '0561 1',
    email: 'info@muster.example',
    iban: 'de02120300000000202051',
    steuernummer: '026/123/45678',
    stundensatz: 6800,
    zahlungszielTage: 14,
    ustSatz: 19,
    arbeitsbeginn: '07:00',
    arbeitsende: '16:00',
    onboardingFertig: true,
  });
});

describe('Platzhalter', () => {
  it('ersetzt bekannte und lässt unbekannte stehen', () => {
    expect(platzhalterErsetzen('Hallo {kunde}, {betrag} bis {faellig}.', { kunde: 'Frau Schulz', betrag: '119,00 €' })).toBe('Hallo Frau Schulz, 119,00 € bis {faellig}.');
  });
  it('findet fehlende Werte', () => {
    expect(fehlendePlatzhalter('{kunde} {kunde} {datum} {auftrag}', { kunde: 'X', auftrag: '' })).toEqual(['datum', 'auftrag']);
  });
});

describe('vorlageAnwenden', () => {
  it('findet über Schlüssel und über ID und setzt Betriebsdaten automatisch ein', () => {
    const v = vorlagen.create({ schluessel: 'test.gruss', art: 'email', titel: 'Gruß', betreff: 'Für {kunde}', text: 'Hallo {kunde}, viele Grüße von {betrieb}.' });
    expect(vorlageAnwenden('test.gruss', { kunde: 'Familie Hoffmann' })).toBe('Hallo Familie Hoffmann, viele Grüße von Elektro Muster.');
    expect(vorlageAnwenden(v.id, { kunde: 'Petra' })).toBe('Hallo Petra, viele Grüße von Elektro Muster.');
    expect(betreffAnwenden('test.gruss', { kunde: 'Petra' })).toBe('Für Petra');
  });
  it('gibt leeren Text für unbekannte Vorlagen', () => {
    expect(vorlageAnwenden('gibt.es.nicht')).toBe('');
  });
  it('nimmt bei gleichem Schlüssel die zuletzt geänderte und ignoriert gelöschte', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T10:00:00Z'));
    vorlagen.create({ schluessel: 's', art: 'email', titel: 'a', text: 'A' });
    const b = vorlagen.create({ schluessel: 's', art: 'email', titel: 'b', text: 'B' });
    vi.setSystemTime(new Date('2026-01-02T10:00:00Z'));
    vorlagen.update(b.id, { text: 'B2' });
    expect(vorlageAnwenden('s')).toBe('B2');
    vorlagen.remove(b.id);
    expect(vorlageAnwenden('s')).toBe('A');
  });
});

afterEach(() => vi.useRealTimers());

describe('Kontext aus Objekten', () => {
  it('liest Kunde, Auftrag, Rechnung und offenen Betrag', () => {
    const k = db.kunden.create({ art: 'privat', name: 'Petra Schulz', ansprechpartner: [] });
    const a = db.auftraege.create({ nummer: 'A-1', titel: 'Steckdosen Bad', art: 'kundendienst', phase: 'abrechnung', kundeId: k.id });
    const r = db.rechnungen.create({
      nummer: 'R-1', art: 'rechnung', auftragId: a.id, kundeId: k.id, titel: 'x',
      positionen: [{ id: 'p', art: 'leistung', text: 'x', menge: 1, einheit: 'Stk', einzelpreis: 10000 }],
      status: 'versendet', datum: '2026-09-01', faelligAm: '2026-09-15', mahnstufe: 0,
    });
    db.zahlungen.create({ rechnungId: r.id, betrag: 1900, datum: '2026-09-10', art: 'ueberweisung' });
    const k2 = kontextAus({ rechnungId: r.id });
    expect(k2.kunde).toBe('Petra Schulz');
    expect(k2.anrede).toBe('Guten Tag Petra Schulz');
    expect(k2.auftrag).toBe('Steckdosen Bad');
    expect(k2.rechnungsnummer).toBe('R-1');
    expect(k2.faellig).toBe('15.09.2026');
    expect(String(k2.betrag).replace(/\s/g, ' ')).toBe('119,00 €');
    expect(String(k2.offen).replace(/\s/g, ' ')).toBe('100,00 €');
  });
});

describe('Startvorlagen und Briefkopf', () => {
  it('hat für jedes Gewerk alle Pflicht-Schlüssel', () => {
    for (const g of ['elektro', 'shk', 'sonstiges'] as const) {
      const s = startVorlagen(g).map((v) => v.schluessel);
      expect(s).toEqual(expect.arrayContaining(['angebot.einleitung', 'angebot.schluss', 'rechnung.text', 'mahnung.erinnerung', 'email.rechnung', 'termin.bestaetigung']));
    }
    expect(startVorlagen('shk').find((v) => v.schluessel === 'termin.bestaetigung')!.text).toMatch(/Heizraum/);
  });
  it('baut die Fußzeile aus den Betriebsdaten', () => {
    const b = briefkopf({ zeigeBank: true, zeigeSteuer: true, zusatz: 'Eingetragen bei der HWK Kassel' });
    expect(b.absenderzeile).toBe('Elektro Muster · Weg 1, 34117 Kassel');
    expect(b.fusszeilen).toContain('IBAN DE02 1203 0000 0000 2020 51');
    expect(b.fusszeilen).toContain('Steuernr. 026/123/45678');
    expect(b.fusszeilen.at(-1)).toBe('Eingetragen bei der HWK Kassel');
    expect(briefkopf({ zeigeBank: false, zeigeSteuer: false }).fusszeilen.some((z) => z.includes('IBAN'))).toBe(false);
  });
});
