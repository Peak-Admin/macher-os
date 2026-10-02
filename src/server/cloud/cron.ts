/**
 * Absicherung für Cron-Aufrufe: Vercel schickt `Authorization: Bearer <CRON_SECRET>`, wenn die Variable gesetzt ist.
 * Ohne CRON_SECRET läuft kein Cron (501), damit niemand von außen Aufgaben anstoßen kann.
 * Auch für andere Pakete: `import { cronErlaubt } from '@/server/cloud/cron'`.
 */
import { timingSafeEqual } from 'node:crypto';
import { env, fehler, nichtVerbunden, rest, type SupabaseKonfig } from './lib';

export function cronErlaubt(req: Request): Response | undefined {
  const geheimnis = env('CRON_SECRET');
  if (!geheimnis) return nichtVerbunden();
  const gegeben = Buffer.from(req.headers.get('authorization') ?? '');
  const erwartet = Buffer.from(`Bearer ${geheimnis}`);
  if (gegeben.length !== erwartet.length || !timingSafeEqual(gegeben, erwartet)) return fehler(401, 'nicht erlaubt');
  return undefined;
}

/** Aufgaben des täglichen Server-Takts (`/api/cron/taeglich`) */
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

