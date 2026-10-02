// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from './route';

const anfrage = (body: unknown, kopf: Record<string, string> = {}) =>
  new Request('https://macher.example/api/senden', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://macher.example', host: 'macher.example', 'x-forwarded-for': `10.0.0.${Math.floor(Math.random() * 250)}`, ...kopf },
    body: JSON.stringify(body),
  });
const mail = { an: 'kunde@example.de', kanal: 'email', betreff: 'Angebot AN-1', text: 'Guten Tag', html: '<p>Guten Tag</p>', link: 'https://macher.example/os/k/abc', absender: { name: 'Elektro Rückert', antwortAn: 'info@rueckert.de' }, anhaenge: [{ name: 'R-1_XRechnung.xml', url: 'data:application/xml;charset=utf-8,%3Cx%3E%C3%BC%3C%2Fx%3E' }] };

describe('/api/senden (Resend)', () => {
  const resend = vi.fn();
  beforeEach(() => {
    vi.stubGlobal('fetch', resend);
    resend.mockReset();
    resend.mockResolvedValue(new Response(JSON.stringify({ id: 'msg_1' }), { status: 200 }));
    delete process.env.RESEND_ERLAUBTE_EMPFAENGER;
    delete process.env.RESEND_ABSENDER;
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.RESEND_API_KEY;
  });

  it('ohne Schlüssel: 501, GET meldet email:false', async () => {
    expect((await POST(anfrage(mail))).status).toBe(501);
    expect(await GET().json()).toEqual({ email: false });
    expect(resend).not.toHaveBeenCalled();
  });

  it('sendet mit Betriebsname als Absender, Antwort an den Betrieb, Link und XRechnung als Anhang', async () => {
    process.env.RESEND_API_KEY = 're_test';
    process.env.RESEND_ABSENDER = 'Macher <angebote@macher.example>';
    const r = await POST(anfrage(mail));
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ id: 'msg_1' });
    const [url, init] = resend.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.headers.authorization).toBe('Bearer re_test');
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ from: 'Elektro Rückert <angebote@macher.example>', to: ['kunde@example.de'], subject: 'Angebot AN-1', reply_to: 'info@rueckert.de', html: '<p>Guten Tag</p>' });
    expect(body.text).toContain('https://macher.example/os/k/abc');
    expect(body.attachments[0].filename).toBe('R-1_XRechnung.xml');
    expect(Buffer.from(body.attachments[0].content, 'base64').toString('utf8')).toBe('<x>ü</x>');
  });

  it('ohne eigene Domain: Resend-Testabsender', async () => {
    process.env.RESEND_API_KEY = 're_test';
    await POST(anfrage(mail));
    expect(JSON.parse(resend.mock.calls[0][1].body).from).toBe('Elektro Rückert <onboarding@resend.dev>');
  });

  it('schützt vor Missbrauch: fremde Seite, kaputte Adresse, Kopfzeilen-Einschleusung, SMS, Freigabeliste', async () => {
    process.env.RESEND_API_KEY = 're_test';
    expect((await POST(anfrage(mail, { origin: 'https://boese.example' }))).status).toBe(403);
    expect((await POST(anfrage({ ...mail, an: 'a@b.de, c@d.de' }))).status).toBe(400);
    expect((await POST(anfrage({ ...mail, kanal: 'sms', an: '0171 1' }))).status).toBe(501);
    await POST(anfrage({ ...mail, betreff: 'Hallo\r\nBcc: x@y.de', absender: { name: 'A <b@c.de>' } }));
    const body = JSON.parse(resend.mock.calls[0][1].body);
    expect(body.subject).toBe('Hallo Bcc: x@y.de');
    expect(body.from).toBe('A b@c.de <onboarding@resend.dev>');
    process.env.RESEND_ERLAUBTE_EMPFAENGER = '@rueckert.de, chef@example.de';
    expect((await POST(anfrage(mail))).status).toBe(403);
    expect((await POST(anfrage({ ...mail, an: 'test@rueckert.de' }))).status).toBe(200);
  });

  it('begrenzt die Menge je IP', async () => {
    process.env.RESEND_API_KEY = 're_test';
    const kopf = { 'x-forwarded-for': '10.9.9.9' };
    for (let i = 0; i < 30; i++) expect((await POST(anfrage(mail, kopf))).status).toBe(200);
    expect((await POST(anfrage(mail, kopf))).status).toBe(429);
  });

  it('Fehler von Resend kommen als Text zurück', async () => {
    process.env.RESEND_API_KEY = 're_test';
    resend.mockResolvedValueOnce(new Response(JSON.stringify({ message: 'You can only send testing emails to your own email address' }), { status: 403 }));
    const r = await POST(anfrage(mail));
    expect(r.status).toBe(502);
    expect((await r.json()).fehler).toContain('own email address');
  });
});
