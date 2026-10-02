import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@core/db';
import { on } from '@core/events';
import { heute } from '@core/format';
import { festschreiben, rechnungErstellen } from '../rechnungen/logik';
import { rechnungAendern, rechnungX } from '../rechnungen/typen';
import { testBetrieb } from '../rechnungen/testdaten';
import { csvZeile, importAusfuehren, kontoauszugLesen, skontoVorschlag, zahlungBuchen, zahlungLoeschen, zuordnen } from './logik';

let t: ReturnType<typeof testBetrieb>;

function offeneRechnung(kundeId = t.kunde.id, cent = 10000) {
  const a = db.auftraege.create({ nummer: `A-${Math.random()}`, titel: 'Arbeit', art: 'kundendienst', phase: 'abrechnung', kundeId });
  const r = rechnungErstellen(a.id)!;
  rechnungAendern(r.id, { leistungszeitraum: '01.09.2026', positionen: [{ id: 'p', art: 'leistung', text: 'Arbeit', menge: 1, einheit: 'Psch', einzelpreis: cent }] });
  festschreiben(r.id);
  return rechnungX(r.id)!;
}

beforeEach(() => {
  t = testBetrieb();
});

describe('Zahlung erfassen', () => {
  it('setzt teilbezahlt, dann bezahlt und feuert zahlung.eingegangen', () => {
    const r = offeneRechnung(); // 119,00 €
    let n = 0;
    const aus = on('zahlung.eingegangen', () => n++);
    zahlungBuchen({ rechnungId: r.id, betrag: 5000 });
    expect(rechnungX(r.id)?.status).toBe('teilbezahlt');
    zahlungBuchen({ rechnungId: r.id, betrag: 6900 });
    expect(rechnungX(r.id)?.status).toBe('bezahlt');
    aus();
    expect(n).toBe(2);
  });

  it('bucht Skonto als Rest und stellt den Status beim Löschen zurück', () => {
    const r = offeneRechnung();
    const v = skontoVorschlag(r, 11662)!;
    expect(v.rest).toBe(238);
    expect(v.prozent).toBe(2);
    expect(v.plausibel).toBe(true);
    const z = zahlungBuchen({ rechnungId: r.id, betrag: 11662, skonto: v.rest })!;
    expect(rechnungX(r.id)?.status).toBe('bezahlt');
    zahlungLoeschen(z.id);
    expect(rechnungX(r.id)?.status).toBe('versendet');
  });

  it('lehnt 0 € ab', () => {
    const r = offeneRechnung();
    expect(zahlungBuchen({ rechnungId: r.id, betrag: 0 })).toBeUndefined();
  });
});

describe('Kontoauszug', () => {
  it('zerlegt CSV mit Anführungszeichen', () => {
    expect(csvZeile('a;"b;c";"d ""e"""')).toEqual(['a', 'b;c', 'd "e"']);
  });

  it('liest gängige Bank-CSV mit Vorspann, deutschen Zahlen und nur Eingängen', () => {
    const csv = [
      'Kontoinhaber;Elektro Muster GmbH',
      'IBAN;DE02120300000000202051',
      '',
      'Buchungstag;Valuta;Name Zahlungsbeteiligter;Verwendungszweck;Betrag (EUR)',
      '05.09.2026;05.09.2026;Hoffmann;"RE R-2026-0001, danke";1.190,00',
      '06.09.26;06.09.26;Stadtwerke;Strom;-89,00',
    ].join('\r\n');
    const { umsaetze, fehler } = kontoauszugLesen(csv);
    expect(fehler).toBeUndefined();
    expect(umsaetze).toHaveLength(1);
    expect(umsaetze[0]).toMatchObject({ datum: '2026-09-05', betrag: 119000, name: 'Hoffmann' });
  });

  it('versteht Soll/Haben-Spalten', () => {
    const csv = 'Buchungsdatum;Auftraggeber;Buchungstext;Soll;Haben\n01.09.2026;Sommer KG;Zahlung;;250,50\n02.09.2026;Bank;Gebühr;4,90;';
    const { umsaetze } = kontoauszugLesen(csv);
    expect(umsaetze).toHaveLength(1);
    expect(umsaetze[0].betrag).toBe(25050);
  });

  it('meldet fehlende Kopfzeile', () => {
    expect(kontoauszugLesen('irgendwas;ohne;kopf').fehler).toMatch(/Kopfzeile/);
  });

  it('ordnet über Rechnungsnummer, Betrag + Kunde, und markiert Unsicheres', () => {
    const r1 = offeneRechnung(t.kunde.id, 10000); // 119,00
    const r2 = offeneRechnung(t.firma.id, 20000); // 238,00
    const r3 = offeneRechnung(t.firma.id, 30000); // 357,00
    const z = zuordnen([
      { zeile: 1, datum: heute(), betrag: 11900, zweck: `Rechnung ${r1.nummer.replace(/-/g, ' ')}`, name: 'X' },
      { zeile: 2, datum: heute(), betrag: 23800, zweck: 'Danke', name: 'Bäckerei Sommer KG' },
      { zeile: 3, datum: heute(), betrag: 35700, zweck: 'Überweisung', name: 'Unbekannt' },
      { zeile: 4, datum: heute(), betrag: 999, zweck: 'Irgendwas', name: 'Niemand' },
    ]);
    expect(z[0]).toMatchObject({ rechnungId: r1.id, sicherheit: 'sicher' });
    expect(z[1]).toMatchObject({ rechnungId: r2.id, sicherheit: 'sicher' });
    expect(z[2]).toMatchObject({ rechnungId: r3.id, sicherheit: 'unsicher' });
    expect(z[3].sicherheit).toBe('keine');

    const e = importAusfuehren(z);
    expect(e).toEqual({ gebucht: 2, summe: 35700, freigaben: 1 });
    expect(rechnungX(r1.id)?.status).toBe('bezahlt');
    expect(rechnungX(r3.id)?.status).toBe('versendet');
    const h = db.hinweise.all().find((x) => x.bezug?.id === r3.id);
    expect(h?.art).toBe('freigabe');
    expect(h?.aktionen?.[0].id).toBe('zahlung.bestaetigen');

    // erneuter Import erkennt Doppelte
    const nochmal = zuordnen([{ zeile: 1, datum: heute(), betrag: 11900, zweck: r1.nummer, name: 'X' }]);
    expect(nochmal[0].sicherheit).toBe('doppelt');
  });

  it('erkennt Teilzahlung mit Rechnungsnummer als sicher', () => {
    const r = offeneRechnung();
    const z = zuordnen([{ zeile: 1, datum: heute(), betrag: 5000, zweck: r.nummer, name: '' }]);
    expect(z[0].sicherheit).toBe('sicher');
    expect(z[0].grund).toMatch(/Teilzahlung/);
  });
});
