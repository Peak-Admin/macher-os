/** Wissen & Anleitungen: Firmenwissen, Abläufe, Herstellerinfos – verknüpft mit Anlagentyp, Leistung, Gewerk. */
import { defineCollection } from '@core/db';
import type { Basis, Gewerk, ID } from '@core/objects';

export interface WissensArtikel extends Basis {
  titel: string;
  kategorie: string;
  /** einfacher Text: `# Überschrift`, `- Punkt`, `1. Schritt`, `**fett**`, Leerzeile = Absatz */
  text: string;
  /** leer = gilt für jedes Gewerk */
  gewerk?: Gewerk;
  /** passende Anlagentypen, z. B. „Gasheizung“ */
  anlagentypen?: string[];
  leistungIds?: ID[];
  links?: { titel: string; url: string }[];
  /** Fotos liegen als `dokumente` (art `foto`) */
  fotoIds?: ID[];
}

export const wissen = defineCollection<WissensArtikel>('wissen');

export const KATEGORIEN = ['Wartung', 'Ausführung', 'Störung', 'Sicherheit', 'Abläufe im Betrieb', 'Hersteller'];

// ------------------------------------------------------------------ Text → Blöcke

export type Block =
  | { typ: 'h1' | 'h2' | 'p'; text: string }
  | { typ: 'ul' | 'ol'; punkte: string[] };

/** Zerlegt den einfachen Text in Blöcke (Überschriften, Absätze, Listen) */
export function textBloecke(text: string): Block[] {
  const bloecke: Block[] = [];
  let absatz: string[] = [];
  const absatzEnde = () => {
    if (absatz.length) bloecke.push({ typ: 'p', text: absatz.join(' ') });
    absatz = [];
  };
  for (const roh of text.split(/\r?\n/)) {
    const z = roh.trim();
    const ul = /^[-*•]\s+(.*)$/.exec(z);
    const ol = /^\d+[.)]\s+(.*)$/.exec(z);
    if (!z) {
      absatzEnde();
    } else if (z.startsWith('## ')) {
      absatzEnde();
      bloecke.push({ typ: 'h2', text: z.slice(3).trim() });
    } else if (z.startsWith('# ')) {
      absatzEnde();
      bloecke.push({ typ: 'h1', text: z.slice(2).trim() });
    } else if (ul || ol) {
      absatzEnde();
      const typ = ul ? 'ul' : 'ol';
      const punkt = (ul ?? ol)![1];
      const letzter = bloecke[bloecke.length - 1];
      if (letzter && letzter.typ === typ) letzter.punkte.push(punkt);
      else bloecke.push({ typ, punkte: [punkt] });
    } else {
      absatz.push(z);
    }
  }
  absatzEnde();
  return bloecke;
}

/** `**fett**` → Teile mit Markierung */
export function fettTeile(text: string): { text: string; fett: boolean }[] {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((t) => (t.startsWith('**') && t.endsWith('**') && t.length > 4 ? { text: t.slice(2, -2), fett: true } : { text: t, fett: false }));
}

// ------------------------------------------------------------------ Passende Artikel

export interface Vorschlag {
  artikel: WissensArtikel;
  /** warum passt der Artikel? z. B. „Anlage: Gasheizung“ */
  gruende: string[];
  punkte: number;
}

const norm = (s: string) => s.trim().toLowerCase();

/**
 * Welche Artikel passen zu einem Auftrag oder einer Anlage?
 * Anlagentyp zählt mehr als Leistung. Artikel anderer Gewerke fallen raus.
 */
export function passendeArtikel(
  artikel: WissensArtikel[],
  q: { anlagentypen?: string[]; leistungIds?: ID[]; gewerk?: Gewerk },
  leistungName: (id: ID) => string | undefined = () => undefined,
): Vorschlag[] {
  const typen = new Set((q.anlagentypen ?? []).map(norm));
  const leistungen = new Set(q.leistungIds ?? []);
  return artikel
    .filter((a) => !a.gewerk || !q.gewerk || a.gewerk === q.gewerk)
    .map((a) => {
      const gruende: string[] = [];
      let punkte = 0;
      for (const t of a.anlagentypen ?? []) {
        if (typen.has(norm(t))) {
          gruende.push(`Anlage: ${t}`);
          punkte += 3;
        }
      }
      for (const id of a.leistungIds ?? []) {
        if (leistungen.has(id)) {
          gruende.push(`Leistung: ${leistungName(id) ?? 'im Auftrag'}`);
          punkte += 2;
        }
      }
      return { artikel: a, gruende, punkte };
    })
    .filter((v) => v.punkte > 0)
    .sort((a, b) => b.punkte - a.punkte || a.artikel.titel.localeCompare(b.artikel.titel, 'de'));
}

export function istSichererLink(url: string) {
  return /^https?:\/\/[^\s]+\.[^\s]+$/i.test(url.trim());
}
