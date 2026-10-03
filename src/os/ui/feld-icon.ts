/**
 * Welches Strich-Icon steht vorne im Eingabefeld? Jedes Feld zeigt eins – das Auge findet so schneller,
 * was wohin gehört (Telefon, Datum, Geld …). Ein Modul kann es mit `icon` überschreiben oder mit `icon={false}` weglassen.
 * Erst zählt der Feldtyp, dann das Label, zuletzt ein ruhiger Standard je Art des Feldes.
 */
import type { IconName } from './icons';

export type FeldArt = 'eingabe' | 'auswahl' | 'text';

export interface FeldIconFrage {
  label: string;
  type?: string;
  inputMode?: string;
  art?: FeldArt;
}

/** Feldtypen ohne Icon (keine Textfelder) */
const OHNE_ICON = new Set(['checkbox', 'radio', 'hidden', 'file', 'range', 'color', 'submit', 'button', 'reset', 'image']);

/** Reihenfolge zählt: die erste passende Regel gewinnt */
const REGELN: [RegExp, IconName][] = [
  [/\bcode\b|passwort|kennwort/, 'schloss'],
  [/e-?mail|\bmail\b/, 'mail'],
  [/telefon|handy|anrufer|\bsms\b|klingeln/, 'telefon'],
  [/website|shop|adresse deines programms|\blink\b|\burl\b/, 'link'],
  [/iban|\bbic\b|bank/, 'euro'],
  [/kilometer|fahrzeug|\bkm\b/, 'auto'],
  [/%|prozent|rabatt|zuschlag|aufschlag|wagnis/, 'prozent'],
  [/€|preis|betrag|kosten|lohn|gebühr|netto|brutto|\bek\b|\bvk\b|skonto|abzug|gezahlt/, 'euro'],
  [/uhrzeit|arbeitsbeginn|arbeitsende|feierabend|pause|minuten|sekunden|ruhe (ab|bis)/, 'uhr'],
  [/stunden|dauer/, 'uhr'],
  [/lagerort|\blager\b/, 'lager'],
  [/straße|adress|\bplz\b|\bort\b|stadt|\bland\b|standort|lieferung an|\braum\b|bauteil/, 'ort'],
  [/team|kolonne|wer ist dabei/, 'team'],
  [/betrieb|firma|firmen|kanzlei|lieferant|großhändler|hersteller|subunternehmer|anbieter/, 'betrieb'],
  [/nummer|\bnr\.|kürzel|\bean\b|steuer|ust-idnr|kundennummer/, 'nummer'],
  [/datum|termin|frist|gültig|eintritt|beginn|\bende\b|endet|\bvon\b|\bbis\b|\bab\b|\bam\b|\btag\b|monat|zeitraum|wartung|prüfung|letzter arbeitstag|erinnern|wiederholen|laufzeit|intervall|verlängerung|urlaub|tage/, 'kalender'],
  [/^name$|vorname|nachname|name des kunden|name für kunden|name in druck|name oder firma|ansprechpartner|prüfer|mitarbeiter|kunde|\bwer\b|wessen|^für$|^an$|person|arbeiten als|stelle|qualifikation/, 'person'],
  [/artikel|material|menge|einheit|\banz\.|lieferzeit/, 'paket'],
  [/gerät|anlage|modell|serien|baujahr|maschine|werkzeug/, 'werkzeug'],
  [/auftrag|projekt|leistung|gewerk|aufgabe|position|phase|schritt|mangel|arbeit/, 'auftraege'],
  [/vorlage|formular|dokument|datei/, 'dokument'],
  [/kategorie|\bart\b|status|typ|kanal|ansicht|grundlage|abrechnung|gemeldet per|zugang/, 'liste'],
  [/frage|anliegen|worum|warum|grund|notiz|bemerkung|hinweis|text|beschreib|betreff|titel|bezeichnung|\bwas\b|wofür/, 'stift'],
];

/** Icon für ein Feld – `undefined`, wenn das Feld keins tragen soll (z. B. Checkbox) */
export function feldIcon({ label, type, inputMode, art = 'eingabe' }: FeldIconFrage): IconName | undefined {
  const t = (type ?? 'text').toLowerCase();
  if (OHNE_ICON.has(t)) return undefined;
  if (t === 'email') return 'mail';
  if (t === 'tel') return 'telefon';
  if (t === 'url') return 'link';
  if (t === 'search') return 'suche';
  if (t === 'password') return 'schloss';
  if (t === 'date' || t === 'datetime-local' || t === 'month' || t === 'week') return 'kalender';
  if (t === 'time') return 'uhr';
  const l = label.toLowerCase();
  for (const [muster, icon] of REGELN) if (muster.test(l)) return icon;
  if (art === 'text') return 'notiz';
  if (art === 'auswahl') return 'liste';
  if (t === 'number' || inputMode === 'decimal' || inputMode === 'numeric') return 'nummer';
  return 'stift';
}
