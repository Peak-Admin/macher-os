/** Modell und Preis je Gateway-Lane – getrennt von der Route, damit testbar. */

export type Lane = 1 | 2 | 3;

const STANDARD: Record<Lane, string> = { 1: 'claude-haiku-4-5', 2: 'claude-sonnet-5-5', 3: 'claude-opus-5-5' };

/** US-Dollar je 1 Mio. Token (Eingabe, Ausgabe) – für die Kostenmessung des Gateways */
const PREISE: Record<string, [number, number]> = {
  'claude-haiku-4-5': [1, 5],
  'claude-sonnet-5-5': [2, 10],
  'claude-opus-5-5': [4, 20],
};
/** Umrechnung grob in Euro-Cent; genau genug für die Ampel „Kostenanteil am Umsatz“ */
const CENT_JE_DOLLAR = 92;

export function modellFuer(lane: Lane): string {
  const env = { 1: process.env.KI_MODELL_JEV, 2: process.env.KI_MODELL_LUNA, 3: process.env.KI_MODELL_STARK }[lane];
  return env?.trim() || STANDARD[lane];
}

export function laneFrei(lane: Lane): boolean {
  if (!process.env.ANTHROPIC_API_KEY) return false;
  const liste = (process.env.KI_LANES ?? '').split(',').map((x) => x.trim()).filter(Boolean);
  return !liste.length || liste.includes(String(lane));
}

export function kostenCent(modell: string, eingabe: number, ausgabe: number): number {
  const [ein, aus] = PREISE[modell] ?? PREISE['claude-opus-5-5'];
  return ((eingabe * ein + ausgabe * aus) / 1_000_000) * CENT_JE_DOLLAR;
}
