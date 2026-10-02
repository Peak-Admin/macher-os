/** Stripe-Webhook-Signatur prüfen (ohne SDK, Web Crypto). */

const TOLERANZ_SEKUNDEN = 300;

function hex(buf: ArrayBuffer) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function gleich(a: string, b: string) {
  if (a.length !== b.length) return false;
  let x = 0;
  for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}

/** Stripe-Signatur prüfen: `t=<zeit>,v1=<hmac>` über `<zeit>.<roher Körper>` mit SHA-256 */
export async function signaturGueltig(roh: string, kopf: string | null, geheimnis: string, jetzt = Math.floor(Date.now() / 1000)): Promise<boolean> {
  if (!kopf) return false;
  const teile = kopf.split(',').map((t) => t.split('=') as [string, string]);
  const zeit = Number(teile.find(([k]) => k === 't')?.[1]);
  const signaturen = teile.filter(([k]) => k === 'v1').map(([, v]) => v);
  if (!zeit || !signaturen.length || Math.abs(jetzt - zeit) > TOLERANZ_SEKUNDEN) return false;
  const schluessel = await crypto.subtle.importKey('raw', new TextEncoder().encode(geheimnis), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const erwartet = hex(await crypto.subtle.sign('HMAC', schluessel, new TextEncoder().encode(`${zeit}.${roh}`)));
  return signaturen.some((s) => gleich(s, erwartet));
}
