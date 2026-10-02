/**
 * Positionen aus gesprochenem oder getipptem Text – lokal, ohne Netz.
 *
 * „Zwei Steckdosen setzen, zehn Meter Leitung, Anfahrt“
 *   → 2 Stk Steckdose setzen inkl. Dose · 10 m Leitung verlegen · 1 Psch Anfahrtspauschale
 *
 * Der Text wird in Teile zerlegt (Komma, „und“, „plus“ …). Je Teil: Menge (Ziffern oder Zahlwort),
 * Einheit (Meter, Stunden …) und die passende Leistung aus dem Katalog. Katalogpreis gilt.
 * Was nicht im Katalog steht, wird eine freie Position ohne Preis – der Handwerker sieht das sofort.
 */
import type { Artikel, Einheit, Leistung } from '@core/objects';

export interface Erkannt {
  /** Originaltext dieses Teils */
  roh: string;
  menge: number;
  /** gesprochene Einheit (falls genannt) */
  einheit?: Einheit;
  leistung?: Leistung;
  artikel?: Artikel;
}

// ------------------------------------------------------------------ Normalisieren

export function normal(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9²³,.\s-]/g, ' ')
    .replace(/-/g, ' ');
}

function woerter(s: string): string[] {
  return normal(s)
    .split(/\s+/)
    .map((w) => w.replace(/^[.,]+|[.,]+$/g, ''))
    .filter(Boolean);
}

/** grober Wortstamm: Plural-/Beugungsendungen ab, Mindestlänge 4 */
export function stamm(w: string): string {
  for (const s of ['ungen', 'en', 'er', 'es', 'e', 'n', 's']) {
    if (w.endsWith(s) && w.length - s.length >= 4) return w.slice(0, -s.length);
  }
  return w;
}

// ------------------------------------------------------------------ Zahlen

const EINS: Record<string, number> = {
  null: 0,
  ein: 1,
  eine: 1,
  einen: 1,
  einem: 1,
  einer: 1,
  eins: 1,
  zwei: 2,
  zwo: 2,
  drei: 3,
  vier: 4,
  fuenf: 5,
  sechs: 6,
  sieben: 7,
  acht: 8,
  neun: 9,
  zehn: 10,
  elf: 11,
  zwoelf: 12,
  dreizehn: 13,
  vierzehn: 14,
  fuenfzehn: 15,
  sechzehn: 16,
  siebzehn: 17,
  achtzehn: 18,
  neunzehn: 19,
  zwanzig: 20,
  dreissig: 30,
  vierzig: 40,
  fuenfzig: 50,
  sechzig: 60,
  siebzig: 70,
  achtzig: 80,
  neunzig: 90,
  dutzend: 12,
  halb: 0.5,
  halbe: 0.5,
  halben: 0.5,
  anderthalb: 1.5,
};

/** Zahlwort oder Ziffer → Zahl. „fünfundzwanzig“ → 25, „zweieinhalb“ → 2,5, „2,5“ → 2,5 */
export function zahlAusWort(wort: string): number | undefined {
  const w = normal(wort).trim();
  if (!w) return undefined;
  if (/^\d+([.,]\d+)?$/.test(w)) return Number(w.replace(',', '.'));
  if (w in EINS) return EINS[w];
  if (w.endsWith('einhalb') && w.length > 7) {
    const vorne = zahlAusWort(w.slice(0, -7) || 'ein');
    return vorne === undefined ? undefined : vorne + 0.5;
  }
  const tausend = w.indexOf('tausend');
  if (tausend >= 0) {
    const vorne = tausend ? zahlAusWort(w.slice(0, tausend)) : 1;
    const hinten = w.slice(tausend + 7);
    const rest = hinten ? zahlAusWort(hinten.replace(/^und/, '')) : 0;
    return vorne === undefined || rest === undefined ? undefined : vorne * 1000 + rest;
  }
  const hundert = w.indexOf('hundert');
  if (hundert >= 0) {
    const vorne = hundert ? zahlAusWort(w.slice(0, hundert)) : 1;
    const hinten = w.slice(hundert + 7);
    const rest = hinten ? zahlAusWort(hinten.replace(/^und/, '')) : 0;
    return vorne === undefined || rest === undefined ? undefined : vorne * 100 + rest;
  }
  const und = w.indexOf('und');
  if (und > 0) {
    const einer = EINS[w.slice(0, und)];
    const zehner = EINS[w.slice(und + 3)];
    if (einer !== undefined && einer < 10 && zehner !== undefined && zehner >= 20 && zehner % 10 === 0) return zehner + einer;
  }
  return undefined;
}

// ------------------------------------------------------------------ Einheiten

const EINHEITEN: Record<string, Einheit> = {
  m: 'm',
  meter: 'm',
  metern: 'm',
  lfm: 'm',
  laufmeter: 'm',
  qm: 'm²',
  'm²': 'm²',
  m2: 'm²',
  quadratmeter: 'm²',
  quadratmetern: 'm²',
  'm³': 'm³',
  m3: 'm³',
  cbm: 'm³',
  kubikmeter: 'm³',
  h: 'h',
  std: 'h',
  stunde: 'h',
  stunden: 'h',
  stk: 'Stk',
  stueck: 'Stk',
  psch: 'Psch',
  pauschal: 'Psch',
  kg: 'kg',
  kilo: 'kg',
  kilogramm: 'kg',
  l: 'l',
  liter: 'l',
  km: 'km',
  kilometer: 'km',
};

export function einheitAusWort(w: string): Einheit | undefined {
  return EINHEITEN[normal(w).trim()];
}

const FUELLWOERTER = new Set(
  'der die das den dem des mal x neue neuen neu bitte noch mit inkl inklusive im in auf am an zu fuer von vom zum zur bei aus oder je pro und plus dann auch ca circa etwa so ungefaehr machen'.split(' '),
);

// ------------------------------------------------------------------ Zerlegen

/** Teile des Satzes: Komma, Semikolon, Zeilenumbruch, Punkt am Satzende, „und“, „plus“, „sowie“, „dazu“ */
export function zerlegen(text: string): string[] {
  return text
    .split(/[,;\n]+(?!\d)|\.(?=\s|$)|\s+(?:und|plus|sowie|dazu|außerdem)\s+/i)
    .map((t) => t.trim())
    .filter(Boolean);
}

interface Teil {
  menge?: number;
  einheit?: Einheit;
  inhalt: string[];
}

function teilLesen(roh: string): Teil {
  const t: Teil = { inhalt: [] };
  for (const w of woerter(roh)) {
    const z = zahlAusWort(w);
    if (z !== undefined && t.menge === undefined) {
      t.menge = z;
      continue;
    }
    if (z !== undefined && (w === 'halb' || w === 'halbe' || w === 'halben') && t.menge !== undefined) {
      t.menge += 0.5;
      continue;
    }
    const e = einheitAusWort(w);
    if (e && !t.einheit) {
      t.einheit = e;
      continue;
    }
    if (FUELLWOERTER.has(w) || z !== undefined) continue;
    if (w.length < 3) continue;
    t.inhalt.push(stamm(w));
  }
  return t;
}

/** Wie gut passt ein Katalogname zu den Inhaltswörtern? 0 = gar nicht */
export function treffer(inhalt: string[], name: string): number {
  const namen = woerter(name).map(stamm);
  let punkte = 0;
  for (const w of inhalt) {
    let best = 0;
    for (const n of namen) {
      if (n === w) best = Math.max(best, 3);
      else if (w.length >= 4 && n.length >= 4 && (n.startsWith(w) || w.startsWith(n))) best = Math.max(best, 2);
      else if (w.length >= 5 && n.includes(w)) best = Math.max(best, 1);
    }
    punkte += best;
  }
  return punkte;
}

function bester<T extends { name: string }>(inhalt: string[], liste: T[], einheit: Einheit | undefined, einheitVon: (x: T) => Einheit) {
  let wahl: T | undefined;
  let max = 0;
  for (const x of liste) {
    const p = treffer(inhalt, x.name);
    if (p < 2) continue;
    const mitEinheit = p + (einheit && einheitVon(x) === einheit ? 1 : 0);
    if (mitEinheit > max) {
      max = mitEinheit;
      wahl = x;
    }
  }
  return { wahl, punkte: max };
}

/**
 * Text → erkannte Positionen. Leistungen haben Vorrang vor Material.
 * `leistungen` und `artikel` sollten nur aktive Einträge enthalten.
 */
export function positionenErkennen(text: string, leistungen: Leistung[], artikel: Artikel[] = []): Erkannt[] {
  const ergebnis: Erkannt[] = [];
  for (const roh of zerlegen(text)) {
    const t = teilLesen(roh);
    if (!t.inhalt.length && t.menge === undefined) continue;
    const l = bester(t.inhalt, leistungen, t.einheit, (x) => x.einheit);
    const a = bester(t.inhalt, artikel, t.einheit, (x) => x.einheit);
    const e: Erkannt = { roh, menge: t.menge ?? 1, einheit: t.einheit };
    if (l.wahl && l.punkte >= a.punkte) e.leistung = l.wahl;
    else if (a.wahl) e.artikel = a.wahl;
    if (!t.inhalt.length && !e.leistung && !e.artikel) continue;
    ergebnis.push(e);
  }
  return ergebnis;
}

/** Ersten Buchstaben groß – für freie Positionen aus dem gesprochenen Text */
export function satzAnfang(s: string): string {
  const t = s.trim();
  return t ? t[0].toUpperCase() + t.slice(1) : t;
}
