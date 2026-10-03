/**
 * E-Rechnung nach XRechnung 3.0 (Syntax UBL 2.1, EN 16931) – reiner XML-Baustein ohne Datenschicht,
 * damit ihn auch Server-Funktionen nutzen können (z. B. Rechnungen für Handwerk OS selbst).
 */
import type { Betrieb, Einheit, Kunde } from '@core/objects';
import { positionSumme } from '@core/format';
import type { RechnungsSummen } from './logik';
import type { RechnungX } from './typen';


const EINHEIT_CODE: Record<Einheit, string> = {
  Stk: 'H87',
  m: 'MTR',
  'm²': 'MTK',
  'm³': 'MTQ',
  h: 'HUR',
  Psch: 'LS',
  kg: 'KGM',
  l: 'LTR',
  Pkt: 'C62',
  km: 'KMT',
};

const esc = (s: string | undefined) =>
  (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const betrag = (c: number) => (c / 100).toFixed(2);
const menge = (n: number) => String(Math.round(n * 10000) / 10000);
const cur = 'currencyID="EUR"';

function steuerKategorie(b: Betrieb | undefined, r: RechnungX, satz: number) {
  if (b?.kleinunternehmer) return { id: 'E', satz: 0, grund: 'Kleinunternehmer gemäß § 19 UStG' };
  if (r.reverseCharge) return { id: 'AE', satz: 0, grund: 'Steuerschuldnerschaft des Leistungsempfängers (§ 13b UStG)' };
  return { id: 'S', satz, grund: undefined as string | undefined };
}

function partei(rolle: 'Supplier' | 'Customer', p: { name: string; email?: string; strasse?: string; ort?: string; plz?: string; ustId?: string; steuernummer?: string; telefon?: string; kontakt?: string; kennung?: string }) {
  const steuer: string[] = [];
  if (p.ustId) steuer.push(`<cac:PartyTaxScheme><cbc:CompanyID>${esc(p.ustId)}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>`);
  if (p.steuernummer) steuer.push(`<cac:PartyTaxScheme><cbc:CompanyID>${esc(p.steuernummer)}</cbc:CompanyID><cac:TaxScheme><cbc:ID>FC</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>`);
  return `
  <cac:Accounting${rolle}Party>
    <cac:Party>
      <cbc:EndpointID schemeID="EM">${esc(p.email || 'keine-angabe@invalid')}</cbc:EndpointID>${p.kennung ? `\n      <cac:PartyIdentification><cbc:ID>${esc(p.kennung)}</cbc:ID></cac:PartyIdentification>` : ''}
      <cac:PartyName><cbc:Name>${esc(p.name)}</cbc:Name></cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${esc(p.strasse)}</cbc:StreetName>
        <cbc:CityName>${esc(p.ort)}</cbc:CityName>
        <cbc:PostalZone>${esc(p.plz)}</cbc:PostalZone>
        <cac:Country><cbc:IdentificationCode>DE</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>${steuer.length ? '\n      ' + steuer.join('\n      ') : ''}
      <cac:PartyLegalEntity><cbc:RegistrationName>${esc(p.name)}</cbc:RegistrationName></cac:PartyLegalEntity>${
        rolle === 'Supplier'
          ? `
      <cac:Contact>
        <cbc:Name>${esc(p.kontakt || p.name)}</cbc:Name>
        <cbc:Telephone>${esc(p.telefon || '-')}</cbc:Telephone>
        <cbc:ElectronicMail>${esc(p.email || 'keine-angabe@invalid')}</cbc:ElectronicMail>
      </cac:Contact>`
          : ''
      }
    </cac:Party>
  </cac:Accounting${rolle}Party>`;
}

export interface XRechnungDaten {
  r: RechnungX;
  /** Summen; ohne `abzugGezahlt` gilt `abzugBrutto` als bereits gezahlt (z. B. Abo-Rechnungen) */
  s: Omit<RechnungsSummen, 'abzugGezahlt' | 'offenAusAbzuegen' | 'einbehaltProzent' | 'einbehalt'> & Partial<Pick<RechnungsSummen, 'abzugGezahlt' | 'einbehalt'>>;
  betrieb: Betrieb | undefined;
  kunde: Kunde | undefined;
  /** Nummer der Originalrechnung bei Storno */
  originalNummer?: string;
  originalDatum?: string;
  auftragNummer?: string;
  texte: string[];
}

/** Reine Funktion: baut das XML aus fertigen Daten */
export function xrechnungAus(d: XRechnungDaten): string {
  const { r, s, betrieb: b, kunde: k } = d;
  const gutschrift = r.art === 'gutschrift';
  const root = gutschrift ? 'CreditNote' : 'Invoice';
  const vz = gutschrift ? -1 : 1;
  const kat = steuerKategorie(b, r, s.ustSatz);
  const typCode = gutschrift ? '381' : r.art === 'abschlag' || r.art === 'teil' ? '326' : '380';
  const zeilen = r.positionen.filter((p) => p.art !== 'text' && p.art !== 'zwischensumme' && !p.optional);

  const lineSumme = zeilen.reduce((x, p) => x + positionSumme(p), 0) * vz;
  const netto = s.netto * vz;
  const ust = s.ust * vz;
  const brutto = s.brutto * vz;
  // EN 16931 (BR-CO-16): Zahlbetrag = Brutto − bereits gezahlt. Ein Sicherheitseinbehalt steht als Hinweis im Text.
  const prepaid = (s.abzugGezahlt ?? s.abzugBrutto) * vz;
  const zahlbar = (s.zahlbetrag + (s.einbehalt ?? 0)) * vz;

  const notes = [...d.texte, r.bemerkung].filter(Boolean) as string[];
  const zahlungsText = gutschrift ? 'Der Betrag wird erstattet bzw. verrechnet.' : `Zahlbar bis ${r.faelligAm} ohne Abzug.`;

  const zeilenXml = zeilen
    .map((p, i) => {
      const lineTag = gutschrift ? 'CreditNoteLine' : 'InvoiceLine';
      const qtyTag = gutschrift ? 'CreditedQuantity' : 'InvoicedQuantity';
      // PriceAmount darf nicht negativ sein (BR-27) – das Vorzeichen wandert in die Menge.
      const preis = Math.abs(p.einzelpreis);
      const mengeAus = p.menge * vz * (p.einzelpreis < 0 ? -1 : 1);
      const zeile = positionSumme(p) * vz;
      return `
  <cac:${lineTag}>
    <cbc:ID>${i + 1}</cbc:ID>
    <cbc:${qtyTag} unitCode="${EINHEIT_CODE[p.einheit] ?? 'C62'}">${menge(mengeAus)}</cbc:${qtyTag}>
    <cbc:LineExtensionAmount ${cur}>${betrag(zeile)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>${esc(p.text.slice(0, 200) || 'Position')}</cbc:Name>
      <cac:ClassifiedTaxCategory><cbc:ID>${kat.id}</cbc:ID><cbc:Percent>${kat.satz}</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price><cbc:PriceAmount ${cur}>${betrag(preis)}</cbc:PriceAmount></cac:Price>
  </cac:${lineTag}>`;
    })
    .join('');

  const periode =
    r.leistungVon || r.leistungBis
      ? `
  <cac:InvoicePeriod>${r.leistungVon ? `<cbc:StartDate>${r.leistungVon}</cbc:StartDate>` : ''}${r.leistungBis ? `<cbc:EndDate>${r.leistungBis}</cbc:EndDate>` : ''}</cac:InvoicePeriod>`
      : '';

  const bezug =
    gutschrift && d.originalNummer
      ? `
  <cac:BillingReference><cac:InvoiceDocumentReference><cbc:ID>${esc(d.originalNummer)}</cbc:ID>${d.originalDatum ? `<cbc:IssueDate>${d.originalDatum}</cbc:IssueDate>` : ''}</cac:InvoiceDocumentReference></cac:BillingReference>`
      : '';

  const ns = gutschrift ? 'urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2' : 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2';

  return `<?xml version="1.0" encoding="UTF-8"?>
<ubl:${root} xmlns:ubl="${ns}" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
  <cbc:ID>${esc(r.nummer)}</cbc:ID>
  <cbc:IssueDate>${r.datum}</cbc:IssueDate>${gutschrift ? '' : `\n  <cbc:DueDate>${r.faelligAm}</cbc:DueDate>`}
  <cbc:${gutschrift ? 'CreditNoteTypeCode' : 'InvoiceTypeCode'}>${typCode}</cbc:${gutschrift ? 'CreditNoteTypeCode' : 'InvoiceTypeCode'}>${notes.map((n) => `\n  <cbc:Note>${esc(n)}</cbc:Note>`).join('')}
  <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
  <cbc:BuyerReference>${esc(d.auftragNummer || k?.nummer || r.nummer)}</cbc:BuyerReference>${periode}${bezug}${partei('Supplier', {
    name: b?.name ?? '',
    email: b?.email,
    strasse: b?.adresse?.strasse,
    plz: b?.adresse?.plz,
    ort: b?.adresse?.ort,
    ustId: b?.ustId,
    steuernummer: b?.steuernummer,
    telefon: b?.telefon,
  })}${partei('Customer', {
    name: k?.firma || k?.name || '',
    email: k?.email,
    strasse: k?.adresse?.strasse,
    plz: k?.adresse?.plz,
    ort: k?.adresse?.ort,
    kennung: k?.nummer,
  })}
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>58</cbc:PaymentMeansCode>${b?.iban ? `\n    <cac:PayeeFinancialAccount><cbc:ID>${esc(b.iban.replace(/\s/g, ''))}</cbc:ID><cbc:Name>${esc(b.name)}</cbc:Name></cac:PayeeFinancialAccount>` : ''}
  </cac:PaymentMeans>
  <cac:PaymentTerms><cbc:Note>${esc(zahlungsText)}</cbc:Note></cac:PaymentTerms>
  <cac:TaxTotal>
    <cbc:TaxAmount ${cur}>${betrag(ust)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount ${cur}>${betrag(netto)}</cbc:TaxableAmount>
      <cbc:TaxAmount ${cur}>${betrag(ust)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>${kat.id}</cbc:ID>
        <cbc:Percent>${kat.satz}</cbc:Percent>${kat.grund ? `\n        <cbc:TaxExemptionReason>${esc(kat.grund)}</cbc:TaxExemptionReason>` : ''}
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount ${cur}>${betrag(lineSumme)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount ${cur}>${betrag(netto)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount ${cur}>${betrag(brutto)}</cbc:TaxInclusiveAmount>${prepaid ? `\n    <cbc:PrepaidAmount ${cur}>${betrag(prepaid)}</cbc:PrepaidAmount>` : ''}
    <cbc:PayableAmount ${cur}>${betrag(zahlbar)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>${zeilenXml}
</ubl:${root}>
`;
}
