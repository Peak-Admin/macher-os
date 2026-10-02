/** Fortlaufende Nummernkreise (A-2026-0001, AN-…, R-…). GoBD: lückenlos je Kreis und Jahr. */
import { db } from './db';

const kreise = {
  auftrag: { praefix: 'A', liste: () => db.auftraege.allMitGeloeschten().map((x) => x.nummer) },
  angebot: { praefix: 'AN', liste: () => db.angebote.allMitGeloeschten().map((x) => x.nummer) },
  rechnung: { praefix: 'R', liste: () => db.rechnungen.allMitGeloeschten().map((x) => x.nummer) },
} as const;

export type Nummernkreis = keyof typeof kreise;

export function naechsteNummer(kreis: Nummernkreis, jahr = new Date().getFullYear()): string {
  const { praefix, liste } = kreise[kreis];
  const start = `${praefix}-${jahr}-`;
  const max = liste()
    .filter((n) => n?.startsWith(start))
    .map((n) => Number(n.slice(start.length)))
    .filter(Number.isFinite)
    .reduce((m, n) => Math.max(m, n), 0);
  return `${start}${String(max + 1).padStart(4, '0')}`;
}
