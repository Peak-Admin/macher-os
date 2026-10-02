import { createDecipheriv, createECDH, createHmac, createPublicKey, randomBytes, verify } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { vapidKopf, verschluesseln } from './webpush';

const hmac = (k: Buffer, d: Buffer) => createHmac('sha256', k).update(d).digest();
const hkdf = (salt: Buffer, ikm: Buffer, info: Buffer, n: number) => hmac(hmac(salt, ikm), Buffer.concat([info, Buffer.from([1])])).subarray(0, n);

/** Entschlüsseln wie ein Browser (RFC 8291) – nur für den Test */
function entschluesseln(daten: Buffer, ua: ReturnType<typeof createECDH>, auth: Buffer): string {
  const salt = daten.subarray(0, 16);
  const idlen = daten[20];
  const asPublic = daten.subarray(21, 21 + idlen);
  const inhalt = daten.subarray(21 + idlen);
  const geteilt = ua.computeSecret(asPublic);
  const ikm = hkdf(auth, geteilt, Buffer.concat([Buffer.from('WebPush: info\0'), ua.getPublicKey(), asPublic]), 32);
  const cek = hkdf(salt, ikm, Buffer.from('Content-Encoding: aes128gcm\0'), 16);
  const nonce = hkdf(salt, ikm, Buffer.from('Content-Encoding: nonce\0'), 12);
  const d = createDecipheriv('aes-128-gcm', cek, nonce);
  d.setAuthTag(inhalt.subarray(inhalt.length - 16));
  const klar = Buffer.concat([d.update(inhalt.subarray(0, inhalt.length - 16)), d.final()]);
  expect(klar[klar.length - 1]).toBe(2); // Ende des letzten Datensatzes
  return klar.subarray(0, klar.length - 1).toString();
}

describe('Web-Push', () => {
  it('verschlüsselt so, dass der Browser es lesen kann (aes128gcm)', () => {
    const ua = createECDH('prime256v1');
    ua.generateKeys();
    const auth = randomBytes(16);
    const abo = { endpoint: 'https://push.example/abc', keys: { p256dh: ua.getPublicKey().toString('base64url'), auth: auth.toString('base64url') } };
    const nachricht = JSON.stringify({ titel: 'Tagesbrief: Nichts brennt', aktionen: [] });
    expect(entschluesseln(verschluesseln(Buffer.from(nachricht), abo), ua, auth)).toBe(nachricht);
  });

  it('signiert den VAPID-Kopf gültig (ES256) für den Push-Dienst', () => {
    const server = createECDH('prime256v1');
    server.generateKeys();
    const pub = server.getPublicKey().toString('base64url');
    const kopf = vapidKopf('https://fcm.googleapis.com/fcm/send/x', pub, server.getPrivateKey().toString('base64url'), 'mailto:test@example.de', 1_000_000_000_000);
    const [, t, k] = /^vapid t=([^,]+), k=(.+)$/.exec(kopf)!;
    expect(k).toBe(pub);
    const [h, p, s] = t.split('.');
    expect(JSON.parse(Buffer.from(p, 'base64url').toString())).toEqual({ aud: 'https://fcm.googleapis.com', exp: 1_000_000_000 + 12 * 3600, sub: 'mailto:test@example.de' });
    const raw = server.getPublicKey();
    const schluessel = createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: raw.subarray(1, 33).toString('base64url'), y: raw.subarray(33).toString('base64url') }, format: 'jwk' });
    expect(verify('sha256', Buffer.from(`${h}.${p}`), { key: schluessel, dsaEncoding: 'ieee-p1363' }, Buffer.from(s, 'base64url'))).toBe(true);
  });
});
