/** Fortlaufende Nummernkreise (A-2026-0001, AN-…, R-…). GoBD: lückenlos je Kreis und Jahr. */
import { db } from './db';

const kreise = {
  auftrag: { praefix: 'A', liste: () => db.auftraege.allMitGeloeschten().map((x) => x.nummer) },
  angebot: { praefix: 'AN', liste: () => db.angebote.allMitGeloeschten().map((x) => x.nummer) },
  rechnung: { praefix: 'R', liste: () => db.rechnungen.allMitGeloeschten().map((x) => x.nummer) },
} as const;

export type Nummernkreis = keyof typeof kreise;

export interface NummerOptionen {
  jahr?: number;
  /** Stellen der laufenden Nummer (Standard 4 → 0001) */
  stellen?: number;
}

/**
 * Nächste Nummer `<praefix>-<jahr>-<lfd>` für einen beliebigen Nummernkreis – auch für Modul-Sammlungen
 * (z. B. `naechsteNummerFuer('BR', berichte.allMitGeloeschten().map((b) => b.nummer))`).
 * Gelöschte Einträge mitgeben, damit keine Nummer doppelt vergeben wird.
 */
export function naechsteNummerFuer(praefix: string, nummern: (string | undefined)[], opts: NummerOptionen = {}): string {
  const { jahr = new Date().getFullYear(), stellen = 4 } = opts;
  const start = `${praefix}-${jahr}-`;
  const max = nummern
    .filter((n): n is string => !!n?.startsWith(start))
    .map((n) => Number(n.slice(start.length)))
    .filter(Number.isFinite)
    .reduce((m, n) => Math.max(m, n), 0);
  return `${start}${String(max + 1).padStart(stellen, '0')}`;
}

export function naechsteNummer(kreis: Nummernkreis, jahr = new Date().getFullYear()): string {
  const { praefix, liste } = kreise[kreis];
  return naechsteNummerFuer(praefix, liste(), { jahr });
}
