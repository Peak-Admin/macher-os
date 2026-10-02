/**
 * Aufmaß: Räume/Bauteile mit Länge × Breite × Höhe, Abzüge (Fenster, Türen), Stückzahlen.
 * Ergebnis wird direkt als Angebotspositionen übernommen.
 */
import { defineCollection, neueId } from '@core/db';
import type { Basis, Einheit, ID, Leistung, Position } from '@core/objects';

export type MassArt = 'flaeche' | 'wand' | 'laenge' | 'stueck' | 'volumen';

export interface Abzug {
  id: ID;
  text: string;
  breite: number;
  hoehe: number;
  anzahl: number;
}

export interface MassZeile {
  id: ID;
  text: string;
  art: MassArt;
  laenge?: number;
  breite?: number;
  hoehe?: number;
  anzahl: number;
  abzuege: Abzug[];
  /** Leistung aus dem Katalog – bestimmt Preis bei der Übernahme */
  leistungId?: ID;
}

export interface Raum {
  id: ID;
  name: string;
  zeilen: MassZeile[];
}

export interface Aufmass extends Basis {
  auftragId: ID;
  titel: string;
  datum: string;
  raeume: Raum[];
  notiz?: string;
  /** zuletzt übernommen in Angebot */
  angebotId?: ID;
  uebernommenAm?: string;
}

export const aufmasse = defineCollection<Aufmass>('aufmasse');

export const ART_INFO: Record<MassArt, { label: string; einheit: Einheit; felder: ('laenge' | 'breite' | 'hoehe')[]; hilfe: string }> = {
  flaeche: { label: 'Fläche', einheit: 'm²', felder: ['laenge', 'breite'], hilfe: 'Länge × Breite (Boden, Decke, einzelne Wand)' },
  wand: { label: 'Wände rundum', einheit: 'm²', felder: ['laenge', 'breite', 'hoehe'], hilfe: 'Umfang 2 × (L + B) × Höhe' },
  laenge: { label: 'Länge', einheit: 'm', felder: ['laenge'], hilfe: 'laufende Meter (Leitung, Sockelleiste, Rinne)' },
  stueck: { label: 'Stück', einheit: 'Stk', felder: [], hilfe: 'Anzahl (Steckdosen, Fenster, Heizkörper)' },
  volumen: { label: 'Volumen', einheit: 'm³', felder: ['laenge', 'breite', 'hoehe'], hilfe: 'L × B × H (Aushub, Estrich)' },
};

export const FELD_LABEL = { laenge: 'Länge (m)', breite: 'Breite (m)', hoehe: 'Höhe (m)' } as const;

const r2 = (n: number) => Math.round(n * 100) / 100;

export function abzugFlaeche(a: Abzug): number {
  return (a.breite || 0) * (a.hoehe || 0) * (a.anzahl || 0);
}

/** Bruttomenge ohne Abzüge */
export function bruttoMenge(z: MassZeile): number {
  const l = z.laenge ?? 0;
  const b = z.breite ?? 0;
  const h = z.hoehe ?? 0;
  const n = z.anzahl || 0;
  switch (z.art) {
    case 'flaeche':
      return l * b * n;
    case 'wand':
      return 2 * (l + b) * h * n;
    case 'laenge':
      return l * n;
    case 'stueck':
      return n;
    case 'volumen':
      return l * b * h * n;
  }
}

/** Ergebnis einer Zeile (Abzüge nur bei Flächen), nie negativ, auf 2 Stellen */
export function menge(z: MassZeile): number {
  const abz = z.art === 'flaeche' || z.art === 'wand' ? z.abzuege.reduce((s, a) => s + abzugFlaeche(a), 0) : 0;
  return r2(Math.max(0, bruttoMenge(z) - abz));
}

/** Rechenweg als Text, z. B. "2 × (4,2 + 3,5) × 2,5 − 2,8 = 35,7 m²" */
export function rechenweg(z: MassZeile): string {
  const f = (n: number | undefined) => String(r2(n ?? 0)).replace('.', ',');
  const n = z.anzahl && z.anzahl !== 1 ? ` × ${f(z.anzahl)}` : '';
  const basis =
    z.art === 'flaeche'
      ? `${f(z.laenge)} × ${f(z.breite)}${n}`
      : z.art === 'wand'
        ? `2 × (${f(z.laenge)} + ${f(z.breite)}) × ${f(z.hoehe)}${n}`
        : z.art === 'laenge'
          ? `${f(z.laenge)}${n}`
          : z.art === 'volumen'
            ? `${f(z.laenge)} × ${f(z.breite)} × ${f(z.hoehe)}${n}`
            : f(z.anzahl);
  const abz = (z.art === 'flaeche' || z.art === 'wand') && z.abzuege.length ? ` − ${f(z.abzuege.reduce((s, a) => s + abzugFlaeche(a), 0))}` : '';
  return `${basis}${abz} = ${f(menge(z))} ${ART_INFO[z.art].einheit}`;
}

export function neueZeile(art: MassArt = 'flaeche', text = ''): MassZeile {
  return { id: neueId('z'), text, art, anzahl: 1, abzuege: [] };
}

export function neuerRaum(name = ''): Raum {
  return { id: neueId('r'), name, zeilen: [neueZeile('flaeche', 'Boden')] };
}

export function neuerAbzug(text = 'Fenster'): Abzug {
  return text === 'Tür' ? { id: neueId('x'), text, breite: 0.885, hoehe: 2.01, anzahl: 1 } : { id: neueId('x'), text, breite: 1, hoehe: 1, anzahl: 1 };
}

export interface Summe {
  schluessel: string;
  text: string;
  menge: number;
  einheit: Einheit;
  leistungId?: ID;
  raeume: string[];
}

/**
 * Mengen zusammenfassen: gleiche Leistung (oder gleicher Text + Einheit) über alle Räume.
 */
export function zusammenfassen(a: Pick<Aufmass, 'raeume'>, leistungen: Leistung[] = []): Summe[] {
  const m = new Map<string, Summe>();
  for (const r of a.raeume) {
    for (const z of r.zeilen) {
      const q = menge(z);
      if (q <= 0) continue;
      const l = leistungen.find((x) => x.id === z.leistungId);
      const einheit = l?.einheit ?? ART_INFO[z.art].einheit;
      const text = l?.name ?? (z.text.trim() || ART_INFO[z.art].label);
      const key = l ? `l:${l.id}:${einheit}` : `t:${text.toLowerCase()}:${einheit}`;
      const s = m.get(key) ?? { schluessel: key, text, menge: 0, einheit, leistungId: l?.id, raeume: [] };
      s.menge = r2(s.menge + q);
      if (r.name && !s.raeume.includes(r.name)) s.raeume.push(r.name);
      m.set(key, s);
    }
  }
  return [...m.values()];
}

/** Angebotspositionen aus dem Aufmaß – Preise aus dem Leistungskatalog, sonst 0 zum Nachtragen */
export function alsPositionen(a: Pick<Aufmass, 'raeume'>, leistungen: Leistung[]): Position[] {
  return zusammenfassen(a, leistungen).map((s) => {
    const l = leistungen.find((x) => x.id === s.leistungId);
    return {
      id: neueId('p'),
      art: l ? (l.einheit === 'h' ? 'lohn' : 'leistung') : 'pauschal',
      text: s.raeume.length ? `${s.text} (${s.raeume.join(', ')})` : s.text,
      menge: s.menge,
      einheit: s.einheit,
      einzelpreis: l?.preis ?? 0,
      leistungId: l?.id,
    } satisfies Position;
  });
}
