/** POST /api/ki/briefkopf – Briefkopf aus Foto oder Website erkennen. Logik: `src/lib/ki/briefkopf.ts`. */
import { POST as briefkopf } from '@/lib/ki/briefkopf';

export const maxDuration = 60;

export function POST(req: Request): Promise<Response> {
  return briefkopf(req);
}
