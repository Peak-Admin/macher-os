/**
 * GET /api/cloud/oeffentlich?art=portal|buchung&token=… – öffentlich lesbare Daten hinter einem Token
 * (Kundenbereich `/k/:token`, Terminbuchung `/buchen/:token`) für echte Endkunden ohne Konto.
 *
 * Token-Quelle: Tabelle `oeffentliche_links`; Rückfall: Portalzugang (`portalzugaenge`) bzw. Buchungslink
 * (Einstellung `terminbuchung.links`) aus `objekte`. Geliefert wird nur, was zum Kunden gehört; interne Felder
 * (Notizen, Einkaufspreise, Kosten) werden entfernt. Beim Kundenbereich wird „Kunde hat geöffnet“ vermerkt
 * (höchstens einmal je Tag und Link).
 */
import { ereignisSchreiben, fehler, json, nichtVerbunden, rest, supabaseKonfig, type SupabaseKonfig } from '@/server/cloud/lib';

type Daten = Record<string, unknown>;
interface Link {
  token: string;
  betrieb_id: string;
  art: string;
  bezug: { kundeId?: string; objekte?: { typ: string; id: string }[] } | null;
  gueltig_bis: string | null;
}

const INTERN = /^(notiz|intern|einkauf|kosten|marge|lohn|stundenlohn)/i;
/** Sammlungen, die ein Kunde über seinen Link sehen darf (nur Einträge mit seiner kundeId) */
const FUER_KUNDEN = ['auftraege', 'angebote', 'rechnungen', 'termine', 'dokumente', 'orte', 'anlagen'];

function oeffentlichMachen(d: Daten | null | undefined): Daten | undefined {
  if (!d || d.beispiel || d.geloeschtAm) return undefined;
  const r: Daten = {};
  for (const [f, w] of Object.entries(d)) if (!INTERN.test(f)) r[f] = w;
  return r;
}

async function zeilen(k: SupabaseKonfig, betriebId: string, filter: string): Promise<{ sammlung: string; id: string; daten: Daten | null }[]> {
  return rest(k, `objekte?betrieb_id=eq.${betriebId}&geloescht_am=is.null&${filter}&select=sammlung,id,daten&limit=500`);
}

async function linkFinden(k: SupabaseKonfig, art: string, token: string): Promise<Link | undefined> {
  const t = encodeURIComponent(token);
  const direkt = await rest<Link[]>(k, `oeffentliche_links?token=eq.${t}&art=eq.${art}&select=*`);
  if (direkt[0]) return direkt[0];
  if (art === 'portal') {
    const z = await rest<{ betrieb_id: string; daten: Daten }[]>(
      k,
      `objekte?sammlung=eq.portalzugaenge&daten->>token=eq.${t}&geloescht_am=is.null&select=betrieb_id,daten&limit=1`,
    );
    const d = z[0]?.daten;
    if (d && !d.beispiel) return { token, betrieb_id: z[0].betrieb_id, art, bezug: { kundeId: d.kundeId as string }, gueltig_bis: (d.gueltigBis as string) ?? null };
  } else {
    const z = await rest<{ betrieb_id: string; daten: { wert?: Record<string, Daten> } }[]>(
      k,
      `objekte?sammlung=eq.einstellungen&id=eq.terminbuchung.links&daten->wert->>${t}=not.is.null&select=betrieb_id,daten&limit=1`,
    );
    const l = z[0]?.daten?.wert?.[token];
    if (l) return { token, betrieb_id: z[0].betrieb_id, art, bezug: { kundeId: l.kundeId as string | undefined }, gueltig_bis: (l.gueltigBis as string) ?? null };
  }
  return undefined;
}

export async function GET(req: Request): Promise<Response> {
  const k = supabaseKonfig();
  if (!k) return nichtVerbunden();
  const q = new URL(req.url).searchParams;
  const art = q.get('art');
  const token = q.get('token');
  if ((art !== 'portal' && art !== 'buchung') || !token || token.length > 200) return fehler(400, 'Link unvollständig.');

  const link = await linkFinden(k, art, token);
  if (!link) return fehler(404, 'Dieser Link ist nicht (mehr) gültig.');
  if (link.gueltig_bis && new Date(link.gueltig_bis).getTime() < Date.now() - 86_400_000) return fehler(410, 'Dieser Link ist abgelaufen.');

  const b = link.betrieb_id;
  const kundeId = link.bezug?.kundeId;
  const [betriebZeile] = await zeilen(k, b, 'sammlung=eq.betrieb&id=eq.betrieb');
  const betrieb = oeffentlichMachen(betriebZeile?.daten);
  // Bankdaten und Kontakt bleiben (stehen ohnehin auf jeder Rechnung), Steuerinterna nicht
  if (betrieb) delete betrieb.stundensatz;

  const objekte: Record<string, Daten[]> = {};
  let kunde: Daten | undefined;
  if (kundeId) {
    const id = encodeURIComponent(kundeId);
    const [kz] = await zeilen(k, b, `sammlung=eq.kunden&id=eq.${id}`);
    kunde = oeffentlichMachen(kz?.daten);
    const verknuepft = await zeilen(k, b, `sammlung=in.(${FUER_KUNDEN.join(',')})&daten->>kundeId=eq.${id}`);
    for (const z of verknuepft) {
      const d = oeffentlichMachen(z.daten);
      if (d) (objekte[z.sammlung] ??= []).push(d);
    }
  }
  for (const ref of link.bezug?.objekte ?? []) {
    const [z] = await zeilen(k, b, `sammlung=eq.${encodeURIComponent(ref.typ)}&id=eq.${encodeURIComponent(ref.id)}`);
    const d = oeffentlichMachen(z?.daten);
    if (d && !(objekte[ref.typ] ?? []).some((x) => x.id === d.id)) (objekte[ref.typ] ??= []).push(d);
  }

  if (art === 'portal') {
    const tag = new Date().toISOString().slice(0, 10);
    await ereignisSchreiben(
      k,
      b,
      {
        id: `e_portal_${token.slice(0, 40)}_${tag}`,
        typ: 'portal.geoeffnet',
        bezug: kundeId ? { typ: 'kunden', id: kundeId } : { typ: 'betrieb', id: 'betrieb' },
        text: 'Kunde hat den Kundenbereich geöffnet',
        daten: { kundeId, bezug: kundeId ? { typ: 'kunden', id: kundeId } : undefined },
      },
      { ignorierenWennVorhanden: true },
    ).catch((e) => console.error('Öffnen nicht vermerkt', e));
  }

  return json(200, { art, token, gueltigBis: link.gueltig_bis, betrieb, kunde, objekte });
}
