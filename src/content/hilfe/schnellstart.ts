import type { IconName } from "@/components/ui";

export type SchnellstartAnsicht =
  | "konto"
  | "gewerk"
  | "leistungen"
  | "mitarbeiter"
  | "auftrag"
  | "app"
  | "planung";

export type SchnellstartSchritt = {
  id: SchnellstartAnsicht;
  titel: string;
  dauer: string;
  text: string;
  punkte: string[];
  icon: IconName;
  /** Passender Artikel im Hilfe-Center. */
  artikel?: string;
};

/** Sieben Schritte nach Abschnitt 20. Dauer ist eine grobe Orientierung. */
export const schnellstartSchritte: SchnellstartSchritt[] = [
  {
    id: "konto",
    titel: "Konto erstellen",
    dauer: "ca. 1 Minute",
    text: "Name, E-Mail, Passwort. Mehr brauchst du nicht. Keine Kreditkarte, keine Verpflichtung.",
    punkte: ["E-Mail-Adresse bestätigen", "Betriebsname und Anschrift eintragen"],
    icon: "user",
    artikel: "konto-erstellen",
  },
  {
    id: "gewerk",
    titel: "Gewerk wählen",
    dauer: "ca. 1 Minute",
    text: "Sag Macher OS, was für ein Betrieb du bist. Danach passen Begriffe, Vorlagen und Abläufe zu deinem Handwerk.",
    punkte: ["ein oder mehrere Gewerke", "später jederzeit änderbar"],
    icon: "wrench",
    artikel: "gewerk-und-leistungen-anpassen",
  },
  {
    id: "leistungen",
    titel: "Leistungen wählen",
    dauer: "ca. 2 Minuten",
    text: "Kreuze an, was ihr anbietet. Macher OS legt dazu passende Leistungen, Checklisten und Textbausteine an.",
    punkte: ["fertige Vorschläge je Gewerk", "eigene Leistungen ergänzen"],
    icon: "clipboard",
    artikel: "gewerk-und-leistungen-anpassen",
  },
  {
    id: "mitarbeiter",
    titel: "Mitarbeiter hinzufügen",
    dauer: "ca. 3 Minuten",
    text: "Trag dein Team ein und gib jedem eine Rolle. Die Einladung zur App geht per SMS oder E-Mail raus.",
    punkte: ["Rollen wie Büro, Meister, Monteur", "jeder sieht nur, was er braucht"],
    icon: "users",
    artikel: "mitarbeiter-einladen",
  },
  {
    id: "auftrag",
    titel: "Ersten Auftrag anlegen",
    dauer: "ca. 2 Minuten",
    text: "Kunde, Ort, was zu tun ist. Fertig. Am besten nimmst du gleich einen echten Auftrag von dieser Woche.",
    punkte: ["Kunden direkt mit anlegen", "Material und Fotos hängen später am Auftrag"],
    icon: "clipboard",
    artikel: "ersten-auftrag-anlegen",
  },
  {
    id: "app",
    titel: "App installieren",
    dauer: "ca. 2 Minuten",
    text: "Lade die App auf dein Handy und melde dich an. So siehst du selbst, was dein Team auf der Baustelle sieht.",
    punkte: ["iPhone und Android", "Kamera und Standort erlauben"],
    icon: "smartphone",
    artikel: "app-installieren",
  },
  {
    id: "planung",
    titel: "Erste Planung erstellen",
    dauer: "ca. 2 Minuten",
    text: "Zieh den Auftrag auf einen Mitarbeiter und einen Tag – oder lass dir von Macher einen Vorschlag machen.",
    punkte: ["Einsatz erscheint sofort in der App", "Hinweise bei Urlaub oder fehlendem Material"],
    icon: "calendar",
    artikel: "einsatz-planen",
  },
];
