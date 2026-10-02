/**
 * POST /api/cloud/auth-sms – „Send SMS Hook“ von Supabase Auth.
 * Supabase ruft diese Funktion, um den 6-stelligen Anmeldecode zu verschicken. So braucht es nur EINEN
 * SMS-Anbieter (den aus SMS_API_KEY) statt eines zweiten direkt in Supabase.
 * Signatur nach „Standard Webhooks“ mit SUPABASE_SMS_HOOK_SECRET (Format `v1,whsec_…`).
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { env, json } from './_lib.js';
import { smsSenden, smsVerbunden } from './_versand.js';

const hookFehler = (status: number, text: string) => json(status, { error: { http_code: status, message: text } });

export function signaturPruefen(geheimnis: string, id: string, zeit: string, rohBody: string, signaturen: string, jetzt = Date.now()): boolean {
  const sekunden = Number(zeit);
  if (!Number.isFinite(sekunden) || Math.abs(jetzt / 1000 - sekunden) > 5 * 60) return false;
  const schluessel = Buffer.from(geheimnis.replace(/^v1,/, '').replace(/^whsec_/, ''), 'base64');
  const erwartet = createHmac('sha256', schluessel).update(`${id}.${zeit}.${rohBody}`).digest();
  return signaturen.split(' ').some((s) => {
    const [version, wert] = s.split(',');
    if (version !== 'v1' || !wert) return false;
    const gegeben = Buffer.from(wert, 'base64');
    return gegeben.length === erwartet.length && timingSafeEqual(gegeben, erwartet);
  });
}

export async function POST(req: Request): Promise<Response> {
  const geheimnis = env('SUPABASE_SMS_HOOK_SECRET');
  if (!geheimnis || !smsVerbunden()) return hookFehler(501, 'nicht verbunden');
  const roh = await req.text();
  const ok = signaturPruefen(
    geheimnis,
    req.headers.get('webhook-id') ?? '',
    req.headers.get('webhook-timestamp') ?? '',
    roh,
    req.headers.get('webhook-signature') ?? '',
  );
  if (!ok) return hookFehler(401, 'Signatur ungültig');
  let daten: { user?: { phone?: string }; sms?: { otp?: string } };
  try {
    daten = JSON.parse(roh);
  } catch {
    return hookFehler(400, 'Ungültige Anfrage');
  }
  const telefon = daten.user?.phone;
  const code = daten.sms?.otp;
  if (!telefon || !code) return hookFehler(400, 'Telefon oder Code fehlt');
  try {
    await smsSenden(telefon, `${code} ist dein Anmeldecode für Macher OS. Gib ihn niemandem weiter.`);
  } catch (e) {
    return hookFehler(502, e instanceof Error ? e.message : 'SMS nicht verschickt');
  }
  return json(200, {});
}
