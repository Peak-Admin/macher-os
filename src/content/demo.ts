/**
 * Beispieldaten für die interaktive Demo auf `/demo`.
 * Alle Namen, Adressen und Beträge sind ausgedacht und nur zur Veranschaulichung.
 */
import type { TopGewerkSlug } from "./registry";

export type DemoGewerkId = "elektro" | "shk" | "tischler" | "maler" | "allgemein";
export type Farbe = "sky" | "signal" | "moss" | "sand" | "sky-soft" | "moss-soft";

export type DemoEinsatz = { zeit: string; titel: string; wer: string; ort: string; farbe: Farbe };

export type DemoGewerk = {
  id: DemoGewerkId;
  label: string;
  /** Link auf die passende Gewerk-Seite; fehlt beim allgemeinen Betrieb */
  gewerk?: TopGewerkSlug;
  chef: string;
  heute: {
    datum: string;
    offen: string;
    anfragen: number;
    einsaetze: DemoEinsatz[];
    hinweis: string;
  };
  auftrag: {
    titel: string;
    kunde: string;
    adresse: string;
    status: string;
    schritte: string[];
    material: { name: string; status: "da" | "fehlt" | "bestellt" }[];
    notiz: string;
  };
  plan: {
    woche: string;
    zeilen: { name: string; rolle: string; bloecke: { start: number; len: number; label: string; farbe: Farbe }[] }[];
    vorschlag: string;
  };
  betrieb: {
    mitarbeiter: { name: string; rolle: string; info: string }[];
    lager: { artikel: string; bestand: string; warnung?: boolean }[];
    fahrzeug: string;
  };
  automatisch: {
    erledigt: string[];
    vorschlaege: { text: string; aktion: string }[];
  };
  tour: [string, string, string, string, string];
};

export const demoGewerke: DemoGewerk[] = [
  {
    id: "elektro",
    label: "Elektro",
    gewerk: "elektriker",
    chef: "Jana",
    heute: {
      datum: "Dienstag, 14. Oktober",
      offen: "4.180 €",
      anfragen: 2,
      einsaetze: [
        { zeit: "08:00", titel: "Zählerschrank tauschen", wer: "Lukas", ort: "Musterweg 4", farbe: "sky" },
        { zeit: "11:30", titel: "Wallbox montieren", wer: "Ali", ort: "Lindenstr. 12", farbe: "signal" },
        { zeit: "14:00", titel: "E-Check Büro", wer: "Mia", ort: "Hafenstr. 3", farbe: "moss" },
      ],
      hinweis: "2× Fehlerstromschutzschalter fehlen für Mittwoch",
    },
    auftrag: {
      titel: "Wallbox montieren",
      kunde: "Fam. Petersen",
      adresse: "Lindenstr. 12",
      status: "Heute · 11:30",
      schritte: ["Hausanschluss prüfen", "Leitung verlegen", "Wallbox montieren", "Inbetriebnahme & Messprotokoll", "Kunde einweisen"],
      material: [
        { name: "Wallbox 11 kW", status: "da" },
        { name: "NYM-J 5×6 mm², 15 m", status: "da" },
        { name: "FI-Schutzschalter Typ A", status: "bestellt" },
      ],
      notiz: "Kunde wünscht Montage an der Garagenwand links.",
    },
    plan: {
      woche: "KW 42",
      zeilen: [
        { name: "Lukas", rolle: "Geselle", bloecke: [{ start: 0, len: 2, label: "Neubau Schmidt", farbe: "sky" }, { start: 3, len: 2, label: "Altbau Krüger", farbe: "sky" }] },
        { name: "Ali", rolle: "Meister", bloecke: [{ start: 0, len: 1, label: "Besichtigung", farbe: "moss-soft" }, { start: 1, len: 3, label: "Wallbox + PV Petersen", farbe: "signal" }] },
        { name: "Mia", rolle: "Azubi", bloecke: [{ start: 0, len: 2, label: "mit Lukas", farbe: "sky-soft" }, { start: 2, len: 1, label: "Berufsschule", farbe: "sand" }] },
      ],
      vorschlag: "Störung Fr. Weber → Lukas, Mittwoch 8:00 (frei, 12 Min. entfernt)",
    },
    betrieb: {
      mitarbeiter: [
        { name: "Ali", rolle: "Meister", info: "Elektrofachkraft · PV-Schulung" },
        { name: "Lukas", rolle: "Geselle", info: "E-Check-Prüfer" },
        { name: "Mia", rolle: "Azubi", info: "2. Lehrjahr" },
      ],
      lager: [
        { artikel: "Fehlerstromschutzschalter", bestand: "0 Stück", warnung: true },
        { artikel: "NYM-J 3×1,5 mm²", bestand: "200 m" },
        { artikel: "Unterputzdosen", bestand: "120 Stück" },
      ],
      fahrzeug: "Transporter 2 · TÜV in 3 Wochen",
    },
    automatisch: {
      erledigt: ["Anruf von Fam. Krüger aufgenommen", "Angebot „Unterverteilung erneuern“ vorbereitet", "Termin mit Hr. Petersen bestätigt"],
      vorschlaege: [
        { text: "2× FI-Schutzschalter beim Großhändler bestellen", aktion: "Bestellen" },
        { text: "Rechnung „E-Check Kanzlei“ ist fertig vorbereitet", aktion: "Prüfen & senden" },
      ],
    },
    tour: [
      "Fam. Krüger ruft an: Die Sicherung fliegt ständig raus.",
      "Macher findet Mittwoch 8:00 – Lukas ist frei und in der Nähe.",
      "Lukas sieht Adresse, Fehlerbeschreibung und Material in der App.",
      "Fotos vom Verteiler, Messwerte und 2,5 Stunden sind im Auftrag.",
      "Arbeitszeit und Material stehen schon auf der Rechnung.",
    ],
  },
  {
    id: "shk",
    label: "SHK",
    gewerk: "shk",
    chef: "Deniz",
    heute: {
      datum: "Dienstag, 14. Oktober",
      offen: "6.920 €",
      anfragen: 3,
      einsaetze: [
        { zeit: "07:30", titel: "Heizungswartung", wer: "Murat", ort: "Birkenweg 9", farbe: "moss" },
        { zeit: "10:00", titel: "Badsanierung Tag 3", wer: "Kevin & Sara", ort: "Am Markt 2", farbe: "sky" },
        { zeit: "15:00", titel: "Notdienst: Rohrbruch", wer: "Murat", ort: "Gartenstr. 18", farbe: "signal" },
      ],
      hinweis: "Wartung bei 4 Kunden diesen Monat fällig",
    },
    auftrag: {
      titel: "Heizungswartung Gasbrennwert",
      kunde: "Hr. Schulte",
      adresse: "Birkenweg 9",
      status: "Heute · 07:30",
      schritte: ["Brenner reinigen", "Abgasmessung", "Ausdehnungsgefäß prüfen", "Wartungsprotokoll", "Unterschrift Kunde"],
      material: [
        { name: "Wartungsset Brenner", status: "da" },
        { name: "Dichtungssatz", status: "da" },
        { name: "Zündelektrode", status: "fehlt" },
      ],
      notiz: "Wartungsvertrag · jährlich im Oktober.",
    },
    plan: {
      woche: "KW 42",
      zeilen: [
        { name: "Murat", rolle: "Kundendienst", bloecke: [{ start: 0, len: 1, label: "Wartungen", farbe: "moss" }, { start: 1, len: 2, label: "Wärmepumpe Lenz", farbe: "signal" }, { start: 3, len: 2, label: "Wartungen", farbe: "moss" }] },
        { name: "Kevin", rolle: "Geselle", bloecke: [{ start: 0, len: 5, label: "Badsanierung Am Markt", farbe: "sky" }] },
        { name: "Sara", rolle: "Gesellin", bloecke: [{ start: 0, len: 3, label: "Badsanierung Am Markt", farbe: "sky" }, { start: 3, len: 2, label: "Urlaub", farbe: "sand" }] },
      ],
      vorschlag: "Wartung Fr. Albers → Murat, Donnerstag 9:00 (Gas-Qualifikation, auf dem Weg)",
    },
    betrieb: {
      mitarbeiter: [
        { name: "Murat", rolle: "Kundendienst", info: "Gas · Kältetechnik" },
        { name: "Kevin", rolle: "Geselle", info: "Bad & Sanitär" },
        { name: "Sara", rolle: "Gesellin", info: "Wärmepumpen-Schulung" },
      ],
      lager: [
        { artikel: "Zündelektroden", bestand: "0 Stück", warnung: true },
        { artikel: "Pressfittinge 15 mm", bestand: "80 Stück" },
        { artikel: "Heizungswasser-Zusatz", bestand: "6 Kanister" },
      ],
      fahrzeug: "Kundendienstwagen 1 · Ölwechsel fällig",
    },
    automatisch: {
      erledigt: ["Fällige Wartungen für November eingeplant", "Notdienst-Anruf aufgenommen und Murat informiert", "Erinnerung an Hr. Schulte verschickt"],
      vorschlaege: [
        { text: "Zündelektrode für Wartung Schulte nachbestellen", aktion: "Bestellen" },
        { text: "Rechnung „Wartung Albers“ ist fertig vorbereitet", aktion: "Prüfen & senden" },
      ],
    },
    tour: [
      "Fr. Albers meldet sich über das Formular: Die Heizung wird nicht warm.",
      "Macher schlägt Murat vor – Gas-Qualifikation, Donnerstag frei, auf dem Weg.",
      "Murat sieht die Anlage, die letzte Wartung und das passende Ersatzteil.",
      "Wartungsprotokoll, Fotos und Unterschrift entstehen direkt vor Ort.",
      "Wartungspauschale und Ersatzteil landen auf der Rechnung.",
    ],
  },
  {
    id: "tischler",
    label: "Tischler",
    gewerk: "tischler",
    chef: "Stefan",
    heute: {
      datum: "Dienstag, 14. Oktober",
      offen: "12.400 €",
      anfragen: 1,
      einsaetze: [
        { zeit: "07:00", titel: "Zuschnitt Einbauschrank", wer: "Werkstatt · Jonas", ort: "Halle", farbe: "sky" },
        { zeit: "09:00", titel: "Küchenmontage Tag 2", wer: "Paul & Emre", ort: "Seestr. 21", farbe: "signal" },
        { zeit: "16:00", titel: "Aufmaß Treppe", wer: "Stefan", ort: "Ringstr. 5", farbe: "moss" },
      ],
      hinweis: "Beschläge für Einbauschrank kommen erst Donnerstag",
    },
    auftrag: {
      titel: "Einbauschrank Dachschräge",
      kunde: "Fam. Novak",
      adresse: "Kirchweg 7",
      status: "In der Werkstatt",
      schritte: ["Aufmaß", "Zeichnung freigegeben", "Zuschnitt", "Fertigung & Oberfläche", "Montage beim Kunden"],
      material: [
        { name: "Multiplex Birke 19 mm, 6 Platten", status: "da" },
        { name: "Topfbänder", status: "bestellt" },
        { name: "Hartwachsöl", status: "da" },
      ],
      notiz: "Stunden bisher: 18 von 32 kalkulierten.",
    },
    plan: {
      woche: "KW 42",
      zeilen: [
        { name: "Jonas", rolle: "Werkstatt", bloecke: [{ start: 0, len: 3, label: "Einbauschrank Novak", farbe: "sky" }, { start: 3, len: 2, label: "Tür Meier", farbe: "sky-soft" }] },
        { name: "Paul", rolle: "Monteur", bloecke: [{ start: 0, len: 2, label: "Küche Seestr.", farbe: "signal" }, { start: 2, len: 1, label: "Werkstatt", farbe: "sand" }, { start: 3, len: 2, label: "Montage Novak", farbe: "moss" }] },
        { name: "Emre", rolle: "Geselle", bloecke: [{ start: 0, len: 2, label: "Küche Seestr.", farbe: "signal" }, { start: 2, len: 3, label: "Fenster Lager", farbe: "moss-soft" }] },
      ],
      vorschlag: "Montage Novak erst Freitag – Topfbänder kommen Donnerstag",
    },
    betrieb: {
      mitarbeiter: [
        { name: "Jonas", rolle: "Werkstatt", info: "CNC-Einweisung" },
        { name: "Paul", rolle: "Monteur", info: "Küchenmontage" },
        { name: "Emre", rolle: "Geselle", info: "Fensterbau" },
      ],
      lager: [
        { artikel: "Topfbänder 110°", bestand: "4 Stück", warnung: true },
        { artikel: "Multiplex Birke 19 mm", bestand: "14 Platten" },
        { artikel: "Schubkastenführungen", bestand: "12 Paar" },
      ],
      fahrzeug: "Montagewagen · frei ab Mittwoch",
    },
    automatisch: {
      erledigt: ["Anfrage „Treppe sanieren“ aufgenommen", "Aufmaßtermin mit Fam. Reuter vereinbart", "Topfbänder beim Lieferanten bestellt"],
      vorschlaege: [
        { text: "Montage Novak auf Freitag verschieben und Kunde informieren", aktion: "Übernehmen" },
        { text: "Nachkalkulation „Küche Seestraße“ ansehen", aktion: "Öffnen" },
      ],
    },
    tour: [
      "Fam. Reuter fragt per Mail nach einer neuen Treppe.",
      "Macher schlägt das Aufmaß für Stefan vor – Dienstag 16:00.",
      "Werkstatt und Montage sehen ihre Schritte im selben Auftrag.",
      "Stunden in der Werkstatt und Fotos von der Montage werden erfasst.",
      "Die Rechnung kommt aus dem Auftrag – mit Nachkalkulation dazu.",
    ],
  },
  {
    id: "maler",
    label: "Maler",
    gewerk: "maler",
    chef: "Tobias",
    heute: {
      datum: "Dienstag, 14. Oktober",
      offen: "3.260 €",
      anfragen: 4,
      einsaetze: [
        { zeit: "07:30", titel: "Treppenhaus streichen", wer: "Nina & Ben", ort: "Parkallee 40", farbe: "sky" },
        { zeit: "08:00", titel: "Wohnung renovieren", wer: "Leon", ort: "Feldstr. 3", farbe: "signal" },
        { zeit: "13:00", titel: "Besichtigung Fassade", wer: "Tobias", ort: "Bergweg 11", farbe: "moss" },
      ],
      hinweis: "Fassade Bergweg: Gerüst noch nicht bestellt",
    },
    auftrag: {
      titel: "Wohnung renovieren, 3 Zimmer",
      kunde: "Hausverwaltung Lind",
      adresse: "Feldstr. 3, 2. OG",
      status: "Heute · 08:00",
      schritte: ["Abdecken & Abkleben", "Spachteln", "Grundierung", "Zweimal streichen", "Abnahme mit Fotos"],
      material: [
        { name: "Innenfarbe weiß, 3× 12,5 l", status: "da" },
        { name: "Abdeckvlies", status: "da" },
        { name: "Tiefgrund", status: "bestellt" },
      ],
      notiz: "Aufmaß: 214 m² Wand, 68 m² Decke.",
    },
    plan: {
      woche: "KW 42",
      zeilen: [
        { name: "Nina", rolle: "Gesellin", bloecke: [{ start: 0, len: 3, label: "Treppenhaus Parkallee", farbe: "sky" }, { start: 3, len: 2, label: "Büro Kaya", farbe: "moss" }] },
        { name: "Ben", rolle: "Azubi", bloecke: [{ start: 0, len: 3, label: "mit Nina", farbe: "sky-soft" }, { start: 3, len: 1, label: "Berufsschule", farbe: "sand" }] },
        { name: "Leon", rolle: "Geselle", bloecke: [{ start: 0, len: 4, label: "Wohnung Feldstr.", farbe: "signal" }, { start: 4, len: 1, label: "frei", farbe: "sand" }] },
      ],
      vorschlag: "Ausbesserung Fr. Kaya → Leon, Freitag 8:00 (frei, gleiche Straße)",
    },
    betrieb: {
      mitarbeiter: [
        { name: "Nina", rolle: "Gesellin", info: "Fassade · Gerüstschein" },
        { name: "Leon", rolle: "Geselle", info: "Tapezieren · Lackieren" },
        { name: "Ben", rolle: "Azubi", info: "1. Lehrjahr" },
      ],
      lager: [
        { artikel: "Tiefgrund 10 l", bestand: "1 Eimer", warnung: true },
        { artikel: "Innenfarbe weiß 12,5 l", bestand: "9 Eimer" },
        { artikel: "Malerkrepp", bestand: "40 Rollen" },
      ],
      fahrzeug: "Sprinter · Leiter und Abdeckmaterial geladen",
    },
    automatisch: {
      erledigt: ["Angebot „Wohnung Feldstraße“ aus dem Aufmaß vorbereitet", "Besichtigungstermin bestätigt", "Fotos der Abnahme Parkallee abgelegt"],
      vorschlaege: [
        { text: "Gerüst für Fassade Bergweg anfragen", aktion: "Anfragen" },
        { text: "Angebot „Fassade Bergweg“ vorbereiten", aktion: "Vorbereiten" },
      ],
    },
    tour: [
      "Fr. Kaya schreibt über die Website: Büro soll frisch gestrichen werden.",
      "Macher plant Tobias für die Besichtigung ein und bestätigt den Termin.",
      "Leon sieht Räume, Aufmaß und Farbtöne in der App.",
      "Vorher-Nachher-Fotos und Arbeitszeit landen im Auftrag.",
      "Aus Aufmaß und Leistungen ist die Rechnung schon vorbereitet.",
    ],
  },
  {
    id: "allgemein",
    label: "Allgemeiner Betrieb",
    chef: "Sabine",
    heute: {
      datum: "Dienstag, 14. Oktober",
      offen: "5.040 €",
      anfragen: 2,
      einsaetze: [
        { zeit: "08:00", titel: "Reparatur vor Ort", wer: "Max", ort: "Bahnhofstr. 8", farbe: "sky" },
        { zeit: "10:30", titel: "Montage Neubau", wer: "Team Nord", ort: "Wiesenweg 2", farbe: "signal" },
        { zeit: "14:00", titel: "Besichtigung", wer: "Sabine", ort: "Schulstr. 6", farbe: "moss" },
      ],
      hinweis: "Material für Montage Donnerstag noch nicht vollständig",
    },
    auftrag: {
      titel: "Montage Neubau",
      kunde: "Bauherr Krämer",
      adresse: "Wiesenweg 2",
      status: "Heute · 10:30",
      schritte: ["Baustelle prüfen", "Montage", "Fotos machen", "Abnahme", "Unterschrift Kunde"],
      material: [
        { name: "Befestigungsmaterial", status: "da" },
        { name: "Bauteile laut Liste", status: "da" },
        { name: "Dichtband", status: "fehlt" },
      ],
      notiz: "Zufahrt über die Rückseite.",
    },
    plan: {
      woche: "KW 42",
      zeilen: [
        { name: "Max", rolle: "Kundendienst", bloecke: [{ start: 0, len: 2, label: "Reparaturen", farbe: "moss" }, { start: 2, len: 3, label: "Wartungen", farbe: "moss-soft" }] },
        { name: "Team Nord", rolle: "Montage", bloecke: [{ start: 0, len: 4, label: "Neubau Krämer", farbe: "signal" }] },
        { name: "Lea", rolle: "Büro", bloecke: [{ start: 0, len: 5, label: "Büro & Telefon", farbe: "sand" }] },
      ],
      vorschlag: "Reparatur Fr. Ott → Max, Mittwoch 13:00 (frei, 8 Min. entfernt)",
    },
    betrieb: {
      mitarbeiter: [
        { name: "Max", rolle: "Kundendienst", info: "Führerschein C1" },
        { name: "Team Nord", rolle: "Montage", info: "3 Leute" },
        { name: "Lea", rolle: "Büro", info: "Rechnungen · Telefon" },
      ],
      lager: [
        { artikel: "Dichtband", bestand: "0 Rollen", warnung: true },
        { artikel: "Schrauben-Sortiment", bestand: "8 Kisten" },
        { artikel: "Silikon", bestand: "24 Kartuschen" },
      ],
      fahrzeug: "Transporter 1 · Reifenwechsel fällig",
    },
    automatisch: {
      erledigt: ["Anruf von Fr. Ott aufgenommen", "Termin für die Besichtigung bestätigt", "Zahlungserinnerung an Kunde Brand vorbereitet"],
      vorschlaege: [
        { text: "Dichtband für Donnerstag bestellen", aktion: "Bestellen" },
        { text: "Rechnung „Reparatur Bahnhofstraße“ ist fertig vorbereitet", aktion: "Prüfen & senden" },
      ],
    },
    tour: [
      "Fr. Ott ruft an, während alle unterwegs sind – Macher nimmt die Anfrage auf.",
      "Macher findet Mittwoch 13:00 – Max ist frei und in der Nähe.",
      "Max sieht Adresse, Beschreibung und Fotos vom Kunden in der App.",
      "Fotos, Zeit und verbrauchtes Material werden direkt erfasst.",
      "Die Rechnung ist vorbereitet – Sabine prüft und schickt sie ab.",
    ],
  },
];

export const tourSchritte = [
  { titel: "Anfrage kommt rein", bereich: "Heute" },
  { titel: "Termin wird geplant", bereich: "Plan" },
  { titel: "Mitarbeiter sieht Auftrag", bereich: "App" },
  { titel: "Arbeit wird dokumentiert", bereich: "Auftrag" },
  { titel: "Rechnung wird vorbereitet", bereich: "Automatisch" },
] as const;
