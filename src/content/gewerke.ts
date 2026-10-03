/**
 * Inhalte des Bereichs „Gewerke“: Hub `/gewerke`, die acht Top-Gewerk-Seiten
 * und die 16 Gewerk-Cluster. Slugs kommen ausschließlich aus `registry.ts`.
 */
import type { FaqItem, IconName } from "@/components/ui";
import {
  gewerkCluster,
  topGewerke,
  type FunktionSlug,
  type GewerkClusterSlug,
  type GewerkSlug,
  type KundeSlug,
  type TopGewerkSlug,
  type WerkzeugSlug,
} from "./registry";

/* ------------------------------------------------------------------ */
/* Typen                                                               */
/* ------------------------------------------------------------------ */

export type TextPunkt = { titel: string; text: string };

/** Ein typischer Ablauf als Kette, z. B. Notdienst oder Wartung. */
export type Ablauf = { titel: string; text: string; schritte: string[] };

/** Eintrag in der stilisierten Tagesansicht (Hero-Visual). */
export type TagEintrag = {
  zeit: string;
  titel: string;
  detail: string;
  farbe: "sky" | "signal" | "moss" | "ink";
};

export type TopGewerkInhalt = {
  /** Name für „Handwerk OS für [Name]“. */
  name: string;
  seoTitel: string;
  beschreibung: string;
  icon: IconName;
  /** Kurztext für die Karte im Hub. */
  teaser: string;
  /** Konkrete Berufe/Begriffe für die Gewerk-Suche im Hub. */
  suchbegriffe: string[];
  hero: {
    intro: string;
    betrieb: string;
    tag: TagEintrag[];
    hinweis: { titel: string; text: string };
  };
  ablaeufe: Ablauf[];
  probleme: TextPunkt[];
  hilfe: { funktion: FunktionSlug; text: string }[];
  eingerichtet: {
    begriffe: string[];
    vorlagen: string[];
    checklisten: string[];
    qualifikationen: string[];
  };
  auftragsarten: TextPunkt[];
  planung: {
    intro: string;
    mitarbeiter: string;
    material: string;
    termine: string;
    vorschlag: string;
  };
  mobil: {
    intro: string;
    punkte: string[];
    einsatz: { zeit: string; titel: string; kunde: string; tags: string[] };
  };
  automatisch: string[];
  kunde: KundeSlug;
  funktionen: FunktionSlug[];
  wissen: { blog: string; vorlagen: string; werkzeuge: WerkzeugSlug[] };
  faq: FaqItem[];
};

export type Arbeitsweise = "Kundendienst" | "Baustelle" | "Werkstatt" | "Fertigung" | "Laden";

export type ClusterInhalt = {
  seoTitel: string;
  beschreibung: string;
  icon: IconName;
  teaser: string;
  heroTitel: string;
  intro: string;
  /** Berufe, die zum Cluster gehören. Werden auch für die Suche genutzt. */
  berufe: string[];
  /** Weitere Suchwörter (Umgangssprache, Synonyme). */
  suchbegriffe?: string[];
  arbeitsweisen: { art: Arbeitsweise; text: string }[];
  einrichtung: TextPunkt[];
  funktionen: FunktionSlug[];
  top: TopGewerkSlug[];
  verwandt: GewerkClusterSlug[];
  tag: TagEintrag[];
  faq: FaqItem[];
};

/* ------------------------------------------------------------------ */
/* Top-Gewerke                                                         */
/* ------------------------------------------------------------------ */

export const topGewerkInhalte: Record<TopGewerkSlug, TopGewerkInhalt> = {
  elektriker: {
    name: "Elektriker",
    seoTitel: "Handwerkersoftware für Elektriker",
    beschreibung:
      "Handwerk OS für Elektrobetriebe: Kundendienst, E-Check, DGUV V3, Messprotokolle, Baustellen und Rechnungen in einer Software – für Büro und Baustelle.",
    icon: "bolt",
    teaser: "Kundendienst, E-Check, Messprotokolle und Baustellen in einem Plan.",
    suchbegriffe: [
      "Elektriker",
      "Elektroniker",
      "Elektroniker für Energie- und Gebäudetechnik",
      "Elektroinstallateur",
      "Elektromeister",
      "Elektrotechnik",
      "Elektrobetrieb",
      "Elektroinstallation",
      "Wallbox",
      "E-Check",
    ],
    hero: {
      intro:
        "Vom Störungsanruf bis zum Messprotokoll: Handwerk OS plant deine Monteure, hält Prüffristen im Blick und macht aus Regieberichten schnell eine Rechnung.",
      betrieb: "Elektro Muster",
      tag: [
        { zeit: "07:30", titel: "Rohinstallation Neubau Becker", detail: "Lukas, Mia · 2. OG", farbe: "sky" },
        { zeit: "10:00", titel: "Störung: FI löst aus", detail: "Tom · Bäckerei Krüger", farbe: "signal" },
        { zeit: "13:30", titel: "DGUV V3 Prüfung Büro", detail: "Ali · 48 Geräte", farbe: "moss" },
      ],
      hinweis: {
        titel: "Lotte hat gesehen:",
        text: "Bei 12 Kunden ist der E-Check im November fällig. Erinnerungen sind vorbereitet.",
      },
    },
    ablaeufe: [
      {
        titel: "Kundendienst & Störung",
        text: "Der Kunde ruft an, weil die Sicherung immer wieder fliegt. Jetzt zählt, wer frei ist und das passende Material dabei hat.",
        schritte: ["Anruf", "Termin", "Fehlersuche", "Reparatur", "Bericht & Unterschrift", "Rechnung"],
      },
      {
        titel: "E-Check & DGUV V3",
        text: "Wiederkehrende Prüfungen bringen sichere Arbeit – wenn die Fristen nicht im Ordner verschwinden.",
        schritte: ["Frist fällig", "Termin", "Messen & prüfen", "Protokoll", "Prüfplakette", "nächste Frist"],
      },
      {
        titel: "Neubau & Sanierung",
        text: "Vom Angebot bis zur Abnahme über Wochen – mit Abschlägen, Nachträgen und Netzbetreiber-Termin.",
        schritte: ["Begehung", "Angebot", "Rohinstallation", "Feininstallation", "Messprotokoll", "Schlussrechnung"],
      },
    ],
    probleme: [
      {
        titel: "Messprotokolle auf Papier",
        text: "Die Werte stehen auf dem Zettel im Transporter. Im Büro tippt sie jemand ab – oft Tage später.",
      },
      {
        titel: "Prüffristen in der Tabelle",
        text: "E-Check und DGUV V3 laufen in einer Liste, die nur einer pflegt. Ist er krank, bleiben Termine liegen.",
      },
      {
        titel: "Material fehlt auf der Baustelle",
        text: "Zwei FI-Schalter zu wenig im Wagen – und schon fährt ein Geselle eine Stunde zum Großhandel.",
      },
      {
        titel: "Störungen zerreißen den Plan",
        text: "Ein Notruf am Vormittag, und die Baustelle steht. Wer ist in der Nähe und kann kurz rüber?",
      },
      {
        titel: "Regieberichte kommen spät",
        text: "Stunden und Material landen erst am Freitag im Büro. Die Rechnung geht eine Woche später raus.",
      },
      {
        titel: "Wer darf was?",
        text: "Nicht jeder darf am Zählerplatz arbeiten oder Prüfungen machen. Das steht meist nur im Kopf vom Chef.",
      },
    ],
    hilfe: [
      { funktion: "telefon", text: "Störungsanrufe werden aufgenommen – mit Adresse, Fehlerbild und Dringlichkeit." },
      { funktion: "einsatzplanung", text: "Kundendienst passt in die Lücken zwischen den Baustellen." },
      { funktion: "dokumentation", text: "Messwerte, Fotos vom Verteiler und Unterschrift direkt im Auftrag." },
      { funktion: "qualifikationen", text: "Lotte plant nur Leute ein, die die Arbeit auch machen dürfen." },
      { funktion: "material", text: "Stückliste aus dem Angebot, abgeglichen mit Lager und Fahrzeug." },
      { funktion: "rechnungen", text: "Aus Regiebericht und Material wird die Rechnung – am selben Tag." },
    ],
    eingerichtet: {
      begriffe: ["Zählerschrank", "Unterverteilung", "Stromkreis", "Prüfobjekt", "Regiebericht", "Netzbetreiber-Termin"],
      vorlagen: [
        "Angebot Zählerschrank-Erneuerung",
        "Angebot Wallbox-Installation",
        "Regiebericht",
        "Prüfprotokoll nach DIN VDE 0100-600",
        "Prüfprotokoll für Geräte nach DIN VDE 0701-0702",
      ],
      checklisten: [
        "E-Check Wohnung",
        "DGUV V3: ortsveränderliche Geräte",
        "Inbetriebnahme Wallbox",
        "Anmeldung beim Netzbetreiber",
        "Übergabe an den Kunden",
      ],
      qualifikationen: [
        "Elektrofachkraft",
        "Elektrotechnisch unterwiesene Person",
        "Eintragung im Installateurverzeichnis",
        "Befähigte Person für Prüfungen",
        "Jährliche Sicherheitsunterweisung",
      ],
    },
    auftragsarten: [
      { titel: "Kundendienst & Störung", text: "Schnell rein, Fehler finden, beheben, Bericht – fertig." },
      { titel: "E-Check & DGUV V3", text: "Wiederkehrende Prüfungen mit Frist, Protokoll und Prüfplakette." },
      { titel: "Zählerschrank-Erneuerung", text: "Mit Netzbetreiber-Termin, Material und Messprotokoll." },
      { titel: "Wallbox & Photovoltaik", text: "Vom Vor-Ort-Termin über die Anmeldung bis zur Inbetriebnahme." },
      { titel: "Neubau-Installation", text: "Über Wochen geplant, mit Abschlägen und Bauabschnitten." },
      { titel: "Gebäudesteuerung", text: "Planung, Programmierung und Einweisung als eigene Schritte." },
    ],
    planung: {
      intro: "Baustelle, Kundendienst und Prüfungen laufen gleichzeitig. Handwerk OS hält die Fäden zusammen.",
      mitarbeiter: "Wer ist Elektrofachkraft, wer Azubi, wer darf prüfen? Lotte plant nach Qualifikation und Urlaub.",
      material: "Leitungen, Schutzschalter, Zählerplätze: Lotte prüft vor dem Termin, ob alles im Lager oder im Wagen ist.",
      termine: "Netzbetreiber-Termine, Prüffristen und Kundendienst stehen in einem Kalender – nicht in drei.",
      vorschlag: "Störung bei Bäckerei Krüger → Tom, heute 10:00. Er ist 8 Minuten entfernt und hat FI-Schalter im Wagen.",
    },
    mobil: {
      intro: "Dein Monteur hat alles auf dem Handy: Auftrag, Plan, Messwerte und Unterschrift.",
      punkte: [
        "Messwerte direkt ins Protokoll eintragen",
        "Fotos vom Verteiler vorher und nachher",
        "Material aus dem Wagen buchen",
        "Regiebericht per Sprache diktieren",
        "Unterschrift vom Kunden auf dem Handy",
        "Auftrag abschließen – das Büro sieht es sofort",
      ],
      einsatz: {
        zeit: "10:00",
        titel: "Störung: FI löst aus",
        kunde: "Bäckerei Krüger · Marktstr. 3",
        tags: ["FI-Schalter im Wagen", "8 Min. Fahrt"],
      },
    },
    automatisch: [
      "erinnert Kunden an den fälligen E-Check",
      "legt Termine für DGUV-V3-Prüfungen an",
      "macht aus Messwerten ein fertiges Protokoll",
      "meldet fehlendes Material vor dem Termin",
      "plant Störungen in freie Lücken ein",
      "bereitet die Rechnung aus dem Regiebericht vor",
      "verfolgt offene Rechnungen",
    ],
    kunde: "elektro-brandt",
    funktionen: ["telefon", "einsatzplanung", "dokumentation", "qualifikationen", "material", "zeiterfassung", "rechnungen", "automatisch-erledigen"],
    wissen: {
      blog: "Praxistipps für Elektrobetriebe: Kundendienst, Prüfungen und Kalkulation.",
      vorlagen: "Vorlagen und Checklisten für Prüfungen, Übergabe und Regieberichte.",
      werkzeuge: ["stundensatz-rechner", "materialaufschlag-rechner", "fahrtkosten-rechner"],
    },
    faq: [
      {
        frage: "Kann ich Messprotokolle in Handwerk OS erstellen?",
        antwort:
          "Ja. Dein Monteur trägt die Messwerte auf dem Handy ein. Daraus entsteht ein Protokoll nach deiner Vorlage, das am Auftrag hängt und direkt an den Kunden gehen kann.",
      },
      {
        frage: "Wie behalte ich Prüffristen für E-Check und DGUV V3 im Blick?",
        antwort:
          "Jede Prüfung bekommt eine Frist. Handwerk OS erinnert dich rechtzeitig, schlägt Termine vor und schreibt auf Wunsch den Kunden an.",
      },
      {
        frage: "Berücksichtigt die Planung, wer welche Arbeiten machen darf?",
        antwort:
          "Ja. Du hinterlegst Qualifikationen wie Elektrofachkraft oder befähigte Person. Lotte plant dann nur passende Mitarbeiter ein und warnt, wenn eine Unterweisung abläuft.",
      },
      {
        frage: "Passt Handwerk OS zu Kundendienst und Baustelle gleichzeitig?",
        antwort:
          "Genau dafür ist es gemacht. Lange Baustellen stehen im Plan, Störungen kommen dazwischen. Lotte zeigt dir, wer in der Nähe ist und das Material dabei hat.",
      },
      {
        frage: "Können meine Monteure ohne Netz im Keller arbeiten?",
        antwort:
          "Ja. Wichtige Funktionen gehen auch ohne Empfang. Fotos, Zeiten und Messwerte werden übertragen, sobald wieder Netz da ist.",
      },
    ],
  },

  shk: {
    name: "SHK-Betriebe",
    seoTitel: "Software für SHK-Betriebe – Sanitär & Heizung",
    beschreibung:
      "Handwerk OS für Sanitär, Heizung und Klima: Notdienst, Wartungsverträge, Badsanierung, Trinkwasser und Abgasmessung – einfach geplant und abgerechnet.",
    icon: "wrench",
    teaser: "Notdienst, Wartungsverträge und Badsanierung ohne Zettelwirtschaft.",
    suchbegriffe: [
      "SHK",
      "Installateur",
      "Installateur und Heizungsbauer",
      "Heizungsbauer",
      "Sanitär",
      "Sanitärinstallateur",
      "Heizung",
      "Anlagenmechaniker",
      "Anlagenmechaniker SHK",
      "Badsanierung",
      "Wärmepumpe",
      "Heizungsinstallateur",
      "Gas- und Wasserinstallateur",
    ],
    hero: {
      intro:
        "Heizung aus am Sonntag, 300 Wartungen im Herbst, ein Bad mit drei Gewerken: Handwerk OS plant deine Monteure, merkt sich jeden Wartungsvertrag und hält Ersatzteile im Blick.",
      betrieb: "Haustechnik Muster",
      tag: [
        { zeit: "07:30", titel: "Wartung Gas-Brennwert", detail: "Kevin · Fam. Petersen", farbe: "moss" },
        { zeit: "09:15", titel: "Notdienst: Heizung aus", detail: "Ali · Hausverwaltung Nord", farbe: "signal" },
        { zeit: "13:00", titel: "Badsanierung Vorwandmontage", detail: "Lena, Jonas · Fam. Yıldız", farbe: "sky" },
      ],
      hinweis: {
        titel: "Lotte hat gesehen:",
        text: "38 Wartungen sind im Oktober fällig. Terminvorschläge nach Region sind fertig.",
      },
    },
    ablaeufe: [
      {
        titel: "Notdienst",
        text: "Samstagabend, die Heizung ist aus. Der Anruf muss beim richtigen Monteur landen – mit allem, was er wissen muss.",
        schritte: ["Anruf", "Fehlercode erfragen", "Bereitschaft informieren", "Reparatur", "Bericht & Unterschrift", "Rechnung"],
      },
      {
        titel: "Wartung",
        text: "Wartungsverträge sind planbares Geld. Wenn die Termine von selbst kommen.",
        schritte: ["Wartung fällig", "Terminvorschlag", "Wartung & Abgasmessung", "Protokoll", "Rechnung", "nächster Termin"],
      },
      {
        titel: "Badsanierung",
        text: "Mehrere Wochen, mehrere Gewerke, viele Teile mit Lieferzeit. Jeder Schritt hängt am vorherigen.",
        schritte: ["Aufmaß", "Angebot", "Bestellung", "Rückbau", "Installation", "Fliesen & Endmontage", "Abnahme"],
      },
    ],
    probleme: [
      {
        titel: "Wartungen gehen unter",
        text: "Die Verträge liegen im Ordner. Wann welcher Kunde dran ist, weiß niemand genau.",
      },
      {
        titel: "Notdienst ohne klare Bereitschaft",
        text: "Am Wochenende ruft der Kunde auf dem Handy vom Chef an. Wer hat eigentlich Bereitschaft?",
      },
      {
        titel: "Falsches Ersatzteil dabei",
        text: "Der Monteur steht vor der Therme, aber das passende Teil liegt im Lager. Zweite Anfahrt, unzufriedener Kunde.",
      },
      {
        titel: "Bad mit vielen Gewerken",
        text: "Fliesenleger, Elektriker und Trockenbau müssen in der richtigen Reihenfolge kommen. Verschiebt sich einer, kippt alles.",
      },
      {
        titel: "Nachweise und Protokolle",
        text: "Wartungsprotokoll, Druckprobe, Spülprotokoll, Nachweise für die Förderung – alles auf Papier, verteilt über die Woche.",
      },
      {
        titel: "Stunden und Material fehlen",
        text: "Die Dichtung, die Fahrt, die halbe Stunde extra: Was nicht aufgeschrieben wird, steht auch auf keiner Rechnung.",
      },
    ],
    hilfe: [
      { funktion: "telefon", text: "Notdienst-Anrufe werden aufgenommen und an die Bereitschaft weitergegeben." },
      { funktion: "kalender", text: "Fällige Wartungen bekommen automatisch Terminvorschläge – nach Region sortiert." },
      { funktion: "einsatzplanung", text: "Notdienst, Wartung und Baustelle in einem Plan. Lotte findet den nächsten freien Monteur." },
      { funktion: "lager", text: "Ersatzteile im Lager und im Fahrzeug – Lotte prüft vor dem Termin, ob das Teil da ist." },
      { funktion: "dokumentation", text: "Wartungsprotokoll, Druckprobe und Fotos direkt im Auftrag." },
      { funktion: "rechnungen", text: "Wartungspauschale, Material und Anfahrt landen ohne Abtippen auf der Rechnung." },
    ],
    eingerichtet: {
      begriffe: ["Anlage", "Wärmeerzeuger", "Wartungsvertrag", "Notdienst", "Bereitschaft", "Abgasmessung"],
      vorlagen: [
        "Wartungsvertrag Heizung",
        "Wartungsprotokoll Gas-Brennwertgerät",
        "Angebot Badsanierung",
        "Angebot Heizungstausch",
        "Notdienst-Bericht",
      ],
      checklisten: [
        "Wartung Gas-Brennwertgerät",
        "Inbetriebnahme Wärmepumpe",
        "Druckprobe Trinkwasserleitung",
        "Spülprotokoll Trinkwasser",
        "Hydraulischer Abgleich",
      ],
      qualifikationen: [
        "Eintragung beim Gasnetzbetreiber und Wasserversorger",
        "Kältemittel-Sachkunde für Wärmepumpen und Klima",
        "Schulung Trinkwasserhygiene",
        "Probenahme Trinkwasser",
        "Hersteller-Schulungen für Wärmeerzeuger",
      ],
    },
    auftragsarten: [
      { titel: "Notdienst & Störung", text: "Mit Bereitschaftsplan, Fehlerbild und schneller Rechnung." },
      { titel: "Wartung", text: "Gas, Öl, Wärmepumpe – wiederkehrend aus dem Wartungsvertrag." },
      { titel: "Heizungstausch", text: "Beratung, Angebot, Nachweise für die Förderung und Inbetriebnahme." },
      { titel: "Badsanierung", text: "Mehrwöchiges Projekt mit Bestellungen und anderen Gewerken." },
      { titel: "Trinkwasser", text: "Leitungen, Spülungen und Termine für Probenahmen." },
      { titel: "Kleine Reparaturen", text: "Tropfender Hahn, Spülkasten, Thermostat – schnell eingeplant und abgerechnet." },
    ],
    planung: {
      intro: "Herbst ist Wartungszeit, Winter ist Notdienstzeit. Handwerk OS sorgt dafür, dass beides gleichzeitig klappt.",
      mitarbeiter: "Bereitschaft, Urlaub, Kältemittel-Sachkunde: Lotte plant nur ein, wer frei ist und die Arbeit machen darf.",
      material: "Ersatzteile, Thermen, Sanitärobjekte mit Lieferzeit: Lotte meldet sich, bevor etwas fehlt.",
      termine: "Wartungen kommen als Vorschlag nach Region. Du bestätigst – der Kunde bekommt den Termin.",
      vorschlag: "Wartungen Südstadt → Kevin, Dienstag 7:30 bis 15:00. Fünf Kunden, kurze Wege, alle Teile im Lager.",
    },
    mobil: {
      intro: "Dein Monteur sieht beim Kunden die Anlage, die letzte Wartung und alles, was er braucht.",
      punkte: [
        "Anlagendaten und letzte Wartung auf einen Blick",
        "Wartungsprotokoll mit Messwerten ausfüllen",
        "Fotos von Typenschild und Schaden",
        "Ersatzteil aus dem Wagen buchen",
        "Unterschrift vom Kunden",
        "nächsten Wartungstermin direkt mitgeben",
      ],
      einsatz: {
        zeit: "07:30",
        titel: "Wartung Gas-Brennwert",
        kunde: "Fam. Petersen · Ahornweg 3",
        tags: ["Wartungsvertrag", "Dichtungssatz im Wagen"],
      },
    },
    automatisch: [
      "erinnert an fällige Wartungen und schlägt Termine vor",
      "nimmt Notdienst-Anrufe auf und informiert die Bereitschaft",
      "prüft vor dem Termin, ob das Ersatzteil da ist",
      "erstellt das Wartungsprotokoll als PDF",
      "rechnet die Wartungspauschale ab",
      "plant den nächsten Wartungstermin ein",
      "sagt dem Kunden, wann der Monteur kommt",
    ],
    kunde: "haustechnik-yilmaz",
    funktionen: ["telefon", "kalender", "einsatzplanung", "lager", "dokumentation", "qualifikationen", "rechnungen", "automatisch-erledigen"],
    wissen: {
      blog: "Praxistipps für SHK-Betriebe: Wartungsverträge, Notdienst und Badsanierung.",
      vorlagen: "Vorlagen für Wartungsverträge, Protokolle und Checklisten.",
      werkzeuge: ["stundenverrechnungssatz-rechner", "materialaufschlag-rechner", "fahrtkosten-rechner"],
    },
    faq: [
      {
        frage: "Kann ich Wartungsverträge in Handwerk OS verwalten?",
        antwort:
          "Ja. Jeder Vertrag hat Anlage, Intervall und Preis. Handwerk OS erinnert dich, wenn eine Wartung fällig ist, und schlägt Termine nach Region vor.",
      },
      {
        frage: "Wie läuft der Notdienst mit Handwerk OS?",
        antwort:
          "Du legst fest, wer wann Bereitschaft hat. Anrufe werden mit Adresse und Fehlerbild aufgenommen und an die Bereitschaft weitergegeben. Der Bericht geht danach direkt in die Rechnung.",
      },
      {
        frage: "Kann ich Protokolle für Trinkwasser und Abgasmessung ablegen?",
        antwort:
          "Ja. Druckprobe, Spülprotokoll, Wartungs- und Messprotokolle füllst du auf dem Handy aus. Sie hängen am Auftrag und an der Anlage – auch Jahre später noch auffindbar.",
      },
      {
        frage: "Hilft Handwerk OS bei der Badsanierung mit anderen Gewerken?",
        antwort:
          "Ja. Du planst die Bauabschnitte nacheinander. Verschiebt sich ein Schritt, siehst du sofort, welche Termine danach betroffen sind.",
      },
      {
        frage: "Weiß Handwerk OS, wer an Wärmepumpen arbeiten darf?",
        antwort:
          "Du hinterlegst Qualifikationen wie die Kältemittel-Sachkunde. Lotte plant passende Monteure ein und erinnert dich, bevor ein Nachweis abläuft.",
      },
    ],
  },

  maler: {
    name: "Maler & Lackierer",
    seoTitel: "Software für Maler und Lackierer",
    beschreibung:
      "Handwerk OS für Malerbetriebe: Aufmaß, Angebot am selben Tag, Fassaden mit Wetterplanung, Fotos für Hausverwaltungen und schnelle Rechnungen.",
    icon: "pen",
    teaser: "Aufmaß, schnelle Angebote und Fassaden, die nach dem Wetter geplant werden.",
    suchbegriffe: [
      "Maler",
      "Lackierer",
      "Maler und Lackierer",
      "Malermeister",
      "Malerbetrieb",
      "Anstreicher",
      "Tapezierer",
      "Fassade",
      "Fassadenmaler",
    ],
    hero: {
      intro:
        "Aufmaß vor Ort, Angebot noch am Abend, Kolonnen auf mehreren Baustellen: Handwerk OS rechnet Flächen, plant nach dem Wetter und schickt der Hausverwaltung die Fotos.",
      betrieb: "Malerei Muster",
      tag: [
        { zeit: "07:00", titel: "Fassade Mehrfamilienhaus", detail: "Kolonne Jan · Gerüst steht", farbe: "sky" },
        { zeit: "08:00", titel: "Wohnung renovieren", detail: "Sarah · Hausverwaltung Süd", farbe: "moss" },
        { zeit: "15:00", titel: "Aufmaß Treppenhaus", detail: "Chef · Lindenallee 8", farbe: "signal" },
      ],
      hinweis: {
        titel: "Lotte hat gesehen:",
        text: "Donnerstag ist Regen gemeldet. Vorschlag: Kolonne Jan zieht die Innenarbeiten bei Fam. Wolf vor.",
      },
    },
    ablaeufe: [
      {
        titel: "Innenanstrich",
        text: "Wohnzimmer, Flur, zwei Kinderzimmer. Der Kunde will den Preis lieber heute als nächste Woche.",
        schritte: ["Anfrage", "Aufmaß", "Angebot", "Termin", "Abkleben & Streichen", "Abnahme", "Rechnung"],
      },
      {
        titel: "Fassade",
        text: "Gerüst, Untergrund, Wetter: Bei der Fassade muss alles zusammenpassen.",
        schritte: ["Begehung", "Aufmaß", "Angebot", "Gerüst bestellen", "Untergrund vorbereiten", "Anstrich", "Abnahme"],
      },
      {
        titel: "Renovierung für Hausverwaltungen",
        text: "Mieterwechsel, Schlüssel, enge Fristen. Die Verwaltung will Fotos und eine saubere Rechnung.",
        schritte: ["Auftrag der Verwaltung", "Schlüssel holen", "Renovieren", "Fotos", "Abnahme", "Rechnung"],
      },
    ],
    probleme: [
      {
        titel: "Aufmaß auf dem Zettel",
        text: "Wände, Decken, Fenster abziehen – abends wird alles nachgerechnet. Das kostet Zeit und bringt Fehler.",
      },
      {
        titel: "Angebote dauern zu lange",
        text: "Der Kunde wartet eine Woche. In der Zeit hat er schon beim Nächsten unterschrieben.",
      },
      {
        titel: "Das Wetter macht den Plan",
        text: "Regen, Frost, Hitze: Bei der Fassade verschiebt sich ständig etwas. Die Kolonne braucht trotzdem Arbeit.",
      },
      {
        titel: "Farbton und Material vergessen",
        text: "Welcher Farbton war im Schlafzimmer? Die Info steckt im Kopf vom Kollegen, der heute im Urlaub ist.",
      },
      {
        titel: "Hausverwaltungen wollen Nachweise",
        text: "Vorher, nachher, Mängel – ohne Fotos gibt es Diskussionen und die Rechnung bleibt liegen.",
      },
      {
        titel: "Nachträge gehen verloren",
        text: "Extra Spachtelarbeiten, ein Raum mehr: Was vor Ort mündlich besprochen wird, fehlt später auf der Rechnung.",
      },
    ],
    hilfe: [
      { funktion: "aufmass", text: "Räume und Flächen auf dem Handy erfassen – Abzüge für Fenster und Türen inklusive." },
      { funktion: "angebote", text: "Aus dem Aufmaß wird das Angebot. Oft noch am selben Tag." },
      { funktion: "einsatzplanung", text: "Kolonnen nach Baustelle und Wetter planen – mit Vorschlag zum Umplanen." },
      { funktion: "dokumentation", text: "Vorher-nachher-Fotos, Farbtöne und Mängel direkt am Auftrag." },
      { funktion: "material", text: "Farbe, Spachtel, Abdeckmaterial: Lotte rechnet den Bedarf aus der Fläche." },
      { funktion: "rechnungen", text: "Rechnung nach Abnahme – mit Fotos für die Hausverwaltung." },
    ],
    eingerichtet: {
      begriffe: ["Aufmaß", "Raumbuch", "Farbton", "Untergrund", "Qualitätsstufe", "Kolonne"],
      vorlagen: [
        "Angebot Innenanstrich",
        "Angebot Fassadenanstrich",
        "Angebot Tapezierarbeiten",
        "Raumbuch mit Farbtönen",
        "Abnahmeprotokoll mit Fotos",
      ],
      checklisten: [
        "Untergrundprüfung",
        "Abdecken und Schutzmaßnahmen",
        "Fassade: Gerüst und Wetter",
        "Wohnungsübergabe an die Verwaltung",
        "Abnahme mit dem Kunden",
      ],
      qualifikationen: [
        "Bedienung Hubarbeitsbühne",
        "Befähigte Person für Gerüstprüfung",
        "Sachkunde Asbest für Arbeiten an Altbeschichtungen",
        "Unterweisung Gefahrstoffe und Lösemittel",
        "Ersthelfer",
      ],
    },
    auftragsarten: [
      { titel: "Innenanstrich", text: "Wohnung, Haus, Büro – Raum für Raum mit Farbton." },
      { titel: "Fassade", text: "Mit Gerüst, Untergrund und Wetterplanung." },
      { titel: "Tapezieren", text: "Raufaser, Vlies, Designtapete – mit Rollenbedarf aus dem Aufmaß." },
      { titel: "Lackierarbeiten", text: "Türen, Fenster, Heizkörper, Treppengeländer." },
      { titel: "Wohnungsrenovierung", text: "Für Hausverwaltungen, mit Fotos und fester Frist." },
      { titel: "Wärmedämmung", text: "Wärmedämmverbundsystem als eigener Ablauf mit Bauabschnitten." },
    ],
    planung: {
      intro: "Mehrere Kolonnen, viele Baustellen, wechselndes Wetter. Handwerk OS behält den Überblick.",
      mitarbeiter: "Wer ist mit wem unterwegs? Wer darf auf die Hubarbeitsbühne? Lotte plant Kolonnen nach Können und Urlaub.",
      material: "Lotte rechnet aus der Fläche, wie viel Farbe gebraucht wird, und erinnert an die Bestellung.",
      termine: "Fassaden nach Wetter, Wohnungen nach Frist der Verwaltung, Aufmaße dazwischen.",
      vorschlag: "Regen am Donnerstag → Kolonne Jan zieht Innenarbeiten bei Fam. Wolf vor. Fassade rutscht auf Montag.",
    },
    mobil: {
      intro: "Auf der Baustelle zählt: Welcher Raum, welcher Farbton, was ist zu tun?",
      punkte: [
        "Raumbuch mit Farbtönen auf dem Handy",
        "Aufmaß vor Ort erfassen",
        "Vorher-nachher-Fotos pro Raum",
        "Nachtrag direkt beim Kunden aufnehmen",
        "Material nachbestellen",
        "Abnahme mit Unterschrift",
      ],
      einsatz: {
        zeit: "08:00",
        titel: "Wohnzimmer + Flur streichen",
        kunde: "Fam. Wolf · Kastanienweg 7",
        tags: ["Farbton im Raumbuch", "Abdeckmaterial im Wagen"],
      },
    },
    automatisch: [
      "macht aus dem Aufmaß ein Angebot",
      "rechnet den Farbbedarf aus der Fläche",
      "schlägt bei Regen eine Umplanung vor",
      "schickt der Hausverwaltung Fotos und Abnahme",
      "erinnert an Nachträge, die noch nicht im Angebot sind",
      "bereitet die Rechnung nach der Abnahme vor",
      "fasst offene Angebote beim Kunden nach",
    ],
    kunde: "malerei-koch",
    funktionen: ["aufmass", "kalkulation", "angebote", "einsatzplanung", "dokumentation", "material", "rechnungen", "automatisch-erledigen"],
    wissen: {
      blog: "Praxistipps für Malerbetriebe: Aufmaß, Angebot und Fassadenplanung.",
      vorlagen: "Vorlagen für Raumbuch, Abnahme und Wohnungsübergabe.",
      werkzeuge: ["angebots-rechner", "stundensatz-rechner", "materialaufschlag-rechner"],
    },
    faq: [
      {
        frage: "Kann ich mit Handwerk OS ein Aufmaß machen?",
        antwort:
          "Ja. Du erfasst Räume und Flächen auf dem Handy oder Tablet. Fenster und Türen ziehst du ab. Die Mengen gehen direkt ins Angebot.",
      },
      {
        frage: "Wie hilft Handwerk OS bei der Wetterplanung?",
        antwort:
          "Außenarbeiten markierst du als wetterabhängig. Ist Regen oder Frost gemeldet, schlägt Lotte vor, welche Innenarbeiten die Kolonne vorziehen kann.",
      },
      {
        frage: "Kann ich Hausverwaltungen Fotos und Nachweise schicken?",
        antwort:
          "Ja. Vorher-nachher-Fotos und das Abnahmeprotokoll hängen am Auftrag. Du schickst sie mit der Rechnung oder als eigenen Bericht.",
      },
      {
        frage: "Merkt sich Handwerk OS Farbtöne pro Raum?",
        antwort:
          "Ja. Im Raumbuch steht pro Raum Farbton, Material und Besonderheit. Auch beim nächsten Auftrag in ein paar Jahren.",
      },
    ],
  },

  fliesenleger: {
    name: "Fliesenleger",
    seoTitel: "Software für Fliesenleger",
    beschreibung:
      "Handwerk OS für Fliesenleger: Aufmaß mit Verschnitt, Fliesen mit Lieferzeit, Abdichtung mit Fotos dokumentiert und Termine mit Installateur und Estrichleger abgestimmt.",
    icon: "layers",
    teaser: "Aufmaß mit Verschnitt, Abdichtung mit Fotos, Termine mit den anderen Gewerken.",
    suchbegriffe: [
      "Fliesenleger",
      "Fliesen-, Platten- und Mosaikleger",
      "Fliesen",
      "Plattenleger",
      "Mosaikleger",
      "Fliesenlegermeister",
      "Natursteinverleger",
    ],
    hero: {
      intro:
        "Fliesen mit Lieferzeit, Estrich, der noch nicht belegreif ist, ein Installateur, der sich verspätet: Handwerk OS hält deine Baustellen zusammen – und dokumentiert die Abdichtung, bevor sie unter der Fliese verschwindet.",
      betrieb: "Fliesen Muster",
      tag: [
        { zeit: "07:30", titel: "Bad: Abdichtung", detail: "Marco · Fam. Yıldız", farbe: "sky" },
        { zeit: "11:00", titel: "Belegreife prüfen", detail: "Chef · Neubau Hoffmann", farbe: "moss" },
        { zeit: "14:00", titel: "Silikonfugen erneuern", detail: "Dennis · Fr. Lehmann", farbe: "signal" },
      ],
      hinweis: {
        titel: "Lotte hat gesehen:",
        text: "Die Großformat-Fliesen für Bad Yıldız kommen erst Freitag. Vorschlag: Abdichtung Mittwoch, Verlegen Montag.",
      },
    },
    ablaeufe: [
      {
        titel: "Badsanierung",
        text: "Du bist mittendrin: Nach dem Installateur, vor der Endmontage. Jeder Tag Verzug trifft dich zuerst.",
        schritte: ["Aufmaß", "Angebot", "Fliesen bestellen", "Abdichtung", "Fliesen legen", "Verfugen", "Abnahme"],
      },
      {
        titel: "Bodenfliesen im Neubau",
        text: "Erst wenn der Estrich belegreif ist, geht es los. Bis dahin muss alles bestellt und eingeplant sein.",
        schritte: ["Aufmaß", "Angebot", "Belegreife prüfen", "Material liefern", "Verlegen", "Abschlagsrechnung"],
      },
      {
        titel: "Terrasse & Balkon",
        text: "Draußen kommen Gefälle, Entwässerung und Wetter dazu.",
        schritte: ["Besichtigung", "Angebot", "Untergrund", "Abdichtung", "Verlegen", "Abnahme"],
      },
    ],
    probleme: [
      {
        titel: "Falsche Fliesenmenge",
        text: "Zu wenig bestellt, und die Charge ist weg. Zu viel bestellt, und die Kisten stehen im Lager.",
      },
      {
        titel: "Abhängig von anderen Gewerken",
        text: "Der Installateur ist nicht fertig, der Estrich nicht belegreif. Deine Leute stehen rum oder fahren umsonst.",
      },
      {
        titel: "Abdichtung ohne Nachweis",
        text: "Wenn später Wasser im Keller steht, willst du zeigen können, wie abgedichtet wurde. Ohne Fotos geht das nicht.",
      },
      {
        titel: "Lieferzeiten im Blick behalten",
        text: "Großformat und Naturstein kommen in Wochen, nicht in Tagen. Wer das vergisst, verschiebt die ganze Baustelle.",
      },
      {
        titel: "Kunde ändert die Fliese",
        text: "Drei Tage vor Beginn gefällt die Fliese nicht mehr. Angebot, Bestellung und Plan müssen neu.",
      },
      {
        titel: "Kleine Aufträge rechnen sich nicht",
        text: "Silikonfuge, gesprungene Fliese: Ohne schnelle Planung und Rechnung kosten kleine Aufträge mehr als sie bringen.",
      },
    ],
    hilfe: [
      { funktion: "aufmass", text: "Wand- und Bodenflächen mit Nischen und Laibungen erfassen – Verschnitt inklusive." },
      { funktion: "kalkulation", text: "Fliese, Kleber, Abdichtung, Fugenmasse und Arbeitszeit sauber kalkulieren." },
      { funktion: "einkauf", text: "Bestellungen mit Liefertermin. Lotte meldet sich, wenn es knapp wird." },
      { funktion: "einsatzplanung", text: "Termine hängen an den Vorarbeiten. Verschiebt sich etwas, siehst du die Folgen sofort." },
      { funktion: "dokumentation", text: "Abdichtung, Dichtband und Untergrund mit Fotos – bevor alles zu ist." },
      { funktion: "rechnungen", text: "Abschläge im Neubau, schnelle Rechnungen bei kleinen Aufträgen." },
    ],
    eingerichtet: {
      begriffe: ["Verlegefläche", "Verschnitt", "Abdichtung", "Belegreife", "Fugenbild", "Wartungsfuge"],
      vorlagen: [
        "Angebot Bad komplett",
        "Angebot Bodenfliesen",
        "Angebot Terrasse und Balkon",
        "Protokoll Abdichtung mit Fotos",
        "Abnahmeprotokoll",
      ],
      checklisten: [
        "Untergrund und Belegreife prüfen",
        "Abdichtung im Bad nach DIN 18534",
        "Gefälle und Entwässerung draußen",
        "Fliesen bei Anlieferung prüfen (Charge, Menge, Schäden)",
        "Übergabe mit Pflegehinweisen",
      ],
      qualifikationen: [
        "Verlegung von Großformaten",
        "Naturstein verlegen",
        "Unterweisung Epoxidharze",
        "Staubschutz beim Schneiden",
        "Ersthelfer",
      ],
    },
    auftragsarten: [
      { titel: "Bad komplett", text: "Abdichtung, Wand, Boden, Fugen – im Zusammenspiel mit dem Installateur." },
      { titel: "Bodenfliesen", text: "Wohnräume und Neubau, oft mit Abschlagsrechnung." },
      { titel: "Terrasse & Balkon", text: "Mit Gefälle, Entwässerung und Wetter." },
      { titel: "Naturstein & Treppen", text: "Längere Lieferzeiten, mehr Planung." },
      { titel: "Großformat", text: "Mehr Leute, besonderes Werkzeug, genaue Untergrundprüfung." },
      { titel: "Reparatur & Silikonfugen", text: "Kleine Aufträge, schnell geplant und abgerechnet." },
    ],
    planung: {
      intro: "Fliesenleger kommen selten zuerst. Handwerk OS zeigt dir, wann du wirklich loslegen kannst.",
      mitarbeiter: "Wer kann Großformat, wer Naturstein? Lotte plant nach Können – und Großformat immer zu zweit.",
      material: "Fliesen, Kleber, Abdichtung: Lotte prüft Liefertermine gegen den Baustellenstart.",
      termine: "Vorarbeiten von Installateur und Estrich stehen im Plan. Verschiebt sich etwas, rutscht deine Planung mit.",
      vorschlag: "Fliesen für Bad Yıldız kommen Freitag → Abdichtung Mittwoch, Verlegen ab Montag mit Marco und Dennis.",
    },
    mobil: {
      intro: "Auf der Baustelle braucht dein Fliesenleger Fugenbild, Fliese und Höhen – nicht drei Zettel.",
      punkte: [
        "Verlegeplan und Fugenbild auf dem Handy",
        "Fotos der Abdichtung vor dem Fliesen",
        "Aufmaß vor Ort ergänzen",
        "Nachtrag beim Kunden aufnehmen",
        "Material nachbestellen",
        "Abnahme mit Unterschrift",
      ],
      einsatz: {
        zeit: "07:30",
        titel: "Bad: Abdichtung",
        kunde: "Fam. Yıldız · Birkenweg 21",
        tags: ["Dichtband im Wagen", "Fotos Pflicht"],
      },
    },
    automatisch: [
      "rechnet Fliesenmenge mit Verschnitt aus dem Aufmaß",
      "prüft Liefertermine gegen den Baustart",
      "fragt nach, ob die Vorarbeiten fertig sind",
      "verlangt Fotos der Abdichtung, bevor es weitergeht",
      "plant kleine Reparaturen in freie Lücken",
      "bereitet Abschlagsrechnungen im Neubau vor",
      "erinnert Kunden an die Prüfung der Wartungsfugen",
    ],
    kunde: "malerei-koch",
    funktionen: ["aufmass", "kalkulation", "angebote", "einkauf", "einsatzplanung", "dokumentation", "rechnungen", "automatisch-erledigen"],
    wissen: {
      blog: "Praxistipps für Fliesenleger: Aufmaß, Kalkulation und Zusammenarbeit mit anderen Gewerken.",
      vorlagen: "Vorlagen für Abdichtungsprotokoll, Abnahme und Übergabe.",
      werkzeuge: ["angebots-rechner", "materialaufschlag-rechner", "deckungsbeitrags-rechner"],
    },
    faq: [
      {
        frage: "Rechnet Handwerk OS den Verschnitt mit ein?",
        antwort:
          "Ja. Du legst pro Fliese und Verlegeart einen Zuschlag fest. Lotte rechnet ihn aus dem Aufmaß mit in Menge und Angebot.",
      },
      {
        frage: "Wie dokumentiere ich die Abdichtung?",
        antwort:
          "Im Auftrag ist ein Schritt „Abdichtung“ mit Pflichtfotos und Checkliste. Erst wenn die Fotos da sind, geht es weiter. So hast du später einen Nachweis.",
      },
      {
        frage: "Kann ich Termine mit Installateur und Estrichleger abstimmen?",
        antwort:
          "Du trägst die Vorarbeiten als Schritte im Auftrag ein. Verschieben sie sich, siehst du sofort, welche deiner Termine betroffen sind, und kannst sie mit einem Klick verschieben.",
      },
      {
        frage: "Lohnt sich Handwerk OS auch für kleine Betriebe?",
        antwort:
          "Ja. Gerade wenn der Chef selbst auf der Baustelle steht, spart es Abende am Schreibtisch: Angebot vom Handy, Rechnung nach der Abnahme.",
      },
    ],
  },

  tischler: {
    name: "Tischler & Schreiner",
    seoTitel: "Software für Tischler und Schreiner",
    beschreibung:
      "Handwerk OS für Tischlereien und Schreinereien: Werkstatt und Montage planen, Zuschnittlisten, Beschläge bestellen und Nachkalkulation für jeden Auftrag.",
    icon: "ruler",
    teaser: "Werkstatt und Montage in einem Plan – mit Nachkalkulation für jeden Auftrag.",
    suchbegriffe: [
      "Tischler",
      "Schreiner",
      "Tischlerei",
      "Schreinerei",
      "Möbeltischler",
      "Bautischler",
      "Möbelbau",
      "Küchenbau",
      "Fensterbau Holz",
      "Innenausbau",
    ],
    hero: {
      intro:
        "Entwurf, Werkstatt, Montage: Bei dir läuft jeder Auftrag durch drei Welten. Handwerk OS plant Maschinen und Monteure, bestellt Beschläge rechtzeitig und zeigt dir am Ende, was der Auftrag wirklich gebracht hat.",
      betrieb: "Tischlerei Muster",
      tag: [
        { zeit: "07:00", titel: "Zuschnitt Einbauschrank Krause", detail: "Werkstatt · Formatkreissäge", farbe: "sky" },
        { zeit: "09:30", titel: "Montage Küche", detail: "Paul, Erik · Fam. Neumann", farbe: "signal" },
        { zeit: "14:00", titel: "Aufmaß Innentüren", detail: "Chef · Altbau Bergstr.", farbe: "moss" },
      ],
      hinweis: {
        titel: "Lotte hat gesehen:",
        text: "Die Scharniere für Auftrag Krause sind noch nicht bestellt. Montage ist in 9 Tagen.",
      },
    },
    ablaeufe: [
      {
        titel: "Möbel nach Maß",
        text: "Vom ersten Gespräch bis zum fertig montierten Einbauschrank vergehen Wochen. Jeder Schritt braucht andere Leute.",
        schritte: ["Beratung", "Aufmaß", "Entwurf & Angebot", "Freigabe", "Zuschnitt", "Fertigung", "Montage"],
      },
      {
        titel: "Fenster & Türen",
        text: "Zugekauft oder selbst gebaut: Aufmaß, Bestellung und Einbau müssen genau zusammenpassen.",
        schritte: ["Aufmaß", "Angebot", "Bestellung", "Ausbau alt", "Einbau", "Abnahme"],
      },
      {
        titel: "Reparatur & Service",
        text: "Klemmende Tür, Schublade kaputt, Fenster einstellen. Kleine Aufträge, die schnell erledigt sein wollen.",
        schritte: ["Anfrage", "Termin", "Reparatur", "Bericht", "Rechnung"],
      },
    ],
    probleme: [
      {
        titel: "Werkstatt und Montage beißen sich",
        text: "Die besten Leute sollen gleichzeitig an der Maschine und beim Kunden sein. Das geht nicht.",
      },
      {
        titel: "Maschinen sind doppelt belegt",
        text: "CNC und Kantenanleimmaschine laufen auf Zuruf. Wer zuerst kommt, mahlt zuerst.",
      },
      {
        titel: "Beschläge fehlen bei der Montage",
        text: "Das Möbel steht beim Kunden, aber die Griffe sind noch beim Händler. Zweite Anfahrt.",
      },
      {
        titel: "Keine Nachkalkulation",
        text: "War der Auftrag gut? Ohne Stunden pro Arbeitsschritt weißt du es nicht. Die nächste Kalkulation bleibt ein Bauchgefühl.",
      },
      {
        titel: "Änderungen erreichen die Werkstatt nicht",
        text: "Der Kunde will den Schrank 5 cm schmaler. Das Büro weiß es, der Kollege an der Säge nicht.",
      },
      {
        titel: "Montage hängt an der Baustelle",
        text: "Der Maler ist nicht fertig, der Boden fehlt noch. Die Montage verschiebt sich, das Lager läuft voll.",
      },
    ],
    hilfe: [
      { funktion: "aufmass", text: "Maße, Fotos und Besonderheiten vor Ort – schiefe Wände inklusive." },
      { funktion: "kalkulation", text: "Material, Maschinenzeit und Montage getrennt kalkulieren." },
      { funktion: "einsatzplanung", text: "Werkstatt, Maschinen und Montage in einem Plan." },
      { funktion: "einkauf", text: "Platten und Beschläge mit Liefertermin – passend zum Montagetag." },
      { funktion: "zeiterfassung", text: "Zeiten pro Arbeitsschritt: Zuschnitt, Fertigung, Oberfläche, Montage." },
      { funktion: "auswertung", text: "Nachkalkulation für jeden Auftrag – ohne Tabelle." },
    ],
    eingerichtet: {
      begriffe: ["Stückliste", "Zuschnittliste", "Werkstattauftrag", "Beschläge", "Oberfläche", "Montage"],
      vorlagen: [
        "Angebot Einbauschrank",
        "Angebot Küche",
        "Angebot Innentüren",
        "Angebot Fenstertausch",
        "Montageprotokoll",
      ],
      checklisten: [
        "Aufmaß Einbaumöbel",
        "Werkstatt-Übergabe an die Montage",
        "Verladen vor der Montage",
        "Fenstereinbau und Anschlussfugen",
        "Abnahme mit dem Kunden",
      ],
      qualifikationen: [
        "Unterweisung Holzbearbeitungsmaschinen",
        "CNC-Bedienung",
        "Gabelstapler",
        "Fenstermontage nach RAL-Leitfaden",
        "Einbau von Brandschutztüren",
      ],
    },
    auftragsarten: [
      { titel: "Möbel & Einbauschränke", text: "Entwurf, Fertigung, Montage – mit eigener Nachkalkulation." },
      { titel: "Küchen", text: "Mit Geräten, Arbeitsplatte und Anschluss durch Elektriker und Installateur." },
      { titel: "Innentüren", text: "Aufmaß, Bestellung, Einbau, oft im Paket für ein ganzes Haus." },
      { titel: "Fenster & Haustüren", text: "Ausbau, Einbau und Anschlüsse am selben Tag." },
      { titel: "Innenausbau", text: "Laden, Praxis, Büro: größere Projekte mit Bauabschnitten." },
      { titel: "Reparatur & Service", text: "Kleine Aufträge, schnell geplant und abgerechnet." },
    ],
    planung: {
      intro: "Bei dir gibt es zwei Pläne: Werkstatt und Montage. Handwerk OS macht einen daraus.",
      mitarbeiter: "Wer kann an die CNC, wer montiert Fenster? Lotte plant nach Können und Urlaub.",
      material: "Platten, Kanten, Beschläge: Lotte prüft Liefertermine gegen den Fertigungs- und Montagetag.",
      termine: "Montage erst, wenn die Baustelle bereit ist. Lotte fragt vorher beim Kunden nach.",
      vorschlag: "Zuschnitt Krause Montag, Fertigung Di–Mi, Montage Freitag mit Paul und Erik. Scharniere jetzt bestellen.",
    },
    mobil: {
      intro: "Montage beim Kunden: Zeichnung, Stückliste und Fotos aus der Werkstatt sind auf dem Handy dabei.",
      punkte: [
        "Zeichnung und Stückliste dabei",
        "Fotos und Maße vor Ort ergänzen",
        "Zeit pro Arbeitsschritt erfassen",
        "fehlende Teile sofort melden",
        "Montageprotokoll mit Unterschrift",
        "Restarbeiten als eigenen Termin anlegen",
      ],
      einsatz: {
        zeit: "09:30",
        titel: "Montage Küche",
        kunde: "Fam. Neumann · Gartenstr. 14",
        tags: ["Alle Teile verladen", "Zeichnung dabei"],
      },
    },
    automatisch: [
      "erinnert an Beschläge, die noch nicht bestellt sind",
      "stimmt den Montagetermin mit dem Kunden ab",
      "meldet, wenn eine Maschine doppelt belegt ist",
      "sammelt Zeiten pro Auftrag für die Nachkalkulation",
      "stellt die Abschlagsrechnung bei Auftragsfreigabe",
      "bereitet die Schlussrechnung nach der Montage vor",
    ],
    kunde: "tischlerei-weber",
    funktionen: ["aufmass", "kalkulation", "angebote", "einsatzplanung", "einkauf", "zeiterfassung", "auswertung", "automatisch-erledigen"],
    wissen: {
      blog: "Praxistipps für Tischlereien: Kalkulation, Werkstattplanung und Nachkalkulation.",
      vorlagen: "Vorlagen für Aufmaß, Montageprotokoll und Abnahme.",
      werkzeuge: ["stundenverrechnungssatz-rechner", "deckungsbeitrags-rechner", "angebots-rechner"],
    },
    faq: [
      {
        frage: "Kann ich Werkstatt und Montage gemeinsam planen?",
        antwort:
          "Ja. Jeder Auftrag hat Schritte wie Zuschnitt, Fertigung, Oberfläche und Montage. Du planst sie im selben Plan – Maschinen und Mitarbeiter inklusive.",
      },
      {
        frage: "Wie funktioniert die Nachkalkulation?",
        antwort:
          "Mitarbeiter erfassen ihre Zeiten pro Arbeitsschritt. Handwerk OS stellt sie dem Angebot gegenüber. So siehst du, wo du richtig lagst und wo nicht.",
      },
      {
        frage: "Ist Handwerk OS ein Zeichenprogramm?",
        antwort:
          "Nein. Entwürfe machst du weiter mit deinem Zeichenprogramm. Zeichnungen und Stücklisten hängst du an den Auftrag – dann hat sie jeder in Werkstatt und Montage dabei.",
      },
      {
        frage: "Kann ich Maschinen wie die CNC einplanen?",
        antwort:
          "Ja. Maschinen legst du wie Werkzeuge an und planst sie mit ein. Lotte warnt, wenn zwei Aufträge die gleiche Maschine zur gleichen Zeit brauchen.",
      },
    ],
  },

  dachdecker: {
    name: "Dachdecker",
    seoTitel: "Software für Dachdecker",
    beschreibung:
      "Handwerk OS für Dachdeckerbetriebe: Planung nach Wetter, Absturzsicherung und Unterweisungen, Sturmschäden mit Fotos für die Versicherung und Kolonnen im Griff.",
    icon: "home",
    teaser: "Planung nach Wetter, Absturzsicherung und Sturmschäden mit Fotos.",
    suchbegriffe: [
      "Dachdecker",
      "Dachdeckerei",
      "Dachdeckermeister",
      "Dach",
      "Bedachung",
      "Flachdach",
      "Steildach",
      "Dachsanierung",
    ],
    hero: {
      intro:
        "Wetter, Gerüst, Absturzsicherung und nach jedem Sturm das Telefon im Dauerbetrieb: Handwerk OS plant deine Kolonnen, nimmt Schäden mit Fotos auf und denkt an jede Unterweisung.",
      betrieb: "Bedachungen Muster",
      tag: [
        { zeit: "07:00", titel: "Neueindeckung EFH", detail: "Kolonne Sven · Gerüst steht", farbe: "sky" },
        { zeit: "08:30", titel: "Sturmschaden: Ziegel lose", detail: "Nico · Fam. Schulz", farbe: "signal" },
        { zeit: "13:00", titel: "Flachdach-Wartung", detail: "Ole · Gewerbehalle Nord", farbe: "moss" },
      ],
      hinweis: {
        titel: "Lotte hat gesehen:",
        text: "Für Donnerstag ist Sturm gemeldet. Vorschlag: Neueindeckung sichern, Kolonne in die Halle zum Vorbereiten.",
      },
    },
    ablaeufe: [
      {
        titel: "Neueindeckung Steildach",
        text: "Gerüst, Container, Material per Kran: Bevor der erste Ziegel fällt, muss vieles stimmen.",
        schritte: ["Aufmaß", "Angebot", "Gerüst & Container", "Abdecken", "Dämmen & Lattung", "Eindecken", "Abnahme"],
      },
      {
        titel: "Sturmschaden",
        text: "Nach dem Sturm rufen alle gleichzeitig an. Jetzt zählt: aufnehmen, sichern, dokumentieren.",
        schritte: ["Anruf mit Fotos", "Notsicherung", "Schaden aufnehmen", "Bericht für Versicherung", "Reparatur", "Rechnung"],
      },
      {
        titel: "Flachdach & Wartung",
        text: "Regelmäßige Kontrollen verhindern Wasserschäden – und bringen planbare Aufträge.",
        schritte: ["Wartung fällig", "Termin", "Kontrolle & Reinigung", "Fotos & Bericht", "Angebot für Mängel"],
      },
    ],
    probleme: [
      {
        titel: "Das Wetter wirft alles um",
        text: "Regen, Sturm, Frost: Jeden Morgen wird neu geplant. Die Kolonne wartet auf den Anruf.",
      },
      {
        titel: "Nach dem Sturm klingelt alles",
        text: "Dutzende Anrufe an einem Tag. Wer hat was gemeldet, was ist dringend, wer fährt hin?",
      },
      {
        titel: "Nachweise zur Absturzsicherung",
        text: "Unterweisung, Gerüstprüfung, Prüfung der Schutzausrüstung: Ist alles aktuell? Meistens weiß es keiner sicher.",
      },
      {
        titel: "Gerüst, Kran und Container",
        text: "Drei Firmen, drei Termine. Verschiebt sich die Baustelle, muss alles umbestellt werden.",
      },
      {
        titel: "Versicherung will Belege",
        text: "Ohne Fotos und sauberen Schadensbericht zieht sich die Regulierung – und deine Rechnung bleibt offen.",
      },
      {
        titel: "Stunden der Kolonne",
        text: "Wer war wie lange auf welchem Dach? Die Zettel kommen am Freitag, wenn überhaupt.",
      },
    ],
    hilfe: [
      { funktion: "anfragen", text: "Schadensmeldungen mit Fotos und Adresse, nach Dringlichkeit sortiert." },
      { funktion: "einsatzplanung", text: "Kolonnen nach Wetter planen – mit Vorschlag für Innenarbeiten bei Regen." },
      { funktion: "qualifikationen", text: "Unterweisungen zur Absturzsicherung im Blick, bevor sie ablaufen." },
      { funktion: "dokumentation", text: "Fotos vom Dach, Schadensbericht und Abnahme direkt am Auftrag." },
      { funktion: "fahrzeuge", text: "Fahrzeuge, Anhänger und Aufzüge planen und warten." },
      { funktion: "zeiterfassung", text: "Kolonnen-Zeiten pro Baustelle – direkt vom Handy." },
    ],
    eingerichtet: {
      begriffe: ["Eindeckung", "Lattung", "Unterdeckbahn", "Traufe", "First", "Kehle"],
      vorlagen: [
        "Angebot Neueindeckung Steildach",
        "Angebot Flachdachsanierung",
        "Angebot Dachfenster",
        "Schadensbericht für die Versicherung",
        "Wartungsbericht Flachdach",
      ],
      checklisten: [
        "Absturzsicherung vor Arbeitsbeginn",
        "Wetter und Wind prüfen",
        "Gerüstfreigabe",
        "Notsicherung nach Sturm",
        "Dachabnahme",
      ],
      qualifikationen: [
        "Unterweisung Schutzausrüstung gegen Absturz",
        "Befähigte Person für Gerüste",
        "Anschläger für Kranarbeiten",
        "Sachkunde Asbest für alte Wellplatten",
        "Ersthelfer",
      ],
    },
    auftragsarten: [
      { titel: "Neueindeckung", text: "Steildach mit Dämmung, Lattung und Klempnerarbeiten." },
      { titel: "Flachdach", text: "Abdichtung, Sanierung und regelmäßige Wartung." },
      { titel: "Sturmschaden", text: "Schnell aufnehmen, sichern, für die Versicherung dokumentieren." },
      { titel: "Dachfenster", text: "Einbau oder Austausch, oft an einem Tag." },
      { titel: "Dachrinne & Klempnerarbeiten", text: "Rinnen, Fallrohre, Anschlüsse und Einfassungen." },
      { titel: "Photovoltaik vorbereiten", text: "Dach prüfen und Haken setzen, abgestimmt mit dem Elektriker." },
    ],
    planung: {
      intro: "Auf dem Dach zählt, wer sicher arbeiten darf – und ob das Wetter mitspielt.",
      mitarbeiter: "Unterweisung abgelaufen? Dann plant Lotte den Kollegen nicht aufs Dach und sagt dir Bescheid.",
      material: "Ziegel, Bahnen, Dämmung: Lotte stimmt Lieferung, Kran und Gerüst auf den Baustart ab.",
      termine: "Außenarbeiten sind wetterabhängig markiert. Bei Sturm kommt ein Vorschlag zum Umplanen.",
      vorschlag: "Sturm am Donnerstag → Neueindeckung Mittwoch sichern, Donnerstag Halle: Material für Schulz vorbereiten.",
    },
    mobil: {
      intro: "Auf dem Dach hat keiner Lust auf Papier. Fotos, Zeiten und Bericht gehen direkt vom Handy.",
      punkte: [
        "Schaden mit Fotos aufnehmen",
        "Checkliste Absturzsicherung abhaken",
        "Zeiten der Kolonne erfassen",
        "Material nachbestellen",
        "Bericht per Sprache diktieren",
        "Abnahme mit Unterschrift",
      ],
      einsatz: {
        zeit: "08:30",
        titel: "Sturmschaden: Ziegel lose",
        kunde: "Fam. Schulz · Deichweg 9",
        tags: ["Sicherung prüfen", "Fotos für Versicherung"],
      },
    },
    automatisch: [
      "nimmt Schadensmeldungen mit Fotos auf",
      "sortiert Sturmschäden nach Dringlichkeit",
      "schlägt bei Sturm und Regen eine Umplanung vor",
      "erstellt den Schadensbericht für die Versicherung",
      "erinnert an Gerüst, Kran und Container",
      "warnt, bevor eine Unterweisung abläuft",
      "erinnert Kunden an die Wartung von Flachdach und Rinne",
      "bereitet die Rechnung nach der Abnahme vor",
    ],
    kunde: "dach-hansen",
    funktionen: ["anfragen", "einsatzplanung", "qualifikationen", "schulungen", "dokumentation", "fahrzeuge", "zeiterfassung", "automatisch-erledigen"],
    wissen: {
      blog: "Praxistipps für Dachdecker: Wetterplanung, Sturmschäden und Sicherheit auf dem Dach.",
      vorlagen: "Vorlagen für Schadensbericht, Wartungsbericht und Absturzsicherung.",
      werkzeuge: ["stundensatz-rechner", "angebots-rechner", "fahrtkosten-rechner"],
    },
    faq: [
      {
        frage: "Wie hilft Handwerk OS bei Wetter und Sturm?",
        antwort:
          "Außenarbeiten markierst du als wetterabhängig. Ist Regen, Sturm oder Frost gemeldet, schlägt Lotte vor, welche Arbeiten sich vorziehen lassen. Du entscheidest.",
      },
      {
        frage: "Kann ich Schäden für die Versicherung dokumentieren?",
        antwort:
          "Ja. Fotos, Maße und Beschreibung landen am Auftrag. Daraus entsteht ein Schadensbericht, den du an Kunde oder Versicherung schickst.",
      },
      {
        frage: "Behält Handwerk OS die Unterweisungen im Blick?",
        antwort:
          "Ja. Du hinterlegst Unterweisungen und Prüfungen mit Datum. Lotte erinnert rechtzeitig und plant niemanden ein, dessen Nachweis abgelaufen ist.",
      },
      {
        frage: "Was passiert, wenn nach einem Sturm viele Anrufe kommen?",
        antwort:
          "Handwerk OS nimmt Meldungen mit Adresse und Fotos auf und sortiert sie nach Dringlichkeit. So siehst du auf einen Blick, wo zuerst gesichert werden muss.",
      },
    ],
  },

  bau: {
    name: "Maurer & Bau",
    seoTitel: "Software für Maurer und Bauunternehmen",
    beschreibung:
      "Handwerk OS für Maurer und Bauunternehmen: Leistungsverzeichnis, Bautagebuch, Abschlagsrechnungen, Nachträge, Geräte und Kolonnen in einer Software.",
    icon: "warehouse",
    teaser: "Bautagebuch, Abschläge, Nachträge und Geräte – ohne Ordner im Bauwagen.",
    suchbegriffe: [
      "Maurer",
      "Maurer und Betonbauer",
      "Betonbauer",
      "Bauunternehmen",
      "Bauunternehmer",
      "Hochbau",
      "Rohbau",
      "Bauhandwerk",
      "Polier",
    ],
    hero: {
      intro:
        "Leistungsverzeichnis, Bautagebuch, Abschläge und Nachträge: Auf dem Bau entscheidet Papierkram über dein Geld. Handwerk OS sammelt alles auf der Baustelle – und das Büro rechnet ab.",
      betrieb: "Bau Muster",
      tag: [
        { zeit: "06:45", titel: "Rohbau EFH Schmidt", detail: "Kolonne Murat · Decke schalen", farbe: "sky" },
        { zeit: "09:00", titel: "Betonlieferung 12 m³", detail: "Pumpe bestellt · Werk Nord", farbe: "signal" },
        { zeit: "14:00", titel: "Wanddurchbruch Altbau", detail: "Kolonne Piotr · mit Abstützung", farbe: "moss" },
      ],
      hinweis: {
        titel: "Lotte hat gesehen:",
        text: "Das Erdgeschoss bei Schmidt ist fertig. Die zweite Abschlagsrechnung kann raus.",
      },
    },
    ablaeufe: [
      {
        titel: "Rohbau Einfamilienhaus",
        text: "Monate auf einer Baustelle, viele Lieferungen, Abschläge nach Baufortschritt.",
        schritte: ["Leistungsverzeichnis", "Kalkulation", "Angebot", "Baustelle einrichten", "Bautagebuch", "Abschläge", "Abnahme"],
      },
      {
        titel: "Umbau & Sanierung",
        text: "Im Bestand wartet immer eine Überraschung. Nachträge müssen sauber festgehalten werden.",
        schritte: ["Besichtigung", "Angebot", "Abstützen & Durchbruch", "Nachtrag", "Fertigstellung", "Rechnung"],
      },
      {
        titel: "Kleine Bauaufträge",
        text: "Garage, Mauer, Kellertreppe: Kurze Aufträge, die zwischen die großen Baustellen passen müssen.",
        schritte: ["Anfrage", "Angebot", "Termin", "Ausführung", "Rechnung"],
      },
    ],
    probleme: [
      {
        titel: "Bautagebuch am Abend",
        text: "Wetter, Kolonne, Lieferungen, Besonderheiten – abends aus dem Gedächtnis nachgetragen. Oder gar nicht.",
      },
      {
        titel: "Abschläge kommen zu spät",
        text: "Das Geschoss steht, aber die Abschlagsrechnung geht erst Wochen später raus. Du finanzierst die Baustelle vor.",
      },
      {
        titel: "Nachträge ohne Beleg",
        text: "Zusätzliche Arbeiten werden mündlich vereinbart. Beim Abrechnen fehlt der Nachweis.",
      },
      {
        titel: "Geräte und Kran",
        text: "Bagger, Rüttelplatte, Kran: Wo steht was, wann ist die nächste Prüfung fällig?",
      },
      {
        titel: "Lieferungen abstimmen",
        text: "Beton, Steine, Stahl: Kommt die Lieferung zu früh oder zu spät, steht die Kolonne.",
      },
      {
        titel: "Behinderungen nicht gemeldet",
        text: "Pläne fehlen, Vorgewerk nicht fertig. Wer das nicht schriftlich festhält, trägt am Ende den Verzug.",
      },
    ],
    hilfe: [
      { funktion: "kalkulation", text: "Positionen aus dem Leistungsverzeichnis kalkulieren – mit Lohn, Material und Geräten." },
      { funktion: "dokumentation", text: "Bautagebuch vom Handy: Wetter, Kolonne, Fotos, Lieferungen." },
      { funktion: "einsatzplanung", text: "Kolonnen, Geräte und Lieferungen in einem Plan." },
      { funktion: "werkzeuge", text: "Maschinen und Geräte mit Standort und Prüffristen." },
      { funktion: "rechnungen", text: "Abschlagsrechnungen nach Baufortschritt und saubere Schlussrechnung." },
      { funktion: "auswertung", text: "Soll und Ist pro Baustelle – solange du noch gegensteuern kannst." },
    ],
    eingerichtet: {
      begriffe: ["Leistungsverzeichnis", "Bautagebuch", "Abschlag", "Nachtrag", "Behinderungsanzeige", "Kolonne"],
      vorlagen: [
        "Bautagebuch",
        "Abschlagsrechnung",
        "Nachtragsangebot",
        "Behinderungsanzeige",
        "Abnahmeprotokoll",
      ],
      checklisten: [
        "Baustelle einrichten",
        "Betonieren bei Kälte",
        "Abstützung bei Durchbrüchen",
        "Lieferung annehmen und prüfen",
        "Abnahme und Mängelliste",
      ],
      qualifikationen: [
        "Kranführer",
        "Baumaschinenführer",
        "Befähigte Person für Gerüste",
        "Sachkunde Asbest",
        "Ersthelfer",
      ],
    },
    auftragsarten: [
      { titel: "Rohbau", text: "Einfamilienhaus, Mehrfamilienhaus, Gewerbe – mit Abschlägen." },
      { titel: "Umbau & Sanierung", text: "Arbeiten im Bestand, mit Nachträgen und Abstützung." },
      { titel: "Anbau & Aufstockung", text: "Neubau am bewohnten Haus – Abstimmung mit Bauherr und Statiker." },
      { titel: "Betonarbeiten", text: "Fundamente, Decken, Bodenplatten mit Lieferung und Pumpe." },
      { titel: "Kleine Bauaufträge", text: "Mauern, Garagen, Treppen – schnell rein, schnell abgerechnet." },
      { titel: "Arbeiten nach VOB", text: "Öffentliche und gewerbliche Aufträge mit klaren Fristen." },
    ],
    planung: {
      intro: "Mehrere Baustellen, Kolonnen, Geräte und Lieferungen: Handwerk OS zeigt, was wo gebraucht wird.",
      mitarbeiter: "Wer fährt den Kran, wer den Bagger? Lotte plant Kolonnen nach Können und Urlaub.",
      material: "Beton, Steine, Stahl: Lotte erinnert an Bestellungen und bestätigt Liefertermine.",
      termine: "Bauabschnitte nacheinander geplant. Verschiebt sich einer, rutschen die anderen mit.",
      vorschlag: "Decke EG Schmidt Mittwoch betonieren → Pumpe und 12 m³ bestellen, Frost erst ab nächster Woche gemeldet.",
    },
    mobil: {
      intro: "Der Polier füllt das Bautagebuch auf der Baustelle aus – in wenigen Minuten.",
      punkte: [
        "Bautagebuch mit Wetter und Kolonne",
        "Fotos vom Baufortschritt",
        "Lieferscheine fotografieren",
        "Nachtrag sofort aufnehmen",
        "Behinderung melden",
        "Zeiten der Kolonne erfassen",
      ],
      einsatz: {
        zeit: "06:45",
        titel: "Rohbau EFH Schmidt",
        kunde: "Neubaugebiet Am Feld · Haus 4",
        tags: ["Bautagebuch offen", "Beton 9:00"],
      },
    },
    automatisch: [
      "bereitet das Bautagebuch aus Fotos, Zeiten und Wetter vor",
      "erinnert an Abschlagsrechnungen nach Baufortschritt",
      "legt Nachträge an, wenn Mehrarbeit erfasst wird",
      "bestätigt Liefertermine bei Lieferanten",
      "erinnert an Prüffristen für Maschinen und Geräte",
      "warnt bei Frost vor Betonarbeiten",
      "verfolgt offene Abschläge",
    ],
    kunde: "dach-hansen",
    funktionen: ["kalkulation", "angebote", "dokumentation", "einsatzplanung", "werkzeuge", "rechnungen", "auswertung", "automatisch-erledigen"],
    wissen: {
      blog: "Praxistipps für Bauunternehmen: Bautagebuch, Nachträge und Abschläge.",
      vorlagen: "Vorlagen für Bautagebuch, Nachtrag und Behinderungsanzeige.",
      werkzeuge: ["stundenverrechnungssatz-rechner", "deckungsbeitrags-rechner", "angebots-rechner"],
    },
    faq: [
      {
        frage: "Kann ich das Bautagebuch auf der Baustelle führen?",
        antwort:
          "Ja. Der Polier füllt es auf dem Handy aus. Wetter, Kolonne und Fotos kommen schon vorbereitet. Er ergänzt nur, was besonders war.",
      },
      {
        frage: "Wie funktionieren Abschlagsrechnungen?",
        antwort:
          "Du legst im Auftrag fest, nach welchem Baufortschritt abgerechnet wird. Ist ein Abschnitt fertig, bereitet Handwerk OS die Abschlagsrechnung vor.",
      },
      {
        frage: "Kann ich Nachträge festhalten?",
        antwort:
          "Ja. Mehrarbeit wird auf der Baustelle mit Foto und Beschreibung aufgenommen. Daraus machst du ein Nachtragsangebot – bevor die Arbeit vergessen ist.",
      },
      {
        frage: "Verwaltet Handwerk OS auch Geräte und Maschinen?",
        antwort:
          "Ja. Bagger, Rüttelplatte oder Kran bekommen Standort und Prüffristen. Lotte erinnert rechtzeitig und zeigt, wo welches Gerät gerade ist.",
      },
    ],
  },

  galabau: {
    name: "Garten- & Landschaftsbau",
    seoTitel: "Software für Garten- und Landschaftsbau",
    beschreibung:
      "Handwerk OS für GaLaBau-Betriebe: Pflegeverträge, Saisonplanung, Maschinen, Pflanzenlieferungen und Winterdienst mit Nachweis – in einer einfachen Software.",
    icon: "map",
    teaser: "Pflegeverträge, Saison, Maschinen und Winterdienst mit Nachweis.",
    suchbegriffe: [
      "GaLaBau",
      "Garten- und Landschaftsbau",
      "Gartenbau",
      "Landschaftsgärtner",
      "Landschaftsbau",
      "Gärtner",
      "Gartengestaltung",
      "Gartenpflege",
      "Pflasterarbeiten",
    ],
    hero: {
      intro:
        "Im Frühjahr läuft alles gleichzeitig, im Winter klingelt nachts der Wecker für den Winterdienst. Handwerk OS plant Pflegegänge, Kolonnen und Maschinen – über die ganze Saison.",
      betrieb: "Garten Muster",
      tag: [
        { zeit: "07:00", titel: "Neuanlage Garten Krämer", detail: "Kolonne Tim · Minibagger", farbe: "sky" },
        { zeit: "08:00", titel: "Pflegegang Wohnanlage", detail: "Jana, Max · Pflegevertrag", farbe: "moss" },
        { zeit: "15:30", titel: "Pflanzen anliefern", detail: "Baumschule · 40 Stück", farbe: "signal" },
      ],
      hinweis: {
        titel: "Lotte hat gesehen:",
        text: "Der Minibagger muss nach 500 Stunden zur Wartung. Nächste freie Lücke: Freitag.",
      },
    },
    ablaeufe: [
      {
        titel: "Neuanlage",
        text: "Erdarbeiten, Wege, Pflanzen: Alles muss in der richtigen Reihenfolge kommen – und die Pflanzen frisch.",
        schritte: ["Beratung", "Planung & Aufmaß", "Angebot", "Erdarbeiten", "Pflaster & Wege", "Pflanzung", "Abnahme"],
      },
      {
        titel: "Pflegevertrag",
        text: "Rasen, Hecke, Laub: Wiederkehrende Arbeit, die von selbst im Plan stehen sollte.",
        schritte: ["Pflegeplan", "Pflegegang", "Fotos & Nachweis", "Monatsrechnung", "nächster Pflegegang"],
      },
      {
        titel: "Winterdienst",
        text: "Glätte um 4 Uhr morgens. Wer wann wo geräumt hat, musst du später belegen können.",
        schritte: ["Wetterwarnung", "Räumtour", "Uhrzeit & Fotos", "Nachweis", "Abrechnung"],
      },
    ],
    probleme: [
      {
        titel: "Alles passiert im Frühjahr",
        text: "Neuanlagen, Pflegegänge, Pflanzungen – alle Kunden wollen gleichzeitig. Ohne Plan geht das schief.",
      },
      {
        titel: "Pflegeverträge im Kopf",
        text: "Welche Hecke ist im Juni dran, welcher Rasen alle zwei Wochen? Das weiß oft nur der Vorarbeiter.",
      },
      {
        titel: "Maschinen fallen aus",
        text: "Mäher, Minibagger, Rüttelplatte: Fällt die Wartung aus, fällt irgendwann die Maschine aus – mitten in der Saison.",
      },
      {
        titel: "Pflanzen warten nicht",
        text: "Kommen die Pflanzen zu früh, vertrocknen sie. Kommen sie zu spät, steht die Kolonne.",
      },
      {
        titel: "Winterdienst ohne Nachweis",
        text: "Rutscht jemand aus, wird gefragt: Wann wurde geräumt? Ohne Uhrzeit und Foto stehst du schlecht da.",
      },
      {
        titel: "Wetter verschiebt alles",
        text: "Dauerregen, Frost, Hitze: Erdarbeiten und Pflanzungen müssen ständig umgeplant werden.",
      },
    ],
    hilfe: [
      { funktion: "kalender", text: "Pflegegänge nach Vertrag automatisch in den Kalender." },
      { funktion: "einsatzplanung", text: "Kolonnen, Fahrzeuge und Maschinen für die ganze Saison planen." },
      { funktion: "werkzeuge", text: "Maschinen mit Betriebsstunden und Wartung im Blick." },
      { funktion: "einkauf", text: "Pflanzen und Material mit Liefertermin passend zur Pflanzung." },
      { funktion: "dokumentation", text: "Pflegenachweise und Winterdienst-Protokoll mit Uhrzeit und Foto." },
      { funktion: "rechnungen", text: "Monatsrechnung für Pflegeverträge, Schlussrechnung nach der Abnahme." },
    ],
    eingerichtet: {
      begriffe: ["Pflegevertrag", "Pflegegang", "Pflanzliste", "Objekt", "Kolonne", "Winterdienst-Nachweis"],
      vorlagen: [
        "Pflegevertrag",
        "Angebot Neuanlage",
        "Angebot Pflasterarbeiten",
        "Pflanzliste",
        "Winterdienst-Protokoll",
      ],
      checklisten: [
        "Maschinen-Check vor dem Einsatz",
        "Pflanzen bei Anlieferung prüfen",
        "Abnahme Neuanlage",
        "Fertigstellungspflege",
        "Winterdienst-Tour",
      ],
      qualifikationen: [
        "Sachkunde Pflanzenschutz",
        "Motorsägen-Lehrgang",
        "Baumaschinenführer",
        "Führerschein für Anhänger",
        "Seilklettertechnik für Baumpflege",
      ],
    },
    auftragsarten: [
      { titel: "Neuanlage", text: "Planung, Erdarbeiten, Wege und Pflanzung." },
      { titel: "Pflegevertrag", text: "Wiederkehrende Pflegegänge mit Monatsrechnung." },
      { titel: "Pflaster & Wege", text: "Einfahrt, Terrasse, Gartenwege mit Unterbau." },
      { titel: "Baumpflege & Fällung", text: "Mit Geräten, Absperrung und passender Ausbildung." },
      { titel: "Zäune & Mauern", text: "Sichtschutz, Gabionen, Natursteinmauern." },
      { titel: "Winterdienst", text: "Touren nach Wetterwarnung, mit Nachweis pro Objekt." },
    ],
    planung: {
      intro: "Saisonbetrieb heißt: im Frühjahr alles auf einmal. Handwerk OS verteilt die Arbeit, bevor sie dich erschlägt.",
      mitarbeiter: "Wer darf mit der Motorsäge arbeiten, wer Pflanzenschutz ausbringen? Lotte plant nach Nachweis.",
      material: "Pflanzen, Splitt, Pflaster: Lieferungen werden auf den Tag der Pflanzung oder des Einbaus gelegt.",
      termine: "Pflegegänge stehen nach Vertrag im Plan. Bei Regen schlägt Lotte Ausweichtermine vor.",
      vorschlag: "Pflegegänge Nordstadt Dienstag → Jana und Max, 6 Objekte, Anhänger mit Mäher. Rasen Krämer erst nach dem Regen.",
    },
    mobil: {
      intro: "Draußen zählt: Was ist heute dran, und wie halte ich fest, dass es erledigt ist?",
      punkte: [
        "Pflegegang mit Leistungsliste",
        "Fotos als Pflegenachweis",
        "Winterdienst mit Uhrzeit und Standort",
        "Maschinenstunden eintragen",
        "Material und Pflanzen buchen",
        "Abnahme mit Unterschrift",
      ],
      einsatz: {
        zeit: "08:00",
        titel: "Pflegegang Wohnanlage",
        kunde: "Wohnanlage Lindenhof · 3 Höfe",
        tags: ["Pflegevertrag", "Mäher auf dem Anhänger"],
      },
    },
    automatisch: [
      "plant Pflegegänge nach Vertrag ein",
      "schlägt bei Regen Ausweichtermine vor",
      "erstellt Pflegenachweise mit Fotos",
      "stellt die Monatsrechnung für Pflegeverträge",
      "erinnert an Maschinenwartung nach Betriebsstunden",
      "startet Winterdienst-Touren bei Glättewarnung",
      "erinnert Kunden im Frühjahr an die Gartenpflege",
    ],
    kunde: "gruen-werk",
    funktionen: ["kalender", "einsatzplanung", "werkzeuge", "fahrzeuge", "einkauf", "dokumentation", "rechnungen", "automatisch-erledigen"],
    wissen: {
      blog: "Praxistipps für GaLaBau-Betriebe: Saisonplanung, Pflegeverträge und Winterdienst.",
      vorlagen: "Vorlagen für Pflegevertrag, Pflanzliste und Winterdienst-Protokoll.",
      werkzeuge: ["stundensatz-rechner", "fahrtkosten-rechner", "deckungsbeitrags-rechner"],
    },
    faq: [
      {
        frage: "Kann ich Pflegeverträge in Handwerk OS abbilden?",
        antwort:
          "Ja. Du legst Leistungen und Intervalle fest – zum Beispiel Rasen alle zwei Wochen, Hecke zweimal im Jahr. Lotte plant die Pflegegänge ein und stellt die Rechnung.",
      },
      {
        frage: "Wie dokumentiere ich den Winterdienst?",
        antwort:
          "Dein Mitarbeiter hakt jedes Objekt auf dem Handy ab. Uhrzeit, Standort und Foto werden gespeichert. So hast du einen Nachweis, wann wo geräumt wurde.",
      },
      {
        frage: "Behält Handwerk OS die Wartung meiner Maschinen im Blick?",
        antwort:
          "Ja. Du trägst Betriebsstunden oder Wartungsintervalle ein. Lotte erinnert dich rechtzeitig und plant die Wartung in eine ruhige Lücke.",
      },
      {
        frage: "Was passiert, wenn es regnet?",
        antwort:
          "Arbeiten, die vom Wetter abhängen, sind markiert. Bei Regen schlägt Lotte vor, was sich verschieben lässt und was die Kolonne stattdessen machen kann.",
      },
    ],
  },
};

/* ------------------------------------------------------------------ */
/* Gewerk-Cluster                                                      */
/* ------------------------------------------------------------------ */

export const clusterInhalte: Record<GewerkClusterSlug, ClusterInhalt> = {
  "elektro-energie": {
    seoTitel: "Software für Elektro- und Energiebetriebe",
    beschreibung:
      "Handwerk OS für Elektro & Energie: Elektroinstallation, Photovoltaik, Speicher, Wallbox, Informationstechnik und Blitzschutz einfach planen und abrechnen.",
    icon: "bolt",
    teaser: "Elektroinstallation, Photovoltaik, Informationstechnik, Blitzschutz.",
    heroTitel: "Handwerk OS für Elektro & Energie.",
    intro:
      "Ob Photovoltaik auf dem Dach, Netzwerk im Büro oder Blitzschutz am Gewerbebau: Handwerk OS plant Monteure nach Qualifikation, hält Prüfungen im Blick und macht aus dem Einsatzbericht die Rechnung.",
    berufe: [
      "Elektroniker für Gebäudesystemintegration",
      "Informationselektroniker",
      "Systemelektroniker",
      "Elektroanlagenmonteur",
      "Elektromaschinenbauer",
      "Solarteur",
      "Photovoltaik-Installateur",
      "Blitzschutzbauer",
      "Antennenbauer",
      "Fernmeldetechniker",
    ],
    suchbegriffe: ["PV", "Photovoltaik", "Solaranlage", "Stromspeicher", "Netzwerktechnik", "Sicherheitstechnik", "Alarmanlage", "Motorenwickler"],
    arbeitsweisen: [
      { art: "Baustelle", text: "PV-Anlagen, Speicher und Gebäudetechnik werden über mehrere Tage montiert – oft mit Dachdecker und Netzbetreiber." },
      { art: "Kundendienst", text: "Störungen, Wartung von Anlagen und Prüfungen beim Kunden vor Ort." },
      { art: "Werkstatt", text: "Motoren wickeln, Geräte reparieren und prüfen – mit Auftrag, Zeit und Material pro Stück." },
    ],
    einrichtung: [
      { titel: "Anlagen statt nur Kunden", text: "PV-Anlage, Speicher, Netzwerk oder Blitzschutz bekommen eigene Einträge mit Daten und Verlauf." },
      { titel: "Prüfungen mit Frist", text: "Wiederkehrende Prüfungen und Wartungen erinnern sich selbst." },
      { titel: "Netzbetreiber-Schritte", text: "Anmeldung, Zählersetzung und Inbetriebnahme als feste Schritte im Auftrag." },
      { titel: "Qualifikationen", text: "Elektrofachkraft, Arbeiten auf dem Dach, Prüfberechtigungen – Lotte plant passend." },
      { titel: "Protokolle", text: "Inbetriebnahme- und Prüfprotokolle nach deiner Vorlage, direkt vom Handy." },
    ],
    funktionen: ["auftraege", "einsatzplanung", "qualifikationen", "dokumentation", "material", "rechnungen"],
    top: ["elektriker", "dachdecker"],
    verwandt: ["shk-gebaeudetechnik", "dach-gebaeudehuelle"],
    tag: [
      { zeit: "07:30", titel: "PV-Anlage montieren", detail: "Kolonne Ben · 12 Module", farbe: "sky" },
      { zeit: "10:00", titel: "Netzwerk Praxis Dr. Klein", detail: "Leon · 24 Anschlüsse", farbe: "moss" },
      { zeit: "14:00", titel: "Blitzschutz prüfen", detail: "Ali · Lagerhalle Süd", farbe: "signal" },
    ],
    faq: [
      {
        frage: "Passt Handwerk OS auch, wenn wir hauptsächlich Photovoltaik machen?",
        antwort:
          "Ja. Du planst Montage, Elektroanschluss und Netzbetreiber-Termin als Schritte eines Auftrags. Material wie Module, Wechselrichter und Speicher hängt direkt dran.",
      },
      {
        frage: "Können wir Anlagen mit Seriennummern ablegen?",
        antwort:
          "Ja. Jede Anlage bekommt Daten wie Typ, Seriennummer und Einbaudatum. Bei Wartung oder Störung siehst du sofort, was verbaut ist.",
      },
      {
        frage: "Gibt es eine eigene Seite für klassische Elektriker?",
        antwort: "Ja. Für Elektroinstallation, Kundendienst und Prüfungen gibt es die ausführliche Seite für Elektriker.",
      },
    ],
  },

  "shk-gebaeudetechnik": {
    seoTitel: "Software für SHK und Gebäudetechnik",
    beschreibung:
      "Handwerk OS für SHK & Gebäudetechnik: Kälte- und Klimatechnik, Lüftung, Ofenbau und Klempnerei – Wartungen, Notdienst und Protokolle in einer Software.",
    icon: "wrench",
    teaser: "Kälte, Klima, Lüftung, Ofenbau und Klempnerei.",
    heroTitel: "Handwerk OS für SHK & Gebäudetechnik.",
    intro:
      "Kälteanlagen, Lüftung, Kachelöfen oder Bauklempnerei: Bei dir dreht sich vieles um Anlagen, die regelmäßig gewartet werden wollen. Handwerk OS merkt sich jede Anlage, jede Frist und jeden Nachweis.",
    berufe: [
      "Kälteanlagenbauer",
      "Mechatroniker für Kältetechnik",
      "Klimatechniker",
      "Lüftungsbauer",
      "Ofen- und Luftheizungsbauer",
      "Kachelofenbauer",
      "Klempner",
      "Spengler",
      "Behälter- und Apparatebauer",
      "Rohrleitungsbauer",
    ],
    suchbegriffe: ["Klimaanlage", "Kältetechnik", "Lüftung", "Kaminofen", "Kachelofen", "Flaschner", "Blechner"],
    arbeitsweisen: [
      { art: "Kundendienst", text: "Wartung und Störung an Klima-, Kälte- und Lüftungsanlagen – oft mit festen Verträgen und Fristen." },
      { art: "Baustelle", text: "Neue Anlagen, Lüftungskanäle oder Bauklempnerei über mehrere Tage." },
      { art: "Werkstatt", text: "Kanäle, Bleche und Ofenteile werden vorbereitet und gekantet, bevor es zum Kunden geht." },
    ],
    einrichtung: [
      { titel: "Anlagen mit Verlauf", text: "Jede Anlage mit Typ, Kältemittel, Füllmenge und allen Wartungen." },
      { titel: "Wartungsverträge", text: "Intervalle hinterlegen – Lotte schlägt Termine vor und rechnet ab." },
      { titel: "Dichtheitsprüfungen", text: "Prüfintervalle für Kälteanlagen als Frist mit Erinnerung." },
      { titel: "Qualifikationen", text: "Kältemittel-Sachkunde, Löt- und Schweißnachweise, Herstellerschulungen." },
      { titel: "Protokolle", text: "Wartungs-, Dichtheits- und Inbetriebnahmeprotokolle vom Handy." },
    ],
    funktionen: ["kalender", "einsatzplanung", "qualifikationen", "dokumentation", "lager", "rechnungen"],
    top: ["shk", "dachdecker"],
    verwandt: ["elektro-energie", "metall-maschinen"],
    tag: [
      { zeit: "07:30", titel: "Wartung Kühlzelle", detail: "Sven · Metzgerei Brandl", farbe: "moss" },
      { zeit: "10:00", titel: "Störung Klimaanlage", detail: "Can · Arztpraxis", farbe: "signal" },
      { zeit: "13:00", titel: "Lüftungskanal montieren", detail: "Kolonne Rolf · Neubau Schule", farbe: "sky" },
    ],
    faq: [
      {
        frage: "Kann ich Kältemittel und Füllmengen pro Anlage ablegen?",
        antwort:
          "Ja. Zu jeder Anlage speicherst du Kältemittel, Füllmenge und die Prüfungen. So hast du bei jeder Wartung alles parat.",
      },
      {
        frage: "Erinnert Handwerk OS an Dichtheitsprüfungen?",
        antwort:
          "Du legst das Prüfintervall pro Anlage fest. Handwerk OS erinnert rechtzeitig und schlägt einen Termin vor.",
      },
      {
        frage: "Gehören Klempner hierher oder zu den Dachdeckern?",
        antwort:
          "Beides passt. Wer vor allem Sanitär macht, schaut auf die SHK-Seite. Wer Dachrinnen, Bleche und Fassaden macht, findet sich bei Dach & Gebäudehülle wieder.",
      },
    ],
  },

  "maler-boden-oberflaechen": {
    seoTitel: "Software für Maler, Bodenleger und Stuckateure",
    beschreibung:
      "Handwerk OS für Maler, Boden & Oberflächen: Parkett, Bodenbeläge, Estrich, Stuck und Raumausstattung mit Aufmaß, Angebot und Planung in einer Software.",
    icon: "pen",
    teaser: "Parkett, Bodenbeläge, Estrich, Stuck und Raumausstattung.",
    heroTitel: "Handwerk OS für Maler, Boden & Oberflächen.",
    intro:
      "Du arbeitest mit Flächen: Wände, Böden, Decken. Handwerk OS macht aus dem Aufmaß ein Angebot, plant nach Trocknungszeiten und hält jede Fläche mit Fotos fest.",
    berufe: [
      "Parkettleger",
      "Bodenleger",
      "Estrichleger",
      "Stuckateur",
      "Raumausstatter",
      "Betonsanierer",
      "Bodenbeschichter",
      "Vergolder",
      "Gipser",
    ],
    suchbegriffe: ["Parkett", "Laminat", "Vinylboden", "Teppichboden", "Estrich", "Putz", "Verputzer"],
    arbeitsweisen: [
      { art: "Baustelle", text: "Flächen werden vor Ort verlegt, gespachtelt oder beschichtet – oft nach anderen Gewerken." },
      { art: "Kundendienst", text: "Parkett schleifen, Schäden ausbessern, kleine Flächen schnell erledigen." },
      { art: "Werkstatt", text: "Raumausstatter nähen Vorhänge und beziehen Polster in der eigenen Werkstatt." },
    ],
    einrichtung: [
      { titel: "Aufmaß in m²", text: "Räume, Flächen und Abzüge erfassen – mit Verschnitt je Material." },
      { titel: "Trocknungszeiten", text: "Estrich, Spachtel, Beschichtung: Wartezeiten stehen im Plan, damit niemand zu früh kommt." },
      { titel: "Belegreife prüfen", text: "Checkliste mit Messwert und Foto, bevor der Boden kommt." },
      { titel: "Material pro Raum", text: "Belag, Farbton, Kleber und Sockelleisten bleiben am Raum gespeichert." },
      { titel: "Fotos für die Abnahme", text: "Vorher und nachher, pro Raum – für Kunden und Hausverwaltungen." },
    ],
    funktionen: ["aufmass", "kalkulation", "angebote", "einsatzplanung", "dokumentation", "material"],
    top: ["maler", "fliesenleger", "tischler"],
    verwandt: ["holz-innenausbau", "bau-rohbau"],
    tag: [
      { zeit: "07:30", titel: "Parkett schleifen & ölen", detail: "Dirk · Altbau Hauptstr.", farbe: "sky" },
      { zeit: "09:00", titel: "Estrich: Belegreife messen", detail: "Chef · Neubau Wagner", farbe: "moss" },
      { zeit: "13:00", titel: "Vinylboden Praxis", detail: "Kolonne Sami · 140 m²", farbe: "signal" },
    ],
    faq: [
      {
        frage: "Berücksichtigt die Planung Trocknungszeiten?",
        antwort:
          "Ja. Du hinterlegst Wartezeiten als eigenen Schritt. Handwerk OS plant den nächsten Arbeitsgang erst danach ein und warnt, wenn sich etwas überschneidet.",
      },
      {
        frage: "Kann ich das Material pro Raum speichern?",
        antwort: "Ja. Belag, Farbton, Kleber und Leisten stehen am Raum. Beim nächsten Auftrag weißt du sofort, was verbaut ist.",
      },
      {
        frage: "Gibt es eine eigene Seite für Maler?",
        antwort: "Ja. Für Maler und Lackierer gibt es eine ausführliche Seite mit Aufmaß, Fassade und Wetterplanung.",
      },
    ],
  },

  "holz-innenausbau": {
    seoTitel: "Software für Zimmerer, Holzbau und Innenausbau",
    beschreibung:
      "Handwerk OS für Holz & Innenausbau: Zimmerei, Holzbau, Trockenbau, Treppenbau und Innenausbau – Werkstatt, Abbund und Montage in einem Plan.",
    icon: "ruler",
    teaser: "Zimmerei, Holzbau, Trockenbau, Treppen und Innenausbau.",
    heroTitel: "Handwerk OS für Holz & Innenausbau.",
    intro:
      "Abbund in der Halle, Richtfest auf der Baustelle, Trockenbau im dritten Stock: Handwerk OS bringt Werkstatt und Montage in einen Plan und zeigt dir, was jeder Auftrag gebracht hat.",
    berufe: [
      "Zimmerer",
      "Holzbauer",
      "Trockenbauer",
      "Treppenbauer",
      "Innenausbauer",
      "Drechsler",
      "Holzbildhauer",
      "Fertighausmonteur",
      "Akustikbauer",
      "Ladenbauer",
    ],
    suchbegriffe: ["Zimmerei", "Holzbau", "Dachstuhl", "Carport", "Trockenbau", "Messebau", "Holzhaus"],
    arbeitsweisen: [
      { art: "Fertigung", text: "Abbund, Wandelemente und Treppen entstehen in der Halle – mit Maschinen, die geplant werden müssen." },
      { art: "Baustelle", text: "Dachstuhl richten, Trockenbau stellen, Innenausbau montieren – oft mit Kran und mehreren Kolonnen." },
      { art: "Werkstatt", text: "Einzelstücke und Reparaturen mit Zeiten und Material pro Auftrag." },
    ],
    einrichtung: [
      { titel: "Werkstatt und Montage", text: "Fertigung und Montage als Schritte eines Auftrags – in einem Plan." },
      { titel: "Maschinen planen", text: "Abbundanlage, CNC oder Plattensäge werden wie Mitarbeiter eingeplant." },
      { titel: "Kran und Lieferung", text: "Richttage mit Kran, Holzlieferung und Wetter zusammen planen." },
      { titel: "Qualifikationen", text: "Kranführer, Anschläger, Gabelstapler, Arbeiten in der Höhe." },
      { titel: "Nachkalkulation", text: "Zeiten pro Arbeitsschritt – damit die nächste Kalkulation stimmt." },
    ],
    funktionen: ["kalkulation", "einsatzplanung", "zeiterfassung", "werkzeuge", "einkauf", "auswertung"],
    top: ["tischler", "dachdecker", "bau"],
    verwandt: ["maler-boden-oberflaechen", "dach-gebaeudehuelle"],
    tag: [
      { zeit: "06:30", titel: "Abbund Dachstuhl Meyer", detail: "Halle · Abbundanlage", farbe: "sky" },
      { zeit: "07:00", titel: "Trockenbau Büroetage", detail: "Kolonne Emre · 3. OG", farbe: "moss" },
      { zeit: "12:00", titel: "Kran für Richttag bestätigen", detail: "Freitag · 7:00 Uhr", farbe: "signal" },
    ],
    faq: [
      {
        frage: "Kann ich Abbund und Montage gemeinsam planen?",
        antwort:
          "Ja. Fertigung in der Halle und Montage auf der Baustelle sind Schritte eines Auftrags. Du siehst sofort, ob Maschine, Kolonne und Kran zusammenpassen.",
      },
      {
        frage: "Ist Handwerk OS ein Abbundprogramm?",
        antwort:
          "Nein. Planung und Abbunddaten machst du weiter mit deinem Fachprogramm. Pläne und Listen hängst du an den Auftrag, damit jeder sie dabeihat.",
      },
      {
        frage: "Passt Handwerk OS auch für reinen Trockenbau?",
        antwort: "Ja. Aufmaß, Angebot, Kolonnen und Abschläge sind genau das, was Trockenbauer jeden Tag brauchen.",
      },
    ],
  },

  "dach-gebaeudehuelle": {
    seoTitel: "Software für Dach, Fassade und Gebäudehülle",
    beschreibung:
      "Handwerk OS für Dach & Gebäudehülle: Bauklempnerei, Fassadenbau, Abdichtung, Dämmung und Gerüstbau – nach Wetter geplant, mit Fotos dokumentiert.",
    icon: "home",
    teaser: "Bauklempnerei, Fassade, Abdichtung, Dämmung und Gerüstbau.",
    heroTitel: "Handwerk OS für Dach & Gebäudehülle.",
    intro:
      "Fassade, Abdichtung, Gerüst oder Bauklempnerei: Du arbeitest draußen, in der Höhe und nach dem Wetter. Handwerk OS plant entsprechend und hält jede Unterweisung im Blick.",
    berufe: [
      "Bauklempner",
      "Fassadenbauer",
      "Gerüstbauer",
      "Abdichter",
      "Isolierer",
      "Wärme-, Kälte- und Schallschutzisolierer",
      "Holz- und Bautenschützer",
      "Bautenschutz",
    ],
    suchbegriffe: ["Fassade", "Gerüst", "Abdichtung", "Dämmung", "Dachrinne", "Blechdach", "Bauwerksabdichtung"],
    arbeitsweisen: [
      { art: "Baustelle", text: "Fassaden, Gerüste und Abdichtungen über mehrere Tage oder Wochen – stark vom Wetter abhängig." },
      { art: "Kundendienst", text: "Reparaturen an Rinnen, Blechen und Abdichtungen, oft nach Unwetter." },
      { art: "Werkstatt", text: "Bleche kanten, Teile vorbereiten, Material für die Baustelle zusammenstellen." },
    ],
    einrichtung: [
      { titel: "Wetter im Plan", text: "Außenarbeiten sind markiert. Bei Regen oder Sturm kommt ein Vorschlag zum Umplanen." },
      { titel: "Absturzsicherung", text: "Checkliste vor Arbeitsbeginn und Unterweisungen mit Ablaufdatum." },
      { titel: "Gerüst als eigener Schritt", text: "Aufbau, Freigabe, Standzeit und Abbau – mit Abrechnung der Standzeit." },
      { titel: "Fotos für Nachweise", text: "Abdichtung und Anschlüsse fotografieren, bevor sie verdeckt sind." },
      { titel: "Werkstatt", text: "Kantteile und Zuschnitte als Werkstattauftrag mit Zeit und Material." },
    ],
    funktionen: ["einsatzplanung", "qualifikationen", "schulungen", "dokumentation", "fahrzeuge", "rechnungen"],
    top: ["dachdecker", "maler", "bau"],
    verwandt: ["holz-innenausbau", "glas-fenster-sonnenschutz"],
    tag: [
      { zeit: "07:00", titel: "Gerüst aufbauen", detail: "Kolonne Dennis · MFH Gartenweg", farbe: "sky" },
      { zeit: "09:00", titel: "Rinne erneuern", detail: "Jonas · Fam. Albers", farbe: "signal" },
      { zeit: "13:00", titel: "Kantteile Attika", detail: "Werkstatt · 18 Stück", farbe: "moss" },
    ],
    faq: [
      {
        frage: "Kann ich Gerüst-Standzeiten abrechnen?",
        antwort:
          "Ja. Aufbau, Standzeit und Abbau sind eigene Schritte. Handwerk OS zählt die Standzeit mit und bereitet die Rechnung vor.",
      },
      {
        frage: "Wie hilft Handwerk OS bei der Sicherheit in der Höhe?",
        antwort:
          "Unterweisungen und Prüfungen bekommen ein Ablaufdatum. Lotte erinnert rechtzeitig und plant niemanden für Arbeiten in der Höhe ein, dessen Nachweis abgelaufen ist.",
      },
      {
        frage: "Gibt es eine eigene Seite für Dachdecker?",
        antwort: "Ja. Für Dachdeckerbetriebe gibt es eine ausführliche Seite mit Wetterplanung, Sturmschäden und Absturzsicherung.",
      },
    ],
  },

  "bau-rohbau": {
    seoTitel: "Software für Bau, Rohbau und Tiefbau",
    beschreibung:
      "Handwerk OS für Bau & Rohbau: Tiefbau, Straßenbau, Brunnenbau, Betonbau und Steinmetz – Bautagebuch, Geräte, Kolonnen und Abschläge in einer Software.",
    icon: "warehouse",
    teaser: "Tiefbau, Straßenbau, Brunnenbau, Betonbau und Steinmetz.",
    heroTitel: "Handwerk OS für Bau & Rohbau.",
    intro:
      "Bagger, Kolonnen, Lieferungen und Bautagebuch: Auf dem Bau hängt viel an Geräten und Nachweisen. Handwerk OS plant beides und sorgt dafür, dass Abschläge rechtzeitig rausgehen.",
    berufe: [
      "Straßenbauer",
      "Tiefbauer",
      "Kanalbauer",
      "Brunnenbauer",
      "Beton- und Stahlbetonbauer",
      "Steinmetz",
      "Steinmetz und Steinbildhauer",
      "Pflasterer",
      "Abbruchunternehmer",
      "Spezialtiefbauer",
    ],
    suchbegriffe: ["Tiefbau", "Erdarbeiten", "Kanalbau", "Brunnen", "Bohrung", "Abbruch", "Grabmal", "Naturstein"],
    arbeitsweisen: [
      { art: "Baustelle", text: "Lange Baustellen mit Kolonnen, schweren Geräten und Lieferungen – oft mit Bautagebuch und Abschlägen." },
      { art: "Werkstatt", text: "Steinmetze fertigen Grabmale, Treppen und Fensterbänke in der eigenen Werkstatt." },
      { art: "Kundendienst", text: "Brunnen warten, Pumpen tauschen, kleine Reparaturen am Bestand." },
    ],
    einrichtung: [
      { titel: "Bautagebuch", text: "Wetter, Kolonne, Geräte, Lieferungen und Fotos – vom Handy ausgefüllt." },
      { titel: "Geräte mit Prüffristen", text: "Bagger, Walzen, Bohrgeräte mit Standort, Betriebsstunden und Prüfungen." },
      { titel: "Abschläge und Nachträge", text: "Nach Baufortschritt abrechnen, Mehrarbeit sofort festhalten." },
      { titel: "Qualifikationen", text: "Baumaschinenführer, Kran, Arbeiten im Graben, Sachkunde Asbest." },
      { titel: "Werkstattaufträge", text: "Für Steinmetze: Fertigung mit Stein, Maß und Inschrift als eigener Schritt." },
    ],
    funktionen: ["kalkulation", "dokumentation", "einsatzplanung", "werkzeuge", "fahrzeuge", "rechnungen"],
    top: ["bau", "galabau"],
    verwandt: ["dach-gebaeudehuelle", "garten-aussenanlagen"],
    tag: [
      { zeit: "06:45", titel: "Kanalanschluss Neubau", detail: "Kolonne Hakan · Bagger 8 t", farbe: "sky" },
      { zeit: "09:00", titel: "Brunnenpumpe tauschen", detail: "Uwe · Hof Wiesner", farbe: "signal" },
      { zeit: "13:00", titel: "Grabmal fertigen", detail: "Werkstatt · Inschrift prüfen", farbe: "moss" },
    ],
    faq: [
      {
        frage: "Kann ich schwere Geräte mit einplanen?",
        antwort:
          "Ja. Bagger, Walzen oder Bohrgeräte planst du wie Mitarbeiter ein. Lotte zeigt, wo jedes Gerät steht und wann die nächste Prüfung fällig ist.",
      },
      {
        frage: "Passt Handwerk OS auch für Steinmetze?",
        antwort:
          "Ja. Werkstattfertigung und Versetzen beim Kunden sind Schritte eines Auftrags. Maße, Stein und Inschrift stehen am Auftrag, Fotos zur Freigabe auch.",
      },
      {
        frage: "Gibt es eine eigene Seite für Maurer und Bauunternehmen?",
        antwort: "Ja. Für Hochbau, Rohbau und Sanierung gibt es eine ausführliche Seite mit Bautagebuch, Abschlägen und Nachträgen.",
      },
    ],
  },

  "metall-maschinen": {
    seoTitel: "Software für Metallbau und Maschinenbau-Betriebe",
    beschreibung:
      "Handwerk OS für Metall & Maschinen: Metallbauer, Schlosser, Feinwerkmechaniker und Schmiede – Fertigung, Montage und Wartung in einer Software.",
    icon: "wrench",
    teaser: "Metallbau, Schlosserei, Feinwerkmechanik und Schmiede.",
    heroTitel: "Handwerk OS für Metall & Maschinen.",
    intro:
      "Geländer in der Werkstatt schweißen, Tor beim Kunden montieren, Wartung an der Maschine: Handwerk OS plant Fertigung und Montage zusammen und behält Schweißnachweise und Wartungsfristen im Blick.",
    berufe: [
      "Metallbauer",
      "Schlosser",
      "Bauschlosser",
      "Feinwerkmechaniker",
      "Stahlbauer",
      "Schweißer",
      "Schmied",
      "Metallbildner",
      "Werkzeugmacher",
      "Galvaniseur",
    ],
    suchbegriffe: ["Metallbau", "Schlosserei", "Stahlbau", "Treppengeländer", "Tore", "Dreherei", "Fräserei", "Schweißen"],
    arbeitsweisen: [
      { art: "Fertigung", text: "Treppen, Geländer, Tore und Bauteile entstehen in der Werkstatt – mit Maschinen und Schweißplätzen." },
      { art: "Baustelle", text: "Montage beim Kunden, oft mit Kran oder Hebebühne." },
      { art: "Kundendienst", text: "Wartung von Toren, Türen und Maschinen, Reparaturen vor Ort." },
    ],
    einrichtung: [
      { titel: "Werkstattauftrag", text: "Zuschnitt, Schweißen, Oberfläche und Montage als Schritte mit Zeiten." },
      { titel: "Maschinen planen", text: "Laser, Abkantbank oder Schweißplatz werden eingeplant wie Mitarbeiter." },
      { titel: "Wartung von Toren", text: "Wiederkehrende Prüfungen von Toren und Türen mit Frist und Protokoll." },
      { titel: "Qualifikationen", text: "Schweißerprüfungen mit Ablaufdatum, Kran, Hebebühne, Gabelstapler." },
      { titel: "Nachkalkulation", text: "Werkstatt- und Montagezeit pro Auftrag gegen das Angebot." },
    ],
    funktionen: ["kalkulation", "einsatzplanung", "zeiterfassung", "qualifikationen", "werkzeuge", "auswertung"],
    top: ["tischler", "bau"],
    verwandt: ["fahrzeug-werkstatt", "glas-fenster-sonnenschutz"],
    tag: [
      { zeit: "07:00", titel: "Geländer schweißen", detail: "Werkstatt · Schweißplatz 2", farbe: "sky" },
      { zeit: "10:30", titel: "Tor-Wartung", detail: "Kai · Spedition Lange", farbe: "moss" },
      { zeit: "13:00", titel: "Treppe montieren", detail: "Mehmet, Olaf · Hebebühne", farbe: "signal" },
    ],
    faq: [
      {
        frage: "Behält Handwerk OS Schweißerprüfungen im Blick?",
        antwort:
          "Ja. Du hinterlegst Prüfungen mit Ablaufdatum. Lotte erinnert rechtzeitig und plant nur Mitarbeiter mit gültigem Nachweis für die Arbeit ein.",
      },
      {
        frage: "Kann ich Tor- und Türwartungen planen?",
        antwort: "Ja. Jedes Tor bekommt ein Prüfintervall. Handwerk OS schlägt Termine vor und erstellt das Protokoll vom Handy.",
      },
      {
        frage: "Ist Handwerk OS eine Fertigungssteuerung für die Industrie?",
        antwort:
          "Nein. Handwerk OS ist für Handwerksbetriebe gemacht: Aufträge, Werkstatt, Montage, Mitarbeiter und Rechnungen – einfach und ohne Industrie-Ballast.",
      },
    ],
  },

  "fahrzeug-werkstatt": {
    seoTitel: "Software für Kfz-Werkstätten und Fahrzeugbau",
    beschreibung:
      "Handwerk OS für Fahrzeug & Werkstatt: Kfz-Mechatroniker, Karosseriebauer, Zweirad- und Landmaschinenwerkstätten – Termine, Hebebühnen und Rechnungen einfach geplant.",
    icon: "truck",
    teaser: "Kfz, Karosserie, Zweirad und Landmaschinen.",
    heroTitel: "Handwerk OS für Fahrzeug & Werkstatt.",
    intro:
      "Hebebühnen, Ersatzteile und Kunden, die ihr Auto heute Abend zurückwollen: Handwerk OS plant deine Werkstatt, sagt dem Kunden Bescheid und macht aus dem Auftrag die Rechnung.",
    berufe: [
      "Kfz-Mechatroniker",
      "Karosserie- und Fahrzeugbauer",
      "Karosseriebauer",
      "Fahrzeuglackierer",
      "Zweiradmechatroniker",
      "Land- und Baumaschinenmechatroniker",
      "Mechaniker für Reifen- und Vulkanisationstechnik",
      "Kfz-Elektriker",
      "Fahrzeuginnenausstatter",
    ],
    suchbegriffe: ["Kfz", "Autowerkstatt", "Werkstatt", "Mechaniker", "Automechaniker", "Fahrradwerkstatt", "Motorrad", "Landmaschinen", "Reifenservice"],
    arbeitsweisen: [
      { art: "Werkstatt", text: "Fahrzeuge kommen zu dir. Hebebühnen, Prüfplätze und Mechaniker müssen zusammenpassen." },
      { art: "Kundendienst", text: "Pannenhilfe, Landmaschinen auf dem Hof, mobiler Reifenservice." },
      { art: "Laden", text: "Teileverkauf und Annahme am Tresen – mit Termin und Rückfragen." },
    ],
    einrichtung: [
      { titel: "Fahrzeuge statt Anlagen", text: "Kennzeichen, Fahrgestellnummer, Kilometerstand und alle bisherigen Aufträge." },
      { titel: "Hebebühnen planen", text: "Bühnen und Prüfplätze werden eingeplant wie Mitarbeiter." },
      { titel: "Terminbuchung", text: "Kunden buchen Inspektion oder Reifenwechsel selbst in freie Zeiten." },
      { titel: "Teile bestellen", text: "Fehlende Teile werden vor dem Termin gemeldet." },
      { titel: "Kunden informieren", text: "„Dein Auto ist fertig“ – automatisch, wenn der Auftrag abgeschlossen ist." },
    ],
    funktionen: ["kalender", "einsatzplanung", "kunden", "lager", "einkauf", "rechnungen"],
    top: [],
    verwandt: ["metall-maschinen", "maler-boden-oberflaechen"],
    tag: [
      { zeit: "08:00", titel: "Inspektion Kombi", detail: "Bühne 1 · Marvin", farbe: "sky" },
      { zeit: "09:30", titel: "Reifenwechsel 4×", detail: "Bühne 3 · Azubi Lea", farbe: "moss" },
      { zeit: "11:00", titel: "Traktor Hof Schröder", detail: "Jens · vor Ort", farbe: "signal" },
    ],
    faq: [
      {
        frage: "Ersetzt Handwerk OS mein Diagnosegerät oder meinen Teilekatalog?",
        antwort:
          "Nein. Diagnose und Teilesuche machst du weiter mit deinen Fachprogrammen. Handwerk OS kümmert sich um Termine, Werkstattplanung, Mitarbeiter und Rechnungen.",
      },
      {
        frage: "Können Kunden selbst Termine buchen?",
        antwort: "Ja. Du gibst Zeiten für Inspektion oder Reifenwechsel frei. Kunden buchen online, Lotte plant Bühne und Mechaniker ein.",
      },
      {
        frage: "Passt Handwerk OS auch für Landmaschinen-Werkstätten?",
        antwort: "Ja. Werkstatt und Einsätze auf dem Hof stehen in einem Plan – mit Fahrzeug, Teilen und Zeiten pro Auftrag.",
      },
    ],
  },

  "garten-aussenanlagen": {
    seoTitel: "Software für Garten und Außenanlagen",
    beschreibung:
      "Handwerk OS für Garten & Außenanlagen: Baumpflege, Zaunbau, Pool- und Teichbau, Friedhofsgärtner und Winterdienst – Saison, Maschinen und Pflege in einem Plan.",
    icon: "map",
    teaser: "Baumpflege, Zaunbau, Teich- und Poolbau, Winterdienst.",
    heroTitel: "Handwerk OS für Garten & Außenanlagen.",
    intro:
      "Baumpflege, Zaunbau, Pool oder Grabpflege: Du arbeitest draußen und nach der Saison. Handwerk OS plant wiederkehrende Pflege, Maschinen und Wetter – und hält Nachweise fest.",
    berufe: [
      "Baumpfleger",
      "Zaunbauer",
      "Poolbauer",
      "Teichbauer",
      "Friedhofsgärtner",
      "Gärtner",
      "Spielplatzbauer",
      "Winterdienst",
    ],
    suchbegriffe: ["Baumfällung", "Baumschnitt", "Zaun", "Pool", "Teich", "Grabpflege", "Rasenpflege", "Heckenschnitt", "Schneeräumen"],
    arbeitsweisen: [
      { art: "Kundendienst", text: "Wiederkehrende Pflege bei vielen Kunden: Rasen, Hecken, Gräber, Pools." },
      { art: "Baustelle", text: "Zäune, Teiche, Pools und Spielplätze über mehrere Tage gebaut." },
    ],
    einrichtung: [
      { titel: "Pflegeverträge", text: "Leistungen und Intervalle hinterlegen – Lotte plant und rechnet ab." },
      { titel: "Saisonplanung", text: "Frühjahr, Sommer, Herbst, Winter: Arbeiten nach Saison und Wetter." },
      { titel: "Maschinen", text: "Häcksler, Hubsteiger, Mäher mit Betriebsstunden und Wartung." },
      { titel: "Qualifikationen", text: "Motorsäge, Seilklettertechnik, Pflanzenschutz, Hubarbeitsbühne." },
      { titel: "Nachweise", text: "Fotos und Uhrzeit für Pflege und Winterdienst." },
    ],
    funktionen: ["kalender", "einsatzplanung", "werkzeuge", "qualifikationen", "dokumentation", "rechnungen"],
    top: ["galabau"],
    verwandt: ["gebaeude-service", "bau-rohbau"],
    tag: [
      { zeit: "07:30", titel: "Baum fällen", detail: "Kolonne Rico · Hubsteiger", farbe: "signal" },
      { zeit: "09:00", titel: "Grabpflege Friedhof Ost", detail: "Anke · 14 Gräber", farbe: "moss" },
      { zeit: "13:00", titel: "Zaun setzen", detail: "Leo, Finn · 32 m Doppelstab", farbe: "sky" },
    ],
    faq: [
      {
        frage: "Kann ich Grabpflege und andere wiederkehrende Pflege abbilden?",
        antwort: "Ja. Jede Pflege bekommt Leistungen und Intervalle. Lotte plant die Termine ein, sammelt Fotos und stellt die Rechnung.",
      },
      {
        frage: "Wie plane ich Arbeiten, die vom Wetter abhängen?",
        antwort: "Du markierst sie als wetterabhängig. Bei Regen, Sturm oder Frost schlägt Handwerk OS vor, was verschoben werden kann.",
      },
      {
        frage: "Gibt es eine eigene Seite für Garten- und Landschaftsbau?",
        antwort: "Ja. Für GaLaBau-Betriebe gibt es eine ausführliche Seite mit Pflegeverträgen, Neuanlagen und Winterdienst.",
      },
    ],
  },

  "gebaeude-service": {
    seoTitel: "Software für Gebäudereinigung und Gebäudeservice",
    beschreibung:
      "Handwerk OS für Gebäude & Service: Gebäudereiniger, Hausmeisterdienste, Schornsteinfeger und Schädlingsbekämpfer – wiederkehrende Einsätze, Nachweise und Rechnungen.",
    icon: "shield",
    teaser: "Gebäudereinigung, Hausmeisterdienst, Schornsteinfeger.",
    heroTitel: "Handwerk OS für Gebäude & Service.",
    intro:
      "Viele Objekte, feste Intervalle, Nachweise für jeden Einsatz: Handwerk OS plant wiederkehrende Arbeit, verteilt sie auf dein Team und schreibt am Monatsende die Rechnung.",
    berufe: [
      "Gebäudereiniger",
      "Glas- und Fassadenreiniger",
      "Hausmeisterdienst",
      "Schornsteinfeger",
      "Schädlingsbekämpfer",
      "Desinfektor",
      "Rohr- und Kanalreiniger",
    ],
    suchbegriffe: ["Reinigung", "Gebäudereinigung", "Unterhaltsreinigung", "Fensterputzer", "Hausmeister", "Kaminkehrer", "Rohrreinigung", "Kammerjäger"],
    arbeitsweisen: [
      { art: "Kundendienst", text: "Feste Touren bei vielen Objekten – täglich, wöchentlich oder nach Frist." },
      { art: "Baustelle", text: "Bauendreinigung, Sonderreinigung oder Sanierung als einmaliger Auftrag." },
    ],
    einrichtung: [
      { titel: "Objekte und Leistungen", text: "Jedes Objekt mit Räumen, Leistungen und Intervallen." },
      { titel: "Touren planen", text: "Wiederkehrende Einsätze nach Region, Zeitfenster und Schlüsseln." },
      { titel: "Nachweise", text: "Abhaken mit Uhrzeit, Fotos bei Mängeln – für Kunden und Verwaltung." },
      { titel: "Fristen", text: "Für Schornsteinfeger und Schädlingsbekämpfer: Termine nach Frist, automatisch vorgeschlagen." },
      { titel: "Monatsrechnung", text: "Feste Pauschalen und Zusatzleistungen auf einer Rechnung." },
    ],
    funktionen: ["kalender", "einsatzplanung", "mitarbeiter", "zeiterfassung", "dokumentation", "rechnungen"],
    top: ["galabau", "shk"],
    verwandt: ["garten-aussenanlagen", "glas-fenster-sonnenschutz"],
    tag: [
      { zeit: "06:00", titel: "Unterhaltsreinigung Büro", detail: "Team Nadia · 3 Etagen", farbe: "moss" },
      { zeit: "09:00", titel: "Feuerstättenschau", detail: "Bezirk Nord · 6 Termine", farbe: "sky" },
      { zeit: "14:00", titel: "Glasreinigung Autohaus", detail: "Pavel · Hubsteiger", farbe: "signal" },
    ],
    faq: [
      {
        frage: "Kann ich viele Objekte mit festen Intervallen planen?",
        antwort:
          "Ja. Jedes Objekt bekommt Leistungen und Intervalle. Handwerk OS plant daraus Touren und verteilt sie auf dein Team – mit Blick auf Urlaub und Krankheit.",
      },
      {
        frage: "Wie weise ich nach, dass gereinigt wurde?",
        antwort: "Dein Team hakt Leistungen auf dem Handy ab. Uhrzeit und Fotos werden gespeichert und können dem Kunden geschickt werden.",
      },
      {
        frage: "Passt Handwerk OS für Schornsteinfeger?",
        antwort:
          "Für Terminplanung, Touren, Mitarbeiter und Rechnungen ja. Kehrbuch und Bescheide nach den gesetzlichen Vorgaben führst du weiter mit deinem Fachprogramm.",
      },
    ],
  },

  "glas-fenster-sonnenschutz": {
    seoTitel: "Software für Glaser, Fensterbauer und Rollladenbauer",
    beschreibung:
      "Handwerk OS für Glas, Fenster & Sonnenschutz: Glaser, Fensterbauer, Rollladen- und Sonnenschutzmechatroniker – Aufmaß, Bestellung mit Lieferzeit und Montage.",
    icon: "monitor",
    teaser: "Glaserei, Fensterbau, Rollladen und Sonnenschutz.",
    heroTitel: "Handwerk OS für Glas, Fenster & Sonnenschutz.",
    intro:
      "Aufmaß, Bestellung beim Hersteller, Wochen Lieferzeit, dann Montage an einem Tag: Handwerk OS verbindet die Schritte, damit der Montagetermin hält – und der Notdienst bei Glasbruch trotzdem reinpasst.",
    berufe: [
      "Glaser",
      "Fensterbauer",
      "Rollladen- und Sonnenschutzmechatroniker",
      "Rollladenbauer",
      "Markisenmonteur",
      "Glasveredler",
      "Wintergartenbauer",
    ],
    suchbegriffe: ["Glaserei", "Fenster", "Rollladen", "Rolladen", "Jalousie", "Markise", "Glasbruch", "Duschwand", "Wintergarten", "Raffstore", "Insektenschutz"],
    arbeitsweisen: [
      { art: "Baustelle", text: "Fenster, Rollläden und Markisen werden nach Aufmaß bestellt und montiert." },
      { art: "Kundendienst", text: "Glasbruch-Notdienst, Reparaturen an Rollläden und Motoren, Wartung von Markisen." },
      { art: "Werkstatt", text: "Glas zuschneiden, Spiegel und Duschwände vorbereiten." },
    ],
    einrichtung: [
      { titel: "Aufmaß pro Öffnung", text: "Breite, Höhe, Anschlag und Fotos für jedes Fenster und jede Öffnung." },
      { titel: "Bestellung mit Lieferzeit", text: "Lotte plant die Montage erst, wenn der Liefertermin steht." },
      { titel: "Notdienst Glasbruch", text: "Anruf aufnehmen, Notverglasung einplanen, endgültige Scheibe bestellen." },
      { titel: "Wartung", text: "Wiederkehrende Wartung für Markisen und Antriebe." },
      { titel: "Montageprotokoll", text: "Abnahme, Einweisung und Fotos vom Handy." },
    ],
    funktionen: ["aufmass", "angebote", "einkauf", "einsatzplanung", "telefon", "dokumentation"],
    top: ["tischler", "elektriker"],
    verwandt: ["holz-innenausbau", "metall-maschinen"],
    tag: [
      { zeit: "07:30", titel: "Fenstertausch 6 Stück", detail: "Kolonne Stefan · Fam. Roth", farbe: "sky" },
      { zeit: "10:00", titel: "Glasbruch Schaufenster", detail: "Notverglasung · Bäckerei", farbe: "signal" },
      { zeit: "14:00", titel: "Markise warten", detail: "Ina · Café am Markt", farbe: "moss" },
    ],
    faq: [
      {
        frage: "Kann ich Aufmaße für viele Fenster erfassen?",
        antwort: "Ja. Jede Öffnung bekommt Maße, Fotos und Besonderheiten. Daraus wird das Angebot und später die Bestellung.",
      },
      {
        frage: "Wie passt der Notdienst bei Glasbruch in den Plan?",
        antwort:
          "Notfälle werden aufgenommen und an den nächsten freien Monteur gegeben. Die endgültige Scheibe wird direkt als Folgeauftrag mit Bestellung angelegt.",
      },
      {
        frage: "Hilft Handwerk OS bei langen Lieferzeiten?",
        antwort: "Ja. Der Liefertermin steht am Auftrag. Verschiebt er sich, siehst du sofort, welcher Montagetermin betroffen ist.",
      },
    ],
  },

  "friseur-dienstleistungen": {
    seoTitel: "Software für Friseure und persönliche Dienstleistungen",
    beschreibung:
      "Handwerk OS für Friseure, Kosmetiker und persönliche Dienstleistungen: Terminbuchung, Dienstplan, Schulungen und Material – einfach und ohne Papierkalender.",
    icon: "user",
    teaser: "Friseur, Kosmetik, Maßschneiderei und Fotografie.",
    heroTitel: "Handwerk OS für Friseure & persönliche Dienstleistungen.",
    intro:
      "Bei dir kommen die Kunden in den Laden. Handwerk OS füllt den Terminkalender, plant dein Team nach Können und Arbeitszeiten und erinnert Kunden an ihren Termin.",
    berufe: [
      "Friseur",
      "Kosmetiker",
      "Barbier",
      "Maskenbildner",
      "Maßschneider",
      "Änderungsschneider",
      "Fotograf",
      "Fußpflege",
    ],
    suchbegriffe: ["Friseursalon", "Frisör", "Salon", "Kosmetikstudio", "Nagelstudio", "Schneiderei", "Fotostudio"],
    arbeitsweisen: [
      { art: "Laden", text: "Kunden kommen in den Salon oder ins Studio – nach Termin oder spontan." },
      { art: "Kundendienst", text: "Hausbesuche, Hochzeiten, Fotoaufträge vor Ort." },
    ],
    einrichtung: [
      { titel: "Terminbuchung", text: "Kunden buchen online freie Zeiten – passend zur Dauer der Leistung." },
      { titel: "Dienstplan", text: "Arbeitszeiten, Urlaub und Berufsschule deiner Leute in einem Plan." },
      { titel: "Können im Team", text: "Wer färbt, wer macht Hochsteckfrisuren? Termine gehen an die passende Person." },
      { titel: "Erinnerungen", text: "Kunden bekommen eine Erinnerung vor dem Termin – weniger leere Stühle." },
      { titel: "Schulungen", text: "Weiterbildungen und Hygieneunterweisungen im Blick." },
    ],
    funktionen: ["kalender", "kunden", "mitarbeiter", "zeiterfassung", "schulungen", "material"],
    top: [],
    verwandt: ["gesundheitshandwerk", "textil-gestaltung-werbetechnik"],
    tag: [
      { zeit: "09:00", titel: "Schnitt & Farbe", detail: "Lisa · Fr. Berger · 2 Std.", farbe: "signal" },
      { zeit: "09:30", titel: "Herrenschnitt", detail: "Murat · Hr. Keller", farbe: "sky" },
      { zeit: "11:00", titel: "Brautfrisur Probe", detail: "Sophie · Fr. Lorenz", farbe: "moss" },
    ],
    faq: [
      {
        frage: "Ersetzt Handwerk OS meine Kasse?",
        antwort:
          "Nein. Handwerk OS ist kein Kassensystem. Deine Kasse nutzt du weiter. Handwerk OS kümmert sich um Termine, Team, Material und Büro.",
      },
      {
        frage: "Können Kunden online Termine buchen?",
        antwort: "Ja. Du legst fest, welche Leistungen wie lange dauern und wer sie macht. Kunden buchen dann nur passende, freie Zeiten.",
      },
      {
        frage: "Ist Handwerk OS nicht eigentlich für Baustellen?",
        antwort:
          "Handwerk OS kommt vom Bau. Termine, Team, Schulungen und Büro brauchen aber alle Handwerksbetriebe. Die Arbeitsweise kommt aus der Vorlage deines Gewerks, und Lotte zeigt nur, was du brauchst.",
      },
    ],
  },

  lebensmittelhandwerk: {
    seoTitel: "Software für Bäcker, Konditoren und Fleischer",
    beschreibung:
      "Handwerk OS für das Lebensmittelhandwerk: Bäcker, Konditoren, Fleischer und Brauer – Bestellungen, Schichtplan, Hygieneschulungen und Checklisten in einer Software.",
    icon: "heart",
    teaser: "Bäcker, Konditor, Fleischer, Brauer.",
    heroTitel: "Handwerk OS für das Lebensmittelhandwerk.",
    intro:
      "Backstube um 3 Uhr, Filialen ab 6, Torten auf Bestellung und Partyservice am Wochenende: Handwerk OS plant Schichten, sammelt Bestellungen und hält Hygieneschulungen und Kontrollen im Blick.",
    berufe: [
      "Bäcker",
      "Konditor",
      "Fleischer",
      "Metzger",
      "Brauer und Mälzer",
      "Müller",
      "Speiseeishersteller",
      "Weinküfer",
      "Confiseur",
    ],
    suchbegriffe: ["Bäckerei", "Konditorei", "Metzgerei", "Fleischerei", "Brauerei", "Partyservice", "Catering", "Torten"],
    arbeitsweisen: [
      { art: "Fertigung", text: "Backstube, Wurstküche oder Sudhaus: Produktion nach Plan, oft in der Nacht." },
      { art: "Laden", text: "Verkauf in Filialen, mit Schichten und Vertretungen." },
      { art: "Kundendienst", text: "Bestellungen für Feiern, Partyservice und Belieferung von Kunden." },
    ],
    einrichtung: [
      { titel: "Schichtplan", text: "Backstube, Filialen und Lieferfahrten – mit Urlaub und Krankheit." },
      { titel: "Bestellungen", text: "Torten, Platten und Partyservice als Auftrag mit Abholtermin." },
      { titel: "Hygieneschulungen", text: "Belehrung nach Infektionsschutzgesetz und Hygieneschulungen mit Datum." },
      { titel: "Checklisten", text: "Temperaturkontrolle, Reinigungsplan und Wareneingang zum Abhaken." },
      { titel: "Fahrzeuge", text: "Lieferfahrzeuge mit Touren und Wartung." },
    ],
    funktionen: ["mitarbeiter", "zeiterfassung", "schulungen", "auftraege", "fahrzeuge", "einkauf"],
    top: [],
    verwandt: ["friseur-dienstleistungen", "gesundheitshandwerk"],
    tag: [
      { zeit: "03:00", titel: "Backstube Frühschicht", detail: "Tobias, Ana · 4 Leute", farbe: "sky" },
      { zeit: "06:00", titel: "Filiale Marktplatz", detail: "Verkauf · Petra, Jule", farbe: "moss" },
      { zeit: "15:00", titel: "Hochzeitstorte abholen", detail: "Fam. Simon · 3 Etagen", farbe: "signal" },
    ],
    faq: [
      {
        frage: "Ist Handwerk OS eine Kasse oder Warenwirtschaft für die Theke?",
        antwort:
          "Nein. Kasse und Warenwirtschaft an der Theke bleiben, wie sie sind. Handwerk OS hilft bei Schichtplan, Bestellungen, Schulungen, Checklisten und Büro.",
      },
      {
        frage: "Kann ich Hygieneschulungen im Blick behalten?",
        antwort:
          "Ja. Belehrungen und Schulungen bekommen ein Datum. Lotte erinnert rechtzeitig an die Wiederholung und zeigt, wer noch fehlt.",
      },
      {
        frage: "Kann ich Checklisten für Temperatur und Reinigung nutzen?",
        antwort: "Ja. Dein Team hakt Kontrollen auf dem Handy oder Tablet ab. Uhrzeit und Name werden gespeichert.",
      },
    ],
  },

  gesundheitshandwerk: {
    seoTitel: "Software für Gesundheitshandwerke",
    beschreibung:
      "Handwerk OS für Augenoptiker, Hörakustiker, Orthopädietechniker und Zahntechniker: Termine, Werkstatt, Fertigstellung und Team in einer einfachen Software.",
    icon: "heart",
    teaser: "Augenoptik, Hörakustik, Orthopädietechnik, Zahntechnik.",
    heroTitel: "Handwerk OS für Gesundheitshandwerke.",
    intro:
      "Anpassung im Laden, Fertigung in der Werkstatt, Termin zur Abholung: Handwerk OS verbindet die Schritte, plant dein Team und sagt dem Kunden Bescheid, wenn alles fertig ist.",
    berufe: [
      "Augenoptiker",
      "Hörakustiker",
      "Orthopädietechniker",
      "Orthopädieschuhmacher",
      "Zahntechniker",
      "Orthopädietechnik-Mechaniker",
      "Bandagist",
    ],
    suchbegriffe: ["Optiker", "Brille", "Hörgeräte", "Hörakustik", "Sanitätshaus", "Einlagen", "Dentallabor", "Zahnlabor", "Orthopädie"],
    arbeitsweisen: [
      { art: "Laden", text: "Beratung, Messung und Anpassung im Geschäft – meist mit Termin." },
      { art: "Werkstatt", text: "Brillen einschleifen, Einlagen fertigen, Prothesen und Zahnersatz bauen." },
      { art: "Kundendienst", text: "Hausbesuche in Pflegeheimen und bei Kunden zu Hause." },
    ],
    einrichtung: [
      { titel: "Termine mit Dauer", text: "Sehtest, Hörtest oder Anprobe mit passender Dauer und Person." },
      { titel: "Werkstattschritte", text: "Fertigung, Anprobe und Abholung als Schritte eines Auftrags." },
      { titel: "Fertig-Meldung", text: "Der Kunde bekommt Bescheid, sobald die Arbeit abholbereit ist." },
      { titel: "Schulungen", text: "Herstellerschulungen und Fortbildungen mit Datum im Blick." },
      { titel: "Hausbesuche", text: "Touren zu Pflegeheimen und Kunden mit Fahrzeit planen." },
    ],
    funktionen: ["kalender", "kunden", "auftraege", "mitarbeiter", "schulungen", "fahrzeuge"],
    top: [],
    verwandt: ["friseur-dienstleistungen", "lebensmittelhandwerk"],
    tag: [
      { zeit: "09:00", titel: "Sehtest & Beratung", detail: "Clara · Hr. Weiß", farbe: "sky" },
      { zeit: "10:30", titel: "Einlagen fertigen", detail: "Werkstatt · 3 Paar", farbe: "moss" },
      { zeit: "14:00", titel: "Hausbesuch Pflegeheim", detail: "Martin · 5 Bewohner", farbe: "signal" },
    ],
    faq: [
      {
        frage: "Ersetzt Handwerk OS meine Branchensoftware für die Abrechnung mit den Kassen?",
        antwort:
          "Nein. Abrechnung mit Kostenträgern und deine Branchenprogramme bleiben. Handwerk OS hilft bei Terminen, Werkstattplanung, Team, Schulungen und Hausbesuchen.",
      },
      {
        frage: "Kann ich Kunden informieren, wenn ihre Arbeit fertig ist?",
        antwort: "Ja. Schließt die Werkstatt den Schritt ab, bekommt der Kunde auf Wunsch automatisch eine Nachricht.",
      },
      {
        frage: "Was ist mit Gesundheitsdaten?",
        antwort:
          "Speichere in Handwerk OS nur, was du für Termin und Auftrag brauchst. Medizinische Unterlagen bleiben in deinem Fachprogramm.",
      },
    ],
  },

  "textil-gestaltung-werbetechnik": {
    seoTitel: "Software für Werbetechnik, Textil und Gestaltung",
    beschreibung:
      "Handwerk OS für Textil, Gestaltung & Werbetechnik: Schilder- und Lichtreklamehersteller, Polsterer, Sattler und Siebdrucker – Entwurf, Fertigung und Montage in einem Plan.",
    icon: "spark",
    teaser: "Werbetechnik, Polsterei, Sattlerei, Druck und Gestaltung.",
    heroTitel: "Handwerk OS für Textil, Gestaltung & Werbetechnik.",
    intro:
      "Entwurf freigeben lassen, in der Werkstatt fertigen, beim Kunden montieren: Handwerk OS hält Korrekturen, Fertigung und Montagetermine zusammen.",
    berufe: [
      "Schilder- und Lichtreklamehersteller",
      "Werbetechniker",
      "Polsterer",
      "Sattler",
      "Siebdrucker",
      "Textilreiniger",
      "Graveur",
      "Buchbinder",
      "Sticker",
      "Weber",
    ],
    suchbegriffe: ["Werbetechnik", "Schilder", "Leuchtreklame", "Lichtwerbung", "Fahrzeugbeschriftung", "Folierung", "Polsterei", "Textildruck", "Stickerei"],
    arbeitsweisen: [
      { art: "Werkstatt", text: "Polstern, nähen, drucken, plotten: Aufträge laufen durch mehrere Arbeitsschritte." },
      { art: "Fertigung", text: "Schilder, Leuchtkästen und Beschriftungen in Serie oder als Einzelstück." },
      { art: "Baustelle", text: "Montage beim Kunden, oft mit Hubarbeitsbühne und Elektroanschluss." },
    ],
    einrichtung: [
      { titel: "Freigabe vom Kunden", text: "Entwurf als eigener Schritt: erst Freigabe, dann Fertigung." },
      { titel: "Werkstattschritte", text: "Zuschnitt, Druck, Montage – mit Zeiten pro Schritt." },
      { titel: "Montage mit Hebebühne", text: "Montagetermine mit Gerät und passender Qualifikation." },
      { titel: "Fahrzeugbeschriftung", text: "Termin für die Abgabe des Fahrzeugs und Fertig-Meldung an den Kunden." },
      { titel: "Nachkalkulation", text: "Was hat der Auftrag wirklich gekostet? Zeiten und Material im Vergleich." },
    ],
    funktionen: ["angebote", "auftraege", "einsatzplanung", "zeiterfassung", "material", "rechnungen"],
    top: ["tischler", "maler"],
    verwandt: ["friseur-dienstleistungen", "maler-boden-oberflaechen"],
    tag: [
      { zeit: "08:00", titel: "Leuchtkasten fertigen", detail: "Werkstatt · Freigabe liegt vor", farbe: "sky" },
      { zeit: "10:00", titel: "Transporter bekleben", detail: "Halle · Firma Weiß", farbe: "moss" },
      { zeit: "14:00", titel: "Schild montieren", detail: "Robin, Ella · Hubarbeitsbühne", farbe: "signal" },
    ],
    faq: [
      {
        frage: "Kann ich Entwürfe vom Kunden freigeben lassen?",
        antwort:
          "Ja. Der Entwurf hängt am Auftrag. Erst nach der Freigabe geht es in die Fertigung. So ist klar, was der Kunde bestätigt hat.",
      },
      {
        frage: "Ist Handwerk OS ein Grafik- oder Plotterprogramm?",
        antwort: "Nein. Gestaltung und Ausgabe machst du weiter mit deinen Programmen. Handwerk OS organisiert Auftrag, Team, Termine und Rechnung.",
      },
      {
        frage: "Passt Handwerk OS auch für Polsterer und Sattler?",
        antwort: "Ja. Abholung, Werkstatt, Stoffbestellung und Lieferung sind Schritte eines Auftrags – mit Zeiten und Material.",
      },
    ],
  },

  "weitere-gewerke": {
    seoTitel: "Handwerkersoftware für weitere Gewerke",
    beschreibung:
      "Dein Gewerk ist nicht dabei? Handwerk OS passt sich an deine Arbeitsweise an – ob Goldschmied, Uhrmacher, Instrumentenbauer oder Schuhmacher.",
    icon: "layers",
    teaser: "Goldschmied, Uhrmacher, Instrumentenbau und viele mehr.",
    heroTitel: "Handwerk OS für dein Gewerk.",
    intro:
      "Es gibt weit über hundert Handwerksberufe. Nicht jeder hat eine eigene Seite – aber jeder Betrieb arbeitet nach einem Muster: Kundendienst, Baustelle, Werkstatt, Fertigung oder Laden. Danach richtet Handwerk OS sich ein.",
    berufe: [
      "Goldschmied",
      "Uhrmacher",
      "Orgelbauer",
      "Geigenbauer",
      "Klavierbauer",
      "Schuhmacher",
      "Böttcher",
      "Bootsbauer",
      "Keramiker",
      "Glasbläser",
      "Korbmacher",
      "Kürschner",
      "Modist",
      "Restaurator im Handwerk",
    ],
    suchbegriffe: ["Instrumentenbauer", "Juwelier", "Schmuck", "Uhren", "Musikinstrumente", "Töpfer", "Restaurierung", "Klavierstimmer"],
    arbeitsweisen: [
      { art: "Werkstatt", text: "Einzelstücke, Reparaturen und Anfertigungen mit Zeit und Material pro Auftrag." },
      { art: "Laden", text: "Annahme und Beratung im Geschäft – mit Abholtermin und Fertig-Meldung." },
      { art: "Kundendienst", text: "Stimmen, warten oder reparieren beim Kunden vor Ort." },
      { art: "Baustelle", text: "Größere Projekte über Wochen, zum Beispiel beim Orgel- oder Bootsbau." },
    ],
    einrichtung: [
      { titel: "Deine Begriffe", text: "Du benennst Auftragsarten und Schritte so, wie ihr im Betrieb redet." },
      { titel: "Deine Abläufe", text: "Annahme, Werkstatt, Fertigstellung, Abholung – als feste Schritte." },
      { titel: "Deine Vorlagen", text: "Angebote, Auftragsbestätigungen und Rechnungen mit deinem Briefkopf." },
      { titel: "Deine Checklisten", text: "Was bei Annahme und Übergabe immer geprüft werden muss." },
      { titel: "Dein Team", text: "Arbeitszeiten, Urlaub, Können und Schulungen in einem Plan." },
    ],
    funktionen: ["auftraege", "kunden", "kalender", "zeiterfassung", "rechnungen", "automatisch-erledigen"],
    top: ["tischler", "maler"],
    verwandt: ["textil-gestaltung-werbetechnik", "metall-maschinen", "gesundheitshandwerk"],
    tag: [
      { zeit: "09:00", titel: "Ring anfertigen", detail: "Werkstatt · Fr. Kaiser", farbe: "sky" },
      { zeit: "11:00", titel: "Uhr zur Revision", detail: "Annahme · Hr. Vogt", farbe: "moss" },
      { zeit: "15:00", titel: "Klavier stimmen", detail: "Ben · Musikschule", farbe: "signal" },
    ],
    faq: [
      {
        frage: "Mein Gewerk ist nicht aufgeführt. Passt Handwerk OS trotzdem?",
        antwort:
          "Sehr wahrscheinlich. Handwerk OS richtet sich nach deiner Arbeitsweise – Kundendienst, Baustelle, Werkstatt, Fertigung oder Laden. Begriffe, Abläufe und Vorlagen passt du danach an deinen Betrieb an.",
      },
      {
        frage: "Wie lange dauert das Einrichten?",
        antwort:
          "Die Grundeinrichtung dauert nur wenige Minuten. Eigene Begriffe und Vorlagen ergänzt du nach und nach, während du schon arbeitest.",
      },
      {
        frage: "Hilft mir jemand beim Einrichten?",
        antwort: "Ja. Wenn du nicht weiterkommst, hilft dir unser Team persönlich – über Hilfe und Kontakt auf unserer Website.",
      },
    ],
  },
};

/* ------------------------------------------------------------------ */
/* Hub: Anpassungsprinzip                                              */
/* ------------------------------------------------------------------ */

export type Anpassung = {
  bereich: string;
  icon: IconName;
  text: string;
  gewerk: string;
  vorher: string;
  nachher: string;
};

/** Was sich je Gewerk verändert – mit einem Vorher/Nachher-Beispiel pro Bereich. */
export const anpassungen: Anpassung[] = [
  {
    bereich: "Begriffe",
    icon: "chat",
    text: "Handwerk OS spricht deine Sprache.",
    gewerk: "SHK",
    vorher: "Kunde · Objekt · Termin",
    nachher: "Kunde · Anlage · Wartung",
  },
  {
    bereich: "Auftragsabläufe",
    icon: "route",
    text: "Die Schritte passen zu deiner Arbeit.",
    gewerk: "Tischler",
    vorher: "Termin → Arbeit → Rechnung",
    nachher: "Aufmaß → Zuschnitt → Fertigung → Montage → Rechnung",
  },
  {
    bereich: "Kalkulation",
    icon: "calculator",
    text: "Gerechnet wird, wie du rechnest.",
    gewerk: "Maler",
    vorher: "Position mit Stückpreis",
    nachher: "Fläche in m² mit Abzug für Fenster und Türen",
  },
  {
    bereich: "Formulare",
    icon: "file",
    text: "Die Protokolle, die dein Gewerk wirklich braucht.",
    gewerk: "Elektro",
    vorher: "allgemeiner Arbeitsbericht",
    nachher: "Prüfprotokoll mit Messwerten pro Stromkreis",
  },
  {
    bereich: "Checklisten",
    icon: "clipboard",
    text: "Nichts Wichtiges wird vergessen.",
    gewerk: "Fliesen",
    vorher: "„Arbeit erledigt“ abhaken",
    nachher: "Abdichtung fotografiert, Dichtband an allen Ecken",
  },
  {
    bereich: "Qualifikationen",
    icon: "award",
    text: "Nur wer darf, wird eingeplant.",
    gewerk: "Dach",
    vorher: "jeder Mitarbeiter für jeden Auftrag",
    nachher: "aufs Dach nur mit gültiger Unterweisung zur Absturzsicherung",
  },
  {
    bereich: "Schulungen",
    icon: "book",
    text: "Pflichtschulungen kommen von selbst wieder.",
    gewerk: "Bau",
    vorher: "Liste im Ordner",
    nachher: "Erinnerung vor Ablauf, offene Schulungen pro Kolonne",
  },
  {
    bereich: "Automationen",
    icon: "spark",
    text: "Lotte erledigt, was in deinem Gewerk immer wiederkommt.",
    gewerk: "GaLaBau",
    vorher: "Pflegetermine von Hand eintragen",
    nachher: "Pflegegänge nach Vertrag eingeplant, Monatsrechnung vorbereitet",
  },
];

/* ------------------------------------------------------------------ */
/* Hilfsfunktionen                                                     */
/* ------------------------------------------------------------------ */

export function isTopGewerk(slug: string): slug is TopGewerkSlug {
  return topGewerke.some((g) => g.slug === slug);
}

export function isGewerkCluster(slug: string): slug is GewerkClusterSlug {
  return gewerkCluster.some((g) => g.slug === slug);
}

export function gewerkTitel(slug: GewerkSlug): string {
  return (
    topGewerke.find((g) => g.slug === slug)?.titel ??
    gewerkCluster.find((g) => g.slug === slug)?.titel ??
    slug
  );
}

export type Suchbegriff = { begriff: string; ziel: GewerkSlug; zielTitel: string };

/**
 * Stichwortliste für „Gewerk nicht gefunden?“. Top-Gewerke zuerst – bei
 * gleichem Begriff gewinnt die ausführliche Seite.
 */
export function gewerkSuchbegriffe(): Suchbegriff[] {
  const liste: Suchbegriff[] = [];
  const gesehen = new Set<string>();
  const add = (begriff: string, ziel: GewerkSlug) => {
    const key = begriff.toLowerCase();
    if (gesehen.has(key)) return;
    gesehen.add(key);
    liste.push({ begriff, ziel, zielTitel: gewerkTitel(ziel) });
  };
  for (const g of topGewerke) {
    for (const b of [g.titel, ...topGewerkInhalte[g.slug].suchbegriffe]) add(b, g.slug);
  }
  for (const c of gewerkCluster) {
    const inhalt = clusterInhalte[c.slug];
    for (const b of [c.titel, ...inhalt.berufe, ...(inhalt.suchbegriffe ?? [])]) add(b, c.slug);
  }
  return liste;
}
