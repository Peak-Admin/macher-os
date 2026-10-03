import type { FaqItem, SkizzenMotiv } from "@/components/ui";

/** Inhalte für `/hilfe/daten-uebernehmen` (Abschnitt 23). */

export const uebernehmbareDaten: { titel: string; text: string; skizze: SkizzenMotiv }[] = [
  { titel: "Kunden", text: "Namen, Anschriften, Ansprechpartner, Telefon und E-Mail.", skizze: "kunden" },
  { titel: "Mitarbeiter", text: "Namen, Kontaktdaten, Rollen und Qualifikationen.", skizze: "mitarbeiter" },
  { titel: "Artikel & Material", text: "Bezeichnung, Einheit, Einkaufspreis, Aufschlag und Lieferant.", skizze: "material" },
  { titel: "Offene Aufträge", text: "Was gerade läuft oder bald startet – mit Kunde, Ort und Beschreibung.", skizze: "auftraege" },
  { titel: "Dokumente", text: "Angebote, Rechnungen, Pläne und Fotos als Datei am richtigen Kunden oder Auftrag.", skizze: "dokumente" },
];

export const datenQuellen: { titel: string; text: string; skizze: SkizzenMotiv }[] = [
  {
    titel: "Excel und CSV",
    text: "Die meisten Listen liegen als Tabelle vor. Handwerk OS erkennt die Spalten und du ordnest sie zu.",
    skizze: "tabelle",
  },
  {
    titel: "Andere Handwerkersoftware",
    text: "Fast jede Software kann Daten als Tabelle exportieren. Diesen Export übernimmst du wie eine Excel-Datei.",
    skizze: "software-export",
  },
  {
    titel: "Großhändler-Daten",
    text: "Artikel und Preise kommen per Datanorm-Datei direkt vom Großhändler.",
    skizze: "datanorm",
  },
  {
    titel: "Kontakte aus Handy und Mailprogramm",
    text: "Kontakte als vCard oder Export aus deinem Mailprogramm, zum Beispiel Outlook.",
    skizze: "handy-kontakte",
  },
];

export const uebernahmeAblauf: { titel: string; text: string }[] = [
  { titel: "Daten exportieren", text: "Speichere deine Listen als Excel- oder CSV-Datei – oder exportiere sie aus deiner alten Software." },
  { titel: "Datei hochladen", text: "In Handwerk OS unter „Betrieb“ → „Importieren“ die Datei auswählen." },
  { titel: "Spalten zuordnen", text: "Handwerk OS schlägt vor, welche Spalte wohin gehört. Du prüfst und korrigierst." },
  { titel: "Vorschau prüfen", text: "Du siehst vorher, was übernommen wird. Doppelte Einträge werden markiert." },
  { titel: "Übernehmen", text: "Mit einem Klick sind die Daten da. Ein Import lässt sich rückgängig machen." },
];

export const uebernahmeFaq: FaqItem[] = [
  {
    frage: "Funktioniert der Export aus meiner bisherigen Software?",
    antwort:
      "Das hängt von deiner Software ab. Die meisten Programme können Kunden und Artikel als Tabelle exportieren. Schick uns im Zweifel eine Beispieldatei, dann schauen wir sie uns an.",
  },
  {
    frage: "Was ist mit alten Rechnungen?",
    antwort:
      "Alte Rechnungen kannst du als PDF am Kunden ablegen. Für die gesetzliche Aufbewahrung behältst du zusätzlich deine bisherigen Unterlagen bzw. den Zugang zur alten Software.",
  },
  {
    frage: "Was kostet die Hilfe bei der Übernahme?",
    antwort:
      "Den Import mit Datei machst du selbst direkt in Handwerk OS. Ob und in welchem Umfang wir dich persönlich unterstützen und was das kostet, besprechen wir vorher mit dir.",
  },
  {
    frage: "Muss ich alles auf einmal übernehmen?",
    antwort:
      "Nein. Viele starten mit Kunden und Mitarbeitern und holen Artikel und Aufträge später nach.",
  },
];
