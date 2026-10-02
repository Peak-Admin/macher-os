/** Messpunkte bereinigen: nur Ereignisname und einfache, gekürzte Werte. */
export interface Punkt {
  ereignis?: unknown;
  zeit?: unknown;
  daten?: unknown;
}

export function bereinigen(p: Punkt, installation?: string): { ereignis: string; zeit: string; daten: Record<string, string | number | boolean> } | undefined {
  if (typeof p.ereignis !== 'string' || !/^[a-z0-9_.-]{1,80}$/i.test(p.ereignis)) return undefined;
  const zeit = typeof p.zeit === 'string' && !Number.isNaN(Date.parse(p.zeit)) ? new Date(p.zeit).toISOString() : new Date().toISOString();
  const daten: Record<string, string | number | boolean> = {};
  if (p.daten && typeof p.daten === 'object') {
    for (const [f, w] of Object.entries(p.daten as Record<string, unknown>).slice(0, 20)) {
      if (!/^[a-z0-9_]{1,40}$/i.test(f)) continue;
      if (typeof w === 'number' || typeof w === 'boolean') daten[f] = w;
      else if (typeof w === 'string') daten[f] = w.slice(0, 80);
    }
  }
  if (installation && /^[a-z0-9-]{8,64}$/i.test(installation)) daten.installation = installation;
  return { ereignis: p.ereignis, zeit, daten };
}
