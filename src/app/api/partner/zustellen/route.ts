/**
 * POST /api/partner/zustellen – fällige Ereignisse an Partner (HeyLotte) zustellen.
 * Angestoßen jede Minute von pg_cron (Migration 20261003180000, Token im Supabase-Vault) oder mit `CRON_SECRET`.
 */
import { cronErlaubt } from '@/server/cloud/cron';
import { fehler, json, nichtVerbunden, rest, supabaseKonfig } from '@/server/cloud/lib';
import { faelligeZustellen } from '@/os/server/partner/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: Request): Promise<Response> {
  const k = supabaseKonfig();
  if (!k) return nichtVerbunden();
  const token = req.headers.get('authorization')?.replace(/^bearer\s+/i, '').trim() ?? '';
  // Erst CRON_SECRET, dann das Token aus dem Vault (die Datenbank prüft es selbst, nur mit Service-Key aufrufbar)
  const erlaubt = !cronErlaubt(req) || (token.length >= 32 && (await rest<boolean>(k, 'rpc/partner_zustell_token_pruefen', { method: 'POST', body: { p_token: token } }).catch(() => false)));
  if (!erlaubt) return fehler(401, 'nicht erlaubt');
  try {
    return json(200, { versucht: await faelligeZustellen(k, { max: 100 }) });
  } catch (e) {
    console.error('Partner-Zustellung fehlgeschlagen', e);
    return fehler(500, 'Zustellung fehlgeschlagen');
  }
}
