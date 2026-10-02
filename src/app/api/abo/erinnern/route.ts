/**
 * GET /api/abo/erinnern – täglicher Lauf (Vercel Cron, geschützt mit `CRON_SECRET`):
 * schickt Stufe 2 (Tag 5) und Stufe 3 (Tag 10) der Zahlungserinnerung. Stufe 1 kommt direkt vom Webhook,
 * nach 14 Tagen Kulanz gilt der Lesemodus (aus `betriebe.plan` berechnet, kein Schreiben nötig).
 * Zeitplan in `vercel.json` (`crons`).
 */
import { planLesen, tageZwischen } from '@modules/abo/regeln';
import { erinnern } from '../_lib/erinnern';
import { env, fehler, json, nichtVerbunden, sb, stripe, verbunden, type BetriebZeile } from '../_lib/gemeinsam';

export async function GET(req: Request): Promise<Response> {
  if (!verbunden() || !env('CRON_SECRET')) return nichtVerbunden();
  if (req.headers.get('authorization') !== `Bearer ${env('CRON_SECRET')}`) return fehler('Nicht erlaubt.', 401);
  const heute = new Date().toISOString().slice(0, 10);
  const offen = await sb<BetriebZeile[]>('betriebe?plan=like.*:zahlung_offen:*&select=id,plan,stripe_kunde');
  let gesendet = 0;
  for (const b of offen) {
    const p = planLesen(b.plan);
    if (p.status !== 'zahlung_offen' || !p.datum || !b.stripe_kunde) continue;
    const tag = tageZwischen(p.datum, heute);
    const stufe = tag === 5 ? 2 : tag === 10 ? 3 : undefined;
    if (!stufe) continue;
    try {
      const kunde = await stripe<{ email?: string | null }>(`customers/${b.stripe_kunde}`);
      if (await erinnern(kunde.email ?? undefined, stufe, p.datum)) gesendet++;
    } catch (e) {
      console.error('abo/erinnern', b.id, e);
    }
  }
  return json({ ok: true, gesendet });
}
