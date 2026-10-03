/**
 * POST /api/cloud/partner – Partner-Zugänge verwalten (Einstellungen → Schnittstellen → HeyLotte). Nur der Chef.
 * Body: `{ aktion: 'stand' | 'anlegen' | 'aendern' | 'schluessel_erneuern' | 'geheimnis_erneuern' | 'widerrufen'
 *   | 'nutzer_zuordnen' | 'nutzer_entfernen' | 'test_ereignis', … }`. Ablauf: `src/os/server/partner/verwaltung.ts`.
 */
import { angemeldetesMitglied, body, fehler, json, nichtVerbunden, supabaseKonfig } from '@/server/cloud/lib';
import { verwalte } from '@/os/server/partner/verwaltung';

export const dynamic = 'force-dynamic';

export async function POST(req: Request): Promise<Response> {
  const k = supabaseKonfig();
  if (!k) return nichtVerbunden();
  const wer = await angemeldetesMitglied(req, k, ['chef']);
  if (wer instanceof Response) return wer;
  const b = await body<Record<string, unknown>>(req);
  if (!b || typeof b !== 'object' || Array.isArray(b)) return fehler(400, 'Ungültige Anfrage.');
  try {
    const a = await verwalte(k, wer.mitglied.betrieb_id, b);
    return json(a.status, a.body);
  } catch (e) {
    console.error('Partner-Verwaltung fehlgeschlagen', e);
    return fehler(500, 'Das hat gerade nicht geklappt. Versuch es gleich noch einmal.');
  }
}
