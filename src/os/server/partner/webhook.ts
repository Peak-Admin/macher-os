/**
 * Ereignisse an den Partner (HeyLotte): Handwerk OS meldet, *was passiert ist* (`customer.created`).
 *
 * - Jedes Ereignis wird zuerst in `partner_auslieferungen` vorgemerkt (Warteschlange), dann sofort zugestellt.
 *   Scheitert die Zustellung, versucht es der Server später erneut (beim nächsten Aufruf des Partners und im
 *   täglichen Cron), mit wachsenden Wartezeiten wie bei den Webhooks der App.
 * - Signatur: `x-handwerk-signatur: sha256=<HMAC-SHA256(webhook_geheimnis, "<x-handwerk-zeit>.<Inhalt>")>`.
 *   Der Zeitstempel ist mit signiert – so kann der Partner alte, abgefangene Lieferungen verwerfen (z. B. > 5 Minuten).
 */
import { hmacSha256Hex } from '@/os/server/signatur';
import type { PartnerEreignis } from './aktionen';
import type { Zugang } from './dienst';

export interface Auslieferung {
  id: string;
  zugang_id: string;
  betrieb_id: string;
  typ: string;
  nutzlast: Record<string, unknown>;
  status: 'wartend' | 'zugestellt' | 'fehler' | 'aufgegeben';
  versuche: number;
  naechster_versuch: string | null;
  antwort_code?: number | null;
  letzter_fehler?: string | null;
  zugestellt_am?: string | null;
}

/** Wartezeiten nach dem 1.–5. Fehlversuch (wie `WEBHOOK_WARTEZEITEN_MIN` der App); danach aufgegeben */
export const WARTEZEITEN_MIN = [1, 5, 30, 120, 720];

const OBJEKT_TYP: Record<string, string> = { kunden: 'customer', aufgaben: 'task', auftraege: 'job', angebote: 'quote', rechnungen: 'invoice', termine: 'appointment' };

/** Passt ein Ereignis zu den abonnierten Namen? `*` = alle, `customer.*` = alle zu diesem Objekt (wie `ereignisAbonniert` der App) */
export function abonniert(ereignisse: string[], typ: string): boolean {
  return ereignisse.some((x) => x === '*' || x === typ || (x.endsWith('.*') && typ.startsWith(x.slice(0, -1))));
}

/** Nur sichere Ziele: https (lokal auch http://localhost zum Testen) */
export function zielErlaubt(url: string | null): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || (u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1'));
  } catch {
    return false;
  }
}

export function auslieferungenFuer(
  zugang: Zugang,
  ereignisse: PartnerEreignis[],
  k: { zeit: string; neueId: (p?: string) => string; partnerNutzerId: string; requestId: string },
): Auslieferung[] {
  if (!zielErlaubt(zugang.webhook_url) || !zugang.webhook_geheimnis) return [];
  return ereignisse
    .filter((e) => abonniert(zugang.ereignisse, e.typ))
    .map((e) => {
      const id = k.neueId('evt');
      return {
        id,
        zugang_id: zugang.id,
        betrieb_id: zugang.betrieb_id,
        typ: e.typ,
        nutzlast: {
          id,
          event: e.typ,
          created_at: k.zeit,
          organization_id: zugang.betrieb_id,
          workspace_id: zugang.partner_workspace_id,
          // ausgelöst über den Partner, durch diesen Nutzer (Ereignisse aus der App kommen später ohne)
          source: zugang.partner,
          user_id: k.partnerNutzerId,
          request_id: k.requestId,
          object: { type: OBJEKT_TYP[e.objekt.typ] ?? e.objekt.typ, id: e.objekt.id },
          data: e.daten,
        },
        status: 'wartend',
        versuche: 0,
        naechster_versuch: k.zeit,
      };
    });
}

export interface Zustellung {
  url: string;
  headers: Record<string, string>;
  body: string;
}

/** Fertige Anfrage für eine Auslieferung (rein, für Tests) */
export async function zustellungBauen(a: Auslieferung, zugang: Pick<Zugang, 'webhook_url' | 'webhook_geheimnis'>, jetzt: Date): Promise<Zustellung> {
  const body = JSON.stringify(a.nutzlast);
  const zeit = String(Math.floor(jetzt.getTime() / 1000));
  return {
    url: zugang.webhook_url ?? '',
    body,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'user-agent': 'HandwerkOS-Webhooks/1',
      'x-handwerk-ereignis': a.typ,
      'x-handwerk-id': a.id,
      'x-handwerk-zeit': zeit,
      'x-handwerk-signatur': `sha256=${await hmacSha256Hex(zugang.webhook_geheimnis ?? '', `${zeit}.${body}`)}`,
    },
  };
}

/** Neuer Stand einer Auslieferung nach einem Versuch */
export function nachVersuch(a: Auslieferung, r: { ok: boolean; code?: number; fehler?: string }, jetzt: Date): Auslieferung {
  const versuche = a.versuche + 1;
  if (r.ok) return { ...a, status: 'zugestellt', versuche, antwort_code: r.code ?? null, letzter_fehler: null, zugestellt_am: jetzt.toISOString(), naechster_versuch: null };
  const warten = WARTEZEITEN_MIN[versuche - 1];
  return {
    ...a,
    status: warten === undefined ? 'aufgegeben' : 'fehler',
    versuche,
    antwort_code: r.code ?? null,
    letzter_fehler: (r.fehler ?? (r.code ? `Antwort ${r.code}` : 'Nicht erreichbar')).slice(0, 300),
    naechster_versuch: warten === undefined ? null : new Date(jetzt.getTime() + warten * 60_000).toISOString(),
  };
}

export type Senden = (z: Zustellung) => Promise<{ ok: boolean; code?: number; fehler?: string }>;

/** Standard-Versand: POST mit 5 s Zeitlimit, keine Weiterleitungen (sonst könnte die Signatur woanders landen) */
export const sendenPerFetch: Senden = async (z) => {
  try {
    const r = await fetch(z.url, { method: 'POST', headers: z.headers, body: z.body, redirect: 'manual', signal: AbortSignal.timeout(5000) });
    return { ok: r.status >= 200 && r.status < 300, code: r.status };
  } catch (e) {
    return { ok: false, fehler: e instanceof Error ? e.message : 'Nicht erreichbar' };
  }
};

/** Auslieferungen zustellen und den neuen Stand zurückgeben (Speichern übernimmt der Aufrufer) */
export async function zustellen(liste: Auslieferung[], zugaenge: Map<string, Zugang>, senden: Senden = sendenPerFetch, jetzt = new Date()): Promise<Auslieferung[]> {
  const neu: Auslieferung[] = [];
  for (const a of liste) {
    const z = zugaenge.get(a.zugang_id);
    if (!z || z.widerrufen_am || !zielErlaubt(z.webhook_url) || !z.webhook_geheimnis) {
      neu.push({ ...a, status: 'aufgegeben', letzter_fehler: 'Zugang widerrufen oder ohne Webhook-Adresse', naechster_versuch: null });
      continue;
    }
    neu.push(nachVersuch(a, await senden(await zustellungBauen(a, z, jetzt)), jetzt));
  }
  return neu;
}
