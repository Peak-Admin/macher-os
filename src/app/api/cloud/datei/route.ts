/**
 * POST /api/cloud/datei { pfad } – signierten, dauerhaften Link für eine hochgeladene Datei des eigenen Betriebs.
 * GET  /api/cloud/datei?p=<pfad>&s=<signatur> – prüft die Signatur und leitet auf einen kurzlebigen Speicher-Link um.
 */
import { angemeldetesMitglied, appUrl, body, fehler, json, nichtVerbunden, supabaseKonfig } from '@/server/cloud/lib';
import { dateiSignatur, dateiSignaturPruefen, pfadGueltig } from '@/server/cloud/datei';

export async function POST(req: Request): Promise<Response> {
  const k = supabaseKonfig();
  if (!k) return nichtVerbunden();
  const pfad = (await body<{ pfad?: string }>(req))?.pfad ?? '';
  const wer = await angemeldetesMitglied(req, k);
  if (wer instanceof Response) return wer;
  if (!pfadGueltig(pfad, wer.mitglied.betrieb_id)) return fehler(400, 'Ungültiger Dateipfad.');
  const url = `${appUrl(req)}/api/cloud/datei?p=${encodeURIComponent(pfad)}&s=${dateiSignatur(k, pfad)}`;
  return json(200, { url });
}

export async function GET(req: Request): Promise<Response> {
  const k = supabaseKonfig();
  if (!k) return nichtVerbunden();
  const q = new URL(req.url).searchParams;
  const pfad = q.get('p') ?? '';
  if (!pfadGueltig(pfad) || !dateiSignaturPruefen(k, pfad, q.get('s') ?? '')) return fehler(404, 'Datei nicht gefunden.');
  const r = await fetch(`${k.url}/storage/v1/object/sign/dateien/${pfad}`, {
    method: 'POST',
    headers: { apikey: k.serviceKey, authorization: `Bearer ${k.serviceKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ expiresIn: 3600 }),
  });
  if (!r.ok) return fehler(404, 'Datei nicht gefunden.');
  const { signedURL } = (await r.json()) as { signedURL?: string };
  if (!signedURL) return fehler(404, 'Datei nicht gefunden.');
  return new Response(null, {
    status: 302,
    headers: { location: `${k.url}/storage/v1${signedURL}`, 'cache-control': 'private, max-age=3000' },
  });
}
