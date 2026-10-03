/**
 * GET /v1/actions – Katalog der Action API: welche Aktionen es gibt, Risiko, nötige Rechte, Eingabefelder.
 * Öffentlich lesbar (enthält keine Daten), damit der Partner seine Werkzeuge daraus bauen kann.
 */
import { json } from '@/server/cloud/lib';
import { aktionsKatalog } from '@/os/server/partner/aktionen';
import { API_VERSION } from '@/os/server/partner/dienst';

export const dynamic = 'force-static';

export function GET(): Response {
  return json(200, { version: API_VERSION, actions: aktionsKatalog() });
}
