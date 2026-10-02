// @vitest-environment node
import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { POST as senden } from '@/app/api/cloud/senden/route';
import { POST as einladen } from '@/app/api/cloud/einladen/route';
import { GET as oeffnen } from '@/app/api/cloud/oeffnen/route';
import { GET as oeffentlich } from '@/app/api/cloud/oeffentlich/route';
import { POST as push } from '@/app/api/cloud/push/route';
import { POST as messen } from '@/app/api/cloud/messen/route';
import { bereinigen } from './messung';
import { POST as authSms } from '@/app/api/cloud/auth-sms/route';
import { signaturPruefen } from './webhook';
import { pushAnMitarbeiter } from './push';
import { GET as cron } from '@/app/api/cron/taeglich/route';
import { GET as dateiOeffnen, POST as dateiLink } from '@/app/api/cloud/datei/route';

type Antwort = unknown | ((init: RequestInit, url: URL) => unknown);
interface Aufruf {
  url: URL;
  init: RequestInit;
  body?: unknown;
}

/** fetch-Attrappe: erste passende Regel (Methode + URL-Teil) antwortet */
function fetchAttrappe(regeln: [string, Antwort, number?][]) {
  const aufrufe: Aufruf[] = [];
  const f = vi.fn(async (eingabe: string | URL | Request, init: RequestInit = {}) => {
    const url = new URL(String(eingabe));
    const methode = (init.method ?? 'GET').toUpperCase();
    const body = typeof init.body === 'string' ? (() => { try { return JSON.parse(init.body as string); } catch { return init.body; } })() : undefined;
    aufrufe.push({ url, init, body });
    const regel = regeln.find(([muster]) => {
      const [m, teil] = muster.split(' ');
      return m === methode && (url.href.includes(teil) || decodeURIComponent(url.href).includes(teil));
    });
    if (!regel) return new Response(`keine Regel für ${methode} ${url.href}`, { status: 599 });
    const wert = typeof regel[1] === 'function' ? (regel[1] as (i: RequestInit, u: URL) => unknown)(init, url) : regel[1];
    const status = regel[2] ?? 200;
    return new Response(status === 204 || wert === undefined ? null : JSON.stringify(wert), { status });
  });
  vi.stubGlobal('fetch', f);
  return aufrufe;
}

const SUPA = 'https://projekt.supabase.co';
function mitSupabase() {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', SUPA);
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
  vi.stubEnv('APP_URL', 'https://app.macher-os.de');
}
const anfrage = (pfad: string, body?: unknown, token = 'nutzer-token') =>
  new Request(`https://app.macher-os.de${pfad}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const ANGEMELDET: [string, Antwort][] = [
  ['GET /auth/v1/user', { id: 'u1', email: 'chef@muster.de' }],
  ['GET /rest/v1/mitglieder?nutzer_id=eq.u1', [{ betrieb_id: 'b1', nutzer_id: 'u1', mitarbeiter_id: 'm1', rolle: 'chef' }]],
  ['GET sammlung=eq.betrieb&id=eq.betrieb', [{ daten: { name: 'Elektro Muster', email: 'info@muster.de' } }]],
];

beforeEach(() => {
  vi.unstubAllEnvs();
  for (const n of ['SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY', 'SMS_API_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_PUBLIC_KEY', 'NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'CRON_SECRET', 'SUPABASE_SMS_HOOK_SECRET', 'APP_URL', 'WHATSAPP_TOKEN', 'WHATSAPP_NUMMER_ID', 'WHATSAPP_VORLAGE', 'DATEI_GEHEIMNIS'])
    vi.stubEnv(n, '');
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('ohne Schlüssel: 501 „nicht verbunden“', () => {
  test.each([
    ['senden', () => senden(anfrage('/api/cloud/senden', { versand: { an: 'a@b.de', kanal: 'email', text: 'Hallo' } }))],
    ['einladen', () => einladen(anfrage('/api/cloud/einladen', { mitarbeiterId: 'm2', ziel: { telefon: '0171' } }))],
    ['push', () => push(anfrage('/api/cloud/push', { nachricht: { anMitarbeiterId: 'm2', titel: 'Hi' } }))],
    ['oeffentlich', () => oeffentlich(anfrage('/api/cloud/oeffentlich?art=portal&token=x'))],
    ['messen', () => messen(anfrage('/api/cloud/messen', { punkte: [{ ereignis: 'setup.fertig' }] }))],
    ['auth-sms', () => authSms(anfrage('/api/cloud/auth-sms', {}))],
    ['cron', () => cron(anfrage('/api/cron/taeglich'))],
  ])('%s', async (_, aufruf) => {
    const r = await aufruf();
    expect(r.status).toBe(501);
    expect(await r.json()).toMatchObject(_ === 'auth-sms' ? { error: { message: 'nicht verbunden' } } : { fehler: 'nicht verbunden' });
  });

  test('Supabase da, aber kein E-Mail-Anbieter → 501 für E-Mail', async () => {
    mitSupabase();
    const r = await senden(anfrage('/api/cloud/senden', { versand: { an: 'a@b.de', kanal: 'email', text: 'Hallo' } }));
    expect(r.status).toBe(501);
  });
});

describe('senden', () => {
  test('E-Mail über Resend: Absender = Betrieb, Antwort an Betrieb, Öffnen-Link statt Original', async () => {
    mitSupabase();
    vi.stubEnv('RESEND_API_KEY', 're_test');
    vi.stubEnv('EMAIL_ABSENDER', 'post@mail.macher-os.de');
    const aufrufe = fetchAttrappe([...ANGEMELDET, ['POST /rest/v1/versand', undefined, 201], ['PATCH /rest/v1/versand', undefined, 204], ['POST api.resend.com', { id: 'r1' }]]);
    const r = await senden(
      anfrage('/api/cloud/senden', {
        versand: { an: 'kunde@beispiel.de', kanal: 'email', betreff: 'Ihr Angebot', text: 'Guten Tag,\n\nanbei.', link: 'https://app.macher-os.de/k/abc', bezug: { typ: 'angebote', id: 'a1' } },
      }),
    );
    expect(r.status).toBe(200);
    const ergebnis = (await r.json()) as { status: string; id: string };
    expect(ergebnis.status).toBe('gesendet');
    const mail = aufrufe.find((a) => a.url.host === 'api.resend.com')!;
    expect(mail.init.headers).toMatchObject({ authorization: 'Bearer re_test' });
    expect(mail.body).toMatchObject({ from: 'Elektro Muster <post@mail.macher-os.de>', to: ['kunde@beispiel.de'], reply_to: 'info@muster.de', subject: 'Ihr Angebot' });
    const b = mail.body as { text: string; html: string };
    expect(b.text).toContain(`/api/cloud/oeffnen?v=${ergebnis.id}`);
    expect(b.text).not.toContain('/k/abc');
    expect(b.html).toContain('#2F9250');
    const protokoll = aufrufe.find((a) => a.url.pathname === '/rest/v1/versand' && a.init.method === 'POST')!;
    expect(protokoll.body).toEqual([expect.objectContaining({ id: ergebnis.id, betrieb_id: 'b1', ziel_link: 'https://app.macher-os.de/k/abc', bezug: { typ: 'angebote', id: 'a1' } })]);
  });

  test('SMS über HTTP-Anbieter mit internationaler Nummer', async () => {
    mitSupabase();
    vi.stubEnv('SMS_API_KEY', 'sms-key');
    vi.stubEnv('SMS_ABSENDER', 'Muster');
    const aufrufe = fetchAttrappe([...ANGEMELDET, ['POST /rest/v1/versand', undefined, 201], ['PATCH /rest/v1/versand', undefined, 204], ['POST gateway.seven.io', { success: '100', messages: [{ id: 77 }] }]]);
    const r = await senden(anfrage('/api/cloud/senden', { versand: { an: '0171 123 45 67', kanal: 'sms', text: 'Wir sind unterwegs.' } }));
    expect(await r.json()).toMatchObject({ status: 'gesendet' });
    const sms = aufrufe.find((a) => a.url.host === 'gateway.seven.io')!;
    expect(sms.init.headers).toMatchObject({ 'X-Api-Key': 'sms-key' });
    expect(sms.body).toEqual({ to: '+491711234567', from: 'Muster', text: 'Wir sind unterwegs.' });
  });

  test('ohne Anmeldung → 401', async () => {
    mitSupabase();
    vi.stubEnv('RESEND_API_KEY', 're_test');
    fetchAttrappe([['GET /auth/v1/user', { msg: 'invalid' }, 401]]);
    const r = await senden(anfrage('/api/cloud/senden', { versand: { an: 'a@b.de', kanal: 'email', text: 'x' } }));
    expect(r.status).toBe(401);
  });

  test('Anbieterfehler → 502 und Status „fehler“ im Protokoll', async () => {
    mitSupabase();
    vi.stubEnv('RESEND_API_KEY', 're_test');
    const aufrufe = fetchAttrappe([...ANGEMELDET, ['POST /rest/v1/versand', undefined, 201], ['PATCH /rest/v1/versand', undefined, 204], ['POST api.resend.com', { message: 'kaputt' }, 500]]);
    const r = await senden(anfrage('/api/cloud/senden', { versand: { an: 'a@b.de', kanal: 'email', text: 'x' } }));
    expect(r.status).toBe(502);
    expect(aufrufe.find((a) => a.init.method === 'PATCH')?.body).toEqual({ status: 'fehler' });
  });
});

describe('WhatsApp', () => {
  test('ohne Schlüssel 501, mit Vorlage als Template ohne Zeilenumbrüche', async () => {
    mitSupabase();
    const ohne = await senden(anfrage('/api/cloud/senden', { versand: { an: '0171', kanal: 'whatsapp', text: 'x' } }));
    expect(ohne.status).toBe(501);
    vi.stubEnv('WHATSAPP_TOKEN', 'wa-token');
    vi.stubEnv('WHATSAPP_NUMMER_ID', '12345');
    vi.stubEnv('WHATSAPP_VORLAGE', 'nachricht_vom_betrieb');
    const aufrufe = fetchAttrappe([...ANGEMELDET, ['POST /rest/v1/versand', undefined, 201], ['PATCH /rest/v1/versand', undefined, 204], ['POST graph.facebook.com', { messages: [{ id: 'wamid.1' }] }]]);
    const r = await senden(anfrage('/api/cloud/senden', { versand: { an: '0171 1234567', kanal: 'whatsapp', text: 'Guten Tag,\nwir sind unterwegs.' } }));
    expect(await r.json()).toMatchObject({ status: 'gesendet' });
    const wa = aufrufe.find((a) => a.url.host === 'graph.facebook.com')!;
    expect(wa.url.pathname).toBe('/v21.0/12345/messages');
    expect(wa.init.headers).toMatchObject({ authorization: 'Bearer wa-token' });
    expect(wa.body).toMatchObject({
      to: '491711234567',
      type: 'template',
      template: { name: 'nachricht_vom_betrieb', language: { code: 'de' }, components: [{ type: 'body', parameters: [{ type: 'text', text: 'Guten Tag, · wir sind unterwegs.' }] }] },
    });
  });
});

describe('private Dateien', () => {
  const PFAD = '11111111-2222-3333-4444-555555555555/abc-foto.jpg';
  test('Link nur für den eigenen Betrieb, Öffnen nur mit gültiger Signatur', async () => {
    mitSupabase();
    fetchAttrappe([
      ['GET /auth/v1/user', { id: 'u1' }],
      ['GET /rest/v1/mitglieder', [{ betrieb_id: '11111111-2222-3333-4444-555555555555', nutzer_id: 'u1', rolle: 'monteur' }]],
      ['POST /storage/v1/object/sign/dateien/', { signedURL: '/object/sign/dateien/x.jpg?token=kurz' }],
    ]);
    const fremd = await dateiLink(anfrage('/api/cloud/datei', { pfad: '99999999-2222-3333-4444-555555555555/abc.jpg' }));
    expect(fremd.status).toBe(400);
    const r = await dateiLink(anfrage('/api/cloud/datei', { pfad: PFAD }));
    const { url } = (await r.json()) as { url: string };
    expect(url).toMatch(/^https:\/\/app\.macher-os\.de\/api\/cloud\/datei\?p=.+&s=[\w-]{32}$/);
    const offen = await dateiOeffnen(new Request(url));
    expect(offen.status).toBe(302);
    expect(offen.headers.get('location')).toBe(`${SUPA}/storage/v1/object/sign/dateien/x.jpg?token=kurz`);
    const gefaelscht = await dateiOeffnen(new Request(url.replace(/s=.*/, 's=' + 'A'.repeat(32))));
    expect(gefaelscht.status).toBe(404);
    const anderePfad = await dateiOeffnen(new Request(url.replace('abc-foto', 'xyz-foto')));
    expect(anderePfad.status).toBe(404);
  });
});

describe('einladen', () => {
  test('Monteur darf nicht einladen', async () => {
    mitSupabase();
    fetchAttrappe([
      ['GET /auth/v1/user', { id: 'u2' }],
      ['GET /rest/v1/mitglieder', [{ betrieb_id: 'b1', nutzer_id: 'u2', rolle: 'monteur' }]],
    ]);
    const r = await einladen(anfrage('/api/cloud/einladen', { mitarbeiterId: 'm2', ziel: { telefon: '0171' } }));
    expect(r.status).toBe(403);
  });

  test('Chef lädt per SMS ein – Einladung mit Rolle des Mitarbeiters', async () => {
    mitSupabase();
    vi.stubEnv('SMS_API_KEY', 'sms-key');
    const aufrufe = fetchAttrappe([
      ...ANGEMELDET,
      ['GET sammlung=eq.mitarbeiter&id=eq.m2', [{ daten: { vorname: 'Jonas', rolle: 'monteur' } }]],
      ['POST /rest/v1/einladungen', undefined, 201],
      ['POST gateway.seven.io', { id: 5 }],
    ]);
    const r = await einladen(anfrage('/api/cloud/einladen', { mitarbeiterId: 'm2', ziel: { telefon: '0171 1234567' } }));
    const e = (await r.json()) as { status: string; link: string };
    expect(e.status).toBe('gesendet');
    expect(e.link).toMatch(/^https:\/\/app\.macher-os\.de\/os\/beitreten\/[\w-]{20,}$/);
    const einl = aufrufe.find((a) => a.url.pathname === '/rest/v1/einladungen')!.body as { rolle: string; mitarbeiter_id: string }[];
    expect(einl[0]).toMatchObject({ rolle: 'monteur', mitarbeiter_id: 'm2', betrieb_id: 'b1' });
    const sms = aufrufe.find((a) => a.url.host === 'gateway.seven.io')!.body as { text: string };
    expect(sms.text).toContain('Hallo Jonas');
    expect(sms.text).toContain(e.link);
  });

  test('SMS nicht verbunden → Einladung trotzdem angelegt, Link zum Teilen zurück', async () => {
    mitSupabase();
    fetchAttrappe([...ANGEMELDET, ['GET sammlung=eq.mitarbeiter', [{ daten: { rolle: 'buero' } }]], ['POST /rest/v1/einladungen', undefined, 201]]);
    const r = await einladen(anfrage('/api/cloud/einladen', { mitarbeiterId: 'm3', ziel: { telefon: '0171' } }));
    expect(await r.json()).toMatchObject({ status: 'fehler', link: expect.stringContaining('/beitreten/') });
  });
});

describe('Öffnen-Status und öffentliche Links', () => {
  test('Öffnen-Link vermerkt einmal und leitet weiter', async () => {
    mitSupabase();
    const aufrufe = fetchAttrappe([
      ['GET /rest/v1/versand?id=eq.v_1', [{ id: 'v_1', betrieb_id: 'b1', kanal: 'email', bezug: { typ: 'angebote', id: 'a1' }, ziel_link: 'https://app.macher-os.de/k/abc', geoeffnet_am: null }]],
      ['PATCH /rest/v1/versand', [{ id: 'v_1' }]],
      ['GET sammlung=eq.angebote&id=eq.a1', [{ daten: { kundeId: 'k1' } }]],
      ['POST /rest/v1/objekte', undefined, 201],
    ]);
    const r = await oeffnen(anfrage('/api/cloud/oeffnen?v=v_1'));
    expect(r.status).toBe(302);
    expect(r.headers.get('location')).toBe('https://app.macher-os.de/k/abc');
    const e = aufrufe.find((a) => a.url.pathname === '/rest/v1/objekte' && a.init.method === 'POST')!.body as { sammlung: string; daten: { typ: string; daten: unknown } }[];
    expect(e[0]).toMatchObject({ sammlung: 'ereignisse', daten: { typ: 'portal.geoeffnet', daten: { kundeId: 'k1', bezug: { typ: 'angebote', id: 'a1' } } } });
  });

  test('unbekannter Öffnen-Link führt zur App', async () => {
    mitSupabase();
    fetchAttrappe([['GET /rest/v1/versand', []]]);
    const r = await oeffnen(anfrage('/api/cloud/oeffnen?v=gibtsnicht'));
    expect(r.headers.get('location')).toBe('https://app.macher-os.de');
  });

  test('Kundenbereich: Daten des Kunden ohne interne Felder, Öffnen wird vermerkt', async () => {
    mitSupabase();
    const aufrufe = fetchAttrappe([
      ['GET /rest/v1/oeffentliche_links', []],
      ['GET sammlung=eq.portalzugaenge', [{ betrieb_id: 'b1', daten: { token: 'tok', kundeId: 'k1', gueltigBis: '2099-01-01' } }]],
      ['GET sammlung=eq.betrieb', [{ sammlung: 'betrieb', id: 'betrieb', daten: { name: 'Elektro Muster', stundensatz: 6500 } }]],
      ['GET sammlung=eq.kunden', [{ sammlung: 'kunden', id: 'k1', daten: { id: 'k1', name: 'Meier', notiz: 'zahlt spät' } }]],
      [
        'GET sammlung=in.(',
        [
          { sammlung: 'angebote', id: 'a1', daten: { id: 'a1', kundeId: 'k1', nummer: 'A-1', interneNotiz: 'knapp kalkuliert' } },
          { sammlung: 'angebote', id: 'a2', daten: { id: 'a2', kundeId: 'k1', beispiel: true } },
        ],
      ],
      ['POST /rest/v1/objekte', undefined, 201],
    ]);
    const r = await oeffentlich(anfrage('/api/cloud/oeffentlich?art=portal&token=tok'));
    expect(r.status).toBe(200);
    const d = (await r.json()) as { kunde: Record<string, unknown>; betrieb: Record<string, unknown>; objekte: Record<string, Record<string, unknown>[]> };
    expect(d.kunde).toEqual({ id: 'k1', name: 'Meier' });
    expect(d.betrieb).toEqual({ name: 'Elektro Muster' });
    expect(d.objekte.angebote).toEqual([{ id: 'a1', kundeId: 'k1', nummer: 'A-1' }]);
    const vermerk = aufrufe.find((a) => a.url.pathname === '/rest/v1/objekte' && a.init.method === 'POST')!;
    expect((vermerk.init.headers as Record<string, string>).prefer).toContain('ignore-duplicates');
  });

  test('unbekanntes Token → 404', async () => {
    mitSupabase();
    fetchAttrappe([['GET /rest/v1/oeffentliche_links', []], ['GET /rest/v1/objekte', []]]);
    const r = await oeffentlich(anfrage('/api/cloud/oeffentlich?art=buchung&token=nix'));
    expect(r.status).toBe(404);
  });
});

describe('Push', () => {
  test('an alle Geräte des Mitarbeiters, abgemeldete Geräte werden entfernt', async () => {
    vi.stubEnv('VAPID_PUBLIC_KEY', 'pub');
    vi.stubEnv('VAPID_PRIVATE_KEY', 'priv');
    const aufrufe = fetchAttrappe([
      ['GET /rest/v1/mitglieder', [{ nutzer_id: 'u2' }]],
      [
        'GET /rest/v1/push_abos',
        [
          { nutzer_id: 'u2', abo: { endpoint: 'https://push.example/1', keys: { p256dh: 'a', auth: 'b' } } },
          { nutzer_id: 'u2', abo: { endpoint: 'https://push.example/2', keys: { p256dh: 'a', auth: 'b' } } },
        ],
      ],
      ['DELETE /rest/v1/push_abos', undefined, 204],
    ]);
    const gesendet: string[] = [];
    const sender = {
      sendNotification: vi.fn(async (abo: { endpoint: string }, nutzlast?: string | Buffer | null) => {
        if (abo.endpoint.endsWith('/2')) throw Object.assign(new Error('weg'), { statusCode: 410 });
        gesendet.push(String(nutzlast));
        return { statusCode: 201, body: '', headers: {} };
      }),
    };
    const r = await pushAnMitarbeiter({ url: SUPA, serviceKey: 's' }, 'b1', { anMitarbeiterId: 'm2', titel: 'Urlaub genehmigen?', pfad: '/macher/hinweise' }, sender);
    expect(r).toEqual({ geraete: 1, email: false });
    expect(JSON.parse(gesendet[0])).toMatchObject({ titel: 'Urlaub genehmigen?', pfad: '/macher/hinweise' });
    expect(aufrufe.some((a) => a.init.method === 'DELETE' && decodeURIComponent(a.url.href).includes('push.example/2'))).toBe(true);
  });
});

describe('Messung', () => {
  test('nur Ereignisname und einfache Werte, Inhalte werden gekürzt', () => {
    expect(bereinigen({ ereignis: 'setup.fertig', zeit: '2026-10-02T10:00:00Z', daten: { schritte: 4, quelle: 'x'.repeat(200), objekt: { name: 'Meier' } } }, 'abcdef12-3456')).toEqual({
      ereignis: 'setup.fertig',
      zeit: '2026-10-02T10:00:00.000Z',
      daten: { schritte: 4, quelle: 'x'.repeat(80), installation: 'abcdef12-3456' },
    });
    expect(bereinigen({ ereignis: '<script>' })).toBeUndefined();
  });

  test('ohne Anmeldung wird ohne Betrieb gespeichert', async () => {
    mitSupabase();
    const aufrufe = fetchAttrappe([['GET /auth/v1/user', {}, 401], ['POST /rest/v1/messpunkte', undefined, 201]]);
    const r = await messen(anfrage('/api/cloud/messen', { punkte: [{ ereignis: 'setup.gestartet' }], installation: 'abcdef12' }, ''));
    expect(r.status).toBe(204);
    expect(aufrufe.find((a) => a.url.pathname === '/rest/v1/messpunkte')!.body).toEqual([expect.objectContaining({ ereignis: 'setup.gestartet', betrieb_id: null })]);
  });
});

describe('Anmeldecode per SMS (Supabase-Hook)', () => {
  const geheim = Buffer.from('geheimer-schluessel-1234567890').toString('base64');
  const signieren = (id: string, zeit: string, roh: string) => `v1,${createHmac('sha256', Buffer.from(geheim, 'base64')).update(`${id}.${zeit}.${roh}`).digest('base64')}`;

  test('Signatur wird geprüft', () => {
    const zeit = String(Math.floor(Date.now() / 1000));
    expect(signaturPruefen(`v1,whsec_${geheim}`, 'id1', zeit, '{}', signieren('id1', zeit, '{}'))).toBe(true);
    expect(signaturPruefen(`v1,whsec_${geheim}`, 'id1', zeit, '{"x":1}', signieren('id1', zeit, '{}'))).toBe(false);
    expect(signaturPruefen(`v1,whsec_${geheim}`, 'id1', '1000', '{}', signieren('id1', '1000', '{}'))).toBe(false);
  });

  test('schickt den Code über den SMS-Anbieter', async () => {
    vi.stubEnv('SUPABASE_SMS_HOOK_SECRET', `v1,whsec_${geheim}`);
    vi.stubEnv('SMS_API_KEY', 'sms-key');
    const aufrufe = fetchAttrappe([['POST gateway.seven.io', { id: 1 }]]);
    const roh = JSON.stringify({ user: { phone: '491711234567' }, sms: { otp: '123456' } });
    const zeit = String(Math.floor(Date.now() / 1000));
    const r = await authSms(
      new Request('https://app.macher-os.de/api/cloud/auth-sms', {
        method: 'POST',
        headers: { 'webhook-id': 'msg_1', 'webhook-timestamp': zeit, 'webhook-signature': signieren('msg_1', zeit, roh) },
        body: roh,
      }),
    );
    expect(r.status).toBe(200);
    expect(aufrufe[0].body).toMatchObject({ to: '+491711234567', text: expect.stringContaining('123456') });
  });
});

describe('Cron', () => {
  test('nur mit CRON_SECRET', async () => {
    mitSupabase();
    vi.stubEnv('CRON_SECRET', 'geheim');
    const falsch = await cron(new Request('https://app.macher-os.de/api/cron/taeglich', { headers: { authorization: 'Bearer falsch' } }));
    expect(falsch.status).toBe(401);
    const aufrufe = fetchAttrappe([['DELETE /rest/v1/', undefined, 204]]);
    const r = await cron(new Request('https://app.macher-os.de/api/cron/taeglich', { headers: { authorization: 'Bearer geheim' } }));
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({ ergebnis: { 'einladungen-aufraeumen': 'erledigt', 'links-aufraeumen': 'erledigt', 'messpunkte-aufraeumen': 'erledigt' } });
    expect(aufrufe.map((a) => a.url.pathname)).toEqual(['/rest/v1/einladungen', '/rest/v1/oeffentliche_links', '/rest/v1/messpunkte']);
  });
});
