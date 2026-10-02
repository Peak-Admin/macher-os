/** Leistungen & Preise – reine Rechenlogik (Preisanpassung, Stundensatz, Lohnanteil). */
import type { Artikel, Cent, ID, Leistung } from '@core/objects';

export type Rundung = 'keine' | '10ct' | '50ct' | '1euro';

export const RUNDUNGEN: { wert: Rundung; label: string }[] = [
  { wert: 'keine', label: 'Nicht runden' },
  { wert: '10ct', label: 'Auf 10 Cent' },
  { wert: '50ct', label: 'Auf 50 Cent' },
  { wert: '1euro', label: 'Auf 1 €' },
];

const SCHRITT: Record<Rundung, number> = { keine: 1, '10ct': 10, '50ct': 50, '1euro': 100 };

/** Preis um `prozent` ändern (negativ = senken) und kaufmännisch runden. Nie unter 0. */
export function preisAnpassen(preis: Cent, prozent: number, rundung: Rundung = 'keine'): Cent {
  const roh = preis * (1 + prozent / 100);
  const s = SCHRITT[rundung];
  return Math.max(0, Math.round(roh / s) * s);
}

/** Vorschau für eine Preisanpassung: nur Leistungen, deren Preis sich ändert */
export function preisVorschau(leistungen: Leistung[], prozent: number, rundung: Rundung) {
  return leistungen
    .map((l) => ({ leistung: l, alt: l.preis, neu: preisAnpassen(l.preis, prozent, rundung) }))
    .filter((z) => z.alt !== z.neu);
}

/** "5", "-3,5", "+2.5" → Zahl; ungültig → undefined */
export function prozentAus(eingabe: string): number | undefined {
  const t = eingabe.trim().replace('%', '').replace(',', '.').replace(/\s/g, '');
  if (!/^[+-]?\d+(\.\d+)?$/.test(t)) return undefined;
  return Number(t);
}

/** Prüft eine Betragseingabe wie "68", "68,50", "1.290,00" */
export function istBetrag(eingabe: string): boolean {
  return /^\d{1,3}(\.?\d{3})*(,\d{1,2})?$|^\d+([.,]\d{1,2})?$/.test(eingabe.trim());
}

// ------------------------------------------------------------------ Stundensatz-Rechner

export interface StundensatzEingabe {
  /** Bruttolohn je bezahlter Stunde */
  lohn: Cent;
  /** Lohnnebenkosten in % vom Lohn (Sozialabgaben, Urlaub, Krankheit, Feiertage …) */
  lohnnebenkostenProzent: number;
  /** bezahlte Stunden je Mitarbeiter und Jahr */
  bezahlteStunden: number;
  /** davon beim Kunden abrechenbare Stunden je Mitarbeiter und Jahr */
  produktiveStunden: number;
  /** Gemeinkosten des Betriebs je Jahr (Miete, Fahrzeuge, Versicherung, Büro, Chefgehalt …) */
  gemeinkostenJahr: Cent;
  /** Anzahl Mitarbeiter, die abrechenbare Stunden leisten */
  produktiveMitarbeiter: number;
  /** Gewinn und Wagnis in % auf die Selbstkosten */
  gewinnProzent: number;
}

export interface StundensatzErgebnis {
  /** Lohn + Lohnnebenkosten je bezahlter Stunde */
  lohnkostenBezahlt: Cent;
  /** Lohnkosten umgelegt auf eine abrechenbare Stunde */
  lohnkostenProduktiv: Cent;
  gemeinkostenJeStunde: Cent;
  selbstkosten: Cent;
  gewinn: Cent;
  verrechnungssatz: Cent;
  /** Anteil abrechenbarer an bezahlten Stunden, 0–1 */
  produktivQuote: number;
}

/** Verrechnungssatz netto je abrechenbarer Stunde. `undefined`, solange Angaben fehlen oder nicht stimmen. */
export function stundensatzBerechnen(e: StundensatzEingabe): StundensatzErgebnis | undefined {
  const zahlen = [e.lohn, e.lohnnebenkostenProzent, e.bezahlteStunden, e.produktiveStunden, e.gemeinkostenJahr, e.produktiveMitarbeiter, e.gewinnProzent];
  if (zahlen.some((z) => z == null || !Number.isFinite(z) || z < 0)) return undefined;
  if (e.lohn <= 0 || e.produktiveStunden <= 0 || e.bezahlteStunden <= 0 || e.produktiveMitarbeiter <= 0) return undefined;
  if (e.produktiveStunden > e.bezahlteStunden) return undefined;
  const lohnkostenBezahlt = Math.round(e.lohn * (1 + e.lohnnebenkostenProzent / 100));
  const lohnkostenProduktiv = Math.round((lohnkostenBezahlt * e.bezahlteStunden) / e.produktiveStunden);
  const gemeinkostenJeStunde = Math.round(e.gemeinkostenJahr / (e.produktiveStunden * e.produktiveMitarbeiter));
  const selbstkosten = lohnkostenProduktiv + gemeinkostenJeStunde;
  const gewinn = Math.round((selbstkosten * e.gewinnProzent) / 100);
  return {
    lohnkostenBezahlt,
    lohnkostenProduktiv,
    gemeinkostenJeStunde,
    selbstkosten,
    gewinn,
    verrechnungssatz: selbstkosten + gewinn,
    produktivQuote: e.produktiveStunden / e.bezahlteStunden,
  };
}

// ------------------------------------------------------------------ Lohnanteil

/** Einkaufswert des typischen Materials einer Leistung */
export function materialEk(l: Leistung, artikel: (id: ID) => Artikel | undefined): Cent {
  return (l.material ?? []).reduce((s, m) => s + Math.round((artikel(m.artikelId)?.ek ?? 0) * m.menge), 0);
}

/**
 * Was bringt die Leistung je Arbeitsstunde, nachdem das Material bezahlt ist?
 * `undefined`, wenn keine Minuten hinterlegt sind.
 */
export function lohnanteilJeStunde(l: Leistung, artikel: (id: ID) => Artikel | undefined): Cent | undefined {
  if (!l.minuten || l.minuten <= 0) return undefined;
  return Math.round(((l.preis - materialEk(l, artikel)) * 60) / l.minuten);
}

/** Leistungen, die je Stunde weniger einbringen als der Stundensatz */
export function unterStundensatz(leistungen: Leistung[], stundensatz: Cent, artikel: (id: ID) => Artikel | undefined): Leistung[] {
  return leistungen.filter((l) => {
    if (!l.aktiv) return false;
    const je = lohnanteilJeStunde(l, artikel);
    return je != null && je < stundensatz;
  });
}

export function kategorienVon(leistungen: Leistung[]): string[] {
  return [...new Set(leistungen.map((l) => l.kategorie || 'Ohne Kategorie'))].sort((a, b) => a.localeCompare(b, 'de'));
}
