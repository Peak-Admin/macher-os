import type { FaqItem, IconName } from "@/components/ui";

/** Inhalte für `/hilfe/daten-uebernehmen` (Abschnitt 23). */

export const uebernehmbareDaten: { titel: string; text: string; icon: IconName }[] = [
  { titel: "Kunden", text: "Namen, Anschriften, Ansprechpartner, Telefon und E-Mail.", icon: "user" },
  { titel: "Mitarbeiter", text: "Namen, Kontaktdaten, Rollen und Qualifikationen.", icon: "users" },
  { titel: "Artikel & Material", text: "Bezeichnung, Einheit, Einkaufspreis, Aufschlag und Lieferant.", icon: "box" },
  { titel: "Offene Aufträge", text: "Was gerade läuft oder bald startet – mit Kunde, Ort und Beschreibung.", icon: "clipboard" },
  { titel: "Dokumente", text: "Angebote, Rechnungen, Pläne und Fotos als Datei am richtigen Kunden oder Auftrag.", icon: "file" },
];

export const datenQuellen: { titel: string; text: string; icon: IconName }[] = [
  {
    titel: "Excel und CSV",
    text: "Die meisten Listen liegen als Tabelle vor. Macher OS erkennt die Spalten und du ordnest sie zu.",
    icon: "layers",
  },
  {
    titel: "Andere Handwerkersoftware",
    text: "Fast jede Software kann Daten als Tabelle exportieren. Diesen Export übernimmst du wie eine Excel-Datei.",
    icon: "monitor",
  },
  {
    titel: "Großhändler-Daten",
    text: "Artikel und Preise kommen per Datanorm-Datei direkt vom Großhändler.",
    icon: "warehouse",
  },
  {
    titel: "Kontakte aus Handy und Mailprogramm",
    text: "Kontakte als vCard oder Export aus deinem Mailprogramm, zum Beispiel Outlook.",
    icon: "smartphone",
  },
];

export const uebernahmeAblauf: { titel: string; text: string }[] = [
  { titel: "Daten exportieren", text: "Speichere deine Listen als Excel- oder CSV-Datei – oder exportiere sie aus deiner alten Software." },
  { titel: "Datei hochladen", text: "In Macher OS unter „Betrieb“ → „Importieren“ die Datei auswählen." },
  { titel: "Spalten zuordnen", text: "Macher OS schlägt vor, welche Spalte wohin gehört. Du prüfst und korrigierst." },
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
      "Den Import mit Datei machst du selbst direkt in Macher OS. Ob und in welchem Umfang wir dich persönlich unterstützen und was das kostet, besprechen wir vorher mit dir.",
  },
  {
    frage: "Muss ich alles auf einmal übernehmen?",
    antwort:
      "Nein. Viele starten mit Kunden und Mitarbeitern und holen Artikel und Aufträge später nach.",
  },
];
