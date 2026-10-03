/**
 * Projektnummern für Aufträge: `YYMM-XXX` (z. B. `2610-001` = erstes Projekt im Oktober 2026).
 * Der Zähler läuft je Monat. Reine Logik ohne Speicher – nutzbar in App und Server (Postfach).
 * Ältere Nummern (`A-2026-0001`) bleiben gültig und werden weiter gefunden.
 */

/** Präfix `YYMM` für ein Datum (Ortszeit) */
export function projektPraefix(datum: Date = new Date()): string {
  return `${String(datum.getFullYear() % 100).padStart(2, '0')}${String(datum.getMonth() + 1).padStart(2, '0')}`;
}

/** Eingabe vereinheitlichen: Leerzeichen und führendes `#` weg */
export const nummerBereinigt = (n: string) => n.trim().replace(/^#\s*/, '');

/** So erscheint die Nummer in der Oberfläche: `#2610-001` */
export const nummerAnzeige = (n: string | undefined) => (n ? `#${n}` : '');

/** Nächste freie Projektnummer im Monat von `datum`. Gelöschte Aufträge mitgeben, damit nichts doppelt vergeben wird. */
export function projektNummerFuer(nummern: (string | undefined)[], datum: Date = new Date()): string {
  const start = `${projektPraefix(datum)}-`;
  const max = nummern
    .map((n) => (n ? nummerBereinigt(n) : ''))
    .filter((n) => n.startsWith(start) && /^\d+$/.test(n.slice(start.length)))
    .map((n) => Number(n.slice(start.length)))
    .reduce((m, n) => Math.max(m, n), 0);
  return `${start}${String(max + 1).padStart(3, '0')}`;
}

const ERLAUBT = /^[\p{L}\d][\p{L}\d\-/.]{0,19}$/u;

/**
 * Prüft eine selbst vergebene Nummer. `vorhandene` sind alle anderen Nummern (inkl. Papierkorb).
 * Gibt eine verständliche Fehlermeldung zurück oder `undefined`, wenn die Nummer passt.
 */
export function nummerFehler(eingabe: string, vorhandene: (string | undefined)[]): string | undefined {
  const n = nummerBereinigt(eingabe);
  if (!n) return 'Trag eine Projektnummer ein.';
  if (!ERLAUBT.test(n)) return 'Nutze nur Buchstaben, Ziffern, Bindestrich, Schrägstrich oder Punkt – höchstens 20 Zeichen.';
  const klein = n.toLowerCase();
  if (vorhandene.some((x) => x && nummerBereinigt(x).toLowerCase() === klein)) return `Die Nummer ${n} gibt es schon. Nimm eine andere.`;
  return undefined;
}

/** Findet eine Auftragsnummer im Freitext – neues Format (`2610-001`, auch `#2610-001`) und altes (`A-2026-0001`) */
export const AUFTRAGSNUMMER_IM_TEXT = /\bA-\d{4}-\d{3,4}\b|(?<![\w-])\d{2}(?:0[1-9]|1[0-2])-\d{3,4}\b/i;

// ------------------------------------------------------------------ Nummernkreise `<praefix>-<jahr>-<lfd>` (Angebote, Rechnungen)

export interface NummerOptionen {
  jahr?: number;
  /** Stellen der laufenden Nummer (Standard 4 → 0001) */
  stellen?: number;
}

/**
 * Nächste Nummer `<praefix>-<jahr>-<lfd>` für einen beliebigen Nummernkreis – auch für Modul-Sammlungen
 * (z. B. `naechsteNummerFuer('BR', berichte.allMitGeloeschten().map((b) => b.nummer))`).
 * Gelöschte Einträge mitgeben, damit keine Nummer doppelt vergeben wird.
 */
export function naechsteNummerFuer(praefix: string, nummern: (string | undefined)[], opts: NummerOptionen = {}): string {
  const { jahr = new Date().getFullYear(), stellen = 4 } = opts;
  const start = `${praefix}-${jahr}-`;
  const max = nummern
    .filter((n): n is string => !!n?.startsWith(start))
    .map((n) => Number(n.slice(start.length)))
    .filter(Number.isFinite)
    .reduce((m, n) => Math.max(m, n), 0);
  return `${start}${String(max + 1).padStart(stellen, '0')}`;
}
