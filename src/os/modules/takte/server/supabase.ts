/**
 * Zugriff auf Supabase (REST, Service-Key) für die Server-Funktionen der Takte. Nur auf dem Server verwenden.
 * Schlüssel: `SUPABASE_URL` (oder `NEXT_PUBLIC_SUPABASE_URL`/`VITE_SUPABASE_URL`), `SUPABASE_SERVICE_ROLE_KEY`.
 */
import { SAMMLUNGEN, type ObjektZeile } from './planen';

export interface Umgebung {
  url: string;
  schluessel: string;
}

export function umgebung(): Umgebung | undefined {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const schluessel = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && schluessel ? { url: url.replace(/\/$/, ''), schluessel } : undefined;
}

export async function rest<T>(u: Umgebung, pfad: string, init: RequestInit = {}): Promise<T> {
  const antwort = await fetch(`${u.url}/rest/v1/${pfad}`, {
    ...init,
    headers: { apikey: u.schluessel, Authorization: `Bearer ${u.schluessel}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  if (!antwort.ok) throw new Error(`Supabase ${antwort.status}: ${pfad.split('?')[0]}`);
  return antwort.status === 204 || init.method === 'POST' || init.method === 'DELETE' ? (undefined as T) : ((await antwort.json()) as T);
}

/** Alle benötigten Objekte eines Betriebs, seitenweise */
export async function objekteLaden(u: Umgebung, betriebId: string): Promise<ObjektZeile[]> {
  const alle: ObjektZeile[] = [];
  const SEITE = 1000;
  for (let ab = 0; ; ab += SEITE) {
    const teil = await rest<ObjektZeile[]>(
      u,
      `objekte?select=sammlung,id,daten&betrieb_id=eq.${betriebId}&geloescht_am=is.null&sammlung=in.(${SAMMLUNGEN.join(',')})&order=sammlung,id&limit=${SEITE}&offset=${ab}`,
    );
    alle.push(...teil);
    if (teil.length < SEITE) return alle;
  }
}

export async function einstellungSchreiben(u: Umgebung, betriebId: string, id: string, wert: unknown) {
  const jetzt = new Date().toISOString();
  await objekteSchreiben(u, betriebId, [{ sammlung: 'einstellungen', id, daten: { id, wert, erstelltAm: jetzt, geaendertAm: jetzt } }]);
}

/** Zeilen in `objekte` anlegen oder ersetzen (Daten vollständig mitgeben; `geaendertAm` wird gesetzt) */
export async function objekteSchreiben(u: Umgebung, betriebId: string, zeilen: ObjektZeile[]) {
  if (!zeilen.length) return;
  const jetzt = new Date().toISOString();
  await rest(u, 'objekte?on_conflict=betrieb_id,sammlung,id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(zeilen.map((z) => ({ betrieb_id: betriebId, sammlung: z.sammlung, id: z.id, daten: { ...z.daten, geaendertAm: jetzt }, geaendert_am: jetzt }))),
  });
}
