/**
 * Integrationen von Macher OS – die vier Säulen und alle geplanten Verbindungen mit Priorität.
 *
 * Bauplan und Reihenfolge: `docs/os/INTEGRATIONEN.md`. Der Stand („heute“, „teilweise“, „kommt“) folgt dem
 * Connector-Verzeichnis der Software (`src/os/modules/schnittstellen/connectoren.ts`) – was dort nicht verfügbar ist,
 * steht hier nie als fertig. Der Score (0–100) ist unsere interne Priorität: Was hoch steht, bauen wir zuerst.
 */
import type { GlasIconName } from "@/os/ui/glas";

export type SaeuleId = "connect" | "format" | "universal" | "handwerk";

export type Saeule = {
  id: SaeuleId;
  /** Produktname der Säule */
  name: string;
  /** ein Satz in Handwerkersprache: wofür? */
  kurz: string;
  text: string;
  icon: GlasIconName;
  /** technisches Fundament, ehrlich benannt */
  fundament: string;
};

export const saeulen: Saeule[] = [
  {
    id: "connect",
    name: "Macher Connect",
    kurz: "Deine Programme verbinden",
    text: "E-Mail, Kalender, Ablage, Buchhaltung und Zahlungen. Du meldest dich beim Anbieter an – Macher OS sieht dein Passwort nie.",
    icon: "link",
    fundament: "Über unseren Integrationspartner Pipedream Connect (Anmeldung per OAuth beim Anbieter).",
  },
  {
    id: "format",
    name: "Macher Format Engine",
    kurz: "Jedes Format im Handwerk",
    text: "DATEV, E-Rechnung, GAEB, DATANORM, Kontoauszug, Excel und mehr. Rein, raus, ohne Abtippen.",
    icon: "dokument",
    fundament: "Eingebaut in Macher OS. Jede Datei wird geprüft, bevor etwas übernommen wird.",
  },
  {
    id: "universal",
    name: "Macher Universal Connectors",
    kurz: "Für alles andere",
    text: "Weiterleitungs-Postfach, IMAP, Webhooks, REST-Schnittstelle und SFTP. Damit spricht Macher OS auch mit Programmen ohne fertige Verbindung.",
    icon: "stecker",
    fundament: "Eingebaut in Macher OS, mit denselben Rechten wie in der Software.",
  },
  {
    id: "handwerk",
    name: "Macher Handwerk Connect",
    kurz: "Direkt zum Großhandel",
    text: "IDS Connect, UGL, Open Masterdata und OCI. Bestellen im Shop deines Großhändlers – der Warenkorb landet am Auftrag.",
    icon: "einkauf",
    fundament: "Mit den Zugangsdaten deines Großhändlers. Jeder Großhändler wird einzeln angebunden.",
  },
];

export type Stand = "heute" | "teilweise" | "kommt";

export const STAND_LABEL: Record<Stand, string> = {
  heute: "Heute verfügbar",
  teilweise: "Teilweise verfügbar",
  kommt: "Kommt",
};

export type Integration = {
  id: string;
  name: string;
  saeule: SaeuleId;
  /** Typ aus der Prioritätenliste (Pipedream, Format Engine, …) */
  typ: string;
  /** Priorität 0–100 */
  score: number;
  stand: Stand;
  /** was heute geht bzw. was kommt – kurz */
  hinweis?: string;
  /** Logo-Datei unter `public/logos/integrationen/` (Herkunft: `docs/os/INTEGRATIONEN.md`) – nur für echte Marken */
  logo?: string;
  /** kurzer Markenname für Logo-Reihen, z. B. „Outlook“ */
  marke?: string;
  /** Kürzel für Formate und Standards ohne eigenes Logo, z. B. „X83“, „CSV“ */
  kuerzel?: string;
};

/** Alle Integrationen in der Reihenfolge der Prioritätenliste (Score absteigend). */
export const integrationen: Integration[] = [
  { id: "datev-buchungsstapel", marke: "DATEV", name: "DATEV Buchungsstapel / Export", saeule: "format", typ: "Format Engine", score: 100, stand: "heute", hinweis: "Rechnungen und Belege für den Steuerberater", logo: "datev.svg" },
  { id: "xrechnung", name: "XRechnung", saeule: "format", typ: "Format Engine", score: 100, stand: "heute", hinweis: "E-Rechnung nach XRechnung 3.0", kuerzel: "XR" },
  { id: "zugferd", name: "ZUGFeRD", saeule: "format", typ: "Format Engine", score: 100, stand: "kommt", hinweis: "PDF mit eingebetteten Rechnungsdaten", kuerzel: "ZF" },
  { id: "pdf-rechnung", name: "PDF-Rechnung", saeule: "format", typ: "Format Engine", score: 100, stand: "heute", hinweis: "Rechnung als PDF speichern und senden", kuerzel: "PDF" },
  { id: "csv", name: "CSV Import / Export", saeule: "format", typ: "Format Engine", score: 100, stand: "teilweise", hinweis: "Kunden, Artikel, Mitarbeiter einlesen", kuerzel: "CSV" },
  { id: "xlsx", name: "Excel (XLSX) Import / Export", saeule: "format", typ: "Format Engine", score: 100, stand: "teilweise", hinweis: "Excel-Listen einlesen", kuerzel: "XLSX" },
  { id: "email-inbox", name: "E-Mail-Postfach zum Weiterleiten", saeule: "universal", typ: "Universal Connector", score: 100, stand: "heute", hinweis: "Anfragen per Weiterleitung am Auftrag", kuerzel: "@" },
  { id: "gmail", name: "Gmail", saeule: "connect", typ: "Pipedream", score: 100, stand: "kommt", logo: "gmail.svg" },
  { id: "outlook", marke: "Outlook", name: "Microsoft Outlook", saeule: "connect", typ: "Pipedream", score: 100, stand: "kommt", logo: "outlook.svg" },
  { id: "google-kalender", marke: "Google Kalender", name: "Google Kalender", saeule: "connect", typ: "Pipedream", score: 100, stand: "kommt", hinweis: "Bis dahin: Kalenderdatei", logo: "google-kalender.svg" },
  { id: "microsoft-kalender", name: "Microsoft 365 Kalender", saeule: "connect", typ: "Pipedream", score: 100, stand: "kommt", hinweis: "Bis dahin: Kalenderdatei", logo: "microsoft-kalender.svg" },
  { id: "gaeb", name: "GAEB", saeule: "format", typ: "Format Engine", score: 100, stand: "heute", hinweis: "Leistungsverzeichnis ins Angebot", kuerzel: "GAEB" },
  { id: "datev-stammdaten", name: "DATEV Debitoren / Kreditoren", saeule: "format", typ: "Format Engine", score: 98, stand: "kommt", logo: "datev.svg" },
  { id: "ids-connect", name: "IDS Connect", saeule: "handwerk", typ: "Handwerk Connector", score: 98, stand: "kommt", hinweis: "Im Shop bestellen, Warenkorb zurück", kuerzel: "IDS" },
  { id: "datanorm", name: "DATANORM", saeule: "format", typ: "Format Engine", score: 98, stand: "heute", hinweis: "Artikel und Preise vom Großhändler", kuerzel: "DN" },
  { id: "gaeb-x83", name: "GAEB X83 – Angebotsaufforderung", saeule: "format", typ: "Format Engine", score: 98, stand: "heute", hinweis: "Einlesen", kuerzel: "X83" },
  { id: "gaeb-x84", name: "GAEB X84 – Angebot", saeule: "format", typ: "Format Engine", score: 98, stand: "teilweise", hinweis: "Einlesen heute, Abgabe kommt", kuerzel: "X84" },
  { id: "lexware", marke: "Lexware Office", name: "Lexware Office", saeule: "connect", typ: "Pipedream", score: 97, stand: "kommt", hinweis: "Bis dahin: DATEV-Export", logo: "lexware.svg" },
  { id: "datanorm-5", name: "DATANORM 5", saeule: "format", typ: "Format Engine", score: 97, stand: "heute", kuerzel: "DN5" },
  { id: "ugl", name: "UGL", saeule: "handwerk", typ: "Handwerk Connector", score: 96, stand: "kommt", hinweis: "Anfrage, Bestellung, Lieferschein", kuerzel: "UGL" },
  { id: "google-drive", name: "Google Drive", saeule: "connect", typ: "Pipedream", score: 96, stand: "kommt", logo: "google-drive.svg" },
  { id: "onedrive", marke: "OneDrive", name: "OneDrive / Microsoft 365", saeule: "connect", typ: "Pipedream", score: 96, stand: "kommt", logo: "onedrive.svg" },
  { id: "webhook-eingang", name: "Webhook eingehend", saeule: "universal", typ: "Universal Connector", score: 95, stand: "kommt", kuerzel: "IN" },
  { id: "webhook-ausgang", name: "Webhook ausgehend", saeule: "universal", typ: "Universal Connector", score: 95, stand: "heute", hinweis: "Andere Programme sofort benachrichtigen", kuerzel: "OUT" },
  { id: "imap", name: "IMAP / eigenes E-Mail-Konto", saeule: "universal", typ: "Universal Connector", score: 95, stand: "kommt", kuerzel: "IMAP" },
  { id: "xml", name: "XML Import / Export", saeule: "format", typ: "Format Engine", score: 95, stand: "teilweise", hinweis: "GAEB, Kontoauszug, XRechnung", kuerzel: "XML" },
  { id: "sevdesk", name: "sevDesk", saeule: "connect", typ: "Pipedream", score: 95, stand: "kommt", logo: "sevdesk.png" },
  { id: "open-masterdata", name: "Open Masterdata", saeule: "handwerk", typ: "Handwerk Connector", score: 94, stand: "kommt", hinweis: "Artikeldaten direkt vom Großhändler", kuerzel: "OM" },
  { id: "datanorm-4", name: "DATANORM 4", saeule: "format", typ: "Format Engine", score: 94, stand: "heute", kuerzel: "DN4" },
  { id: "stripe", name: "Stripe", saeule: "connect", typ: "Pipedream", score: 90, stand: "kommt", logo: "stripe.svg" },
  { id: "sumup", name: "SumUp", saeule: "connect", typ: "Pipedream", score: 90, stand: "kommt", logo: "sumup.svg" },
  { id: "rest-api", name: "REST-Schnittstelle (API)", saeule: "universal", typ: "Universal Connector", score: 90, stand: "kommt", hinweis: "Bis dahin: Datenexport und Webhooks", kuerzel: "API" },
  { id: "json", name: "JSON Import / Export", saeule: "format", typ: "Format Engine", score: 90, stand: "teilweise", hinweis: "Alle Daten exportieren", kuerzel: "JSON" },
  { id: "camt053", name: "CAMT.053 Kontoauszug", saeule: "format", typ: "Format Engine", score: 90, stand: "heute", hinweis: "Zahlungen den Rechnungen zuordnen", kuerzel: "CAMT" },
  { id: "ics", name: "ICS Kalenderdatei", saeule: "format", typ: "Format Engine", score: 90, stand: "heute", hinweis: "Termine für Outlook, Google, iPhone", kuerzel: "ICS" },
  { id: "pdfa", name: "PDF/A", saeule: "format", typ: "Format Engine", score: 90, stand: "kommt", hinweis: "Archivfähige Dokumente", kuerzel: "PDF/A" },
  { id: "gaeb-x86", name: "GAEB X86 – Auftrag", saeule: "format", typ: "Format Engine", score: 90, stand: "teilweise", hinweis: "Einlesen", kuerzel: "X86" },
  { id: "karten", marke: "Google Maps", name: "Google Maps / Apple Karten", saeule: "universal", typ: "Navigation", score: 90, stand: "heute", hinweis: "Mit einem Tipp zur Baustelle", logo: "google-maps.svg" },
  { id: "hubspot", name: "HubSpot", saeule: "connect", typ: "Pipedream", score: 85, stand: "kommt", logo: "hubspot.svg" },
  { id: "pipedrive", name: "Pipedrive", saeule: "connect", typ: "Pipedream", score: 85, stand: "kommt", logo: "pipedrive.svg" },
  { id: "dropbox", name: "Dropbox", saeule: "connect", typ: "Pipedream", score: 85, stand: "kommt", logo: "dropbox.svg" },
  { id: "google-sheets", name: "Google Sheets", saeule: "connect", typ: "Pipedream", score: 85, stand: "kommt", logo: "google-sheets.svg" },
  { id: "paypal", name: "PayPal", saeule: "connect", typ: "Pipedream", score: 85, stand: "kommt", logo: "paypal.svg" },
  { id: "oci", name: "OCI", saeule: "handwerk", typ: "Handwerk Connector", score: 85, stand: "kommt", hinweis: "Shops mit Open Catalog Interface", kuerzel: "OCI" },
  { id: "bmecat", name: "BMEcat", saeule: "format", typ: "Format Engine", score: 85, stand: "kommt", kuerzel: "BME" },
  { id: "ubl", name: "UBL", saeule: "format", typ: "Format Engine", score: 85, stand: "teilweise", hinweis: "Ausgabe als XRechnung (UBL 2.1)", kuerzel: "UBL" },
  { id: "cii", name: "CII", saeule: "format", typ: "Format Engine", score: 85, stand: "kommt", kuerzel: "CII" },
  { id: "vcard", name: "vCard (VCF)", saeule: "format", typ: "Format Engine", score: 85, stand: "kommt", hinweis: "Kontakte aus dem Handy", kuerzel: "VCF" },
  { id: "gaeb-x87", name: "GAEB X87 – Auftragsbestätigung", saeule: "format", typ: "Format Engine", score: 85, stand: "kommt", kuerzel: "X87" },
  { id: "gaeb-x89", name: "GAEB X89 – Rechnung", saeule: "format", typ: "Format Engine", score: 85, stand: "kommt", kuerzel: "X89" },
  { id: "sftp", name: "SFTP / FTP Import", saeule: "universal", typ: "Universal Connector", score: 82, stand: "kommt", kuerzel: "SFTP" },
  { id: "mt940", name: "MT940", saeule: "format", typ: "Format Engine", score: 80, stand: "kommt", hinweis: "Älteres Kontoauszugsformat", kuerzel: "MT940" },
  { id: "sepa", name: "SEPA-Überweisung (pain.001)", saeule: "format", typ: "Format Engine", score: 80, stand: "kommt", kuerzel: "SEPA" },
  { id: "etim", name: "ETIM", saeule: "format", typ: "Format Engine", score: 80, stand: "kommt", hinweis: "Artikelmerkmale nach Klassen", kuerzel: "ETIM" },
  { id: "gaeb-x31", name: "GAEB X31 – Mengenermittlung", saeule: "format", typ: "Format Engine", score: 80, stand: "kommt", kuerzel: "X31" },
];

/** Logo des Integrationspartners hinter Macher Connect */
export const pipedreamLogo = "pipedream.svg";

export function integrationenDerSaeule(id: SaeuleId): Integration[] {
  return integrationen.filter((i) => i.saeule === id).sort((a, b) => b.score - a.score);
}

/** Bekannte Marken für Logo-Reihen (Startseite, Menü). */
export const logoReihe: string[] = [
  "gmail",
  "outlook",
  "google-kalender",
  "datev-buchungsstapel",
  "lexware",
  "sevdesk",
  "google-drive",
  "onedrive",
  "stripe",
  "paypal",
  "dropbox",
  "karten",
  "hubspot",
  "sumup",
];

export function integration(id: string): Integration | undefined {
  return integrationen.find((i) => i.id === id);
}

export const integrationenZahl = integrationen.length;
export const heuteZahl = integrationen.filter((i) => i.stand !== "kommt").length;
