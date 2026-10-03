import { KONTAKT_EMAIL } from "@/content/unternehmen";
import { testTage } from "@/content/preise";
import { cta } from "@/lib/site";
import type { Landing } from "./typ";

/**
 * Wechsel-Seiten: `/wechseln` (Ablauf) und `/wechselbonus` (Angebot für laufende Verträge).
 *
 * Wechselbonus: Feste Konditionen gibt es noch nicht (Stand Oktober 2026). Bis sie freigegeben sind, steht hier
 * nur, dass wir pro Betrieb ein Angebot machen – keine Beträge, keine Freimonate erfinden.
 */

export const wechseln: Landing = {
  pfad: "/wechseln",
  meta: {
    title: "Wechseln zu Handwerk OS – so kommst du aus deiner alten Software raus",
    description:
      "Von Excel, Word oder einer anderen Handwerkersoftware zu Handwerk OS: Kunden, Artikel und Mitarbeiter mitnehmen, parallel testen, in Ruhe umsteigen.",
  },
  breadcrumbs: [{ label: "Wechseln zu Handwerk OS" }],
  hero: {
    eyebrow: "Wechseln zu Handwerk OS",
    title: "Umsteigen, ohne bei null anzufangen.",
    intro:
      "Die größte Hürde ist nicht die neue Software, sondern der Weg raus aus der alten. Wir zeigen dir, wie es geht – Schritt für Schritt und ohne Stillstand im Betrieb.",
    bild: "alltag/buero",
    aktionen: { primaer: cta.primary, sekundaer: { label: "Hilfe beim Umstieg", href: "#anfrage" } },
    hinweis: `${testTage} Tage kostenlos testen – parallel zur alten Software, ohne Kreditkarte.`,
  },
  schmerz: {
    eyebrow: "Was viele zurückhält",
    titel: "„Bis ich das alles umgezogen habe, mache ich's lieber wie bisher.“",
    punkte: [
      "Tausende Kunden in der alten Software",
      "Laufende Aufträge, die nicht liegen bleiben dürfen",
      "Ein Vertrag, der noch ein paar Monate läuft",
      "Keine Zeit für ein großes Umstellungsprojekt",
    ],
    antwort: "Du musst nicht alles auf einmal umziehen. Fang mit dem nächsten Auftrag an – den Rest holst du nach.",
  },
  ablauf: {
    eyebrow: "Der Umstieg",
    titel: "In fünf Schritten zu Handwerk OS.",
    schritte: [
      { titel: "Testen", text: "Richte Handwerk OS ein und spiel einen echten Auftrag durch – parallel zur alten Software." },
      { titel: "Exportieren", text: "Kunden, Artikel und Mitarbeiter aus der alten Software als Excel- oder CSV-Datei speichern." },
      { titel: "Übernehmen", text: "Datei hochladen, Spalten zuordnen, Vorschau prüfen. Doppelte werden markiert." },
      { titel: "Neue Aufträge in Handwerk OS", text: "Ab einem Stichtag läuft alles Neue in Handwerk OS. Alte Aufträge schließt du im alten System ab." },
      { titel: "Alte Software kündigen", text: "Wenn alles läuft. Alte Rechnungen bewahrst du für die gesetzliche Frist weiter auf." },
    ],
    link: { label: "Anleitung: Daten übernehmen", href: "/hilfe/daten-uebernehmen" },
  },
  vorteile: {
    eyebrow: "Was du mitnimmst",
    titel: "Das Wichtigste ist schnell drin.",
    karten: [
      { titel: "Kunden", text: "Aus Excel, CSV, deiner alten Software oder als Kontakte vom Handy.", icon: "user" },
      { titel: "Artikel & Preise", text: "Aus einer Tabelle oder per Datanorm direkt vom Großhändler.", icon: "box" },
      { titel: "Mitarbeiter", text: "Namen, Kontaktdaten und Rollen – deine Leute melden sich mit der Handynummer an.", icon: "users" },
      { titel: "Dokumente", text: "Alte Angebote, Pläne und Fotos als Datei am richtigen Kunden.", icon: "file" },
    ],
  },
  checkliste: {
    eyebrow: "Sicher wechseln",
    titel: "Du gehst kein Risiko ein.",
    punkte: [
      `${testTage} Tage kostenlos testen, ohne Kreditkarte`,
      "Der Test endet von selbst – kein Abo, das weiterläuft",
      "Ein Import lässt sich rückgängig machen",
      "Monatlich kündbar, Export deiner Daten immer kostenlos",
      "Server in Frankfurt",
    ],
    link: { label: "Wechselbonus ansehen", href: "/wechselbonus" },
  },
  anfrage: {
    titel: "Hilfe beim Umstieg",
    intro: "Viele Daten, alte Software oder keine Zeit? Schreib uns kurz, womit du heute arbeitest. Wir melden uns.",
    frage: "Womit arbeitest du heute?",
    betreff: "Umstieg",
    email: KONTAKT_EMAIL,
    anliegen: [
      {
        id: "software",
        label: "Andere Handwerkersoftware",
        beschreibung: "Du willst Daten aus einem anderen Programm mitnehmen.",
        icon: "monitor",
        email: KONTAKT_EMAIL,
        platzhalter: "Welche Software nutzt du, wie viele Kunden und Mitarbeiter hast du ungefähr?",
      },
      {
        id: "excel",
        label: "Excel, Word & Papier",
        beschreibung: "Deine Listen liegen in Tabellen oder Ordnern.",
        icon: "file",
        email: KONTAKT_EMAIL,
        platzhalter: "Welche Listen hast du, und was willst du zuerst übernehmen?",
      },
    ],
  },
  faq: [
    {
      frage: "Kann ich meine Daten aus jeder Software mitnehmen?",
      antwort:
        "Die meisten Programme können Kunden und Artikel als Tabelle exportieren. Diesen Export übernimmst du wie eine Excel-Datei. Schick uns im Zweifel eine Beispieldatei.",
    },
    {
      frage: "Muss ich die alte Software sofort kündigen?",
      antwort: "Nein. Teste parallel und kündige erst, wenn alles in Handwerk OS läuft.",
    },
    {
      frage: "Was ist mit laufenden Aufträgen?",
      antwort:
        "Die einfachste Lösung: Was angefangen ist, schließt du im alten System ab. Alles Neue legst du in Handwerk OS an. Offene Aufträge kannst du aber auch per Datei übernehmen.",
    },
    {
      frage: "Was passiert mit alten Rechnungen?",
      antwort:
        "Die bewahrst du für die gesetzliche Frist auf – als PDF oder mit Zugang zur alten Software. PDFs kannst du am Kunden in Handwerk OS ablegen.",
    },
  ],
  weiter: {
    links: [
      { label: "Software-Vergleich", href: "/vergleich", text: "Handwerk OS neben Excel, HERO, ToolTime & Co." },
      { label: "Wechselbonus", href: "/wechselbonus", text: "Du hast noch einen laufenden Vertrag?" },
      { label: "Schnittstellen", href: "/schnittstellen", text: "DATEV, GAEB, Datanorm und mehr." },
    ],
  },
  cta: { title: "Dein nächster Auftrag läuft in Handwerk OS.", intro: "Starte kostenlos – den Rest holst du nach." },
};

export const wechselbonus: Landing = {
  pfad: "/wechselbonus",
  meta: {
    title: "Wechselbonus – von deiner alten Handwerkersoftware zu Handwerk OS",
    description:
      "Dein alter Vertrag läuft noch? Mit dem Wechselbonus von Handwerk OS steigst du um, ohne doppelt zu zahlen. Schick uns deine Vertragsdaten, wir machen dir ein Angebot.",
  },
  breadcrumbs: [{ label: "Wechseln", href: "/wechseln" }, { label: "Wechselbonus" }],
  hero: {
    eyebrow: "Wechselbonus",
    title: "Nicht doppelt zahlen, nur weil der alte Vertrag noch läuft.",
    intro:
      "Dein Vertrag bei der alten Software läuft noch ein paar Monate? Sprich uns an. Wir machen dir ein Angebot, damit du jetzt wechseln kannst – nicht erst, wenn die Frist abläuft.",
    aktionen: { primaer: { label: "Wechselbonus anfragen", href: "#anfrage" }, sekundaer: { label: "Erst testen", href: cta.primary.href } },
  },
  ablauf: {
    titel: "So kommst du an deinen Wechselbonus.",
    schritte: [
      { titel: "Anfragen", text: "Schreib uns, welche Software du nutzt und wie lange dein Vertrag noch läuft." },
      { titel: "Angebot bekommen", text: "Wir schauen uns deine Lage an und machen dir ein persönliches Angebot." },
      { titel: "Umsteigen", text: "Du richtest Handwerk OS ein und nimmst deine Daten mit." },
    ],
  },
  vorteile: {
    eyebrow: "Was immer gilt",
    titel: "Auch ohne Bonus: Wechseln ohne Risiko.",
    karten: [
      { titel: `${testTage} Tage kostenlos`, text: "Ohne Kreditkarte. Der Test endet von selbst.", icon: "clock" },
      { titel: "Monatlich kündbar", text: "Keine Mindestlaufzeit, die dich festhält.", icon: "calendar" },
      { titel: "Daten mitnehmen", text: "Import per Excel, CSV und Datanorm.", icon: "download" },
      { titel: "Export kostenlos", text: "Deine Daten gehören dir – jederzeit.", icon: "shield" },
    ],
  },
  anfrage: {
    titel: "Wechselbonus anfragen",
    intro: "Ein paar Angaben reichen. Wir melden uns mit einem Angebot.",
    frage: "Wie groß ist dein Betrieb?",
    betreff: "Wechselbonus",
    email: KONTAKT_EMAIL,
    anliegen: [
      {
        id: "klein",
        label: "1 bis 10 Leute",
        beschreibung: "Solo oder kleines Team.",
        icon: "user",
        email: KONTAKT_EMAIL,
        platzhalter: "Welche Software nutzt du heute und bis wann läuft dein Vertrag?",
      },
      {
        id: "gross",
        label: "Mehr als 10 Leute",
        beschreibung: "Mehrere Teams oder Standorte.",
        icon: "users",
        email: KONTAKT_EMAIL,
        platzhalter: "Welche Software nutzt du heute, wie viele Leute arbeiten damit und bis wann läuft dein Vertrag?",
      },
    ],
  },
  faq: [
    {
      frage: "Wie hoch ist der Wechselbonus?",
      antwort:
        "Das hängt davon ab, wie groß dein Betrieb ist und wie lange dein alter Vertrag noch läuft. Deshalb machen wir dir ein persönliches Angebot.",
    },
    {
      frage: "Muss ich einen Nachweis schicken?",
      antwort: "Wir fragen nach, welche Software du nutzt und bis wann der Vertrag läuft. Eine Kopie der Kündigungsbestätigung hilft.",
    },
    {
      frage: "Kann ich vorher testen?",
      antwort: `Ja. Teste ${testTage} Tage kostenlos und frag den Bonus an, wenn du überzeugt bist.`,
    },
  ],
  weiter: {
    links: [
      { label: "Wechseln zu Handwerk OS", href: "/wechseln", text: "Der Umstieg Schritt für Schritt." },
      { label: "Preise", href: "/preise", text: "Ein Preis je Betrieb, alles drin." },
      { label: "Software-Vergleich", href: "/vergleich", text: "Die richtigen Fragen an jede Software." },
    ],
  },
};
