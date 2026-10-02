import type { IconName } from "@/components/ui";
import type { TopGewerkSlug } from "@/content/registry";

/** Kontaktadresse für alle Formulare im Bereich Wissen (öffnet das E-Mail-Programm). */
export const KONTAKT_EMAIL = "hallo@macher-os.de";

/** Themen, nach denen alle Wissensinhalte sortiert werden. */
export const themen = [
  {
    slug: "betrieb-fuehren",
    titel: "Betrieb führen",
    text: "Zahlen, Organisation und Abläufe im Griff.",
    icon: "home",
  },
  {
    slug: "auftraege-geld",
    titel: "Aufträge & Geld",
    text: "Von der Anfrage bis zur bezahlten Rechnung.",
    icon: "euro",
  },
  {
    slug: "mitarbeiter",
    titel: "Mitarbeiter",
    text: "Leute finden, einarbeiten und halten.",
    icon: "users",
  },
  {
    slug: "digital-arbeiten",
    titel: "Digital arbeiten",
    text: "Weniger Zettel, weniger Suchen.",
    icon: "smartphone",
  },
  {
    slug: "kalkulation",
    titel: "Kalkulation",
    text: "Stundensatz, Angebot und Aufschläge.",
    icon: "calculator",
  },
  {
    slug: "planung",
    titel: "Planung",
    text: "Wer fährt wann wohin – mit was.",
    icon: "calendar",
  },
  {
    slug: "fuehrung",
    titel: "Führung",
    text: "Klare Ansagen, gutes Team, weniger Feuerwehr.",
    icon: "award",
  },
] as const satisfies readonly { slug: string; titel: string; text: string; icon: IconName }[];

export type ThemaSlug = (typeof themen)[number]["slug"];

export function themaTitel(slug: ThemaSlug) {
  return themen.find((t) => t.slug === slug)?.titel ?? slug;
}

/** Icons der Top-Gewerke für Kacheln im Wissensbereich. */
export const gewerkIcons: Record<TopGewerkSlug, IconName> = {
  elektriker: "bolt",
  shk: "wrench",
  maler: "pen",
  fliesenleger: "layers",
  tischler: "ruler",
  dachdecker: "home",
  bau: "warehouse",
  galabau: "map",
};

/** Formatiert ein ISO-Datum (YYYY-MM-DD) deutsch, z. B. „12. März 2026“. */
export function formatDatum(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const monate = [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ];
  return `${d}. ${monate[m - 1]} ${y}`;
}
