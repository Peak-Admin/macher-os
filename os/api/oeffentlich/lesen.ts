/**
 * GET /api/oeffentlich/lesen?art=portal|buchung&token=…
 * Liefert die öffentliche Sicht hinter einem Link (Kundenbereich, Terminbuchung) – gelesen mit dem Service-Key
 * aus `objekte` (Sammlung `oeffentliche_sichten`, ID = Token), geprüft gegen `oeffentliche_links`, falls vorhanden.
 * 200 { sicht } · 404 { fehler } · 501 { fehler: "nicht verbunden" }
 */
import { json, lesen, nichtVerbunden, verbindung } from './_db';
import { artPruefen, sichtGueltig, TOKEN_MUSTER, type LinkZeile, type SichtZeile } from './_logik';

export async function GET(request: Request): Promise<Response> {
  const v = verbindung();
  if (!v) return nichtVerbunden();
  const q = new URL(request.url).searchParams;
  const art = artPruefen(q.get('art'));
  const token = q.get('token') ?? '';
  if (!art || !TOKEN_MUSTER.test(token)) return json({ fehler: 'unbekannt' }, 404);
  try {
    const links = await lesen<LinkZeile>(v, 'oeffentliche_links', `select=token,betrieb_id,art,gueltig_bis&token=eq.${encodeURIComponent(token)}`).catch(() => [] as LinkZeile[]);
    const link = links[0];
    const filter = `select=betrieb_id,daten&sammlung=eq.oeffentliche_sichten&id=eq.${encodeURIComponent(token)}&geloescht_am=is.null${link ? `&betrieb_id=eq.${encodeURIComponent(link.betrieb_id)}` : ''}`;
    const zeilen = await lesen<{ betrieb_id: string; daten: SichtZeile }>(v, 'objekte', filter);
    // Ein Token muss eindeutig sein – sonst lieber nichts ausliefern
    if (zeilen.length !== 1 || !sichtGueltig(zeilen[0].daten, art, link)) return json({ fehler: 'unbekannt' }, 404);
    return json({ sicht: zeilen[0].daten.sicht }, 200, { 'x-robots-tag': 'noindex' });
  } catch (e) {
    return json({ fehler: e instanceof Error ? e.message : 'Fehler' }, 502);
  }
}
