import type { IconName } from "@/components/ui";
import type { FaqItem } from "@/components/ui/Faq";
import { funktionHref, type FunktionSlug } from "@/content/registry";

/**
 * Video-Anleitungen. Es gibt noch keine Videos – die Seite kündigt die Reihe an.
 * Bewusst ohne Längen, Sprecher, Termine oder Abrufzahlen: Das kommt erst, wenn ein Video fertig ist.
 */
export type VideoThema = {
  titel: string;
  text: string;
  icon: IconName;
  funktion: FunktionSlug;
  /** Beschriftung des Links zur Funktionsseite */
  funktionLabel: string;
};

export const videoStatus = "Kommt bald";

/** Geplante Themen – entlang der Kernabläufe im Betrieb. */
export const videoThemen: VideoThema[] = [
  {
    titel: "Dein erstes Angebot",
    text: "Kunde wählen, Positionen eintragen oder einsprechen, Angebot verschicken.",
    icon: "file",
    funktion: "angebote",
    funktionLabel: "Angebote",
  },
  {
    titel: "Rechnung schreiben",
    text: "Aus dem Auftrag eine Rechnung machen, prüfen und an den Kunden schicken.",
    icon: "euro",
    funktion: "rechnungen",
    funktionLabel: "Rechnungen",
  },
  {
    titel: "Einsatz planen",
    text: "Auftrag auf einen Tag legen, Mitarbeiter zuteilen, Plan fürs Team freigeben.",
    icon: "calendar",
    funktion: "einsatzplanung",
    funktionLabel: "Einsatzplanung",
  },
  {
    titel: "Zeiten erfassen",
    text: "Arbeitszeit auf der Baustelle oder im Büro buchen – und am Monatsende sauber abgeben.",
    icon: "clock",
    funktion: "zeiterfassung",
    funktionLabel: "Zeiterfassung",
  },
  {
    titel: "Fotos und Doku",
    text: "Fotos am Auftrag ablegen und die Baustelle so dokumentieren, dass du später alles findest.",
    icon: "camera",
    funktion: "dokumentation",
    funktionLabel: "Fotos & Dokumentation",
  },
  {
    titel: "Daten übernehmen",
    text: "Kunden, Artikel und Mitarbeiter aus Excel oder der alten Software einlesen.",
    icon: "layers",
    funktion: "daten-uebernehmen",
    funktionLabel: "Daten übernehmen",
  },
];

export function videoThemaHref(t: VideoThema) {
  return funktionHref(t.funktion);
}

/** Bis die Videos da sind: diese Seiten helfen schon heute. */
export const videoBisDahin: { titel: string; text: string; href: string; icon: IconName }[] = [
  {
    titel: "Hilfe-Center",
    text: "Anleitungen Schritt für Schritt und Antworten auf häufige Fragen.",
    href: "/hilfe-center",
    icon: "book",
  },
  {
    titel: "Schnellstart",
    text: "So richtest du Macher OS ein und legst los.",
    href: "/hilfe/schnellstart",
    icon: "bolt",
  },
  {
    titel: "Webinare",
    text: "Themen fürs Handwerk – mit Zeit für deine Fragen.",
    href: "/wissen/webinare",
    icon: "mic",
  },
  {
    titel: "Demo",
    text: "Macher OS mit Beispieldaten ansehen, ohne etwas einzurichten.",
    href: "/demo",
    icon: "monitor",
  },
];

export const videoFaq: FaqItem[] = [
  {
    frage: "Wann kommen die ersten Videos?",
    antwort:
      "Einen festen Termin gibt es noch nicht. Die Videos erscheinen nach und nach auf dieser Seite. Bis dahin helfen dir das Hilfe-Center und der Schnellstart.",
  },
  {
    frage: "Kosten die Video-Anleitungen etwas?",
    antwort: "Nein. Die Video-Anleitungen sind kostenlos – genau wie Hilfe-Center, Schnellstart und Webinare.",
  },
  {
    frage: "Ich brauche jetzt Hilfe. Was mache ich?",
    antwort:
      "Schau ins Hilfe-Center oder in den Schnellstart. Kommst du nicht weiter, schreib uns über Kontakt & Support – wir helfen persönlich.",
  },
  {
    frage: "Kann ich mir ein Thema wünschen?",
    antwort:
      "Ja. Schreib uns über Kontakt & Support, welcher Ablauf dir unklar ist. Wünsche aus dem Alltag nehmen wir gern in die Reihe auf.",
  },
];
