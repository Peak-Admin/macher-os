import type { FunktionSlug, TopGewerkSlug } from "@/content/registry";
import type { ThemaSlug } from "./themen";

export { KONTAKT_EMAIL } from "./themen";

/**
 * Webinare. Es gibt bewusst keine erfundenen Termine oder Personen:
 * - "aufzeichnung": Die Aufzeichnung wird auf Anfrage per E-Mail verschickt.
 * - "demnaechst": Termin steht noch nicht fest – Interessenten lassen sich benachrichtigen.
 */
export type WebinarStatus = "aufzeichnung" | "demnaechst";

export type Webinar = {
  slug: string;
  titel: string;
  kurz: string;
  status: WebinarStatus;
  /** Geplante Dauer in Minuten. */
  dauer: number;
  /** Sprecher als Rolle, keine Namen. */
  sprecher: string;
  fuerWen: string;
  nutzen: string[];
  agenda: { titel: string; text: string }[];
  themen: ThemaSlug[];
  /** Leer = für alle Gewerke. */
  gewerke: TopGewerkSlug[];
  funktionen: FunktionSlug[];
  /** Passende Blog-Artikel (Slugs). */
  artikel: string[];
  /** Datum der Aufnahme in die Übersicht (ISO). */
  datum: string;
  beliebt?: boolean;
};

export const sprecherRollen = [
  {
    rolle: "Handwerk OS Team",
    text: "Leute aus Beratung und Einrichtung, die jeden Tag mit Handwerksbetrieben sprechen und wissen, wo es im Alltag hakt.",
  },
  {
    rolle: "Produktteam",
    text: "Die Leute, die Handwerk OS bauen. Sie zeigen Funktionen live und nehmen eure Fragen und Wünsche direkt mit.",
  },
] as const;

export const webinare: Webinar[] = [
  {
    slug: "e-rechnung-im-handwerk",
    titel: "E-Rechnung im Handwerk: Was du jetzt tun musst",
    kurz: "Empfangspflicht, Übergangsfristen, Formate – verständlich erklärt, mit Zeit für Fragen.",
    status: "demnaechst",
    dauer: 45,
    sprecher: "Handwerk OS Team",
    fuerWen: "Inhaber und Büro in Betrieben mit Geschäftskunden, Hausverwaltungen oder öffentlichen Auftraggebern.",
    nutzen: [
      "Du weißt, welche Fristen für deinen Betrieb gelten.",
      "Du kennst den Unterschied zwischen PDF, ZUGFeRD und XRechnung.",
      "Du hast eine klare To-do-Liste für Empfang und Versand.",
    ],
    agenda: [
      { titel: "Was ist eine E-Rechnung – und was nicht?", text: "PDF, ZUGFeRD, XRechnung im Vergleich." },
      { titel: "Fristen 2025 bis 2028", text: "Empfangspflicht, 800.000-€-Grenze und Ausnahmen." },
      { titel: "Was sich im Büro ändert", text: "Eingang, Prüfung, Aufbewahrung, Versand." },
      { titel: "Live gezeigt", text: "Eine E-Rechnung in Handwerk OS erstellen und empfangen." },
      { titel: "Fragen und Antworten", text: "Keine Rechts- oder Steuerberatung, aber viele Praxistipps." },
    ],
    themen: ["auftraege-geld", "digital-arbeiten"],
    gewerke: [],
    funktionen: ["rechnungen", "zahlungen"],
    artikel: ["e-rechnung-handwerk"],
    datum: "2026-03-24",
    beliebt: true,
  },
  {
    slug: "macher-os-in-30-minuten",
    titel: "Handwerk OS in 30 Minuten",
    kurz: "Ein kompletter Auftrag live: von der Anfrage bis zur bezahlten Rechnung.",
    status: "demnaechst",
    dauer: 30,
    sprecher: "Produktteam",
    fuerWen: "Alle, die Handwerk OS kennenlernen wollen, bevor sie es selbst testen.",
    nutzen: [
      "Du siehst den ganzen Ablauf an einem echten Beispielauftrag.",
      "Du weißt, was Büro und Monteur jeweils sehen.",
      "Du kannst danach direkt selbst loslegen.",
    ],
    agenda: [
      { titel: "Anfrage und Kunde", text: "Wie eine Anfrage reinkommt und zum Auftrag wird." },
      { titel: "Angebot", text: "Aus Aufmaß und Positionen ein Angebot erstellen." },
      { titel: "Planung", text: "Einsatz planen, Monteur bekommt ihn aufs Handy." },
      { titel: "Baustelle", text: "Zeiten, Fotos, Material und Unterschrift in der App." },
      { titel: "Rechnung", text: "Rechnung aus den erfassten Daten – mit einem Klick." },
    ],
    themen: ["digital-arbeiten", "betrieb-fuehren"],
    gewerke: [],
    funktionen: ["auftraege", "angebote", "einsatzplanung", "rechnungen"],
    artikel: ["digitalisierung-handwerk-wo-anfangen"],
    datum: "2026-02-24",
    beliebt: true,
  },
  {
    slug: "stundensatz-und-kalkulation",
    titel: "Stundensatz und Kalkulation: Rechnen statt raten",
    kurz: "Wie du deinen Stundensatz berechnest und Angebote kalkulierst, die sich lohnen.",
    status: "demnaechst",
    dauer: 60,
    sprecher: "Handwerk OS Team",
    fuerWen: "Inhaber, Meister und alle, die Angebote kalkulieren.",
    nutzen: [
      "Du rechnest deinen Stundensatz mit echten Zahlen aus.",
      "Du erkennst, welche Kosten oft vergessen werden.",
      "Du weißt, wie Nachkalkulation deine Angebote besser macht.",
    ],
    agenda: [
      { titel: "Verrechenbare Stunden", text: "Warum 2.080 Stunden nicht 2.080 Stunden sind." },
      { titel: "Gemeinkosten", text: "Was alles in den Stundensatz gehört." },
      { titel: "Angebot kalkulieren", text: "Material, Lohn, Fremdleistungen, Fahrten." },
      { titel: "Nachkalkulation", text: "Aus jedem Auftrag lernen." },
      { titel: "Fragen und Antworten", text: "Eure Fragen aus dem Alltag." },
    ],
    themen: ["kalkulation", "auftraege-geld"],
    gewerke: [],
    funktionen: ["kalkulation", "angebote", "auswertung"],
    artikel: ["stundensatz-handwerker-berechnen", "angebot-richtig-kalkulieren"],
    datum: "2026-08-18",
  },
  {
    slug: "einsatzplanung-ohne-chaos",
    titel: "Einsatzplanung ohne Chaos",
    kurz: "Wochenplan, Notfälle, Qualifikationen: So planst du dein Team entspannter.",
    status: "demnaechst",
    dauer: 45,
    sprecher: "Produktteam",
    fuerWen: "Chefs, Bauleiter und Büro in Betrieben ab etwa drei Mitarbeitern.",
    nutzen: [
      "Du hast einen festen Planungsrhythmus für Woche und Tag.",
      "Du weißt, wie du Ausfälle und Notdienste einplanst.",
      "Du siehst, wie automatische Planungsvorschläge funktionieren.",
    ],
    agenda: [
      { titel: "Was zur Planung gehört", text: "Termin, Dauer, Qualifikation, Material, Fahrzeug." },
      { titel: "Planungsrhythmus", text: "Langfristig, wöchentlich, täglich." },
      { titel: "Notfälle und Ausfälle", text: "Puffer und schnelles Umplanen." },
      { titel: "Live gezeigt", text: "Einsatzplanung in Handwerk OS." },
    ],
    themen: ["planung", "mitarbeiter"],
    gewerke: ["elektriker", "shk"],
    funktionen: ["einsatzplanung", "kalender", "qualifikationen"],
    artikel: ["einsatzplanung-handwerk"],
    datum: "2026-09-15",
  },
  {
    slug: "ki-im-handwerksbetrieb",
    titel: "KI im Handwerksbetrieb – ehrlich erklärt",
    kurz: "Was KI heute im Büro abnimmt, wo die Grenzen liegen und worauf du beim Datenschutz achtest.",
    status: "demnaechst",
    dauer: 45,
    sprecher: "Handwerk OS Team",
    fuerWen: "Alle, die wissen wollen, was KI im eigenen Betrieb bringen kann – ohne Hype.",
    nutzen: [
      "Du kennst sinnvolle Einsatzbereiche für KI im Handwerk.",
      "Du weißt, worauf du bei Datenschutz und Einweisung achten musst.",
      "Du siehst Beispiele aus dem Büroalltag.",
    ],
    agenda: [
      { titel: "Was KI kann – und was nicht", text: "Telefon, Texte, Angebote, Planung, Dokumentation." },
      { titel: "Datenschutz und Pflichten", text: "DSGVO, Auftragsverarbeitung, KI-Kompetenz im Team." },
      { titel: "Live gezeigt", text: "Was Macher automatisch erledigt." },
      { titel: "Fragen und Antworten", text: "Eure Fragen und Bedenken." },
    ],
    themen: ["digital-arbeiten", "betrieb-fuehren"],
    gewerke: [],
    funktionen: ["automatisch-erledigen", "telefon"],
    artikel: ["ki-im-handwerk"],
    datum: "2026-09-22",
  },
];

export function getWebinar(slug: string) {
  return webinare.find((w) => w.slug === slug);
}

export function webinarHref(slug: string) {
  return `/wissen/webinare/${slug}`;
}

export const webinarStatusLabel: Record<WebinarStatus, string> = {
  aufzeichnung: "Aufzeichnung",
  demnaechst: "Demnächst – Termin folgt",
};
