/**
 * POST /api/takte/aktion – Entscheidung direkt aus der Push-Mitteilung, ohne die App zu öffnen.
 * Body: { schluessel } (signiert vom Server-Takt, 24 h gültig). Antwort: { ok, text } oder { fehler }.
 * Ohne Supabase-Schlüssel oder Geheimnis (`TAKTE_GEHEIMNIS`, sonst `CRON_SECRET`): 501 { fehler: "nicht verbunden" } –
 * der Service Worker öffnet dann die Takt-Ansicht und entscheidet dort.
 */
import { body, fehler, json, nichtVerbunden, rest, supabaseKonfig } from '@/server/cloud/lib';
import type { Mitarbeiter } from '@core/objects';
import { betriebsDaten, type Mitglied } from '@/os/server/takte/planen';
import { aktionAnwenden, geheimnis, schluesselPruefen } from '@/os/server/takte/serverAktionen';
import { messen, objekteLaden, objekteSchreiben } from '@/os/server/takte/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: Request): Promise<Response> {
  const k = supabaseKonfig();
  const geheim = geheimnis();
  if (!k || !geheim) return nichtVerbunden();
  const schluessel = (await body<{ schluessel?: unknown }>(req))?.schluessel;
  const inhalt = typeof schluessel === 'string' ? schluesselPruefen(schluessel, geheim) : undefined;
  if (!inhalt) return fehler(401, 'Der Knopf ist abgelaufen. Öffne Macher OS und entscheide dort.');

  try {
    // Ist die Person noch Mitglied des Betriebs?
    const mitglied = await rest<Mitglied[]>(
      k,
      `mitglieder?select=nutzer_id,mitarbeiter_id,rolle&betrieb_id=eq.${encodeURIComponent(inhalt.b)}&mitarbeiter_id=eq.${encodeURIComponent(inhalt.m)}`,
    );
    if (!mitglied.length) return fehler(403, 'Du gehörst nicht mehr zu diesem Betrieb.');
    const d = betriebsDaten(await objekteLaden(k, inhalt.b));
    const m = d.bestand.mitarbeiter.find((x) => x.id === inhalt.m) as Mitarbeiter | undefined;
    if (!m || !m.aktiv) return fehler(403, 'Dein Zugang ist nicht aktiv.');
    const ergebnis = aktionAnwenden(inhalt.a, inhalt.p, d, m);
    if ('fehler' in ergebnis) return json(409, ergebnis);
    await objekteSchreiben(k, inhalt.b, ergebnis.zeilen);
    await messen(k, inhalt.b, 'gewohnheit.aktion_aus_benachrichtigung', [{ takt: inhalt.t, aktion: inhalt.a, weg: 'server' }]);
    return json(200, { ok: true, text: ergebnis.text });
  } catch (e) {
    console.error('Takt-Aktion fehlgeschlagen', e);
    return fehler(502, 'Das hat gerade nicht geklappt. Öffne Macher OS und entscheide dort.');
  }
}
