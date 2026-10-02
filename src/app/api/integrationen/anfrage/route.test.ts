// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const anfrage = (body: unknown, kopf: Record<string, string> = {}) =>
  new Request('https://macher.example/api/integrationen/anfrage', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://macher.example', host: 'macher.example', 'x-forwarded-for': `10.1.0.${Math.floor(Math.random() * 250)}`, ...kopf },
    body: JSON.stringify(body),
  });
const daten = { integration: 'Gmail', notiz: 'Anfragen am Auftrag', betrieb: { name: 'Elektro Muster', email: 'info@muster.example', telefon: '0561 1' } };

describe('/api/integrationen/anfrage', () => {
  const resend = vi.fn();
  beforeEach(() => {
    vi.stubGlobal('fetch', resend);
    resend.mockReset();
    resend.mockResolvedValue(new Response(JSON.stringify({ id: 'msg_1' }), { status: 200 }));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.RESEND_API_KEY;
    delete process.env.INTEGRATION_ANFRAGE_AN;
  });

  it('ohne Schlüssel 501 – die App fällt aufs Mail-Programm zurück', async () => {
    expect((await POST(anfrage(daten))).status).toBe(501);
    expect(resend).not.toHaveBeenCalled();
  });

  it('sendet an den festen Empfänger mit Antwort an den Betrieb', async () => {
    process.env.RESEND_API_KEY = 're_test';
    const r = await POST(anfrage({ ...daten, an: 'fremd@example.de' }));
    expect(r.status).toBe(200);
    const body = JSON.parse(resend.mock.calls[0][1].body);
    expect(body.to).toEqual(['partner@macher-os.de']);
    expect(body.reply_to).toBe('info@muster.example');
    expect(body.subject).toBe('Integration anfragen: Gmail – Elektro Muster');
    expect(body.text).toMatch(/Wofür: Anfragen am Auftrag/);
  });

  it('nur von derselben Seite und nur mit Integration', async () => {
    process.env.RESEND_API_KEY = 're_test';
    expect((await POST(anfrage(daten, { origin: 'https://boese.example' }))).status).toBe(403);
    expect((await POST(anfrage({ notiz: 'x' }))).status).toBe(400);
  });
});
