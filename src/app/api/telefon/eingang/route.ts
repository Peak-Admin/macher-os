/**
 * Telefonassistent: Eingangs-Webhook des Telefon-/Voice-Anbieters.
 *
 * POST /api/telefon/eingang?betrieb=<betrieb-id>
 *  → wählt den Adapter (`TELEFON_ANBIETER`, heute nur `simulator`) und prüft die Signatur (`TELEFON_WEBHOOK_SECRET`),
 *  → übersetzt die Nutzlast in normalisierte Ereignisse (`anruf.begonnen`, `anruf.beendet`, `werkzeug.aufgerufen`),
 *  → legt je beendetem Anruf eine Nachricht ab (`kanal: 'telefon'`, `anruf.status: 'neu'`; doppelte Zustellung wird
 *    an der Gesprächs-ID erkannt). Anfrage, Rückruf und Notfall-Meldung macht danach die App.
 *
 * Ohne Anbieter, Geheimnis oder Supabase → 501. Doku: `docs/os/KI-TELEFONIE.md`.
 */
import { json, neueId, nichtVerbunden, objekteLesen, objekteSchreiben, verbindung } from '@/os/server/supabase';
import { telefonEingangPlanen, type TelefonBestand } from '@/os/server/telefon';
import { anbieter } from '@/os/modules/telefon/anbieter';

export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  const a = anbieter(process.env.TELEFON_ANBIETER);
  if (!a) return json({ fehler: 'kein Telefonanbieter verbunden' }, 501);
  const geheim = process.env.TELEFON_WEBHOOK_SECRET;
  if (!geheim) return json({ fehler: 'Webhook-Geheimnis fehlt' }, 501);
  const v = verbindung();
  if (!v) return nichtVerbunden();

  const betriebId = new URL(request.url).searchParams.get('betrieb');
  if (!betriebId) return json({ fehler: 'Betrieb fehlt (?betrieb=…)' }, 400);

  const rohText = await request.text();
  const kopf = Object.fromEntries(request.headers.entries());
  if (!(await a.pruefeSignatur({ kopf, rohText }, geheim))) return json({ fehler: 'nicht erlaubt' }, 401);

  let body: unknown;
  try {
    body = JSON.parse(rohText);
  } catch {
    return json({ fehler: 'kein JSON' }, 400);
  }
  const ereignisse = a.eingangLesen(body);
  // 200 statt Fehler, damit der Anbieter unbekannte Ereignisse nicht endlos neu zustellt
  if (!ereignisse.length) return json({ ok: true, ignoriert: true });

  try {
    const [nachrichten, kunden] = await Promise.all([
      objekteLesen<TelefonBestand['nachrichten'][number]>(v, betriebId, 'nachrichten'),
      ereignisse.some((e) => e.typ === 'werkzeug.aufgerufen') ? objekteLesen<TelefonBestand['kunden'][number]>(v, betriebId, 'kunden') : Promise.resolve([]),
    ]);
    const plan = telefonEingangPlanen(ereignisse, { nachrichten, kunden }, { id: neueId, jetzt: new Date() });
    await objekteSchreiben(
      v,
      plan.zeilen.map((z) => ({ betrieb_id: betriebId, sammlung: 'nachrichten', id: z.id, daten: z.daten })),
    );
    return json({
      ok: true,
      abgelegt: plan.zeilen.length,
      doppelt: plan.doppelt,
      werkzeuge: plan.werkzeuge.map((w) => ({ anrufId: w.anrufId, werkzeug: w.werkzeug, antwort: a.werkzeugAntwort ? a.werkzeugAntwort(w.werkzeug, w.ergebnis) : w.ergebnis })),
    });
  } catch (e) {
    return json({ fehler: e instanceof Error ? e.message : 'Fehler' }, 502);
  }
}

export function GET(): Response {
  const a = anbieter(process.env.TELEFON_ANBIETER);
  return a ? json({ ok: true, anbieter: a.id, hinweis: 'Eingang für den Telefonassistenten. Bitte per POST (Webhook) aufrufen.' }) : json({ fehler: 'kein Telefonanbieter verbunden' }, 501);
}
