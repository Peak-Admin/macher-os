/** Signaturprüfung nach „Standard Webhooks“ (Supabase Auth Hooks). */
import { createHmac, timingSafeEqual } from 'node:crypto';

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
