/**
 * POST /v1/actions/<aktion> (auch /api/v1/actions/<aktion>) – Action API für Partner, zuerst HeyLotte.
 * Kopfzeilen: `Authorization: Bearer hos_…` (Schlüssel je Betrieb) oder `Bearer hot_…` (Token aus /v1/oauth/token),
 * optional `Idempotency-Key`. Höchstens 120 Aufrufe je Minute und Zugang (sonst 429 mit `Retry-After`).
 * Body: `{ user_id, organization_id?, …Eingabe der Aktion }`. Ablauf und Regeln: `src/os/server/partner/dienst.ts`,
 * Doku: `docs/os/PARTNER-API.md`. Ohne Supabase-Schlüssel: 501 { fehler: "nicht verbunden" }.
 */
import { after } from 'next/server';
import { body, env, json, nichtVerbunden, supabaseKonfig } from '@/server/cloud/lib';
import { bearbeite } from '@/os/server/partner/dienst';
import { faelligeZustellen, sofortZustellen, supabaseSpeicher } from '@/os/server/partner/supabase';
import { tokenGeheimnis } from '@/os/server/partner/token';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, ctx: RouteContext<'/api/v1/actions/[aktion]'>): Promise<Response> {
  const k = supabaseKonfig();
  if (!k) return nichtVerbunden();
  const { aktion } = await ctx.params;
  try {
    const a = await bearbeite(
      { aktion, autorisierung: req.headers.get('authorization'), idempotenz: req.headers.get('idempotency-key'), body: await body(req) },
      supabaseSpeicher(k),
      { tokenGeheimnis: await tokenGeheimnis(k.serviceKey, env('PARTNER_TOKEN_GEHEIMNIS')) },
    );
    const zugang = a.zugang;
    if (zugang) {
      // Ereignisse an den Partner erst nach der Antwort – HeyLotte wartet nie auf ihren eigenen Webhook
      after(async () => {
        try {
          await sofortZustellen(k, a.auslieferungen, zugang);
          await faelligeZustellen(k, { zugangId: zugang.id, max: 10 });
        } catch (e) {
          console.error('Partner-Ereignisse: Zustellung fehlgeschlagen', e);
        }
      });
    }
    return json(a.status, a.body, { ...a.kopf, ...(a.wiederholt ? { 'idempotent-replayed': 'true' } : {}) });
  } catch (e) {
    console.error(`Action API ${aktion} fehlgeschlagen`, e);
    return json(500, { status: 'error', error: { code: 'internal', message: 'Das hat gerade nicht geklappt. Bitte gleich noch einmal versuchen.' } });
  }
}
