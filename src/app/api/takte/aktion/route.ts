/**
 * POST /api/takte/aktion – Entscheidung direkt aus der Push-Mitteilung, ohne die App zu öffnen.
 * Body: { schluessel } (signiert vom Server-Takt, 24 h gültig). Antwort: { ok, text } oder { fehler }.
 * Ohne Supabase-Schlüssel oder Geheimnis: 501 { fehler: "nicht verbunden" } – der Service Worker öffnet dann die App.
 */
import { aktionAnwenden, geheimnis, schluesselPruefen } from '@/os/modules/takte/server/serverAktionen';
import { betriebsDaten, type Mitglied } from '@/os/modules/takte/server/planen';
import { objekteLaden, objekteSchreiben, rest, umgebung } from '@/os/modules/takte/server/supabase';
import type { Mitarbeiter } from '@/os/core/objects';

export const dynamic = 'force-dynamic';

const json = (status: number, daten: unknown) => Response.json(daten, { status });

export async function POST(request: Request) {
  const u = umgebung();
  const geheim = geheimnis();
  if (!u || !geheim) return json(501, { fehler: 'nicht verbunden' });
  let schluessel: unknown;
  try {
    schluessel = ((await request.json()) as { schluessel?: unknown }).schluessel;
  } catch {
    schluessel = undefined;
  }
  const inhalt = typeof schluessel === 'string' ? schluesselPruefen(schluessel, geheim) : undefined;
  if (!inhalt) return json(401, { fehler: 'Der Knopf ist abgelaufen. Öffne Macher OS und entscheide dort.' });

  try {
    // Ist die Person noch Mitglied des Betriebs?
    const mitglied = await rest<Mitglied[]>(u, `mitglieder?select=nutzer_id,mitarbeiter_id,rolle&betrieb_id=eq.${inhalt.b}&mitarbeiter_id=eq.${encodeURIComponent(inhalt.m)}`);
    if (!mitglied.length) return json(403, { fehler: 'Du gehörst nicht mehr zu diesem Betrieb.' });
    const d = betriebsDaten(await objekteLaden(u, inhalt.b));
    const m = d.bestand.mitarbeiter.find((x) => x.id === inhalt.m) as Mitarbeiter | undefined;
    if (!m || !m.aktiv) return json(403, { fehler: 'Dein Zugang ist nicht aktiv.' });
    const ergebnis = aktionAnwenden(inhalt.a, inhalt.p, d, m);
    if ('fehler' in ergebnis) return json(409, ergebnis);
    await objekteSchreiben(u, inhalt.b, ergebnis.zeilen);
    await rest(u, 'messpunkte', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify([{ betrieb_id: inhalt.b, ereignis: 'gewohnheit.aktion_aus_benachrichtigung', zeit: new Date().toISOString(), daten: { takt: inhalt.t, aktion: inhalt.a, weg: 'server' } }]),
    }).catch(() => undefined);
    return json(200, { ok: true, text: ergebnis.text });
  } catch (e) {
    console.error('Takt-Aktion fehlgeschlagen', e);
    return json(502, { fehler: 'Das hat gerade nicht geklappt. Öffne Macher OS und entscheide dort.' });
  }
}
