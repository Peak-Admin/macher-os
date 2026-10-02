/**
 * Gemeinsame Helfer der Route Handler „Bezahlen“ (Node, `fetch` statt SDKs).
 * Liegt im privaten Ordner `_lib` – keine eigene Route.
 *
 * Schlüssel nur aus `process.env`: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`,
 * `VITE_SUPABASE_URL` (oder `SUPABASE_URL`). Optional: `RESEND_API_KEY` + `ABO_ABSENDER` für Zahlungserinnerungen,
 * `STRIPE_AUTOMATISCHE_STEUER=1` für Stripe Tax, `CRON_SECRET` für den täglichen Erinnerungslauf.
 * Fehlt etwas Nötiges: `501 { fehler: "nicht verbunden" }`.
 */
import { aktivePersonen, planLesen, testBisAus, type PlanId } from '@modules/abo/regeln';


export const env = (k: string) => process.env[k]?.trim() || undefined;
export const supabaseUrl = () => (env('SUPABASE_URL') ?? env('VITE_SUPABASE_URL'))?.replace(/\/$/, '');

export function json(daten: unknown, status = 200): Response {
  return new Response(JSON.stringify(daten), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
}
export const fehler = (text: string, status = 400) => json({ fehler: text }, status);
export const nichtVerbunden = () => json({ fehler: 'nicht verbunden' }, 501);

/** Sind Stripe und Supabase verbunden? */
export function verbunden(): boolean {
  return !!(env('STRIPE_SECRET_KEY') && env('SUPABASE_SERVICE_ROLE_KEY') && supabaseUrl());
}

// ------------------------------------------------------------------ Supabase (REST, Service-Rolle)

export async function sb<T = unknown>(pfad: string, init: { method?: string; body?: unknown; prefer?: string } = {}): Promise<T> {
  const key = env('SUPABASE_SERVICE_ROLE_KEY')!;
  const r = await fetch(`${supabaseUrl()}/rest/v1/${pfad}`, {
    method: init.method ?? 'GET',
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      'content-type': 'application/json',
      ...(init.prefer ? { prefer: init.prefer } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  const text = await r.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export interface BetriebZeile {
  id: string;
  name?: string;
  erstellt_am?: string;
  plan?: string;
  test_bis?: string | null;
  stripe_kunde?: string | null;
}

export async function betriebLesen(id: string): Promise<BetriebZeile | undefined> {
  const z = await sb<BetriebZeile[]>(`betriebe?id=eq.${encodeURIComponent(id)}&select=id,name,erstellt_am,plan,test_bis,stripe_kunde`);
  return z[0];
}

export async function betriebZuKunde(kunde: string): Promise<BetriebZeile | undefined> {
  const z = await sb<BetriebZeile[]>(`betriebe?stripe_kunde=eq.${encodeURIComponent(kunde)}&select=id,name,erstellt_am,plan,test_bis,stripe_kunde`);
  return z[0];
}

export async function betriebSetzen(id: string, patch: Partial<Omit<BetriebZeile, 'id'>>) {
  await sb(`betriebe?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: patch, prefer: 'return=minimal' });
}

/** Testphase laut Datenvertrag: `test_bis` – fehlt sie, 30 Tage ab Einrichtung (einmalig gespeichert) */
export async function testBisSicher(b: BetriebZeile): Promise<string> {
  if (b.test_bis) return b.test_bis.slice(0, 10);
  const bis = testBisAus(b.erstellt_am ?? new Date().toISOString());
  await betriebSetzen(b.id, { test_bis: bis });
  return bis;
}

/** Aktive Leute laut `objekte` – Grundlage für den Plan (nicht der Wert aus dem Browser) */
export async function personenZaehlen(betriebId: string): Promise<number> {
  const z = await sb<{ daten: { aktiv?: boolean; beispiel?: boolean } }[]>(
    `objekte?betrieb_id=eq.${encodeURIComponent(betriebId)}&sammlung=eq.mitarbeiter&geloescht_am=is.null&select=daten`,
  );
  return aktivePersonen(z.map((x) => x.daten ?? {}));
}

export async function messpunkt(betriebId: string, ereignis: string, daten: Record<string, string | number | boolean> = {}) {
  try {
    await sb('messpunkte', { method: 'POST', body: { betrieb_id: betriebId, ereignis, zeit: new Date().toISOString(), daten }, prefer: 'return=minimal' });
  } catch {
    /* Messung darf nie stören */
  }
}

// ------------------------------------------------------------------ Anmeldung

export interface Zugang {
  nutzerId: string;
  email?: string;
  betriebId: string;
  rolle?: string;
}

/**
 * Prüft den Zugangstoken (Supabase-Sitzung) und die Mitgliedschaft im Betrieb.
 * `nurChef`: Buchen, Zahlungsart und Kündigen nur für die Rolle Chef.
 */
export async function zugang(req: Request, betriebId: string | undefined, nurChef: boolean): Promise<Zugang | Response> {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return fehler('Bitte melde dich an.', 401);
  const key = env('SUPABASE_SERVICE_ROLE_KEY')!;
  const r = await fetch(`${supabaseUrl()}/auth/v1/user`, { headers: { apikey: key, authorization: `Bearer ${token}` } });
  if (!r.ok) return fehler('Deine Anmeldung ist abgelaufen. Bitte melde dich neu an.', 401);
  const nutzer = (await r.json()) as { id: string; email?: string };
  const mitglied = await sb<{ betrieb_id: string; rolle?: string }[]>(`mitglieder?nutzer_id=eq.${encodeURIComponent(nutzer.id)}&select=betrieb_id,rolle`);
  const m = betriebId ? mitglied.find((x) => x.betrieb_id === betriebId) : mitglied[0];
  if (!m) return fehler('Du gehörst zu keinem Betrieb.', 403);
  if (nurChef && !['chef', 'admin'].includes(m.rolle ?? '')) return fehler('Buchen und kündigen darf nur der Chef.', 403);
  return { nutzerId: nutzer.id, email: nutzer.email, betriebId: m.betrieb_id, rolle: m.rolle };
}

export async function koerper<T>(req: Request): Promise<Partial<T>> {
  try {
    return (await req.json()) as Partial<T>;
  } catch {
    return {};
  }
}

// ------------------------------------------------------------------ Stripe (REST, Formular-Kodierung)

type Wert = string | number | boolean | undefined | null | Wert[] | { [k: string]: Wert };

export function formular(obj: Record<string, Wert>, praefix = '', p = new URLSearchParams()): URLSearchParams {
  for (const [k, v] of Object.entries(obj)) {
    const name = praefix ? `${praefix}[${k}]` : k;
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) v.forEach((x, i) => (typeof x === 'object' && x !== null ? formular(x as Record<string, Wert>, `${name}[${i}]`, p) : p.append(`${name}[${i}]`, String(x))));
    else if (typeof v === 'object') formular(v, name, p);
    else p.append(name, String(v));
  }
  return p;
}

export async function stripe<T = Record<string, unknown>>(pfad: string, daten?: Record<string, Wert>, methode?: 'GET' | 'POST'): Promise<T> {
  const m = methode ?? (daten ? 'POST' : 'GET');
  const query = m === 'GET' && daten ? `${pfad.includes('?') ? '&' : '?'}${formular(daten)}` : '';
  const r = await fetch(`https://api.stripe.com/v1/${pfad}${query}`, {
    method: m,
    headers: { authorization: `Bearer ${env('STRIPE_SECRET_KEY')}`, 'content-type': 'application/x-www-form-urlencoded' },
    body: m === 'POST' && daten ? formular(daten).toString() : undefined,
  });
  const antwort = (await r.json()) as T & { error?: { message?: string } };
  if (!r.ok) throw new Error(`Stripe ${r.status}: ${antwort.error?.message ?? 'Fehler'}`);
  return antwort;
}

export interface StripeAbo {
  id: string;
  status: string;
  cancel_at_period_end?: boolean;
  cancel_at?: number | null;
  current_period_end?: number;
  metadata?: Record<string, string>;
  default_payment_method?: StripeZahlungsart | string | null;
  items: { data: { id: string; current_period_end?: number; price: { id: string; unit_amount: number | null; lookup_key?: string | null; recurring?: { interval: 'month' | 'year' } } }[] };
}

export interface StripeZahlungsart {
  type: string;
  sepa_debit?: { last4?: string };
  card?: { brand?: string; last4?: string };
}

/** Laufendes Abo des Kunden (aktiv, Zahlung offen oder noch nicht gekündigt) */
export async function laufendesAbo(kunde: string): Promise<StripeAbo | undefined> {
  const liste = await stripe<{ data: StripeAbo[] }>('subscriptions', { customer: kunde, status: 'all', limit: 5, expand: ['data.default_payment_method'] }, 'GET');
  return liste.data.find((s) => ['active', 'trialing', 'past_due', 'unpaid'].includes(s.status));
}

/** Ende des bezahlten Zeitraums (Stripe-API alt: am Abo, neu: am Abo-Posten) */
export function periodenEnde(s: StripeAbo): number | undefined {
  return s.current_period_end ?? s.items.data[0]?.current_period_end;
}

export const datumAus = (sekunden: number) => new Date(sekunden * 1000).toISOString().slice(0, 10);
/** letzter bezahlter Tag = Tag vor dem Periodenende */
export const letzterTag = (sekunden: number) => datumAus(sekunden - 1);

export function planIdAusAbo(s: StripeAbo, fallback?: PlanId): PlanId | undefined {
  const ausMeta = planLesen(s.metadata?.plan).planId;
  if (ausMeta) return ausMeta;
  const key = s.items.data[0]?.price.lookup_key ?? '';
  return planLesen(key.split('-')[2]).planId ?? fallback;
}
