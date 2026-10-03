/**
 * Zeichen für Arten von Dingen – eine Quelle für die ganze Software, damit Urlaub überall 🏖️ ist.
 *
 * Emojis stehen vor Werten, die eine Art beschreiben (Abwesenheit, Termin, Zeit), immer zusammen mit Text.
 * Nie für Status, Geld oder Aktionen – dort gelten Text plus Strich-Icon (UX-Spezifikation).
 * Typ-Töne (`TypTon`) färben Typ-Kacheln in Listen: heller Grund, dunklere Linie im selben Ton.
 */
import type { AbwesenheitsArt, Auftragsart, TerminArt, Zeiteintrag } from './objects';

/** Farbton einer Typ-Kachel – unterscheidet Arten, kein Status (Warnung, Gefahr, Erfolg bleiben bei `Status`) */
export type TypTon = 'neutral' | 'gruen' | 'blau' | 'petrol' | 'gelb' | 'lila' | 'sand' | 'rose';

export const ABWESENHEIT_EMOJI: Record<AbwesenheitsArt, string> = {
  urlaub: '🏖️',
  krank: '🤒',
  schule: '🎓',
  schulung: '📚',
  frei: '🛋️',
  sonstiges: '📌',
};

export const TERMINART_EMOJI: Record<TerminArt, string> = {
  einsatz: '🔧',
  besichtigung: '👀',
  wartung: '🛠️',
  intern: '🏢',
  schulung: '📚',
  abnahme: '✅',
};

export const TERMINART_ICON: Record<TerminArt, string> = {
  einsatz: 'werkzeug',
  besichtigung: 'suche',
  wartung: 'wiederholen',
  intern: 'betrieb',
  schulung: 'wissen',
  abnahme: 'check',
};

export const TERMINART_TON: Record<TerminArt, TypTon> = {
  einsatz: 'blau',
  besichtigung: 'sand',
  wartung: 'petrol',
  intern: 'neutral',
  schulung: 'lila',
  abnahme: 'gruen',
};

export const ZEITART_EMOJI: Record<Zeiteintrag['art'], string> = {
  arbeit: '🔨',
  fahrt: '🚐',
  werkstatt: '🏭',
  buero: '💻',
};

/** Auftragsart: Farbe der Typ-Kachel (Icon: `ART_ICON` in auftraege/logik) */
export const AUFTRAGSART_TON: Record<Auftragsart, TypTon> = {
  kundendienst: 'blau',
  projekt: 'gruen',
  wartung: 'petrol',
  reklamation: 'gelb',
  werkstatt: 'lila',
};
