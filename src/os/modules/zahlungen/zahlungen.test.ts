import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@core/db';
import { on } from '@core/events';
import { festschreiben, rechnungErstellen } from '../rechnungen/logik';
import { rechnungAendern, rechnungX } from '../rechnungen/typen';
import { testBetrieb } from '../rechnungen/testdaten';
import { csvZeile, kontoauszugLesen, skontoVorschlag, zahlungBuchen, zahlungLoeschen } from './logik';

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

  it('liest die IBAN-Spalte mit', () => {
    const csv = 'Buchungstag;Name Zahlungsbeteiligter;IBAN Zahlungsbeteiligter;Verwendungszweck;Betrag (EUR)\n01.09.2026;Sommer KG;DE89 3704 0044 0532 0130 00;Zahlung;250,50';
    expect(kontoauszugLesen(csv).umsaetze[0].iban).toBe('DE89370400440532013000');
  });

  it('feuert rechnung.bezahlt genau einmal, wenn die Rechnung bezahlt ist', () => {
    const r = offeneRechnung();
    const ids: string[] = [];
    const aus = on('rechnung.bezahlt', (e) => ids.push(e.objekt!.id));
    zahlungBuchen({ rechnungId: r.id, betrag: 5000 });
    expect(ids).toEqual([]);
    zahlungBuchen({ rechnungId: r.id, betrag: 6900 });
    aus();
    expect(ids).toEqual([r.id]);
    expect(db.ereignisse.all().length).toBeGreaterThan(0);
  });
});
