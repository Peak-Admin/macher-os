import type { IconName } from "@/components/ui";

export type SchnellstartAnsicht =
  | "konto"
  | "gewerk"
  | "mitarbeiter"
  | "auftrag"
  | "app"
  | "planung";

export type SchnellstartSchritt = {
  id: SchnellstartAnsicht;
  /** „Zum Start“ ist die Einrichtung (eine Frage), der Rest kommt, wenn du ihn brauchst. */
  wann: "Zum Start" | "Wenn du so weit bist";
  titel: string;
  dauer: string;
  text: string;
  punkte: string[];
  icon: IconName;
  /** Passender Artikel im Hilfe-Center. */
  artikel?: string;
};

/** Erste Schritte nach `docs/os/ONBOARDING.md`: eine Frage zum Start, dann sofort etwas Echtes erledigen. Dauer ist eine grobe Orientierung. */
export const schnellstartSchritte: SchnellstartSchritt[] = [
  {
    id: "konto",
    wann: "Zum Start",
    titel: "Kostenlos starten",
    dauer: "ein Klick",
    text: "Klick auf „Kostenlos testen“. Handwerk OS öffnet sich direkt – ohne Konto, ohne Passwort, ohne Kreditkarte.",
    punkte: ["keine Anmeldung nötig", "Daten bleiben vorerst in deinem Browser"],
    icon: "user",
    artikel: "konto-erstellen",
  },
  {
    id: "gewerk",
    wann: "Zum Start",
    titel: "Welcher Betrieb bist du?",
    dauer: "unter 1 Minute",
    text: "Gib deine Website an. Lotte liest Name, Logo, Gewerk und Leistungen aus und richtet alles ein. Keine Website? Dann tippst du einfach dein Gewerk an.",
    punkte: ["eine Frage, mehr nicht", "Leistungen, Preise und Abläufe aus der Vorlage deines Gewerks", "alles später änderbar"],
    icon: "wrench",
    artikel: "konto-erstellen",
  },
  {
    id: "auftrag",
    wann: "Wenn du so weit bist",
    titel: "Erstes Angebot oder ersten Auftrag",
    dauer: "ca. 2 Minuten",
    text: "Direkt nach dem Start fragt Lotte: Was möchtest du als Erstes erledigen? Schreib ein Angebot oder leg einen Auftrag an – am besten einen echten von dieser Woche.",
    punkte: ["Kunden direkt mit anlegen", "Briefkopf prüft Lotte kurz vor dem ersten Versand"],
    icon: "clipboard",
    artikel: "ersten-auftrag-anlegen",
  },
  {
    id: "mitarbeiter",
    wann: "Wenn du so weit bist",
    titel: "Team hinzufügen",
    dauer: "ca. 3 Minuten",
    text: "Trag dein Team ein, sobald du planen willst, und gib jedem eine Rolle. Die Einladung zur App geht per SMS oder E-Mail raus.",
    punkte: ["Rollen wie Büro, Meister, Monteur", "jeder sieht nur, was er braucht"],
    icon: "users",
    artikel: "mitarbeiter-einladen",
  },
  {
    id: "app",
    wann: "Wenn du so weit bist",
    titel: "App installieren",
    dauer: "ca. 2 Minuten",
    text: "Lade die App auf dein Handy und melde dich an. So siehst du selbst, was dein Team auf der Baustelle sieht.",
    punkte: ["iPhone und Android", "Kamera und Standort erlauben"],
    icon: "smartphone",
    artikel: "app-installieren",
  },
  {
    id: "planung",
    wann: "Wenn du so weit bist",
    titel: "Erste Planung erstellen",
    dauer: "ca. 2 Minuten",
    text: "Zieh den Auftrag auf einen Mitarbeiter und einen Tag – oder lass dir von Lotte einen Vorschlag machen.",
    punkte: ["Einsatz erscheint sofort in der App", "Hinweise bei Urlaub oder fehlendem Material"],
    icon: "calendar",
    artikel: "einsatz-planen",
  },
];
