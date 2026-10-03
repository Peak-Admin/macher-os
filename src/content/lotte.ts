/**
 * Lotte – die KI in Handwerk OS – als Figur auf der Website.
 * Bilder: transparente WebP unter `public/bilder/lotte/` (vom Lotte-Setup, heylotte.ai).
 * Eingebunden nur über `<Lotte pose="…" />` (`src/components/ui/Lotte.tsx`).
 */
export const lottePosen = {
  erklaert: { src: "/bilder/lotte/erklaert.webp", breite: 900, hoehe: 1017, alt: "Lotte, die KI in Handwerk OS, erklärt etwas am Laptop" },
  laptop: { src: "/bilder/lotte/laptop.webp", breite: 900, hoehe: 1017, alt: "Lotte arbeitet am Laptop" },
  telefon: { src: "/bilder/lotte/telefon.webp", breite: 900, hoehe: 1017, alt: "Lotte mit dem Handy in der Hand" },
  notizen: { src: "/bilder/lotte/notizen.webp", breite: 682, hoehe: 676, alt: "Lotte sortiert Karteikarten und eine Sprachnachricht" },
  /** Zeigt „90 Sek.“ im Bild – erst einsetzen, wenn die Zahl belegt ist (keine erfundenen Kennzahlen). */
  angebot: { src: "/bilder/lotte/angebot.webp", breite: 631, hoehe: 676, alt: "Lotte hält ein fertiges Angebot hoch" },
  rechnungen: { src: "/bilder/lotte/rechnungen.webp", breite: 606, hoehe: 661, alt: "Lotte zeigt auf einen Stapel Rechnungen" },
  planung: { src: "/bilder/lotte/planung.webp", breite: 603, hoehe: 680, alt: "Lotte trägt einen Termin in den Plan ein" },
  post: { src: "/bilder/lotte/post.webp", breite: 604, hoehe: 762, alt: "Lotte holt einen Beleg aus einem Umschlag" },
  "mit-dir": { src: "/bilder/lotte/mit-dir.webp", breite: 1210, hoehe: 981, alt: "Ein Handwerker mit Handy und Lotte mit Notizblock, Rücken an Rücken" },
} as const;

export type LottePose = keyof typeof lottePosen;

/** Welche Lotte auf welcher Funktionsseite steht – sonst `laptop`. */
const poseJeFunktion: Record<string, LottePose> = {
  anfragen: "notizen",
  telefon: "telefon",
  nachrichten: "telefon",
  "schnell-erfassen": "notizen",
  berichte: "notizen",
  rechnungen: "rechnungen",
  zahlungen: "rechnungen",
  mahnungen: "rechnungen",
  finanzen: "rechnungen",
  kalender: "planung",
  terminbuchung: "planung",
  "wiederkehrende-termine": "planung",
  einsatzplanung: "planung",
  "automatische-planung": "planung",
  wartung: "planung",
  belege: "post",
  buchhaltung: "post",
  einkauf: "post",
  dokumente: "post",
};

export function lottePoseFuer(funktion: string): LottePose {
  return poseJeFunktion[funktion] ?? "laptop";
}

/** Herkunft von Lotte – einmal formuliert, überall gleich (Website). */
export const lotteHerkunft = {
  agent: "Hey Lotte",
  url: "https://www.heylotte.ai/",
  entwickler: ["Max Längsfeld", "Matthias Aumann"],
  text: "Lotte ist der KI-Agent Hey Lotte, entwickelt von Max Längsfeld und Matthias Aumann. In Handwerk OS arbeitet sie mit den Daten deines Betriebs.",
} as const;
