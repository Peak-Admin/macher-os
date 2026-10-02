import type { FunktionSlug, TopGewerkSlug, WerkzeugSlug } from "@/content/registry";
import type { ThemaSlug } from "./themen";

/** Inhaltsblöcke eines Blog-Artikels – werden von `BlogBlocks` gerendert. */
export type BlogBlock =
  | { typ: "h2"; id: string; text: string }
  | { typ: "h3"; text: string }
  | { typ: "p"; text: string }
  | { typ: "liste"; punkte: string[]; nummeriert?: boolean }
  | { typ: "hinweis"; titel?: string; text: string; ton?: "info" | "achtung" }
  | {
      typ: "beispiel";
      titel: string;
      text?: string;
      zeilen?: { label: string; wert: string; summe?: boolean }[];
      fazit?: string;
    }
  | { typ: "tabelle"; kopf: string[]; zeilen: string[][] };

export type BlogArtikel = {
  slug: string;
  titel: string;
  /** Meta-Beschreibung und Teaser. */
  beschreibung: string;
  /** Kurzantwort / wichtigste Erkenntnis direkt unter dem Titel. */
  kurzantwort: string;
  /** Veröffentlichungsdatum (ISO). */
  datum: string;
  themen: ThemaSlug[];
  /** Leer = für alle Gewerke relevant. */
  gewerke: TopGewerkSlug[];
  beliebt?: boolean;
  inhalt: BlogBlock[];
  checkliste: { titel: string; punkte: string[] };
  werkzeuge: WerkzeugSlug[];
  /** Slugs aus `vorlagen.ts`. */
  vorlagen: string[];
  funktionen: FunktionSlug[];
  /** Zeigt den Hinweis „keine Rechts-/Steuerberatung“. */
  rechtshinweis?: boolean;
};
