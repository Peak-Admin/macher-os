/**
 * Server-Funktion für den Bank-Webhook: POST /api/eingang/bank?betrieb=<betriebId>
 *
 * Einbinden (Route Handler, eine Datei `src/app/api/eingang/bank/route.ts`):
 * ```ts
 * export { bankEingang as POST } from '@/os/server/bank-eingang';
 * export const dynamic = 'force-dynamic';
 * ```
 * - Ohne `SUPABASE_SERVICE_ROLE_KEY` oder `BANK_WEBHOOK_SECRET` → 501 { fehler: "nicht verbunden" }.
 * - Kopfzeile `x-macher-signatur: sha256=<HMAC-SHA256(BANK_WEBHOOK_SECRET, Inhalt)>` ist Pflicht → sonst 401.
 * - Doppelt gelieferte Umsätze (gleiche Referenz) werden ignoriert.
 */
import { json, lesen, neueId, nichtVerbunden, objekteLesen, objekteSchreiben, verbindung } from './supabase';
import { eingangLesen, umsatzZeilen } from './bank';
import { signaturPruefen } from './signatur';

export async function bankEingang(request: Request): Promise<Response> {
  const v = verbindung();
  const geheim = process.env.BANK_WEBHOOK_SECRET;
  if (!v || !geheim) return nichtVerbunden();

  const inhalt = await request.text();
  const signatur = request.headers.get('x-macher-signatur') ?? request.headers.get('x-signature');
  if (!(await signaturPruefen(geheim, inhalt, signatur))) return json({ fehler: 'Signatur ungültig' }, 401);

  const betriebId = new URL(request.url).searchParams.get('betrieb') ?? '';
  if (!/^[0-9a-zA-Z_-]{8,64}$/.test(betriebId)) return json({ fehler: 'betrieb fehlt' }, 400);

  let body: unknown;
  try {
    body = JSON.parse(inhalt);
  } catch {
    return json({ fehler: 'kein JSON' }, 400);
  }
  const eingang = eingangLesen(body);
  if (!eingang) return json({ fehler: 'keine Umsätze erkannt' }, 400);

  try {
    const betrieb = await lesen<{ id: string }>(v, 'betriebe', `select=id&id=eq.${encodeURIComponent(betriebId)}`);
    if (!betrieb.length) return json({ fehler: 'Betrieb nicht gefunden' }, 404);
    const vorhanden = await objekteLesen<{ referenz?: string }>(v, betriebId, 'bankumsaetze');
    const zeilen = umsatzZeilen(betriebId, eingang.liste, new Set(vorhanden.map((u) => u.referenz ?? '')), neueId);
    await objekteSchreiben(v, zeilen);
    return json({ ok: true, neu: zeilen.length, doppelt: eingang.liste.length - zeilen.length, uebersprungen: eingang.uebersprungen });
  } catch (e) {
    console.error('Bank-Eingang fehlgeschlagen', e);
    return json({ fehler: 'Speichern fehlgeschlagen' }, 500);
  }
}
