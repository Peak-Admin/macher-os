/**
 * Browser-Seite der Server-Funktionen unter `os/api/abo/**`. Keine Schlüssel im Browser – nur der Zugangstoken
 * des angemeldeten Kontos geht mit. Antwortet der Server mit 501 (oder gibt es ihn gar nicht), ist Bezahlen
 * noch nicht eingerichtet: die App sagt das ehrlich und ändert nichts.
 */
import { cloud } from '@core/cloud';
import type { Intervall, PlanId } from './regeln';

export interface AboAntwort {
  plan: string;
  testBis?: string;
  naechsteAbbuchung?: string;
  betragCent?: number;
  intervall?: Intervall;
  zahlungsart?: { art: 'sepa' | 'karte' | 'sonstige'; text: string };
  rechnungen?: { id: string; nummer?: string; datum: string; betragCent: number; status: string; pdf?: string; link?: string }[];
}

export type Ergebnis<T> = { ok: true; daten: T } | { ok: false; nichtVerbunden: true } | { ok: false; nichtVerbunden?: false; fehler: string };

/**
 * Zugangstoken des Kontos. Der Cloud-Vertrag liefert (noch) keinen Token – bis dahin lesen wir die
 * Supabase-Sitzung aus dem Speicher des Browsers (Kernwunsch: `cloud().token()`).
 */
function zugangsToken(): string | undefined {
  try {
    const ls = globalThis.localStorage;
    for (let i = 0; ls && i < ls.length; i++) {
      const k = ls.key(i);
      if (k && /^sb-.+-auth-token$/.test(k)) return (JSON.parse(ls.getItem(k) ?? '{}') as { access_token?: string }).access_token;
    }
  } catch {
    /* kein Token */
  }
  return undefined;
}

async function aufrufen<T>(pfad: string, body?: unknown): Promise<Ergebnis<T>> {
  const token = zugangsToken();
  let r: Response;
  try {
    r = await fetch(pfad, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify({ ...(body as object), betriebId: cloud().konto()?.betriebId }),
    });
  } catch {
    return { ok: false, nichtVerbunden: true };
  }
  const json = (await r.json().catch(() => undefined)) as (T & { fehler?: string }) | undefined;
  // 501 = Schlüssel fehlen; 404 oder HTML = keine Server-Funktionen (lokale Entwicklung, statisches Hosting)
  if (r.status === 501 || r.status === 404 || json === undefined) return { ok: false, nichtVerbunden: true };
  if (!r.ok) return { ok: false, fehler: json.fehler ?? 'Das hat gerade nicht geklappt. Versuch es gleich noch einmal.' };
  return { ok: true, daten: json };
}

export const aboApi = {
  stand: () => {
    const betrieb = cloud().konto()?.betriebId;
    return aufrufen<AboAntwort>(`/api/abo/stand${betrieb ? `?betrieb=${encodeURIComponent(betrieb)}` : ''}`);
  },
  /** Stripe Checkout (SEPA-Lastschrift zuerst, Karte) – oder bei laufendem Abo Planwechsel */
  checkout: (planId: PlanId, intervall: Intervall) =>
    aufrufen<{ url?: string; plan?: string }>('/api/abo/checkout', { planId, intervall }),
  portal: () => aufrufen<{ url: string }>('/api/abo/portal', { aktion: 'portal' }),
  kuendigen: (grund: string | undefined, text: string | undefined) => aufrufen<{ plan: string }>('/api/abo/portal', { aktion: 'kuendigen', grund, text }),
  fortsetzen: () => aufrufen<{ plan: string }>('/api/abo/portal', { aktion: 'fortsetzen' }),
};

export const NICHT_VERBUNDEN_TEXT = 'Bezahlen wird gerade eingerichtet – du kannst weiter testen.';
