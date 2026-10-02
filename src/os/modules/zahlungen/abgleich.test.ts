import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@core/db';
import { on } from '@core/events';
import { setzeEinstellung } from '@core/einstellungen';
import { heute } from '@core/format';
import { festschreiben, rechnungErstellen } from '../rechnungen/logik';
import { rechnungAendern, rechnungX } from '../rechnungen/typen';
import { testBetrieb } from '../rechnungen/testdaten';
import {
  abgleichen,
  bewerten,
  einlesen,
  ignorieren,
  kontext,
  nummernImText,
  nummerPasst,
  nummerTeile,
  vorschau,
  zuordnen,
  zuordnungAufheben,
  zuordnungVorschau,
} from './abgleich';
import { bankumsaetze, type ZahlungMitUmsatz } from './daten';
import { camtLesen, istCamt } from './camt';
import type { Umsatz } from './logik';
import zahlungenModul from './index';

let t: ReturnType<typeof testBetrieb>;

/** Festgeschriebene Rechnung über `netto` Cent (brutto = netto × 1,19) */
function rechnung(kundeId = t.kunde.id, netto = 10000) {
  const a = db.auftraege.create({ nummer: `A-${Math.random()}`, titel: 'Arbeit', art: 'kundendienst', phase: 'abrechnung', kundeId });
  const r = rechnungErstellen(a.id)!;
  rechnungAendern(r.id, { leistungszeitraum: '01.09.2026', positionen: [{ id: 'p', art: 'leistung', text: 'Arbeit', menge: 1, einheit: 'Psch', einzelpreis: netto }] });
  festschreiben(r.id);
  return rechnungX(r.id)!;
}

let zeile = 0;
const umsatz = (betrag: number, zweck = '', name = '', extra: Partial<Umsatz> = {}): Umsatz => ({ zeile: ++zeile, datum: heute(), betrag, zweck, name, ...extra });
const teile = (nummer: string) => {
  const x = nummerTeile(nummer)!;
  return { jahr: x.jahr!, lfd: x.lfd };
};
const ohneNbsp = (s?: string) => s?.replace(/\u00a0/g, ' ');
const verstuemmelt = (nummer: string) => `RE ${teile(nummer).jahr} ${teile(nummer).lfd}`;

beforeEach(() => {
  t = testBetrieb();
});

describe('Rechnungsnummern erkennen', () => {
  it('zerlegt die eigene Nummer', () => {
    expect(nummerTeile('R-2026-0042')).toEqual({ praefix: 'R', jahr: 2026, lfd: 42 });
    expect(nummerTeile('4711')).toEqual({ lfd: 4711 });
    expect(nummerTeile(undefined)).toBeUndefined();
  });

  it.each([
    ['R-2026-0042', 2026, 42],
    ['RE 2026 42', 2026, 42],
    ['Rg.Nr. 2026/42 danke', 2026, 42],
    ['R20260042', 2026, 42],
    ['Rechnung R 2026-042, Kd 1001', 2026, 42],
    ['re2026.0042', 2026, 42],
  ])('findet „%s“ mit Jahr', (text, jahr, lfd) => {
    expect(nummernImText(text)).toContainEqual({ jahr, lfd, stark: true });
  });

  it('findet eine Nummer ohne Jahr nur als schwachen Hinweis', () => {
    expect(nummernImText('Rechnung 42')).toEqual([{ lfd: 42, stark: false }]);
    expect(nummernImText('Rechnungsnr. 0042')).toEqual([{ lfd: 42, stark: false }]);
    expect(nummernImText('RE-Nr: 42 Bad')).toEqual([{ lfd: 42, stark: false }]);
  });

  it('hält Datum, IBAN und Beträge nicht für Rechnungsnummern', () => {
    expect(nummernImText('Zahlung vom 05.09.2026')).toEqual([]);
    expect(nummernImText('Buchung 2026-09-05')).toEqual([]);
    expect(nummernImText('IBAN DE02120300000000202051')).toEqual([]);
    expect(nummernImText('Danke für die schnelle Hilfe')).toEqual([]);
  });

  it('bewertet die Übereinstimmung mit einer Rechnung', () => {
    expect(nummerPasst({ nummer: 'R-2026-0042' }, 'RE 2026 42')).toBe('stark');
    expect(nummerPasst({ nummer: 'R-2026-0042' }, 'R-2026-0042')).toBe('stark');
    expect(nummerPasst({ nummer: 'R-2026-0042' }, 'Rechnung 42')).toBe('schwach');
    expect(nummerPasst({ nummer: 'R-2026-0042' }, 'RE 2025 42')).toBeUndefined();
    expect(nummerPasst({ nummer: 'R-2026-0042' }, 'R-2026-0421')).toBeUndefined();
    expect(nummerPasst({ nummer: '' }, 'R-2026-0042')).toBeUndefined();
  });
});

describe('Zuordnung bewerten', () => {
  it('verstümmelte Nummer + Betrag → eindeutig, bezahlt', () => {
    const r = rechnung(); // 119,00 €
    const b = bewerten(umsatz(11900, `Rechnung ${verstuemmelt(r.nummer)}`, 'Unbekannt'), kontext());
    expect(b.entscheidung).toBe('eindeutig');
    expect(b.buchungen).toEqual([{ rechnungId: r.id, betrag: 11900, skonto: undefined }]);
    expect(b.ergebnis).toBe('bezahlt');
    expect(b.grund).toMatch(/Rechnungsnummer/);
  });

  it('Nummer + Teilbetrag → eindeutig, teilweise bezahlt', () => {
    const r = rechnung();
    const b = bewerten(umsatz(5000, r.nummer), kontext());
    expect(b.entscheidung).toBe('eindeutig');
    expect(ohneNbsp(b.ergebnis)).toBe('teilweise bezahlt, 69,00 € offen');
  });

  it('erkennt Skonto bis 3 % und bucht die Differenz als Skonto', () => {
    const r = rechnung();
    const b = bewerten(umsatz(11662, r.nummer), kontext()); // 2 % Skonto
    expect(b.entscheidung).toBe('eindeutig');
    expect(b.buchungen?.[0]).toEqual({ rechnungId: r.id, betrag: 11662, skonto: 238 });
    expect(b.ergebnis).toMatch(/Skonto/);
  });

  it('bucht Skonto nicht automatisch, wenn es ausgeschaltet ist', () => {
    setzeEinstellung('zahlungen.skontoAutomatisch', false);
    const r = rechnung();
    const b = bewerten(umsatz(11662, r.nummer), kontext());
    expect(b.buchungen?.[0].skonto).toBeUndefined();
    expect(ohneNbsp(b.ergebnis)).toBe('teilweise bezahlt, 2,38 € offen');
  });

  it('mehr als 3 % Differenz ist eine Teilzahlung, kein Skonto', () => {
    const r = rechnung();
    const b = bewerten(umsatz(11000, r.nummer), kontext());
    expect(b.treffer[0].betrag).toBe('teil');
    expect(b.buchungen?.[0].skonto).toBeUndefined();
  });

  it('Betrag + Name ohne Nummer → eindeutig', () => {
    const r = rechnung(t.firma.id, 20000); // 238,00
    rechnung(t.kunde.id, 30000);
    const b = bewerten(umsatz(23800, 'Danke', 'Bäckerei Sommer KG'), kontext());
    expect(b.entscheidung).toBe('eindeutig');
    expect(b.buchungen?.[0].rechnungId).toBe(r.id);
  });

  it('Betrag + Kundennummer im Zweck → eindeutig', () => {
    const r = rechnung(t.kunde.id, 30000);
    const b = bewerten(umsatz(35700, 'Kd-Nr K-1001 Heizung', 'H. Mustermann'), kontext());
    expect(b.entscheidung).toBe('eindeutig');
    expect(b.treffer[0]).toMatchObject({ kunde: 'kundennummer' });
    expect(b.buchungen?.[0].rechnungId).toBe(r.id);
  });

  it('nur der Betrag passt → Vorschlag', () => {
    const r = rechnung(t.firma.id, 30000);
    const b = bewerten(umsatz(35700, 'Überweisung', 'Unbekannt'), kontext());
    expect(b.entscheidung).toBe('vorschlag');
    expect(b.treffer[0].rechnung.id).toBe(r.id);
  });

  it('zwei gleiche Rechnungen desselben Kunden → Vorschlag statt Raten', () => {
    rechnung(t.kunde.id, 10000);
    rechnung(t.kunde.id, 10000);
    const b = bewerten(umsatz(11900, 'Danke', 'Familie Hoffmann'), kontext());
    expect(b.entscheidung).toBe('vorschlag');
    expect(b.grund).toMatch(/passt auch zu/);
    expect(b.treffer).toHaveLength(2);
  });

  it('nur der Name passt → Vorschlag', () => {
    const r = rechnung(t.kunde.id, 10000);
    const b = bewerten(umsatz(4000, 'Anzahlung', 'Hoffmann, Peter'), kontext());
    expect(b.entscheidung).toBe('vorschlag');
    expect(b.treffer[0].rechnung.id).toBe(r.id);
  });

  it('kurze Namensteile zählen nicht als Treffer', () => {
    db.kunden.update(t.kunde.id, { name: 'Max Ott' });
    rechnung(t.kunde.id, 10000);
    expect(bewerten(umsatz(4000, 'Ottoversand', 'Otto'), kontext()).entscheidung).toBe('keine');
  });

  it('nichts passt → keine', () => {
    rechnung();
    const b = bewerten(umsatz(999, 'Irgendwas', 'Niemand'), kontext());
    expect(b.entscheidung).toBe('keine');
    expect(b.treffer).toEqual([]);
  });

  it('Überzahlung wird nicht automatisch gebucht', () => {
    const r = rechnung();
    const b = bewerten(umsatz(20000, r.nummer), kontext());
    expect(b.entscheidung).toBe('vorschlag');
    expect(ohneNbsp(b.ergebnis)).toBe('bezahlt, 81,00 € zu viel überwiesen');
  });

  it('schwache Nummer + genauer Betrag → eindeutig', () => {
    const r = rechnung();
    const b = bewerten(umsatz(11900, `Rechnung ${teile(r.nummer).lfd}`, ''), kontext());
    expect(b.entscheidung).toBe('eindeutig');
  });

  it('Sammelzahlung für zwei Rechnungen', () => {
    const r1 = rechnung(t.kunde.id, 10000);
    const r2 = rechnung(t.kunde.id, 20000);
    const b = bewerten(umsatz(35700, `RE ${r1.nummer} und ${r2.nummer}`), kontext());
    expect(b.entscheidung).toBe('eindeutig');
    expect(b.buchungen).toEqual([
      { rechnungId: r1.id, betrag: 11900 },
      { rechnungId: r2.id, betrag: 23800 },
    ]);
  });

  it('verteilt mehrere Umsätze im selben Lauf nicht doppelt auf eine Rechnung', () => {
    const r = rechnung();
    const ctx = kontext();
    expect(bewerten(umsatz(11900, r.nummer), ctx).entscheidung).toBe('eindeutig');
    expect(bewerten(umsatz(11900, r.nummer), ctx).entscheidung).toBe('keine');
  });

  it('erkennt den Kunden an der IBAN aus früheren Zuordnungen', () => {
    const iban = 'DE89370400440532013000';
    const r1 = rechnung(t.firma.id, 10000);
    const { neu } = einlesen([umsatz(11900, 'Danke', 'S. Meier', { iban })], 'csv');
    abgleichen({ automatisch: true });
    expect(bankumsaetze.get(neu[0].id)?.status).toBe('vorschlag');
    expect(zuordnen(neu[0].id, r1.id)).toBe(true);

    const r2 = rechnung(t.firma.id, 5000); // 59,50
    rechnung(t.kunde.id, 5000);
    const b = bewerten(umsatz(5950, 'Danke', 'S. Meier', { iban }), kontext());
    expect(b.entscheidung).toBe('eindeutig');
    expect(b.treffer[0]).toMatchObject({ kunde: 'iban' });
    expect(b.buchungen?.[0].rechnungId).toBe(r2.id);
  });

  it('ein Datum im Verwendungszweck führt nicht zu einer falschen Rechnung', () => {
    rechnung(); // R-…-0001
    expect(bewerten(umsatz(5000, `Abschlag vom ${heute()}`, 'Niemand'), kontext()).entscheidung).toBe('keine');
  });
});

describe('Abgleich ausführen', () => {
  it('bucht Eindeutiges, meldet Unklares, feuert Ereignisse und lässt sich rückgängig machen', () => {
    const r1 = rechnung(t.kunde.id, 10000);
    const r2 = rechnung(t.firma.id, 30000);
    const ereignisse: string[] = [];
    const aus = [on('zahlung.eingegangen', (e) => ereignisse.push(e.typ)), on('rechnung.bezahlt', (e) => ereignisse.push(`${e.typ}:${e.objekt?.id}`))];

    const { neu } = einlesen([umsatz(11900, `Rechnung ${verstuemmelt(r1.nummer)}`, 'Hoffmann'), umsatz(35700, 'Überweisung', 'Unbekannt'), umsatz(999, 'Erstattung', 'Versicherung')], 'csv');
    const e = abgleichen({ automatisch: true });
    aus.forEach((f) => f());

    expect(e).toEqual({ zugeordnet: 1, summe: 11900, vorschlaege: 1, offen: 1 });
    expect(rechnungX(r1.id)?.status).toBe('bezahlt');
    expect(rechnungX(r2.id)?.status).toBe('versendet');
    expect([...ereignisse].sort()).toEqual([`rechnung.bezahlt:${r1.id}`, 'zahlung.eingegangen']);

    const u1 = bankumsaetze.get(neu[0].id)!;
    expect(u1).toMatchObject({ status: 'zugeordnet', automatisch: true });
    const z = db.zahlungen.get(u1.zahlungIds![0]) as ZahlungMitUmsatz;
    expect(z).toMatchObject({ rechnungId: r1.id, betrag: 11900, umsatzId: u1.id, quelle: 'kontoauszug', zahler: 'Hoffmann' });
    const erl = db.erledigungen.all().find((x) => x.rueckgaengig?.aktion === 'zahlung.zuordnung_aufheben');
    expect(erl?.rueckgaengig?.payload).toEqual({ umsatzId: u1.id });
    expect(bankumsaetze.get(neu[1].id)).toMatchObject({ status: 'vorschlag', vorschlagIds: [r2.id] });
    expect(bankumsaetze.get(neu[2].id)?.status).toBe('offen');

    // Rückgängig: Rechnung wieder offen, Umsatz wartet auf Zuordnung
    expect(zuordnungAufheben(u1.id)).toBe(true);
    expect(rechnungX(r1.id)?.status).toBe('versendet');
    expect(bankumsaetze.get(u1.id)).toMatchObject({ status: 'offen', vorschlagIds: [r1.id] });
    expect(db.zahlungen.get(z.id)?.geloeschtAm).toBeDefined(); // Papierkorb, nicht weg
  });

  it('ohne Automatik wird auch Eindeutiges nur vorgeschlagen', () => {
    const r = rechnung();
    einlesen([umsatz(11900, r.nummer)], 'bank');
    expect(abgleichen({ automatisch: false })).toMatchObject({ zugeordnet: 0, vorschlaege: 1 });
    expect(rechnungX(r.id)?.status).toBe('versendet');
  });

  it('importiert denselben Kontoauszug kein zweites Mal', () => {
    rechnung();
    const liste = [umsatz(5000, 'A', 'X'), umsatz(5000, 'A', 'X')];
    expect(einlesen(liste, 'csv').neu).toHaveLength(2); // zwei gleiche Umsätze am selben Tag bleiben zwei
    expect(einlesen(liste, 'csv')).toMatchObject({ neu: [], doppelt: 2 });
    expect(vorschau(liste).map((b) => b.entscheidung)).toEqual(['doppelt', 'doppelt']);
    expect(einlesen([umsatz(5000, 'A', 'X', { referenz: 'camt:REF1' })], 'camt').neu).toHaveLength(1);
    expect(einlesen([umsatz(5000, 'A', 'X', { referenz: 'camt:REF1' })], 'camt').doppelt).toBe(1);
  });

  it('ordnet von Hand mit Skonto zu und zeigt vorher das Ergebnis', () => {
    const r = rechnung();
    const { neu } = einlesen([umsatz(11662, 'Danke', 'Unbekannt')], 'csv');
    expect(zuordnungVorschau(neu[0].id, r.id)).toMatchObject({ art: 'skonto', differenz: 238 });
    expect(zuordnen(neu[0].id, r.id, { skonto: true })).toBe(true);
    expect(rechnungX(r.id)?.status).toBe('bezahlt');
    expect(zuordnen(neu[0].id, r.id)).toBe(false); // schon zugeordnet
  });

  it('legt Umsätze ohne Rechnung ab', () => {
    const { neu } = einlesen([umsatz(500, 'Privat', 'Ich')], 'csv');
    abgleichen();
    ignorieren(neu[0].id);
    expect(bankumsaetze.get(neu[0].id)?.status).toBe('ignoriert');
  });
});

describe('Hinweise und Mahnstopp', () => {
  it('Chef sieht nur zwei Sätze: Unklare Zahlungen und überfällige Rechnungen', () => {
    const r = rechnung();
    rechnungAendern(r.id, { faelligAm: '2020-01-01' });
    rechnung(t.firma.id, 20000);
    einlesen([umsatz(23800, 'Überweisung', 'Unbekannt'), umsatz(777, 'x', 'y')], 'csv');
    abgleichen();
    const h = zahlungenModul.hinweise!();
    expect(h.map((x) => x.titel)).toEqual(['2 Zahlungen konnten nicht eindeutig zugeordnet werden', '1 Rechnung ist überfällig']);
    expect(h[0].aktionen?.[0]).toMatchObject({ aktion: 'zahlung.zuordnen', label: 'Zuordnen' });
    expect(zahlungenModul.aktionen!['zahlung.zuordnen'](undefined)).toBe('/betrieb/zahlungen/abgleich');
  });

  it('stoppt die vorbereitete Mahnung, sobald die Rechnung bezahlt ist', () => {
    const r = rechnung();
    const mahnFreigabe = db.hinweise.create({
      art: 'freigabe',
      titel: 'Zahlungserinnerung senden?',
      bezug: { typ: 'rechnungen', id: r.id },
      gewicht: 66,
      status: 'offen',
      aktionen: [{ id: 'mahnung.senden', label: 'Senden', primaer: true, payload: {} }],
    });
    const anderer = db.hinweise.create({ art: 'info', titel: 'Anderes', bezug: { typ: 'rechnungen', id: r.id }, gewicht: 10, status: 'offen' });
    const stopp = zahlungenModul.automationen!.find((a) => a.id === 'zahlungen.mahnung_stoppen')!.start();
    einlesen([umsatz(11900, verstuemmelt(r.nummer))], 'csv');
    abgleichen();
    stopp();
    expect(db.hinweise.get(mahnFreigabe.id)?.status).toBe('erledigt');
    expect(db.hinweise.get(anderer.id)?.status).toBe('offen');
    expect(db.erledigungen.all().some((e) => e.regel === 'zahlungen.mahnung_stoppen')).toBe(true);
  });
});

describe('CAMT.053', () => {
  const camt = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.08">
  <BkToCstmrStmt>
    <Stmt>
      <Acct><Id><IBAN>DE02120300000000202051</IBAN></Id></Acct>
      <Ntry>
        <NtryRef>1</NtryRef>
        <Amt Ccy="EUR">119.00</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <Sts><Cd>BOOK</Cd></Sts>
        <BookgDt><Dt>2026-09-05</Dt></BookgDt>
        <ValDt><Dt>2026-09-05</Dt></ValDt>
        <AcctSvcrRef>2026090512345</AcctSvcrRef>
        <NtryDtls><TxDtls>
          <Refs><EndToEndId>NOTPROVIDED</EndToEndId></Refs>
          <RltdPties>
            <Dbtr><Pty><Nm>Familie Hoffmann</Nm></Pty></Dbtr>
            <DbtrAcct><Id><IBAN>DE89 3704 0044 0532 0130 00</IBAN></Id></DbtrAcct>
          </RltdPties>
          <RmtInf><Ustrd>Rechnung R-2026-00</Ustrd><Ustrd>42 &amp; Danke</Ustrd></RmtInf>
        </TxDtls></NtryDtls>
      </Ntry>
      <Ntry>
        <Amt Ccy="EUR">89.00</Amt>
        <CdtDbtInd>DBIT</CdtDbtInd>
        <BookgDt><Dt>2026-09-05</Dt></BookgDt>
        <AcctSvcrRef>STROM</AcctSvcrRef>
      </Ntry>
      <Ntry>
        <Amt Ccy="EUR">50.00</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <RvslInd>true</RvslInd>
        <BookgDt><Dt>2026-09-06</Dt></BookgDt>
      </Ntry>
      <Ntry>
        <Amt Ccy="EUR">300.00</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <BookgDt><DtTm>2026-09-07T10:00:00</DtTm></BookgDt>
        <AcctSvcrRef>SAMMEL</AcctSvcrRef>
        <NtryDtls>
          <TxDtls>
            <Amt Ccy="EUR">100.00</Amt>
            <RltdPties><Dbtr><Nm>Sommer KG</Nm></Dbtr></RltdPties>
            <RmtInf><Strd><CdtrRefInf><Ref>RF18539007547034</Ref></CdtrRefInf></Strd></RmtInf>
          </TxDtls>
          <TxDtls>
            <AmtDtls><TxAmt><Amt Ccy="EUR">200.00</Amt></TxAmt></AmtDtls>
            <RltdPties><Dbtr><Nm>Meier</Nm></Dbtr></RltdPties>
            <RmtInf><Ustrd>RE 2026 7</Ustrd></RmtInf>
          </TxDtls>
        </NtryDtls>
      </Ntry>
    </Stmt>
  </BkToCstmrStmt>
</Document>`;

  it('erkennt CAMT-Dateien', () => {
    expect(istCamt(camt)).toBe(true);
    expect(istCamt('Buchungstag;Betrag')).toBe(false);
  });

  it('liest nur Eingänge, teilt Sammelbuchungen und setzt den Zweck zusammen', () => {
    const { umsaetze, fehler, iban } = camtLesen(camt);
    expect(fehler).toBeUndefined();
    expect(iban).toBe('DE02120300000000202051');
    expect(umsaetze).toHaveLength(3);
    expect(umsaetze[0]).toMatchObject({ datum: '2026-09-05', betrag: 11900, name: 'Familie Hoffmann', iban: 'DE89370400440532013000', zweck: 'Rechnung R-2026-0042 & Danke', referenz: 'camt:2026090512345' });
    expect(umsaetze[1]).toMatchObject({ datum: '2026-09-07', betrag: 10000, name: 'Sommer KG', zweck: 'RF18539007547034', referenz: 'camt:SAMMEL#1' });
    expect(umsaetze[2]).toMatchObject({ betrag: 20000, name: 'Meier', zweck: 'RE 2026 7', referenz: 'camt:SAMMEL#2' });
    expect(nummernImText(umsaetze[0].zweck)).toContainEqual({ jahr: 2026, lfd: 42, stark: true });
  });

  it('meldet kaputte oder fremde XML-Dateien verständlich', () => {
    expect(camtLesen('<GAEB><Award/></GAEB>').fehler).toMatch(/CAMT/);
    expect(camtLesen('kein xml').fehler).toBeDefined();
  });
});
