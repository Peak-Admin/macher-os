/**
 * Zusatzdaten für die Preisseite: Vergleich, Wegweiser, Zusatzleistungen, FAQ.
 * Der Vergleich ist aus den Plänen in `preise.ts` abgeleitet („Alles aus …“) und
 * zeigt nur Punkte, in denen sich die Pläne unterscheiden.
 */
import type { FaqItem } from "@/components/ui";
import type { IconName } from "@/components/ui";
import type { FunktionSlug } from "./registry";

export type PlanId = "solo" | "team" | "betrieb" | "unternehmen";
export const planReihenfolge: PlanId[] = ["solo", "team", "betrieb", "unternehmen"];

/** `true` = enthalten, `false` = nicht enthalten, Text = Besonderheit. */
export type Zelle = boolean | string;

export type VergleichsZeile = {
  merkmal: string;
  /** Optionaler Link zur passenden Funktionsseite */
  funktion?: FunktionSlug;
  werte: Record<PlanId, Zelle>;
};

/** Ab welchem Plan etwas dabei ist – erzeugt die Werte für alle Pläne. */
function ab(plan: PlanId): Record<PlanId, Zelle> {
  const idx = planReihenfolge.indexOf(plan);
  return Object.fromEntries(planReihenfolge.map((p, i) => [p, i >= idx])) as Record<PlanId, Zelle>;
}

export const vergleich: { gruppe: string; zeilen: VergleichsZeile[] }[] = [
  {
    gruppe: "Team",
    zeilen: [
      {
        merkmal: "Wer arbeitet mit?",
        werte: { solo: "1 Chef + 1 Mitarbeiter", team: "bis 10 Mitarbeiter", betrieb: "bis 30 Mitarbeiter", unternehmen: "unbegrenzt" },
      },
      { merkmal: "Rechte und Rollen", werte: ab("betrieb") },
      { merkmal: "Mehrere Standorte", werte: ab("unternehmen") },
    ],
  },
  {
    gruppe: "Planen",
    zeilen: [
      { merkmal: "Einsatzplanung & Plantafel", funktion: "einsatzplanung", werte: ab("team") },
      { merkmal: "Automatische Planung", funktion: "einsatzplanung", werte: ab("betrieb") },
    ],
  },
  {
    gruppe: "Betrieb",
    zeilen: [
      { merkmal: "Zeiterfassung", funktion: "zeiterfassung", werte: ab("team") },
      { merkmal: "Material & Lager", funktion: "lager", werte: ab("team") },
      { merkmal: "Qualifikationen & Schulungen", funktion: "qualifikationen", werte: ab("betrieb") },
      { merkmal: "Nachkalkulation & Auswertungen", funktion: "auswertung", werte: ab("betrieb") },
    ],
  },
  {
    gruppe: "Macher erledigt",
    zeilen: [
      { merkmal: "Büroarbeit automatisch erledigen", funktion: "automatisch-erledigen", werte: ab("team") },
    ],
  },
  {
    gruppe: "Start",
    zeilen: [
      { merkmal: "Persönliche Einrichtung", werte: { solo: "Zubuchbar", team: "Zubuchbar", betrieb: "Zubuchbar", unternehmen: true } },
      { merkmal: "Spezielle Schnittstellen", werte: { solo: false, team: false, betrieb: "Auf Anfrage", unternehmen: true } },
    ],
  },
];

/** In allen Plänen gleich – steht nicht in der Vergleichstabelle. */
export const inAllenPlaenen = [
  "Anfragen, Angebote & Rechnungen",
  "Kalender & Termine",
  "App für die Baustelle",
  "Vorlagen für dein Gewerk",
];

/** Wegweiser „Welcher Plan passt zu mir?“ nach Teamgröße. */
export const wegweiser: { id: string; label: string; hinweis: string; plan: PlanId }[] = [
  { id: "1-2", label: "Nur ich oder zu zweit", hinweis: "Du machst fast alles selbst – Büro und Baustelle.", plan: "solo" },
  { id: "3-10", label: "3 bis 10 Leute", hinweis: "Mehrere Leute sind unterwegs und brauchen einen gemeinsamen Plan.", plan: "team" },
  {
    id: "11-30",
    label: "11 bis 30 Leute",
    hinweis: "Mit Büro, mehreren Teams und unterschiedlichen Qualifikationen.",
    plan: "betrieb",
  },
  {
    id: "30+",
    label: "Mehr als 30 Leute",
    hinweis: "Oder mehrere Standorte – wir stellen dir ein passendes Paket zusammen.",
    plan: "unternehmen",
  },
];

export const zusatzleistungen: { titel: string; text: string; icon: IconName; href: string; linkLabel: string }[] = [
  {
    titel: "Telefon-Assistent",
    text: "Macher nimmt Anrufe an, wenn ihr auf der Baustelle seid, und legt daraus Anfragen an.",
    icon: "phone",
    href: "/funktionen/telefon",
    linkLabel: "Telefon & Empfang",
  },
  {
    titel: "Zahlungsfunktionen",
    text: "Kunden bezahlen direkt aus der Rechnung. Macher behält offene Zahlungen im Blick.",
    icon: "euro",
    href: "/funktionen/zahlungen",
    linkLabel: "Zahlungen",
  },
  {
    titel: "Persönliche Einrichtung",
    text: "Wir richten Macher OS gemeinsam mit dir ein und übernehmen deine Daten.",
    icon: "users",
    href: "/hilfe/daten-uebernehmen",
    linkLabel: "Daten übernehmen",
  },
  {
    titel: "Spezielle Schnittstellen",
    text: "Anbindung an Programme, die dein Betrieb schon nutzt – zum Beispiel für Buchhaltung oder Großhandel.",
    icon: "link",
    href: "/kontakt",
    linkLabel: "Anfrage stellen",
  },
];

export const wechselSchritte = [
  { titel: "Daten schicken", text: "Kunden, Mitarbeiter und Artikel – als Liste oder Export aus deinem alten Programm." },
  { titel: "Wir übernehmen", text: "Wir helfen dir, alles sauber in Macher OS zu übernehmen." },
  { titel: "Loslegen", text: "Dein Team startet mit den gewohnten Daten – ohne doppelte Arbeit." },
];

export const preiseFaq: FaqItem[] = [
  {
    frage: "Kann ich Macher OS kostenlos testen?",
    antwort: "Ja. Du kannst Macher OS kostenlos testen – ohne Kreditkarte und ohne Verpflichtung.",
  },
  {
    frage: "Was ist der Unterschied zwischen monatlich und jährlich?",
    antwort:
      "Bei monatlicher Zahlung bist du monatlich kündbar. Bei jährlicher Zahlung zahlst du für das ganze Jahr im Voraus und bekommst dafür einen günstigeren Monatspreis.",
  },
  {
    frage: "Sind die Preise netto?",
    antwort: "Ja. Alle Preise sind Nettopreise pro Monat, zuzüglich der gesetzlichen Mehrwertsteuer.",
  },
  {
    frage: "Was passiert, wenn mein Team wächst?",
    antwort:
      "Jeder Plan hat eine Grenze, wie viele Mitarbeiter dabei sein können. Wächst dein Betrieb, wechselst du in den nächsten Plan.",
  },
  {
    frage: "Kosten die Zusatzleistungen extra?",
    antwort:
      "Zusatzleistungen wie Telefon-Assistent, Zahlungsfunktionen, persönliche Einrichtung oder spezielle Schnittstellen besprechen wir einzeln mit dir. Den Preis bekommst du auf Anfrage.",
  },
  {
    frage: "Hilft ihr mir beim Umstieg von einem anderen Programm?",
    antwort:
      "Ja. Kunden, Mitarbeiter und Artikel kannst du übernehmen. Wie das geht, steht unter „Daten übernehmen“ – und wenn es hakt, helfen wir dir persönlich.",
  },
];
