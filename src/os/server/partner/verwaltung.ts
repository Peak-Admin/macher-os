/**
 * Verwaltung der Partner-Zugänge aus der App (Einstellungen → Schnittstellen → HeyLotte), nur für den Chef.
 * Route: `POST /api/cloud/partner` mit `{ aktion, … }`. Schlüssel und Webhook-Geheimnis verlassen den Server
 * genau einmal – in der Antwort auf `anlegen` bzw. `…_erneuern` – und werden danach nirgends mehr angezeigt.
 */
import { createHash, randomBytes } from 'node:crypto';
import { rest, type SupabaseKonfig } from '@/server/cloud/lib';
import { SCHLUESSEL_PRAEFIX, type Zugang } from './dienst';
import { zielErlaubt, zustellen, type Auslieferung, type Senden } from './webhook';

const q = encodeURIComponent;
const PARTNER = 'heylotte';
const SICHTBAR = 'id,name,partner_workspace_id,schluessel_ende,webhook_url,ereignisse,erstellt_am,zuletzt_genutzt_am,widerrufen_am';
const ZUGANG_FELDER = 'id,betrieb_id,partner,name,partner_workspace_id,webhook_url,webhook_geheimnis,ereignisse,widerrufen_am';
/** Ereignisse, die man abonnieren kann (API-Namen, `*` = alle, `customer.*` = alle zu einem Objekt) */
const EREIGNIS_MUSTER = /^(\*|[a-z_]+\.(\*|[a-z_]+))$/;

export interface VerwaltungsAntwort {
  status: number;
  body: Record<string, unknown>;
}

const ok = (body: Record<string, unknown> = { ok: true }): VerwaltungsAntwort => ({ status: 200, body });
const nein = (status: number, fehler: string): VerwaltungsAntwort => ({ status, body: { fehler } });

export function neuerSchluessel(): { schluessel: string; hash: string; ende: string } {
  const schluessel = `${SCHLUESSEL_PRAEFIX}live_${randomBytes(32).toString('base64url')}`;
  return { schluessel, hash: createHash('sha256').update(schluessel).digest('hex'), ende: schluessel.slice(-4) };
}
export const neuesGeheimnis = () => `whsec_${randomBytes(32).toString('base64url')}`;

const txt = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined);

/** Webhook-Adresse prüfen: leer = keine, sonst nur https */
export function webhookAus(v: unknown): { url: string | null } | { fehler: string } {
  if (v === null || v === undefined || (typeof v === 'string' && !v.trim())) return { url: null };
  if (typeof v !== 'string' || v.length > 500) return { fehler: 'Die Adresse ist zu lang.' };
  const url = v.trim();
  if (!zielErlaubt(url) || !url.startsWith('https://')) return { fehler: 'Die Adresse muss mit https:// beginnen.' };
  return { url };
}

export function workspaceAus(v: unknown): { id: string | null } | { fehler: string } {
  if (v === null || v === undefined || (typeof v === 'string' && !v.trim())) return { id: null };
  if (typeof v !== 'string' || !/^[\w.:-]{1,120}$/.test(v.trim())) return { fehler: 'Die Workspace-ID darf nur Buchstaben, Ziffern, _ . : - enthalten.' };
  return { id: v.trim() };
}

export function ereignisseAus(v: unknown): string[] | { fehler: string } {
  if (!Array.isArray(v) || !v.length || v.length > 50 || !v.every((x) => typeof x === 'string' && EREIGNIS_MUSTER.test(x)))
    return { fehler: 'Wähle mindestens ein Ereignis.' };
  return [...new Set(v as string[])];
}

/** Der Fehler von PostgREST bei doppeltem Workspace (unique partner + partner_workspace_id) */
const istDoppelt = (e: unknown) => e instanceof Error && /Supabase 409|23505|duplicate key/.test(e.message);

export async function verwalte(
  k: SupabaseKonfig,
  betriebId: string,
  b: Record<string, unknown> | undefined,
  opts: { senden?: Senden; jetzt?: Date } = {},
): Promise<VerwaltungsAntwort> {
  const aktion = b?.aktion;
  const zugangId = txt(b?.zugang_id, 64);
  const jetzt = opts.jetzt ?? new Date();

  /** Zugang dieses Betriebs – nie einen fremden */
  const eigener = async (): Promise<Zugang | undefined> => {
    if (!zugangId || !/^[0-9a-f-]{36}$/i.test(zugangId)) return undefined;
    const z = await rest<Zugang[]>(k, `partner_zugaenge?id=eq.${q(zugangId)}&betrieb_id=eq.${q(betriebId)}&select=${ZUGANG_FELDER}&limit=1`);
    return z[0];
  };
  const aendern = (felder: Record<string, unknown>) =>
    rest(k, `partner_zugaenge?id=eq.${q(zugangId!)}&betrieb_id=eq.${q(betriebId)}`, { method: 'PATCH', body: felder, prefer: 'return=minimal' });

  if (aktion === 'stand') {
    const zugaenge = await rest<(Record<string, unknown> & { id: string })[]>(
      k,
      `partner_zugaenge?betrieb_id=eq.${q(betriebId)}&partner=eq.${PARTNER}&select=${SICHTBAR}&order=erstellt_am.desc&limit=10`,
    );
    const ids = zugaenge.map((z) => z.id);
    const [nutzer, offen, aufrufe] = ids.length
      ? await Promise.all([
          rest<{ zugang_id: string; partner_nutzer_id: string; mitarbeiter_id: string }[]>(k, `partner_nutzer?zugang_id=in.(${ids.join(',')})&select=zugang_id,partner_nutzer_id,mitarbeiter_id&order=erstellt_am`),
          rest<{ zugang_id: string; status: string; letzter_fehler: string | null }[]>(
            k,
            `partner_auslieferungen?zugang_id=in.(${ids.join(',')})&status=in.(wartend,fehler,aufgegeben)&select=zugang_id,status,letzter_fehler&order=erstellt_am.desc&limit=500`,
          ),
          rest<{ zeit: string; aktion: string; status: number; mitarbeiter_id: string | null; partner_nutzer_id: string | null; ergebnis: { error?: { code?: string } } | null }[]>(
            k,
            `api_aufrufe?betrieb_id=eq.${q(betriebId)}&select=zeit,aktion,status,mitarbeiter_id,partner_nutzer_id,ergebnis&order=zeit.desc&limit=20`,
          ),
        ])
      : [[], [], []];
    return ok({
      zugaenge: zugaenge.map((z) => {
        const eigene = offen.filter((a) => a.zugang_id === z.id);
        return {
          ...z,
          nutzer: nutzer.filter((n) => n.zugang_id === z.id).map(({ partner_nutzer_id, mitarbeiter_id }) => ({ partner_nutzer_id, mitarbeiter_id })),
          auslieferungen: {
            wartend: eigene.filter((a) => a.status === 'wartend').length,
            fehler: eigene.filter((a) => a.status === 'fehler').length,
            aufgegeben: eigene.filter((a) => a.status === 'aufgegeben').length,
            letzter_fehler: eigene.find((a) => a.letzter_fehler)?.letzter_fehler ?? null,
          },
        };
      }),
      aufrufe: aufrufe.map(({ ergebnis, ...a }) => ({ ...a, code: ergebnis?.error?.code ?? null })),
    });
  }

  if (aktion === 'anlegen') {
    const ws = workspaceAus(b?.workspace_id);
    if ('fehler' in ws) return nein(400, ws.fehler);
    const wh = webhookAus(b?.webhook_url);
    if ('fehler' in wh) return nein(400, wh.fehler);
    const aktive = await rest<{ id: string }[]>(k, `partner_zugaenge?betrieb_id=eq.${q(betriebId)}&partner=eq.${PARTNER}&widerrufen_am=is.null&select=id&limit=1`);
    if (aktive.length) return nein(409, 'HeyLotte ist schon verbunden. Trenne die alte Verbindung zuerst oder erneuere den Schlüssel.');
    const s = neuerSchluessel();
    const geheimnis = wh.url ? neuesGeheimnis() : null;
    try {
      const [z] = await rest<{ id: string }[]>(k, 'partner_zugaenge', {
        method: 'POST',
        prefer: 'return=representation',
        body: [{ betrieb_id: betriebId, partner: PARTNER, name: 'HeyLotte', partner_workspace_id: ws.id, schluessel_hash: s.hash, schluessel_ende: s.ende, webhook_url: wh.url, webhook_geheimnis: geheimnis }],
      });
      return ok({ zugang_id: z.id, schluessel: s.schluessel, webhook_geheimnis: geheimnis });
    } catch (e) {
      if (istDoppelt(e)) return nein(409, 'Diese Workspace-ID ist schon mit einem anderen Betrieb verbunden.');
      throw e;
    }
  }

  if (aktion === 'nutzer_entfernen' || aktion === 'nutzer_zuordnen') {
    const z = await eigener();
    if (!z) return nein(404, 'Diese Verbindung gibt es nicht.');
    const partnerNutzerId = txt(b?.partner_nutzer_id, 200);
    if (!partnerNutzerId) return nein(400, 'Die Lotte-Nutzer-ID fehlt.');
    if (aktion === 'nutzer_entfernen') {
      await rest(k, `partner_nutzer?zugang_id=eq.${q(z.id)}&partner_nutzer_id=eq.${q(partnerNutzerId)}`, { method: 'DELETE', prefer: 'return=minimal' });
      return ok();
    }
    const mitarbeiterId = txt(b?.mitarbeiter_id, 100);
    if (!mitarbeiterId) return nein(400, 'Wähle einen Mitarbeiter.');
    const [m] = await rest<{ daten: { aktiv?: boolean; geloeschtAm?: string } | null }[]>(
      k,
      `objekte?betrieb_id=eq.${q(betriebId)}&sammlung=eq.mitarbeiter&id=eq.${q(mitarbeiterId)}&select=daten&limit=1`,
    );
    if (!m?.daten || m.daten.geloeschtAm || m.daten.aktiv === false) return nein(400, 'Diesen Mitarbeiter gibt es nicht oder er ist nicht aktiv.');
    await rest(k, 'partner_nutzer?on_conflict=zugang_id,partner_nutzer_id', {
      method: 'POST',
      prefer: 'resolution=merge-duplicates,return=minimal',
      body: [{ zugang_id: z.id, partner_nutzer_id: partnerNutzerId, mitarbeiter_id: mitarbeiterId }],
    });
    return ok();
  }

  if (!['aendern', 'schluessel_erneuern', 'geheimnis_erneuern', 'widerrufen', 'test_ereignis'].includes(String(aktion))) return nein(400, 'Unbekannte Aktion.');
  const z = await eigener();
  if (!z) return nein(404, 'Diese Verbindung gibt es nicht.');
  if (z.widerrufen_am) return nein(409, 'Diese Verbindung ist getrennt. Verbinde HeyLotte neu.');

  if (aktion === 'widerrufen') {
    await aendern({ widerrufen_am: jetzt.toISOString() });
    // Wartende Ereignisse gehen an niemanden mehr
    await rest(k, `partner_auslieferungen?zugang_id=eq.${q(z.id)}&status=in.(wartend,fehler)`, {
      method: 'PATCH',
      body: { status: 'aufgegeben', naechster_versuch: null, letzter_fehler: 'Verbindung getrennt' },
      prefer: 'return=minimal',
    });
    return ok();
  }

  if (aktion === 'schluessel_erneuern') {
    // Der alte Schlüssel gilt ab sofort nicht mehr
    const s = neuerSchluessel();
    await aendern({ schluessel_hash: s.hash, schluessel_ende: s.ende });
    return ok({ schluessel: s.schluessel });
  }

  if (aktion === 'geheimnis_erneuern') {
    if (!z.webhook_url) return nein(400, 'Trag zuerst eine Adresse für Benachrichtigungen ein.');
    const geheimnis = neuesGeheimnis();
    await aendern({ webhook_geheimnis: geheimnis });
    return ok({ webhook_geheimnis: geheimnis });
  }

  if (aktion === 'aendern') {
    const felder: Record<string, unknown> = {};
    let geheimnis: string | undefined;
    if (b && 'workspace_id' in b) {
      const ws = workspaceAus(b.workspace_id);
      if ('fehler' in ws) return nein(400, ws.fehler);
      felder.partner_workspace_id = ws.id;
    }
    if (b && 'webhook_url' in b) {
      const wh = webhookAus(b.webhook_url);
      if ('fehler' in wh) return nein(400, wh.fehler);
      felder.webhook_url = wh.url;
      if (!wh.url) felder.webhook_geheimnis = null;
      else if (!z.webhook_geheimnis) felder.webhook_geheimnis = geheimnis = neuesGeheimnis();
    }
    if (b && 'ereignisse' in b) {
      const e = ereignisseAus(b.ereignisse);
      if ('fehler' in e) return nein(400, e.fehler);
      felder.ereignisse = e;
    }
    if (!Object.keys(felder).length) return ok();
    try {
      await aendern(felder);
    } catch (e) {
      if (istDoppelt(e)) return nein(409, 'Diese Workspace-ID ist schon mit einem anderen Betrieb verbunden.');
      throw e;
    }
    return ok(geheimnis ? { ok: true, webhook_geheimnis: geheimnis } : { ok: true });
  }

  // test_ereignis: sofort senden und das Ergebnis zeigen (landet wie jedes Ereignis in der Warteschlange)
  if (!zielErlaubt(z.webhook_url) || !z.webhook_geheimnis) return nein(400, 'Trag zuerst eine Adresse für Benachrichtigungen ein.');
  const id = `evt_${randomBytes(16).toString('hex')}`;
  const a: Auslieferung = {
    id,
    zugang_id: z.id,
    betrieb_id: betriebId,
    typ: 'test.ping',
    nutzlast: { id, event: 'test.ping', created_at: jetzt.toISOString(), organization_id: betriebId, workspace_id: z.partner_workspace_id, source: 'handwerk-os', object: null, data: { message: 'Test aus Handwerk OS' } },
    status: 'wartend',
    versuche: 0,
    naechster_versuch: null,
  };
  const [nach] = await zustellen([a], new Map([[z.id, z]]), opts.senden, jetzt);
  // Ein Test wird nicht wiederholt
  await rest(k, 'partner_auslieferungen', { method: 'POST', body: [{ ...nach, status: nach.status === 'zugestellt' ? 'zugestellt' : 'aufgegeben', naechster_versuch: null }], prefer: 'return=minimal' });
  return nach.status === 'zugestellt' ? ok({ ok: true, code: nach.antwort_code ?? undefined }) : ok({ ok: false, code: nach.antwort_code ?? undefined, fehler: nach.letzter_fehler ?? 'Nicht erreichbar' });
}
