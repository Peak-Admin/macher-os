// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from './route';

const ereignis = { typ: 'anruf.beendet', ergebnis: { anrufId: 'a1', anbieter: 'simulator', von: '0171 2345678', beginn: '2026-10-02T08:00:00.000Z', felder: { anliegen: 'Rohrbruch im Keller' } } };
const anfrage = (body: unknown, kopf: Record<string, string> = { 'x-macher-signatur': 'geheim' }, betrieb = 'b1') =>
  new Request(`https://macher.example/api/telefon/eingang${betrieb ? `?betrieb=${betrieb}` : ''}`, { method: 'POST', headers: { 'content-type': 'application/json', ...kopf }, body: JSON.stringify(body) });

describe('/api/telefon/eingang', () => {
  const netz = vi.fn();
  beforeEach(() => {
    vi.stubGlobal('fetch', netz);
    netz.mockReset();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    for (const k of ['TELEFON_ANBIETER', 'TELEFON_WEBHOOK_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) delete process.env[k];
  });

  it('ohne Anbieter oder Geheimnis: 501', async () => {
    expect((await POST(anfrage(ereignis))).status).toBe(501);
    expect(GET().status).toBe(501);
    process.env.TELEFON_ANBIETER = 'simulator';
    expect((await POST(anfrage(ereignis))).status).toBe(501);
    expect(netz).not.toHaveBeenCalled();
  });

  describe('mit Simulator', () => {
    beforeEach(() => {
      process.env.TELEFON_ANBIETER = 'simulator';
      process.env.TELEFON_WEBHOOK_SECRET = 'geheim';
      process.env.SUPABASE_URL = 'https://db.example';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';
    });

    it('prüft Signatur und Betrieb', async () => {
      expect((await POST(anfrage(ereignis, { 'x-macher-signatur': 'falsch' }))).status).toBe(401);
      expect((await POST(anfrage(ereignis, undefined, ''))).status).toBe(400);
      expect(netz).not.toHaveBeenCalled();
    });

    it('legt den Anruf als Nachricht beim Betrieb ab', async () => {
      netz.mockResolvedValueOnce(new Response('[]', { status: 200 })).mockResolvedValueOnce(new Response(null, { status: 201 }));
      const r = await POST(anfrage(ereignis));
      expect(r.status).toBe(200);
      expect(await r.json()).toMatchObject({ ok: true, abgelegt: 1, doppelt: 0 });
      const [url, init] = netz.mock.calls[1];
      expect(String(url)).toContain('/rest/v1/objekte');
      const zeilen = JSON.parse(init.body);
      expect(zeilen[0]).toMatchObject({ betrieb_id: 'b1', sammlung: 'nachrichten', daten: { kanal: 'telefon', anruf: { anrufId: 'a1', status: 'neu' } } });
    });

    it('unbekannte Ereignisse werden quittiert, nicht gespeichert', async () => {
      const r = await POST(anfrage({ typ: 'irgendwas' }));
      expect(await r.json()).toEqual({ ok: true, ignoriert: true });
      expect(netz).not.toHaveBeenCalled();
    });
  });
});
