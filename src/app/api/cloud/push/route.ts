/**
 * POST /api/cloud/push – Benachrichtigung an einen Mitarbeiter (alle seine Geräte).
 * Body: { nachricht: PushNachricht }. Antwort: { geraete, email }.
 */
import { angemeldetesMitglied, body, fehler, json, nichtVerbunden, supabaseKonfig } from '@/server/cloud/lib';
import { pushAnMitarbeiter, pushVerbunden, type PushNachricht } from '@/server/cloud/push';
import { emailVerbunden } from '@/server/cloud/versand';

export async function POST(req: Request): Promise<Response> {
  const k = supabaseKonfig();
  if (!k || (!pushVerbunden() && !emailVerbunden())) return nichtVerbunden();
  const n = (await body<{ nachricht?: PushNachricht }>(req))?.nachricht;
  if (!n?.anMitarbeiterId || !n.titel) return fehler(400, 'Empfänger und Titel fehlen.');
  if (n.pfad && !n.pfad.startsWith('/')) return fehler(400, 'Der Pfad muss mit / beginnen.');
  const wer = await angemeldetesMitglied(req, k);
  if (wer instanceof Response) return wer;
  const r = await pushAnMitarbeiter(k, wer.mitglied.betrieb_id, {
    anMitarbeiterId: n.anMitarbeiterId,
    titel: n.titel.slice(0, 120),
    text: n.text?.slice(0, 500),
    pfad: n.pfad,
    aktionen: n.aktionen?.slice(0, 2),
  });
  return json(200, r);
}
