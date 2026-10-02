/**
 * Brücke zur Kalkulation (Paket vertrieb, Sammlung `kalkulationen` aus `modules/kalkulation`).
 *
 * Die Soll-Werte werden mit derselben Rechnung ermittelt wie im Kalkulations-Editor (`rechne`),
 * damit Vor- und Nachkalkulation dieselben Zahlen zeigen.
 */
import type { Cent, ID } from '@core/objects';
import { db } from '@core/db';
import { kalkulationen, rechne, type Kalkulation } from '@modules/kalkulation/daten';

export interface SollKalkulation {
  stunden?: number;
  /** Material-EK + Fremdleistung (vergleichbar mit Material & Belegen im Ist) */
  material?: Cent;
  /** Einzelkosten (Lohn zu Lohnkosten + Material + Fremdleistung) – vergleichbar mit den Ist-Kosten */
  kosten?: Cent;
  /** Verkaufspreis laut Kalkulation */
  netto?: Cent;
}

/** Soll-Werte aus einer Kalkulation */
export function kalkulationLesen(k: Pick<Kalkulation, 'zeilen' | 'lohnkosten' | 'gemeinkostenProzent' | 'materialZuschlagProzent' | 'wagnisGewinnProzent'>): SollKalkulation | undefined {
  if (!k.zeilen?.length) return undefined;
  const { summe } = rechne(k);
  return {
    stunden: summe.stunden,
    material: summe.material + summe.fremd,
    kosten: summe.einzelkosten,
    netto: summe.preis,
  };
}

/** Maßgebliche Kalkulation eines Auftrags: die zum angenommenen Angebot, sonst die zuletzt geänderte */
export function kalkulationZuAuftrag(auftragId: ID, liste: Kalkulation[] = kalkulationen.all()): Kalkulation | undefined {
  const passend = liste
    .filter((k) => k.auftragId === auftragId && k.zeilen?.length)
    .sort((a, b) => b.geaendertAm.localeCompare(a.geaendertAm));
  const angenommen = new Set(db.angebote.where((a) => a.auftragId === auftragId && a.status === 'angenommen').map((a) => a.id));
  return passend.find((k) => k.angebotId && angenommen.has(k.angebotId)) ?? passend[0];
}

export function kalkulationFuer(auftragId: ID): SollKalkulation | undefined {
  const k = kalkulationZuAuftrag(auftragId);
  return k ? kalkulationLesen(k) : undefined;
}
