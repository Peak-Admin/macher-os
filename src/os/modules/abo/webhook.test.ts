import { describe, expect, test } from 'vitest';
import { formular } from '@/app/api/abo/_lib/gemeinsam';
import { signaturGueltig } from '@/app/api/abo/_lib/signatur';

async function signieren(roh: string, geheimnis: string, zeit: number) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(geheimnis), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(`${zeit}.${roh}`));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

describe('Stripe-Webhook', () => {
  const roh = JSON.stringify({ id: 'evt_1', type: 'invoice.paid', data: { object: {} } });
  test('gültige Signatur wird angenommen', async () => {
    const t = 1_800_000_000;
    expect(await signaturGueltig(roh, `t=${t},v1=${await signieren(roh, 'whsec_test', t)}`, 'whsec_test', t + 10)).toBe(true);
  });
  test('falsches Geheimnis, veränderter Körper, alte Zeit oder fehlender Kopf → abgelehnt', async () => {
    const t = 1_800_000_000;
    const v1 = await signieren(roh, 'whsec_test', t);
    expect(await signaturGueltig(roh, `t=${t},v1=${v1}`, 'anderes', t)).toBe(false);
    expect(await signaturGueltig(roh + ' ', `t=${t},v1=${v1}`, 'whsec_test', t)).toBe(false);
    expect(await signaturGueltig(roh, `t=${t},v1=${v1}`, 'whsec_test', t + 301)).toBe(false);
    expect(await signaturGueltig(roh, null, 'whsec_test', t)).toBe(false);
  });
});

describe('Stripe-Formular', () => {
  test('verschachtelte Werte und Listen', () => {
    const f = formular({ mode: 'subscription', payment_method_types: ['sepa_debit', 'card'], line_items: [{ price: 'p_1', quantity: 1 }], automatic_tax: undefined, subscription_data: { metadata: { plan: 'team' } } });
    expect(decodeURIComponent(f.toString())).toBe(
      'mode=subscription&payment_method_types[0]=sepa_debit&payment_method_types[1]=card&line_items[0][price]=p_1&line_items[0][quantity]=1&subscription_data[metadata][plan]=team',
    );
  });
});

describe('E-Rechnung für Handwerk OS', () => {
  test('XRechnung aus einer Stripe-Rechnung mit Netto, USt und Zeitraum', async () => {
    const { xrechnungAusStripe } = await import('@/app/api/abo/_lib/rechnung');
    const xml = xrechnungAusStripe(
      {
        id: 'in_1',
        number: 'MOS-0001',
        created: Date.UTC(2026, 9, 2) / 1000,
        period_start: Date.UTC(2026, 9, 2) / 1000,
        period_end: Date.UTC(2026, 10, 2) / 1000,
        total: 10591,
        total_excluding_tax: 8900,
        subtotal: 8900,
        amount_paid: 10591,
        customer_name: 'Elektro Muster GmbH',
        customer_email: 'chef@example.org',
        customer_address: { line1: 'Hauptstr. 1', postal_code: '12345', city: 'Musterstadt' },
        customer_tax_ids: [{ value: 'DE123456789' }],
        lines: { data: [{ description: 'Handwerk OS Team', amount: 8900 }] },
      },
      { name: 'Anbieter GmbH', strasse: 'Weg 2', plz: '54321', ort: 'Stadt', email: 'rechnung@example.org', ustId: 'DE999999999' },
    );
    expect(xml).toContain('<cbc:ID>MOS-0001</cbc:ID>');
    expect(xml).toContain('<cbc:TaxExclusiveAmount currencyID="EUR">89.00</cbc:TaxExclusiveAmount>');
    expect(xml).toContain('<cbc:TaxAmount currencyID="EUR">16.91</cbc:TaxAmount>');
    expect(xml).toContain('<cbc:Percent>19</cbc:Percent>');
    expect(xml).toContain('<cbc:PayableAmount currencyID="EUR">0.00</cbc:PayableAmount>');
    expect(xml).toContain('Elektro Muster GmbH');
    expect(xml).toContain('<cbc:StartDate>2026-10-02</cbc:StartDate>');
  });
});
