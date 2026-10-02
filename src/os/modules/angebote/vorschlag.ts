/**
 * „Beschreib kurz, was gemacht wird“ → Positionsvorschlag fürs Angebot.
 *
 *   „Bad 8 m² fliesen, alte Fliesen raus, 2 Tage, Material ca. 900 €“
 *     → 8 m² Bodenfliesen verlegen · 8 m² Altbelag entfernen · 16 h Arbeitsstunde · 1 Psch Material 900 €
 *
 * Reihenfolge wie im Macher AI Gateway: zuerst Regeln (dieser Parser, ohne Netz), ein Modell verbessert nur.
 * Preise kommen aus dem Katalog oder aus dem Satz selbst – nie ausgedacht. Fehlt ein Preis, bleibt er 0 („Preis fehlt“).
 * Alles ist ein Vorschlag: Erst wenn du übernimmst, landet es im Angebot. Gesendet wird nie etwas.
 */
import { neueId } from '@core/db';
import type { Artikel, Einheit, Leistung, Position } from '@core/objects';
import { einheitAusWort, normal, satzAnfang, stamm, treffer, zahlAusWort, zerlegen } from '@modules/start/sprache';
import { positionAusArtikel, positionAusLeistung } from './daten';

/** Absicht im Macher AI Gateway (`./gateway.ts`) */
export const POSITIONEN_VORSCHLAGEN = 'offer.positions.suggest';

export interface PositionsVorschlag {
  positionen: Position[];
  /** regeln = Katalog-Abgleich ohne KI · ki = von einem Modell verbessert */
  quelle: 'regeln' | 'ki';
}

/** Arbeitsstunden je genanntem Tag („2 Tage“ → 16 h) */
export const STUNDEN_JE_TAG = 8;

export const EINHEITEN_LISTE: Einheit[] = ['Stk', 'm', 'm²', 'm³', 'h', 'Psch', 'kg', 'l', 'Pkt', 'km'];

// ------------------------------------------------------------------ Bausteine

/** Abkürzungen mit Punkt, die sonst den Satz zerteilen („ca. 900 €“) */
function ohneAbkuerzungen(text: string): string {
  return text.replace(/\b(ca|inkl|zzgl|evtl|bzw|etc)\./gi, '$1').replace(/\bz\.\s?b\./gi, 'zb');
}

const PREIS = /(?:\b(?:ca|circa|etwa|ungefähr|ungefaehr|rund|so)\s+)?(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?\s*(?:€|\beuro\b|\beur\b)/i;

/** Betrag in Cent aus „ca. 900 €“, „1.250,50 Euro“ – oder `undefined` */
export function preisAusText(text: string): { cent: number; rest: string } | undefined {
  const m = PREIS.exec(text);
  if (!m) return undefined;
  const euro = Number(m[1].replace(/\./g, ''));
  const cent = euro * 100 + (m[2] ? Number(m[2].padEnd(2, '0')) : 0);
  return { cent, rest: (text.slice(0, m.index) + ' ' + text.slice(m.index + m[0].length)).replace(/\s+/g, ' ').trim() };
}

/** Alle Beträge, die im Satz genannt sind (in Cent) – nur solche Preise darf ein Modell für freie Positionen setzen. */
export function genanntePreise(text: string): number[] {
  const preise: number[] = [];
  let rest = ohneAbkuerzungen(text);
  for (let p = preisAusText(rest); p; p = preisAusText(rest)) {
    preise.push(p.cent);
    rest = p.rest;
  }
  return preise;
}

const TAGE = /^(?:arbeits)?tag(?:e|en)?$/;
const ABBRUCH_WORTE = ['raus', 'rausreissen', 'rausreisen', 'entfernen', 'entfernt', 'abschlagen', 'abbrechen', 'abreissen', 'demontieren', 'ausbauen', 'rueckbau', 'abbruch', 'weg'];
const ABBRUCH_STAEMME = ['entfern', 'abbruch', 'rueckbau', 'demont', 'abriss', 'ausbau', 'abschlag', 'altbelag'];
const MATERIAL = /^material/;
const LEER = new Set(
  'der die das den dem des mal x neue neuen neu bitte noch mit inkl inklusive im in auf am an zu fuer von vom zum zur bei aus oder je pro und plus dann auch ca circa etwa so ungefaehr rund machen alte alten alter altes'.split(' '),
);

interface Teil {
  roh: string;
  menge?: number;
  einheit?: Einheit;
  tage?: number;
  inhalt: string[];
  abbruch: boolean;
  material: boolean;
  preis?: number;
  jeEinheit: boolean;
}

const UNGEFAEHR = new Set(['ca', 'circa', 'etwa', 'ungefaehr', 'rund']);

function lesen(roh: string): Teil {
  const preis = preisAusText(roh);
  const ohnePreis = preis ? preis.rest : roh;
  const t: Teil = { roh: '', inhalt: [], abbruch: false, material: false, preis: preis?.cent, jeEinheit: /\b(je|pro)\b|à|\//i.test(roh) };
  // Originalwörter für den Text einer freien Position – ohne Menge, Einheit, Tage, „raus“, „ca.“
  const text: string[] = [];
  const toks = ohnePreis.split(/\s+/).filter(Boolean);
  const norm = toks.map((x) => normal(x).trim().replace(/^[.,]+|[.,]+$/g, ''));
  for (let i = 0; i < toks.length; i++) {
    const w = norm[i];
    if (!w) continue;
    const z = zahlAusWort(w);
    if (z !== undefined && TAGE.test(norm[i + 1] ?? '')) {
      t.tage = z;
      i++;
      continue;
    }
    if (z !== undefined && t.menge === undefined && !LEER.has(w)) {
      t.menge = z;
      continue;
    }
    const e = einheitAusWort(w);
    if (e && !t.einheit) {
      t.einheit = e;
      continue;
    }
    if (ABBRUCH_WORTE.includes(w)) {
      t.abbruch = true;
      continue;
    }
    if (UNGEFAEHR.has(w)) continue;
    text.push(toks[i]);
    for (const teil of w.split(/\s+/)) {
      if (MATERIAL.test(teil)) t.material = true;
      if (LEER.has(teil) || zahlAusWort(teil) !== undefined || teil.length < 3) continue;
      t.inhalt.push(stamm(teil));
    }
  }
  t.roh = text.join(' ');
  return t;
}

/** Wie gut passt ein Katalogeintrag? Zusammengesetzte Wörter zählen („fliesen“ ↔ „Bodenfliesen“), die Einheit entscheidet mit. */
export function passung(inhalt: string[], name: string, einheitKatalog: Einheit, einheit?: Einheit): number {
  let p = treffer(inhalt, name);
  const namen = normal(name).split(/\s+/).map(stamm);
  for (const w of inhalt) if (w.length >= 5 && namen.some((n) => n !== w && n.endsWith(w))) p += 1;
  if (!p) return 0;
  if (einheit) p += einheit === einheitKatalog ? 2 : -3;
  return p;
}

function bester<T extends { name: string; einheit: Einheit }>(inhalt: string[], liste: T[], einheit?: Einheit): { wahl?: T; punkte: number } {
  let wahl: T | undefined;
  let punkte = 0;
  for (const x of liste) {
    const p = passung(inhalt, x.name, x.einheit, einheit);
    if (p >= 2 && p > punkte) [wahl, punkte] = [x, p];
  }
  return { wahl, punkte };
}

const istAbbruch = (l: { name: string; kategorie?: string }) => ABBRUCH_STAEMME.some((s) => normal(`${l.name} ${l.kategorie ?? ''}`).includes(s));

function stundenLeistung(leistungen: Leistung[]): Leistung | undefined {
  const h = leistungen.filter((l) => l.einheit === 'h');
  return h.find((l) => /geselle|monteur|arbeitsstunde/i.test(l.name)) ?? h[0];
}

function frei(text: string, menge: number, einheit: Einheit, einzelpreis = 0, art: Position['art'] = 'pauschal'): Position {
  return { id: neueId('p'), art, text: satzAnfang(text), menge, einheit, einzelpreis };
}

// ------------------------------------------------------------------ Regeln (Lane 0)

/**
 * Freitext → vorgeschlagene Positionen, ganz ohne KI. `leistungen`/`artikel` nur aktive Einträge.
 * Katalog vor freier Position, Leistung vor Material.
 */
export function vorschlagAusRegeln(text: string, leistungen: Leistung[], artikel: Artikel[] = []): Position[] {
  const ergebnis: Position[] = [];
  let letzteFlaeche: { menge: number; einheit: Einheit } | undefined;
  for (const roh of zerlegen(ohneAbkuerzungen(text))) {
    const t = lesen(roh);

    // „2 Tage“ → Stunden zum Stundensatz aus dem Katalog
    if (t.tage !== undefined && !t.inhalt.length) {
      const l = stundenLeistung(leistungen);
      const stunden = t.tage * STUNDEN_JE_TAG;
      ergebnis.push(l ? positionAusLeistung(l, stunden) : frei('Arbeitszeit', stunden, 'h', 0, 'lohn'));
      continue;
    }

    // „Material ca. 900 €“ → eine Materialpauschale mit genau diesem Betrag
    if (t.material && !t.menge) {
      const rest = t.inhalt.filter((w) => !MATERIAL.test(w));
      ergebnis.push(frei(rest.length ? t.roh : 'Material', 1, 'Psch', t.preis ?? 0, 'material'));
      continue;
    }

    // „alte Fliesen raus“ → Rückbau aus dem Katalog, Menge wie die Fläche davor
    if (t.abbruch) {
      const kandidaten = leistungen.filter(istAbbruch);
      const menge = t.menge ?? letzteFlaeche?.menge ?? 1;
      const einheit = t.einheit ?? (t.menge === undefined ? letzteFlaeche?.einheit : undefined);
      const wahl = kandidaten.map((l) => ({ l, p: treffer(t.inhalt, l.name) + (einheit && l.einheit === einheit ? 2 : 0) })).sort((a, b) => b.p - a.p)[0]?.l;
      ergebnis.push(wahl ? positionAusLeistung(wahl, menge) : frei(`${t.roh || 'Altbestand'} entfernen`, menge, einheit ?? 'Psch', t.preis ?? 0));
      continue;
    }

    if (!t.inhalt.length && t.menge === undefined) continue;
    const l = bester(t.inhalt, leistungen, t.einheit);
    const a = bester(t.inhalt, artikel, t.einheit);
    const menge = t.menge ?? 1;
    let p: Position;
    if (l.wahl && l.punkte >= a.punkte) p = positionAusLeistung(l.wahl, menge);
    else if (a.wahl) p = positionAusArtikel(a.wahl, menge);
    else if (!t.inhalt.length) continue;
    else if (t.preis !== undefined && !(t.jeEinheit && t.menge)) p = frei(t.roh, 1, 'Psch', t.preis);
    else p = frei(t.roh, menge, t.einheit ?? 'Stk', t.preis ?? 0);
    if (t.preis !== undefined && (p.leistungId || p.artikelId) && t.jeEinheit) p.einzelpreis = t.preis;
    ergebnis.push(p);
    if (p.einheit === 'm²' || p.einheit === 'm') letzteFlaeche = { menge: p.menge, einheit: p.einheit };
  }
  return ergebnis;
}

// ------------------------------------------------------------------ Modell (Lane 2/3) – nur Verbesserung

/** Minimaler Kontext fürs Modell: Katalog ohne Preise, Regeln als Ausgangspunkt. */
export function modellKontext(text: string, leistungen: Leistung[], artikel: Artikel[]) {
  return {
    format: 'angebot.positionen',
    stundenJeTag: STUNDEN_JE_TAG,
    katalog: [
      ...leistungen.slice(0, 250).map((l) => ({ id: l.id, name: l.name, einheit: l.einheit, art: 'leistung' })),
      ...artikel.slice(0, 150).map((a) => ({ id: a.id, name: a.name, einheit: a.einheit, art: 'material' })),
    ],
    regeln: vorschlagAusRegeln(text, leistungen, artikel).map((p) => ({ katalogId: p.leistungId ?? p.artikelId ?? '', text: p.text, menge: p.menge, einheit: p.einheit })),
  };
}

interface ModellPosition {
  katalogId?: unknown;
  text?: unknown;
  menge?: unknown;
  einheit?: unknown;
  preisEuro?: unknown;
}

/**
 * Antwort des Modells (JSON) → Positionen. Katalogtreffer bekommen den Katalogpreis; freie Positionen nur einen Preis,
 * der wörtlich im Satz steht. Alles andere bleibt 0. Unbrauchbare Antwort → `undefined` (dann gelten die Regeln).
 */
export function vorschlagAusModell(modellText: string, text: string, leistungen: Leistung[], artikel: Artikel[]): Position[] | undefined {
  let roh: { positionen?: unknown };
  try {
    roh = JSON.parse(modellText.replace(/^```(?:json)?\s*|\s*```$/g, ''));
  } catch {
    return undefined;
  }
  if (!Array.isArray(roh?.positionen)) return undefined;
  const erlaubt = genanntePreise(text);
  const jeEinheit = /\b(je|pro)\b|à|\//i.test(text);
  const liste = (roh.positionen as ModellPosition[]).slice(0, 30).flatMap((m): Position[] => {
    const menge = typeof m.menge === 'number' && m.menge > 0 && m.menge < 100_000 ? Math.round(m.menge * 100) / 100 : 1;
    const id = typeof m.katalogId === 'string' ? m.katalogId : '';
    const l = id ? leistungen.find((x) => x.id === id) : undefined;
    if (l) return [positionAusLeistung(l, menge)];
    const a = id ? artikel.find((x) => x.id === id) : undefined;
    if (a) return [positionAusArtikel(a, menge)];
    const beschreibung = typeof m.text === 'string' ? m.text.trim().slice(0, 200) : '';
    if (!beschreibung) return [];
    const einheit = EINHEITEN_LISTE.includes(m.einheit as Einheit) ? (m.einheit as Einheit) : 'Psch';
    const cent = typeof m.preisEuro === 'number' ? Math.round(m.preisEuro * 100) : 0;
    // Einzelpreis nur, wenn er (oder Menge × Preis) wörtlich im Satz steht
    const genannt = cent > 0 && (erlaubt.includes(Math.round(cent * menge)) || (erlaubt.includes(cent) && (menge === 1 || jeEinheit)));
    const preis = genannt ? cent : 0;
    return [frei(beschreibung, menge, einheit, preis, /material/i.test(beschreibung) ? 'material' : einheit === 'h' ? 'lohn' : 'pauschal')];
  });
  return liste.length ? liste : undefined;
}
