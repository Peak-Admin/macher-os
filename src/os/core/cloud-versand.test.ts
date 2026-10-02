import { describe, expect, it, vi } from 'vitest';
import { LOKALE_CLOUD } from './cloud';
import { emailUeberServer, mitServerVersand, versandPruefen } from './cloud-versand';

const antwort = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const v = { an: 'k@example.de', kanal: 'email' as const, text: 'Hallo' };

describe('E-Mail über den Server (Resend)', () => {
  it('sendet E-Mail über /api/senden', async () => {
    const f = vi.fn(async () => antwort(200, { id: 'm1' }));
    const lokal = { ...LOKALE_CLOUD, senden: vi.fn(LOKALE_CLOUD.senden) };
    expect(await mitServerVersand(lokal, f as unknown as typeof fetch).senden(v)).toEqual({ status: 'gesendet', id: 'm1' });
    expect(lokal.senden).not.toHaveBeenCalled();
  });
  it('nicht eingerichtet (501) oder keine Funktion (404) oder offline: Mailprogramm', async () => {
    for (const f of [async () => antwort(501, {}), async () => antwort(404, {}), async () => { throw new Error('offline'); }]) {
      const lokal = { ...LOKALE_CLOUD, senden: vi.fn(async () => ({ status: 'geoeffnet' as const })) };
      expect(await mitServerVersand(lokal, f as unknown as typeof fetch).senden(v)).toEqual({ status: 'geoeffnet' });
    }
  });
  it('Fehler des Dienstes wird gemeldet (der Rückfall folgt in sendenMitRueckfall)', async () => {
    const f = async () => antwort(502, { fehler: 'E-Mail-Dienst: nope' });
    expect(await mitServerVersand(LOKALE_CLOUD, f as unknown as typeof fetch).senden(v)).toEqual({ status: 'fehler', fehler: 'E-Mail-Dienst: nope' });
  });
  it('SMS bleibt lokal', async () => {
    const f = vi.fn();
    const lokal = { ...LOKALE_CLOUD, senden: vi.fn(async () => ({ status: 'geoeffnet' as const })) };
    await mitServerVersand(lokal, f as unknown as typeof fetch).senden({ ...v, kanal: 'sms', an: '0171' });
    expect(f).not.toHaveBeenCalled();
  });
  it('prüft beim Start, ob E-Mail eingerichtet ist', async () => {
    expect(await versandPruefen((async () => antwort(200, { email: true })) as unknown as typeof fetch)).toBe(true);
    expect(emailUeberServer()).toBe(true);
    expect(await versandPruefen((async () => { throw new Error('x'); }) as unknown as typeof fetch)).toBe(false);
    expect(emailUeberServer()).toBe(false);
  });
});
