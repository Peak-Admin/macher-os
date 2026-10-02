import type { FunktionSlug, TopGewerkSlug } from "@/content/registry";
import type { ThemaSlug } from "./themen";

export type VorlageArt = "Vorlage" | "Checkliste" | "Formular";

/** Bausteine der druckbaren Vorlage. */
export type VorlageBlock =
  /** Kopfzeilen zum Ausfüllen, z. B. Kunde, Baustelle, Datum. */
  | { typ: "felder"; titel?: string; felder: string[] }
  /** Abhak-Liste, optional mit Spalten „i. O. / nicht i. O. / entfällt“. */
  | { typ: "checkliste"; titel: string; punkte: string[]; bewertung?: boolean }
  /** Leere Tabelle zum Ausfüllen. */
  | {
      typ: "tabelle";
      titel: string;
      spalten: string[];
      /** Anzahl leerer Zeilen. */
      zeilen: number;
      /** Zeilen, deren erste Spalte vorausgefüllt ist (vor den leeren Zeilen). */
      vorbelegt?: string[];
      /** CSS-Breiten pro Spalte. */
      breiten?: string[];
    }
  /** Freitextfeld mit Linien. */
  | { typ: "freitext"; titel: string; hinweis?: string; linien: number }
  /** Ankreuz-Optionen in einer Zeile. */
  | { typ: "auswahl"; titel: string; optionen: string[] }
  | { typ: "hinweis"; text: string }
  | { typ: "unterschriften"; felder: string[] };

export type Vorlage = {
  slug: string;
  titel: string;
  art: VorlageArt;
  kurz: string;
  /** Was ist die Vorlage? */
  wasIst: string;
  /** Wofür braucht man sie? */
  wofuer: string[];
  /** Erklärung: so nutzt du die Vorlage. */
  erklaerung: { titel: string; text: string }[];
  themen: ThemaSlug[];
  /** Leer = für alle Gewerke. */
  gewerke: TopGewerkSlug[];
  funktionen: FunktionSlug[];
  verwandt: string[];
  rechtshinweis?: boolean;
  beliebt?: boolean;
  /** Datum der letzten Überarbeitung (ISO). */
  datum: string;
  inhalt: VorlageBlock[];
};

export const vorlagen: Vorlage[] = [
  {
    slug: "checkliste-baustellenabnahme",
    titel: "Checkliste Baustellenabnahme",
    art: "Checkliste",
    kurz: "Alles prüfen, bevor der Kunde abnimmt – damit die Abnahme glatt läuft.",
    wasIst:
      "Eine Checkliste für die letzte Runde vor der Abnahme. Sie hilft dir, offene Punkte selbst zu finden, bevor der Kunde sie findet.",
    wofuer: [
      "Interne Endkontrolle vor dem Abnahmetermin",
      "Vorbereitung der Unterlagen für die Übergabe",
      "Weniger Nacharbeiten und Diskussionen bei der Abnahme",
    ],
    erklaerung: [
      {
        titel: "Wann nutzen?",
        text: "Ein bis zwei Tage vor dem Abnahmetermin, damit noch Zeit für Nacharbeiten bleibt. Geh die Liste am besten mit dem verantwortlichen Monteur gemeinsam durch.",
      },
      {
        titel: "Und dann?",
        text: "Die eigentliche Abnahme hältst du mit dem Abnahmeprotokoll fest. Die Checkliste ist deine interne Vorbereitung.",
      },
    ],
    themen: ["auftraege-geld"],
    gewerke: [],
    funktionen: ["dokumentation", "auftraege"],
    verwandt: ["abnahmeprotokoll", "regiebericht"],
    beliebt: true,
    datum: "2026-03-02",
    inhalt: [
      { typ: "felder", felder: ["Auftrag / Baustelle", "Kunde", "Geprüft von", "Datum"] },
      {
        typ: "checkliste",
        titel: "Leistung",
        bewertung: true,
        punkte: [
          "Alle Positionen aus Angebot / Auftrag ausgeführt",
          "Zusatzarbeiten erledigt und per Regiebericht dokumentiert",
          "Sichtprüfung: saubere Ausführung, keine Beschädigungen",
          "Funktionsprüfung aller Anlagen und Bauteile durchgeführt",
          "Vorgeschriebene Mess- und Prüfprotokolle erstellt",
          "Restarbeiten notiert und mit Termin versehen",
        ],
      },
      {
        typ: "checkliste",
        titel: "Baustelle",
        bewertung: true,
        punkte: [
          "Baustelle gereinigt, Abfall entsorgt",
          "Schutzabdeckungen entfernt",
          "Eigenes Werkzeug und Restmaterial abgeholt",
          "Schäden an Bestand geprüft (mit Fotos vom Ausgangszustand verglichen)",
          "Fotos vom fertigen Zustand gemacht",
        ],
      },
      {
        typ: "checkliste",
        titel: "Unterlagen für die Übergabe",
        bewertung: true,
        punkte: [
          "Bedienungsanleitungen und Herstellerunterlagen",
          "Prüf- und Messprotokolle",
          "Wartungshinweise und Wartungsintervalle",
          "Garantie- und Gewährleistungsinformationen",
          "Abnahmeprotokoll vorbereitet",
        ],
      },
      { typ: "freitext", titel: "Offene Punkte / Nacharbeiten", linien: 4 },
      { typ: "unterschriften", felder: ["Geprüft (Monteur)", "Freigegeben (Bauleitung / Chef)"] },
    ],
  },
  {
    slug: "abnahmeprotokoll",
    titel: "Abnahmeprotokoll",
    art: "Formular",
    kurz: "Abnahme sauber festhalten – mit Mängeln, Fristen und Unterschrift.",
    wasIst:
      "Ein Formular, mit dem du die Abnahme deiner Arbeit durch den Kunden dokumentierst. Es hält fest, wann abgenommen wurde, welche Mängel festgestellt wurden und bis wann sie behoben werden.",
    wofuer: [
      "Beweis, dass und wann der Kunde abgenommen hat",
      "Klare Liste der festgestellten Mängel mit Fristen",
      "Grundlage für die Schlussrechnung",
    ],
    erklaerung: [
      {
        titel: "Warum ist die Abnahme so wichtig?",
        text: "Mit der Abnahme wird in der Regel die Vergütung fällig, die Gewährleistungsfrist beginnt zu laufen und die Beweislast für Mängel verschiebt sich auf den Kunden. Eine schriftliche Abnahme schafft Klarheit für beide Seiten.",
      },
      {
        titel: "Mängel vorbehalten",
        text: "Bekannte Mängel sollten im Protokoll stehen. Nimmt der Kunde trotz bekannter Mängel ohne Vorbehalt ab, kann er bestimmte Rechte verlieren – deshalb fragen viele Kunden zu Recht nach diesem Punkt.",
      },
      {
        titel: "Hinweis",
        text: "Das Formular ist eine praktische Vorlage und ersetzt keine Rechtsberatung. Bei VOB/B-Verträgen oder strittigen Fällen lass dich beraten.",
      },
    ],
    themen: ["auftraege-geld"],
    gewerke: [],
    funktionen: ["dokumentation", "auftraege", "rechnungen"],
    verwandt: ["checkliste-baustellenabnahme", "regiebericht"],
    rechtshinweis: true,
    beliebt: true,
    datum: "2026-03-02",
    inhalt: [
      {
        typ: "felder",
        titel: "Angaben",
        felder: [
          "Auftraggeber (Name, Anschrift)",
          "Auftragnehmer (Betrieb)",
          "Bauvorhaben / Baustelle",
          "Auftrag / Angebot Nr. vom",
          "Abnahme am (Datum, Uhrzeit)",
          "Anwesend",
        ],
      },
      { typ: "freitext", titel: "Abgenommene Leistung", hinweis: "Kurz beschreiben, welche Leistungen abgenommen werden.", linien: 3 },
      {
        typ: "auswahl",
        titel: "Ergebnis",
        optionen: ["Abnahme ohne Mängel", "Abnahme mit den unten genannten Mängeln", "Abnahme verweigert (Gründe unten)"],
      },
      {
        typ: "tabelle",
        titel: "Festgestellte Mängel",
        spalten: ["Nr.", "Mangel / Ort", "Behebung bis", "Erledigt am"],
        zeilen: 5,
        breiten: ["3rem", "auto", "7rem", "7rem"],
      },
      {
        typ: "auswahl",
        titel: "Übergebene Unterlagen",
        optionen: ["Bedienungsanleitungen", "Prüfprotokolle", "Wartungshinweise", "Schlüssel / Zugänge"],
      },
      { typ: "freitext", titel: "Vorbehalte / Bemerkungen", linien: 3 },
      { typ: "unterschriften", felder: ["Auftraggeber", "Auftragnehmer"] },
    ],
  },
  {
    slug: "aufmassblatt",
    titel: "Aufmaßblatt",
    art: "Vorlage",
    kurz: "Maße vor Ort strukturiert aufnehmen – für Angebot und Abrechnung.",
    wasIst:
      "Ein Blatt zum Aufnehmen von Maßen auf der Baustelle: Position, Bauteil, Länge, Breite, Höhe, Anzahl und Ergebnis. Mit Feld für Abzüge wie Fenster und Türen.",
    wofuer: [
      "Mengen für das Angebot ermitteln",
      "Ausgeführte Mengen für die Abrechnung festhalten",
      "Gemeinsames Aufmaß mit Kunde oder Bauleitung",
    ],
    erklaerung: [
      {
        titel: "So füllst du es aus",
        text: "Eine Zeile pro Bauteil oder Raum. Trag die Maße in Metern ein und rechne das Ergebnis direkt aus. Abzüge (z. B. Fenster, Türen) bekommen eine eigene Zeile mit Minus-Zeichen in der Spalte Anzahl.",
      },
      {
        titel: "Abrechnungsregeln beachten",
        text: "Wie Öffnungen abgezogen oder übermessen werden, regeln je nach Vertrag die jeweiligen Normen bzw. Abrechnungsregeln deines Gewerks. Schreib dazu, nach welchen Regeln du aufmisst.",
      },
      {
        titel: "Tipp",
        text: "Mach zu jedem Raum ein Übersichtsfoto und eine kleine Skizze auf der Rückseite. So weißt du später noch, welches Maß wohin gehört.",
      },
    ],
    themen: ["kalkulation", "auftraege-geld"],
    gewerke: ["maler", "fliesenleger", "tischler", "dachdecker", "bau"],
    funktionen: ["aufmass", "kalkulation", "angebote"],
    verwandt: ["checkliste-angebotserstellung", "regiebericht"],
    beliebt: true,
    datum: "2026-02-16",
    inhalt: [
      { typ: "felder", felder: ["Kunde", "Baustelle", "Aufgemessen von", "Datum", "Abrechnung nach"] },
      {
        typ: "tabelle",
        titel: "Aufmaß",
        spalten: ["Pos.", "Raum / Bauteil", "Anzahl", "Länge (m)", "Breite (m)", "Höhe (m)", "Ergebnis", "Einheit"],
        zeilen: 14,
        breiten: ["3rem", "auto", "4rem", "5rem", "5rem", "5rem", "5.5rem", "4rem"],
      },
      { typ: "hinweis", text: "Abzüge mit „–“ in der Spalte Anzahl eintragen. Ergebnis = Anzahl × Länge × Breite (bzw. Höhe)." },
      { typ: "freitext", titel: "Skizze / Bemerkungen", linien: 4 },
      { typ: "unterschriften", felder: ["Aufgemessen (Auftragnehmer)", "Anerkannt (Auftraggeber)"] },
    ],
  },
  {
    slug: "stundenzettel",
    titel: "Stundenzettel (Wochenübersicht)",
    art: "Vorlage",
    kurz: "Arbeitszeiten pro Tag und Auftrag erfassen – übersichtlich für eine Woche.",
    wasIst:
      "Ein Wochen-Stundenzettel für Mitarbeiter: Beginn, Ende, Pausen, Auftrag und Tätigkeit pro Tag. Mit Summen für die Lohnabrechnung und die Nachkalkulation.",
    wofuer: [
      "Arbeitszeit für die Lohnabrechnung festhalten",
      "Stunden den richtigen Aufträgen zuordnen",
      "Nachweis der Arbeitszeit (Arbeitszeiterfassung)",
    ],
    erklaerung: [
      {
        titel: "So füllst du ihn aus",
        text: "Jeden Tag direkt nach Feierabend ausfüllen – nicht am Freitag aus dem Gedächtnis. Bei mehreren Aufträgen am Tag eine eigene Zeile pro Auftrag. Fahrzeit separat ausweisen, wenn sie bei dir anders bezahlt oder abgerechnet wird.",
      },
      {
        titel: "Arbeitszeit erfassen",
        text: "Nach der Rechtsprechung des Bundesarbeitsgerichts müssen Arbeitgeber die Arbeitszeit ihrer Mitarbeiter erfassen. Wie genau das zu geschehen hat, ist gesetzlich noch nicht abschließend geregelt. Ein sauber geführter Stundenzettel ist eine einfache Möglichkeit – frag im Zweifel deinen Steuerberater oder Verband.",
      },
    ],
    themen: ["mitarbeiter", "betrieb-fuehren"],
    gewerke: [],
    funktionen: ["zeiterfassung", "mitarbeiter", "auswertung"],
    verwandt: ["regiebericht", "checkliste-unterweisung-neue-mitarbeiter"],
    rechtshinweis: true,
    beliebt: true,
    datum: "2026-01-12",
    inhalt: [
      { typ: "felder", felder: ["Mitarbeiter", "Kalenderwoche", "Personalnummer", "Fahrzeug"] },
      {
        typ: "tabelle",
        titel: "Arbeitszeiten",
        spalten: ["Tag", "Auftrag / Baustelle", "Tätigkeit", "Beginn", "Ende", "Pause", "Fahrzeit", "Stunden"],
        zeilen: 10,
        breiten: ["3.5rem", "auto", "auto", "4rem", "4rem", "4rem", "4.5rem", "4.5rem"],
      },
      {
        typ: "felder",
        titel: "Summen",
        felder: ["Arbeitsstunden gesamt", "davon Fahrzeit", "Überstunden", "Urlaub / Krank (Tage)"],
      },
      { typ: "freitext", titel: "Bemerkungen", linien: 2 },
      { typ: "unterschriften", felder: ["Mitarbeiter", "Geprüft (Büro / Chef)"] },
    ],
  },
  {
    slug: "checkliste-angebotserstellung",
    titel: "Checkliste Angebotserstellung",
    art: "Checkliste",
    kurz: "Nichts vergessen: von der Besichtigung bis zum verschickten Angebot.",
    wasIst:
      "Eine Checkliste, die dich Schritt für Schritt durch ein Angebot führt – damit keine Leistung, kein Zuschlag und keine Bedingung fehlt.",
    wofuer: [
      "Vergessene Leistungen und Verluste vermeiden",
      "Einheitliche Angebote, auch wenn mehrere Leute kalkulieren",
      "Neue Mitarbeiter im Büro einarbeiten",
    ],
    erklaerung: [
      {
        titel: "So nutzt du sie",
        text: "Geh die Liste bei jedem größeren Angebot einmal komplett durch. Bei kleinen Standardaufträgen reicht der Block „Vor dem Verschicken“.",
      },
      {
        titel: "Zahlen besorgen",
        text: "Für Stundensatz, Materialaufschlag und Fahrtkosten findest du kostenlose Rechner im Bereich Werkzeuge.",
      },
    ],
    themen: ["kalkulation", "auftraege-geld"],
    gewerke: [],
    funktionen: ["angebote", "kalkulation", "aufmass"],
    verwandt: ["aufmassblatt", "checkliste-baustellenabnahme"],
    beliebt: true,
    datum: "2026-02-16",
    inhalt: [
      { typ: "felder", felder: ["Kunde", "Bauvorhaben", "Bearbeitet von", "Angebot bis (Datum)"] },
      {
        typ: "checkliste",
        titel: "Besichtigung und Aufmaß",
        punkte: [
          "Wünsche und Ziel des Kunden verstanden und notiert",
          "Aufmaß vollständig, Fotos vom Bestand gemacht",
          "Zugang, Stellplatz, Strom und Wasser geklärt",
          "Besonderheiten notiert (Altbau, Schadstoffe, Höhe, Denkmalschutz)",
          "Gewünschter Ausführungszeitraum besprochen",
        ],
      },
      {
        typ: "checkliste",
        titel: "Kalkulation",
        punkte: [
          "Alle Leistungen in Ablauf-Reihenfolge erfasst",
          "Zeitwerte aus eigener Nachkalkulation verwendet",
          "Aktueller Stundenverrechnungssatz angesetzt",
          "Material inkl. Verschnitt und Aufschlag",
          "Fremdleistungen (Gerüst, Container, Subunternehmer) eingeholt",
          "Baustelleneinrichtung, Schutz und Entsorgung berücksichtigt",
          "Anfahrt und Fahrtkosten eingerechnet",
          "Deckungsbeitrag geprüft",
        ],
      },
      {
        typ: "checkliste",
        titel: "Vor dem Verschicken",
        punkte: [
          "Leistungsbeschreibung verständlich formuliert",
          "Nicht enthaltene Leistungen / bauseitige Leistungen genannt",
          "Angebot oder Kostenvoranschlag klar benannt",
          "Gültigkeit des Angebots angegeben",
          "Zahlungsbedingungen und ggf. Abschläge festgelegt",
          "Regelung für Zusatzarbeiten (Regie) genannt",
          "Netto, Umsatzsteuer und Brutto korrekt",
          "Termin für Nachfassen eingetragen",
        ],
      },
      { typ: "freitext", titel: "Notizen", linien: 3 },
    ],
  },
  {
    slug: "regiebericht",
    titel: "Regiebericht (Stundenlohnarbeiten)",
    art: "Formular",
    kurz: "Zusatzarbeiten festhalten und direkt unterschreiben lassen.",
    wasIst:
      "Ein Formular für Arbeiten, die nach Aufwand abgerechnet werden: Wer hat wann was gemacht, wie lange, mit welchem Material und welchen Geräten.",
    wofuer: [
      "Zusatzarbeiten außerhalb des Angebots nachweisen",
      "Stundenlohnarbeiten abrechnen",
      "Diskussionen bei der Rechnung vermeiden",
    ],
    erklaerung: [
      {
        titel: "Wichtig: zeitnah unterschreiben lassen",
        text: "Lass den Regiebericht am selben Tag vom Auftraggeber oder der Bauleitung unterschreiben. Wochen später ist das deutlich schwieriger.",
      },
      {
        titel: "Vorher ankündigen",
        text: "Stundenlohnarbeiten sollten vor Beginn mit dem Auftraggeber vereinbart werden. Bei VOB/B-Verträgen gelten dafür besondere Regeln – im Zweifel beraten lassen.",
      },
    ],
    themen: ["auftraege-geld"],
    gewerke: ["elektriker", "shk", "bau", "tischler", "maler"],
    funktionen: ["dokumentation", "zeiterfassung", "rechnungen"],
    verwandt: ["stundenzettel", "abnahmeprotokoll"],
    rechtshinweis: true,
    datum: "2026-04-07",
    inhalt: [
      {
        typ: "felder",
        felder: ["Auftraggeber", "Baustelle", "Auftrag Nr.", "Datum", "Bericht Nr.", "Angeordnet von"],
      },
      { typ: "freitext", titel: "Ausgeführte Arbeiten", hinweis: "Was wurde wo und warum gemacht?", linien: 4 },
      {
        typ: "tabelle",
        titel: "Personal",
        spalten: ["Name", "Qualifikation", "von", "bis", "Pause", "Stunden"],
        zeilen: 4,
      },
      {
        typ: "tabelle",
        titel: "Material",
        spalten: ["Artikel / Bezeichnung", "Menge", "Einheit"],
        zeilen: 5,
        breiten: ["auto", "6rem", "6rem"],
      },
      {
        typ: "tabelle",
        titel: "Geräte / Maschinen",
        spalten: ["Gerät", "Einsatzzeit (h)"],
        zeilen: 2,
        breiten: ["auto", "8rem"],
      },
      { typ: "unterschriften", felder: ["Auftraggeber / Bauleitung", "Auftragnehmer"] },
    ],
  },
  {
    slug: "checkliste-unterweisung-neue-mitarbeiter",
    titel: "Checkliste Unterweisung neuer Mitarbeiter",
    art: "Checkliste",
    kurz: "Erstunterweisung vor dem ersten Einsatz – vollständig und dokumentiert.",
    wasIst:
      "Eine Checkliste für die Sicherheitsunterweisung neuer Mitarbeiter, Azubis und Leiharbeiter vor dem ersten Einsatz. Mit Unterschriftenfeld zur Dokumentation.",
    wofuer: [
      "Pflicht zur Unterweisung vor Aufnahme der Tätigkeit erfüllen",
      "Nachweis, dass und worüber unterwiesen wurde",
      "Strukturierter Start für neue Leute",
    ],
    erklaerung: [
      {
        titel: "Wann ist eine Unterweisung nötig?",
        text: "Nach dem Arbeitsschutzgesetz vor Aufnahme der Tätigkeit, bei Veränderungen (neue Maschinen, neue Arbeitsverfahren) und regelmäßig. Die Unfallverhütungsvorschrift DGUV Vorschrift 1 verlangt eine Wiederholung mindestens einmal jährlich und eine Dokumentation. Für Jugendliche gelten nach dem Jugendarbeitsschutzgesetz kürzere Abstände (mindestens halbjährlich).",
      },
      {
        titel: "An den Betrieb anpassen",
        text: "Die Punkte sind allgemein. Ergänze die Gefährdungen deines Gewerks aus deiner Gefährdungsbeurteilung, z. B. Arbeiten unter Spannung, Absturzgefahr, Gefahrstoffe oder Maschinen. Deine Berufsgenossenschaft bietet dazu Material.",
      },
    ],
    themen: ["mitarbeiter", "fuehrung"],
    gewerke: [],
    funktionen: ["schulungen", "qualifikationen", "mitarbeiter"],
    verwandt: ["stundenzettel", "checkliste-baustellenabnahme"],
    rechtshinweis: true,
    datum: "2026-05-04",
    inhalt: [
      { typ: "felder", felder: ["Mitarbeiter", "Tätigkeit / Funktion", "Eintrittsdatum", "Unterwiesen von", "Datum der Unterweisung"] },
      {
        typ: "checkliste",
        titel: "Allgemein",
        punkte: [
          "Ansprechpartner, Vorgesetzte und Sicherheitsbeauftragte vorgestellt",
          "Verhalten bei Unfällen, Erste Hilfe, Ersthelfer, Verbandkasten",
          "Notrufnummern und Meldewege",
          "Brandschutz: Feuerlöscher, Fluchtwege, Sammelplatz",
          "Unfallmeldung und Verbandbuch",
          "Alkohol- und Drogenverbot, Rauchverbot",
        ],
      },
      {
        typ: "checkliste",
        titel: "Arbeitsplatz und Baustelle",
        punkte: [
          "Gefährdungen der Tätigkeit laut Gefährdungsbeurteilung",
          "Persönliche Schutzausrüstung: Ausgabe, Benutzung, Pflege",
          "Leitern, Tritte und Gerüste – sichere Benutzung",
          "Absturzsicherung und Arbeiten in der Höhe",
          "Elektrische Betriebsmittel: Sichtprüfung vor Benutzung",
          "Heben und Tragen, Transport von Lasten",
          "Ordnung und Sauberkeit auf der Baustelle",
        ],
      },
      {
        typ: "checkliste",
        titel: "Maschinen, Stoffe, Fahrzeuge",
        punkte: [
          "Eingewiesen in benutzte Maschinen und Geräte",
          "Gefahrstoffe: Betriebsanweisungen, Kennzeichnung, Schutzmaßnahmen",
          "Firmenfahrzeug: Ladungssicherung, Kontrolle vor Fahrtantritt",
          "Führerschein geprüft (bei Fahrzeugnutzung)",
        ],
      },
      {
        typ: "checkliste",
        titel: "Organisation",
        punkte: [
          "Arbeitszeiten, Pausen, Zeiterfassung",
          "Datenschutz und Verhalten beim Kunden",
          "App / Software: Zugang eingerichtet und erklärt",
          "Termin für die nächste Unterweisung festgelegt",
        ],
      },
      { typ: "freitext", titel: "Weitere Themen / Bemerkungen", linien: 3 },
      {
        typ: "hinweis",
        text: "Mit meiner Unterschrift bestätige ich, dass ich zu den oben angekreuzten Themen unterwiesen wurde und die Inhalte verstanden habe.",
      },
      { typ: "unterschriften", felder: ["Mitarbeiter", "Unterweisende Person"] },
    ],
  },
  {
    slug: "wartungsprotokoll-heizung",
    titel: "Wartungsprotokoll Heizung (Gas-Brennwert)",
    art: "Formular",
    kurz: "Wartung einer Gas-Brennwertheizung Schritt für Schritt protokollieren.",
    wasIst:
      "Ein Protokoll für die jährliche Wartung von Gas-Brennwertgeräten: Anlagendaten, Sicht- und Funktionsprüfung, Reinigung, Messwerte und Empfehlungen an den Kunden.",
    wofuer: [
      "Einheitliche Wartung durch alle Monteure",
      "Nachweis gegenüber Kunde und Hersteller (Garantie)",
      "Messwerte über die Jahre vergleichen",
    ],
    erklaerung: [
      {
        titel: "Herstellerangaben haben Vorrang",
        text: "Die Punkte sind ein allgemeiner Ablauf. Maßgeblich sind die Wartungsanleitung des Herstellers, die geltenden technischen Regeln und die Sollwerte für das jeweilige Gerät.",
      },
      {
        titel: "Messwerte dokumentieren",
        text: "Trag Ist-Werte und Sollwerte ein. So siehst du bei der nächsten Wartung sofort, ob sich etwas verändert hat, und kannst dem Kunden Empfehlungen begründen.",
      },
      {
        titel: "Nur durch Fachbetriebe",
        text: "Arbeiten an Gasgeräten dürfen nur von qualifizierten Fachbetrieben ausgeführt werden.",
      },
    ],
    themen: ["auftraege-geld", "planung"],
    gewerke: ["shk"],
    funktionen: ["dokumentation", "einsatzplanung", "kunden"],
    verwandt: ["regiebericht", "checkliste-baustellenabnahme"],
    datum: "2026-08-24",
    inhalt: [
      {
        typ: "felder",
        titel: "Anlage",
        felder: ["Kunde / Anlagenstandort", "Hersteller / Typ", "Seriennummer", "Baujahr", "Nennwärmeleistung (kW)", "Wartung am / Monteur"],
      },
      {
        typ: "checkliste",
        titel: "Sicht- und Funktionsprüfung",
        bewertung: true,
        punkte: [
          "Aufstellraum: Verbrennungsluftversorgung, keine Lagerung brennbarer Stoffe",
          "Abgasanlage: Sichtprüfung auf Beschädigung und Dichtheit",
          "Gerät: Fehlerspeicher ausgelesen",
          "Gasleitungen und Anschlüsse: Dichtheit geprüft",
          "Anlagendruck Heizwasser geprüft / korrigiert",
          "Ausdehnungsgefäß: Vordruck geprüft",
          "Sicherheitsventil: Funktion geprüft",
        ],
      },
      {
        typ: "checkliste",
        titel: "Reinigung und Wartung",
        bewertung: true,
        punkte: [
          "Brenner gereinigt / geprüft",
          "Wärmetauscher gereinigt",
          "Zünd- und Überwachungselektrode geprüft / getauscht",
          "Dichtungen geprüft / getauscht",
          "Kondensatablauf und Siphon gereinigt",
          "Neutralisationsanlage geprüft (falls vorhanden)",
          "Regelung: Einstellungen, Uhrzeit, Heizkurve geprüft",
        ],
      },
      {
        typ: "tabelle",
        titel: "Messwerte",
        spalten: ["Messgröße", "Ist-Wert", "Sollwert laut Hersteller", "i. O."],
        zeilen: 0,
        vorbelegt: [
          "Gas-Anschlussdruck / Fließdruck (mbar)",
          "CO₂ bzw. O₂ im Abgas (%)",
          "CO im Abgas (ppm)",
          "Abgastemperatur (°C)",
          "Ionisationsstrom (µA)",
          "Anlagendruck Heizwasser (bar)",
          "Vordruck Ausdehnungsgefäß (bar)",
        ],
        breiten: ["auto", "7rem", "11rem", "3.5rem"],
      },
      { typ: "freitext", titel: "Festgestellte Mängel / ausgetauschte Teile", linien: 3 },
      { typ: "freitext", titel: "Empfehlungen an den Kunden", linien: 2 },
      { typ: "felder", felder: ["Nächste Wartung fällig"] },
      { typ: "unterschriften", felder: ["Monteur", "Kunde"] },
    ],
  },
  {
    slug: "checkliste-e-rechnung",
    titel: "Checkliste E-Rechnung",
    art: "Checkliste",
    kurz: "Ist dein Betrieb bereit für Empfang und Versand von E-Rechnungen?",
    wasIst:
      "Eine Checkliste, mit der du prüfst, ob dein Betrieb die E-Rechnungspflicht im Geschäftskundenbereich erfüllt – beim Empfangen seit 2025 und beim Verschicken ab 2027 bzw. 2028.",
    wofuer: [
      "Stand im Betrieb schnell prüfen",
      "Gespräch mit Steuerberater und Softwareanbieter vorbereiten",
      "Umstellung rechtzeitig planen",
    ],
    erklaerung: [
      {
        titel: "Die Fristen kurz",
        text: "Seit 1.1.2025 müssen alle Betriebe E-Rechnungen von anderen Unternehmen empfangen können. Bis Ende 2026 dürfen alle noch Papier- oder (mit Zustimmung) PDF-Rechnungen an Geschäftskunden schicken, im Jahr 2027 nur noch Betriebe mit höchstens 800.000 € Gesamtumsatz im Vorjahr. Ab 2028 gilt die Pflicht für alle. Rechnungen an Privatkunden sind nicht betroffen.",
      },
      {
        titel: "Mehr dazu",
        text: "Alle Details, Formate und Ausnahmen erklären wir im Blog-Artikel zur E-Rechnung.",
      },
    ],
    themen: ["auftraege-geld", "digital-arbeiten"],
    gewerke: [],
    funktionen: ["rechnungen", "zahlungen"],
    verwandt: ["checkliste-angebotserstellung", "abnahmeprotokoll"],
    rechtshinweis: true,
    beliebt: true,
    datum: "2026-03-10",
    inhalt: [
      { typ: "felder", felder: ["Betrieb", "Geprüft von", "Datum"] },
      {
        typ: "checkliste",
        titel: "Empfangen (Pflicht seit 1.1.2025)",
        punkte: [
          "Feste E-Mail-Adresse für eingehende Rechnungen festgelegt",
          "Lieferanten und Großhandel über die Adresse informiert",
          "Programm vorhanden, das XRechnung und ZUGFeRD lesbar anzeigt",
          "Rechnungen werden im Originalformat (XML / ZUGFeRD) aufbewahrt",
          "Weitergabe an Buchhaltung / Steuerberater geklärt",
          "Zuständigkeit für Prüfung und Freigabe festgelegt",
        ],
      },
      {
        typ: "checkliste",
        titel: "Verschicken (Pflicht ab 2027 bzw. 2028)",
        punkte: [
          "Gesamtumsatz des Vorjahres geprüft (Grenze 800.000 €)",
          "Anteil Geschäftskunden (B2B) bekannt",
          "Rechnungssoftware erzeugt XRechnung und / oder ZUGFeRD (ab 2.0.1, nicht MINIMUM / BASIC-WL)",
          "Stammdaten der Geschäftskunden vollständig (Anschrift, USt-IdNr., ggf. Leitweg-ID)",
          "Rechnungs-E-Mail-Adressen der Geschäftskunden erfasst",
          "Stammkunden über Umstellung informiert",
          "Testrechnung an einen Geschäftskunden verschickt",
        ],
      },
      {
        typ: "checkliste",
        titel: "Ausnahmen bekannt",
        punkte: [
          "Privatkunden (B2C): keine E-Rechnungspflicht",
          "Kleinbetragsrechnungen bis 250 € brutto ausgenommen",
          "Öffentliche Auftraggeber: XRechnung meist schon heute Pflicht",
        ],
      },
      { typ: "freitext", titel: "Offene Fragen an Steuerberater / Softwareanbieter", linien: 4 },
    ],
  },
];

export function getVorlage(slug: string) {
  return vorlagen.find((v) => v.slug === slug);
}

export function vorlageHref(slug: string) {
  return `/wissen/vorlagen/${slug}`;
}
