/**
 * Kleiner Zugriff auf Supabase (PostgREST) mit dem Service-Key – nur auf dem Server.
 * Ohne Schlüssel liefert `verbindung()` undefined → die Funktion antwortet mit 501 „nicht verbunden“.
 */
export interface Verbindung {
  url: string;
  schluessel: string;
}

export function verbindung(): Verbindung | undefined {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const schluessel = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && schluessel ? { url: url.replace(/\/$/, ''), schluessel } : undefined;
}

export function json(daten: unknown, status = 200, kopf: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(daten), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...kopf },
  });
}

export const nichtVerbunden = () => json({ fehler: 'nicht verbunden' }, 501);

function kopfzeilen(v: Verbindung, extra: Record<string, string> = {}) {
  return { apikey: v.schluessel, authorization: `Bearer ${v.schluessel}`, 'content-type': 'application/json', ...extra };
}

/** GET /rest/v1/<tabelle>?<abfrage> */
export async function lesen<T>(v: Verbindung, tabelle: string, abfrage: string): Promise<T[]> {
  const r = await fetch(`${v.url}/rest/v1/${tabelle}?${abfrage}`, { headers: kopfzeilen(v) });
  if (!r.ok) throw new Error(`Lesen ${tabelle}: ${r.status}`);
  return (await r.json()) as T[];
}

export interface ObjektZeile {
  betrieb_id: string;
  sammlung: string;
  id: string;
  daten: Record<string, unknown>;
  geaendert_am?: string;
  geloescht_am?: string | null;
}

/** Objekte anlegen oder überschreiben (eine Zeile je Objekt, siehe Datenvertrag) */
export async function objekteSchreiben(v: Verbindung, zeilen: ObjektZeile[]): Promise<void> {
  if (!zeilen.length) return;
  const jetzt = new Date().toISOString();
  const r = await fetch(`${v.url}/rest/v1/objekte?on_conflict=betrieb_id,sammlung,id`, {
    method: 'POST',
    headers: kopfzeilen(v, { prefer: 'resolution=merge-duplicates,return=minimal' }),
    body: JSON.stringify(zeilen.map((z) => ({ ...z, geaendert_am: z.geaendert_am ?? jetzt }))),
  });
  if (!r.ok) throw new Error(`Schreiben objekte: ${r.status}`);
}

/** Objekte einer Sammlung eines Betriebs (ohne Papierkorb) */
export async function objekteLesen<T>(v: Verbindung, betriebId: string, sammlung: string, felder = 'id,daten'): Promise<(T & { id: string })[]> {
  const zeilen = await lesen<{ id: string; daten: T }>(
    v,
    'objekte',
    `select=${felder}&betrieb_id=eq.${encodeURIComponent(betriebId)}&sammlung=eq.${encodeURIComponent(sammlung)}&geloescht_am=is.null`,
  );
  return zeilen.map((z) => ({ ...(z.daten as T), id: z.id }));
}

export function neueId(): string {
  return globalThis.crypto.randomUUID();
}
