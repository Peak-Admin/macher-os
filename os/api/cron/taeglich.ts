/**
 * GET /api/cron/taeglich – Server-Takt, einmal täglich (siehe vercel.json).
 * Grundgerüst: jede Aufgabe ist ein Eintrag in AUFGABEN; ein Fehler in einer Aufgabe stoppt die anderen nicht.
 * Fachliche Takte (Tagesbrief, Erinnerungen) liegen in ihren Paketen (z. B. os/api/takte/cron.ts).
 */
import { json, nichtVerbunden, rest, supabaseKonfig, type SupabaseKonfig } from '../cloud/_lib.js';
import { cronErlaubt } from './_cron.js';

export interface CronAufgabe {
  id: string;
  beschreibung: string;
  laufen(k: SupabaseKonfig, jetzt: Date): Promise<string>;
}

const tageZurueck = (jetzt: Date, tage: number) => new Date(jetzt.getTime() - tage * 86_400_000).toISOString();

export const AUFGABEN: CronAufgabe[] = [
  {
    id: 'einladungen-aufraeumen',
    beschreibung: 'Abgelaufene, nicht angenommene Einladungen nach 30 Tagen entfernen',
    async laufen(k, jetzt) {
      await rest(k, `einladungen?angenommen_am=is.null&gueltig_bis=lt.${tageZurueck(jetzt, 30)}`, { method: 'DELETE', prefer: 'return=minimal' });
      return 'erledigt';
    },
  },
  {
    id: 'links-aufraeumen',
    beschreibung: 'Öffentliche Links 90 Tage nach Ablauf entfernen',
    async laufen(k, jetzt) {
      await rest(k, `oeffentliche_links?gueltig_bis=lt.${tageZurueck(jetzt, 90)}`, { method: 'DELETE', prefer: 'return=minimal' });
      return 'erledigt';
    },
  },
  {
    id: 'messpunkte-aufraeumen',
    beschreibung: 'Messpunkte nach 13 Monaten löschen (Datensparsamkeit)',
    async laufen(k, jetzt) {
      await rest(k, `messpunkte?zeit=lt.${tageZurueck(jetzt, 396)}`, { method: 'DELETE', prefer: 'return=minimal' });
      return 'erledigt';
    },
  },
];

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
