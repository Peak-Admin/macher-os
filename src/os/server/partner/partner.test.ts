// @vitest-environment node
import { afterEach, describe, expect, test, vi } from 'vitest';
import { hmacSha256Hex } from '@/os/server/signatur';
import { POST as aktionRoute } from '@/app/api/v1/actions/[aktion]/route';
import { GET as katalogRoute } from '@/app/api/v1/actions/route';
import { aktionsKatalog, berlin, berlinZeitpunkt, type ObjektZeile, type VersandAuftrag } from './aktionen';
import { bearbeite, sha256Hex, type Anfrage, type Aufruf, type PartnerSpeicher, type Zugang } from './dienst';
import { tokenAnfrage, tokenFelder } from './oauth';
import { tokenAusstellen, tokenPruefen } from './token';
import { ereignisseAus, webhookAus, workspaceAus } from './verwaltung';
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
async function speicher(opts: { zugang?: Partial<Zugang>; objekte?: ObjektZeile[]; grenze?: number; versand?: 'aus' | 'fehler' } = {}) {
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
    versand: [] as VersandAuftrag[],
  };
  const zuordnung = new Map([
    ['lotte_user_chef', 'm_chef'],
    ['lotte_user_monteur', 'm_monteur'],
    ['lotte_user_alt', 'm_alt'],
  ]);
  const s: PartnerSpeicher = {
    zugangNachHash: async (h) => (h === hash ? zugang : undefined),
    zugangNachId: async (id) => (id === zugang.id ? zugang : undefined),
    aufrufeSeit: async (_z, seit) => [...st.aufrufe.values()].filter((a) => a.zeit >= seit).length,
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
    versenden: async (_b, v) => {
      if (opts.versand === 'aus') return { ok: false, code: 'channel_unavailable', fehler: 'E-Mail ist in Handwerk OS noch nicht eingerichtet.' };
      if (opts.versand === 'fehler') return { ok: false, code: 'delivery_failed', fehler: 'Die Nachricht ging nicht raus: 500' };
      st.versand.push(v);
      return { ok: true, id: `v${st.versand.length}` };
    },
  };
  let n = 0;
  const rufe = (aktion: string, body: unknown, extra: Partial<Anfrage> = {}, jetzt = JETZT) =>
    bearbeite({ aktion, autorisierung: `Bearer ${SCHLUESSEL}`, idempotenz: null, body, ...extra }, s, {
      jetzt,
      neueId: (p) => `${p ? `${p}_` : ''}id${++n}`,
      tokenGeheimnis: 'token-geheim',
      appUrl: 'https://macher-os.de',
      neuesToken: () => `tok${n}`,
      grenzeProMinute: opts.grenze,
    });
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

describe('create-quote', () => {
  const betrieb = (extra: Record<string, unknown> = {}) => ({ sammlung: 'betrieb', id: 'betrieb', daten: { id: 'betrieb', name: 'Weber Elektro', ustSatz: 19, ...extra } });

  test('ohne Auftrag: legt Auftrag und Angebotsentwurf an, Verlauf an beiden, meldet quote.created und job.created', async () => {
    const { st, rufe } = await speicher({
      objekte: [betrieb(), { sammlung: 'angebote', id: 'a_alt', daten: { id: 'a_alt', nummer: 'AN-2026-0007', geloeschtAm: '2026-09-01T00:00:00.000Z' } }],
    });
    const r = await rufe('create-quote', { user_id: 'lotte_user_chef', customer_id: 'k1', title: 'Bad sanieren', amount: 1000 });
    expect(r.status).toBe(201);
    // Nummer zählt das Angebot im Papierkorb mit
    expect(r.body).toMatchObject({ status: 'draft_created', number: 'AN-2026-0008', customer_id: 'k1', net: 1000, tax: 190, tax_rate: 19, total: 1190, currency: 'EUR', valid_until: '2026-11-02', requires_confirmation: true });
    const angebot = st.objekte.find((o) => o.sammlung === 'angebote' && o.id === r.body.quote_id)!;
    expect(angebot.daten).toMatchObject({ status: 'entwurf', kundeId: 'k1', auftragId: r.body.job_id, titel: 'Bad sanieren', positionen: [{ art: 'pauschal', menge: 1, einheit: 'Psch', einzelpreis: 100000 }] });
    const auftrag = st.objekte.find((o) => o.sammlung === 'auftraege')!;
    expect(auftrag.daten).toMatchObject({ phase: 'angebot', art: 'projekt', kundeId: 'k1', verantwortlichId: 'm_chef', nummer: r.body.job_number });
    const verlauf = st.objekte.filter((o) => o.sammlung === 'ereignisse').map((o) => o.daten);
    expect(verlauf).toMatchObject([
      { typ: 'angebote.created', bezug: { typ: 'angebote', id: r.body.quote_id }, quelle: 'ai', vonMitarbeiterId: 'm_chef' },
      { typ: 'auftraege.created', bezug: { typ: 'auftraege', id: r.body.job_id }, text: 'Auftrag angelegt – über HeyLotte für Petra Weber', quelle: 'ai' },
    ]);
    expect(st.auslieferungen.map((a) => a.typ)).toEqual(['quote.created', 'job.created']);
  });

  test('bestehender Auftrag rückt ins Angebot; Brutto wird zu Netto, Positionen werden übernommen', async () => {
    const { st, rufe } = await speicher({
      objekte: [betrieb(), { sammlung: 'auftraege', id: 'auf1', daten: { id: 'auf1', nummer: 'P-2026-001', titel: 'Zähler tauschen', art: 'projekt', phase: 'besichtigung', kundeId: 'k1' } }],
    });
    const brutto = await rufe('create-quote', { user_id: 'lotte_user_chef', customer_id: 'k1', job_id: 'auf1', amount: 1190, amount_is_gross: true });
    expect(brutto.body).toMatchObject({ job_id: 'auf1', net: 1000, total: 1190 });
    expect(st.objekte.find((o) => o.sammlung === 'auftraege')!.daten.phase).toBe('angebot');
    expect(st.objekte.filter((o) => o.sammlung === 'ereignisse').at(-1)!.daten).toMatchObject({ typ: 'auftraege.updated', aenderung: 'updated' });
    const pos = await rufe('create-quote', { user_id: 'lotte_user_chef', customer_id: 'k1', job_id: 'auf1', items: [{ text: 'Arbeitszeit', quantity: 2, unit: 'h', unit_price: 60 }, { text: 'Zähler', quantity: 1, unit_price: 80 }] });
    expect(pos.body).toMatchObject({ number: 'AN-2026-0002', net: 200, total: 238 });
    expect((await rufe('create-quote', { user_id: 'lotte_user_chef', customer_id: 'k1', job_id: 'auf1', amount: 5, items: [{ text: 'X', unit_price: 1 }] })).body).toMatchObject({ error: { field: 'amount' } });
    expect((await rufe('create-quote', { user_id: 'lotte_user_chef', customer_id: 'k2', title: 'X Y', amount: 5 })).body).toMatchObject({ error: { code: 'not_found', field: 'customer_id' } });
  });

  test('Kleinunternehmer ohne Umsatzsteuer; Monteur ohne Recht „Geld“ wird abgelehnt', async () => {
    const { rufe } = await speicher({ objekte: [betrieb({ kleinunternehmer: true })] });
    expect((await rufe('create-quote', { user_id: 'lotte_user_chef', customer_id: 'k1', title: 'Steckdose', amount: 80 })).body).toMatchObject({ net: 80, tax: 0, tax_rate: 0, total: 80 });
    const r = await rufe('create-quote', { user_id: 'lotte_user_monteur', customer_id: 'k1', title: 'Steckdose', amount: 80 });
    expect(r.status).toBe(403);
    expect((r.body.error as { missing_permissions: string[] }).missing_permissions).toContain('geld');
  });
});

describe('Token und Begrenzung', () => {
  test('client_credentials tauscht den Schlüssel gegen ein 15-Minuten-Token, das statt des Schlüssels gilt', async () => {
    const { s, rufe } = await speicher();
    const felder = tokenFelder(`grant_type=client_credentials&client_id=zug1&client_secret=${SCHLUESSEL}`, 'application/x-www-form-urlencoded', null);
    const t = await tokenAnfrage(felder, s, 'token-geheim', JETZT);
    expect(t).toMatchObject({ status: 200, body: { token_type: 'Bearer', expires_in: 900 } });
    const token = t.body.access_token as string;
    expect(token.startsWith('hot_zug1.')).toBe(true);
    expect((await rufe('find-customer', { user_id: 'lotte_user_chef', query: 'Müller' }, { autorisierung: `Bearer ${token}` })).status).toBe(200);
    // abgelaufen, gefälscht, mit anderem Geheimnis
    const spaeter = new Date(JETZT.getTime() + 16 * 60_000);
    expect((await rufe('find-customer', { user_id: 'lotte_user_chef', query: 'Müller' }, { autorisierung: `Bearer ${token}` }, spaeter)).status).toBe(401);
    expect((await rufe('find-customer', { user_id: 'lotte_user_chef', query: 'Müller' }, { autorisierung: `Bearer ${token.slice(0, -2)}00` })).status).toBe(401);
    expect(await tokenPruefen(token, 'anderes', JETZT)).toBeUndefined();
    expect(await tokenPruefen((await tokenAusstellen('zug1', 'token-geheim', JETZT)).token, 'token-geheim', JETZT)).toBe('zug1');
  });

  test('Token-Anfragen im OAuth-Format: Basic und JSON, falsche Angaben → invalid_client', async () => {
    const { s } = await speicher();
    const basic = tokenFelder('grant_type=client_credentials', 'application/x-www-form-urlencoded', `Basic ${btoa(`zug1:${SCHLUESSEL}`)}`);
    expect((await tokenAnfrage(basic, s, 'g', JETZT)).status).toBe(200);
    const json = tokenFelder(JSON.stringify({ grant_type: 'client_credentials', client_id: 'zug1', client_secret: SCHLUESSEL }), 'application/json', null);
    expect((await tokenAnfrage(json, s, 'g', JETZT)).status).toBe(200);
    expect((await tokenAnfrage({ ...json, client_id: 'zug2' }, s, 'g', JETZT)).body).toMatchObject({ error: 'invalid_client' });
    expect((await tokenAnfrage({ ...json, client_secret: 'hos_falsch' }, s, 'g', JETZT)).status).toBe(401);
    expect((await tokenAnfrage({ ...json, grant_type: 'password' }, s, 'g', JETZT)).body).toMatchObject({ error: 'unsupported_grant_type' });
    expect((await tokenAnfrage({}, s, 'g', JETZT)).body).toMatchObject({ error: 'invalid_request' });
  });

  test('mehr als die Grenze je Minute → 429 mit Retry-After, eine Minute später wieder frei', async () => {
    const { st, rufe } = await speicher({ grenze: 2 });
    const b = { user_id: 'lotte_user_chef', query: 'Müller' };
    expect((await rufe('find-customer', b)).status).toBe(200);
    expect((await rufe('find-customer', b)).status).toBe(200);
    const r = await rufe('find-customer', b);
    expect(r).toMatchObject({ status: 429, kopf: { 'retry-after': '60' }, body: { error: { code: 'rate_limited' } } });
    expect(st.aufrufe.size).toBe(2);
    expect((await rufe('find-customer', b, {}, new Date(JETZT.getTime() + 61_000))).status).toBe(200);
  });
});

describe('Verwaltung (Eingaben)', () => {
  test('Webhook nur https, Workspace ohne Sonderzeichen, Ereignisse als API-Namen', () => {
    expect(webhookAus('')).toEqual({ url: null });
    expect(webhookAus('https://api.heylotte.ai/hooks')).toEqual({ url: 'https://api.heylotte.ai/hooks' });
    expect(webhookAus('http://api.heylotte.ai/hooks')).toHaveProperty('fehler');
    expect(webhookAus('http://localhost:3000/x')).toHaveProperty('fehler');
    expect(workspaceAus(' lotte_workspace_673 ')).toEqual({ id: 'lotte_workspace_673' });
    expect(workspaceAus('a b')).toHaveProperty('fehler');
    expect(ereignisseAus(['customer.created', 'task.*', '*', 'task.*'])).toEqual(['customer.created', 'task.*', '*']);
    expect(ereignisseAus([])).toHaveProperty('fehler');
    expect(ereignisseAus(['DROP TABLE'])).toHaveProperty('fehler');
  });
});

describe('send-quote', () => {
  const angebot = (extra: Record<string, unknown> = {}) => ({
    sammlung: 'angebote',
    id: 'an1',
    daten: { id: 'an1', nummer: 'AN-2026-0001', version: 1, auftragId: 'auf1', kundeId: 'k1', titel: 'Bad sanieren', status: 'entwurf', datum: '2026-10-01', gueltigBis: '2026-10-31', positionen: [{ id: 'p1', art: 'pauschal', text: 'Bad', menge: 1, einheit: 'Psch', einzelpreis: 100000 }], ...extra },
  });
  const auftrag = { sammlung: 'auftraege', id: 'auf1', daten: { id: 'auf1', nummer: 'P-2026-001', titel: 'Bad sanieren', art: 'projekt', phase: 'besichtigung', kundeId: 'k1' } };
  const betrieb = { sammlung: 'betrieb', id: 'betrieb', daten: { id: 'betrieb', name: 'Weber Elektro', ustSatz: 19 } };

  test('nur mit Bestätigung; dann SMS mit Link zum Kundenbereich, Angebot versendet, Auftrag im Schritt Angebot', async () => {
    const { st, rufe } = await speicher({ objekte: [angebot(), auftrag, betrieb] });
    const ohne = await rufe('send-quote', { user_id: 'lotte_user_chef', quote_id: 'an1' });
    expect(ohne).toMatchObject({ status: 409, body: { status: 'confirmation_required' } });
    expect(st.versand).toHaveLength(0);

    const r = await rufe('send-quote', { user_id: 'lotte_user_chef', quote_id: 'an1', confirmed: true });
    expect(r.status).toBe(200);
    // Kunde k1 hat nur eine Telefonnummer → SMS
    expect(r.body).toMatchObject({ status: 'sent', channel: 'sms', to: '0561 123456', total: 1190, number: 'AN-2026-0001' });
    expect(st.versand).toHaveLength(1);
    const zugang = st.objekte.find((o) => o.sammlung === 'portalzugaenge')!;
    expect(zugang.daten).toMatchObject({ kundeId: 'k1', gueltigBis: '2027-01-01' });
    expect(st.versand[0]).toMatchObject({ kanal: 'sms', an: '0561 123456', link: `https://macher-os.de/os/k/${zugang.daten.token}?angebot=an1`, bezug: { typ: 'angebote', id: 'an1' } });
    expect(st.versand[0].text).toContain('1.190,00');
    expect(st.objekte.find((o) => o.id === 'an1')!.daten).toMatchObject({ status: 'versendet', versendetAm: JETZT.toISOString(), datum: '2026-10-03' });
    expect(st.objekte.find((o) => o.id === 'auf1')!.daten.phase).toBe('angebot');
    const verlauf = st.objekte.filter((o) => o.sammlung === 'ereignisse').map((o) => o.daten);
    expect(verlauf[0]).toMatchObject({ typ: 'angebote.updated', aenderung: 'updated', text: 'Per SMS an 0561 123456 versendet – über HeyLotte für Petra Weber', daten: { versandId: 'v1' } });
    expect(st.auslieferungen.map((a) => a.typ)).toEqual(['quote.sent']);
  });

  test('vorhandener Kundenbereich-Link wird genutzt; E-Mail an „to“', async () => {
    const { st, rufe } = await speicher({
      objekte: [angebot({ status: 'versendet' }), auftrag, betrieb, { sammlung: 'portalzugaenge', id: 'pz1', daten: { id: 'pz1', kundeId: 'k1', token: 'abc', gueltigBis: '2026-12-31' } }],
    });
    const r = await rufe('send-quote', { user_id: 'lotte_user_chef', quote_id: 'an1', to: 'mueller@example.de', confirmed: true });
    expect(r.body).toMatchObject({ channel: 'email' });
    expect(st.versand[0]).toMatchObject({ kanal: 'email', link: 'https://macher-os.de/os/k/abc?angebot=an1', betreff: 'Angebot AN-2026-0001 – Bad sanieren' });
    expect(st.objekte.filter((o) => o.sammlung === 'portalzugaenge')).toHaveLength(1);
    // Datum eines schon versendeten Angebots bleibt
    expect(st.objekte.find((o) => o.id === 'an1')!.daten.datum).toBe('2026-10-01');
  });

  test('scheitert der Versand, bleibt alles unverändert; ohne Recht „An Kunden senden“ abgelehnt', async () => {
    const aus = await speicher({ objekte: [angebot(), auftrag, betrieb], versand: 'aus' });
    const r = await aus.rufe('send-quote', { user_id: 'lotte_user_chef', quote_id: 'an1', confirmed: true }, { idempotenz: 'x1' });
    expect(r).toMatchObject({ status: 424, body: { error: { code: 'channel_unavailable' } } });
    expect(aus.st.objekte.find((o) => o.id === 'an1')!.daten.status).toBe('entwurf');
    expect(aus.st.objekte.filter((o) => o.sammlung === 'ereignisse' || o.sammlung === 'portalzugaenge')).toHaveLength(0);
    expect([...aus.st.aufrufe.values()].at(-1)).toMatchObject({ status: 424, idempotenz_schluessel: null });
    const fehler = await speicher({ objekte: [angebot(), auftrag, betrieb], versand: 'fehler' });
    expect((await fehler.rufe('send-quote', { user_id: 'lotte_user_chef', quote_id: 'an1', confirmed: true })).status).toBe(502);
    const m = await speicher({ objekte: [angebot(), auftrag, betrieb] });
    expect((await m.rufe('send-quote', { user_id: 'lotte_user_monteur', quote_id: 'an1', confirmed: true })).body).toMatchObject({ error: { code: 'forbidden', missing_permissions: ['veroeffentlichen'] } });
  });

  test('angenommene, ersetzte oder leere Angebote gehen nicht raus', async () => {
    const { rufe } = await speicher({
      objekte: [
        angebot(),
        { sammlung: 'angebote', id: 'an2', daten: { ...angebot().daten, id: 'an2', version: 2 } },
        { sammlung: 'angebote', id: 'an3', daten: { ...angebot().daten, id: 'an3', nummer: 'AN-2026-0003', status: 'angenommen' } },
        { sammlung: 'angebote', id: 'an4', daten: { ...angebot().daten, id: 'an4', nummer: 'AN-2026-0004', positionen: [] } },
        auftrag,
        betrieb,
      ],
    });
    const b = { user_id: 'lotte_user_chef', confirmed: true };
    expect((await rufe('send-quote', { ...b, quote_id: 'an1' })).body).toMatchObject({ error: { message: 'Von Angebot AN-2026-0001 gibt es eine neuere Version.' } });
    expect((await rufe('send-quote', { ...b, quote_id: 'an3' })).body).toMatchObject({ error: { message: 'Dieses Angebot ist schon angenommen.' } });
    expect((await rufe('send-quote', { ...b, quote_id: 'an4' })).body).toMatchObject({ error: { field: 'quote_id' } });
    expect((await rufe('send-quote', { ...b, quote_id: 'an2', to: 'kein kontakt' })).body).toMatchObject({ error: { field: 'to' } });
  });
});

describe('Termine', () => {
  const termin = (id: string, start: string, ende: string, extra: Record<string, unknown> = {}) => ({
    sammlung: 'termine',
    id,
    daten: { id, art: 'einsatz', titel: `Termin ${id}`, start, ende, mitarbeiterIds: ['m_monteur'], status: 'geplant', kundeId: 'k1', ...extra },
  });
  const auftrag = { sammlung: 'auftraege', id: 'auf1', daten: { id: 'auf1', nummer: 'P-2026-001', titel: 'Zähler tauschen', art: 'projekt', phase: 'beauftragt', kundeId: 'k1', ortId: 'o1' } };

  test('deutsche Zeit: Sommer- und Winterzeit', () => {
    expect(berlinZeitpunkt('2026-10-09', '08:00').toISOString()).toBe('2026-10-09T06:00:00.000Z');
    expect(berlinZeitpunkt('2026-11-09', '08:00').toISOString()).toBe('2026-11-09T07:00:00.000Z');
    expect(berlin(new Date('2026-10-25T01:30:00Z'))).toEqual({ datum: '2026-10-25', uhr: '02:30' });
  });

  test('create-appointment trägt ein, meldet Überschneidungen und Abwesenheit; allow_conflict trägt trotzdem ein', async () => {
    const { st, rufe } = await speicher({
      objekte: [
        auftrag,
        termin('t1', '2026-10-09T07:00:00.000Z', '2026-10-09T09:00:00.000Z'),
        { sammlung: 'abwesenheiten', id: 'ab1', daten: { id: 'ab1', mitarbeiterId: 'm_monteur', art: 'urlaub', von: '2026-10-12', bis: '2026-10-16', status: 'genehmigt' } },
      ],
    });
    const b = { user_id: 'lotte_user_chef', job_id: 'auf1', assignee_ids: ['m_monteur'] };
    const frei = await rufe('create-appointment', { ...b, date: '2026-10-09', start_time: '12:00', duration_minutes: 90 });
    expect(frei.status).toBe(201);
    expect(frei.body).toMatchObject({ status: 'created', date: '2026-10-09', start_time: '12:00', end_time: '13:30', title: 'Zähler tauschen', customer_id: 'k1', job_id: 'auf1', conflicts: [] });
    const t = st.objekte.find((o) => o.sammlung === 'termine' && o.id === frei.body.appointment_id)!;
    expect(t.daten).toMatchObject({ start: '2026-10-09T10:00:00.000Z', ende: '2026-10-09T11:30:00.000Z', status: 'geplant', ortId: 'o1', mitarbeiterIds: ['m_monteur'] });
    expect(st.auslieferungen.map((a) => a.typ)).toEqual(['appointment.created', 'job.scheduled']);

    const doppelt = await rufe('create-appointment', { ...b, date: '2026-10-09', start_time: '08:30' });
    expect(doppelt).toMatchObject({ status: 409, body: { status: 'conflict', conflicts: [{ reason: 'appointment', appointment_id: 't1', employee_id: 'm_monteur' }] } });
    const urlaub = await rufe('create-appointment', { ...b, date: '2026-10-13', start_time: '08:00' });
    expect(urlaub.body).toMatchObject({ status: 'conflict', conflicts: [{ reason: 'absence', message: 'Jonas Weber ist abwesend (urlaub).' }] });
    const trotzdem = await rufe('create-appointment', { ...b, date: '2026-10-09', start_time: '08:30', allow_conflict: true });
    expect(trotzdem.status).toBe(201);
    expect(st.objekte.filter((o) => o.sammlung === 'ereignisse').at(-2)!.daten.text).toContain('(trotz Überschneidung)');
  });

  test('create-appointment prüft Eingaben und Rechte (Monteur darf nicht planen)', async () => {
    const { rufe } = await speicher({ objekte: [auftrag] });
    const b = { user_id: 'lotte_user_chef' };
    expect((await rufe('create-appointment', { ...b, date: '2026-10-09' })).body).toMatchObject({ error: { field: 'start_time' } });
    expect((await rufe('create-appointment', { ...b, date: '2026-10-09', start_time: '8 Uhr' })).body).toMatchObject({ error: { field: 'start_time' } });
    expect((await rufe('create-appointment', { ...b, date: '2026-10-01', start_time: '08:00' })).body).toMatchObject({ error: { field: 'date' } });
    expect((await rufe('create-appointment', { ...b, date: '2026-10-09', start_time: '08:00', assignee_ids: ['m_alt'] })).body).toMatchObject({ error: { field: 'assignee_ids' } });
    expect((await rufe('create-appointment', { ...b, date: '2026-10-09', all_day: true, customer_id: 'k1', type: 'besichtigung' })).body).toMatchObject({ status: 'created', all_day: true, title: 'Besichtigung Familie Müller' });
    expect((await rufe('create-appointment', { user_id: 'lotte_user_monteur', date: '2026-10-09', start_time: '08:00' })).body).toMatchObject({ error: { code: 'forbidden', missing_permissions: ['planen'] } });
  });

  test('find-appointments: Monteur sieht ohne Filter nur seine Termine, Chef alle', async () => {
    const { rufe } = await speicher({
      objekte: [
        termin('t1', '2026-10-05T07:00:00.000Z', '2026-10-05T09:00:00.000Z'),
        termin('t2', '2026-10-05T12:00:00.000Z', '2026-10-05T13:00:00.000Z', { mitarbeiterIds: ['m_chef'] }),
        termin('t3', '2026-10-06T07:00:00.000Z', '2026-10-06T09:00:00.000Z', { status: 'abgesagt' }),
        termin('t4', '2026-10-08T07:00:00.000Z', '2026-10-08T09:00:00.000Z'),
      ],
    });
    const m = await rufe('find-appointments', { user_id: 'lotte_user_monteur', date: '2026-10-05', days: 2 });
    expect(m.body).toMatchObject({ total: 2, assignee_id: 'm_monteur', appointments: [{ appointment_id: 't1', start_time: '09:00', end_time: '11:00', customer_name: 'Familie Müller', assignees: [{ employee_id: 'm_monteur', name: 'Jonas Weber' }] }, { appointment_id: 't3', appointment_status: 'abgesagt' }] });
    expect((await rufe('find-appointments', { user_id: 'lotte_user_chef', date: '2026-10-05' })).body).toMatchObject({ total: 2, assignee_id: null });
    expect((await rufe('find-appointments', { user_id: 'lotte_user_chef', date: '2026-10-05', days: 7, assignee_id: 'me' })).body).toMatchObject({ total: 1 });
    expect((await rufe('find-appointments', { user_id: 'lotte_user_chef', days: 40 })).body).toMatchObject({ error: { field: 'days' } });
  });

  test('reschedule-appointment: nur mit Bestätigung, Dauer bleibt, Konflikte werden gemeldet', async () => {
    const { st, rufe } = await speicher({
      objekte: [auftrag, termin('t1', '2026-10-09T07:00:00.000Z', '2026-10-09T09:00:00.000Z', { auftragId: 'auf1' }), termin('t2', '2026-10-12T08:00:00.000Z', '2026-10-12T10:00:00.000Z')],
    });
    const b = { user_id: 'lotte_user_chef', appointment_id: 't1' };
    expect((await rufe('reschedule-appointment', { ...b, date: '2026-10-10' })).status).toBe(409);
    const r = await rufe('reschedule-appointment', { ...b, date: '2026-10-10', start_time: '13:00', confirmed: true });
    expect(r.body).toMatchObject({ status: 'rescheduled', date: '2026-10-10', start_time: '13:00', end_time: '15:00', previous: { date: '2026-10-09', start_time: '09:00' } });
    expect(st.objekte.find((o) => o.id === 't1')!.daten).toMatchObject({ start: '2026-10-10T11:00:00.000Z', ende: '2026-10-10T13:00:00.000Z' });
    expect(st.objekte.filter((o) => o.sammlung === 'ereignisse').map((o) => o.daten.typ)).toEqual(['termine.updated', 'auftraege.updated']);
    expect(st.auslieferungen.map((a) => a.typ)).toEqual(['appointment.rescheduled']);
    expect((await rufe('reschedule-appointment', { ...b, date: '2026-10-12', start_time: '10:00', confirmed: true })).body).toMatchObject({ status: 'conflict' });
  });
});

describe('Rechnungen', () => {
  const betrieb = { sammlung: 'betrieb', id: 'betrieb', daten: { id: 'betrieb', name: 'Weber Elektro', ustSatz: 19, zahlungszielTage: 10 } };
  const rechnung = (id: string, extra: Record<string, unknown> = {}) => ({
    sammlung: 'rechnungen',
    id,
    daten: { id, nummer: `RE-2026-${id}`, art: 'rechnung', kundeId: 'k1', titel: `Rechnung ${id}`, status: 'versendet', datum: '2026-09-01', faelligAm: '2026-09-15', mahnstufe: 0, positionen: [{ id: 'p', art: 'pauschal', text: 'X', menge: 1, einheit: 'Psch', einzelpreis: 100000 }], ...extra },
  });

  test('find-invoices: offene und überfällige mit Zahlungen, Teilzahlung und verrechnetem Abschlag', async () => {
    const { rufe } = await speicher({
      objekte: [
        betrieb,
        rechnung('0001'),
        rechnung('0002', { status: 'teilbezahlt', faelligAm: '2026-10-20' }),
        rechnung('0003', { status: 'bezahlt' }),
        rechnung('0004', { status: 'entwurf', nummer: '' }),
        rechnung('0005', { art: 'abschlag' }),
        rechnung('0006', { art: 'schluss', faelligAm: '2026-10-30', abzugRechnungIds: ['0005'] }),
        { sammlung: 'zahlungen', id: 'z1', daten: { id: 'z1', rechnungId: '0002', betrag: 40000, datum: '2026-09-20', art: 'ueberweisung' } },
        { sammlung: 'zahlungen', id: 'z2', daten: { id: 'z2', rechnungId: '0003', betrag: 119000, datum: '2026-09-20', art: 'ueberweisung' } },
        { sammlung: 'zahlungen', id: 'z3', daten: { id: 'z3', rechnungId: '0005', betrag: 50000, datum: '2026-09-20', art: 'ueberweisung' } },
      ],
    });
    const offen = await rufe('find-invoices', { user_id: 'lotte_user_chef' });
    expect(offen.body).toMatchObject({ total: 3, open_sum: 1190 + 790 + 690, overdue_sum: 1190 });
    const liste = offen.body.invoices as { invoice_id: string; open_amount: number; overdue: boolean; days_overdue: number; total: number }[];
    expect(liste.map((r) => r.invoice_id)).toEqual(['0001', '0002', '0006']);
    expect(liste[0]).toMatchObject({ open_amount: 1190, overdue: true, days_overdue: 18 });
    expect(liste[2]).toMatchObject({ total: 690, open_amount: 690 });
    expect((await rufe('find-invoices', { user_id: 'lotte_user_chef', filter: 'overdue' })).body).toMatchObject({ total: 1 });
    expect((await rufe('find-invoices', { user_id: 'lotte_user_chef', filter: 'drafts' })).body).toMatchObject({ total: 1, invoices: [{ invoice_id: '0004', number: null }] });
    expect((await rufe('find-invoices', { user_id: 'lotte_user_monteur' })).body).toMatchObject({ error: { code: 'forbidden', missing_permissions: ['geld'] } });
  });

  test('create-invoice: Entwurf aus dem angenommenen Angebot, ohne Nummer; zweiter Aufruf liefert denselben Entwurf', async () => {
    const { st, rufe } = await speicher({
      objekte: [
        betrieb,
        { sammlung: 'auftraege', id: 'auf1', daten: { id: 'auf1', nummer: 'P-2026-001', titel: 'Bad sanieren', art: 'projekt', phase: 'erledigt', kundeId: 'k1' } },
        {
          sammlung: 'angebote',
          id: 'an1',
          daten: { id: 'an1', nummer: 'AN-2026-0001', version: 1, auftragId: 'auf1', kundeId: 'k1', titel: 'Bad', status: 'angenommen', datum: '2026-09-01', gueltigBis: '2026-10-01', positionen: [{ id: 'p1', art: 'leistung', text: 'Fliesen', menge: 10, einheit: 'm²', einzelpreis: 5000 }, { id: 'p2', art: 'leistung', text: 'Option', menge: 1, einheit: 'Stk', einzelpreis: 99900, optional: true }] },
        },
      ],
    });
    const r = await rufe('create-invoice', { user_id: 'lotte_user_chef', job_id: 'auf1' });
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({ status: 'draft_created', number: null, net: 500, tax: 95, total: 595, due_date: '2026-10-13', source: 'Positionen aus Angebot AN-2026-0001', requires_confirmation: true });
    const re = st.objekte.find((o) => o.sammlung === 'rechnungen')!;
    expect(re.daten).toMatchObject({ nummer: '', status: 'entwurf', angebotId: 'an1', vonMacher: true, kundeId: 'k1', auftragId: 'auf1' });
    expect((re.daten.positionen as unknown[]).length).toBe(1);
    expect(st.auslieferungen.map((a) => a.typ)).toEqual(['invoice.created']);
    const nochmal = await rufe('create-invoice', { user_id: 'lotte_user_chef', job_id: 'auf1' });
    expect(nochmal.body).toMatchObject({ status: 'existing_draft', invoice_id: re.id });
    expect(st.objekte.filter((o) => o.sammlung === 'rechnungen')).toHaveLength(1);
  });

  test('create-invoice: freie Rechnung mit Betrag; ohne Angebot und Betrag eine klare Rückfrage', async () => {
    const { rufe } = await speicher({ objekte: [betrieb, { sammlung: 'auftraege', id: 'auf2', daten: { id: 'auf2', titel: 'Steckdose', art: 'klein', phase: 'erledigt', kundeId: 'k1' } }] });
    expect((await rufe('create-invoice', { user_id: 'lotte_user_chef', job_id: 'auf2' })).body).toMatchObject({ error: { field: 'amount' } });
    expect((await rufe('create-invoice', { user_id: 'lotte_user_chef', customer_id: 'k1', title: 'Notdienst', amount: 150 })).body).toMatchObject({ status: 'draft_created', net: 150, total: 178.5, job_id: null });
    expect((await rufe('create-invoice', { user_id: 'lotte_user_chef' })).body).toMatchObject({ error: { field: 'job_id' } });
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
    expect(j.actions.map((a: { name: string }) => a.name)).toEqual([
      'find-customer',
      'create-customer',
      'create-task',
      'create-quote',
      'send-quote',
      'find-appointments',
      'create-appointment',
      'reschedule-appointment',
      'find-invoices',
      'create-invoice',
    ]);
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
