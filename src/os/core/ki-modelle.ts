/**
 * Anschluss der Modell-Lanes an den Macher AI Gateway.
 *
 * Fragt `/api/ki/gateway`, welche Lanes eingerichtet sind, und meldet je Lane einen Adapter an
 * (`registriereModell`). Ohne Server oder ohne Schlüssel passiert nichts – dann bleibt alles bei Regeln (Lane 0).
 * Der Browser schickt nur den Satz und den minimalen Kontext der Absicht, nie die ganze Datenbank.
 */
import { kostenBuchen, LANES, registriereModell, type ModellAdapter } from './gateway';

export const KI_GATEWAY_PFAD = '/api/ki/gateway';

type Holen = typeof fetch;

async function post<T>(holen: Holen, body: unknown, ms: number): Promise<T | undefined> {
  const abbruch = new AbortController();
  const t = setTimeout(() => abbruch.abort(), ms);
  try {
    const res = await holen(KI_GATEWAY_PFAD, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: abbruch.signal });
    if (!res.headers.get('content-type')?.includes('json')) return undefined;
    const daten = (await res.json()) as T & { kostenCent?: number };
    kostenBuchen(daten.kostenCent ?? 0);
    return res.ok ? daten : undefined;
  } catch {
    return undefined;
  } finally {
    clearTimeout(t);
  }
}

export function adapterFuer(lane: 1 | 2 | 3, holen: Holen = fetch): ModellAdapter {
  const basis = { lane, name: LANES[lane].name, verfuegbar: () => true };
  if (lane === 1)
    return {
      ...basis,
      async erkenne(text, absichten) {
        const r = await post<{ absicht?: string; sicherheit?: number; werte?: Record<string, unknown> }>(holen, { lane, aufgabe: 'erkennen', text, absichten }, 5000);
        return r?.absicht ? { absicht: r.absicht, sicherheit: r.sicherheit ?? 0, werte: r.werte } : undefined;
      },
    };
  return {
    ...basis,
    async schreibe(text, kontext) {
      const r = await post<{ text?: string }>(holen, { lane, aufgabe: 'schreiben', text, kontext }, 20000);
      if (!r?.text) throw new Error('Kein Text');
      return r.text;
    },
  };
}

let verbunden: Promise<(1 | 2 | 3)[]> | undefined;

/** Einmal beim Start: eingerichtete Lanes anmelden. Gibt die angemeldeten Lanes zurück. */
export function verbindeModelle(holen: Holen | undefined = typeof fetch === 'undefined' ? undefined : fetch): Promise<(1 | 2 | 3)[]> {
  if (!holen) return Promise.resolve([]);
  verbunden ??= (async () => {
    try {
      const res = await holen(KI_GATEWAY_PFAD);
      if (!res.ok || !res.headers.get('content-type')?.includes('json')) return [];
      const { lanes } = (await res.json()) as { lanes?: Record<string, boolean> };
      const frei = ([1, 2, 3] as const).filter((l) => lanes?.[l]);
      frei.forEach((l) => registriereModell(adapterFuer(l, holen)));
      return frei;
    } catch {
      return [];
    }
  })();
  return verbunden;
}

/** Für Tests */
export function verbindungZuruecksetzen() {
  verbunden = undefined;
}
