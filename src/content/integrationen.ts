/**
 * Integrationen von Handwerk OS – die vier Säulen und alle geplanten Verbindungen mit Priorität.
 *
 * Bauplan und Reihenfolge: `docs/os/INTEGRATIONEN.md`. Alle Integrationen gehören zum Angebot von Handwerk OS – es gibt
 * keine „Kommt“-Phase: Wir prüfen eine Integration intern und bauen sie dann direkt. Der Score (0–100) ist unsere interne
 * Reihenfolge und wird nicht angezeigt.
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
    text: "E-Mail, Kalender, Ablage, Buchhaltung und Zahlungen. Du meldest dich beim Anbieter an – Handwerk OS sieht dein Passwort nie.",
    icon: "link",
    fundament: "Über unseren Integrationspartner Pipedream Connect (Anmeldung per OAuth beim Anbieter).",
  },
  {
    id: "format",
    name: "Macher Format Engine",
    kurz: "Jedes Format im Handwerk",
    text: "DATEV, E-Rechnung, GAEB, DATANORM, Kontoauszug, Excel und mehr. Rein, raus, ohne Abtippen.",
    icon: "dokument",
    fundament: "Eingebaut in Handwerk OS. Jede Datei wird geprüft, bevor etwas übernommen wird.",
  },
  {
    id: "universal",
    name: "Macher Universal Connectors",
    kurz: "Für alles andere",
    text: "Weiterleitungs-Postfach, IMAP, Webhooks, REST-Schnittstelle und SFTP. Damit spricht Handwerk OS auch mit Programmen ohne fertige Verbindung.",
    icon: "stecker",
    fundament: "Eingebaut in Handwerk OS, mit denselben Rechten wie in der Software.",
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

export type Integration = {
  id: string;
  name: string;
  saeule: SaeuleId;
  /** Typ aus der Prioritätenliste (Pipedream, Format Engine, …) */
  typ: string;
  /** Priorität 0–100 */
  score: number;
  /** wofür – kurz */
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
  { id: "datev-buchungsstapel", marke: "DATEV", name: "DATEV Buchungsstapel / Export", saeule: "format", typ: "Format Engine", score: 100, hinweis: "Rechnungen und Belege für den Steuerberater", logo: "datev.svg" },
  { id: "xrechnung", name: "XRechnung", saeule: "format", typ: "Format Engine", score: 100, hinweis: "E-Rechnung nach XRechnung 3.0", kuerzel: "XR" },
  { id: "zugferd", name: "ZUGFeRD", saeule: "format", typ: "Format Engine", score: 100, hinweis: "PDF mit eingebetteten Rechnungsdaten", kuerzel: "ZF" },
  { id: "pdf-rechnung", name: "PDF-Rechnung", saeule: "format", typ: "Format Engine", score: 100, hinweis: "Rechnung als PDF speichern und senden", kuerzel: "PDF" },
  { id: "csv", name: "CSV Import / Export", saeule: "format", typ: "Format Engine", score: 100, hinweis: "Kunden, Artikel, Mitarbeiter rein und raus", kuerzel: "CSV" },
  { id: "xlsx", name: "Excel (XLSX) Import / Export", saeule: "format", typ: "Format Engine", score: 100, hinweis: "Excel-Listen rein und raus", kuerzel: "XLSX" },
  { id: "email-inbox", name: "E-Mail-Postfach zum Weiterleiten", saeule: "universal", typ: "Universal Connector", score: 100, hinweis: "Anfragen per Weiterleitung am Auftrag", kuerzel: "@" },
  { id: "gmail", name: "Gmail", saeule: "connect", typ: "Pipedream", score: 100, logo: "gmail.svg" },
  { id: "outlook", marke: "Outlook", name: "Microsoft Outlook", saeule: "connect", typ: "Pipedream", score: 100, logo: "outlook.svg" },
  { id: "google-kalender", marke: "Google Kalender", name: "Google Kalender", saeule: "connect", typ: "Pipedream", score: 100, hinweis: "Termine im Kalender abgleichen", logo: "google-kalender.svg" },
  { id: "microsoft-kalender", name: "Microsoft 365 Kalender", saeule: "connect", typ: "Pipedream", score: 100, hinweis: "Termine im Kalender abgleichen", logo: "microsoft-kalender.svg" },
  { id: "gaeb", name: "GAEB", saeule: "format", typ: "Format Engine", score: 100, hinweis: "Leistungsverzeichnis ins Angebot", kuerzel: "GAEB" },
  { id: "datev-stammdaten", name: "DATEV Debitoren / Kreditoren", saeule: "format", typ: "Format Engine", score: 98, logo: "datev.svg" },
  { id: "ids-connect", name: "IDS Connect", saeule: "handwerk", typ: "Handwerk Connector", score: 98, hinweis: "Im Shop bestellen, Warenkorb zurück", kuerzel: "IDS" },
  { id: "datanorm", name: "DATANORM", saeule: "format", typ: "Format Engine", score: 98, hinweis: "Artikel und Preise vom Großhändler", kuerzel: "DN" },
  { id: "gaeb-x83", name: "GAEB X83 – Angebotsaufforderung", saeule: "format", typ: "Format Engine", score: 98, hinweis: "Einlesen", kuerzel: "X83" },
  { id: "gaeb-x84", name: "GAEB X84 – Angebot", saeule: "format", typ: "Format Engine", score: 98, hinweis: "Einlesen und abgeben", kuerzel: "X84" },
  { id: "lexware", marke: "Lexware Office", name: "Lexware Office", saeule: "connect", typ: "Pipedream", score: 97, hinweis: "Rechnungen und Belege übertragen", logo: "lexware.svg" },
  { id: "datanorm-5", name: "DATANORM 5", saeule: "format", typ: "Format Engine", score: 97, kuerzel: "DN5" },
  { id: "ugl", name: "UGL", saeule: "handwerk", typ: "Handwerk Connector", score: 96, hinweis: "Anfrage, Bestellung, Lieferschein", kuerzel: "UGL" },
  { id: "google-drive", name: "Google Drive", saeule: "connect", typ: "Pipedream", score: 96, logo: "google-drive.svg" },
  { id: "onedrive", marke: "OneDrive", name: "OneDrive / Microsoft 365", saeule: "connect", typ: "Pipedream", score: 96, logo: "onedrive.svg" },
  { id: "webhook-eingang", name: "Webhook eingehend", saeule: "universal", typ: "Universal Connector", score: 95, kuerzel: "IN" },
  { id: "webhook-ausgang", name: "Webhook ausgehend", saeule: "universal", typ: "Universal Connector", score: 95, hinweis: "Andere Programme sofort benachrichtigen", kuerzel: "OUT" },
  { id: "imap", name: "IMAP / eigenes E-Mail-Konto", saeule: "universal", typ: "Universal Connector", score: 95, kuerzel: "IMAP" },
  { id: "xml", name: "XML Import / Export", saeule: "format", typ: "Format Engine", score: 95, hinweis: "GAEB, Kontoauszug, XRechnung", kuerzel: "XML" },
  { id: "sevdesk", name: "sevDesk", saeule: "connect", typ: "Pipedream", score: 95, logo: "sevdesk.png" },
  { id: "open-masterdata", name: "Open Masterdata", saeule: "handwerk", typ: "Handwerk Connector", score: 94, hinweis: "Artikeldaten direkt vom Großhändler", kuerzel: "OM" },
  { id: "datanorm-4", name: "DATANORM 4", saeule: "format", typ: "Format Engine", score: 94, kuerzel: "DN4" },
  { id: "stripe", name: "Stripe", saeule: "connect", typ: "Pipedream", score: 90, logo: "stripe.svg" },
  { id: "sumup", name: "SumUp", saeule: "connect", typ: "Pipedream", score: 90, logo: "sumup.svg" },
  { id: "rest-api", name: "REST-Schnittstelle (API)", saeule: "universal", typ: "Universal Connector", score: 90, hinweis: "Daten lesen und schreiben", kuerzel: "API" },
  { id: "json", name: "JSON Import / Export", saeule: "format", typ: "Format Engine", score: 90, hinweis: "Daten für eigene Programme", kuerzel: "JSON" },
  { id: "camt053", name: "CAMT.053 Kontoauszug", saeule: "format", typ: "Format Engine", score: 90, hinweis: "Zahlungen den Rechnungen zuordnen", kuerzel: "CAMT" },
  { id: "ics", name: "ICS Kalenderdatei", saeule: "format", typ: "Format Engine", score: 90, hinweis: "Termine für Outlook, Google, iPhone", kuerzel: "ICS" },
  { id: "pdfa", name: "PDF/A", saeule: "format", typ: "Format Engine", score: 90, hinweis: "Archivfähige Dokumente", kuerzel: "PDF/A" },
  { id: "gaeb-x86", name: "GAEB X86 – Auftrag", saeule: "format", typ: "Format Engine", score: 90, hinweis: "Einlesen", kuerzel: "X86" },
  { id: "karten", marke: "Google Maps", name: "Google Maps / Apple Karten", saeule: "universal", typ: "Navigation", score: 90, hinweis: "Mit einem Tipp zur Baustelle", logo: "google-maps.svg" },
  { id: "hubspot", name: "HubSpot", saeule: "connect", typ: "Pipedream", score: 85, logo: "hubspot.svg" },
  { id: "pipedrive", name: "Pipedrive", saeule: "connect", typ: "Pipedream", score: 85, logo: "pipedrive.svg" },
  { id: "dropbox", name: "Dropbox", saeule: "connect", typ: "Pipedream", score: 85, logo: "dropbox.svg" },
  { id: "google-sheets", name: "Google Sheets", saeule: "connect", typ: "Pipedream", score: 85, logo: "google-sheets.svg" },
  { id: "paypal", name: "PayPal", saeule: "connect", typ: "Pipedream", score: 85, logo: "paypal.svg" },
  { id: "oci", name: "OCI", saeule: "handwerk", typ: "Handwerk Connector", score: 85, hinweis: "Shops mit Open Catalog Interface", kuerzel: "OCI" },
  { id: "bmecat", name: "BMEcat", saeule: "format", typ: "Format Engine", score: 85, kuerzel: "BME" },
  { id: "ubl", name: "UBL", saeule: "format", typ: "Format Engine", score: 85, hinweis: "E-Rechnung im UBL-Format", kuerzel: "UBL" },
  { id: "cii", name: "CII", saeule: "format", typ: "Format Engine", score: 85, kuerzel: "CII" },
  { id: "vcard", name: "vCard (VCF)", saeule: "format", typ: "Format Engine", score: 85, hinweis: "Kontakte aus dem Handy", kuerzel: "VCF" },
  { id: "gaeb-x87", name: "GAEB X87 – Auftragsbestätigung", saeule: "format", typ: "Format Engine", score: 85, kuerzel: "X87" },
  { id: "gaeb-x89", name: "GAEB X89 – Rechnung", saeule: "format", typ: "Format Engine", score: 85, kuerzel: "X89" },
  { id: "sftp", name: "SFTP / FTP Import", saeule: "universal", typ: "Universal Connector", score: 82, kuerzel: "SFTP" },
  { id: "mt940", name: "MT940", saeule: "format", typ: "Format Engine", score: 80, hinweis: "Älteres Kontoauszugsformat", kuerzel: "MT940" },
  { id: "sepa", name: "SEPA-Überweisung (pain.001)", saeule: "format", typ: "Format Engine", score: 80, kuerzel: "SEPA" },
  { id: "etim", name: "ETIM", saeule: "format", typ: "Format Engine", score: 80, hinweis: "Artikelmerkmale nach Klassen", kuerzel: "ETIM" },
  { id: "gaeb-x31", name: "GAEB X31 – Mengenermittlung", saeule: "format", typ: "Format Engine", score: 80, kuerzel: "X31" },
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
