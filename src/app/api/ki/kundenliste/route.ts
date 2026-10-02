/** POST /api/ki/kundenliste – Kunden aus Foto/PDF einer Liste erkennen. Logik: `src/lib/ki/kundenliste.ts`. */
import { POST as kundenliste } from '@/lib/ki/kundenliste';

export const maxDuration = 60;

export function POST(req: Request): Promise<Response> {
  return kundenliste(req);
}
