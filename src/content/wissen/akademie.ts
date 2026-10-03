import type { IconName } from "@/components/ui";
import type { FunktionSlug, TopGewerkSlug } from "@/content/registry";
import type { ThemaSlug } from "./themen";

export const rollen = [
  {
    slug: "chef",
    titel: "Chef",
    text: "Zahlen verstehen, Betrieb organisieren, Team führen.",
    icon: "award",
  },
  {
    slug: "buero",
    titel: "Büro",
    text: "Angebote, Rechnungen, Planung und Kundenkontakt sicher im Griff.",
    icon: "monitor",
  },
  {
    slug: "monteur",
    titel: "Monteur / Geselle",
    text: "Einsätze, Zeiten, Fotos und Doku schnell vom Handy erledigen.",
    icon: "wrench",
  },
  {
    slug: "azubi",
    titel: "Azubi",
    text: "Gut starten: Sicherheit, Abläufe und die App von Anfang an.",
    icon: "user",
  },
] as const satisfies readonly { slug: string; titel: string; text: string; icon: IconName }[];

export type RolleSlug = (typeof rollen)[number]["slug"];

export const lernbereiche = [
  {
    titel: "Betrieb & Zahlen",
    text: "Stundensatz, Kalkulation, Deckungsbeitrag und Liquidität verstehen.",
    icon: "chart",
  },
  {
    titel: "Aufträge & Büro",
    text: "Von der Anfrage bis zur bezahlten Rechnung – sauber und schnell.",
    icon: "clipboard",
  },
  {
    titel: "Team & Führung",
    text: "Einarbeiten, planen, führen und Wissen im Betrieb halten.",
    icon: "users",
  },
  {
    titel: "Handwerk OS nutzen",
    text: "Die Software Schritt für Schritt – für jede Rolle im Betrieb.",
    icon: "smartphone",
  },
] as const satisfies readonly { titel: string; text: string; icon: IconName }[];

export type Kurs = {
  slug: string;
  titel: string;
  kurz: string;
  lernbereich: (typeof lernbereiche)[number]["titel"];
  rollen: RolleSlug[];
  /** Leer = für alle Gewerke. */
  gewerke: TopGewerkSlug[];
  themen: ThemaSlug[];
  /** Ungefähre Lernzeit in Minuten. */
  dauer: number;
  lektionen: string[];
  funktionen: FunktionSlug[];
  beliebt?: boolean;
  /** Datum der Aufnahme ins Angebot (ISO). */
  datum: string;
};

export const kurse: Kurs[] = [
  {
    slug: "schnellstart-macher-os",
    titel: "Schnellstart: Handwerk OS in einer Stunde",
    kurz: "Betrieb einrichten, erste Kunden anlegen, ersten Auftrag durchspielen.",
    lernbereich: "Handwerk OS nutzen",
    rollen: ["chef", "buero"],
    gewerke: [],
    themen: ["digital-arbeiten"],
    dauer: 60,
    lektionen: [
      "Gewerk, Leistungen und Team einrichten",
      "Kunden und Artikel übernehmen",
      "Ersten Auftrag anlegen",
      "Mitarbeiter einladen",
      "Erste Rechnung schreiben",
    ],
    funktionen: ["auftraege", "kunden", "mitarbeiter"],
    beliebt: true,
    datum: "2026-01-15",
  },
  {
    slug: "app-fuer-monteure",
    titel: "Die App für Monteure",
    kurz: "Einsatz sehen, Zeiten erfassen, Fotos machen, Unterschrift holen – in 20 Minuten gelernt.",
    lernbereich: "Handwerk OS nutzen",
    rollen: ["monteur", "azubi"],
    gewerke: [],
    themen: ["digital-arbeiten"],
    dauer: 20,
    lektionen: [
      "Nächsten Einsatz öffnen und navigieren",
      "Auftrag starten und Zeiten erfassen",
      "Fotos und Sprachnotizen",
      "Material erfassen",
      "Unterschrift beim Kunden und Auftrag abschließen",
    ],
    funktionen: ["zeiterfassung", "dokumentation"],
    beliebt: true,
    datum: "2026-01-15",
  },
  {
    slug: "stundensatz-verstehen",
    titel: "Stundensatz verstehen und berechnen",
    kurz: "Was ein Stundensatz enthalten muss – mit eigener Rechnung für deinen Betrieb.",
    lernbereich: "Betrieb & Zahlen",
    rollen: ["chef"],
    gewerke: [],
    themen: ["kalkulation", "betrieb-fuehren"],
    dauer: 45,
    lektionen: [
      "Bezahlte und verrechenbare Stunden",
      "Lohn- und Lohnnebenkosten",
      "Gemeinkosten erfassen",
      "Wagnis und Gewinn",
      "Stundensatz regelmäßig prüfen",
    ],
    funktionen: ["kalkulation", "auswertung"],
    beliebt: true,
    datum: "2026-02-10",
  },
  {
    slug: "angebote-die-ueberzeugen",
    titel: "Angebote, die überzeugen",
    kurz: "Sauber kalkulieren, verständlich beschreiben, schnell verschicken, richtig nachfassen.",
    lernbereich: "Aufträge & Büro",
    rollen: ["chef", "buero"],
    gewerke: [],
    themen: ["kalkulation", "auftraege-geld"],
    dauer: 50,
    lektionen: [
      "Vom Aufmaß zur Position",
      "Material, Lohn und Fremdleistungen",
      "Leistungsbeschreibungen, die Kunden verstehen",
      "Zahlungsbedingungen und Abschläge",
      "Nachfassen ohne Nerven",
    ],
    funktionen: ["angebote", "kalkulation", "aufmass"],
    datum: "2026-03-03",
  },
  {
    slug: "rechnungen-und-zahlungen",
    titel: "Rechnungen schreiben und Geld reinholen",
    kurz: "Pflichtangaben, Abschlagsrechnungen, E-Rechnung und freundliche Zahlungserinnerungen.",
    lernbereich: "Aufträge & Büro",
    rollen: ["buero", "chef"],
    gewerke: [],
    themen: ["auftraege-geld"],
    dauer: 40,
    lektionen: [
      "Pflichtangaben auf der Rechnung",
      "Abschlags- und Schlussrechnung",
      "E-Rechnung empfangen und verschicken",
      "Offene Posten im Blick",
      "Zahlungserinnerung und Mahnung",
    ],
    funktionen: ["rechnungen", "zahlungen"],
    datum: "2026-03-17",
  },
  {
    slug: "baustelle-dokumentieren",
    titel: "Baustelle richtig dokumentieren",
    kurz: "Welche Fotos, Berichte und Unterschriften dich später schützen.",
    lernbereich: "Aufträge & Büro",
    rollen: ["monteur", "azubi", "chef"],
    gewerke: ["elektriker", "shk", "dachdecker", "bau", "fliesenleger"],
    themen: ["auftraege-geld", "digital-arbeiten"],
    dauer: 25,
    lektionen: [
      "Vorher, während, nachher: was fotografieren?",
      "Verdeckte Leitungen und Bauteile",
      "Regiebericht für Zusatzarbeiten",
      "Abnahme und Übergabe",
    ],
    funktionen: ["dokumentation"],
    datum: "2026-04-21",
  },
  {
    slug: "einsatzplanung-fuer-das-buero",
    titel: "Einsatzplanung für das Büro",
    kurz: "Wochenplan, Tagesplan, Notfälle und Qualifikationen – Schritt für Schritt.",
    lernbereich: "Team & Führung",
    rollen: ["buero", "chef"],
    gewerke: ["elektriker", "shk", "galabau"],
    themen: ["planung"],
    dauer: 35,
    lektionen: [
      "Planungsrhythmus festlegen",
      "Qualifikationen und Nachweise berücksichtigen",
      "Material und Fahrzeuge einplanen",
      "Ausfälle und Notdienste",
      "Automatische Planungsvorschläge nutzen",
    ],
    funktionen: ["einsatzplanung", "kalender", "qualifikationen"],
    datum: "2026-09-08",
  },
  {
    slug: "neue-mitarbeiter-einarbeiten",
    titel: "Neue Mitarbeiter gut einarbeiten",
    kurz: "Erster Tag, erste Woche, Probezeit – mit Unterweisung und klarem Plan.",
    lernbereich: "Team & Führung",
    rollen: ["chef"],
    gewerke: [],
    themen: ["mitarbeiter", "fuehrung"],
    dauer: 30,
    lektionen: [
      "Einarbeitungsplan erstellen",
      "Sicherheitsunterweisung vor dem ersten Einsatz",
      "Paten im Team",
      "Feedbackgespräche in der Probezeit",
    ],
    funktionen: ["mitarbeiter", "schulungen", "qualifikationen"],
    datum: "2026-05-19",
  },
  {
    slug: "sicher-starten-als-azubi",
    titel: "Sicher starten als Azubi",
    kurz: "Arbeitsschutz, Verhalten beim Kunden und die wichtigsten Abläufe im Betrieb.",
    lernbereich: "Team & Führung",
    rollen: ["azubi"],
    gewerke: [],
    themen: ["mitarbeiter"],
    dauer: 30,
    lektionen: [
      "Sicherheit auf der Baustelle",
      "Schutzausrüstung richtig nutzen",
      "Auftreten beim Kunden",
      "Berichtsheft und Zeiten",
      "Die App im Alltag",
    ],
    funktionen: ["schulungen", "zeiterfassung"],
    datum: "2026-07-07",
  },
];

export function kursAnker(slug: string) {
  return `/wissen/akademie#kurs-${slug}`;
}
