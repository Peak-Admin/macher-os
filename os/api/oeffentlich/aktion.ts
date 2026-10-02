/**
 * POST /api/oeffentlich/aktion  { art, token, typ, daten }
 * Was ein Kunde über einen öffentlichen Link tut (Kundenbereich geöffnet, Nachricht, Angebot annehmen/ablehnen,
 * Termin buchen). Wird geprüft und als `oeffentliche_eingaben` beim Betrieb abgelegt; die App des Betriebs
 * verarbeitet die Eingabe mit derselben Logik wie im Büro (Event, Zeitstrahl, Benachrichtigung).
 * 202 { ok } · 400/404 { fehler } · 501 { fehler: "nicht verbunden" }
 */
import { json, lesen, neueId, nichtVerbunden, objekteSchreiben, verbindung } from './_db';
import { eingabePruefen, sichtGueltig, type SichtZeile } from './_logik';

export async function POST(request: Request): Promise<Response> {
  const v = verbindung();
  if (!v) return nichtVerbunden();
  const laenge = Number(request.headers.get('content-length') ?? 0);
  if (laenge > 20_000) return json({ fehler: 'Zu groß.' }, 413);
  let roh: unknown;
  try {
    roh = await request.json();
  } catch {
    return json({ fehler: 'Ungültige Anfrage.' }, 400);
  }
  const p = eingabePruefen(roh);
  if (!p.ok) return json({ fehler: p.fehler }, 400);
  const e = p.eingabe;
  try {
    const zeilen = await lesen<{ betrieb_id: string; daten: SichtZeile }>(
      v,
      'objekte',
      `select=betrieb_id,daten&sammlung=eq.oeffentliche_sichten&id=eq.${encodeURIComponent(e.token)}&geloescht_am=is.null`,
    );
    if (zeilen.length !== 1 || !sichtGueltig(zeilen[0].daten, e.art, undefined)) return json({ fehler: 'Dieser Link ist nicht mehr gültig.' }, 404);
    const id = neueId();
    const zeit = new Date().toISOString();
    await objekteSchreiben(v, [
      {
        betrieb_id: zeilen[0].betrieb_id,
        sammlung: 'oeffentliche_eingaben',
        id,
        daten: { id, erstelltAm: zeit, geaendertAm: zeit, art: e.art, token: e.token, typ: e.typ, daten: e.daten },
      },
    ]);
    return json({ ok: true }, 202);
  } catch (err) {
    return json({ fehler: err instanceof Error ? err.message : 'Fehler' }, 502);
  }
}
