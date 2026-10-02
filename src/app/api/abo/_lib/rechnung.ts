/**
 * Rechnung für Macher OS zustellen: nach jeder bezahlten Stripe-Rechnung eine E-Mail an den Betrieb,
 * in Kopie an die Steuerberater-Adresse aus dem DATEV-Modul (`datev.steuerberater` in `objekte`).
 * Im Anhang die E-Rechnung (XRechnung 3.0, UBL) – gebaut mit demselben Baustein wie in der App
 * (`xrechnungAus`). Rechnungssteller kommt aus `ABO_RECHNUNGSSTELLER` (JSON) – ohne ihn keine XRechnung,
 * denn Firmendaten erfinden wir nicht. Ohne `RESEND_API_KEY`/`ABO_ABSENDER` wird nichts gesendet.
 */
import type { Betrieb, Kunde } from '@core/objects';
import { xrechnungAus } from '@modules/rechnungen/xrechnung-xml';
import type { RechnungX } from '@modules/rechnungen/typen';
import { env, sb } from './gemeinsam';

export interface StripeRechnung {
  id: string;
  number?: string | null;
  created: number;
  due_date?: number | null;
  period_start?: number;
  period_end?: number;
  total: number;
  total_excluding_tax?: number | null;
  subtotal: number;
  amount_paid?: number;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_address?: { line1?: string | null; postal_code?: string | null; city?: string | null } | null;
  customer_tax_ids?: { value: string }[] | null;
  invoice_pdf?: string | null;
  lines?: { data: { description?: string | null; amount: number }[] };
}

export interface Rechnungssteller {
  name: string;
  strasse: string;
  plz: string;
  ort: string;
  email: string;
  telefon?: string;
  ustId?: string;
  steuernummer?: string;
  iban?: string;
}

export function rechnungsstellerAusEnv(): Rechnungssteller | undefined {
  try {
    const r = JSON.parse(env('ABO_RECHNUNGSSTELLER') ?? '') as Partial<Rechnungssteller>;
    return r.name && r.strasse && r.plz && r.ort && r.email && (r.ustId || r.steuernummer) ? (r as Rechnungssteller) : undefined;
  } catch {
    return undefined;
  }
}

const tag = (s: number) => new Date(s * 1000).toISOString().slice(0, 10);

/** XRechnung aus einer Stripe-Rechnung (rein, getestet) */
export function xrechnungAusStripe(inv: StripeRechnung, steller: Rechnungssteller): string {
  const netto = inv.total_excluding_tax ?? inv.subtotal;
  const ust = inv.total - netto;
  const ustSatz = netto ? Math.round((ust / netto) * 100) : 0;
  const zeilen = inv.lines?.data.length ? inv.lines.data : [{ description: 'Macher OS', amount: netto }];
  const r = {
    id: inv.id,
    nummer: inv.number ?? inv.id,
    art: 'rechnung',
    datum: tag(inv.created),
    faelligAm: tag(inv.due_date ?? inv.created),
    leistungVon: inv.period_start ? tag(inv.period_start) : undefined,
    leistungBis: inv.period_end ? tag(inv.period_end) : undefined,
    positionen: zeilen.map((z, i) => ({ id: String(i + 1), art: 'leistung', text: z.description || 'Macher OS', menge: 1, einheit: 'Pkt', einzelpreis: z.amount })),
  } as unknown as RechnungX;
  const betrieb = {
    name: steller.name,
    email: steller.email,
    telefon: steller.telefon ?? '',
    adresse: { strasse: steller.strasse, plz: steller.plz, ort: steller.ort },
    ustId: steller.ustId,
    steuernummer: steller.steuernummer,
    iban: steller.iban,
  } as unknown as Betrieb;
  const kunde = {
    name: inv.customer_name ?? 'Kunde',
    email: inv.customer_email ?? undefined,
    adresse: { strasse: inv.customer_address?.line1 ?? '', plz: inv.customer_address?.postal_code ?? '', ort: inv.customer_address?.city ?? '' },
  } as unknown as Kunde;
  const bezahlt = inv.amount_paid ?? 0;
  return xrechnungAus({
    r,
    s: { netto, ust, brutto: inv.total, rabatt: 0, ustSatz, abzugNetto: 0, abzugUst: 0, abzugBrutto: bezahlt, zahlbetrag: inv.total - bezahlt, abzuege: [] },
    betrieb,
    kunde,
    texte: inv.customer_tax_ids?.length ? [`USt-IdNr. des Leistungsempfängers: ${inv.customer_tax_ids[0].value}`] : [],
  });
}

async function steuerberaterEmail(betriebId: string): Promise<string | undefined> {
  try {
    const z = await sb<{ daten: { wert?: { email?: string } } }[]>(
      `objekte?betrieb_id=eq.${encodeURIComponent(betriebId)}&sammlung=eq.einstellungen&id=eq.datev.steuerberater&geloescht_am=is.null&select=daten`,
    );
    const email = z[0]?.daten?.wert?.email?.trim();
    return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined;
  } catch {
    return undefined;
  }
}

const euro = (c: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(c / 100);

export async function rechnungZustellen(betriebId: string, inv: StripeRechnung): Promise<boolean> {
  const key = env('RESEND_API_KEY');
  const von = env('ABO_ABSENDER');
  if (!key || !von || !inv.customer_email) return false;
  const steuerberater = await steuerberaterEmail(betriebId);
  const steller = rechnungsstellerAusEnv();
  const nummer = inv.number ?? inv.id;
  const text = [
    'Hallo,',
    '',
    `danke für deine Zahlung. Hier ist deine Rechnung ${nummer} über ${euro(inv.total)} für Macher OS.`,
    inv.invoice_pdf ? `PDF: ${inv.invoice_pdf}` : '',
    steller ? 'Im Anhang liegt die E-Rechnung (XRechnung) für die Buchhaltung.' : '',
    steuerberater ? `Eine Kopie geht an deinen Steuerberater (${steuerberater}).` : '',
    '',
    'Alle Rechnungen findest du auch in Macher OS unter Betrieb › Einstellungen › Dein Plan.',
  ]
    .filter((z, i, a) => z !== '' || a[i - 1] !== '')
    .join('\n');
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: von,
      to: [inv.customer_email],
      cc: steuerberater ? [steuerberater] : undefined,
      subject: `Deine Rechnung ${nummer} für Macher OS`,
      text,
      attachments: steller ? [{ filename: `xrechnung-${nummer}.xml`, content: Buffer.from(xrechnungAusStripe(inv, steller)).toString('base64') }] : undefined,
    }),
  });
  return r.ok;
}
