/**
 * POST /api/cloud/messen – datensparsame Messpunkte (keine Cookies, keine Inhalte).
 * Body: { punkte: { ereignis, zeit, daten? }[], installation? }. Mit Anmeldung wird der Betrieb zugeordnet.
 * `installation` ist eine zufällige Kennung je Browser (kein Personenbezug), damit Phasen-Trichter zählbar sind.
 */
import { bereinigen, type Punkt } from '@/server/cloud/messung';
import { body, json, mitgliedschaft, nichtVerbunden, nutzerAus, rest, supabaseKonfig } from '@/server/cloud/lib';

export async function POST(req: Request): Promise<Response> {
  const k = supabaseKonfig();
  if (!k) return nichtVerbunden();
  const b = await body<{ punkte?: Punkt[]; installation?: string }>(req);
  const punkte = (Array.isArray(b?.punkte) ? b.punkte : []).slice(0, 100).map((p) => bereinigen(p, b?.installation)).filter((p) => !!p);
  if (!punkte.length) return json(204, null);
  let betriebId: string | null = null;
  const nutzer = await nutzerAus(req, k).catch(() => undefined);
  if (nutzer) betriebId = (await mitgliedschaft(k, nutzer.id).catch(() => undefined))?.betrieb_id ?? null;
  await rest(k, 'messpunkte', { method: 'POST', prefer: 'return=minimal', body: punkte.map((p) => ({ ...p, betrieb_id: betriebId })) });
  return json(204, null);
}
