import type { IconName } from "@/components/ui";

/**
 * „Was ist neu?“ (`/neuigkeiten`). Nur Funktionen, die es in Macher OS wirklich gibt (Code unter `src/os/modules/`).
 * Neue Einträge oben anfügen. Geplantes steht getrennt in `demnaechst` und nie als fertig.
 */

export type Neuigkeit = { titel: string; text: string; icon: IconName; bereich: string; link?: { label: string; href: string } };

export const neuigkeiten: { monat: string; eintraege: Neuigkeit[] }[] = [
  {
    monat: "Oktober 2026",
    eintraege: [
      {
        titel: "Startklar mit einer Frage",
        text: "Du wählst dein Gewerk – Macher OS richtet Leistungen, Vorlagen und Abläufe passend ein. Danach geht es direkt zum ersten Angebot.",
        icon: "spark",
        bereich: "Einrichtung",
        link: { label: "Schnellstart", href: "/hilfe/schnellstart" },
      },
      {
        titel: "Ausschreibungen per GAEB einlesen",
        text: "Leistungsverzeichnisse im GAEB-XML-Format landen mit allen Positionen im Angebot. Du trägst nur noch die Preise ein.",
        icon: "file",
        bereich: "Angebote",
        link: { label: "Schnittstellen", href: "/schnittstellen" },
      },
      {
        titel: "Artikel per Datanorm",
        text: "Artikel und Preise deines Großhändlers einlesen. Vorhandene Artikel werden aktualisiert, nicht verdoppelt.",
        icon: "warehouse",
        bereich: "Material",
        link: { label: "Großhändler-Daten einlesen", href: "/hilfe-center/grosshaendler-daten" },
      },
      {
        titel: "Zahlungen automatisch zuordnen",
        text: "Kontoauszug als CAMT.053 oder CSV einlesen – Macher ordnet die Zahlungen den offenen Rechnungen zu.",
        icon: "euro",
        bereich: "Geld",
        link: { label: "Zahlungen verfolgen", href: "/hilfe-center/zahlungen-verfolgen" },
      },
      {
        titel: "E-Rechnung nach XRechnung",
        text: "Rechnungen und Gutschriften als XRechnung 3.0 – mit allen Pflichtfeldern.",
        icon: "check",
        bereich: "Geld",
        link: { label: "Rechnungen", href: "/funktionen/rechnungen" },
      },
      {
        titel: "Daten übernehmen per Datei",
        text: "Kunden, Artikel und Mitarbeiter aus Excel oder CSV. Macher OS erkennt die Spalten, findet Doppelte und lässt sich rückgängig machen.",
        icon: "download",
        bereich: "Start",
        link: { label: "Daten übernehmen", href: "/hilfe/daten-uebernehmen" },
      },
      {
        titel: "Baustellenbericht per Sprache",
        text: "Auf der Baustelle einsprechen statt tippen. Der Bericht hängt direkt am Auftrag.",
        icon: "mic",
        bereich: "Baustelle",
        link: { label: "Fotos & Dokumentation", href: "/funktionen/dokumentation" },
      },
      {
        titel: "Arbeitszeiten mit Regeln",
        text: "Pausen, Überstunden und Ruhezeiten nach deinen Regeln – Macher weist auf Lücken und Verstöße hin.",
        icon: "clock",
        bereich: "Team",
        link: { label: "Zeiterfassung", href: "/funktionen/zeiterfassung" },
      },
    ],
  },
];

/** Geplant laut `src/os/modules/schnittstellen/connectoren.ts` und `rechnungen/xrechnung.ts` – ohne Termine. */
export const demnaechst = [
  "Bankkonto direkt verbinden",
  "Lexware Office",
  "Google Kalender und Outlook laufend abgleichen",
  "Bestellen über IDS Connect und OCI",
  "ZUGFeRD-Rechnungen",
  "Store-Apps für iPhone und Android",
];
