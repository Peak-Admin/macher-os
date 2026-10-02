/**
 * Betriebsbereiche: Kosten, die zu keinem Auftrag gehören (Lager, Büro, Fahrzeuge …).
 * Ein Beleg gehört entweder zu einem Auftrag oder zu einem Bereich. Die Liste ist in den Einstellungen anpassbar.
 */
import { db } from '@core/db';
import { einstellung, setzeEinstellung } from '@core/einstellungen';
import type { ID } from '@core/objects';
import type { BelegX } from '../rechnungen/typen';

export const BEREICHE_KEY = 'belege.bereiche';

export const STANDARD_BEREICHE = ['Lager', 'Büro', 'Mitarbeiter', 'Fahrzeuge', 'Werkstatt', 'Sonstiges'];

export const betriebsbereiche = (): string[] => einstellung<string[]>(BEREICHE_KEY, STANDARD_BEREICHE);

/** Liste bereinigen: Leerzeichen weg, leere und doppelte Einträge raus (Groß-/Kleinschreibung egal) */
export function bereicheBereinigen(liste: string[]): string[] {
  const gesehen = new Set<string>();
  const out: string[] = [];
  for (const roh of liste) {
    const name = roh.trim().replace(/\s+/g, ' ');
    if (!name || gesehen.has(name.toLowerCase())) continue;
    gesehen.add(name.toLowerCase());
    out.push(name);
  }
  return out;
}

export function bereicheSpeichern(liste: string[]) {
  setzeEinstellung(BEREICHE_KEY, bereicheBereinigen(liste));
}

export interface BereichVorschlag {
  bereich: string;
  grund: string;
  /** eindeutig genug, dass Macher selbst zuordnet (sonst nur Vorschlag zum Übernehmen) */
  sicher: boolean;
}

type BelegInfo = Pick<BelegX, 'art' | 'lieferantId' | 'lieferantName' | 'kategorie'> & { id?: ID };

const lieferantSchluessel = (b: Pick<BelegX, 'lieferantId' | 'lieferantName'>) =>
  b.lieferantId ? `id:${b.lieferantId}` : b.lieferantName?.trim() ? `name:${b.lieferantName.trim().toLowerCase()}` : undefined;

/** Regeln über Art, Lieferantenname und Kategorie → Bereich (Standardnamen) */
const REGELN: { bereich: string; grund: string; sicher?: true; passt: (b: BelegInfo, name: string, kat: string) => boolean }[] = [
  { bereich: 'Fahrzeuge', grund: 'Tankbeleg', sicher: true, passt: (b) => b.art === 'tankbeleg' },
  { bereich: 'Fahrzeuge', grund: 'Tankstelle oder Kfz-Werkstatt', sicher: true, passt: (_, n) => /tankstelle|aral|shell|esso|\bjet\b|totalenergies|avia|\bomv\b|agip|kfz|autohaus|reifen|atu\b|a\.t\.u|dekra|tüv|tuev|waschstraße|waschanlage/.test(n) },
  { bereich: 'Fahrzeuge', grund: 'Kategorie Fahrzeug', passt: (_, __, k) => /fahrzeug|kfz|auto|tank/.test(k) },
  { bereich: 'Büro', grund: 'Büro, Telefon oder Porto', passt: (_, n, k) => /büro|buero|porto|telefon|internet/.test(k) || /telekom|vodafone|o2\b|1&1|deutsche post|dhl|staples|viking|büro|buero|papier/.test(n) },
  { bereich: 'Werkstatt', grund: 'Werkzeug', passt: (_, n, k) => /werkzeug|maschine/.test(k) || /würth|wuerth|hilti|berner|förch|foerch|werkzeug/.test(n) },
  { bereich: 'Mitarbeiter', grund: 'Arbeitskleidung oder Schutzausrüstung', passt: (_, n, k) => /kleidung|schutz|psa|verpflegung/.test(k) || /engelbert strauss|strauss|arbeitskleidung|bäckerei|baeckerei/.test(n) },
  { bereich: 'Lager', grund: 'Material ohne Auftrag – fürs Lager', passt: (_, __, k) => k === 'material' },
];

/**
 * Welcher Betriebsbereich passt? Zuerst der Bereich, in den derselbe Lieferant zuletzt gebucht wurde,
 * dann Regeln (Tankbeleg → Fahrzeuge …). Nur Bereiche, die es in der Liste gibt.
 */
export function bereichVorschlag(b: BelegInfo, alle: BelegX[] = db.belege.all() as BelegX[], bereiche: string[] = betriebsbereiche()): BereichVorschlag | undefined {
  const gibt = (x: string) => bereiche.find((y) => y.toLowerCase() === x.toLowerCase());
  const schluessel = lieferantSchluessel(b);
  if (schluessel) {
    const frueher = alle
      .filter((x) => x.id !== b.id && x.bereich && !x.auftragId && lieferantSchluessel(x) === schluessel)
      .sort((x, y) => y.datum.localeCompare(x.datum) || y.erstelltAm.localeCompare(x.erstelltAm));
    const treffer = frueher.map((x) => gibt(x.bereich!)).find(Boolean);
    if (treffer) return { bereich: treffer, grund: 'Gleicher Lieferant wie bei früheren Belegen', sicher: true };
  }
  const name = (b.lieferantName ?? db.lieferanten.get(b.lieferantId)?.name ?? '').toLowerCase();
  const kat = (b.kategorie ?? '').toLowerCase();
  for (const r of REGELN) {
    const bereich = gibt(r.bereich);
    if (bereich && r.passt(b, name, kat)) return { bereich, grund: r.grund, sicher: !!r.sicher };
  }
  return undefined;
}

/** Zuordnung: entweder Auftrag oder Bereich – das jeweils andere wird geleert */
export const zuAuftrag = (auftragId: ID | undefined): Partial<BelegX> => ({ auftragId, bereich: undefined, zuordnungGrund: undefined });
export const zuBereich = (bereich: string | undefined): Partial<BelegX> => ({ bereich, auftragId: undefined, zuordnungGrund: undefined });
