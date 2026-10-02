/** POST /api/ki/preisliste – Leistungen mit Preis aus Foto/PDF einer Preisliste erkennen. Logik: `src/lib/ki/preisliste.ts`. */
import { POST as preisliste } from '@/lib/ki/preisliste';

export const maxDuration = 60;

export function POST(req: Request): Promise<Response> {
  return preisliste(req);
}
