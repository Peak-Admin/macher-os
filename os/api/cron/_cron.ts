/**
 * Absicherung für Cron-Aufrufe: Vercel schickt `Authorization: Bearer <CRON_SECRET>`, wenn die Variable gesetzt ist.
 * Ohne CRON_SECRET läuft kein Cron (501), damit niemand von außen Aufgaben anstoßen kann.
 * Auch für andere Pakete: `import { cronErlaubt } from '../cron/_cron.js'`.
 */
import { timingSafeEqual } from 'node:crypto';
import { env, fehler, nichtVerbunden } from '../cloud/_lib.js';

export function cronErlaubt(req: Request): Response | undefined {
  const geheimnis = env('CRON_SECRET');
  if (!geheimnis) return nichtVerbunden();
  const gegeben = Buffer.from(req.headers.get('authorization') ?? '');
  const erwartet = Buffer.from(`Bearer ${geheimnis}`);
  if (gegeben.length !== erwartet.length || !timingSafeEqual(gegeben, erwartet)) return fehler(401, 'nicht erlaubt');
  return undefined;
}
