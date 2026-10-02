/**
 * Nummernkreise je Dokumentart – Teil der Dokumenten-Engine, nur Kern-Abhängigkeiten
 * (damit Rechnungen, Angebote und Mahnungen sie ohne Zyklus nutzen können).
 *
 * Standard: Alle Rechnungsarten (Rechnung, Abschlag, Teil, Schluss, Gutschrift, Storno) teilen den Kreis „R“
 * aus `@core/nummern` – lückenlos je Jahr (GoBD). Wer getrennte Kreise braucht (z. B. „GS“ für Gutschriften),
 * stellt das Kürzel je Art ein. Neue Dokumentarten (Auftragsbestätigung, Lieferschein) haben eigene Kreise.
 */
import { einstellung, setzeEinstellung } from '@core/einstellungen';
import { naechsteNummer, naechsteNummerFuer, type Nummernkreis } from '@core/nummern';

export type NummerArt = 'angebot' | 'auftragsbestaetigung' | 'lieferschein' | 'rechnung' | 'abschlag' | 'teil' | 'schluss' | 'gutschrift' | 'storno';

/** Kürzel je Art, wenn nichts eingestellt ist */
export const STANDARD_KUERZEL: Record<NummerArt, string> = {
  angebot: 'AN',
  auftragsbestaetigung: 'AB',
  lieferschein: 'LS',
  rechnung: 'R',
  abschlag: 'R',
  teil: 'R',
  schluss: 'R',
  gutschrift: 'R',
  storno: 'R',
};

export const NUMMERN_LABEL: Record<NummerArt, string> = {
  angebot: 'Angebote',
  auftragsbestaetigung: 'Auftragsbestätigungen',
  lieferschein: 'Lieferscheine',
  rechnung: 'Rechnungen',
  abschlag: 'Abschlagsrechnungen',
  teil: 'Teilrechnungen',
  schluss: 'Schlussrechnungen',
  gutschrift: 'Gutschriften',
  storno: 'Stornorechnungen',
};

/** Kreise, die der Kern verwaltet (Kürzel → Kern-Kreis) */
const KERN: Record<string, Nummernkreis> = { R: 'rechnung', AN: 'angebot' };

export const NUMMERN_KEY = 'dokumente.nummernkreise';

/** Gültiges Kürzel: 1–4 Großbuchstaben */
export const kuerzelGueltig = (k: string | undefined): k is string => !!k && /^[A-Z]{1,4}$/.test(k);

export function kuerzelFuer(art: NummerArt): string {
  const eigen = einstellung<Partial<Record<NummerArt, string>>>(NUMMERN_KEY, {})[art];
  return kuerzelGueltig(eigen) ? eigen : STANDARD_KUERZEL[art];
}

export function kuerzelSetzen(art: NummerArt, kuerzel: string | undefined) {
  const alle = { ...einstellung<Partial<Record<NummerArt, string>>>(NUMMERN_KEY, {}) };
  if (!kuerzel || kuerzel === STANDARD_KUERZEL[art]) delete alle[art];
  else if (kuerzelGueltig(kuerzel)) alle[art] = kuerzel;
  setzeEinstellung(NUMMERN_KEY, alle);
}

/**
 * Nächste Nummer für eine Dokumentart. `vorhandene` sind alle bisher vergebenen Nummern der Sammlung
 * (inkl. Papierkorb), damit nichts doppelt vergeben wird. `kuerzel` überschreibt die Einstellung (je Dokument).
 * Für die Kern-Kreise (R, AN) zählt der Kern über alle Rechnungen bzw. Angebote.
 */
export function naechsteDokumentNummer(art: NummerArt, vorhandene: (string | undefined)[], kuerzel?: string): string {
  const k = kuerzelGueltig(kuerzel) ? kuerzel : kuerzelFuer(art);
  const kern = KERN[k];
  return kern ? naechsteNummer(kern) : naechsteNummerFuer(k, vorhandene);
}
