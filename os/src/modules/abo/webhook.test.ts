import { describe, expect, test } from 'vitest';
import { formular } from '../../../api/abo/_gemeinsam.js';
import { signaturGueltig } from '../../../api/abo/webhook.js';

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
