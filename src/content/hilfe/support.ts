import type { FaqItem } from "@/components/ui";
import { SUPPORT_EMAIL, KONTAKT_EMAIL, type Anliegen } from "@/content/unternehmen";

/** Auswahl auf `/hilfe/kontakt` (Abschnitt 22). */
export const supportAnliegen: Anliegen[] = [
  {
    id: "produktfrage",
    label: "Produktfrage",
    beschreibung: "Wie geht etwas? Kann Macher OS das?",
    icon: "chat",
    email: SUPPORT_EMAIL,
    platzhalter: "Was möchtest du wissen?",
  },
  {
    id: "technisch",
    label: "Technisches Problem",
    beschreibung: "Etwas funktioniert nicht wie erwartet.",
    icon: "bolt",
    email: SUPPORT_EMAIL,
    platzhalter: "Was hast du gemacht, was ist passiert? Browser oder Handy-Modell helfen uns.",
  },
  {
    id: "einrichtung",
    label: "Einrichtung",
    beschreibung: "Hilfe beim Start und beim Einrichten.",
    icon: "wrench",
    email: SUPPORT_EMAIL,
    platzhalter: "Wobei sollen wir dir helfen? Wie viele Leute arbeiten bei euch?",
  },
  {
    id: "datenuebernahme",
    label: "Datenübernahme",
    beschreibung: "Kunden, Artikel oder Aufträge mitnehmen.",
    icon: "download",
    email: SUPPORT_EMAIL,
    platzhalter: "Welche Daten willst du übernehmen und woher kommen sie (z. B. Excel, alte Software)?",
  },
  {
    id: "rechnung",
    label: "Rechnung",
    beschreibung: "Fragen zu deinem Tarif oder unserer Rechnung.",
    icon: "euro",
    email: KONTAKT_EMAIL,
    platzhalter: "Um welche Rechnung geht es und was ist deine Frage?",
  },
  {
    id: "sonstiges",
    label: "Sonstiges",
    beschreibung: "Alles andere.",
    icon: "inbox",
    email: SUPPORT_EMAIL,
    platzhalter: "Worum geht es?",
  },
];

/** Häufige Fragen auf `/hilfe`. */
export const hilfeFaq: FaqItem[] = [
  {
    frage: "Wie schnell bin ich startklar?",
    antwort:
      "In wenigen Minuten. Du beantwortest eine Frage: Welcher Betrieb bist du? Website angeben oder Gewerk antippen – fertig. Danach schreibst du direkt dein erstes Angebot oder legst einen Auftrag an.",
  },
  {
    frage: "Kann ich meine Daten aus Excel oder einer anderen Software mitnehmen?",
    antwort:
      "Ja. Kunden, Mitarbeiter und Artikel lassen sich aus Tabellen übernehmen, Artikel auch aus Großhändler-Dateien wie Datanorm. Bei größeren Mengen helfen wir dir persönlich.",
  },
  {
    frage: "Brauchen meine Mitarbeiter eine Schulung?",
    antwort:
      "In der Regel nicht. Die App zeigt nur das, was der Mitarbeiter für seinen Einsatz braucht. Für Büro und Chef gibt es kurze Anleitungen im Hilfe-Center.",
  },
  {
    frage: "Was passiert, wenn auf der Baustelle kein Netz ist?",
    antwort:
      "Zeiten, Fotos, Notizen, Material und Unterschrift gehen auch ohne Empfang. Sobald wieder Netz da ist, wird alles übertragen.",
  },
  {
    frage: "Wie erreiche ich euch, wenn ich nicht weiterkomme?",
    antwort:
      "Schreib uns über „Kontakt & Support“. Wähle dein Thema – dann landet deine Nachricht direkt bei den richtigen Leuten.",
  },
  {
    frage: "Kann ich meine Daten wieder herunterladen?",
    antwort:
      "Ja. Deine Daten gehören dir. Du kannst jederzeit einen vollständigen Export herunterladen.",
  },
];
