/**
 * GET /api/cron/taeglich – Server-Takt, einmal täglich (siehe vercel.json).
 * Grundgerüst: jede Aufgabe ist ein Eintrag in AUFGABEN; ein Fehler in einer Aufgabe stoppt die anderen nicht.
 * Fachliche Takte (Tagesbrief, Erinnerungen) liegen in ihren Paketen (z. B. src/app/api/takte/cron).
 */
import { json, nichtVerbunden, supabaseKonfig } from '@/server/cloud/lib';
import { AUFGABEN, cronErlaubt } from '@/server/cloud/cron';

export async function GET(req: Request): Promise<Response> {
  const verboten = cronErlaubt(req);
  if (verboten) return verboten;
  const k = supabaseKonfig();
  if (!k) return nichtVerbunden();
  const jetzt = new Date();
  const ergebnis: Record<string, string> = {};
  for (const a of AUFGABEN) {
    try {
      ergebnis[a.id] = await a.laufen(k, jetzt);
    } catch (e) {
      console.error(`Cron-Aufgabe ${a.id} fehlgeschlagen`, e);
      ergebnis[a.id] = `fehler: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
  return json(200, { zeit: jetzt.toISOString(), ergebnis });
}
