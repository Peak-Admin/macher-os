/**
 * Kanonische Liste aller Seiten-Slugs der Marketing-Website.
 *
 * Jede Bereichsdatei (z. B. `funktionen.ts`, `gewerke.ts`) hängt ihre
 * ausführlichen Inhalte an diese Slugs. Querverlinkungen zwischen Bereichen
 * nutzen ausschließlich diese Liste, damit keine toten Links entstehen.
 */

export type FunktionGruppe = "auftraege" | "planen" | "betrieb" | "macher";

export const funktionGruppen: Record<
  FunktionGruppe,
  { titel: string; beschreibung: string }
> = {
  auftraege: {
    titel: "Aufträge",
    beschreibung: "Vom ersten Kundenkontakt bis zur bezahlten Rechnung.",
  },
  planen: {
    titel: "Planen",
    beschreibung: "Alles richtig einplanen, bevor es zum Problem wird.",
  },
  betrieb: {
    titel: "Betrieb",
    beschreibung: "Alles, was der Betrieb dauerhaft braucht.",
  },
  macher: {
    titel: "Macher erledigt",
    beschreibung: "Büroarbeit, die Macher OS möglichst automatisch übernimmt.",
  },
};

export const funktionen = [
  { slug: "anfragen", titel: "Anfragen", gruppe: "auftraege" },
  { slug: "telefon", titel: "Telefon & Empfang", gruppe: "auftraege" },
  { slug: "kunden", titel: "Kunden", gruppe: "auftraege" },
  { slug: "auftraege", titel: "Aufträge", gruppe: "auftraege" },
  { slug: "aufmass", titel: "Aufmaß", gruppe: "auftraege" },
  { slug: "kalkulation", titel: "Kalkulation", gruppe: "auftraege" },
  { slug: "angebote", titel: "Angebote", gruppe: "auftraege" },
  { slug: "dokumentation", titel: "Fotos & Dokumentation", gruppe: "auftraege" },
  { slug: "rechnungen", titel: "Rechnungen", gruppe: "auftraege" },
  { slug: "zahlungen", titel: "Zahlungen", gruppe: "auftraege" },
  { slug: "kalender", titel: "Kalender & Terminbuchung", gruppe: "planen" },
  { slug: "einsatzplanung", titel: "Einsatzplanung", gruppe: "planen" },
  { slug: "mitarbeiter", titel: "Mitarbeiter", gruppe: "betrieb" },
  { slug: "zeiterfassung", titel: "Zeiterfassung", gruppe: "betrieb" },
  { slug: "qualifikationen", titel: "Qualifikationen", gruppe: "betrieb" },
  { slug: "schulungen", titel: "Schulungen", gruppe: "betrieb" },
  { slug: "material", titel: "Material", gruppe: "betrieb" },
  { slug: "lager", titel: "Lager", gruppe: "betrieb" },
  { slug: "einkauf", titel: "Einkauf & Lieferanten", gruppe: "betrieb" },
  { slug: "werkzeuge", titel: "Werkzeuge", gruppe: "betrieb" },
  { slug: "fahrzeuge", titel: "Fahrzeuge", gruppe: "betrieb" },
  { slug: "auswertung", titel: "Kosten & Auswertungen", gruppe: "betrieb" },
  {
    slug: "automatisch-erledigen",
    titel: "Macher erledigt automatisch",
    gruppe: "macher",
  },
] as const satisfies readonly {
  slug: string;
  titel: string;
  gruppe: FunktionGruppe;
}[];

export type FunktionSlug = (typeof funktionen)[number]["slug"];

/** Die acht beliebtesten Gewerke – eigene, ausführliche Seiten. */
export const topGewerke = [
  { slug: "elektriker", titel: "Elektriker", kurz: "Elektro" },
  { slug: "shk", titel: "SHK / Sanitär & Heizung", kurz: "SHK" },
  { slug: "maler", titel: "Maler & Lackierer", kurz: "Maler" },
  { slug: "fliesenleger", titel: "Fliesenleger", kurz: "Fliesen" },
  { slug: "tischler", titel: "Tischler & Schreiner", kurz: "Tischler" },
  { slug: "dachdecker", titel: "Dachdecker", kurz: "Dach" },
  { slug: "bau", titel: "Maurer & Bau", kurz: "Bau" },
  { slug: "galabau", titel: "Garten- & Landschaftsbau", kurz: "GaLaBau" },
] as const;

/** Gewerk-Cluster – Sammelseiten für alle weiteren Betriebe. */
export const gewerkCluster = [
  { slug: "elektro-energie", titel: "Elektro & Energie" },
  { slug: "shk-gebaeudetechnik", titel: "SHK & Gebäudetechnik" },
  { slug: "maler-boden-oberflaechen", titel: "Maler, Boden & Oberflächen" },
  { slug: "holz-innenausbau", titel: "Holz & Innenausbau" },
  { slug: "dach-gebaeudehuelle", titel: "Dach & Gebäudehülle" },
  { slug: "bau-rohbau", titel: "Bau & Rohbau" },
  { slug: "metall-maschinen", titel: "Metall & Maschinen" },
  { slug: "fahrzeug-werkstatt", titel: "Fahrzeug & Werkstatt" },
  { slug: "garten-aussenanlagen", titel: "Garten & Außenanlagen" },
  { slug: "gebaeude-service", titel: "Gebäude & Service" },
  { slug: "glas-fenster-sonnenschutz", titel: "Glas, Fenster & Sonnenschutz" },
  {
    slug: "friseur-dienstleistungen",
    titel: "Friseur & persönliche Dienstleistungen",
  },
  { slug: "lebensmittelhandwerk", titel: "Lebensmittelhandwerk" },
  { slug: "gesundheitshandwerk", titel: "Gesundheitshandwerk" },
  {
    slug: "textil-gestaltung-werbetechnik",
    titel: "Textil, Gestaltung & Werbetechnik",
  },
  { slug: "weitere-gewerke", titel: "Weitere Gewerke" },
] as const;

export type TopGewerkSlug = (typeof topGewerke)[number]["slug"];
export type GewerkClusterSlug = (typeof gewerkCluster)[number]["slug"];
export type GewerkSlug = TopGewerkSlug | GewerkClusterSlug;

export const werkzeuge = [
  {
    slug: "stundensatz-rechner",
    titel: "Stundensatz-Rechner",
    kurz: "Den richtigen Stundensatz berechnen.",
  },
  {
    slug: "stundenverrechnungssatz-rechner",
    titel: "Stundenverrechnungssatz-Rechner",
    kurz: "Kosten und Verrechnung sauber berechnen.",
  },
  {
    slug: "angebots-rechner",
    titel: "Angebots-Rechner",
    kurz: "Angebote schneller vorbereiten.",
  },
  {
    slug: "materialaufschlag-rechner",
    titel: "Materialaufschlag-Rechner",
    kurz: "Materialpreise und Aufschläge kalkulieren.",
  },
  {
    slug: "fahrtkosten-rechner",
    titel: "Fahrtkosten-Rechner",
    kurz: "Fahrtkosten sauber berechnen.",
  },
  {
    slug: "deckungsbeitrags-rechner",
    titel: "Deckungsbeitrags-Rechner",
    kurz: "Prüfen, was ein Auftrag wirklich bringt.",
  },
] as const;

export type WerkzeugSlug = (typeof werkzeuge)[number]["slug"];

/**
 * Kundenstories. Solange es keine echten, freigegebenen Kundenstories gibt,
 * sind alle Einträge als Beispiel gekennzeichnet und werden auf der Website
 * sichtbar als „Beispiel“ markiert.
 */
export const kunden = [
  {
    slug: "elektro-brandt",
    betrieb: "Elektro Brandt",
    gewerk: "elektriker",
    ort: "Hannover",
    mitarbeiter: 14,
    ergebnis: "6 Stunden Büroarbeit pro Woche weniger",
  },
  {
    slug: "haustechnik-yilmaz",
    betrieb: "Haustechnik Yılmaz",
    gewerk: "shk",
    ort: "Dortmund",
    mitarbeiter: 22,
    ergebnis: "Wartungen planen sich jetzt fast von selbst",
  },
  {
    slug: "malerei-koch",
    betrieb: "Malerei Koch",
    gewerk: "maler",
    ort: "Freiburg",
    mitarbeiter: 8,
    ergebnis: "Angebote am selben Tag statt nach einer Woche",
  },
  {
    slug: "tischlerei-weber",
    betrieb: "Tischlerei Weber",
    gewerk: "tischler",
    ort: "Augsburg",
    mitarbeiter: 11,
    ergebnis: "Nachkalkulation für jeden Auftrag – ohne Excel",
  },
  {
    slug: "dach-hansen",
    betrieb: "Dach Hansen",
    gewerk: "dachdecker",
    ort: "Kiel",
    mitarbeiter: 17,
    ergebnis: "Baustellendoku komplett vom Handy",
  },
  {
    slug: "gruen-werk",
    betrieb: "Grünwerk Gartenbau",
    gewerk: "galabau",
    ort: "Leipzig",
    mitarbeiter: 9,
    ergebnis: "Rechnungen gehen am Tag der Abnahme raus",
  },
] as const satisfies readonly {
  slug: string;
  betrieb: string;
  gewerk: TopGewerkSlug;
  ort: string;
  mitarbeiter: number;
  ergebnis: string;
}[];

export type KundeSlug = (typeof kunden)[number]["slug"];

export function funktionHref(slug: FunktionSlug) {
  return `/funktionen/${slug}`;
}
export function gewerkHref(slug: GewerkSlug) {
  return `/gewerke/${slug}`;
}
export function werkzeugHref(slug: WerkzeugSlug) {
  return `/werkzeuge/${slug}`;
}
export function kundeHref(slug: KundeSlug) {
  return `/kunden/${slug}`;
}
