/**
 * Optionale Brücke zur Kalkulation (Paket vertrieb, Sammlung `kalkulationen`).
 *
 * Die Sammlung gehört dem Modul `kalkulation`. Wir lesen sie nur, wenn es das Modul gibt
 * (`import.meta.glob` liefert sonst nichts) und greifen tolerant auf übliche Feldnamen zu.
 * Kernwunsch: gemeinsamer Typ `Kalkulation` mit `sollStunden`, `sollMaterial`, `sollKosten`.
 */
import type { Cent, ID } from '@core/objects';

export interface SollKalkulation {
  stunden?: number;
  material?: Cent;
  kosten?: Cent;
  netto?: Cent;
}

type Roh = Record<string, unknown>;

const module = import.meta.glob<Record<string, unknown>>('../kalkulation/daten.ts', { eager: true });

function sammlung(): { all: () => Roh[] } | undefined {
  for (const m of Object.values(module)) {
    const c = m.kalkulationen as { all?: () => Roh[] } | undefined;
    if (c && typeof c.all === 'function') return c as { all: () => Roh[] };
  }
  return undefined;
}

function zahl(r: Roh, ...felder: string[]): number | undefined {
  for (const f of felder) {
    const v = r[f];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
  }
  return undefined;
}

/** Kalkulationswerte aus einem Rohobjekt lesen (tolerant gegenüber Feldnamen) */
export function kalkulationLesen(r: Roh): SollKalkulation | undefined {
  const minuten = zahl(r, 'sollMinuten', 'minuten', 'gesamtMinuten');
  const k: SollKalkulation = {
    stunden: zahl(r, 'sollStunden', 'stunden', 'gesamtStunden', 'arbeitsstunden') ?? (minuten != null ? minuten / 60 : undefined),
    material: zahl(r, 'sollMaterial', 'materialEk', 'materialkosten', 'materialKosten'),
    kosten: zahl(r, 'sollKosten', 'selbstkosten', 'gesamtkosten', 'kosten'),
    netto: zahl(r, 'netto', 'verkaufspreis', 'preis', 'angebotssumme'),
  };
  return Object.values(k).some((v) => v != null) ? k : undefined;
}

export function kalkulationFuer(auftragId: ID): SollKalkulation | undefined {
  try {
    const liste = sammlung()?.all() ?? [];
    const passend = liste
      .filter((r) => r.auftragId === auftragId)
      .sort((a, b) => String(b.geaendertAm ?? '').localeCompare(String(a.geaendertAm ?? '')));
    return passend.length ? kalkulationLesen(passend[0]) : undefined;
  } catch {
    return undefined;
  }
}
