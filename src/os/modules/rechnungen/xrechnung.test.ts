import { beforeEach, describe, expect, it } from 'vitest';
import { festschreiben, rechnungErstellen, stornieren } from './logik';
import { rechnungAendern, rechnungX } from './typen';
import { xrechnungFuer } from './xrechnung';
import { testBetrieb } from './testdaten';
import { db } from '@core/db';
import type { Position } from '@core/objects';

const CBC = 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2';

function parse(xml: string) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  expect(doc.getElementsByTagName('parsererror')).toHaveLength(0);
  const wert = (name: string) => doc.getElementsByTagNameNS(CBC, name)[0]?.textContent ?? undefined;
  const alle = (name: string) => Array.from(doc.getElementsByTagNameNS(CBC, name)).map((e) => e.textContent ?? '');
  return { doc, wert, alle };
}

let t: ReturnType<typeof testBetrieb>;
beforeEach(() => {
  t = testBetrieb();
});

function rechnung(positionen: Position[] = [
  { id: 'a', art: 'leistung' as const, text: 'Steckdosen setzen', menge: 10, einheit: 'Stk' as const, einzelpreis: 4500 },
  { id: 'b', art: 'lohn' as const, text: 'Arbeitszeit', menge: 2.5, einheit: 'h' as const, einzelpreis: 6000 },
  { id: 'c', art: 'text' as const, text: 'Hinweis', menge: 0, einheit: 'Psch' as const, einzelpreis: 0 },
  { id: 'd', art: 'pauschal' as const, text: 'Rabatt', menge: 1, einheit: 'Psch' as const, einzelpreis: -1000 },
]) {
  const r = rechnungErstellen(t.auftrag.id)!;
  rechnungAendern(r.id, { positionen, leistungszeitraum: '01.09.2026 – 05.09.2026', leistungVon: '2026-09-01', leistungBis: '2026-09-05' });
  expect(festschreiben(r.id).ok).toBe(true);
  return rechnungX(r.id)!;
}

describe('XRechnung (UBL 2.1)', () => {
  it('enthält die Pflichtfelder und stimmige Summen', () => {
    const r = rechnung();
    const { doc, wert, alle } = parse(xrechnungFuer(r));
    expect(doc.documentElement.localName).toBe('Invoice');
    expect(wert('CustomizationID')).toBe('urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0');
    expect(wert('ID')).toBe(r.nummer);
    expect(wert('IssueDate')).toBe(r.datum);
    expect(wert('DueDate')).toBe(r.faelligAm);
    expect(wert('InvoiceTypeCode')).toBe('380');
    expect(wert('DocumentCurrencyCode')).toBe('EUR');
    expect(wert('BuyerReference')).toBe('A-2026-0001');
    expect(wert('PaymentMeansCode')).toBe('58');
    expect(alle('EndpointID')).toEqual(['info@muster.example', 'hoffmann@example.de']);
    // 45000 + 15000 - 1000 = 59000 netto, USt 11210
    expect(wert('LineExtensionAmount')).toBe('590.00');
    expect(wert('TaxExclusiveAmount')).toBe('590.00');
    expect(wert('TaxInclusiveAmount')).toBe('702.10');
    expect(wert('PayableAmount')).toBe('702.10');
    expect(alle('TaxAmount')[0]).toBe('112.10');
    // Textzeile ist keine Rechnungszeile
    const zeilen = doc.getElementsByTagNameNS('urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2', 'InvoiceLine');
    expect(zeilen).toHaveLength(3);
    // Preis nie negativ (BR-27), Vorzeichen in der Menge
    expect(alle('PriceAmount').every((p) => !p.startsWith('-'))).toBe(true);
    expect(alle('InvoicedQuantity')).toEqual(['10', '2.5', '-1']);
    // Summe der Zeilen = LineExtensionAmount (BR-CO-10)
    const zeilenSumme = Array.from(zeilen).reduce((s, z) => s + Number(z.getElementsByTagNameNS(CBC, 'LineExtensionAmount')[0].textContent), 0);
    expect(zeilenSumme.toFixed(2)).toBe('590.00');
    expect(wert('StartDate')).toBe('2026-09-01');
  });

  it('nutzt Steuerkategorie E für Kleinunternehmer mit Befreiungsgrund', () => {
    db.betrieb.update('betrieb', { kleinunternehmer: true });
    const r = rechnung([{ id: 'a', art: 'leistung', text: 'Arbeit', menge: 1, einheit: 'h', einzelpreis: 5000 }]);
    const { wert } = parse(xrechnungFuer(r));
    expect(wert('TaxExemptionReason')).toMatch(/§ 19/);
    expect(wert('TaxInclusiveAmount')).toBe('50.00');
  });

  it('erzeugt für Stornos eine CreditNote mit Bezug auf die Originalrechnung', () => {
    const r = rechnung([{ id: 'a', art: 'leistung', text: 'Arbeit', menge: 2, einheit: 'h', einzelpreis: 5000 }]);
    const s = stornieren(r.id)!;
    const { doc, wert } = parse(xrechnungFuer(s));
    expect(doc.documentElement.localName).toBe('CreditNote');
    expect(wert('CreditNoteTypeCode')).toBe('381');
    expect(wert('PayableAmount')).toBe('119.00');
    expect(wert('CreditedQuantity')).toBe('2');
    const ref = doc.getElementsByTagNameNS('urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2', 'InvoiceDocumentReference')[0];
    expect(ref.getElementsByTagNameNS(CBC, 'ID')[0].textContent).toBe(r.nummer);
  });

  it('weist bei Schlussrechnungen die Abschläge als PrepaidAmount aus', () => {
    db.angebote.create({ nummer: 'AN-1', auftragId: t.auftrag.id, kundeId: t.kunde.id, titel: 'x', positionen: [{ id: 'a', art: 'pauschal', text: 'Pauschale', menge: 1, einheit: 'Psch', einzelpreis: 100000 }], status: 'angenommen', datum: '2026-08-01', gueltigBis: '2026-09-01', version: 1 });
    const ab = rechnungErstellen(t.auftrag.id, 'abschlag', { prozent: 40 })!;
    rechnungAendern(ab.id, { leistungszeitraum: 'August 2026' });
    festschreiben(ab.id);
    const s = rechnungErstellen(t.auftrag.id, 'schluss')!;
    rechnungAendern(s.id, { leistungszeitraum: 'August 2026' });
    festschreiben(s.id);
    const { wert } = parse(xrechnungFuer(rechnungX(s.id)!));
    expect(wert('TaxInclusiveAmount')).toBe('1190.00');
    expect(wert('PrepaidAmount')).toBe('476.00');
    expect(wert('PayableAmount')).toBe('714.00');
    const { wert: wa } = parse(xrechnungFuer(rechnungX(ab.id)!));
    expect(wa('InvoiceTypeCode')).toBe('326');
  });
});
