/**
 * POST /v1/oauth/token (auch /api/v1/oauth/token) – kurzlebige Zugriffstoken für Partner (Client Credentials).
 * Ablauf: `src/os/server/partner/oauth.ts`, Doku: `docs/os/PARTNER-API.md`.
 */
import { env, json, nichtVerbunden, supabaseKonfig } from '@/server/cloud/lib';
import { tokenAnfrage, tokenFelder } from '@/os/server/partner/oauth';
import { supabaseSpeicher } from '@/os/server/partner/supabase';
import { tokenGeheimnis } from '@/os/server/partner/token';

export const dynamic = 'force-dynamic';

export async function POST(req: Request): Promise<Response> {
  const k = supabaseKonfig();
  if (!k) return nichtVerbunden();
  try {
    const felder = tokenFelder(await req.text(), req.headers.get('content-type'), req.headers.get('authorization'));
    const a = await tokenAnfrage(felder, supabaseSpeicher(k), await tokenGeheimnis(k.serviceKey, env('PARTNER_TOKEN_GEHEIMNIS')));
    // Token nie zwischenspeichern (RFC 6749 §5.1)
    return json(a.status, a.body, { 'cache-control': 'no-store', pragma: 'no-cache' });
  } catch (e) {
    console.error('OAuth-Token fehlgeschlagen', e);
    return json(500, { error: 'server_error', error_description: 'Das hat gerade nicht geklappt.' });
  }
}
