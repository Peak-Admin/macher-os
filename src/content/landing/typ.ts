import type { FaqItem, IconName } from "@/components/ui";
import type { BildKey } from "@/content/bilder";
import type { Anliegen } from "@/content/unternehmen";

/**
 * Datenmodell der Landingpages (Vergleich, Wechsel, Zielgruppen, Programme, Suchthemen).
 * Gerendert von `src/components/sections/Landingseite.tsx`. Jeder Abschnitt ist optional –
 * die Reihenfolge auf der Seite ist fest, damit alle Landingpages gleich aufgebaut sind.
 *
 * Regeln (CLAUDE.md): nur Aussagen, die heute stimmen; keine erfundenen Zahlen, Preise oder
 * Funktionen anderer Anbieter; Konditionen von Programmen nur, wenn sie freigegeben sind.
 */

export type Link = { label: string; href: string };

/** Zelle einer Vergleichstabelle: `true` = ja, `false` = nein, Text = Erklärung. */
export type VergleichsZelle = boolean | string;

export type Landing = {
  pfad: string;
  meta: { title: string; description: string };
  breadcrumbs: { label: string; href?: string }[];
  hero: {
    eyebrow: string;
    title: string;
    intro: string;
    bild?: BildKey;
    /** Ohne Angabe: „Kostenlos testen“ + „Demo ansehen“ */
    aktionen?: { primaer: Link; sekundaer?: Link };
    hinweis?: string;
  };
  /** „Kennst du das?“ – Alltag vorher, dann die Antwort */
  schmerz?: { eyebrow?: string; titel: string; punkte: string[]; antwort: string };
  /** Verlinkte Karten weit oben, z. B. auf der Vergleichsübersicht */
  wegweiser?: { eyebrow?: string; titel: string; intro?: string; karten: { titel: string; text: string; href: string; icon: IconName }[] };
  /** `bild: "fenster"` zeigt über jeder Karte die Fenster-Skizze mit dem Glas-Icon (z. B. Schnittstellen). */
  vorteile?: { eyebrow?: string; titel: string; intro?: string; bild?: "fenster"; karten: { titel: string; text: string; icon: IconName }[] };
  vergleich?: {
    eyebrow?: string;
    titel: string;
    intro?: string;
    spalten: [string, string];
    zeilen: { merkmal: string; links: VergleichsZelle; rechts: VergleichsZelle }[];
    hinweis?: string;
  };
  ablauf?: { eyebrow?: string; titel: string; intro?: string; schritte: { titel: string; text: string }[]; link?: Link };
  /** Dunkler Abschnitt mit Häkchenliste */
  checkliste?: { eyebrow?: string; titel: string; intro?: string; punkte: string[]; link?: Link };
  /** Formular, das das E-Mail-Programm öffnet (kein Backend) */
  anfrage?: { titel: string; intro: string; frage: string; betreff: string; anliegen: Anliegen[]; email: string };
  faq: FaqItem[];
  weiter: { titel?: string; links: (Link & { text: string })[] };
  cta?: { title: string; intro: string };
};
