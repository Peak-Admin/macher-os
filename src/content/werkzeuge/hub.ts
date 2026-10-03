import type { FaqItem } from "@/components/ui";
import type { WerkzeugSlug } from "@/content/registry";

export const hub = {
  seoTitel: "Kostenlose Rechner für Handwerker – Stundensatz, Angebot, Material & mehr",
  beschreibung:
    "Kostenlose Werkzeuge für Handwerksbetriebe: Stundensatz, Stundenverrechnungssatz, Angebot, Materialaufschlag, Fahrtkosten und Deckungsbeitrag berechnen. Ohne Anmeldung.",
  intro:
    "Rechner für die Fragen, die jeden Betrieb jeden Tag beschäftigen: Was muss eine Stunde kosten? Lohnt sich der Auftrag? Deckt die Anfahrt ihre Kosten? Kostenlos und ohne Anmeldung.",
  vorteile: ["Kostenlos", "Ohne Anmeldung", "Deine Zahlen bleiben in deinem Browser"],
  neu: ["fahrtkosten-rechner", "deckungsbeitrags-rechner"] as WerkzeugSlug[],
  beliebt: ["stundensatz-rechner", "angebots-rechner"] as WerkzeugSlug[],
  faq: [
    {
      frage: "Sind die Rechner wirklich kostenlos?",
      antwort: "Ja. Alle Rechner sind kostenlos und ohne Anmeldung nutzbar. Du musst keine E-Mail-Adresse angeben.",
    },
    {
      frage: "Werden meine Zahlen gespeichert?",
      antwort:
        "Nein. Die Rechner laufen komplett in deinem Browser. Deine Eingaben werden nicht an uns geschickt. Wenn du ein Ergebnis behalten willst, kopierst, druckst oder mailst du es dir selbst.",
    },
    {
      frage: "Wie genau sind die Ergebnisse?",
      antwort:
        "So genau wie deine Eingaben. Die Rechner nutzen die gängigen Formeln aus der Kalkulation im Handwerk. Das Ergebnis ist eine Orientierung, keine Steuerberatung.",
    },
    {
      frage: "Kann ich die Rechner auf dem Handy nutzen?",
      antwort: "Ja. Alle Rechner funktionieren auf dem Handy, dem Tablet und am Rechner im Büro.",
    },
    {
      frage: "Was ist der Unterschied zu Handwerk OS?",
      antwort:
        "Die Rechner beantworten eine einzelne Frage. In Handwerk OS hinterlegst du deine Zahlen einmal – danach rechnen Angebote, Aufträge und Auswertungen automatisch damit.",
    },
  ] satisfies FaqItem[],
};
