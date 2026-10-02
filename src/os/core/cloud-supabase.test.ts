import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cloud, LOKALE_CLOUD } from './cloud';
import { erzeugeSupabaseCloud, konfigAusUmgebung, kontoZustand, starteCloud, telefonNormal, type SupabaseCloud } from './cloud-supabase';
import { db, zuruecksetzen } from './db';
import { messen, setzeMessziel } from './messung';
import { ichId } from './session';
import type { starteSync } from './sync';

const SESSION = { access_token: 'tok-123', user: { id: 'u1', email: 'chef@muster.de', phone: '' } };

/** Supabase-Client-Attrappe: Tabellen als Arrays, Abfragen als verkettbare Promise */
function attrappe(tabellen: Record<string, unknown[]> = {}, rpcs: Record<string, (a: Record<string, unknown>) => { data?: unknown; error?: { message: string } }> = {}) {
  let session: typeof SESSION | null = null;
  const aufrufe: { tabelle: string; methode: string; args: unknown[] }[] = [];
  const abfrage = (tabelle: string) => {
    const filter: [string, unknown][] = [];
    const q: Record<string, unknown> = {};
    const kette = (methode: string) => (...args: unknown[]) => {
      aufrufe.push({ tabelle, methode, args });
      if (methode === 'eq') filter.push([args[0] as string, args[1]]);
      return q;
    };
    for (const m of ['select', 'eq', 'gt', 'order', 'limit', 'range', 'upsert', 'delete', 'insert']) q[m] = kette(m);
    q.then = (ok: (r: unknown) => void) => {
      const daten = (tabellen[tabelle] ?? []).filter((z) => filter.every(([f, w]) => (z as Record<string, unknown>)[f] === w));
      ok({ data: daten, error: null });
    };
    return q;
  };
  const hochgeladen: { pfad: string; datei: Blob }[] = [];
  const client = {
    auth: {
      signInWithOtp: vi.fn(async () => ({ data: {}, error: null })),
      verifyOtp: vi.fn(async () => {
        session = SESSION;
        return { data: { session }, error: null };
      }),
      getSession: vi.fn(async () => ({ data: { session } })),
      signOut: vi.fn(async () => {
        session = null;
        return { error: null };
      }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe() {} } } })),
    },
    rpc: vi.fn(async (name: string, args: Record<string, unknown>) => rpcs[name]?.(args) ?? { data: null, error: { message: `rpc ${name} fehlt` } }),
    from: vi.fn((t: string) => abfrage(t)),
    storage: {
      from: () => ({
        upload: vi.fn(async (pfad: string, datei: Blob) => {
          hochgeladen.push({ pfad, datei });
          return { data: { path: pfad }, error: null };
        }),
        getPublicUrl: (pfad: string) => ({ data: { publicUrl: `https://projekt.supabase.co/storage/v1/object/public/dateien/${pfad}` } }),
      }),
    },
    channel: vi.fn(),
    removeChannel: vi.fn(),
  };
  return { client: client as unknown as SupabaseClient, roh: client, aufrufe, hochgeladen };
}

function speicher() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), m };
}

function syncAttrappe() {
  const steuerung = { abgleichen: vi.fn(async () => {}), allesHochladen: vi.fn(async () => 3), stoppen: vi.fn() };
  const starten = vi.fn(() => steuerung) as unknown as typeof starteSync;
  return { starten, steuerung };
}

function antwort(status: number, body?: unknown) {
  return new Response(body === undefined || status === 204 ? null : JSON.stringify(body), { status });
}

const KONFIG = { url: 'https://projekt.supabase.co', anonKey: 'anon', apiBasis: '' };
let offen: string[] = [];

beforeEach(() => {
  zuruecksetzen();
  localStorage.clear();
  offen = [];
  vi.stubGlobal('open', (url: string) => void offen.push(url));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  setzeMessziel(undefined);
});

function eingerichtet() {
  db.betrieb.create({ id: 'betrieb', name: 'Elektro Muster', onboardingFertig: true } as never);
  db.mitarbeiter.create({ id: 'chef1', vorname: 'Max', name: 'Muster', rolle: 'chef' } as never);
}

describe('ohne Schlüssel', () => {
  test('keine Konfiguration → App bleibt lokal', async () => {
    expect(konfigAusUmgebung({})).toBeUndefined();
    expect(await starteCloud(undefined)).toBe(false);
    expect(cloud()).toBe(LOKALE_CLOUD);
    expect(cloud().aktiv()).toBe(false);
  });
  test('mit Schlüsseln wird konfiguriert', () => {
    expect(konfigAusUmgebung({ NEXT_PUBLIC_SUPABASE_URL: 'https://x.supabase.co', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'k', NEXT_PUBLIC_VAPID_PUBLIC_KEY: 'v' })).toEqual({
      url: 'https://x.supabase.co',
      anonKey: 'k',
      vapidKey: 'v',
      apiBasis: '',
    });
  });
});

describe('Anmeldung ohne Passwort', () => {
  test('E-Mail-Link mit Rücksprung, Handynummer international', async () => {
    const a = attrappe();
    const c = erzeugeSupabaseCloud(a.client, KONFIG, { speicher: speicher(), ursprung: 'https://app.macher-os.de' });
    expect(await c.anmelden({ email: 'chef@muster.de' })).toEqual({ ok: true });
    expect(a.roh.auth.signInWithOtp).toHaveBeenCalledWith({ email: 'chef@muster.de', options: { emailRedirectTo: 'https://app.macher-os.de/os/anmelden' } });
    expect(await c.anmelden({ telefon: '0171 / 123 45 67' })).toEqual({ ok: true });
    expect(a.roh.auth.signInWithOtp).toHaveBeenLastCalledWith({ phone: '+491711234567' });
    expect((await c.anmelden({ email: 'kaputt' })).ok).toBe(false);
    expect(telefonNormal('0049 171 1')).toBe('+491711');
  });

  test('Einladungs-Token reist im E-Mail-Link mit', async () => {
    const a = attrappe();
    const c = erzeugeSupabaseCloud(a.client, KONFIG, { speicher: speicher(), ursprung: 'https://app.macher-os.de' });
    c.einladungMerken('tok42');
    await c.anmelden({ email: 'jonas@muster.de' });
    expect(a.roh.auth.signInWithOtp).toHaveBeenCalledWith(expect.objectContaining({ options: { emailRedirectTo: 'https://app.macher-os.de/os/anmelden?einladung=tok42' } }));
  });

  test('Übernahme: neuer Nutzer mit eingerichtetem Betrieb → Betrieb anlegen, Daten einmalig hochladen', async () => {
    eingerichtet();
    const a = attrappe({ mitglieder: [] }, { betrieb_anlegen: () => ({ data: 'b-neu' }) });
    const s = syncAttrappe();
    const sp = speicher();
    const c = erzeugeSupabaseCloud(a.client, KONFIG, { speicher: sp, syncStarten: s.starten });
    expect(c.aktiv()).toBe(true); // Backend verbunden …
    expect(c.konto()).toBeUndefined(); // … aber noch niemand angemeldet
    expect(await c.codeBestaetigen('0171 1234567', '123 456')).toEqual({ ok: true });
    expect(a.roh.auth.verifyOtp).toHaveBeenCalledWith({ phone: '+491711234567', token: '123456', type: 'sms' });
    expect(a.roh.rpc).toHaveBeenCalledWith('betrieb_anlegen', { p_name: 'Elektro Muster', p_mitarbeiter_id: 'chef1' });
    expect(s.steuerung.allesHochladen).toHaveBeenCalled();
    expect(db.betrieb.get('betrieb')?.name).toBe('Elektro Muster'); // nichts gelöscht
    expect(c.aktiv()).toBe(true);
    expect(c.konto()).toEqual({ nutzerId: 'u1', email: 'chef@muster.de', telefon: undefined, betriebId: 'b-neu' });
    expect(kontoZustand().phase).toBe('bereit');
    // Konto bleibt gemerkt (offline weiterarbeiten nach Neustart)
    expect(JSON.parse(sp.m.get('macher-os:konto')!).betriebId).toBe('b-neu');
  });

  test('Einladung annehmen: Gerät übernimmt die Daten des Betriebs, „ich“ = eingeladener Mitarbeiter', async () => {
    db.kunden.create({ name: 'Alter Testkunde' } as never);
    const a = attrappe(
      { mitglieder: [{ nutzer_id: 'u1', betrieb_id: 'b1', mitarbeiter_id: 'm7', rolle: 'monteur' }] },
      { einladung_annehmen: (x) => (x.p_token === 'tok42' ? { data: [{ betrieb_id: 'b1', mitarbeiter_id: 'm7', rolle: 'monteur' }] } : { error: { message: 'ungültig' } }) },
    );
    const s = syncAttrappe();
    const c = erzeugeSupabaseCloud(a.client, KONFIG, { speicher: speicher(), syncStarten: s.starten });
    c.einladungMerken('tok42');
    const gesehen = vi.fn();
    const { on } = await import('./events');
    const weg = on('team.beigetreten', gesehen);
    expect((await c.codeBestaetigen('jonas@muster.de', '654321')).ok).toBe(true);
    weg();
    expect(a.roh.rpc).toHaveBeenCalledWith('einladung_annehmen', { p_token: 'tok42' });
    expect(db.kunden.all()).toEqual([]); // Gerätedaten ersetzt (vorher gesichert, wenn IndexedDB da ist)
    expect(s.steuerung.abgleichen).toHaveBeenCalled();
    expect(s.steuerung.allesHochladen).not.toHaveBeenCalled();
    expect(ichId()).toBe('m7');
    expect(gesehen).toHaveBeenCalled();
    expect(c.konto()?.betriebId).toBe('b1');
  });

  test('ohne Betrieb und ohne Einladung: ehrlicher Zustand statt leerem Mandanten', async () => {
    const a = attrappe({ mitglieder: [] });
    const s = syncAttrappe();
    const c = erzeugeSupabaseCloud(a.client, KONFIG, { speicher: speicher(), syncStarten: s.starten });
    await c.codeBestaetigen('chef@muster.de', '111111');
    expect(kontoZustand().phase).toBe('kein-betrieb');
    expect(c.konto()?.betriebId).toBeUndefined();
    expect(a.roh.rpc).not.toHaveBeenCalled();
  });

  test('angemeldet mitten in der Einrichtung → nach dem Abschluss automatisch gesichert', async () => {
    db.betrieb.create({ id: 'betrieb', name: 'Elektro Muster', onboardingFertig: false } as never);
    const a = attrappe({ mitglieder: [] }, { betrieb_anlegen: () => ({ data: 'b-neu' }) });
    const s = syncAttrappe();
    const c = erzeugeSupabaseCloud(a.client, KONFIG, { speicher: speicher(), syncStarten: s.starten });
    await c.starten();
    expect((await c.codeBestaetigen('0171 1234567', '123456')).ok).toBe(true);
    expect(kontoZustand().phase).toBe('kein-betrieb');
    db.betrieb.update('betrieb', { onboardingFertig: true } as never);
    await vi.waitFor(() => expect(c.konto()?.betriebId).toBe('b-neu'));
    expect(s.steuerung.allesHochladen).toHaveBeenCalled();
  });

  test('abmelden stoppt den Abgleich, Daten bleiben', async () => {
    eingerichtet();
    const a = attrappe({ mitglieder: [{ nutzer_id: 'u1', betrieb_id: 'b1', rolle: 'chef' }] });
    const sp = speicher();
    sp.setItem('macher-os:daten-betrieb', 'b1');
    const c = erzeugeSupabaseCloud(a.client, KONFIG, { speicher: sp, syncStarten: syncAttrappe().starten });
    await c.codeBestaetigen('chef@muster.de', '111111');
    await c.abmelden();
    expect(c.konto()?.betriebId).toBeUndefined();
    expect(db.betrieb.get('betrieb')).toBeDefined();
    expect(kontoZustand().phase).toBe('abgemeldet');
  });
});

describe('Dienste', () => {
  async function angemeldet(fetchFn: typeof fetch) {
    eingerichtet();
    const a = attrappe({ mitglieder: [{ nutzer_id: 'u1', betrieb_id: 'b1', rolle: 'chef' }] });
    const sp = speicher();
    sp.setItem('macher-os:daten-betrieb', 'b1');
    const c = erzeugeSupabaseCloud(a.client, KONFIG, { speicher: sp, syncStarten: syncAttrappe().starten, fetch: fetchFn });
    await c.codeBestaetigen('chef@muster.de', '111111');
    return { c, a };
  }
  const versand = { an: 'kunde@beispiel.de', kanal: 'email' as const, betreff: 'Angebot', text: 'Hallo', link: 'https://app/k/1' };

  test('senden über den Server mit Anmeldung', async () => {
    const f = vi.fn(async () => antwort(200, { status: 'gesendet', id: 'v_1' }));
    const { c } = await angemeldet(f as unknown as typeof fetch);
    expect(await c.senden(versand)).toEqual({ status: 'gesendet', id: 'v_1' });
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/cloud/senden');
    expect(init.headers).toMatchObject({ authorization: 'Bearer tok-123' });
    expect(JSON.parse(init.body as string)).toEqual({ versand });
  });

  test('Server nicht verbunden (501) oder offline → eigenes Mail-Programm', async () => {
    const { c } = await angemeldet((async () => antwort(501, { fehler: 'nicht verbunden' })) as unknown as typeof fetch);
    expect(await c.senden(versand)).toEqual({ status: 'geoeffnet' });
    expect(offen[0]).toMatch(/^mailto:kunde%40beispiel\.de/);
    const { c: c2 } = await angemeldet((async () => {
      throw new TypeError('Failed to fetch');
    }) as unknown as typeof fetch);
    expect((await c2.senden(versand)).status).toBe('geoeffnet');
  });

  test('Anbieterfehler wird ehrlich gemeldet', async () => {
    const { c } = await angemeldet((async () => antwort(502, { status: 'fehler', fehler: 'Resend kaputt' })) as unknown as typeof fetch);
    expect(await c.senden(versand)).toEqual({ status: 'fehler', fehler: 'Resend kaputt' });
  });

  test('ohne Konto: vorheriger Weg (z. B. E-Mail über /api/senden) bleibt', async () => {
    const vorher = { ...LOKALE_CLOUD, senden: vi.fn(async () => ({ status: 'gesendet' as const, id: 'resend-1' })) };
    const c = erzeugeSupabaseCloud(attrappe().client, KONFIG, { speicher: speicher(), rueckfall: vorher });
    expect(await c.senden(versand)).toEqual({ status: 'gesendet', id: 'resend-1' });
  });

  test('ohne Konto: lokaler Rückfall, kein Server-Aufruf', async () => {
    const f = vi.fn();
    const c = erzeugeSupabaseCloud(attrappe().client, KONFIG, { speicher: speicher(), fetch: f as unknown as typeof fetch });
    expect((await c.senden(versand)).status).toBe('geoeffnet');
    expect(f).not.toHaveBeenCalled();
    expect((await c.einladen('m1', { telefon: '0171' })).status).toBe('fehler');
  });

  test('Einladen: Kanal nicht verbunden → Link per eigener SMS teilen', async () => {
    const { c } = await angemeldet((async () => antwort(200, { status: 'fehler', fehler: 'SMS ist noch nicht verbunden.', link: 'https://app/beitreten/xyz', id: 'xyz' })) as unknown as typeof fetch);
    expect(await c.einladen('m2', { telefon: '0171 1234567' })).toEqual({ status: 'geoeffnet', id: 'xyz' });
    expect(decodeURIComponent(offen[0])).toContain('https://app/beitreten/xyz');
    expect(offen[0]).toMatch(/^sms:0171 1234567/);
  });

  test('öffentlich lesen ohne Anmeldung (Kunde)', async () => {
    const f = vi.fn(async (url: string) => (url.includes('token=gut') ? antwort(200, { kunde: { name: 'Meier' } }) : antwort(404, { fehler: 'weg' })));
    const c = erzeugeSupabaseCloud(attrappe().client, KONFIG, { speicher: speicher(), fetch: f as unknown as typeof fetch });
    expect(await c.oeffentlichLesen('portal', 'gut')).toEqual({ kunde: { name: 'Meier' } });
    expect(await c.oeffentlichLesen('buchung', 'schlecht')).toBeUndefined();
    expect(f.mock.calls[0][0]).toBe('/api/cloud/oeffentlich?art=portal&token=gut');
  });

  test('Dateien landen privat im Ordner des Betriebs, Link kommt signiert vom Server', async () => {
    const f = vi.fn(async (_u: string, init: RequestInit) => antwort(200, { url: `https://app/api/cloud/datei?p=${encodeURIComponent(JSON.parse(init.body as string).pfad)}&s=sig` }));
    const { c, a } = await angemeldet(f as unknown as typeof fetch);
    const url = await c.dateiAblegen(new Blob(['x'], { type: 'image/jpeg' }), 'Foto Bäder (1).jpg');
    expect(a.hochgeladen[0].pfad).toMatch(/^b1\/[\w-]+-Foto-Bader-1-\.jpg$/);
    expect(f.mock.calls[0][0]).toBe('/api/cloud/datei');
    expect(url).toBe(`https://app/api/cloud/datei?p=${encodeURIComponent(a.hochgeladen[0].pfad)}&s=sig`);
  });

  test('Datei-Link nicht erreichbar → Datei bleibt auf dem Gerät', async () => {
    const { c } = await angemeldet((async () => antwort(501, {})) as unknown as typeof fetch);
    expect(await c.dateiAblegen(new Blob(['x'], { type: 'text/plain' }), 'a.txt')).toMatch(/^data:text\/plain/);
  });

  test('angemeldet: Einladung in einen anderen Betrieb annehmen', async () => {
    eingerichtet();
    const mitglieder = [{ nutzer_id: 'u1', betrieb_id: 'b1', rolle: 'chef' }];
    const a = attrappe({ mitglieder }, { einladung_annehmen: () => ({ data: [{ betrieb_id: 'b2', mitarbeiter_id: 'm9', rolle: 'buero' }] }) });
    const sp = speicher();
    sp.setItem('macher-os:daten-betrieb', 'b1');
    const s = syncAttrappe();
    const c = erzeugeSupabaseCloud(a.client, KONFIG, { speicher: sp, syncStarten: s.starten });
    await c.codeBestaetigen('chef@muster.de', '111111');
    expect(c.konto()?.betriebId).toBe('b1');
    expect(await c.einladungAnnehmen('tok')).toEqual({ ok: true });
    expect(c.konto()?.betriebId).toBe('b2');
    expect(kontoZustand().konto?.rolle).toBe('buero');
    expect(db.betrieb.get('betrieb')).toBeUndefined(); // Gerät hat die Daten von b2 übernommen (vorher gesichert)
  });
});

describe('Messung an den Server', () => {
  test('Messpunkte gebündelt senden; ohne Server (501) wird die Messung abgeschaltet', async () => {
    vi.useFakeTimers();
    const f = vi.fn(async () => antwort(204));
    const c: SupabaseCloud = erzeugeSupabaseCloud(attrappe().client, KONFIG, { speicher: speicher(), fetch: f as unknown as typeof fetch, syncStarten: syncAttrappe().starten });
    await c.starten();
    messen('setup.gestartet', { schritt: 1 });
    messen('setup.fertig');
    await vi.advanceTimersByTimeAsync(5000);
    const messAufrufe = f.mock.calls.filter((x) => String((x as unknown[])[0]).endsWith('/api/cloud/messen'));
    expect(messAufrufe).toHaveLength(1);
    const body = JSON.parse(((messAufrufe[0] as unknown[])[1] as RequestInit).body as string);
    expect(body.punkte.map((p: { ereignis: string }) => p.ereignis)).toEqual(expect.arrayContaining(['setup.gestartet', 'setup.fertig']));
    expect(body.installation).toMatch(/^[\w-]{8,}$/);

    f.mockImplementation(async () => antwort(501, { fehler: 'nicht verbunden' }));
    messen('erstwert.gewaehlt');
    await vi.advanceTimersByTimeAsync(5000);
    const vorher = f.mock.calls.length;
    messen('erstwert.gewaehlt');
    await vi.advanceTimersByTimeAsync(60_000);
    expect(f.mock.calls.length).toBe(vorher);
  });
});
