/**
 * Zugriff auf `objekte` für die Server-Funktionen der Takte – über die gemeinsamen Helfer in `@/server/cloud/lib`
 * (PostgREST mit Service-Key, Schlüssel `SUPABASE_URL` bzw. `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`).
 * Nur auf dem Server verwenden.
 */
import { rest, type SupabaseKonfig } from '@/server/cloud/lib';
import { SAMMLUNGEN, type ObjektZeile } from './planen';

/** Alle Objekte eines Betriebs, die die Takte brauchen – seitenweise */
export async function objekteLaden(k: SupabaseKonfig, betriebId: string): Promise<ObjektZeile[]> {
  const alle: ObjektZeile[] = [];
  const SEITE = 1000;
  for (let ab = 0; ; ab += SEITE) {
    const teil = await rest<ObjektZeile[]>(
      k,
      `objekte?select=sammlung,id,daten&betrieb_id=eq.${encodeURIComponent(betriebId)}&geloescht_am=is.null&sammlung=in.(${SAMMLUNGEN.join(',')})&order=sammlung,id&limit=${SEITE}&offset=${ab}`,
    );
    alle.push(...teil);
    if (teil.length < SEITE) return alle;
  }
}

/** Zeilen in `objekte` anlegen oder ersetzen (Daten vollständig mitgeben; `geaendertAm` wird gesetzt) */
export async function objekteSchreiben(k: SupabaseKonfig, betriebId: string, zeilen: ObjektZeile[]): Promise<void> {
  if (!zeilen.length) return;
  const jetzt = new Date().toISOString();
  await rest(k, 'objekte?on_conflict=betrieb_id,sammlung,id', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=minimal',
    body: zeilen.map((z) => ({ betrieb_id: betriebId, sammlung: z.sammlung, id: z.id, daten: { ...z.daten, geaendertAm: jetzt }, geaendert_am: jetzt })),
  });
}

export async function einstellungSchreiben(k: SupabaseKonfig, betriebId: string, id: string, wert: unknown): Promise<void> {
  const jetzt = new Date().toISOString();
  await objekteSchreiben(k, betriebId, [{ sammlung: 'einstellungen', id, daten: { id, wert, erstelltAm: jetzt, geaendertAm: jetzt } }]);
}

/** Messpunkt schreiben – ein Fehler hier stoppt nie die eigentliche Arbeit */
export async function messen(k: SupabaseKonfig, betriebId: string, ereignis: string, daten: Record<string, unknown>[], zeit = new Date()): Promise<void> {
  if (!daten.length) return;
  await rest(k, 'messpunkte', {
    method: 'POST',
    prefer: 'return=minimal',
    body: daten.map((d) => ({ betrieb_id: betriebId, ereignis, zeit: zeit.toISOString(), daten: d })),
  }).catch((e) => console.error('Messpunkt fehlgeschlagen', e));
}
