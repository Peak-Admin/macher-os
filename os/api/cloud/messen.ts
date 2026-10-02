/**
 * POST /api/cloud/messen – datensparsame Messpunkte (keine Cookies, keine Inhalte).
 * Body: { punkte: { ereignis, zeit, daten? }[], installation? }. Mit Anmeldung wird der Betrieb zugeordnet.
 * `installation` ist eine zufällige Kennung je Browser (kein Personenbezug), damit Phasen-Trichter zählbar sind.
 */
import { body, json, mitgliedschaft, nichtVerbunden, nutzerAus, rest, supabaseKonfig } from './_lib.js';

interface Punkt {
  ereignis?: unknown;
  zeit?: unknown;
  daten?: unknown;
}

export function bereinigen(p: Punkt, installation?: string): { ereignis: string; zeit: string; daten: Record<string, string | number | boolean> } | undefined {
  if (typeof p.ereignis !== 'string' || !/^[a-z0-9_.-]{1,80}$/i.test(p.ereignis)) return undefined;
  const zeit = typeof p.zeit === 'string' && !Number.isNaN(Date.parse(p.zeit)) ? new Date(p.zeit).toISOString() : new Date().toISOString();
  const daten: Record<string, string | number | boolean> = {};
  if (p.daten && typeof p.daten === 'object') {
    for (const [f, w] of Object.entries(p.daten as Record<string, unknown>).slice(0, 20)) {
      if (!/^[a-z0-9_]{1,40}$/i.test(f)) continue;
      if (typeof w === 'number' || typeof w === 'boolean') daten[f] = w;
      else if (typeof w === 'string') daten[f] = w.slice(0, 80);
    }
  }
  if (installation && /^[a-z0-9-]{8,64}$/i.test(installation)) daten.installation = installation;
  return { ereignis: p.ereignis, zeit, daten };
}

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
