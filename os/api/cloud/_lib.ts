/**
 * Gemeinsame Helfer der Server-Funktionen (Vercel Functions, Node).
 * Dateien mit `_` am Anfang werden von Vercel nicht als eigene Funktion veröffentlicht.
 *
 * Grundsätze:
 * - Schlüssel nur aus `process.env`, nie an den Browser.
 * - Fehlt ein Schlüssel: `501 { fehler: "nicht verbunden" }` – der Browser nutzt dann den lokalen Rückfall.
 * - Supabase wird per `fetch` (REST/Auth) angesprochen, ohne SDK.
 */
import { randomBytes, randomUUID } from 'node:crypto';

export const env = (name: string): string | undefined => {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
};

export function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

export const nichtVerbunden = (was?: string) => json(501, { fehler: 'nicht verbunden', ...(was ? { was } : {}) });
export const fehler = (status: number, text: string) => json(status, { fehler: text });

export const neueId = (praefix = '') => (praefix ? `${praefix}_${randomUUID()}` : randomUUID());
export const neuesToken = (bytes = 24) => randomBytes(bytes).toString('base64url');

// ------------------------------------------------------------------ Supabase

export interface SupabaseKonfig {
  url: string;
  serviceKey: string;
  anonKey?: string;
}

export function supabaseKonfig(): SupabaseKonfig | undefined {
  const url = env('SUPABASE_URL') ?? env('VITE_SUPABASE_URL');
  const serviceKey = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return undefined;
  return { url: url.replace(/\/$/, ''), serviceKey, anonKey: env('VITE_SUPABASE_ANON_KEY') ?? env('SUPABASE_ANON_KEY') };
}

/** PostgREST mit Service-Role (umgeht RLS – nur nach eigener Prüfung der Mitgliedschaft verwenden) */
export async function rest<T = unknown>(
  k: SupabaseKonfig,
  pfad: string,
  init: { method?: string; body?: unknown; prefer?: string } = {},
): Promise<T> {
  const r = await fetch(`${k.url}/rest/v1/${pfad}`, {
    method: init.method ?? 'GET',
    headers: {
      apikey: k.serviceKey,
      authorization: `Bearer ${k.serviceKey}`,
      'content-type': 'application/json',
      ...(init.prefer ? { prefer: init.prefer } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const text = await r.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export interface Nutzer {
  id: string;
  email?: string;
  phone?: string;
}

/** Angemeldeten Nutzer aus `Authorization: Bearer <access_token>` ermitteln */
export async function nutzerAus(req: Request, k: SupabaseKonfig): Promise<Nutzer | undefined> {
  const auth = req.headers.get('authorization');
  if (!auth?.toLowerCase().startsWith('bearer ')) return undefined;
  const r = await fetch(`${k.url}/auth/v1/user`, { headers: { apikey: k.anonKey ?? k.serviceKey, authorization: auth } });
  if (!r.ok) return undefined;
  const u = (await r.json()) as Nutzer;
  return u?.id ? u : undefined;
}

export interface Mitgliedschaft {
  betrieb_id: string;
  nutzer_id: string;
  mitarbeiter_id: string | null;
  rolle: string;
}

export async function mitgliedschaft(k: SupabaseKonfig, nutzerId: string): Promise<Mitgliedschaft | undefined> {
  const zeilen = await rest<Mitgliedschaft[]>(k, `mitglieder?nutzer_id=eq.${encodeURIComponent(nutzerId)}&select=*&order=erstellt_am.asc&limit=1`);
  return zeilen[0];
}

/** Nutzer + Mitgliedschaft prüfen; liefert eine fertige Fehlerantwort, wenn etwas fehlt */
export async function angemeldetesMitglied(
  req: Request,
  k: SupabaseKonfig,
  rollen?: string[],
): Promise<{ nutzer: Nutzer; mitglied: Mitgliedschaft } | Response> {
  const nutzer = await nutzerAus(req, k);
  if (!nutzer) return fehler(401, 'Bitte melde dich an.');
  const mitglied = await mitgliedschaft(k, nutzer.id);
  if (!mitglied) return fehler(403, 'Du gehörst noch zu keinem Betrieb.');
  if (rollen && !rollen.includes(mitglied.rolle)) return fehler(403, 'Dafür fehlt dir die Berechtigung.');
  return { nutzer, mitglied };
}

export async function objektLesen<T = Record<string, unknown>>(k: SupabaseKonfig, betriebId: string, sammlung: string, id: string): Promise<T | undefined> {
  const zeilen = await rest<{ daten: T | null }[]>(
    k,
    `objekte?betrieb_id=eq.${betriebId}&sammlung=eq.${encodeURIComponent(sammlung)}&id=eq.${encodeURIComponent(id)}&select=daten`,
  );
  return zeilen[0]?.daten ?? undefined;
}

/** Eintrag in den Zeitstrahl schreiben – kommt per Realtime auf allen Geräten an */
export async function ereignisSchreiben(
  k: SupabaseKonfig,
  betriebId: string,
  e: { id?: string; typ: string; bezug: { typ: string; id: string }; text: string; daten?: unknown },
  opts: { ignorierenWennVorhanden?: boolean } = {},
): Promise<void> {
  const zeit = new Date().toISOString();
  const id = e.id ?? neueId('e');
  await rest(k, 'objekte?on_conflict=betrieb_id,sammlung,id', {
    method: 'POST',
    prefer: `resolution=${opts.ignorierenWennVorhanden ? 'ignore' : 'merge'}-duplicates,return=minimal`,
    body: [{ betrieb_id: betriebId, sammlung: 'ereignisse', id, daten: { id, erstelltAm: zeit, geaendertAm: zeit, typ: e.typ, bezug: e.bezug, text: e.text, daten: e.daten } }],
  });
}

// ------------------------------------------------------------------ Adressen

/** Öffentliche Adresse der App (für Links in E-Mails/SMS) */
export function appUrl(req: Request): string {
  const fest = env('APP_URL');
  if (fest) return fest.replace(/\/$/, '');
  return new URL(req.url).origin;
}

/** Handynummer ins internationale Format (+49 …) */
export function telefonNormal(t: string): string {
  const roh = t.replace(/[^\d+]/g, '');
  if (roh.startsWith('+')) return roh;
  if (roh.startsWith('00')) return `+${roh.slice(2)}`;
  if (roh.startsWith('0')) return `+49${roh.slice(1)}`;
  return `+${roh}`;
}

export const istEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export const htmlSicher = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export async function body<T>(req: Request): Promise<T | undefined> {
  try {
    return (await req.json()) as T;
  } catch {
    return undefined;
  }
}
