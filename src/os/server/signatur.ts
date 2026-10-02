/**
 * HMAC-SHA256-Signaturen für Webhooks (eingehend: Bank-Anbieter, ausgehend: Webhook-Abos).
 * Nutzt Web Crypto – läuft gleich in Node, Edge und im Test.
 *
 * Format der Kopfzeile: `sha256=<hex>` (reines Hex wird auch akzeptiert).
 */

const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

export async function hmacSha256Hex(geheimnis: string, inhalt: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey('raw', enc.encode(geheimnis), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await globalThis.crypto.subtle.sign('HMAC', key, enc.encode(inhalt)));
}

/** Kopfzeile für ausgehende Webhooks */
export async function webhookSignatur(geheimnis: string, inhalt: string): Promise<string> {
  return `sha256=${await hmacSha256Hex(geheimnis, inhalt)}`;
}

/** Vergleich in konstanter Zeit (verrät nicht, ab welchem Zeichen es abweicht) */
export function gleich(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

/** Eingehende Signatur prüfen */
export async function signaturPruefen(geheimnis: string, inhalt: string, kopf: string | null | undefined): Promise<boolean> {
  if (!kopf) return false;
  const erhalten = kopf.trim().replace(/^sha256=/i, '').toLowerCase();
  return gleich(erhalten, await hmacSha256Hex(geheimnis, inhalt));
}
