/**
 * Fortlaufende Nummernkreise. Angebote (AN-2026-0001) und Rechnungen (R-…): GoBD-lückenlos je Kreis und Jahr.
 * Aufträge/Projekte: `YYMM-XXX` je Monat (siehe `projektnummer.ts`); ältere Nummern `A-2026-0001` bleiben gültig.
 */
import { db } from './db';
import { nummerFehler, projektNummerFuer } from './projektnummer';

export { AUFTRAGSNUMMER_IM_TEXT, nummerAnzeige, nummerBereinigt, nummerFehler, projektNummerFuer, projektPraefix } from './projektnummer';

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

/**
 * Nächste Nummer eines Kern-Kreises. Aufträge bekommen eine Projektnummer `YYMM-XXX` (Monat von `datum`),
 * Angebote und Rechnungen `<praefix>-<jahr>-<lfd>` (lückenlos je Jahr).
 */
export function naechsteNummer(kreis: Nummernkreis, jahr = new Date().getFullYear(), datum = new Date()): string {
  const { praefix, liste } = kreise[kreis];
  if (kreis === 'auftrag') return projektNummerFuer(liste(), jahr === datum.getFullYear() ? datum : new Date(jahr, datum.getMonth(), 1));
  return naechsteNummerFuer(praefix, liste(), { jahr });
}

/** Prüft eine Auftragsnummer auf Form und Doppel (alle Aufträge inkl. Papierkorb, außer `ausserId`). */
export function auftragsnummerFehler(nummer: string, ausserId?: string): string | undefined {
  return nummerFehler(
    nummer,
    db.auftraege.allMitGeloeschten().filter((a) => a.id !== ausserId).map((a) => a.nummer),
  );
}
