import type { FunktionSlug } from "@/content/registry";

/**
 * Änderungsprotokoll „Was ist neu?“ (`/neu`).
 * Nur Änderungen, die wirklich im Code stecken. Datum = Commit-Datum aus Git, `commit` = Beleg (Kurz-Hash).
 * Keine internen Umbauten (Refactorings, Tokens, CI). Neuester Eintrag oben.
 */
export type Neuigkeit = {
  /** ISO-Datum (JJJJ-MM-TT) aus der Git-Historie */
  datum: string;
  titel: string;
  text: string;
  funktion?: FunktionSlug;
  /** Beleg in der Git-Historie (Kurz-Hash) – wird nicht angezeigt */
  commit: string;
};

export const neuigkeiten: Neuigkeit[] = [
  {
    datum: "2026-10-02",
    titel: "Einrichtung mit einer Frage",
    text: "Statt Fragebogen fragt Macher OS nur noch: Welcher Betrieb bist du? Gibst du deine Website an, liest Macher Firmendaten, Logo, Gewerk und Leistungen aus – ohne Website reicht ein Tipp aufs Gewerk.",
    commit: "54bc787",
  },
  {
    datum: "2026-10-02",
    titel: "Zahlungen automatisch zuordnen",
    text: "Lies deine Kontoumsätze als CSV oder CAMT-Datei ein. Macher erkennt Rechnungsnummer, Betrag und Kunde, bucht Eindeutiges selbst und schlägt dir den Rest zum Zuordnen vor.",
    funktion: "zahlungen",
    commit: "c002424",
  },
  {
    datum: "2026-10-02",
    titel: "Großhandelspreise per DATANORM",
    text: "Artikel und Preise deines Großhändlers lassen sich als DATANORM-Datei (Version 4 und 5) einlesen.",
    funktion: "datanorm",
    commit: "c002424",
  },
  {
    datum: "2026-10-02",
    titel: "Ausschreibungen per GAEB einlesen",
    text: "Leistungsverzeichnisse im GAEB-Format (X83 und X84) liest du direkt ein und machst daraus Positionen für dein Angebot.",
    funktion: "gaeb",
    commit: "c002424",
  },
  {
    datum: "2026-10-02",
    titel: "Daten aus Excel übernehmen",
    text: "Kunden, Mitarbeiter, Artikel, Preise und offene Angebote, Aufträge und Rechnungen kommen per Excel oder CSV rein. Du siehst vorher, was doppelt ist – und kannst den ganzen Import rückgängig machen.",
    funktion: "daten-uebernehmen",
    commit: "140c6d3",
  },
  {
    datum: "2026-10-02",
    titel: "Alle Dokumente an einem Ort",
    text: "Angebote, Auftragsbestätigungen, Lieferscheine und Rechnungen kommen aus einer Stelle – mit Nummernkreisen, Versionen und Vorschau vor dem Versand. Die Schlussrechnung zieht bezahlte Abschläge selbst ab.",
    funktion: "dokumente",
    commit: "2771847",
  },
  {
    datum: "2026-10-02",
    titel: "Arbeitszeit mit Stundenkonto",
    text: "Arbeitszeitmodell je Mitarbeiter, Pausen nach Arbeitszeitgesetz (abschaltbar), Stundenkonto und Wochenfreigabe. Am Monatsende gibt es eine Übersicht als CSV fürs Lohnbüro.",
    funktion: "zeiterfassung",
    commit: "50b7d8e",
  },
  {
    datum: "2026-10-02",
    titel: "Einsatz vor Ort und Bericht per Sprache",
    text: "Monteure sehen den nächsten Einsatz mit Adresse und starten die Arbeit mit einem Tipp. Den Baustellenbericht sprichst du ein – Macher macht daraus Zeit, Material und Nachtrag.",
    funktion: "baustellen-app",
    commit: "1e6f499",
  },
  {
    datum: "2026-10-02",
    titel: "Auftragsabläufe je Gewerk",
    text: "Jeder Auftrag zeigt, wo er steht und was als Nächstes zu tun ist. Die Schritte passen zu deinem Gewerk, mit Zuständigen und Fristen.",
    funktion: "auftragsablaeufe",
    commit: "1cc4ee1",
  },
  {
    datum: "2026-10-02",
    titel: "Änderungen rückgängig machen",
    text: "Jede Änderung steht im Verlauf: wer, wann, was. Unter „Letzte Änderungen“ nimmst du sie mit einem Klick zurück.",
    commit: "295ca50",
  },
  {
    datum: "2026-10-02",
    titel: "Startseite nach deinem Geschmack",
    text: "Die Startseite „Heute“ stellst du dir selbst zusammen: Bausteine hinzufügen, verschieben, groß oder klein – gespeichert je Nutzer.",
    commit: "a675daa",
  },
  {
    datum: "2026-10-02",
    titel: "Fahrzeuge auf einen Blick",
    text: "Jedes Fahrzeug zeigt als Text, ob es frei, im Einsatz oder in der Werkstatt ist. Defekte meldest du mit dem Datum, ab wann es wieder fährt.",
    funktion: "fahrzeuge",
    commit: "c16514a",
  },
];

const monatFormat = new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric", timeZone: "UTC" });
const tagFormat = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function datumLang(iso: string) {
  return tagFormat.format(new Date(`${iso}T00:00:00Z`));
}

/** Einträge nach Monat gruppiert, neuester Monat und neuester Eintrag zuerst. */
export function neuigkeitenNachMonat() {
  const sortiert = [...neuigkeiten].sort((a, b) => b.datum.localeCompare(a.datum));
  const gruppen: { schluessel: string; monat: string; eintraege: Neuigkeit[] }[] = [];
  for (const n of sortiert) {
    const schluessel = n.datum.slice(0, 7);
    let gruppe = gruppen.find((g) => g.schluessel === schluessel);
    if (!gruppe) {
      gruppe = { schluessel, monat: monatFormat.format(new Date(`${schluessel}-01T00:00:00Z`)), eintraege: [] };
      gruppen.push(gruppe);
    }
    gruppe.eintraege.push(n);
  }
  return gruppen;
}
