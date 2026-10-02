/**
 * Web-Push ohne SDK (RFC 8291 „aes128gcm“ + VAPID RFC 8292) – nur `node:crypto` und `fetch`.
 * Schlüssel: `VAPID_PUBLIC_KEY` (65 Byte, base64url) und `VAPID_PRIVATE_KEY` (32 Byte, base64url).
 */
import { createCipheriv, createECDH, createHmac, createPrivateKey, randomBytes, sign } from 'node:crypto';

export interface PushAbo {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

const b64u = (b: Buffer) => b.toString('base64url');
const vonB64u = (s: string) => Buffer.from(s, 'base64url');
const hmac = (schluessel: Buffer, daten: Buffer) => createHmac('sha256', schluessel).update(daten).digest();

/** HKDF mit einem einzigen Block (Länge ≤ 32) */
function hkdf(salt: Buffer, ikm: Buffer, info: Buffer, laenge: number): Buffer {
  return hmac(hmac(salt, ikm), Buffer.concat([info, Buffer.from([1])])).subarray(0, laenge);
}

/** Verschlüsselt die Nutzlast für genau dieses Abo (ein Datensatz, Satzgröße 4096) */
export function verschluesseln(nutzlast: Buffer, abo: PushAbo, zufall: { salt?: Buffer; schluessel?: ReturnType<typeof createECDH> } = {}): Buffer {
  const uaPublic = vonB64u(abo.keys.p256dh);
  const authSecret = vonB64u(abo.keys.auth);
  const ecdh = zufall.schluessel ?? createECDH('prime256v1');
  if (!zufall.schluessel) ecdh.generateKeys();
  const asPublic = ecdh.getPublicKey();
  const geteilt = ecdh.computeSecret(uaPublic);
  const salt = zufall.salt ?? randomBytes(16);
  const ikm = hkdf(authSecret, geteilt, Buffer.concat([Buffer.from('WebPush: info\0'), uaPublic, asPublic]), 32);
  const cek = hkdf(salt, ikm, Buffer.from('Content-Encoding: aes128gcm\0'), 16);
  const nonce = hkdf(salt, ikm, Buffer.from('Content-Encoding: nonce\0'), 12);
  const c = createCipheriv('aes-128-gcm', cek, nonce);
  const inhalt = Buffer.concat([c.update(Buffer.concat([nutzlast, Buffer.from([2])])), c.final(), c.getAuthTag()]);
  const rs = Buffer.alloc(4);
  rs.writeUInt32BE(4096);
  return Buffer.concat([salt, rs, Buffer.from([asPublic.length]), asPublic, inhalt]);
}

/** VAPID-Kopfzeile für den Push-Dienst des Endpunkts */
export function vapidKopf(endpoint: string, oeffentlich: string, privat: string, kontakt: string, jetzt = Date.now()): string {
  const pub = vonB64u(oeffentlich);
  const jwk = { kty: 'EC', crv: 'P-256', d: privat, x: b64u(pub.subarray(1, 33)), y: b64u(pub.subarray(33, 65)) };
  const schluessel = createPrivateKey({ key: jwk, format: 'jwk' });
  const kopf = b64u(Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const inhalt = b64u(Buffer.from(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(jetzt / 1000) + 12 * 3600, sub: kontakt })));
  const signatur = sign('sha256', Buffer.from(`${kopf}.${inhalt}`), { key: schluessel, dsaEncoding: 'ieee-p1363' });
  return `vapid t=${kopf}.${inhalt}.${b64u(signatur)}, k=${oeffentlich}`;
}

export interface PushErgebnis {
  ok: boolean;
  status: number;
  /** Abo existiert nicht mehr (404/410) – kann gelöscht werden */
  abgelaufen: boolean;
}

export async function pushSenden(abo: PushAbo, nutzlast: unknown, vapid: { oeffentlich: string; privat: string; kontakt: string }, ttlSekunden = 6 * 3600): Promise<PushErgebnis> {
  const body = verschluesseln(Buffer.from(JSON.stringify(nutzlast)), abo);
  const antwort = await fetch(abo.endpoint, {
    method: 'POST',
    headers: {
      Authorization: vapidKopf(abo.endpoint, vapid.oeffentlich, vapid.privat, vapid.kontakt),
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: String(ttlSekunden),
      Urgency: 'normal',
    },
    body: new Uint8Array(body),
  });
  return { ok: antwort.ok, status: antwort.status, abgelaufen: antwort.status === 404 || antwort.status === 410 };
}
