// @vitest-environment node
import { afterEach, describe, expect, test, vi } from 'vitest';
import { hmacSha256Hex } from '@/os/server/signatur';
import { POST as aktionRoute } from '@/app/api/v1/actions/[aktion]/route';
import { GET as katalogRoute } from '@/app/api/v1/actions/route';
import { aktionsKatalog, type ObjektZeile } from './aktionen';
import { bearbeite, sha256Hex, type Anfrage, type Aufruf, type PartnerSpeicher, type Zugang } from './dienst';
import { nachVersuch, zustellen, zustellungBauen, type Auslieferung } from './webhook';

const SCHLUESSEL = 'hos_test_0123456789abcdef';
const BETRIEB = '11111111-1111-1111-1111-111111111111';
const JETZT = new Date('2026-10-03T10:00:00.000Z');

const ma = (id: string, rolle: string, extra: Record<string, unknown> = {}) => ({
  sammlung: 'mitarbeiter',
  id,
  daten: { id, vorname: id === 'm_chef' ? 'Petra' : 'Jonas', nachname: 'Weber', rolle, aktiv: true, ...extra },
});
const kunde = (id: string, name: string, extra: Record<string, unknown> = {}) => ({ sammlung: 'kunden', id, daten: { id, name, art: 'privat', ansprechpartner: [], ...extra } });

/** Speicher im Arbeitsspeicher – verhält sich wie die Supabase-Tabellen */
async function speicher(opts: { zugang?: Partial<Zugang>; objekte?: ObjektZeile[] } = {}) {
  const zugang: Zugang = {
    id: 'zug1',
    betrieb_id: BETRIEB,
    partner: 'heylotte',
    name: 'HeyLotte',
    partner_workspace_id: 'lotte_workspace_673',
    webhook_url: 'https://api.heylotte.ai/hooks/handwerk',
    webhook_geheimnis: 'whsec_test',
    ereignisse: ['*'],
    widerrufen_am: null,
    ...opts.zugang,
  };
  const hash = await sha256Hex(SCHLUESSEL);
  const st = {
    objekte: [
      ma('m_chef', 'chef'),
      ma('m_monteur', 'monteur'),
      ma('m_alt', 'monteur', { aktiv: false }),
      kunde('k1', 'Familie Müller', { nummer: 'K-1001', telefon: '0561 123456', adresse: { strasse: 'Hauptstr. 1', plz: '34117', ort: 'Kassel' } }),
      kunde('k2', 'Bäckerei Schmidt GmbH', { nummer: 'K-1002', art: 'firma', geloeschtAm: '2026-09-01T00:00:00.000Z' }),
      ...(opts.objekte ?? []),
    ] as ObjektZeile[],
    aufrufe: new Map<string, Aufruf>(),
    auslieferungen: [] as Auslieferung[],
    genutzt: [] as string[],
  };
  const zuordnung = new Map([
    ['lotte_user_chef', 'm_chef'],
    ['lotte_user_monteur', 'm_monteur'],
    ['lotte_user_alt', 'm_alt'],
  ]);
  const s: PartnerSpeicher = {
    zugangNachHash: async (h) => (h === hash ? zugang : undefined),
    zugangGenutzt: async (_id, zeit) => void st.genutzt.push(zeit),
    nutzerZuordnung: async (_z, n) => zuordnung.get(n),
    objekte: async (_b, sammlungen) => st.objekte.filter((o) => sammlungen.includes(o.sammlung)),
    aufrufVormerken: async (a) => {
      const frueher = [...st.aufrufe.values()].find((x) => x.zugang_id === a.zugang_id && x.idempotenz_schluessel === a.idempotenz_schluessel);
      if (frueher) return frueher;
      st.aufrufe.set(a.id, a);
      return 'neu';
    },
    aufrufSchreiben: async (a) => void st.aufrufe.set(a.id, a),
    objekteSchreiben: async (_b, zeilen) => {
      for (const z of zeilen) st.objekte = [...st.objekte.filter((o) => !(o.sammlung === z.sammlung && o.id === z.id)), z];
    },
    auslieferungenAnlegen: async (a) => void st.auslieferungen.push(...a),
  };
  let n = 0;
  const rufe = (aktion: string, body: unknown, extra: Partial<Anfrage> = {}) =>
    bearbeite({ aktion, autorisierung: `Bearer ${SCHLUESSEL}`, idempotenz: null, body, ...extra }, s, { jetzt: JETZT, neueId: (p) => `${p ? `${p}_` : ''}id${++n}` });
  return { s, st, zugang, rufe };
}

describe('Action API v1 – Zugang und Identität', () => {
  test('ohne, mit falschem oder widerrufenem Schlüssel → 401, nichts protokolliert', async () => {
    const { st, rufe } = await speicher();
    expect((await rufe('find-customer', { user_id: 'lotte_user_chef', query: 'Müller' }, { autorisierung: null })).status).toBe(401);
    expect((await rufe('find-customer', { user_id: 'lotte_user_chef', query: 'Müller' }, { autorisierung: 'Bearer hos_falsch' })).status).toBe(401);
    expect((await rufe('find-customer', { user_id: 'lotte_user_chef', query: 'Müller' }, { autorisierung: 'Bearer sk_anderes' })).status).toBe(401);
    expect(st.aufrufe.size).toBe(0);
    const w = await speicher({ zugang: { widerrufen_am: '2026-10-01T00:00:00.000Z' } });
    expect((await w.rufe('find-customer', { user_id: 'lotte_user_chef', query: 'Müller' })).status).toBe(401);
  });

  test('unbekannte Aktion, fremde Organisation, unbekannter oder inaktiver Nutzer → abgelehnt und protokolliert', async () => {
    const { st, rufe } = await speicher();
    const r404 = await rufe('delete-everything', { user_id: 'lotte_user_chef' });
    expect(r404.status).toBe(404);
    expect(r404.body).toMatchObject({ status: 'error', error: { code: 'unknown_action' } });
    expect((await rufe('find-customer', { user_id: 'lotte_user_chef', organization_id: 'org_fremd', query: 'Müller' })).body).toMatchObject({ error: { code: 'wrong_organization' } });
    expect((await rufe('find-customer', { user_id: 'lotte_user_chef', organization_id: 'lotte_workspace_673', query: 'Müller' })).status).toBe(200);
    expect((await rufe('find-customer', { user_id: 'lotte_user_chef', organization_id: BETRIEB, query: 'Müller' })).status).toBe(200);
    expect((await rufe('find-customer', { query: 'Müller' })).body).toMatchObject({ error: { code: 'user_required', field: 'user_id' } });
    expect((await rufe('find-customer', { user_id: 'lotte_user_x', query: 'Müller' })).body).toMatchObject({ error: { code: 'unknown_user' } });
    expect((await rufe('find-customer', { user_id: 'lotte_user_alt', query: 'Müller' })).body).toMatchObject({ error: { code: 'inactive_user' } });
    const protokoll = [...st.aufrufe.values()];
    expect(protokoll).toHaveLength(7);
    expect(protokoll.every((a) => a.betrieb_id === BETRIEB && a.zugang_id === 'zug1' && a.version === 'v1')).toBe(true);
    expect(protokoll.map((a) => a.status)).toEqual([404, 403, 200, 200, 400, 403, 403]);
  });

  test('Rechte kommen aus der Rollen-Matrix des Betriebs (Einstellung rollen.rechte)', async () => {
    const { rufe } = await speicher({
      objekte: [{ sammlung: 'einstellungen', id: 'rollen.rechte', daten: { id: 'rollen.rechte', wert: { chef: ['lesen', 'schreiben'], monteur: ['lesen'] } } }],
    });
    const r = await rufe('create-customer', { user_id: 'lotte_user_monteur', name: 'Neu Kunde' });
    expect(r.status).toBe(403);
    expect(r.body).toMatchObject({ error: { code: 'forbidden', missing_permissions: ['schreiben'], message: 'Dafür fehlt das Recht „Bearbeiten“.' } });
    expect((await rufe('find-customer', { user_id: 'lotte_user_monteur', query: 'Müller' })).status).toBe(200);
  });
});

describe('Action API v1 – Aktionen', () => {
  test('find-customer findet ohne Umlaute, per Telefon und Nummer; Papierkorb bleibt draußen', async () => {
    const { rufe } = await speicher();
    const r = await rufe('find-customer', { user_id: 'lotte_user_monteur', query: 'Mueller' });
    expect(r.body).toMatchObject({ status: 'ok', total: 1, customers: [{ customer_id: 'k1', name: 'Familie Müller', number: 'K-1001', city: 'Kassel' }] });
    expect((await rufe('find-customer', { user_id: 'lotte_user_monteur', query: '+49 561 123456' })).body).toMatchObject({ customers: [{ customer_id: 'k1' }] });
    expect((await rufe('find-customer', { user_id: 'lotte_user_monteur', query: 'K-1001' })).body).toMatchObject({ customers: [{ customer_id: 'k1' }] });
    expect((await rufe('find-customer', { user_id: 'lotte_user_monteur', query: 'Schmidt' })).body).toMatchObject({ total: 0 });
    expect((await rufe('find-customer', { user_id: 'lotte_user_monteur', query: 'x' })).body).toMatchObject({ error: { code: 'invalid_input', field: 'query' } });
  });

  test('create-customer legt den Kunden mit Verlauf an und meldet customer.created an HeyLotte', async () => {
    const { st, rufe } = await speicher();
    const r = await rufe('create-customer', { user_id: 'lotte_user_monteur', organization_id: BETRIEB, source: 'heylotte', name: 'Elektro Wagner GmbH', phone: '0561 999888', address: { street: 'Ring 3', zip: '34119', city: 'Kassel' } });
    expect(r.status).toBe(201);
    // Nummer zählt den Kunden im Papierkorb mit (K-1002) → K-1003
    expect(r.body).toMatchObject({ status: 'created', customer_id: 'id2', number: 'K-1003', requires_confirmation: false });
    const k = st.objekte.find((o) => o.sammlung === 'kunden' && o.id === 'id2')!;
    expect(k.daten).toMatchObject({ name: 'Elektro Wagner GmbH', art: 'firma', telefon: '0561 999888', adresse: { strasse: 'Ring 3', plz: '34119', ort: 'Kassel' }, erstelltVon: 'm_monteur' });
    expect(k.daten).not.toHaveProperty('email');
    const v = st.objekte.find((o) => o.sammlung === 'ereignisse')!;
    expect(v.daten).toMatchObject({ typ: 'kunden.created', bezug: { typ: 'kunden', id: 'id2' }, quelle: 'ai', akteurId: 'heylotte', vonMitarbeiterId: 'm_monteur', aenderung: 'created', text: 'Kunde angelegt – über HeyLotte für Jonas Weber' });
    expect(st.auslieferungen).toHaveLength(1);
    expect(st.auslieferungen[0]).toMatchObject({
      typ: 'customer.created',
      status: 'wartend',
      nutzlast: { event: 'customer.created', organization_id: BETRIEB, workspace_id: 'lotte_workspace_673', user_id: 'lotte_user_monteur', object: { type: 'customer', id: 'id2' }, data: { customer_id: 'id2', number: 'K-1003' } },
    });
    expect(r.auslieferungen).toEqual(st.auslieferungen);
    expect([...st.aufrufe.values()].at(-1)).toMatchObject({ status: 201, mitarbeiter_id: 'm_monteur', partner_nutzer_id: 'lotte_user_monteur', bezug: { typ: 'kunden', id: 'id2' } });
    expect(st.genutzt).toEqual([JETZT.toISOString()]);
  });

  test('create-customer warnt vor Dubletten; allow_duplicate legt trotzdem an', async () => {
    const { st, rufe } = await speicher();
    const r = await rufe('create-customer', { user_id: 'lotte_user_chef', name: 'Fam. Mueller', phone: '0561/123456' });
    expect(r.status).toBe(409);
    expect(r.body).toMatchObject({ status: 'possible_duplicate', requires_confirmation: true, candidates: [{ customer_id: 'k1' }] });
    expect(st.objekte.filter((o) => o.sammlung === 'kunden')).toHaveLength(2);
    const ok = await rufe('create-customer', { user_id: 'lotte_user_chef', name: 'Fam. Mueller', phone: '0561/123456', allow_duplicate: true });
    expect(ok.status).toBe(201);
  });

  test('Eingabefehler nennen das Feld', async () => {
    const { rufe } = await speicher();
    expect((await rufe('create-customer', { user_id: 'lotte_user_chef', name: 'A' })).body).toMatchObject({ error: { code: 'invalid_input', field: 'name' } });
    expect((await rufe('create-customer', { user_id: 'lotte_user_chef', name: 'Anna Berg', email: 'kein-at' })).body).toMatchObject({ error: { field: 'email' } });
    expect((await rufe('create-customer', { user_id: 'lotte_user_chef', name: 'Anna Berg', address: { street: 'Ring 3' } })).body).toMatchObject({ error: { field: 'address' } });
    expect((await rufe('create-customer', { user_id: 'lotte_user_chef', name: 42 })).body).toMatchObject({ error: { field: 'name' } });
    expect((await rufe('create-task', { user_id: 'lotte_user_chef', title: 'Leiter prüfen', due_date: 'Freitag' })).body).toMatchObject({ error: { field: 'due_date' } });
    expect((await rufe('create-task', { user_id: 'lotte_user_chef', title: 'Leiter prüfen' }, { body: [] })).status).toBe(400);
  });

  test('gleicher Idempotency-Key → dieselbe Antwort, nichts doppelt', async () => {
    const { st, rufe } = await speicher();
    const body = { user_id: 'lotte_user_chef', name: 'Anna Berg' };
    const a = await rufe('create-customer', body, { idempotenz: 'msg-4711' });
    const b = await rufe('create-customer', body, { idempotenz: 'msg-4711' });
    expect(a.status).toBe(201);
    expect(b.status).toBe(201);
    expect(b.wiederholt).toBe(true);
    expect(b.body).toEqual(a.body);
    expect(st.objekte.filter((o) => o.sammlung === 'kunden' && o.daten.name === 'Anna Berg')).toHaveLength(1);
    expect(st.auslieferungen).toHaveLength(1);
    // Schlüssel über den Body und für eine andere Aktion
    expect((await rufe('create-task', { user_id: 'lotte_user_chef', title: 'Rückruf', idempotency_key: 'msg-4711' })).body).toMatchObject({ error: { code: 'idempotency_conflict' } });
  });

  test('ein Fehler beim Schreiben gibt den Idempotency-Key wieder frei', async () => {
    const { s, st, rufe } = await speicher();
    const schreiben = s.objekteSchreiben;
    s.objekteSchreiben = async () => {
      throw new Error('Supabase 503');
    };
    await expect(rufe('create-customer', { user_id: 'lotte_user_chef', name: 'Anna Berg' }, { idempotenz: 'k1' })).rejects.toThrow('Supabase 503');
    expect([...st.aufrufe.values()][0]).toMatchObject({ status: 500, idempotenz_schluessel: null });
    s.objekteSchreiben = schreiben;
    expect((await rufe('create-customer', { user_id: 'lotte_user_chef', name: 'Anna Berg' }, { idempotenz: 'k1' })).status).toBe(201);
  });

  test('create-task: für sich selbst als Standard, prüft Kunde und Kollegen, meldet task.created', async () => {
    const { st, rufe } = await speicher({ zugang: { ereignisse: ['task.*'] } });
    const r = await rufe('create-task', { user_id: 'lotte_user_monteur', title: 'Leiter prüfen', due_date: '2026-10-09', customer_id: 'k1', priority: 'high' });
    expect(r.status).toBe(201);
    const a = st.objekte.find((o) => o.sammlung === 'aufgaben')!;
    expect(a.daten).toMatchObject({ titel: 'Leiter prüfen', faellig: '2026-10-09', zustaendigId: 'm_monteur', bezug: { typ: 'kunden', id: 'k1' }, prioritaet: 'hoch', erledigt: false, quelle: 'partner' });
    expect(st.auslieferungen.map((x) => x.typ)).toEqual(['task.created']);

    const fuer = await rufe('create-task', { user_id: 'lotte_user_chef', title: 'Material holen', assignee_id: 'm_monteur' });
    expect(fuer.status).toBe(201);
    expect(st.objekte.filter((o) => o.sammlung === 'ereignisse').at(-1)!.daten.text).toBe('Aufgabe angelegt (für Jonas Weber) – über HeyLotte von Petra Weber');

    expect((await rufe('create-task', { user_id: 'lotte_user_chef', title: 'X Y', customer_id: 'k2' })).body).toMatchObject({ error: { code: 'not_found', field: 'customer_id' } });
    expect((await rufe('create-task', { user_id: 'lotte_user_chef', title: 'X Y', assignee_id: 'm_alt' })).body).toMatchObject({ error: { code: 'not_found', field: 'assignee_id' } });
  });

  test('ohne Webhook-Adresse oder für nicht abonnierte Ereignisse wird nichts vorgemerkt', async () => {
    const ohne = await speicher({ zugang: { webhook_url: null } });
    await ohne.rufe('create-customer', { user_id: 'lotte_user_chef', name: 'Anna Berg' });
    expect(ohne.st.auslieferungen).toHaveLength(0);
    const http = await speicher({ zugang: { webhook_url: 'http://heylotte.example/hook' } });
    await http.rufe('create-customer', { user_id: 'lotte_user_chef', name: 'Anna Berg' });
    expect(http.st.auslieferungen).toHaveLength(0);
    const nurAufgaben = await speicher({ zugang: { ereignisse: ['task.created'] } });
    await nurAufgaben.rufe('create-customer', { user_id: 'lotte_user_chef', name: 'Anna Berg' });
    expect(nurAufgaben.st.auslieferungen).toHaveLength(0);
  });
});

describe('Ereignisse an HeyLotte', () => {
  test('Signatur über Zeitstempel und Inhalt, prüfbar mit dem Webhook-Geheimnis', async () => {
    const { st, zugang, rufe } = await speicher();
    await rufe('create-customer', { user_id: 'lotte_user_chef', name: 'Anna Berg' });
    const z = await zustellungBauen(st.auslieferungen[0], zugang, JETZT);
    expect(z.url).toBe('https://api.heylotte.ai/hooks/handwerk');
    expect(z.headers['x-handwerk-ereignis']).toBe('customer.created');
    expect(z.headers['x-handwerk-zeit']).toBe(String(JETZT.getTime() / 1000));
    expect(z.headers['x-handwerk-signatur']).toBe(`sha256=${await hmacSha256Hex('whsec_test', `${z.headers['x-handwerk-zeit']}.${z.body}`)}`);
    expect(JSON.parse(z.body)).toMatchObject({ event: 'customer.created', id: st.auslieferungen[0].id });
  });

  test('Fehlversuche warten immer länger, nach dem 6. Versuch aufgegeben; widerrufene Zugänge bekommen nichts', async () => {
    const { st, zugang, rufe } = await speicher();
    await rufe('create-customer', { user_id: 'lotte_user_chef', name: 'Anna Berg' });
    let a = st.auslieferungen[0];
    const wartezeiten: number[] = [];
    for (let i = 0; i < 6; i++) {
      a = nachVersuch(a, { ok: false, code: 500 }, JETZT);
      if (a.naechster_versuch) wartezeiten.push((Date.parse(a.naechster_versuch) - JETZT.getTime()) / 60_000);
    }
    expect(wartezeiten).toEqual([1, 5, 30, 120, 720]);
    expect(a).toMatchObject({ status: 'aufgegeben', versuche: 6, letzter_fehler: 'Antwort 500' });

    const senden = vi.fn(async () => ({ ok: true, code: 204 }));
    const [ok] = await zustellen([st.auslieferungen[0]], new Map([[zugang.id, zugang]]), senden, JETZT);
    expect(ok).toMatchObject({ status: 'zugestellt', versuche: 1, antwort_code: 204 });
    const [weg] = await zustellen([st.auslieferungen[0]], new Map([[zugang.id, { ...zugang, widerrufen_am: JETZT.toISOString() }]]), senden, JETZT);
    expect(weg.status).toBe('aufgegeben');
    expect(senden).toHaveBeenCalledTimes(1);
  });
});

describe('Routen', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('Katalog nennt Aktionen mit Risiko, Rechten und Eingaben', async () => {
    const r = katalogRoute();
    const j = await r.json();
    expect(j.version).toBe('v1');
    expect(j.actions.map((a: { name: string }) => a.name)).toEqual(['find-customer', 'create-customer', 'create-task']);
    expect(aktionsKatalog()[1]).toMatchObject({ path: '/v1/actions/create-customer', id: 'customer.create', risk: 'schreiben', permissions: ['schreiben'], input: { name: { type: 'string', required: true } } });
  });

  test('ohne Supabase → 501 nicht verbunden', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    const r = await aktionRoute(new Request('https://macher-os.de/v1/actions/find-customer', { method: 'POST', body: '{}' }), { params: Promise.resolve({ aktion: 'find-customer' }) });
    expect(r.status).toBe(501);
  });
});
