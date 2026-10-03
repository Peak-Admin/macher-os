/**
 * Kunden: Namen, Telefon und E-Mail normalisieren, Dubletten erkennen, Kundennummern vergeben – rein, ohne Datenzugriff.
 * Läuft in der App (`daten.ts`) und auf dem Server (Partner-Schnittstelle, `src/os/server/partner`).
 */
import type { ID, Kunde } from '@core/objects';

// ------------------------------------------------------------------ Normalisieren

const ANREDEN = /\b(familie|fam|herr|herrn|frau|hr|fr|dr|prof|eheleute)\b\.?/g;
const RECHTSFORMEN = /\b(gmbh|ug|kg|ag|ohg|gbr|e\.?k|mbh|co|haftungsbeschränkt)\b\.?/g;

export function normName(s: string | undefined): string {
  return (s ?? '')
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(ANREDEN, ' ')
    .replace(RECHTSFORMEN, ' ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Telefonnummer auf Ziffern, +49/0049 → 0 */
export function normTelefon(t: string | undefined): string {
  let z = (t ?? '').replace(/[^\d+]/g, '');
  if (z.startsWith('+49')) z = '0' + z.slice(3);
  else if (z.startsWith('0049')) z = '0' + z.slice(4);
  return z.replace(/\D/g, '');
}

export function normEmail(e: string | undefined): string {
  return (e ?? '').trim().toLowerCase();
}

function normStrasse(s: string | undefined): string {
  return normName(s).replace(/strasse\b|str\b/g, 'str').replace(/\s/g, '');
}

function namensTeile(s: string | undefined): string[] {
  return normName(s)
    .split(' ')
    .filter((w) => w.length >= 3);
}

// ------------------------------------------------------------------ Dubletten

export interface Dublette {
  a: Kunde;
  b: Kunde;
  gruende: string[];
}

export type KundeVergleich = Pick<Kunde, 'name' | 'firma' | 'telefon' | 'email' | 'adresse' | 'ansprechpartner'>;

/** Gründe, warum zwei Kunden dieselbe Person/Firma sein könnten (leer = keine Dublette) */
export function dublettenGruende(a: KundeVergleich, b: KundeVergleich): string[] {
  const g: string[] = [];
  const telA = [a.telefon, ...(a.ansprechpartner ?? []).map((x) => x.telefon)].map(normTelefon).filter((t) => t.length >= 6);
  const telB = new Set([b.telefon, ...(b.ansprechpartner ?? []).map((x) => x.telefon)].map(normTelefon).filter((t) => t.length >= 6));
  if (telA.some((t) => telB.has(t))) g.push('gleiche Telefonnummer');
  if (normEmail(a.email) && normEmail(a.email) === normEmail(b.email)) g.push('gleiche E-Mail');

  const na = normName(a.name);
  const nb = normName(b.name);
  const ta = namensTeile(a.name).sort().join(' ');
  const tb = namensTeile(b.name).sort().join(' ');
  if (na && (na === nb || (ta && ta === tb))) g.push('gleicher Name');
  else if (a.adresse && b.adresse && normStrasse(a.adresse.strasse) && normStrasse(a.adresse.strasse) === normStrasse(b.adresse.strasse) && a.adresse.plz === b.adresse.plz) {
    const gemeinsam = namensTeile(a.name).some((w) => namensTeile(b.name).includes(w));
    if (gemeinsam) g.push('ähnlicher Name und gleiche Adresse');
  }
  return g;
}

export const paarSchluessel = (a: ID, b: ID) => [a, b].sort().join('|');

export function findeDubletten(kunden: Kunde[], ignoriert: Set<string> = new Set()): Dublette[] {
  const liste: Dublette[] = [];
  for (let i = 0; i < kunden.length; i++) {
    for (let j = i + 1; j < kunden.length; j++) {
      const a = kunden[i];
      const b = kunden[j];
      if (ignoriert.has(paarSchluessel(a.id, b.id))) continue;
      const gruende = dublettenGruende(a, b);
      if (gruende.length) liste.push({ a, b, gruende });
    }
  }
  return liste;
}

/** Mögliche Dubletten zu einem Kunden, der gerade angelegt wird */
export function aehnlicheKunden<K extends KundeVergleich>(neu: KundeVergleich, kunden: K[]): K[] {
  return kunden.filter((k) => dublettenGruende(neu, k).length > 0);
}

/** Nächste Kundennummer `K-1001`, `K-1002` … – gelöschte Kunden mitgeben, damit keine Nummer doppelt vergeben wird */
export function kundennummerNach(kunden: Pick<Kunde, 'nummer'>[]): string {
  const max = kunden
    .map((k) => Number(k.nummer?.match(/^K-(\d+)$/)?.[1]))
    .filter(Number.isFinite)
    .reduce((m, n) => Math.max(m, n), 1000);
  return `K-${max + 1}`;
}
