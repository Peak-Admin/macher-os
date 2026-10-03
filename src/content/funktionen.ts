/**
 * Inhalte aller Funktionsseiten (`/funktionen/[slug]`).
 *
 * Schlüssel sind die kanonischen Slugs aus `registry.ts`. Der Typ erzwingt,
 * dass jede Funktion aus der Registry hier einen Eintrag hat.
 * Alle Zahlen in den Produktansichten sind Beispielwerte aus einem
 * ausgedachten Betrieb – keine Kennzahlen über Handwerk OS.
 */
import type { FaqItem, IconName, SkizzenMotiv } from "@/components/ui";
import {
  funktionen,
  gewerkCluster,
  topGewerke,
  type FunktionSlug,
  type GewerkSlug,
  type KundeSlug,
  type WerkzeugSlug,
} from "./registry";
import { anwendungsfaelle } from "./anwendungsfaelle";

export type Ton = "signal" | "moss" | "sky" | "ink" | "sand" | "gefahr";

/** Desktop-Produktansicht im Hero. */
export type FunktionsVisual = {
  bereich: "Heute" | "Aufträge" | "Planen" | "Betrieb";
  titel: string;
  untertitel?: string;
  /** Bis zu drei Kacheln: [Wert, Beschriftung]. */
  kennzahlen?: [string, string][];
  liste: {
    ueberschrift?: string;
    zeilen: { titel: string; sub?: string; wert?: string; tag?: string; ton?: Ton }[];
  };
  hinweis?: { icon: IconName; ton: "signal" | "moss" | "sky"; titel: string; text: string };
};

/** Detailansicht eines Datensatzes („So löst Handwerk OS es“). */
export type DetailVisual = {
  kopf: string;
  titel: string;
  sub?: string;
  status?: { text: string; ton: Ton };
  zeilen: { label: string; wert: string; hervor?: boolean }[];
  fuss?: { icon: IconName; text: string };
};

/** Handy-Ansicht („Auf Handy und Computer“). */
export type HandyVisual = {
  kopf: string;
  titel: string;
  sub: string;
  tags?: { text: string; ton: Ton }[];
  felder: { label: string; wert: string }[];
  aktion: { icon: IconName; text: string };
};

type Basis = {
  icon: IconName;
  /** Ein Satz für Karten im Hub und bei verwandten Funktionen. */
  kurz: string;
  /** Unterpunkte aus dem Mega-Menü, die diese Funktion abdeckt. */
  enthalten?: string[];
  meta: { title: string; description: string };
  /**
   * Funktion wird auf Anfrage für den Betrieb eingerichtet (noch nicht in jedem Konto freigeschaltet).
   * Die Seite zeigt dann sichtbar „Auf Anfrage“, sagt, was heute schon geht, und bietet „… anfragen“ als Hauptaktion.
   */
  aufAnfrage?: { text: string; heute: string[]; aktion: string };
  hero: { titel: string; problem: string; loesung: string };
  visual: FunktionsVisual;
  gewerke: { slug: GewerkSlug; text: string }[];
  kunde: { slug: KundeSlug; text: string };
  werkzeug?: WerkzeugSlug;
  faq: FaqItem[];
  verwandt: FunktionSlug[];
};

export type FunktionInhalt = Basis & {
  problemTitel: string;
  probleme: { titel: string; text: string }[];
  loesung: { titel: string; text: string; punkte: string[] };
  detail: DetailVisual;
  schritte: { titel: string; text: string }[];
  automatisch: string[];
  geraete: { handy: string[]; computer: string[]; handyVisual: HandyVisual };
};

/** Eine Aufgabe, die Macher übernimmt – mit Vorher/Nachher. */
export type MacherAufgabe = {
  titel: string;
  icon: IconName;
  funktion: FunktionSlug;
  vorher: string;
  nachher: string;
  duEntscheidest: string;
};

export type AutomatischInhalt = Basis & {
  aufgaben: MacherAufgabe[];
  prinzipien: { titel: string; text: string; skizze: SkizzenMotiv }[];
  tagesablauf: { zeit: string; text: string }[];
};

type Inhalte = {
  [S in FunktionSlug]: S extends "automatisch-erledigen" ? AutomatischInhalt : FunktionInhalt;
};

export type StandardSlug = Exclude<FunktionSlug, "automatisch-erledigen">;

export function funktionTitel(slug: FunktionSlug) {
  return funktionen.find((f) => f.slug === slug)!.titel;
}

export function funktionGruppe(slug: FunktionSlug) {
  return funktionen.find((f) => f.slug === slug)!.gruppe;
}

const alleGewerke: readonly { slug: GewerkSlug; titel: string }[] = [...topGewerke, ...gewerkCluster];

export function gewerkTitel(slug: GewerkSlug) {
  return alleGewerke.find((g) => g.slug === slug)!.titel;
}

export const funktionInhalte: Inhalte = {
  ...anwendungsfaelle,
  /* ───────────────────────── Aufträge ───────────────────────── */

  anfragen: {
    icon: "inbox",
    kurz: "Telefon, Mail und Webformular landen in einem Eingang – vollständig und mit klarer Zuständigkeit.",
    enthalten: ["Anfrage-Eingang", "Webformular", "Zuständigkeit"],
    meta: {
      title: "Anfragen verwalten – alle Kundenanfragen an einem Ort",
      description:
        "Anfragen per Telefon, Mail und Webformular in einem Eingang. Handwerk OS fragt fehlende Angaben nach und zeigt dir, welche Anfrage zuerst dran ist.",
    },
    hero: {
      titel: "Keine Anfrage geht mehr verloren.",
      problem:
        "Anfragen kommen per Telefon, Mail und über die Webseite. Ein Teil landet auf Zetteln, ein Teil nur im Kopf.",
      loesung:
        "Handwerk OS sammelt alle Anfragen an einer Stelle, fragt fehlende Angaben nach und zeigt dir, welche zuerst dran ist.",
    },
    visual: {
      bereich: "Aufträge",
      titel: "Anfragen",
      untertitel: "Dienstag, 14. Oktober",
      kennzahlen: [
        ["5", "neu heute"],
        ["2", "warten auf Kunde"],
        ["1", "überfällig"],
      ],
      liste: {
        ueberschrift: "Eingang",
        zeilen: [
          { titel: "Badsanierung, ca. 8 m²", sub: "S. Krüger · Webformular · 07:42", tag: "vollständig", ton: "moss" },
          { titel: "Steckdosen Küche erweitern", sub: "Hr. Öztürk · Anruf · 08:15", tag: "Rückruf", ton: "signal" },
          { titel: "Fassade streichen", sub: "WEG Am Park · Mail · gestern", tag: "Fotos fehlen", ton: "sky" },
        ],
      },
      hinweis: {
        icon: "spark",
        ton: "moss",
        titel: "Macher hat erledigt:",
        text: "3 Kunden angelegt, 2 fehlende Fotos beim Kunden nachgefragt.",
      },
    },
    problemTitel: "Anfragen kommen von überall – und gehen irgendwo verloren.",
    probleme: [
      {
        titel: "Der Zettel auf dem Beifahrersitz",
        text: "Ein Kunde ruft auf der Baustelle an. Du schreibst die Nummer auf einen Lieferschein. Zwei Tage später ist der Zettel weg.",
      },
      {
        titel: "Anfragen ohne Angaben",
        text: "„Wir bräuchten mal jemanden fürs Bad.“ Keine Adresse, keine Fotos, kein Zeitraum. Du musst dreimal nachfragen.",
      },
      {
        titel: "Keiner fühlt sich zuständig",
        text: "Das Büro denkt, der Chef ruft zurück. Der Chef denkt, das Büro macht es. Der Kunde wartet – und fragt den nächsten Betrieb.",
      },
      {
        titel: "Viel Kleinkram dazwischen",
        text: "Zwischen guten Aufträgen stehen Anfragen, die nicht passen: zu weit weg, zu klein, falsches Gewerk. Sortieren kostet Zeit.",
      },
    ],
    loesung: {
      titel: "Ein Eingang für alle Anfragen.",
      text: "Egal, ob die Anfrage per Telefon, Mail oder über das Formular auf deiner Webseite kommt: Sie landet im selben Eingang. Macher legt den Kunden an, ordnet die Anfrage ein und fragt fehlende Angaben direkt beim Kunden nach.",
      punkte: [
        "Telefon, Mail und Webformular in einem Eingang",
        "Fehlende Adresse, Fotos oder Wunschtermin werden nachgefragt",
        "Jede Anfrage hat einen Zuständigen und eine Frist",
        "Mit einem Klick weiter zur Besichtigung oder zum Angebot",
      ],
    },
    detail: {
      kopf: "Anfrage · 07:42 · Webformular",
      titel: "Badsanierung, ca. 8 m²",
      sub: "Sabine Krüger · Gartenstr. 3, Hannover",
      status: { text: "vollständig", ton: "moss" },
      zeilen: [
        { label: "Wunschzeitraum", wert: "ab März" },
        { label: "Fotos", wert: "4 vom Kunden" },
        { label: "Entfernung", wert: "14 km · 22 Min." },
        { label: "Zuständig", wert: "Jana (Büro)" },
        { label: "Nächster Schritt", wert: "Besichtigung anbieten", hervor: true },
      ],
      fuss: { icon: "spark", text: "Macher hat zwei Fotos vom Bestand nachgefragt. Der Kunde hat sie um 9:10 Uhr geschickt." },
    },
    schritte: [
      {
        titel: "Anfrage kommt rein",
        text: "Per Telefon, Mail oder Webformular. Handwerk OS legt sofort eine Anfrage an – auch abends und am Wochenende.",
      },
      {
        titel: "Angaben werden ergänzt",
        text: "Fehlt die Adresse oder ein Foto vom Bestand, fragt Macher beim Kunden nach.",
      },
      {
        titel: "Du entscheidest",
        text: "Annehmen, Besichtigung anbieten oder freundlich absagen. Du siehst auf einen Blick, was passt.",
      },
      {
        titel: "Weiter zum Angebot",
        text: "Kunde, Fotos und Notizen wandern mit. Nichts muss neu eingetippt werden.",
      },
    ],
    automatisch: [
      "legt Kunde und Anfrage automatisch an",
      "erkennt doppelte Kunden",
      "fragt fehlende Angaben und Fotos nach",
      "sortiert nach Dringlichkeit und Entfernung",
      "erinnert, wenn eine Anfrage zu lange liegt",
      "schickt dem Kunden eine Eingangsbestätigung",
    ],
    geraete: {
      handy: [
        "Nachricht aufs Handy bei neuer Anfrage",
        "Anfrage direkt beim Kunden vor Ort aufnehmen",
        "Fotos und Sprachnotiz anhängen",
      ],
      computer: [
        "Alle Anfragen in einer Liste mit Stand",
        "Zuständigkeit und Frist festlegen",
        "Mit einem Klick Angebot oder Besichtigung starten",
      ],
      handyVisual: {
        kopf: "Neue Anfrage · 07:42",
        titel: "Badsanierung, ca. 8 m²",
        sub: "Sabine Krüger · Hannover-List",
        tags: [
          { text: "4 Fotos", ton: "sky" },
          { text: "14 km", ton: "moss" },
        ],
        felder: [
          { label: "Wunschzeitraum", wert: "ab März" },
          { label: "Rückruf", wert: "heute bis 12 Uhr" },
          { label: "Zuständig", wert: "Jana" },
        ],
        aktion: { icon: "calendar", text: "Besichtigung anbieten" },
      },
    },
    gewerke: [
      { slug: "shk", text: "Heizungsausfall oder neues Bad? Dringende Anfragen landen ganz oben." },
      { slug: "maler", text: "Kunden schicken Fotos der Räume gleich mit. Die erste Einschätzung geht schneller." },
      { slug: "elektriker", text: "Wallbox, Photovoltaik, Zählerschrank: Anfragen werden nach Leistung sortiert." },
    ],
    kunde: {
      slug: "elektro-brandt",
      text: "Wie ein Elektrobetrieb Anfragen gesammelt im Büro bearbeitet – statt zwischen zwei Baustellen.",
    },
    faq: [
      {
        frage: "Kann ich das Anfrageformular auf meiner Webseite einbauen?",
        antwort:
          "Ja. Du bekommst ein Formular für deine Webseite. Die Fragen passt du an dein Gewerk an – zum Beispiel Raumgröße beim Maler oder Zählerplatz beim Elektriker.",
      },
      {
        frage: "Was passiert mit Anfragen, die nicht zu uns passen?",
        antwort:
          "Du sagst mit einem Klick ab. Handwerk OS schlägt dir eine freundliche Absage vor, die du noch ändern kannst. Die Anfrage bleibt gespeichert, falls der Kunde später wiederkommt.",
      },
      {
        frage: "Werden Anfragen per Mail automatisch erkannt?",
        antwort:
          "Ja. Leitest du dein Anfrage-Postfach an Handwerk OS weiter, wird aus jeder Mail eine Anfrage mit Kunde, Adresse und Anhängen. Unklare Mails landen zur Prüfung bei dir.",
      },
      {
        frage: "Sehen alle Mitarbeiter die Anfragen?",
        antwort: "Nur wenn du das willst. Du legst fest, wer Anfragen sehen und bearbeiten darf.",
      },
    ],
    verwandt: ["telefon", "kunden", "angebote"],
  },

  telefon: {
    icon: "phone",
    kurz: "Macher geht ans Telefon, wenn keiner frei ist, und legt dir eine fertige Notiz an.",
    enthalten: ["Anrufe annehmen", "Rückrufe", "Notdienst weiterleiten"],
    meta: {
      title: "Telefonassistent für Handwerker – kein Anruf geht verloren",
      description:
        "Macher nimmt Anrufe an, wenn im Betrieb keiner frei ist, fragt das Anliegen ab und legt eine Notiz oder Anfrage an. Notfälle gehen direkt an den Bereitschaftsdienst.",
    },
    aufAnfrage: {
      aktion: "Telefonassistent anfragen",
      text: "Den Telefonassistenten, der Anrufe annimmt, richten wir für deinen Betrieb ein: deine Nummer, deine Begrüßung, deine Regeln für Notfälle. Schreib uns, wir melden uns mit den nächsten Schritten.",
      heute: [
        "Anrufe in Sekunden notieren: Nummer, Anliegen, Dringlichkeit",
        "Bekannte Anrufer an der Nummer erkennen",
        "Aus dem Anruf direkt eine Anfrage oder einen Rückruf mit Zuständigem machen",
        "Erinnerung, wenn ein Rückruf überfällig ist",
      ],
    },
    hero: {
      titel: "Jeder Anruf wird angenommen. Auch wenn du auf der Leiter stehst.",
      problem:
        "Wer auf der Baustelle arbeitet, kann nicht ans Telefon. Die Mailbox hört keiner ab, Rückrufe gehen unter.",
      loesung:
        "Macher nimmt Anrufe an, wenn keiner frei ist, fragt das Wichtige ab und legt dir eine fertige Notiz mit Rückrufwunsch an.",
    },
    visual: {
      bereich: "Heute",
      titel: "Anrufe",
      untertitel: "heute",
      kennzahlen: [
        ["11", "Anrufe"],
        ["4", "von Macher angenommen"],
        ["1", "Rückruf offen"],
      ],
      liste: {
        ueberschrift: "Von Macher angenommen",
        zeilen: [
          { titel: "Heizung ausgefallen", sub: "K. Wendt · 10:24 · an Bereitschaft", tag: "dringend", ton: "gefahr" },
          { titel: "Frage zum Angebot Dachfenster", sub: "Fr. Lindner · 11:02", tag: "Rückruf", ton: "sky" },
          { titel: "Neue Anfrage: Carport-Dach", sub: "Hr. Basler · 12:47", tag: "Anfrage angelegt", ton: "moss" },
        ],
      },
      hinweis: {
        icon: "phone",
        ton: "sky",
        titel: "Rückruf fällig:",
        text: "Fr. Lindner wartet auf Antwort zum Angebot. Erreichbar bis 17 Uhr.",
      },
    },
    problemTitel: "Das Telefon klingelt immer dann, wenn es gerade nicht passt.",
    probleme: [
      {
        titel: "Anruf auf der Leiter",
        text: "Du hast beide Hände voll. Bis du zurückrufst, hat der Kunde schon den nächsten Betrieb angerufen.",
      },
      {
        titel: "Die Mailbox voller halber Sätze",
        text: "„Ja, hier ist der Müller, wegen dem … rufen Sie mal zurück.“ Welcher Müller? Welche Nummer?",
      },
      {
        titel: "Das Büro ist nur vormittags besetzt",
        text: "Ab Mittag läuft alles auf dein Handy. Abends sitzt du dann vor einem Stapel Rückrufe.",
      },
      {
        titel: "Notfall oder Nachfrage?",
        text: "Ein Heizungsausfall im Januar ist dringend. Die Frage nach dem Angebot von letzter Woche nicht. Am Telefon klingt beides gleich.",
      },
    ],
    loesung: {
      titel: "Ein Empfang, der nie Pause macht.",
      text: "Ist im Büro keiner frei, geht Macher ans Telefon. Er meldet sich mit deinem Firmennamen, sagt offen, dass er der digitale Assistent ist, und fragt das Wichtige ab: Wer ruft an, worum geht es, wie dringend ist es? Daraus wird eine Notiz – oder direkt eine Anfrage.",
      punkte: [
        "Anrufe annehmen, wenn alle beschäftigt sind",
        "Anliegen, Adresse und Rückrufnummer abfragen",
        "Notfälle sofort an den Bereitschaftsdienst weitergeben",
        "Bekannte Kunden erkennen und dem richtigen Auftrag zuordnen",
      ],
    },
    detail: {
      kopf: "Anruf · 10:24 · 2:13 Min.",
      titel: "Heizung ausgefallen",
      sub: "Klaus Wendt · Bestandskunde",
      status: { text: "dringend", ton: "gefahr" },
      zeilen: [
        { label: "Anliegen", wert: "kein Warmwasser seit heute früh" },
        { label: "Anlage", wert: "Gas-Brennwert, Wartung 10/2025" },
        { label: "Adresse", wert: "Birkenweg 8, Dortmund" },
        { label: "Weitergeleitet", wert: "an Bereitschaft (Murat)", hervor: true },
      ],
      fuss: { icon: "spark", text: "Zusammenfassung erstellt und dem Kunden Wendt zugeordnet." },
    },
    schritte: [
      {
        titel: "Anruf kommt rein",
        text: "Ist jemand im Büro frei, klingelt es dort wie gewohnt. Sonst übernimmt Macher nach ein paar Klingeltönen.",
      },
      {
        titel: "Macher fragt nach",
        text: "Name, Adresse, Anliegen, Dringlichkeit. Bekannte Kunden erkennt Macher an der Nummer.",
      },
      {
        titel: "Notiz statt Mailbox",
        text: "Du bekommst eine kurze Zusammenfassung mit allen Angaben – in zehn Sekunden gelesen.",
      },
      {
        titel: "Weiter geht's",
        text: "Rückruf, Anfrage oder Termin: Mit einem Tipp wird aus der Notiz der nächste Schritt.",
      },
    ],
    automatisch: [
      "nimmt Anrufe an, wenn keiner frei ist",
      "schreibt eine kurze Zusammenfassung",
      "erkennt Bestandskunden an der Nummer",
      "legt bei neuen Kunden direkt eine Anfrage an",
      "gibt Notfälle an den Bereitschaftsdienst weiter",
      "erinnert an offene Rückrufe",
    ],
    geraete: {
      handy: [
        "Zusammenfassung jedes Anrufs als Nachricht",
        "Zurückrufen mit einem Tipp",
        "Bereitschaft bekommt Notfälle sofort aufs Handy",
      ],
      computer: [
        "Anrufliste: offen, zurückgerufen, erledigt",
        "Begrüßung, Fragen und Erreichbarkeit einstellen",
        "Alle Anrufe beim Kunden und Auftrag sehen",
      ],
      handyVisual: {
        kopf: "Anruf angenommen · 10:24",
        titel: "Heizung ausgefallen",
        sub: "Klaus Wendt · Birkenweg 8",
        tags: [
          { text: "dringend", ton: "gefahr" },
          { text: "Bestandskunde", ton: "moss" },
        ],
        felder: [
          { label: "Anliegen", wert: "kein Warmwasser" },
          { label: "Erreichbar", wert: "bis 18 Uhr" },
          { label: "Bereitschaft", wert: "Murat" },
        ],
        aktion: { icon: "phone", text: "Zurückrufen" },
      },
    },
    gewerke: [
      { slug: "shk", text: "Heizungsausfall und Rohrbruch gehen sofort an den Notdienst." },
      { slug: "elektriker", text: "Störungsmeldungen von Hausverwaltungen landen beim richtigen Objekt." },
      { slug: "gebaeude-service", text: "Viele kleine Aufträge, viele Anrufe – Macher hält den Empfang frei." },
    ],
    kunde: {
      slug: "elektro-brandt",
      text: "Wie ein Elektrobetrieb keine Anrufe mehr verpasst, obwohl das Büro nur halbtags besetzt ist.",
    },
    faq: [
      {
        frage: "Merken Anrufer, dass sie mit einem digitalen Assistenten sprechen?",
        antwort:
          "Ja. Macher sagt das gleich zu Beginn. Das ist ehrlich und fair. Wer lieber mit einem Menschen sprechen will, bekommt einen Rückruf.",
      },
      {
        frage: "Muss ich meine Telefonnummer ändern?",
        antwort:
          "Nein. Du leitest Anrufe von deiner bestehenden Nummer weiter – zum Beispiel, wenn nach 20 Sekunden keiner abnimmt oder außerhalb der Bürozeiten.",
      },
      {
        frage: "Kann ich festlegen, was Macher am Telefon sagt?",
        antwort:
          "Ja. Begrüßung, Fragen und Antworten auf häufige Fragen wie Öffnungszeiten oder Einzugsgebiet stellst du selbst ein.",
      },
      {
        frage: "Was passiert bei einem Notfall?",
        antwort:
          "Du legst fest, was ein Notfall ist – zum Beispiel Wasserschaden oder Heizungsausfall. Solche Anrufe gehen sofort an den Bereitschaftsdienst.",
      },
    ],
    verwandt: ["anfragen", "kunden", "kalender"],
  },

  kunden: {
    icon: "user",
    kurz: "Eine Akte pro Kunde: Kontakt, Objekte, Aufträge, Fotos, Rechnungen und jeder Anruf.",
    enthalten: ["Kundenakte", "Objekte & Anlagen", "Ansprechpartner"],
    meta: {
      title: "Kundenverwaltung für Handwerker – alles zum Kunden an einem Ort",
      description:
        "Kontakt, Objekte, Angebote, Aufträge, Fotos und Rechnungen in einer Kundenakte. Für Büro und Monteure – auch bei Hausverwaltungen mit vielen Objekten.",
    },
    hero: {
      titel: "Alles über deinen Kunden. Auf einen Blick.",
      problem:
        "Adresse im Handy, Angebote im Postfach, Fotos in der Galerie, alte Rechnungen im Ordner. Wer etwas wissen will, muss suchen.",
      loesung:
        "In Handwerk OS hat jeder Kunde eine Akte: Kontakt, Objekte, Aufträge, Fotos, Rechnungen und jeder Anruf – für alle im Betrieb gleich.",
    },
    visual: {
      bereich: "Aufträge",
      titel: "Kunden",
      untertitel: "Suche: „Kastanien“",
      liste: {
        ueberschrift: "Hausverwaltung Nordblick · 12 Objekte",
        zeilen: [
          { titel: "Kastanienallee 14, 3. OG links", sub: "Zählerschrank getauscht · 03.09.", wert: "1.284,50 €", tag: "offen", ton: "signal" },
          { titel: "Kastanienallee 16, EG", sub: "E-Check fällig im November", tag: "Wartung", ton: "sky" },
          { titel: "Lindenhof 2, Treppenhaus", sub: "Beleuchtung erneuert · 12.08.", tag: "bezahlt", ton: "moss" },
        ],
      },
      hinweis: {
        icon: "user",
        ton: "moss",
        titel: "Ansprechpartnerin:",
        text: "Fr. Albers · Rechnungen per Mail · Schlüssel beim Hausmeister.",
      },
    },
    problemTitel: "Das Wissen über deine Kunden steckt überall – nur nicht an einer Stelle.",
    probleme: [
      {
        titel: "„Waren wir da schon mal?“",
        text: "Ein Kunde ruft an, weil die Steckdose von damals nicht geht. Wann war das? Wer war da? Welches Material?",
      },
      {
        titel: "Ein Kunde, viele Adressen",
        text: "Die Hausverwaltung hat zwölf Häuser. Rechnung an die Verwaltung, Termin mit dem Mieter, Schlüssel beim Hausmeister.",
      },
      {
        titel: "Wissen im Kopf vom Gesellen",
        text: "Dass der Hund im Garten bissig ist und die Klingel nicht geht, weiß nur Lukas. Lukas ist im Urlaub.",
      },
      {
        titel: "Doppelte Einträge",
        text: "Frau Krüger steht dreimal in der Liste – mit drei verschiedenen Telefonnummern.",
      },
    ],
    loesung: {
      titel: "Eine Kundenakte, die jeder versteht.",
      text: "Jeder Kunde hat in Handwerk OS eine Akte. Darin steht alles, was je passiert ist: Anfragen, Angebote, Aufträge, Fotos, Rechnungen, Anrufe. Bei Hausverwaltungen und Firmen hängen Objekte und Ansprechpartner sauber darunter.",
      punkte: [
        "Kontakt, Objekte und Ansprechpartner an einer Stelle",
        "Die ganze Geschichte: was, wann, wer, mit welchem Material",
        "Hinweise für die Baustelle: Zugang, Parken, Haustiere",
        "Doppelte Kunden werden erkannt und zusammengeführt",
      ],
    },
    detail: {
      kopf: "Kundenakte",
      titel: "Hausverwaltung Nordblick",
      sub: "12 Objekte · Ansprechpartnerin Fr. Albers",
      status: { text: "Stammkunde", ton: "moss" },
      zeilen: [
        { label: "Objekt", wert: "Kastanienallee 14, 3. OG" },
        { label: "Letzter Einsatz", wert: "Zählerschrank, 03.09." },
        { label: "Hinweis für Monteure", wert: "Schlüssel beim Hausmeister" },
        { label: "Offene Rechnung", wert: "1.284,50 €", hervor: true },
      ],
      fuss: { icon: "camera", text: "38 Fotos und 4 Prüfprotokolle zu diesem Objekt gespeichert." },
    },
    schritte: [
      {
        titel: "Kunde wird angelegt",
        text: "Automatisch aus Anruf, Anfrage oder Mail – oder per Hand in einer Minute.",
      },
      {
        titel: "Objekte zuordnen",
        text: "Wer zahlt, wer öffnet die Tür, wo ist die Baustelle? Verwaltung, Mieter und Eigentümer sauber getrennt.",
      },
      {
        titel: "Alles sammelt sich",
        text: "Jedes Angebot, jeder Einsatz, jedes Foto landet automatisch in der richtigen Akte.",
      },
      {
        titel: "Jeder findet es",
        text: "Büro am Computer, Monteur auf dem Handy – alle sehen denselben Stand.",
      },
    ],
    automatisch: [
      "legt Kunden aus Anrufen und Anfragen an",
      "erkennt doppelte Kunden",
      "ordnet Fotos, Rechnungen und Anrufe der richtigen Akte zu",
      "erinnert an Wartungen und wiederkehrende Termine",
      "zeigt offene Beträge direkt beim Kunden",
    ],
    geraete: {
      handy: [
        "Adresse antippen und losfahren",
        "Hinweise zu Zugang und Ansprechpartner vor Ort",
        "Frühere Einsätze und Fotos am Objekt ansehen",
      ],
      computer: [
        "Kundenliste mit Suche und Filter",
        "Kunden und Objekte aus deinem alten Programm übernehmen",
        "Alle Angebote, Aufträge und Rechnungen eines Kunden",
      ],
      handyVisual: {
        kopf: "Kunde · Objekt",
        titel: "Kastanienallee 14",
        sub: "Hausverwaltung Nordblick · 3. OG links",
        tags: [
          { text: "Stammkunde", ton: "moss" },
          { text: "12 Objekte", ton: "sky" },
        ],
        felder: [
          { label: "Vor Ort", wert: "Hr. Brandl (Mieter)" },
          { label: "Letzter Einsatz", wert: "03.09. · Lukas" },
          { label: "Parken", wert: "Hof, Einfahrt links" },
        ],
        aktion: { icon: "map", text: "Navigation starten" },
      },
    },
    gewerke: [
      { slug: "gebaeude-service", text: "Hausverwaltungen mit vielen Objekten und Ansprechpartnern sauber abbilden." },
      { slug: "shk", text: "Jede Anlage mit Baujahr, Wartung und Ersatzteilen direkt beim Kunden." },
      { slug: "elektriker", text: "Prüfprotokolle und Messwerte bleiben beim richtigen Objekt." },
    ],
    kunde: {
      slug: "haustechnik-yilmaz",
      text: "Wie ein SHK-Betrieb Anlagen und Wartungen für jeden Kunden im Blick behält.",
    },
    faq: [
      {
        frage: "Kann ich meine bestehenden Kunden übernehmen?",
        antwort:
          "Ja. Du lädst eine Liste aus deinem alten Programm oder einer Tabelle hoch. Handwerk OS ordnet die Spalten zu und zeigt dir doppelte Einträge, bevor sie übernommen werden.",
      },
      {
        frage: "Sehen Monteure auch Preise und offene Rechnungen?",
        antwort:
          "Nur wenn du es erlaubst. Normalerweise sehen Monteure Adresse, Ansprechpartner, Hinweise und frühere Einsätze – aber keine Beträge.",
      },
      {
        frage: "Kann ich Privat- und Firmenkunden unterschiedlich führen?",
        antwort:
          "Ja. Firmen und Hausverwaltungen bekommen Objekte und mehrere Ansprechpartner. Privatkunden bleiben schlicht.",
      },
      {
        frage: "Was mache ich, wenn ein Kunde seine Daten gelöscht haben will?",
        antwort:
          "Du kannst die Daten eines Kunden gesammelt ausgeben oder löschen. Belege, die du aufbewahren musst, bleiben dabei erhalten.",
      },
    ],
    verwandt: ["anfragen", "auftraege", "dokumentation"],
  },

  auftraege: {
    icon: "clipboard",
    kurz: "Der Auftrag als Mitte: Termine, Leute, Material, Fotos, Stunden und Rechnung hängen daran.",
    enthalten: ["Besichtigungen", "Auftragsstand", "Checklisten", "Zusatzarbeiten"],
    meta: {
      title: "Auftragsverwaltung für Handwerker – jeder Auftrag mit allem drin",
      description:
        "Vom angenommenen Angebot bis zur Abnahme: In Handwerk OS hängen Termine, Mitarbeiter, Material, Fotos, Stunden und Zusatzarbeiten an einem Auftrag.",
    },
    hero: {
      titel: "Jeder Auftrag. Alles drin.",
      problem:
        "Was ist zugesagt, was ist bestellt, wer war schon da, was fehlt noch? Bei zehn Baustellen gleichzeitig hält das kein Kopf mehr fest.",
      loesung:
        "In Handwerk OS ist der Auftrag die Mitte: Kunde, Angebot, Termine, Mitarbeiter, Material, Fotos, Zeiten und Rechnung hängen daran.",
    },
    visual: {
      bereich: "Aufträge",
      titel: "Aufträge",
      untertitel: "14 laufend",
      kennzahlen: [
        ["6", "laufen"],
        ["3", "warten auf Material"],
        ["2", "abrechnen"],
      ],
      liste: {
        ueberschrift: "Diese Woche",
        zeilen: [
          { titel: "Bad sanieren · Fam. Krüger", sub: "Lukas, Mia · Checkliste 9/14", tag: "läuft", ton: "sky" },
          { titel: "Küche montieren · Hr. Demir", sub: "Start Do · Arbeitsplatte fehlt", tag: "wartet", ton: "signal" },
          { titel: "Dachfenster · Fr. Lindner", sub: "Abnahme gestern · unterschrieben", tag: "abrechnen", ton: "moss" },
        ],
      },
      hinweis: {
        icon: "box",
        ton: "signal",
        titel: "Achtung:",
        text: "Arbeitsplatte für Küche Demir ist noch nicht geliefert. Start am Donnerstag in Gefahr.",
      },
    },
    problemTitel: "Ein Auftrag hat viele Teile. Und die liegen überall.",
    probleme: [
      {
        titel: "Der Auftrag lebt im Ordner",
        text: "Angebot ausgedruckt, Notizen am Rand, Fotos auf drei Handys. Wer nicht im Büro ist, sieht nichts.",
      },
      {
        titel: "„Ist das schon bestellt?“",
        text: "Drei Leute rufen beim selben Großhändler an. Oder keiner.",
      },
      {
        titel: "Zusatzarbeiten gehen unter",
        text: "Vor Ort kommt noch eine Steckdose dazu. Gemacht ja, berechnet nie.",
      },
      {
        titel: "Kein Überblick über den Stand",
        text: "Welche Baustelle wartet auf Material, welche auf den Kunden, welche kann abgerechnet werden?",
      },
    ],
    loesung: {
      titel: "Der Auftrag als Mitte von allem.",
      text: "Aus dem angenommenen Angebot wird mit einem Klick ein Auftrag. Darin sammelt sich alles: Termine, eingeplante Leute, Material, Fotos, Stunden, Zusatzarbeiten. Jeder Auftrag hat einen klaren Stand – du siehst sofort, wo es hakt.",
      punkte: [
        "Angebot wird mit einem Klick zum Auftrag",
        "Klarer Stand: geplant, läuft, wartet, fertig, abgerechnet",
        "Zusatzarbeiten vor Ort erfassen und gleich mit abrechnen",
        "Checklisten pro Auftragsart – passend zu deinem Gewerk",
      ],
    },
    detail: {
      kopf: "Auftrag A-2026-118",
      titel: "Bad sanieren · Fam. Krüger",
      sub: "Gartenstr. 3 · Start Montag, 7:30 Uhr",
      status: { text: "läuft", ton: "sky" },
      zeilen: [
        { label: "Team", wert: "Lukas, Mia" },
        { label: "Material", wert: "vollständig im Lager" },
        { label: "Stunden", wert: "18,5 von 42 geplant" },
        { label: "Zusatzarbeit", wert: "1× Steckdose am Spiegel", hervor: true },
        { label: "Rechnung", wert: "wird bei Abnahme vorbereitet" },
      ],
      fuss: { icon: "check", text: "Checkliste Bad: 9 von 14 Punkten erledigt." },
    },
    schritte: [
      {
        titel: "Angebot angenommen",
        text: "Der Kunde sagt Ja – mit Unterschrift online oder auf Papier. Aus dem Angebot wird der Auftrag.",
      },
      {
        titel: "Einplanen",
        text: "Macher schlägt Termine und passende Leute vor und prüft, ob das Material da ist.",
      },
      {
        titel: "Arbeiten",
        text: "Das Team sieht den Auftrag auf dem Handy, macht Fotos, erfasst Zeiten und Zusatzarbeiten.",
      },
      {
        titel: "Abschließen",
        text: "Abnahme mit Unterschrift, die Rechnung wird vorbereitet, alles ist sauber dokumentiert.",
      },
    ],
    automatisch: [
      "macht aus dem angenommenen Angebot einen Auftrag",
      "setzt den Stand automatisch weiter",
      "meldet fehlendes Material vor dem Start",
      "sammelt Zusatzarbeiten für die Rechnung",
      "bereitet die Rechnung bei Abschluss vor",
    ],
    geraete: {
      handy: [
        "Auftrag mit Adresse, Plänen und Checkliste",
        "Zusatzarbeit mit Foto erfassen",
        "Abnahme mit Unterschrift auf dem Handy",
      ],
      computer: [
        "Auftragsliste nach Stand sortiert",
        "Alle Unterlagen eines Auftrags an einer Stelle",
        "Geplante und tatsächliche Stunden und Material",
      ],
      handyVisual: {
        kopf: "Auftrag · heute",
        titel: "Bad sanieren",
        sub: "Fam. Krüger · Gartenstr. 3",
        tags: [
          { text: "läuft", ton: "sky" },
          { text: "Material da", ton: "moss" },
        ],
        felder: [
          { label: "Checkliste", wert: "9 / 14 erledigt" },
          { label: "Stunden", wert: "18,5 Std." },
          { label: "Zusatzarbeit", wert: "1 erfasst" },
        ],
        aktion: { icon: "plus", text: "Zusatzarbeit erfassen" },
      },
    },
    gewerke: [
      { slug: "fliesenleger", text: "Vom Untergrund bis zur Verfugung – jeder Schritt mit Checkliste." },
      { slug: "tischler", text: "Werkstatt und Montage im selben Auftrag." },
      { slug: "bau", text: "Große Baustellen mit vielen Abschnitten im Blick behalten." },
    ],
    kunde: {
      slug: "tischlerei-weber",
      text: "Wie eine Tischlerei jeden Auftrag von der Werkstatt bis zur Montage verfolgt.",
    },
    faq: [
      {
        frage: "Kann ein Auftrag mehrere Termine und Teams haben?",
        antwort:
          "Ja. Ein Auftrag kann beliebig viele Einsätze haben – zum Beispiel Rohinstallation, Fliesen und Endmontage mit unterschiedlichen Leuten.",
      },
      {
        frage: "Wie erfasse ich Zusatzarbeiten?",
        antwort:
          "Direkt auf dem Handy: Foto machen, kurz beschreiben, Zeit und Material eintragen. Auf Wunsch unterschreibt der Kunde gleich. Die Zusatzarbeit landet automatisch in der Rechnung.",
      },
      {
        frage: "Gibt es Vorlagen für typische Aufträge?",
        antwort:
          "Ja. Beim Start richtet Handwerk OS Auftragsarten passend zu deinem Gewerk ein – mit Checklisten, Material und Zeitansätzen. Du passt sie jederzeit an.",
      },
      {
        frage: "Kann der Kunde den Stand seines Auftrags sehen?",
        antwort:
          "Wenn du willst, bekommt der Kunde Nachrichten zu wichtigen Schritten: Termin bestätigt, Team unterwegs, Arbeit fertig.",
      },
    ],
    verwandt: ["einsatzplanung", "dokumentation", "rechnungen"],
  },

  aufmass: {
    icon: "ruler",
    kurz: "Räume vor Ort ausmessen, Flächen und Laufmeter automatisch berechnen und ins Angebot übernehmen.",
    enthalten: ["Besichtigungen", "Raumbuch", "Flächen & Laufmeter"],
    meta: {
      title: "Aufmaß-App für Handwerker – messen, rechnen, ins Angebot",
      description:
        "Aufmaß direkt auf dem Handy: Räume anlegen, Maße eingeben, Abzüge für Fenster und Türen. Handwerk OS rechnet Flächen und Laufmeter und übernimmt sie ins Angebot.",
    },
    hero: {
      titel: "Aufmaß machen. Nicht abtippen.",
      problem:
        "Du misst vor Ort, schreibst auf einen Block – und abends tippst du alles ins Angebot. Dabei geht immer mal ein Maß verloren.",
      loesung:
        "Mit Handwerk OS nimmst du das Aufmaß direkt auf dem Handy auf. Flächen, Laufmeter und Abzüge rechnet Handwerk OS selbst und übernimmt sie ins Angebot.",
    },
    visual: {
      bereich: "Aufträge",
      titel: "Aufmaß · Fam. Krüger",
      untertitel: "6 Räume",
      kennzahlen: [
        ["38,2 m²", "Boden"],
        ["112,6 m²", "Wand netto"],
        ["41,3 lfm", "Sockel"],
      ],
      liste: {
        ueberschrift: "Räume",
        zeilen: [
          { titel: "Bad OG", sub: "2,40 × 3,10 m · Höhe 2,50 m", wert: "7,44 m²", ton: "moss" },
          { titel: "Flur OG", sub: "1,20 × 5,80 m · 3 Türen abgezogen", wert: "6,96 m²", ton: "moss" },
          { titel: "Gäste-WC", sub: "Maße fehlen noch", tag: "offen", ton: "signal" },
        ],
      },
      hinweis: {
        icon: "file",
        ton: "sky",
        titel: "Bereit fürs Angebot:",
        text: "Mengen aus 5 von 6 Räumen können übernommen werden.",
      },
    },
    problemTitel: "Gemessen ist schnell. Danach fängt die Arbeit erst an.",
    probleme: [
      {
        titel: "Der Zettel mit den Maßen",
        text: "Bad 2,40 × 3,10, Fenster abziehen – war das 1,20 oder 1,26? Der Block liegt im Auto, das Foto ist unscharf.",
      },
      {
        titel: "Abends nochmal rechnen",
        text: "Wandflächen minus Türen und Fenster, Sockel in Laufmetern, Verschnitt drauf. Jedes Mal per Hand.",
      },
      {
        titel: "Zweimal hinfahren",
        text: "Ein Maß fehlt. Also nochmal zum Kunden – eine Stunde weg, die keiner bezahlt.",
      },
      {
        titel: "Angebot und Abrechnung passen nicht",
        text: "Am Ende wurde mehr verlegt als angeboten. Ohne sauberes Aufmaß kannst du es kaum belegen.",
      },
    ],
    loesung: {
      titel: "Raum für Raum – direkt ins Angebot.",
      text: "Du legst vor Ort die Räume an und tippst Länge, Breite und Höhe ein – oder sprichst sie ein. Handwerk OS rechnet Boden- und Wandflächen, zieht Fenster und Türen ab und ermittelt Laufmeter für Sockel und Kanten. Mit einem Tipp werden die Mengen zu Positionen im Angebot.",
      punkte: [
        "Räume mit Länge, Breite und Höhe – oder als freie Fläche",
        "Abzüge für Fenster, Türen und Nischen",
        "Flächen in m², Kanten und Sockel in Laufmetern",
        "Fotos und Skizze pro Raum",
        "Mengen gehen ins Angebot und später in die Abrechnung",
      ],
    },
    detail: {
      kopf: "Aufmaß · Raum 3 von 6",
      titel: "Bad OG",
      sub: "2,40 m × 3,10 m · Raumhöhe 2,50 m",
      status: { text: "vollständig", ton: "moss" },
      zeilen: [
        { label: "Bodenfläche", wert: "7,44 m²" },
        { label: "Wandfläche brutto", wert: "27,50 m²" },
        { label: "Abzug Fenster + Tür", wert: "– 2,78 m²" },
        { label: "Wandfläche netto", wert: "24,72 m²", hervor: true },
        { label: "Sockel", wert: "10,15 lfm" },
      ],
      fuss: { icon: "camera", text: "4 Fotos und eine Skizze zum Raum gespeichert." },
    },
    schritte: [
      {
        titel: "Räume anlegen",
        text: "Vor Ort tippst du die Räume an: Bad, Flur, Küche. Mit Vorlagen für dein Gewerk.",
      },
      {
        titel: "Maße eingeben",
        text: "Länge, Breite, Höhe eintippen oder einsprechen. Fenster und Türen als Abzug dazu.",
      },
      {
        titel: "Handwerk OS rechnet",
        text: "Flächen, Laufmeter und Verschnitt sind sofort da – ohne Taschenrechner.",
      },
      {
        titel: "Ins Angebot übernehmen",
        text: "Die Mengen werden zu Positionen. Du prüfst nur noch die Preise.",
      },
    ],
    automatisch: [
      "rechnet Boden- und Wandflächen",
      "zieht Fenster, Türen und Nischen ab",
      "ermittelt Laufmeter für Sockel, Kanten und Fugen",
      "schlägt Verschnitt passend zum Material vor",
      "übernimmt Mengen ins Angebot",
      "vergleicht später Aufmaß und verbaute Menge",
    ],
    geraete: {
      handy: [
        "Aufmaß beim Kunden – auch ohne Netz",
        "Maße eintippen oder einsprechen",
        "Fotos und Skizze pro Raum",
      ],
      computer: [
        "Alle Räume und Mengen als Übersicht",
        "Aufmaß ausdrucken oder dem Kunden schicken",
        "Mengen ins Angebot übernehmen",
      ],
      handyVisual: {
        kopf: "Aufmaß · Fam. Krüger",
        titel: "Bad OG",
        sub: "Raum 3 von 6",
        tags: [
          { text: "7,44 m² Boden", ton: "moss" },
          { text: "10,15 lfm Sockel", ton: "sky" },
        ],
        felder: [
          { label: "Länge", wert: "3,10 m" },
          { label: "Breite", wert: "2,40 m" },
          { label: "Höhe", wert: "2,50 m" },
          { label: "Abzüge", wert: "Fenster, Tür" },
        ],
        aktion: { icon: "mic", text: "Maß einsprechen" },
      },
    },
    gewerke: [
      { slug: "maler", text: "Wand- und Deckenflächen mit Abzügen – fürs Angebot und die Abrechnung." },
      { slug: "fliesenleger", text: "Boden, Wand, Sockel und Verschnitt für jeden Raum." },
      { slug: "galabau", text: "Flächen für Pflaster, Rasen und Beete, Kanten in Laufmetern." },
    ],
    kunde: {
      slug: "malerei-koch",
      text: "Wie ein Malerbetrieb mit dem Aufmaß auf dem Handy Angebote noch am selben Tag verschickt.",
    },
    werkzeug: "angebots-rechner",
    faq: [
      {
        frage: "Funktioniert das Aufmaß auch ohne Netz?",
        antwort:
          "Ja. Im Keller oder im Rohbau ist oft kein Empfang. Du arbeitest normal weiter, Handwerk OS gleicht alles ab, sobald wieder Netz da ist.",
      },
      {
        frage: "Kann ich Dachschrägen und schräge Wände erfassen?",
        antwort:
          "Ja. Dachschrägen, Giebel und unregelmäßige Flächen gibst du als Teilflächen ein – Dreieck, Trapez oder frei. Handwerk OS rechnet sie zusammen.",
      },
      {
        frage: "Kann ich nach Aufmaß abrechnen?",
        antwort:
          "Ja. Das Aufmaß bleibt beim Auftrag. Am Ende vergleichst du angebotene und verbaute Mengen und rechnest nach tatsächlichem Aufmaß ab.",
      },
      {
        frage: "Gibt es Vorlagen für mein Gewerk?",
        antwort:
          "Ja. Maler sehen Wand und Decke, Fliesenleger Boden, Wand und Sockel, Gartenbauer Flächen und Kanten. Eigene Vorlagen kannst du jederzeit anlegen.",
      },
    ],
    verwandt: ["kalkulation", "angebote", "dokumentation"],
  },

  kalkulation: {
    icon: "calculator",
    kurz: "Mit echtem Stundensatz und aktuellen Materialpreisen rechnen – und vorher wissen, was übrig bleibt.",
    enthalten: ["Stundensätze", "Zeitansätze", "Materialaufschlag"],
    meta: {
      title: "Kalkulation für Handwerker – wissen, was ein Auftrag bringt",
      description:
        "Kalkuliere mit deinem echten Stundensatz, aktuellen Materialpreisen und eigenen Zeitansätzen. Handwerk OS zeigt dir vor dem Angebot, was ein Auftrag kostet und was er bringt.",
    },
    hero: {
      titel: "Wissen, was ein Auftrag bringt – bevor du ihn annimmst.",
      problem:
        "Viele Preise kommen aus dem Bauch: „Haben wir immer so gemacht.“ Ob am Ende etwas übrig bleibt, merkst du erst, wenn es zu spät ist.",
      loesung:
        "Handwerk OS rechnet mit deinem echten Stundensatz, aktuellen Materialpreisen und deinen Zeitansätzen. Du siehst vor dem Angebot, was der Auftrag kostet und was er bringt.",
    },
    visual: {
      bereich: "Aufträge",
      titel: "Kalkulation · Wallbox 11 kW",
      untertitel: "Angebot AN-2026-071",
      kennzahlen: [
        ["1.538 €", "Preis netto"],
        ["5,5 Std.", "Lohn"],
        ["347 €", "Deckungsbeitrag"],
      ],
      liste: {
        ueberschrift: "Positionen",
        zeilen: [
          { titel: "Wallbox 11 kW inkl. Montage", sub: "Material + 2,5 Std.", wert: "894,00 €", ton: "sky" },
          { titel: "Zuleitung NYM-J 5×6 mm²", sub: "18 m · inkl. Verlegung", wert: "468,40 €", ton: "sky" },
          { titel: "Anfahrt und Inbetriebnahme", sub: "14 km · Protokoll", wert: "176,00 €", ton: "sky" },
        ],
      },
      hinweis: {
        icon: "chart",
        ton: "moss",
        titel: "Passt:",
        text: "Der Preis liegt über deinen Kosten. Stundensatz 68 € aus deinen Betriebszahlen.",
      },
    },
    problemTitel: "Ein Angebot ist schnell geschrieben. Ein guter Preis nicht.",
    probleme: [
      {
        titel: "Der Stundensatz von vor fünf Jahren",
        text: "Löhne, Sprit und Versicherungen sind gestiegen. Der Stundensatz im Angebot nicht.",
      },
      {
        titel: "Materialpreise von gestern",
        text: "Kupfer hat sich bewegt, der Großhändler hat neue Listen. Im Angebot stehen noch die alten Preise.",
      },
      {
        titel: "Fahrt und Rüstzeit vergessen",
        text: "45 Minuten Anfahrt, Gerüst stellen, Baustelle einrichten – steht nirgends im Angebot.",
      },
      {
        titel: "Jeder rechnet anders",
        text: "Der Chef kalkuliert anders als der Meister. Gleiche Arbeit, unterschiedlicher Preis.",
      },
    ],
    loesung: {
      titel: "Kalkulieren mit echten Zahlen.",
      text: "Du hinterlegst einmal deinen Stundensatz, deine Zeitansätze und deinen Materialaufschlag. Handwerk OS rechnet jede Position daraus: Lohn, Material, Fahrt, Gerät. Am Ende siehst du Kosten, Preis und was übrig bleibt – bevor das Angebot rausgeht.",
      punkte: [
        "Stundensatz aus deinen echten Kosten",
        "Zeitansätze pro Leistung, die du selbst pflegst",
        "Aktuelle Materialpreise aus deinen Artikeln",
        "Fahrt, Rüstzeit und Entsorgung als eigene Posten",
        "Deckungsbeitrag pro Auftrag – schon vor dem Angebot",
      ],
    },
    detail: {
      kopf: "Kalkulation · Angebot AN-2026-071",
      titel: "Wallbox 11 kW montieren",
      sub: "inkl. Zuleitung 18 m · Stundensatz 68 €",
      status: { text: "lohnt sich", ton: "moss" },
      zeilen: [
        { label: "Lohn (5,5 Std.)", wert: "374,00 €" },
        { label: "Material inkl. Aufschlag", wert: "1.126,40 €" },
        { label: "Anfahrt", wert: "38,00 €" },
        { label: "Angebotspreis netto", wert: "1.538,40 €", hervor: true },
        { label: "Deckungsbeitrag", wert: "346,66 €" },
      ],
      fuss: { icon: "chart", text: "Ähnliche Aufträge haben im Schnitt 0,8 Std. länger gedauert als geplant." },
    },
    schritte: [
      {
        titel: "Grundlagen einmal festlegen",
        text: "Stundensatz, Zeitansätze und Materialaufschlag. Der kostenlose Stundensatz-Rechner hilft beim Start.",
      },
      {
        titel: "Leistungen zusammenstellen",
        text: "Aus Aufmaß oder Leistungsvorlage entstehen Positionen mit Menge, Zeit und Material.",
      },
      {
        titel: "Ergebnis prüfen",
        text: "Kosten, Preis und Deckungsbeitrag auf einen Blick. Passt etwas nicht, siehst du sofort, woran es liegt.",
      },
      {
        titel: "Angebot erstellen",
        text: "Die Kalkulation bleibt im Hintergrund. Der Kunde sieht ein sauberes Angebot.",
      },
    ],
    automatisch: [
      "rechnet Lohn, Material und Fahrt pro Position",
      "nimmt aktuelle Preise aus deinen Artikeln",
      "warnt, wenn ein Preis unter deinen Kosten liegt",
      "zeigt aus der Nachkalkulation, wo Zeitansätze nicht passen",
      "berechnet Fahrtkosten nach Entfernung",
    ],
    geraete: {
      handy: [
        "Schnellkalkulation direkt beim Kunden",
        "Positionen aus dem Aufmaß übernehmen",
        "Preise nur für die, die sie sehen dürfen",
      ],
      computer: [
        "Ausführliche Kalkulation mit allen Positionen",
        "Stundensätze, Zeitansätze und Aufschläge pflegen",
        "Vergleich mit ähnlichen Aufträgen",
      ],
      handyVisual: {
        kopf: "Schnellkalkulation",
        titel: "Wallbox 11 kW",
        sub: "Zuleitung 18 m · Fam. Petersen",
        tags: [{ text: "lohnt sich", ton: "moss" }],
        felder: [
          { label: "Lohn", wert: "374,00 €" },
          { label: "Material", wert: "1.126,40 €" },
          { label: "Preis netto", wert: "1.538,40 €" },
        ],
        aktion: { icon: "file", text: "Angebot erstellen" },
      },
    },
    gewerke: [
      { slug: "elektriker", text: "Kupferpreise schwanken – deine Materialpreise bleiben trotzdem aktuell." },
      { slug: "tischler", text: "Werkstattzeit, Montage und Plattenmaterial getrennt kalkulieren." },
      { slug: "dachdecker", text: "Gerüst, Entsorgung und Wetterpuffer nicht mehr vergessen." },
    ],
    kunde: {
      slug: "tischlerei-weber",
      text: "Wie eine Tischlerei Vor- und Nachkalkulation vergleicht – ohne Tabellen.",
    },
    werkzeug: "stundensatz-rechner",
    faq: [
      {
        frage: "Woher kommt mein Stundensatz?",
        antwort:
          "Du gibst deine Kosten ein: Löhne, Fahrzeuge, Miete, Versicherungen und die Stunden, die wirklich verkauft werden. Handwerk OS rechnet daraus deinen Stundensatz. Für einen ersten Überblick hilft der kostenlose Stundensatz-Rechner.",
      },
      {
        frage: "Kann ich Materialpreise vom Großhändler übernehmen?",
        antwort:
          "Ja. Du liest die Artikellisten deines Großhändlers ein. Danach rechnet die Kalkulation immer mit deinem aktuellen Einkaufspreis.",
      },
      {
        frage: "Sieht der Kunde meine Kalkulation?",
        antwort:
          "Nein. Der Kunde sieht nur das Angebot mit Positionen und Preisen. Kalkulation und Deckungsbeitrag bleiben intern.",
      },
      {
        frage: "Kann ich verschiedene Stundensätze nutzen?",
        antwort:
          "Ja. Zum Beispiel für Meister, Geselle und Azubi oder einen eigenen Satz für Notdienst am Wochenende.",
      },
    ],
    verwandt: ["aufmass", "angebote", "auswertung"],
  },

  angebote: {
    icon: "file",
    kurz: "Macher bereitet Angebote aus Anfrage und Aufmaß vor. Du prüfst, der Kunde unterschreibt online.",
    enthalten: ["Leistungsvorlagen", "Varianten", "Annahme mit Unterschrift"],
    meta: {
      title: "Angebote schreiben im Handwerk – schneller beim Kunden",
      description:
        "Handwerk OS bereitet Angebote aus Anfrage, Aufmaß und deinen Vorlagen vor. Varianten, Online-Annahme mit Unterschrift und freundliches Nachfassen inklusive.",
    },
    hero: {
      titel: "Das Angebot geht raus, solange der Kunde noch wartet.",
      problem:
        "Abends Positionen tippen, Preise suchen, Texte formulieren. Bis das Angebot raus ist, hat der Kunde vielleicht schon woanders unterschrieben.",
      loesung:
        "Macher bereitet das Angebot aus Anfrage, Aufmaß und deinen Vorlagen vor. Du prüfst und schickst es ab – der Kunde nimmt es online mit Unterschrift an.",
    },
    visual: {
      bereich: "Aufträge",
      titel: "Angebote",
      untertitel: "Oktober",
      kennzahlen: [
        ["4", "zum Prüfen"],
        ["7", "beim Kunden"],
        ["3", "angenommen"],
      ],
      liste: {
        ueberschrift: "Beim Kunden",
        zeilen: [
          { titel: "Wohnung streichen · Fam. Hoffmann", sub: "gestern um 19:12 geöffnet", wert: "2.940 €", tag: "geöffnet", ton: "sky" },
          { titel: "Fassade · WEG Am Park", sub: "seit 9 Tagen ohne Antwort", wert: "18.400 €", tag: "nachfassen", ton: "signal" },
          { titel: "Treppenhaus · HV Nordblick", sub: "heute unterschrieben", wert: "3.260 €", tag: "angenommen", ton: "moss" },
        ],
      },
      hinweis: {
        icon: "spark",
        ton: "moss",
        titel: "Vorbereitet:",
        text: "Angebot „Bad sanieren“ für Fam. Krüger aus dem Aufmaß – bereit zum Prüfen.",
      },
    },
    problemTitel: "Angebote schreiben frisst den Feierabend.",
    probleme: [
      {
        titel: "Angebote am Küchentisch",
        text: "Tagsüber Baustelle, abends Angebote. Jedes eine Stunde – wenn nichts dazwischenkommt.",
      },
      {
        titel: "Kopiert und vergessen",
        text: "Das alte Angebot als Vorlage genommen – und den Namen vom letzten Kunden drin gelassen.",
      },
      {
        titel: "Nach dem Versand: Stille",
        text: "Das Angebot ist raus. Ob der Kunde es gelesen hat, weißt du nicht. Nachfassen geht im Alltag unter.",
      },
      {
        titel: "Varianten machen doppelte Arbeit",
        text: "Der Kunde will eine einfache und eine bessere Ausführung sehen. Also zwei Angebote.",
      },
    ],
    loesung: {
      titel: "Vorbereitet von Macher. Geprüft von dir.",
      text: "Aus Anfrage und Aufmaß stellt Macher ein Angebot zusammen: mit deinen Leistungsvorlagen, aktuellen Preisen und passenden Texten. Du änderst, was du anders willst, und schickst es ab. Der Kunde öffnet es auf dem Handy, wählt eine Variante und unterschreibt.",
      punkte: [
        "Leistungsvorlagen für dein Gewerk",
        "Varianten und Wahlpositionen in einem Angebot",
        "Annahme online mit Unterschrift",
        "Du siehst, ob das Angebot geöffnet wurde",
        "Freundliche Nachfrage, wenn sich keiner meldet",
      ],
    },
    detail: {
      kopf: "Angebot AN-2026-083",
      titel: "Wohnung streichen, 3 Zimmer",
      sub: "Fam. Hoffmann · Wände und Decken",
      status: { text: "geöffnet", ton: "sky" },
      zeilen: [
        { label: "Variante Standard", wert: "2.940,00 €" },
        { label: "Variante mit Türen lackieren", wert: "3.615,00 €" },
        { label: "Gültig bis", wert: "30. Oktober" },
        { label: "Geöffnet", wert: "gestern, 19:12 Uhr" },
        { label: "Nachfassen", wert: "Freitag automatisch", hervor: true },
      ],
      fuss: { icon: "spark", text: "Vorbereitet aus dem Aufmaß (112,6 m² Wand) und der Vorlage „Wohnung streichen“." },
    },
    schritte: [
      {
        titel: "Grundlage liegt bereit",
        text: "Anfrage, Fotos und Aufmaß sind schon da. Macher nimmt sie als Grundlage.",
      },
      {
        titel: "Macher bereitet vor",
        text: "Positionen, Mengen, Preise und Texte aus deinen Vorlagen. Fertig zum Prüfen.",
      },
      {
        titel: "Du prüfst und schickst",
        text: "Ändern, was du anders willst. Ein Klick, und das Angebot ist beim Kunden.",
      },
      {
        titel: "Kunde nimmt an",
        text: "Online mit Unterschrift. Aus dem Angebot wird automatisch ein Auftrag.",
      },
    ],
    automatisch: [
      "bereitet das Angebot aus Anfrage und Aufmaß vor",
      "setzt aktuelle Preise und deine Texte ein",
      "meldet dir, wenn das Angebot geöffnet wurde",
      "fragt freundlich nach, wenn sich der Kunde nicht meldet",
      "macht aus dem angenommenen Angebot einen Auftrag",
    ],
    geraete: {
      handy: [
        "Angebot beim Kunden vor Ort fertig machen",
        "Kunde unterschreibt direkt auf dem Display",
        "Sehen, welche Angebote noch offen sind",
      ],
      computer: [
        "Angebote mit Vorlagen und Varianten schreiben",
        "Eigenes Briefpapier und eigene Texte",
        "Übersicht: offen, angenommen, abgelehnt",
      ],
      handyVisual: {
        kopf: "Angebot · beim Kunden",
        titel: "Wohnung streichen",
        sub: "Fam. Hoffmann · 3 Zimmer",
        tags: [{ text: "2 Varianten", ton: "sky" }],
        felder: [
          { label: "Standard", wert: "2.940,00 €" },
          { label: "Mit Türen", wert: "3.615,00 €" },
          { label: "Gültig bis", wert: "30. Oktober" },
        ],
        aktion: { icon: "signature", text: "Unterschreiben lassen" },
      },
    },
    gewerke: [
      { slug: "maler", text: "Flächen aus dem Aufmaß, Farbton und Untergrund als Wahlposition." },
      { slug: "tischler", text: "Wahlpositionen für Holzart, Oberfläche und Beschläge." },
      { slug: "shk", text: "Badsanierung mit Varianten: einfach, gehoben oder barrierearm." },
    ],
    kunde: {
      slug: "malerei-koch",
      text: "Wie ein Malerbetrieb Angebote am selben Tag verschickt statt nach einer Woche.",
    },
    werkzeug: "angebots-rechner",
    faq: [
      {
        frage: "Kann ich mein eigenes Briefpapier verwenden?",
        antwort: "Ja. Logo, Farben und Fußzeile richtest du einmal ein. Jedes Angebot sieht aus wie von dir.",
      },
      {
        frage: "Wie nimmt der Kunde das Angebot an?",
        antwort:
          "Der Kunde bekommt einen Link per Mail. Er sieht das Angebot auf Handy oder Computer, wählt bei Bedarf eine Variante und unterschreibt mit dem Finger. Der Weg über Papier geht natürlich weiterhin.",
      },
      {
        frage: "Was ist, wenn der Kunde nur einen Teil annimmt?",
        antwort:
          "Du kannst Wahlpositionen anbieten, die der Kunde selbst an- oder abwählt. Der Auftrag enthält dann genau das, was angenommen wurde.",
      },
      {
        frage: "Fragt Handwerk OS automatisch beim Kunden nach?",
        antwort:
          "Wenn du willst, ja. Du legst fest, nach wie vielen Tagen eine freundliche Nachfrage rausgeht – oder ob du lieber selbst anrufst.",
      },
    ],
    verwandt: ["aufmass", "kalkulation", "auftraege"],
  },

  dokumentation: {
    icon: "camera",
    kurz: "Fotos, Berichte und Abnahme direkt vom Handy – automatisch beim richtigen Auftrag.",
    enthalten: ["Fotos", "Berichte & Protokolle", "Abnahme & Unterschrift"],
    meta: {
      title: "Baustellendokumentation per App – Fotos, Berichte, Abnahme",
      description:
        "Fotos landen automatisch beim richtigen Auftrag, Notizen gehen per Sprache, Berichte entstehen aus Fotos und Zeiten. Die Abnahme unterschreibt der Kunde auf dem Handy.",
    },
    hero: {
      titel: "Fotos, Berichte, Abnahme. Direkt vom Handy.",
      problem:
        "Fotos liegen auf privaten Handys, Berichte schreibt man abends aus dem Gedächtnis, und bei der Abnahme fehlt die Unterschrift.",
      loesung:
        "In Handwerk OS landet jedes Foto beim richtigen Auftrag. Berichte entstehen aus Fotos, Notizen und Zeiten – die Abnahme unterschreibt der Kunde auf dem Handy.",
    },
    visual: {
      bereich: "Aufträge",
      titel: "Dachfenster · Fr. Lindner",
      untertitel: "Dokumentation",
      kennzahlen: [
        ["14", "Fotos"],
        ["3", "Sprachnotizen"],
        ["1", "Abnahme"],
      ],
      liste: {
        ueberschrift: "Verlauf",
        zeilen: [
          { titel: "Vorher: Bestand Dachfläche", sub: "4 Fotos · Mo 07:58 · Tom", ton: "sand" },
          { titel: "Dampfbremse angeschlossen", sub: "3 Fotos + Notiz · Mo 13:20 · Tom", ton: "sky" },
          { titel: "Abnahme ohne Mängel", sub: "Unterschrift Fr. Lindner · Di 15:46", tag: "unterschrieben", ton: "moss" },
        ],
      },
      hinweis: {
        icon: "file",
        ton: "moss",
        titel: "Erledigt:",
        text: "Abnahmeprotokoll an die Kundin geschickt. Rechnung wird vorbereitet.",
      },
    },
    problemTitel: "Gute Arbeit, die keiner belegen kann.",
    probleme: [
      {
        titel: "Fotos auf privaten Handys",
        text: "Das Foto von der Leitung vor dem Verputzen? Hat Tom gemacht. Tom hat ein neues Handy.",
      },
      {
        titel: "Bericht aus dem Gedächtnis",
        text: "Freitagnachmittag die Woche aufschreiben. Was war am Dienstag nochmal?",
      },
      {
        titel: "Streit um Schäden",
        text: "Der Kunde sagt, der Kratzer im Parkett war vorher nicht da. Beweisen kannst du nichts.",
      },
      {
        titel: "Abnahme ohne Unterschrift",
        text: "Die Arbeit ist fertig, der Kunde ist zufrieden – aber unterschrieben hat er nichts.",
      },
    ],
    loesung: {
      titel: "Dokumentiert, während gearbeitet wird.",
      text: "Dein Team macht Fotos in der App. Jedes Foto bekommt Auftrag, Datum, Uhrzeit und Ort. Notizen gehen per Sprache. Aus Fotos, Notizen und Zeiten wird ein Bericht, den der Kunde bei der Abnahme auf dem Handy unterschreibt.",
      punkte: [
        "Fotos automatisch beim richtigen Auftrag",
        "Vorher, während, nachher – sauber sortiert",
        "Notizen per Sprache statt Tippen",
        "Bautagesbericht und Protokolle aus Vorlagen",
        "Abnahme mit Unterschrift und Mängelliste",
      ],
    },
    detail: {
      kopf: "Abnahmeprotokoll",
      titel: "Dachfenster einbauen · Fr. Lindner",
      sub: "Am Hang 7 · 13. Oktober, 15:40 Uhr",
      status: { text: "unterschrieben", ton: "moss" },
      zeilen: [
        { label: "Fotos", wert: "4 vorher, 10 nachher" },
        { label: "Arbeitszeit", wert: "7,5 Std. · 2 Personen" },
        { label: "Mängel", wert: "keine" },
        { label: "Unterschrift", wert: "Fr. Lindner, 15:46 Uhr", hervor: true },
      ],
      fuss: { icon: "file", text: "Protokoll an die Kundin geschickt, Rechnung wird vorbereitet." },
    },
    schritte: [
      {
        titel: "Fotos machen",
        text: "In der App, nicht in der Galerie. Auftrag, Zeit und Ort hängen automatisch dran.",
      },
      {
        titel: "Notizen einsprechen",
        text: "Kurz sagen, was gemacht wurde und was auffällt. Handwerk OS schreibt mit.",
      },
      {
        titel: "Bericht entsteht",
        text: "Aus Fotos, Notizen und Zeiten wird ein Tagesbericht – zum Prüfen, nicht zum Schreiben.",
      },
      {
        titel: "Abnahme unterschreiben",
        text: "Der Kunde unterschreibt auf dem Handy. Das Protokoll geht automatisch an ihn raus.",
      },
    ],
    automatisch: [
      "ordnet Fotos dem richtigen Auftrag zu",
      "schreibt Sprachnotizen als Text mit",
      "erstellt Tagesberichte aus Fotos und Zeiten",
      "schickt das Abnahmeprotokoll an den Kunden",
      "stößt nach der Abnahme die Rechnung an",
    ],
    geraete: {
      handy: [
        "Fotos und Videos direkt im Auftrag",
        "Notizen per Sprache",
        "Unterschrift des Kunden auf dem Display",
      ],
      computer: [
        "Alle Fotos eines Auftrags nach Datum",
        "Berichte prüfen und an den Kunden schicken",
        "Eigene Vorlagen für Protokolle anlegen",
      ],
      handyVisual: {
        kopf: "Dokumentation · heute",
        titel: "Dachfenster einbauen",
        sub: "Fr. Lindner · Am Hang 7",
        tags: [
          { text: "14 Fotos", ton: "sky" },
          { text: "keine Mängel", ton: "moss" },
        ],
        felder: [
          { label: "Vorher", wert: "4 Fotos" },
          { label: "Nachher", wert: "10 Fotos" },
          { label: "Notiz", wert: "Anschluss Dampfbremse ok" },
        ],
        aktion: { icon: "signature", text: "Abnahme unterschreiben" },
      },
    },
    gewerke: [
      { slug: "dachdecker", text: "Fotos vom Unterdach, bevor die Ziegel draufkommen." },
      { slug: "elektriker", text: "Leitungswege vor dem Verputzen festhalten." },
      { slug: "shk", text: "Druckprobe und Leitungsführung sauber belegen." },
    ],
    kunde: {
      slug: "dach-hansen",
      text: "Wie ein Dachdeckerbetrieb die Baustellendokumentation komplett vom Handy erledigt.",
    },
    faq: [
      {
        frage: "Landen Firmenfotos dann auf privaten Handys?",
        antwort:
          "Nein. Fotos aus der App liegen beim Auftrag, nicht in der Galerie des Handys. Wer den Betrieb verlässt, nimmt keine Baustellenfotos mit.",
      },
      {
        frage: "Geht das auch im Keller ohne Empfang?",
        antwort: "Ja. Fotos und Notizen werden gespeichert und hochgeladen, sobald wieder Netz da ist.",
      },
      {
        frage: "Kann ich eigene Protokolle anlegen?",
        antwort:
          "Ja. Zum Beispiel Übergabeprotokoll, Prüfprotokoll oder Bautagesbericht. Du legst fest, welche Felder und Fotos Pflicht sind.",
      },
      {
        frage: "Wie lange bleiben Fotos gespeichert?",
        antwort:
          "So lange du sie brauchst. Fotos bleiben beim Auftrag und beim Kunden – auch für Gewährleistung oder spätere Arbeiten am selben Objekt.",
      },
    ],
    verwandt: ["auftraege", "kunden", "rechnungen"],
  },

  rechnungen: {
    icon: "euro",
    kurz: "Die Rechnung entsteht aus Angebot, Stunden, Material und Zusatzarbeiten – auch als E-Rechnung.",
    enthalten: ["Abschlagsrechnungen", "Schlussrechnung", "E-Rechnung"],
    meta: {
      title: "Rechnungen schreiben im Handwerk – direkt aus dem Auftrag",
      description:
        "Handwerk OS bereitet Rechnungen aus Angebot, erfassten Stunden, Material und Zusatzarbeiten vor. Abschläge, Schlussrechnung und E-Rechnung inklusive.",
    },
    hero: {
      titel: "Arbeit fertig. Rechnung fertig.",
      problem:
        "Die Baustelle ist abgeschlossen, aber die Rechnung bleibt liegen. Stundenzettel suchen, Material nachtragen, Zusatzarbeiten vergessen.",
      loesung:
        "Handwerk OS bereitet die Rechnung aus Angebot, Stunden, Material und Zusatzarbeiten vor. Du prüfst und schickst sie ab – auch als E-Rechnung.",
    },
    visual: {
      bereich: "Aufträge",
      titel: "Rechnungen",
      untertitel: "Oktober",
      kennzahlen: [
        ["3", "Entwürfe"],
        ["12", "verschickt"],
        ["2", "Abschläge fällig"],
      ],
      liste: {
        ueberschrift: "Bereit zum Prüfen",
        zeilen: [
          { titel: "Dachfenster · Fr. Lindner", sub: "Abnahme gestern · inkl. Zusatzarbeit", wert: "2.789,36 €", tag: "Entwurf", ton: "sky" },
          { titel: "Bad sanieren · 2. Abschlag", sub: "Fam. Krüger · nach Fliesenarbeiten", wert: "4.200,00 €", tag: "Abschlag", ton: "signal" },
          { titel: "Wartung Heizung · K. Wendt", sub: "Pauschale + 1 Ersatzteil", wert: "214,20 €", tag: "E-Rechnung", ton: "moss" },
        ],
      },
      hinweis: {
        icon: "spark",
        ton: "moss",
        titel: "Vorbereitet:",
        text: "Zusatzarbeit „Innenfutter“ aus der Baustellen-App übernommen.",
      },
    },
    problemTitel: "Die Arbeit ist gemacht. Das Geld noch lange nicht.",
    probleme: [
      {
        titel: "Rechnungen am Wochenende",
        text: "Unter der Woche ist keine Zeit. Also Samstag ins Büro und Stundenzettel abtippen.",
      },
      {
        titel: "Zusatzarbeiten vergessen",
        text: "Die zwei Stunden extra und das zusätzliche Material stehen auf einem Zettel im Wagen. Auf der Rechnung fehlen sie.",
      },
      {
        titel: "Abschläge im Kopf behalten",
        text: "Erster Abschlag bezahlt, zweiter offen. Die Schlussrechnung muss alles richtig abziehen.",
      },
      {
        titel: "Neue Regeln für Rechnungen",
        text: "Geschäftskunden wollen E-Rechnungen. Das alte Programm kann das nicht.",
      },
    ],
    loesung: {
      titel: "Die Rechnung schreibt sich aus dem Auftrag.",
      text: "Alles, was im Auftrag passiert ist, steht schon da: angebotene Leistungen, erfasste Stunden, verbrauchtes Material, Zusatzarbeiten mit Foto. Macher bereitet die Rechnung daraus vor. Abschläge werden in der Schlussrechnung automatisch abgezogen.",
      punkte: [
        "Rechnung aus Angebot, Stunden und Material",
        "Zusatzarbeiten werden nicht mehr vergessen",
        "Abschlags- und Schlussrechnungen mit richtigen Abzügen",
        "E-Rechnung für Geschäftskunden und Behörden",
        "Eigenes Briefpapier, fortlaufende Nummern",
      ],
    },
    detail: {
      kopf: "Rechnung RE-2026-204 · Entwurf",
      titel: "Dachfenster einbauen",
      sub: "Fr. Lindner · Abnahme am 13.10.",
      status: { text: "zum Prüfen", ton: "sky" },
      zeilen: [
        { label: "Leistungen laut Angebot", wert: "2.180,00 €" },
        { label: "Zusatzarbeit Innenfutter", wert: "164,00 €" },
        { label: "Netto", wert: "2.344,00 €" },
        { label: "MwSt. 19 %", wert: "445,36 €" },
        { label: "Gesamt", wert: "2.789,36 €", hervor: true },
      ],
      fuss: { icon: "spark", text: "Zusatzarbeit aus der Baustellen-App übernommen – mit Foto und Unterschrift." },
    },
    schritte: [
      {
        titel: "Auftrag abschließen",
        text: "Abnahme unterschrieben, alle Zeiten und Materialien sind erfasst.",
      },
      {
        titel: "Macher bereitet vor",
        text: "Die Rechnung liegt als Entwurf bereit – mit allen Positionen und Abzügen.",
      },
      {
        titel: "Prüfen und senden",
        text: "Kurz drüberschauen, abschicken. Per Mail, als E-Rechnung oder ausgedruckt.",
      },
      {
        titel: "Zahlung verfolgen",
        text: "Macher behält den Zahlungseingang im Blick und erinnert, wenn nötig.",
      },
    ],
    automatisch: [
      "bereitet die Rechnung nach der Abnahme vor",
      "übernimmt Stunden, Material und Zusatzarbeiten",
      "zieht Abschläge in der Schlussrechnung ab",
      "vergibt fortlaufende Rechnungsnummern",
      "erstellt die E-Rechnung im passenden Format",
    ],
    geraete: {
      handy: [
        "Rechnung direkt nach der Abnahme freigeben",
        "Sehen, welche Rechnungen offen sind",
        "Barzahlung vor Ort erfassen",
      ],
      computer: [
        "Rechnungen prüfen, ändern und versenden",
        "Abschlagspläne für große Aufträge",
        "Übergabe an Steuerbüro und Buchhaltung",
      ],
      handyVisual: {
        kopf: "Rechnung · Entwurf",
        titel: "Dachfenster einbauen",
        sub: "Fr. Lindner · Abnahme heute",
        tags: [{ text: "zum Prüfen", ton: "sky" }],
        felder: [
          { label: "Netto", wert: "2.344,00 €" },
          { label: "MwSt.", wert: "445,36 €" },
          { label: "Gesamt", wert: "2.789,36 €" },
        ],
        aktion: { icon: "check", text: "Freigeben und senden" },
      },
    },
    gewerke: [
      { slug: "galabau", text: "Rechnung am Tag der Abnahme – auch bei vielen kleinen Pflegeaufträgen." },
      { slug: "bau", text: "Abschlagsrechnungen nach Baufortschritt, Schlussrechnung mit allen Abzügen." },
      { slug: "elektriker", text: "Viele Kleinaufträge an einem Tag schnell abrechnen." },
    ],
    kunde: {
      slug: "gruen-werk",
      text: "Wie ein Gartenbaubetrieb Rechnungen am Tag der Abnahme verschickt.",
    },
    faq: [
      {
        frage: "Kann Handwerk OS E-Rechnungen erstellen?",
        antwort:
          "Ja. Für Geschäftskunden und öffentliche Auftraggeber erstellst du die Rechnung als E-Rechnung. Privatkunden bekommen weiter eine normale Rechnung als PDF.",
      },
      {
        frage: "Wie funktionieren Abschlagsrechnungen?",
        antwort:
          "Du legst fest, wann welcher Abschlag fällig ist – zum Beispiel nach Rohinstallation, nach den Fliesen und bei Fertigstellung. In der Schlussrechnung werden alle Abschläge automatisch abgezogen.",
      },
      {
        frage: "Kann ich eine verschickte Rechnung noch ändern?",
        antwort:
          "Eine verschickte Rechnung bleibt, wie sie ist. Brauchst du eine Korrektur, erstellt Handwerk OS eine Gutschrift oder Korrekturrechnung – sauber und nachvollziehbar.",
      },
      {
        frage: "Kann ich Rechnungen an mein Steuerbüro übergeben?",
        antwort: "Ja. Rechnungen und Zahlungen gibst du gesammelt für dein Steuerbüro aus.",
      },
    ],
    verwandt: ["zahlungen", "auftraege", "zeiterfassung"],
  },

  zahlungen: {
    icon: "chart",
    kurz: "Zahlungseingänge werden zugeordnet, offene Rechnungen freundlich erinnert – du gibst Mahnungen frei.",
    enthalten: ["Zahlungsabgleich", "Zahlungserinnerung", "Mahnungen"],
    meta: {
      title: "Offene Rechnungen verfolgen – Zahlungen und Mahnungen im Handwerk",
      description:
        "Handwerk OS ordnet Zahlungseingänge deinen Rechnungen zu, erkennt Teilzahlungen und Skonto und erinnert Kunden freundlich. Mahnungen gehen nur mit deiner Freigabe raus.",
    },
    hero: {
      titel: "Offene Rechnungen? Macher bleibt dran.",
      problem:
        "Rechnungen gehen raus, aber wer hat schon bezahlt? Kontoauszüge abgleichen und Mahnungen schreiben macht keiner gern.",
      loesung:
        "Macher gleicht Zahlungseingänge mit deinen Rechnungen ab, erinnert Kunden freundlich und zeigt dir jeden Morgen, was offen ist.",
    },
    visual: {
      bereich: "Betrieb",
      titel: "Offene Beträge",
      untertitel: "Stand heute",
      kennzahlen: [
        ["7.940 €", "offen"],
        ["1", "überfällig"],
        ["3", "heute bezahlt"],
      ],
      liste: {
        ueberschrift: "Offene Rechnungen",
        zeilen: [
          { titel: "Küche montieren · Hr. Demir", sub: "seit 9 Tagen überfällig", wert: "2.480,00 €", tag: "erinnert", ton: "signal" },
          { titel: "Dachfenster · Fr. Lindner", sub: "fällig am Freitag", wert: "2.789,36 €", tag: "offen", ton: "sky" },
          { titel: "Bad sanieren · Fam. Krüger", sub: "1. Abschlag heute eingegangen", wert: "4.200,00 €", tag: "bezahlt", ton: "moss" },
        ],
      },
      hinweis: {
        icon: "bell",
        ton: "signal",
        titel: "Zur Freigabe:",
        text: "Mahnung an Hr. Demir ist vorbereitet. Freundliche Erinnerung ging vor 5 Tagen raus.",
      },
    },
    problemTitel: "Geld hinterherlaufen ist der unbeliebteste Teil der Arbeit.",
    probleme: [
      {
        titel: "Wer hat eigentlich bezahlt?",
        text: "Am Monatsende sitzt du mit dem Kontoauszug neben der Rechnungsliste und hakst ab.",
      },
      {
        titel: "Mahnen ist unangenehm",
        text: "Den netten Kunden an die Rechnung erinnern? Lieber noch eine Woche warten. Und noch eine.",
      },
      {
        titel: "Teilzahlung und Skonto",
        text: "Der Kunde hat 3 % abgezogen, obwohl die Frist vorbei war. Fällt keinem auf.",
      },
      {
        titel: "Das Geld fehlt in der Kasse",
        text: "Material für den nächsten Auftrag musst du vorstrecken, obwohl genug Geld draußen ist.",
      },
    ],
    loesung: {
      titel: "Offene Beträge im Blick. Ohne Abhaken.",
      text: "Handwerk OS liest die Zahlungseingänge auf deinem Geschäftskonto und ordnet sie den Rechnungen zu. Was nach der Frist nicht bezahlt ist, bekommt eine freundliche Erinnerung in deinem Ton. Erst wenn das nicht hilft, kommt die Mahnung – und die nur mit deiner Freigabe.",
      punkte: [
        "Zahlungseingänge automatisch zugeordnet",
        "Teilzahlungen und Skonto werden erkannt",
        "Freundliche Erinnerung nach der Frist",
        "Mahnungen nur mit deiner Freigabe",
        "Jeden Morgen: was offen ist, was überfällig ist",
      ],
    },
    detail: {
      kopf: "Zahlung · heute eingegangen",
      titel: "Fam. Krüger · RE-2026-187",
      sub: "Bad sanieren, 1. Abschlag",
      status: { text: "zugeordnet", ton: "moss" },
      zeilen: [
        { label: "Rechnungsbetrag", wert: "4.200,00 €" },
        { label: "Eingang", wert: "4.200,00 €" },
        { label: "Verwendungszweck", wert: "RE 187 Krueger" },
        { label: "Offen danach", wert: "0,00 €", hervor: true },
      ],
      fuss: { icon: "spark", text: "Automatisch zugeordnet. Der nächste Abschlag wird nach den Fliesenarbeiten fällig." },
    },
    schritte: [
      {
        titel: "Rechnung geht raus",
        text: "Mit Zahlungsziel und Bankverbindung – wie immer.",
      },
      {
        titel: "Macher gleicht ab",
        text: "Zahlungseingänge werden täglich mit den offenen Rechnungen verglichen.",
      },
      {
        titel: "Erinnerung nach der Frist",
        text: "Ist nichts da, geht eine freundliche Erinnerung raus – automatisch oder nach deinem Okay.",
      },
      {
        titel: "Mahnung, wenn nötig",
        text: "Die nächste Stufe gibt es nur, wenn du sie freigibst.",
      },
    ],
    automatisch: [
      "ordnet Zahlungseingänge den Rechnungen zu",
      "erkennt Teilzahlungen und Skontoabzug",
      "schickt Zahlungserinnerungen nach der Frist",
      "bereitet Mahnungen zur Freigabe vor",
      "zeigt dir jeden Morgen die offenen Beträge",
    ],
    geraete: {
      handy: [
        "Offene Beträge auf einen Blick",
        "Barzahlung vor Ort erfassen",
        "Kunden direkt aus der Liste anrufen",
      ],
      computer: [
        "Offene Rechnungen nach Kunde und Alter",
        "Ton und Fristen für Erinnerungen einstellen",
        "Zahlungen für das Steuerbüro ausgeben",
      ],
      handyVisual: {
        kopf: "Offene Beträge · heute",
        titel: "7.940,80 € offen",
        sub: "5 Rechnungen · 1 überfällig",
        tags: [{ text: "1 überfällig", ton: "gefahr" }],
        felder: [
          { label: "Hr. Demir", wert: "9 Tage überfällig" },
          { label: "Fr. Lindner", wert: "fällig Freitag" },
          { label: "WEG Am Park", wert: "Teilzahlung" },
        ],
        aktion: { icon: "bell", text: "Erinnerung senden" },
      },
    },
    gewerke: [
      { slug: "galabau", text: "Viele kleine Pflegerechnungen – Macher behält alle im Blick." },
      { slug: "bau", text: "Abschläge und Einbehalte sauber verfolgen." },
      { slug: "shk", text: "Wartungsrechnungen an viele Kunden, ohne selbst nachzuhaken." },
    ],
    kunde: {
      slug: "gruen-werk",
      text: "Wie ein Gartenbaubetrieb offene Rechnungen im Griff hat, ohne selbst hinterherzutelefonieren.",
    },
    faq: [
      {
        frage: "Wie kommen die Zahlungen in Handwerk OS?",
        antwort:
          "Du verbindest dein Geschäftskonto. Handwerk OS liest nur die Zahlungseingänge – überweisen kann es nichts.",
      },
      {
        frage: "Kann ich festlegen, wann erinnert wird?",
        antwort:
          "Ja. Du bestimmst Fristen, Ton und Stufen. Für Stammkunden kannst du die automatische Erinnerung auch ganz abschalten.",
      },
      {
        frage: "Was passiert, wenn ein Kunde zu wenig überweist?",
        antwort:
          "Handwerk OS erkennt die Teilzahlung, zeigt dir den offenen Rest und fragt, ob der Abzug in Ordnung war – zum Beispiel Skonto.",
      },
      {
        frage: "Gehen Mahnungen ohne mein Wissen raus?",
        antwort:
          "Nein. Mahnungen gehen nur raus, wenn du sie freigibst. Nur die freundliche erste Erinnerung kannst du automatisch verschicken lassen.",
      },
    ],
    verwandt: ["rechnungen", "kunden", "auswertung"],
  },

  /* ───────────────────────── Planen ───────────────────────── */

  kalender: {
    icon: "calendar",
    kurz: "Ein Kalender für alle. Kunden buchen selbst – nur Zeiten, die zu Plan und Route passen.",
    enthalten: ["Terminbuchung", "Wiederkehrende Termine", "Erinnerungen"],
    meta: {
      title: "Kalender und Terminbuchung für Handwerker",
      description:
        "Ein gemeinsamer Kalender für Büro und Baustelle. Kunden buchen Besichtigungen selbst, Macher bestätigt und erinnert am Vortag. Wartungen planen sich wiederkehrend ein.",
    },
    hero: {
      titel: "Termine finden, ohne fünfmal hin und her zu telefonieren.",
      problem:
        "„Passt Ihnen Dienstag?“ – „Da kann ich nicht.“ – „Mittwoch?“ Jeder Termin kostet drei Anrufe. Und am Ende steht er doch doppelt im Kalender.",
      loesung:
        "Handwerk OS zeigt dem Kunden freie Zeiten, die zu deinem Plan und zur Route passen. Der Kunde bucht selbst, Macher bestätigt und erinnert am Vortag.",
    },
    visual: {
      bereich: "Planen",
      titel: "Donnerstag, 16. Oktober",
      untertitel: "Kalender",
      liste: {
        ueberschrift: "Jana · Termine",
        zeilen: [
          { titel: "08:00 Wartung Gasheizung", sub: "K. Wendt · Birkenweg 8", tag: "jährlich", ton: "sky" },
          { titel: "11:30 Angebot besprechen", sub: "Fr. Lindner · Telefon", tag: "bestätigt", ton: "moss" },
          { titel: "14:30 Besichtigung Bad", sub: "S. Krüger · vom Kunden gebucht", tag: "neu", ton: "signal" },
        ],
      },
      hinweis: {
        icon: "bell",
        ton: "moss",
        titel: "Erinnert:",
        text: "Alle Kunden für morgen haben ihre Erinnerung bekommen.",
      },
    },
    problemTitel: "Ein Termin ist schnell gemacht. Bis er feststeht, dauert es.",
    probleme: [
      {
        titel: "Telefon-Pingpong",
        text: "Termin vorschlagen, Rückruf abwarten, neuer Vorschlag. Für eine Besichtigung von 30 Minuten.",
      },
      {
        titel: "Drei Kalender, keiner stimmt",
        text: "Wandkalender im Büro, Kalender auf dem Handy, Notizbuch vom Meister. Doppelt belegt ist schnell passiert.",
      },
      {
        titel: "Kunde nicht da",
        text: "Du stehst vor der Tür, keiner macht auf. Der Kunde hat den Termin vergessen.",
      },
      {
        titel: "Wartungen vergessen",
        text: "Die jährliche Wartung steht nirgends. Der Kunde ruft erst, wenn die Heizung kalt ist.",
      },
    ],
    loesung: {
      titel: "Ein Kalender für alle – mit Buchung für Kunden.",
      text: "Alle Termine stehen in einem Kalender: Besichtigungen, Einsätze, Wartungen, Urlaub. Für Besichtigungen und Kundendienst schickst du dem Kunden einen Link. Er sieht nur Zeiten, die wirklich passen – auch zur Route deines Teams. Wiederkehrende Termine wie Wartungen legt Handwerk OS selbst an.",
      punkte: [
        "Ein gemeinsamer Kalender für Büro und Baustelle",
        "Kunden buchen selbst – nur passende Zeiten",
        "Bestätigung und Erinnerung am Vortag",
        "Wiederkehrende Termine wie Wartung und Pflege",
        "Abgleich mit deinem Kalender auf dem Handy",
      ],
    },
    detail: {
      kopf: "Terminbuchung · Link an Kundin",
      titel: "Besichtigung Badsanierung",
      sub: "Sabine Krüger · ca. 45 Min.",
      status: { text: "gebucht", ton: "moss" },
      zeilen: [
        { label: "Angeboten", wert: "Di 10:00 · Do 14:30 · Fr 8:00" },
        { label: "Gewählt", wert: "Donnerstag, 14:30 Uhr", hervor: true },
        { label: "Mit", wert: "Jana" },
        { label: "Davor", wert: "Baustelle Gartenstr., 6 Min. entfernt" },
        { label: "Erinnerung", wert: "Mittwoch per Nachricht" },
      ],
      fuss: { icon: "route", text: "Nur Zeiten angeboten, die zur Route von Jana passen." },
    },
    schritte: [
      {
        titel: "Termin anbieten",
        text: "Mit einem Klick bekommt der Kunde einen Link mit passenden Zeiten.",
      },
      {
        titel: "Kunde bucht",
        text: "Er wählt selbst – ohne Anruf. Der Termin steht sofort im Kalender.",
      },
      {
        titel: "Erinnerung",
        text: "Am Vortag bekommt der Kunde eine Erinnerung, dein Team eine Übersicht für morgen.",
      },
      {
        titel: "Verschieben ohne Anruf",
        text: "Ändert sich etwas, verschiebt der Kunde selbst – bis zu einer Frist, die du festlegst.",
      },
    ],
    automatisch: [
      "bietet nur Zeiten an, die zu Plan und Route passen",
      "bestätigt Termine beim Kunden",
      "erinnert Kunden am Vortag",
      "legt Wartungen und wiederkehrende Termine selbst an",
      "meldet Überschneidungen sofort",
    ],
    geraete: {
      handy: [
        "Tagesansicht mit allen Terminen",
        "Termin direkt beim Kunden ausmachen",
        "Abgleich mit deinem Kalender auf dem Handy",
      ],
      computer: [
        "Wochen- und Monatsansicht für alle",
        "Buchbare Zeiten und Termindauer einstellen",
        "Wiederkehrende Termine verwalten",
      ],
      handyVisual: {
        kopf: "Donnerstag, 16. Oktober",
        titel: "Besichtigung Bad",
        sub: "S. Krüger · 14:30 – 15:15",
        tags: [{ text: "vom Kunden gebucht", ton: "moss" }],
        felder: [
          { label: "08:00", wert: "Wartung Wendt" },
          { label: "11:30", wert: "Angebot Lindner" },
          { label: "14:30", wert: "Besichtigung Krüger" },
        ],
        aktion: { icon: "route", text: "Route für heute" },
      },
    },
    gewerke: [
      { slug: "shk", text: "Jährliche Wartungen planen sich selbst ein." },
      { slug: "galabau", text: "Pflegetermine im Rhythmus – wöchentlich, monatlich oder nach Saison." },
      { slug: "fahrzeug-werkstatt", text: "Kunden buchen Werkstatttermine selbst." },
    ],
    kunde: {
      slug: "haustechnik-yilmaz",
      text: "Wie ein SHK-Betrieb seine Wartungstermine fast von selbst planen lässt.",
    },
    faq: [
      {
        frage: "Kann ich meinen Kalender auf dem Handy weiter nutzen?",
        antwort:
          "Ja. Termine aus Handwerk OS erscheinen in deinem gewohnten Kalender. Private Termine kannst du als „belegt“ übernehmen, ohne dass jemand Einzelheiten sieht.",
      },
      {
        frage: "Können Kunden einfach irgendwann buchen?",
        antwort:
          "Nein. Du legst fest, welche Termine buchbar sind, wie lange sie dauern und wie viel Puffer dazwischen liegt. Macher zeigt nur Zeiten, die zu deinem Plan passen.",
      },
      {
        frage: "Wie funktionieren wiederkehrende Termine?",
        antwort:
          "Du legst den Rhythmus fest – zum Beispiel jährliche Wartung im Herbst. Handwerk OS schlägt rechtzeitig Termine vor und fragt beim Kunden an.",
      },
      {
        frage: "Was passiert, wenn ein Kunde absagt?",
        antwort:
          "Der Kunde kann bis zu einer Frist selbst absagen oder verschieben. Die freie Zeit ist sofort im Plan sichtbar.",
      },
    ],
    verwandt: ["einsatzplanung", "telefon", "kunden"],
  },

  einsatzplanung: {
    icon: "route",
    kurz: "Macher schlägt passende Leute für jeden Einsatz vor – mit Blick auf Können, Urlaub, Fahrtzeit und Material.",
    enthalten: ["Mitarbeiterplanung", "Plantafel", "Auslastung", "Automatische Planung"],
    meta: {
      title: "Einsatzplanung für Handwerker – Macher plant mit",
      description:
        "Plantafel für dein Team: Macher schlägt für jeden Einsatz die passenden Mitarbeiter vor – mit Blick auf Qualifikation, Urlaub, Fahrtzeit, Material und Fahrzeug.",
    },
    hero: {
      titel: "Wer fährt morgen wohin? Macher plant mit.",
      problem:
        "Jeden Abend das gleiche Puzzle: Wer ist frei, wer kann das, wo ist das Material, wer hat den Transporter? Und morgens ist dann einer krank.",
      loesung:
        "Macher schlägt dir für jeden Einsatz die passenden Leute vor – mit Blick auf Qualifikation, Urlaub, Fahrtzeit, Material und Fahrzeug. Du bestätigst oder schiebst um.",
    },
    visual: {
      bereich: "Planen",
      titel: "Plan · Mittwoch",
      untertitel: "KW 42",
      kennzahlen: [
        ["86 %", "Auslastung"],
        ["2", "nicht eingeplant"],
        ["1", "krank"],
      ],
      liste: {
        ueberschrift: "Einsätze",
        zeilen: [
          { titel: "Lukas + Mia", sub: "Bad sanieren · Gartenstr. 3", tag: "fest", ton: "sky" },
          { titel: "Ali", sub: "Wallbox Petersen · ab 11:30", tag: "fest", ton: "sky" },
          { titel: "Tom", sub: "krank gemeldet um 06:40", tag: "umplanen", ton: "signal" },
        ],
      },
      hinweis: {
        icon: "spark",
        ton: "moss",
        titel: "Macher-Vorschlag:",
        text: "Kundendienst Fr. Weber → Ali, 15:00 Uhr. Darf das, 8 Min. entfernt, Material im Wagen.",
      },
    },
    problemTitel: "Planen ist Kopfarbeit. Und die ändert sich jeden Morgen.",
    probleme: [
      {
        titel: "Das Puzzle am Abend",
        text: "Nach Feierabend noch eine Stunde Magnete auf der Plantafel umstecken.",
      },
      {
        titel: "Morgens ist einer krank",
        text: "Um 6:40 kommt die Nachricht. Jetzt muss alles umgeplant werden – vom Handy, im Auto.",
      },
      {
        titel: "Der Falsche ist vor Ort",
        text: "Der Azubi steht allein vor dem Zählerschrank. Der Meister ist auf der anderen Seite der Stadt.",
      },
      {
        titel: "Kreuz und quer durch die Stadt",
        text: "Zwei Teams fahren aneinander vorbei, weil keiner auf die Route geschaut hat.",
      },
    ],
    loesung: {
      titel: "Planen mit Vorschlägen statt mit Bauchgefühl.",
      text: "Auf der Plantafel siehst du alle Mitarbeiter und Einsätze der Woche. Macher kennt Qualifikationen, Urlaub, Fahrtzeiten, Material und Fahrzeuge. Für jeden neuen Einsatz bekommst du einen Vorschlag mit Begründung. Fällt jemand aus, zeigt Macher, wer einspringen kann.",
      punkte: [
        "Plantafel für Tag, Woche und Monat",
        "Vorschläge nach Qualifikation, Fahrtzeit und Auslastung",
        "Urlaub, Krankheit und Berufsschule automatisch berücksichtigt",
        "Umplanen per Ziehen – das Team bekommt Bescheid",
        "Material und Fahrzeug werden mitgeprüft",
      ],
    },
    detail: {
      kopf: "Vorschlag für neuen Einsatz",
      titel: "Kundendienst · Fr. Weber",
      sub: "Do 8:00 · ca. 2 Std. · Rauchmelder und Sicherung",
      status: { text: "Vorschlag", ton: "sky" },
      zeilen: [
        { label: "Mitarbeiter", wert: "Tom (Geselle)", hervor: true },
        { label: "Warum Tom", wert: "frei, 12 Min. entfernt" },
        { label: "Qualifikation", wert: "Elektrofachkraft ✓" },
        { label: "Material", wert: "im Wagen von Tom" },
        { label: "Fahrzeug", wert: "Caddy 2" },
      ],
      fuss: { icon: "check", text: "Mit einem Klick bestätigen – Tom bekommt den Einsatz aufs Handy." },
    },
    schritte: [
      {
        titel: "Einsatz kommt rein",
        text: "Aus Auftrag, Wartung oder Kundendienst – mit Dauer, Ort und Anforderungen.",
      },
      {
        titel: "Macher schlägt vor",
        text: "Wer passt, wer ist frei, wer ist in der Nähe – mit Begründung.",
      },
      {
        titel: "Du entscheidest",
        text: "Bestätigen oder per Ziehen auf jemand anderen schieben.",
      },
      {
        titel: "Das Team weiß Bescheid",
        text: "Jeder sieht seinen Plan auf dem Handy. Änderungen kommen als Nachricht.",
      },
    ],
    automatisch: [
      "schlägt passende Mitarbeiter für jeden Einsatz vor",
      "berücksichtigt Urlaub, Krankheit und Berufsschule",
      "prüft Qualifikation, Material und Fahrzeug",
      "plant Routen mit kurzen Fahrtzeiten",
      "zeigt bei Ausfall, wer einspringen kann",
      "benachrichtigt das Team bei Änderungen",
    ],
    geraete: {
      handy: [
        "Mein Plan für heute und morgen",
        "Navigation zum nächsten Einsatz",
        "Änderungen als Nachricht",
      ],
      computer: [
        "Plantafel mit allen Mitarbeitern",
        "Umplanen per Ziehen",
        "Auslastung für die nächsten Wochen",
      ],
      handyVisual: {
        kopf: "Mein Plan · Donnerstag",
        titel: "Kundendienst Fr. Weber",
        sub: "8:00 Uhr · Rauchmelder und Sicherung",
        tags: [
          { text: "neu eingeplant", ton: "sky" },
          { text: "12 Min. Fahrt", ton: "moss" },
        ],
        felder: [
          { label: "Danach", wert: "Wallbox Petersen, 11:30" },
          { label: "Fahrzeug", wert: "Caddy 2" },
          { label: "Material", wert: "im Wagen" },
        ],
        aktion: { icon: "map", text: "Navigation starten" },
      },
    },
    gewerke: [
      { slug: "elektriker", text: "Prüfungen und Arbeiten an Anlagen nur mit befähigten Leuten." },
      { slug: "shk", text: "Kundendienst, Wartung und Baustelle in einem Plan." },
      { slug: "dachdecker", text: "Bei Regen schnell umplanen – Innenarbeiten statt Dach." },
    ],
    kunde: {
      slug: "haustechnik-yilmaz",
      text: "Wie ein SHK-Betrieb Wartungen und Baustellen für das ganze Team in einem Plan führt.",
    },
    faq: [
      {
        frage: "Plant Macher ohne mich?",
        antwort:
          "Nein. Macher schlägt vor, du entscheidest. Wenn du willst, lässt du einfache Fälle wie Wartungen automatisch einplanen.",
      },
      {
        frage: "Woher weiß Macher, wer was kann?",
        antwort:
          "Aus den Qualifikationen deiner Mitarbeiter. Du hinterlegst einmal, wer zum Beispiel Elektrofachkraft ist oder einen Staplerschein hat.",
      },
      {
        frage: "Sehen Mitarbeiter den ganzen Plan?",
        antwort: "Das entscheidest du. Meist sieht jeder seinen eigenen Plan und den seiner Kolonne.",
      },
      {
        frage: "Was passiert bei einer Krankmeldung?",
        antwort:
          "Macher zeigt sofort, welche Einsätze betroffen sind, und schlägt Ersatz vor. Kunden können auf Wunsch automatisch informiert werden.",
      },
    ],
    verwandt: ["kalender", "mitarbeiter", "qualifikationen"],
  },

  /* ───────────────────────── Betrieb ───────────────────────── */

  mitarbeiter: {
    icon: "users",
    kurz: "Profile, Rollen, Urlaub und Krankmeldungen – alles zum Team an einem Ort.",
    enthalten: ["Urlaub & Krankheit", "Rollen & Rechte", "Einarbeitung"],
    meta: {
      title: "Mitarbeiter verwalten im Handwerk – Urlaub, Krankheit, Rechte",
      description:
        "Jeder Mitarbeiter mit Profil, Rolle, Arbeitszeit und Urlaubskonto. Urlaub per App beantragen, Krankmeldungen direkt im Plan, Rechte pro Rolle.",
    },
    hero: {
      titel: "Dein Team. Ohne Zettelwirtschaft.",
      problem:
        "Urlaub auf Zetteln, Krankmeldungen per Kurznachricht, Telefonnummern im Handy vom Chef. Wer wann da ist, weiß nur einer.",
      loesung:
        "In Handwerk OS hat jeder Mitarbeiter ein Profil mit Rolle, Arbeitszeit, Urlaub und Qualifikationen. Urlaub wird per App beantragt, Krankmeldungen landen direkt im Plan.",
    },
    visual: {
      bereich: "Betrieb",
      titel: "Team",
      untertitel: "14 Mitarbeiter",
      kennzahlen: [
        ["11", "im Einsatz"],
        ["2", "im Urlaub"],
        ["1", "krank"],
      ],
      liste: {
        ueberschrift: "Offene Anträge",
        zeilen: [
          { titel: "Lukas · Urlaub 22.–26.12.", sub: "3 Tage, 4 andere auch frei", tag: "prüfen", ton: "signal" },
          { titel: "Mia · Berufsschule Block", sub: "10.–21.11. · automatisch im Plan", tag: "eingetragen", ton: "moss" },
          { titel: "Kevin · erster Arbeitstag", sub: "Montag · Checkliste 3 von 8", tag: "Einarbeitung", ton: "sky" },
        ],
      },
      hinweis: {
        icon: "bell",
        ton: "signal",
        titel: "Achtung:",
        text: "Zwischen den Feiertagen wären nur noch 3 Leute da. Kundendienst einplanen?",
      },
    },
    problemTitel: "Personal führen – nebenbei, zwischen zwei Baustellen.",
    probleme: [
      {
        titel: "Urlaub per Zuruf",
        text: "„Chef, ich bräuchte die erste Augustwoche.“ Zugesagt im Vorbeigehen, vergessen bis August.",
      },
      {
        titel: "Krank um 6:30",
        text: "Die Nachricht kommt auf dein privates Handy. Das Büro erfährt es um neun.",
      },
      {
        titel: "Wer darf was sehen?",
        text: "Der Azubi soll keine Preise sehen, der Meister schon. In der Tabelle sieht jeder alles.",
      },
      {
        titel: "Neue Leute einarbeiten",
        text: "Der Neue fängt Montag an. Zugang, Kleidung, Unterweisung, Werkzeug – alles im Kopf.",
      },
    ],
    loesung: {
      titel: "Alles zum Team an einem Ort.",
      text: "Jeder Mitarbeiter hat ein Profil mit Kontakt, Rolle, Arbeitszeit, Urlaubskonto und Qualifikationen. Urlaub beantragt das Team in der App, du gibst mit einem Tipp frei. Krankmeldungen landen direkt im Plan. Neue Mitarbeiter bekommen eine Checkliste für die ersten Tage.",
      punkte: [
        "Profil mit Rolle, Arbeitszeit und Kontakt",
        "Urlaub per App beantragen und freigeben",
        "Krankmeldung landet direkt in der Planung",
        "Rechte: Jeder sieht nur, was er braucht",
        "Checkliste für neue Mitarbeiter",
      ],
    },
    detail: {
      kopf: "Mitarbeiter",
      titel: "Mia Schulz",
      sub: "Auszubildende Elektronikerin · 2. Lehrjahr",
      status: { text: "im Einsatz", ton: "moss" },
      zeilen: [
        { label: "Arbeitszeit", wert: "Mo–Fr, mittwochs Schule" },
        { label: "Urlaub", wert: "14 von 30 Tagen übrig" },
        { label: "Nächster Urlaub", wert: "04.–08.11. (freigegeben)" },
        { label: "Rechte", wert: "eigene Einsätze, keine Preise" },
        { label: "Unterweisung", wert: "fällig in 3 Wochen", hervor: true },
      ],
      fuss: { icon: "users", text: "Mit Lukas bei „Bad sanieren“ eingeplant bis Freitag." },
    },
    schritte: [
      {
        titel: "Team anlegen",
        text: "Mitarbeiter einladen oder aus einer Liste übernehmen. Rolle und Arbeitszeit festlegen.",
      },
      {
        titel: "App aufs Handy",
        text: "Jeder bekommt Zugang zu seinem Plan, seinen Zeiten und seinem Urlaub.",
      },
      {
        titel: "Urlaub und Krankheit",
        text: "Anträge kommen per App, Freigabe mit einem Tipp. Alles erscheint sofort im Plan.",
      },
      {
        titel: "Im Blick behalten",
        text: "Urlaubskonten, Überstunden und fällige Unterweisungen auf einen Blick.",
      },
    ],
    automatisch: [
      "trägt Urlaub und Krankheit in den Plan ein",
      "warnt, wenn zu viele gleichzeitig frei haben wollen",
      "rechnet Urlaubskonten mit",
      "erinnert an Ende der Probezeit und fällige Unterweisungen",
      "legt für neue Mitarbeiter die Einarbeitung an",
    ],
    geraete: {
      handy: [
        "Eigener Plan, Zeiten und Urlaubskonto",
        "Urlaub beantragen, krank melden",
        "Ansprechpartner und Infos aus dem Betrieb",
      ],
      computer: [
        "Teamübersicht mit Rollen und Rechten",
        "Urlaubskalender für alle",
        "Daten für die Lohnabrechnung ausgeben",
      ],
      handyVisual: {
        kopf: "Mein Bereich",
        titel: "Mia Schulz",
        sub: "Auszubildende · 2. Lehrjahr",
        tags: [{ text: "14 Tage Urlaub übrig", ton: "sky" }],
        felder: [
          { label: "Nächster Urlaub", wert: "04.–08. Nov." },
          { label: "Diese Woche", wert: "38,5 Std." },
          { label: "Berufsschule", wert: "mittwochs" },
        ],
        aktion: { icon: "calendar", text: "Urlaub beantragen" },
      },
    },
    gewerke: [
      { slug: "bau", text: "Große Kolonnen mit Polier, Gesellen und Helfern." },
      { slug: "galabau", text: "Saisonkräfte schnell an- und abmelden." },
      { slug: "friseur-dienstleistungen", text: "Arbeitszeiten und Urlaub im Salon sauber planen." },
    ],
    kunde: {
      slug: "elektro-brandt",
      text: "Wie ein Elektrobetrieb Urlaub und Krankmeldungen für das ganze Team ohne Zettel regelt.",
    },
    faq: [
      {
        frage: "Brauchen alle Mitarbeiter ein Smartphone?",
        antwort:
          "Es ist praktisch, aber kein Muss. Wer kein Firmenhandy hat, kann die App auf dem eigenen Handy nutzen – oder der Vorarbeiter erfasst für ihn mit.",
      },
      {
        frage: "Können Mitarbeiter Preise oder Löhne sehen?",
        antwort: "Nur wenn du es erlaubst. Rechte vergibst du pro Rolle: Monteur, Vorarbeiter, Büro, Chef.",
      },
      {
        frage: "Macht Handwerk OS die Lohnabrechnung?",
        antwort:
          "Nein. Handwerk OS sammelt Stunden, Urlaub und Krankheit sauber und gibt sie für dein Lohnbüro oder Steuerbüro aus.",
      },
      {
        frage: "Was passiert, wenn jemand den Betrieb verlässt?",
        antwort: "Du sperrst den Zugang mit einem Klick. Fotos, Zeiten und Berichte bleiben im Betrieb.",
      },
    ],
    verwandt: ["zeiterfassung", "qualifikationen", "einsatzplanung"],
  },

  zeiterfassung: {
    icon: "clock",
    kurz: "Arbeitszeit, Fahrtzeit und Pausen auf der Baustelle erfassen – direkt beim richtigen Auftrag.",
    enthalten: ["Arbeitszeiten", "Fahrtzeiten", "Pausen", "Überstunden"],
    meta: {
      title: "Zeiterfassung im Handwerk – per App auf der Baustelle",
      description:
        "Arbeitszeit, Fahrtzeit und Pausen per App erfassen – direkt beim Auftrag. Für Lohnbüro und Nachkalkulation. Mit Erinnerung bei vergessenem Stempeln.",
    },
    hero: {
      titel: "Stunden erfassen auf der Baustelle. Nicht am Freitagabend.",
      problem:
        "Stundenzettel werden am Ende der Woche aus dem Gedächtnis ausgefüllt. Fahrtzeit, Pausen und welche Baustelle – alles grob geschätzt.",
      loesung:
        "Mit Handwerk OS startet dein Team die Zeit in der App, wenn es auf der Baustelle ankommt. Fahrt, Arbeit und Pause werden getrennt – fürs Lohnbüro und die Nachkalkulation.",
    },
    visual: {
      bereich: "Betrieb",
      titel: "Zeiten · Dienstag",
      untertitel: "14. Oktober",
      kennzahlen: [
        ["86,5 Std.", "heute gesamt"],
        ["9,2 Std.", "Fahrtzeit"],
        ["1", "nicht bestätigt"],
      ],
      liste: {
        ueberschrift: "Mitarbeiter",
        zeilen: [
          { titel: "Lukas Berger", sub: "Bad sanieren 7:15 · Fahrt 1:00", wert: "8:15", tag: "bestätigt", ton: "moss" },
          { titel: "Ali Kaya", sub: "Wallbox 5:30 · Kundendienst 2:00", wert: "8:20", tag: "bestätigt", ton: "moss" },
          { titel: "Kevin Roth", sub: "Ende fehlt · läuft seit 07:10", wert: "–", tag: "nachfragen", ton: "signal" },
        ],
      },
      hinweis: {
        icon: "bell",
        ton: "signal",
        titel: "Erinnert:",
        text: "Kevin hat vergessen, die Zeit zu beenden. Er hat eine Nachricht bekommen.",
      },
    },
    problemTitel: "Stundenzettel sind meistens geschätzt. Und das kostet Geld.",
    probleme: [
      {
        titel: "Der Freitags-Stundenzettel",
        text: "„Dienstag war ich … bei Krüger? Oder bei Demir?“ Geschätzt wird großzügig – in beide Richtungen.",
      },
      {
        titel: "Fahrtzeit oder Arbeitszeit?",
        text: "Fahrt vom Lager zur Baustelle, Material holen beim Großhändler – wie wird das gezählt?",
      },
      {
        titel: "Pausen vergessen",
        text: "Neun Stunden auf dem Zettel, keine Pause eingetragen. Fällt erst auf, wenn jemand nachfragt.",
      },
      {
        titel: "Stunden fehlen beim Auftrag",
        text: "Die Zeiten sind im Lohnbüro, aber nicht in der Nachkalkulation. Ob der Auftrag sich gelohnt hat, weiß keiner.",
      },
    ],
    loesung: {
      titel: "Ein Tipp beim Ankommen. Ein Tipp beim Gehen.",
      text: "Dein Team startet die Zeit in der App beim richtigen Auftrag. Fahrt, Arbeit und Pause werden getrennt erfasst. Wer vergisst zu stempeln, wird erinnert. Abends bestätigt jeder seine Zeiten – und die Stunden landen gleichzeitig im Lohnbüro und beim Auftrag.",
      punkte: [
        "Zeit starten beim Auftrag – mit einem Tipp",
        "Fahrt, Arbeit und Pause getrennt",
        "Erinnerung bei vergessenem Start oder Ende",
        "Pausen und Höchstarbeitszeit werden geprüft",
        "Stunden direkt im Auftrag und für die Lohnabrechnung",
      ],
    },
    detail: {
      kopf: "Tageszettel · Dienstag, 14.10.",
      titel: "Lukas Berger",
      sub: "Geselle · Caddy 2",
      status: { text: "bestätigt", ton: "moss" },
      zeilen: [
        { label: "Fahrt Lager → Gartenstr.", wert: "07:05–07:30 · 0:25" },
        { label: "Bad sanieren · Krüger", wert: "07:30–15:15 · 7:15" },
        { label: "Pause", wert: "11:30–12:00 · 0:30" },
        { label: "Fahrt zum Großhandel", wert: "15:15–15:50 · 0:35" },
        { label: "Gesamt ohne Pause", wert: "8:15 Std.", hervor: true },
      ],
      fuss: { icon: "clipboard", text: "7:15 Std. dem Auftrag „Bad sanieren“ zugeordnet." },
    },
    schritte: [
      {
        titel: "Ankommen und starten",
        text: "Ein Tipp in der App. Der Auftrag ist schon ausgewählt, weil er im Plan steht.",
      },
      {
        titel: "Wechseln statt aufschreiben",
        text: "Pause, Fahrt, nächste Baustelle – ein Tipp, und die Zeit läuft auf dem richtigen Posten weiter.",
      },
      {
        titel: "Tag bestätigen",
        text: "Abends sieht jeder seine Zeiten und bestätigt sie. Fehler fallen sofort auf.",
      },
      {
        titel: "Weitergeben",
        text: "Die Stunden gehen an die Lohnabrechnung und in die Nachkalkulation des Auftrags.",
      },
    ],
    automatisch: [
      "wählt den Auftrag aus dem Plan vor",
      "erinnert bei vergessenem Start oder Ende",
      "trennt Fahrt, Arbeit und Pause",
      "prüft Pausen und Höchstarbeitszeit",
      "bucht Stunden direkt auf den Auftrag",
      "rechnet Überstunden und Arbeitszeitkonten",
    ],
    geraete: {
      handy: [
        "Zeit starten, wechseln, beenden",
        "Tageszettel prüfen und bestätigen",
        "Eigene Stunden und Überstunden sehen",
      ],
      computer: [
        "Stunden aller Mitarbeiter nach Tag und Auftrag",
        "Korrekturen nur mit Begründung",
        "Ausgabe für Lohnbüro und Steuerbüro",
      ],
      handyVisual: {
        kopf: "Zeiterfassung · läuft",
        titel: "Bad sanieren",
        sub: "Fam. Krüger · seit 07:30 Uhr",
        tags: [
          { text: "Arbeit", ton: "moss" },
          { text: "4:12 Std.", ton: "sky" },
        ],
        felder: [
          { label: "Fahrt heute", wert: "0:25" },
          { label: "Pause", wert: "noch offen" },
          { label: "Diese Woche", wert: "22:40 Std." },
        ],
        aktion: { icon: "clock", text: "Pause starten" },
      },
    },
    gewerke: [
      { slug: "bau", text: "Der Polier erfasst die Zeiten der ganzen Kolonne auf einmal." },
      { slug: "galabau", text: "Viele kleine Pflegeeinsätze am Tag sauber trennen." },
      { slug: "elektriker", text: "Kundendienst-Stunden sofort abrechenbar." },
    ],
    kunde: {
      slug: "tischlerei-weber",
      text: "Wie eine Tischlerei Werkstatt- und Montagezeiten für jede Nachkalkulation nutzt.",
    },
    faq: [
      {
        frage: "Muss ich die Arbeitszeit überhaupt erfassen?",
        antwort:
          "Arbeitgeber in Deutschland müssen die Arbeitszeit ihrer Mitarbeiter erfassen. Wie genau, klärst du am besten mit deinem Steuerbüro oder deiner Innung. Handwerk OS sorgt dafür, dass die Zeiten vollständig und nachvollziehbar vorliegen.",
      },
      {
        frage: "Wird mein Team dauernd geortet?",
        antwort:
          "Nein. Handwerk OS kann beim Start den Ort speichern, damit klar ist, auf welcher Baustelle gearbeitet wurde. Ob du das nutzt, entscheidest du. Eine laufende Ortung gibt es nicht.",
      },
      {
        frage: "Kann der Vorarbeiter für die ganze Kolonne stempeln?",
        antwort:
          "Ja. Der Vorarbeiter erfasst die Zeit für alle, die mit ihm auf der Baustelle sind. Jeder sieht seine Zeiten trotzdem in seiner App.",
      },
      {
        frage: "Was ist, wenn jemand vergisst zu stempeln?",
        antwort:
          "Macher erinnert, wenn jemand laut Plan auf der Baustelle sein müsste, aber keine Zeit läuft. Nachträge sind möglich – mit Begründung, damit alles nachvollziehbar bleibt.",
      },
    ],
    verwandt: ["mitarbeiter", "auswertung", "einsatzplanung"],
  },

  qualifikationen: {
    icon: "award",
    kurz: "Wer was kann – mit Nachweis und Ablaufdatum. Eingeplant wird nur, wer den Einsatz machen darf.",
    enthalten: ["Nachweise", "Ablaufdaten", "Berechtigungen"],
    meta: {
      title: "Qualifikationen im Handwerk verwalten – Nachweise und Fristen",
      description:
        "Qualifikationen deines Teams mit Nachweis und Ablaufdatum: Elektrofachkraft, Ersthelfer, Staplerschein, Hubarbeitsbühne. Handwerk OS warnt vor Ablauf und plant passend ein.",
    },
    hero: {
      titel: "Der Richtige für den richtigen Einsatz.",
      problem:
        "Wer darf an die Elektroanlage, wer hat den Staplerschein, wessen Erste-Hilfe-Kurs ist abgelaufen? Das steht in Ordnern – oder nirgends.",
      loesung:
        "Handwerk OS kennt die Qualifikationen deines Teams, warnt vor dem Ablauf und plant nur Leute ein, die den Einsatz auch machen dürfen.",
    },
    visual: {
      bereich: "Betrieb",
      titel: "Qualifikationen",
      untertitel: "14 Mitarbeiter",
      kennzahlen: [
        ["6", "Elektrofachkräfte"],
        ["4", "Ersthelfer"],
        ["2", "laufen bald ab"],
      ],
      liste: {
        ueberschrift: "Läuft bald ab",
        zeilen: [
          { titel: "Tom Becker · Ersthelfer", sub: "gültig bis Dezember", tag: "Kurs geplant", ton: "sky" },
          { titel: "Ali Kaya · Hubarbeitsbühne", sub: "gültig bis Januar", tag: "offen", ton: "signal" },
          { titel: "Lukas Berger · Staplerschein", sub: "unbefristet", tag: "gültig", ton: "moss" },
        ],
      },
      hinweis: {
        icon: "shield",
        ton: "sky",
        titel: "Für die Planung:",
        text: "Einsätze mit Hubarbeitsbühne gehen nur an Leute mit gültiger Einweisung.",
      },
    },
    problemTitel: "Wer was darf, weiß oft nur der Ordner im Büro.",
    probleme: [
      {
        titel: "Nachweise im Ordner",
        text: "Die Zertifikate liegen abgeheftet im Büro. Ob alle noch gültig sind, prüft keiner.",
      },
      {
        titel: "Abgelaufen, ohne dass es einer merkt",
        text: "Der Erste-Hilfe-Kurs war vor drei Jahren. Aufgefallen ist es erst, als jemand gefragt hat.",
      },
      {
        titel: "Falsch eingeplant",
        text: "Für die Arbeit auf der Hubarbeitsbühne braucht man eine Einweisung. Eingeplant wurde jemand ohne.",
      },
      {
        titel: "Wissen geht in Rente",
        text: "Der einzige mit Schweißnachweis hört im Frühjahr auf. Aufgefallen ist es, als es zu spät war.",
      },
    ],
    loesung: {
      titel: "Wer was kann – und wie lange noch.",
      text: "Für jeden Mitarbeiter hinterlegst du Qualifikationen mit Nachweis und Ablaufdatum: Elektrofachkraft, Ersthelfer, Staplerschein, Hubarbeitsbühne, Schweißnachweis. Macher warnt rechtzeitig vor dem Ablauf. In der Einsatzplanung werden nur Leute vorgeschlagen, die die nötigen Qualifikationen haben.",
      punkte: [
        "Qualifikationen mit Nachweis und Ablaufdatum",
        "Warnung Wochen vor dem Ablauf",
        "Einsätze verlangen bestimmte Qualifikationen",
        "Übersicht: Wer kann was im Betrieb?",
        "Nachweise per Foto direkt in der App",
      ],
    },
    detail: {
      kopf: "Qualifikationen",
      titel: "Tom Becker",
      sub: "Geselle · Elektroniker",
      status: { text: "1 läuft ab", ton: "signal" },
      zeilen: [
        { label: "Elektrofachkraft", wert: "unbefristet" },
        { label: "Ersthelfer", wert: "gültig bis 12/2026", hervor: true },
        { label: "Hubarbeitsbühne", wert: "gültig bis 05/2028" },
        { label: "Staplerschein", wert: "unbefristet" },
      ],
      fuss: { icon: "bell", text: "Auffrischung Erste Hilfe ist eingeplant: 18. November." },
    },
    schritte: [
      {
        titel: "Qualifikationen anlegen",
        text: "Handwerk OS schlägt die üblichen Qualifikationen für dein Gewerk vor. Eigene ergänzt du.",
      },
      {
        titel: "Nachweise hinterlegen",
        text: "Foto vom Zertifikat, Datum, Ablauf. Auch direkt vom Mitarbeiter in der App.",
      },
      {
        titel: "Mit Einsätzen verknüpfen",
        text: "Arbeit auf der Hubarbeitsbühne oder Prüfung elektrischer Anlagen? Der Einsatz verlangt die passende Qualifikation.",
      },
      {
        titel: "Rechtzeitig erinnert",
        text: "Vor dem Ablauf bekommen du und der Mitarbeiter Bescheid.",
      },
    ],
    automatisch: [
      "warnt vor ablaufenden Nachweisen",
      "schlägt für Einsätze nur passende Leute vor",
      "zeigt Lücken im Team, wenn jemand ausfällt",
      "erinnert Mitarbeiter, neue Nachweise hochzuladen",
      "schlägt Schulungen zur Auffrischung vor",
    ],
    geraete: {
      handy: [
        "Eigene Nachweise ansehen und hochladen",
        "Nachweis bei einer Kontrolle direkt zeigen",
        "Erinnerung vor dem Ablauf",
      ],
      computer: [
        "Übersicht: Wer kann was?",
        "Qualifikationen pro Einsatzart festlegen",
        "Ablaufende Nachweise der nächsten Monate",
      ],
      handyVisual: {
        kopf: "Meine Nachweise",
        titel: "Tom Becker",
        sub: "4 Qualifikationen",
        tags: [{ text: "1 läuft bald ab", ton: "signal" }],
        felder: [
          { label: "Elektrofachkraft", wert: "gültig" },
          { label: "Ersthelfer", wert: "bis 12/2026" },
          { label: "Hubarbeitsbühne", wert: "bis 05/2028" },
        ],
        aktion: { icon: "camera", text: "Nachweis hochladen" },
      },
    },
    gewerke: [
      { slug: "elektriker", text: "Nur befähigte Leute für Prüfungen und Arbeiten an Anlagen." },
      { slug: "metall-maschinen", text: "Schweißnachweise und Maschinenberechtigungen im Blick." },
      { slug: "dachdecker", text: "Absturzsicherung und Hubarbeitsbühne – vor jedem Einsatz geprüft." },
    ],
    kunde: {
      slug: "dach-hansen",
      text: "Wie ein Dachdeckerbetrieb die Nachweise seines Teams ohne Ordner im Griff hat.",
    },
    faq: [
      {
        frage: "Welche Qualifikationen kann ich anlegen?",
        antwort:
          "Alle, die in deinem Betrieb zählen – von Elektrofachkraft und Ersthelfer über Staplerschein und Hubarbeitsbühne bis zu Herstellerschulungen. Für dein Gewerk gibt es Vorschläge.",
      },
      {
        frage: "Was passiert, wenn eine Qualifikation abläuft?",
        antwort:
          "Du und der Mitarbeiter werden vorher erinnert. Ist sie abgelaufen, schlägt Macher den Mitarbeiter für passende Einsätze nicht mehr vor. Eine bewusste Ausnahme kannst du trotzdem machen.",
      },
      {
        frage: "Wie hängen Qualifikationen und Schulungen zusammen?",
        antwort:
          "Eine Schulung kann eine Qualifikation verlängern. Ist die Auffrischung erledigt, wird das neue Ablaufdatum automatisch übernommen.",
      },
      {
        frage: "Wer sieht die Nachweise?",
        antwort: "Der Mitarbeiter selbst und die Leute, denen du das Recht gibst – meist Chef und Büro.",
      },
    ],
    verwandt: ["schulungen", "mitarbeiter", "einsatzplanung"],
  },

  schulungen: {
    icon: "book",
    kurz: "Unterweisungen und Schulungen planen, erinnern und mit Unterschrift nachweisen.",
    enthalten: ["Unterweisungen", "Fristen", "Nachweise", "Einarbeitung"],
    meta: {
      title: "Unterweisungen und Schulungen im Handwerk – Fristen im Griff",
      description:
        "Handwerk OS plant Unterweisungen und Schulungen, erinnert dein Team an Fristen und sammelt Bestätigungen mit Unterschrift in der App – als Nachweis für jeden Mitarbeiter.",
    },
    hero: {
      titel: "Unterweisungen und Schulungen. Ohne eine Frist zu verpassen.",
      problem:
        "Die jährliche Unterweisung steht im Kalender vom letzten Jahr. Wer war dabei, wer fehlt, wer hat unterschrieben? Spätestens bei der Kontrolle wird es hektisch.",
      loesung:
        "Handwerk OS plant Unterweisungen und Schulungen, erinnert dein Team, sammelt Unterschriften in der App und zeigt dir jederzeit, wer was erledigt hat.",
    },
    visual: {
      bereich: "Betrieb",
      titel: "Schulungen & Unterweisungen",
      untertitel: "Stand heute",
      kennzahlen: [
        ["3", "fällig im Oktober"],
        ["2", "Mitarbeiter offen"],
        ["31", "Nachweise dieses Jahr"],
      ],
      liste: {
        ueberschrift: "Fristen",
        zeilen: [
          { titel: "Leitern und Tritte", sub: "jährlich · 12 von 14 erledigt", tag: "bis 31.10.", ton: "signal" },
          { titel: "Erste Hilfe Auffrischung", sub: "Tom · alle zwei Jahre", tag: "18.11. geplant", ton: "sky" },
          { titel: "Umgang mit Gefahrstoffen", sub: "alle Monteure · erledigt", tag: "erledigt", ton: "moss" },
        ],
      },
      hinweis: {
        icon: "bell",
        ton: "signal",
        titel: "Morgen:",
        text: "Kevin und Tom werden an die Unterweisung „Leitern und Tritte“ erinnert.",
      },
    },
    problemTitel: "Unterweisungen sind Pflicht. Der Papierkram drumherum auch.",
    probleme: [
      {
        titel: "Die Unterweisung im Pausenraum",
        text: "Einmal im Jahr alle zusammentrommeln. Zwei fehlen, einer ist krank. Nachholen? Vergessen.",
      },
      {
        titel: "Unterschriftenlisten im Ordner",
        text: "Wer hat die Unterweisung zur Leiter unterschrieben? Die Liste liegt irgendwo im Büro.",
      },
      {
        titel: "Fristen im Kopf",
        text: "Erste Hilfe alle zwei Jahre, Unterweisung jährlich, Gefahrstoffe extra. Wer behält das im Blick?",
      },
      {
        titel: "Neue lernen nebenbei",
        text: "Der Neue soll am ersten Tag die Sicherheitsregeln kennen. Meistens erklärt sie ihm ein Kollege – irgendwann.",
      },
    ],
    loesung: {
      titel: "Schulungen planen, erinnern, nachweisen.",
      text: "Du legst fest, welche Unterweisungen und Schulungen für wen gelten und wie oft. Handwerk OS plant die Termine, erinnert dein Team und sammelt die Bestätigung mit Unterschrift in der App. Kurze Unterweisungen arbeitet jeder auf dem Handy durch. Du siehst jederzeit, wer noch fehlt.",
      punkte: [
        "Unterweisungen und Schulungen mit festem Rhythmus",
        "Erinnerung an Mitarbeiter und an dich",
        "Bestätigung mit Unterschrift in der App",
        "Kurze Unterweisungen direkt auf dem Handy",
        "Nachweis für jeden Mitarbeiter mit einem Klick",
      ],
    },
    detail: {
      kopf: "Unterweisung · jährlich",
      titel: "Leitern und Tritte sicher nutzen",
      sub: "für alle auf der Baustelle · ca. 20 Min.",
      status: { text: "12 von 14 erledigt", ton: "sky" },
      zeilen: [
        { label: "Fällig bis", wert: "31. Oktober" },
        { label: "Erledigt", wert: "12 Mitarbeiter, unterschrieben" },
        { label: "Offen", wert: "Tom (krank), Kevin (neu)", hervor: true },
        { label: "Nächste Runde", wert: "Oktober 2027" },
      ],
      fuss: { icon: "bell", text: "Kevin und Tom werden morgen früh erinnert." },
    },
    schritte: [
      {
        titel: "Festlegen, was gilt",
        text: "Handwerk OS schlägt typische Unterweisungen für dein Gewerk vor. Du legst Rhythmus und Teilnehmer fest.",
      },
      {
        titel: "Im Betrieb oder auf dem Handy",
        text: "Gemeinsam im Betrieb oder einzeln in der App – je nach Thema.",
      },
      {
        titel: "Bestätigen",
        text: "Jeder bestätigt mit Unterschrift. Der Nachweis ist sofort gespeichert.",
      },
      {
        titel: "Nächste Frist läuft",
        text: "Macher behält im Blick, wann es wieder dran ist, und erinnert rechtzeitig.",
      },
    ],
    automatisch: [
      "plant wiederkehrende Unterweisungen",
      "erinnert Mitarbeiter an offene Schulungen",
      "sammelt Unterschriften als Nachweis",
      "zeigt, wer fehlt – auch nach Krankheit oder Urlaub",
      "legt für neue Mitarbeiter die nötigen Unterweisungen an",
      "verlängert Qualifikationen nach erledigter Schulung",
    ],
    geraete: {
      handy: [
        "Offene Unterweisungen sehen",
        "Kurze Unterweisung lesen und bestätigen",
        "Mit Unterschrift abschließen",
      ],
      computer: [
        "Übersicht aller Fristen im Betrieb",
        "Eigene Unterweisungen und Unterlagen hochladen",
        "Nachweise für eine Kontrolle ausgeben",
      ],
      handyVisual: {
        kopf: "Meine Schulungen",
        titel: "Leitern und Tritte",
        sub: "Unterweisung · ca. 20 Min.",
        tags: [{ text: "fällig bis 31.10.", ton: "signal" }],
        felder: [
          { label: "Inhalt", wert: "8 Seiten, 3 Fragen" },
          { label: "Dauer", wert: "ca. 20 Min." },
          { label: "Nachweis", wert: "mit Unterschrift" },
        ],
        aktion: { icon: "play", text: "Unterweisung starten" },
      },
    },
    gewerke: [
      { slug: "bau", text: "Unterweisungen für Gerüst, Maschinen und Baustellensicherheit." },
      { slug: "dachdecker", text: "Absturzsicherung jedes Jahr nachweisbar." },
      { slug: "lebensmittelhandwerk", text: "Hygieneschulungen mit Fristen und Nachweis." },
    ],
    kunde: {
      slug: "dach-hansen",
      text: "Wie ein Dachdeckerbetrieb Unterweisungen für das ganze Team in der App nachweist.",
    },
    faq: [
      {
        frage: "Welche Unterweisungen sind für mich Pflicht?",
        antwort:
          "Das hängt von deinem Betrieb und euren Tätigkeiten ab. Handwerk OS schlägt typische Unterweisungen für dein Gewerk vor. Was genau für dich gilt, klärst du am besten mit deiner Fachkraft für Arbeitssicherheit oder deiner Berufsgenossenschaft.",
      },
      {
        frage: "Kann ich eigene Unterlagen nutzen?",
        antwort:
          "Ja. Du lädst eigene Texte, Bilder oder PDFs hoch und ergänzt Fragen. So passen die Unterweisungen genau zu deinem Betrieb.",
      },
      {
        frage: "Reicht eine Unterweisung auf dem Handy?",
        antwort:
          "Für manche Themen ja, für andere nicht. Du entscheidest pro Unterweisung, ob sie in der App, im Betrieb oder in beidem stattfindet.",
      },
      {
        frage: "Wie zeige ich bei einer Kontrolle die Nachweise?",
        antwort:
          "Mit einem Klick gibst du pro Mitarbeiter oder pro Unterweisung eine Liste mit Datum und Unterschrift aus.",
      },
    ],
    verwandt: ["qualifikationen", "mitarbeiter", "automatisch-erledigen"],
  },

  material: {
    icon: "box",
    kurz: "Jeder Auftrag weiß, welches Material er braucht. Macher meldet vor dem Start, was fehlt.",
    enthalten: ["Material bereit?", "Materialliste pro Auftrag", "Verbrauch erfassen"],
    meta: {
      title: "Material planen im Handwerk – alles da, bevor es losgeht",
      description:
        "Materialliste pro Auftrag aus dem Angebot, Abgleich mit Lager und Fahrzeug, Warnung vor dem Start und Verbrauch per App. Verbautes Material landet automatisch in der Rechnung.",
    },
    hero: {
      titel: "Material da, bevor die Baustelle startet.",
      problem:
        "Montag, 7:30 Uhr auf der Baustelle – und das WC-Element liegt noch beim Großhändler. Einer fährt los, zwei warten.",
      loesung:
        "Handwerk OS weiß, welches Material jeder Auftrag braucht, prüft vor dem Start, ob alles da ist, und meldet rechtzeitig, was fehlt.",
    },
    visual: {
      bereich: "Planen",
      titel: "Material bereit?",
      untertitel: "nächste 5 Tage",
      kennzahlen: [
        ["9", "Einsätze"],
        ["7", "alles bereit"],
        ["2", "es fehlt etwas"],
      ],
      liste: {
        ueberschrift: "Startet bald",
        zeilen: [
          { titel: "Bad sanieren · Krüger", sub: "Mo · Duschrinne kommt Freitag", tag: "1 fehlt", ton: "signal" },
          { titel: "Wallbox · Petersen", sub: "Mi · alles im Wagen von Ali", tag: "bereit", ton: "moss" },
          { titel: "Unterverteilung · HV Nordblick", sub: "Do · 2× FI-Schalter reserviert", tag: "bereit", ton: "moss" },
        ],
      },
      hinweis: {
        icon: "truck",
        ton: "sky",
        titel: "Nachgefragt:",
        text: "Lieferung der Duschrinne für Freitag ist bestätigt.",
      },
    },
    problemTitel: "Fehlendes Material kostet mehr als das Material selbst.",
    probleme: [
      {
        titel: "Die Fahrt zum Großhändler",
        text: "Ein Fitting fehlt. Eine Stunde hin und zurück – für ein Teil für vier Euro.",
      },
      {
        titel: "Geliefert, aber am falschen Ort",
        text: "Geliefert ins Lager, gebraucht auf der Baustelle. Eingeladen hat es keiner.",
      },
      {
        titel: "Verbaut, aber nicht aufgeschrieben",
        text: "Was auf der Baustelle verbaut wurde, steht nirgends. Auf der Rechnung fehlt es.",
      },
      {
        titel: "Reste, die keiner kennt",
        text: "Im Lager liegen noch 40 Meter Kabel von der letzten Baustelle. Bestellt wird trotzdem neu.",
      },
    ],
    loesung: {
      titel: "Jeder Auftrag weiß, was er braucht.",
      text: "Aus dem Angebot entsteht eine Materialliste für den Auftrag. Handwerk OS prüft, was im Lager oder im Fahrzeug ist und was bestellt werden muss. Ein paar Tage vor dem Start siehst du: alles bereit – oder es fehlt etwas. Auf der Baustelle erfasst dein Team, was wirklich verbaut wurde.",
      punkte: [
        "Materialliste pro Auftrag aus dem Angebot",
        "Prüfung: Lager, Fahrzeug oder bestellen",
        "Warnung vor dem Start, wenn etwas fehlt",
        "Verbrauch auf der Baustelle per App erfassen",
        "Verbautes Material landet in der Rechnung",
      ],
    },
    detail: {
      kopf: "Material · Auftrag A-2026-118",
      titel: "Bad sanieren · Fam. Krüger",
      sub: "Start Montag, 7:30 Uhr",
      status: { text: "1 Teil fehlt", ton: "signal" },
      zeilen: [
        { label: "WC-Vorwandelement", wert: "1× · im Lager" },
        { label: "Wandfliesen 30×60", wert: "26,5 m² · geliefert" },
        { label: "Fliesenkleber", wert: "8 Sack · im Lager" },
        { label: "Flexschlauch", wert: "2× · im Wagen von Lukas" },
        { label: "Duschrinne 80 cm", wert: "1× · kommt Freitag", hervor: true },
      ],
      fuss: { icon: "truck", text: "Beim Lieferanten nachgefragt: Lieferung am Freitag ist bestätigt." },
    },
    schritte: [
      {
        titel: "Liste aus dem Angebot",
        text: "Jede Position bringt ihr Material mit. Die Liste steht, sobald der Auftrag da ist.",
      },
      {
        titel: "Abgleich mit Lager und Wagen",
        text: "Was da ist, wird reserviert. Was fehlt, kommt auf die Bestellliste.",
      },
      {
        titel: "Prüfung vor dem Start",
        text: "Drei Tage vorher meldet Macher: alles bereit – oder was noch fehlt.",
      },
      {
        titel: "Verbrauch erfassen",
        text: "Auf der Baustelle tippt das Team an, was verbaut wurde. Reste gehen zurück ins Lager.",
      },
    ],
    automatisch: [
      "erstellt die Materialliste aus dem Angebot",
      "reserviert Material im Lager für den Auftrag",
      "meldet vor dem Start, was fehlt",
      "setzt Fehlendes auf die Bestellliste",
      "übernimmt verbautes Material in die Rechnung",
    ],
    geraete: {
      handy: [
        "Materialliste für den heutigen Einsatz",
        "Verbrauch antippen oder Strichcode scannen",
        "Fehlendes sofort melden",
      ],
      computer: [
        "Materialbedarf aller Aufträge der Woche",
        "Reservierungen und offene Bestellungen",
        "Vergleich: geplant und verbaut",
      ],
      handyVisual: {
        kopf: "Material · heute",
        titel: "Bad sanieren",
        sub: "Fam. Krüger · 5 Positionen",
        tags: [{ text: "4 von 5 bereit", ton: "moss" }],
        felder: [
          { label: "WC-Element", wert: "im Lager" },
          { label: "Fliesenkleber", wert: "8 Sack" },
          { label: "Duschrinne", wert: "kommt Freitag" },
        ],
        aktion: { icon: "box", text: "Verbrauch erfassen" },
      },
    },
    gewerke: [
      { slug: "shk", text: "Fittings, Rohre, Armaturen – jedes Teil beim richtigen Auftrag." },
      { slug: "elektriker", text: "Kabel in Metern, Schutzschalter, Dosen – vor dem Start geprüft." },
      { slug: "fliesenleger", text: "Fliesen, Kleber, Fugenmasse und Schienen passend zur Fläche." },
    ],
    kunde: {
      slug: "tischlerei-weber",
      text: "Wie eine Tischlerei Plattenmaterial und Beschläge für jeden Auftrag im Blick behält.",
    },
    werkzeug: "materialaufschlag-rechner",
    faq: [
      {
        frage: "Muss ich alle Artikel selbst anlegen?",
        antwort:
          "Nein. Du übernimmst die Artikellisten deiner Großhändler. Eigene Artikel und Pauschalen ergänzt du einfach.",
      },
      {
        frage: "Kann das Team Material per Handy erfassen?",
        antwort:
          "Ja. Artikel suchen, antippen oder den Strichcode scannen und die Menge eingeben. Das geht auch ohne Netz.",
      },
      {
        frage: "Was ist der Unterschied zwischen Material und Lager?",
        antwort:
          "Bei Material geht es um den einzelnen Auftrag: Was braucht er, ist es da? Beim Lager geht es um deinen ganzen Bestand: Was liegt wo, was wird knapp?",
      },
      {
        frage: "Wie kommt das Material in die Rechnung?",
        antwort:
          "Was auf der Baustelle erfasst wurde, steht beim Auftrag. In der Rechnung wird es automatisch übernommen – mit deinem Aufschlag.",
      },
    ],
    verwandt: ["lager", "einkauf", "auftraege"],
  },

  lager: {
    icon: "warehouse",
    kurz: "Bestand im Lager und in jedem Fahrzeug – mit Entnahme per App und Meldung bei Mindestbestand.",
    enthalten: ["Bestand", "Fahrzeuglager", "Mindestbestand", "Inventur"],
    meta: {
      title: "Lagerverwaltung für Handwerker – Lager und Fahrzeuge im Blick",
      description:
        "Bestand für Hauptlager, Werkstatt und jedes Fahrzeug. Entnahmen per App auf den Auftrag buchen, Mindestbestände melden lassen und die Inventur mit dem Handy machen.",
    },
    hero: {
      titel: "Wissen, was im Lager liegt. Und in jedem Wagen.",
      problem:
        "Ob noch Kabel da ist, weiß man erst, wenn man nachschaut. Im Transporter von Tom liegt die halbe Werkstatt – aber keiner weiß, was genau.",
      loesung:
        "Handwerk OS führt deinen Bestand im Lager und in jedem Fahrzeug. Entnahmen werden per App gebucht, Mindestbestände gemeldet, und vor dem Einkauf siehst du, was schon da ist.",
    },
    visual: {
      bereich: "Betrieb",
      titel: "Lager",
      untertitel: "5 Lagerorte",
      kennzahlen: [
        ["412", "Artikel"],
        ["5", "unter Mindestbestand"],
        ["3", "Fahrzeuge"],
      ],
      liste: {
        ueberschrift: "Wird knapp",
        zeilen: [
          { titel: "FI-Schutzschalter 40A 30mA", sub: "Hauptlager 3 · Wagen 1", wert: "4 / 6", tag: "bestellen", ton: "signal" },
          { titel: "NYM-J 3×1,5 mm²", sub: "Hauptlager 120 m · Wagen 85 m", wert: "205 m", tag: "ok", ton: "moss" },
          { titel: "Hohlwanddosen", sub: "nur noch in Caddy 2", wert: "12 / 50", tag: "bestellen", ton: "signal" },
        ],
      },
      hinweis: {
        icon: "cart",
        ton: "sky",
        titel: "Bestellliste:",
        text: "5 Artikel für die Sammelbestellung am Donnerstag vorgemerkt.",
      },
    },
    problemTitel: "Ein Lager, das nur im Kopf existiert.",
    probleme: [
      {
        titel: "Nachschauen statt wissen",
        text: "„Haben wir noch Fehlerstromschutzschalter?“ – „Ich glaub schon.“ Einer läuft ins Lager.",
      },
      {
        titel: "Der Wagen als zweites Lager",
        text: "Jeder Transporter hat sein eigenes Lager. Was drin ist, weiß nur der Fahrer.",
      },
      {
        titel: "Leer, wenn's drauf ankommt",
        text: "Die letzte Packung Dübel ist weg. Nachbestellt hat keiner.",
      },
      {
        titel: "Inventur am Jahresende",
        text: "Zwei Tage zählen, Listen abtippen – und am Ende passt es trotzdem nicht.",
      },
    ],
    loesung: {
      titel: "Ein Bestand für Lager und Fahrzeuge.",
      text: "Jeder Lagerort hat seinen Bestand: Hauptlager, Werkstatt, jeder Transporter. Wer etwas entnimmt, bucht es in der App auf den Auftrag. Fällt ein Artikel unter den Mindestbestand, kommt er auf die Bestellliste. Die Inventur machst du mit dem Handy – Regal für Regal.",
      punkte: [
        "Bestand für Lager, Werkstatt und jedes Fahrzeug",
        "Entnahme per App – direkt auf den Auftrag",
        "Mindestbestand mit Meldung",
        "Umbuchen zwischen Lager und Wagen",
        "Inventur mit dem Handy",
      ],
    },
    detail: {
      kopf: "Artikel 4021",
      titel: "FI-Schutzschalter 40A 30mA",
      sub: "Lieferant: Großhandel Nord",
      status: { text: "unter Mindestbestand", ton: "signal" },
      zeilen: [
        { label: "Hauptlager", wert: "3 Stück" },
        { label: "Caddy 2 (Tom)", wert: "1 Stück" },
        { label: "Sprinter 1 (Lukas)", wert: "0 Stück" },
        { label: "Mindestbestand", wert: "6 Stück", hervor: true },
        { label: "Reserviert", wert: "2 für Mittwoch" },
      ],
      fuss: { icon: "cart", text: "10 Stück auf die Bestellliste gesetzt – Sammelbestellung am Donnerstag." },
    },
    schritte: [
      {
        titel: "Bestand erfassen",
        text: "Einmal zählen oder aus einer Liste übernehmen – für Lager und Fahrzeuge.",
      },
      {
        titel: "Entnehmen und buchen",
        text: "Material aus Lager oder Wagen wird per App auf den Auftrag gebucht.",
      },
      {
        titel: "Nachfüllen",
        text: "Fällt ein Artikel unter den Mindestbestand, setzt Macher ihn auf die Bestellliste.",
      },
      {
        titel: "Inventur",
        text: "Mit dem Handy durchs Lager. Abweichungen siehst du sofort.",
      },
    ],
    automatisch: [
      "bucht Entnahmen auf den Auftrag",
      "meldet Artikel unter Mindestbestand",
      "setzt fehlende Artikel auf die Bestellliste",
      "schlägt vor, Fahrzeuge vor der Tour aufzufüllen",
      "zeigt Reste aus alten Aufträgen, bevor neu bestellt wird",
    ],
    geraete: {
      handy: [
        "Bestand im eigenen Wagen sehen",
        "Entnahme buchen, Strichcode scannen",
        "Inventur Regal für Regal",
      ],
      computer: [
        "Bestand aller Lagerorte",
        "Mindestbestände und Lagerplätze pflegen",
        "Lagerwert und Bewegungen auswerten",
      ],
      handyVisual: {
        kopf: "Mein Wagen · Caddy 2",
        titel: "Bestand im Fahrzeug",
        sub: "zuletzt aufgefüllt am Montag",
        tags: [{ text: "3 Artikel knapp", ton: "signal" }],
        felder: [
          { label: "FI-Schutzschalter", wert: "1 Stück" },
          { label: "NYM-J 3×1,5", wert: "35 m" },
          { label: "Hohlwanddosen", wert: "12 Stück" },
        ],
        aktion: { icon: "box", text: "Entnahme buchen" },
      },
    },
    gewerke: [
      { slug: "elektriker", text: "Kabel in Metern, Schalter und Dosen in jedem Wagen." },
      { slug: "shk", text: "Ersatzteile für den Kundendienst immer an Bord." },
      { slug: "metall-maschinen", text: "Halbzeuge, Schrauben und Verbrauchsmaterial in der Werkstatt." },
    ],
    kunde: {
      slug: "elektro-brandt",
      text: "Wie ein Elektrobetrieb den Bestand in jedem Transporter kennt.",
    },
    faq: [
      {
        frage: "Muss ich jede Schraube einzeln buchen?",
        antwort:
          "Nein. Kleinteile wie Schrauben und Dübel führst du als Verbrauchsmaterial ohne Bestand – oder in Packungen. Du entscheidest, wie genau es sein soll.",
      },
      {
        frage: "Kann ich Strichcodes nutzen?",
        antwort:
          "Ja. Mit der Handykamera scannst du Strichcodes auf Artikeln oder Regalen. Eigene Etiketten druckst du direkt aus.",
      },
      {
        frage: "Wie funktioniert die Inventur?",
        antwort:
          "Du gehst mit dem Handy Regal für Regal durch und tippst die gezählten Mengen ein. Handwerk OS zeigt Abweichungen und bucht sie nach deiner Freigabe aus.",
      },
      {
        frage: "Brauche ich das als kleiner Betrieb?",
        antwort:
          "Nicht unbedingt. Viele starten nur mit Material pro Auftrag und nehmen das Lager später dazu, wenn es sich lohnt.",
      },
    ],
    verwandt: ["material", "einkauf", "fahrzeuge"],
  },

  einkauf: {
    icon: "cart",
    kurz: "Bedarf aus allen Aufträgen sammeln, pro Lieferant bestellen, Lieferung und Rechnung abgleichen.",
    enthalten: ["Lieferanten", "Bestellungen", "Wareneingang", "Preise vergleichen"],
    meta: {
      title: "Einkauf und Lieferanten im Handwerk – bestellen ohne Chaos",
      description:
        "Handwerk OS sammelt den Materialbedarf aus Aufträgen und Lager, macht daraus Bestellungen pro Lieferant und gleicht Lieferung und Lieferantenrechnung ab.",
    },
    hero: {
      titel: "Bestellen mit einem Klick. Nicht mit zehn Anrufen.",
      problem:
        "Bestellt wird per Telefon, Mail und Onlineshop bei drei Großhändlern. Was bestellt ist, was geliefert wurde und ob die Rechnung stimmt, prüft keiner richtig.",
      loesung:
        "Handwerk OS sammelt den Bedarf aus allen Aufträgen und dem Lager, macht daraus Bestellungen pro Lieferant und gleicht Lieferung und Rechnung ab.",
    },
    visual: {
      bereich: "Betrieb",
      titel: "Einkauf",
      untertitel: "diese Woche",
      kennzahlen: [
        ["23", "Positionen auf der Liste"],
        ["3", "Bestellungen unterwegs"],
        ["1", "Lieferung unvollständig"],
      ],
      liste: {
        ueberschrift: "Bestellungen",
        zeilen: [
          { titel: "Großhandel Nord · B-2026-077", sub: "3 Aufträge + Lager · 13 von 14 geliefert", wert: "2.316,80 €", tag: "teilweise", ton: "sky" },
          { titel: "Fliesen Müller · B-2026-078", sub: "Bad Krüger · Lieferung Freitag", wert: "1.184,00 €", tag: "bestellt", ton: "sky" },
          { titel: "Großhandel Süd · Entwurf", sub: "Kabel – hier gerade günstiger", wert: "642,30 €", tag: "zum Senden", ton: "signal" },
        ],
      },
      hinweis: {
        icon: "spark",
        ton: "moss",
        titel: "Abgeglichen:",
        text: "Rechnung von Großhandel Nord passt zur Lieferung.",
      },
    },
    problemTitel: "Einkauf passiert nebenbei – und genauso sieht er aus.",
    probleme: [
      {
        titel: "Jeder bestellt selbst",
        text: "Der Meister bestellt per Telefon, der Geselle im Onlineshop, das Büro per Mail. Einen Überblick hat keiner.",
      },
      {
        titel: "Doppelt bestellt",
        text: "Zwei Leute bestellen dieselben Rohre für dieselbe Baustelle.",
      },
      {
        titel: "Lieferung unvollständig",
        text: "Auf dem Lieferschein stehen zehn Positionen, im Karton sind neun. Gemerkt wird es auf der Baustelle.",
      },
      {
        titel: "Preise nie verglichen",
        text: "Der eine Großhändler ist bei Kabel günstiger, der andere bei Armaturen. Bestellt wird trotzdem immer beim selben.",
      },
    ],
    loesung: {
      titel: "Bedarf sammeln. Bestellen. Abgleichen.",
      text: "Was Aufträge brauchen und was im Lager knapp wird, landet auf einer gemeinsamen Bestellliste. Handwerk OS schlägt vor, was bei welchem Lieferanten bestellt wird, und schickt die Bestellung raus. Beim Wareneingang hakst du ab, was angekommen ist. Die Rechnung des Lieferanten wird mit Bestellung und Lieferung verglichen.",
      punkte: [
        "Eine Bestellliste für alle Aufträge und das Lager",
        "Bestellung pro Lieferant mit einem Klick",
        "Preise deiner Lieferanten im Vergleich",
        "Wareneingang per Handy abhaken",
        "Lieferantenrechnung mit Bestellung abgleichen",
      ],
    },
    detail: {
      kopf: "Bestellung B-2026-077",
      titel: "Großhandel Nord",
      sub: "für 3 Aufträge und das Hauptlager",
      status: { text: "teilweise geliefert", ton: "sky" },
      zeilen: [
        { label: "Positionen", wert: "14" },
        { label: "Geliefert", wert: "13 von 14" },
        { label: "Fehlt", wert: "Duschrinne, kommt Freitag" },
        { label: "Bestellwert", wert: "2.316,80 €" },
        { label: "Rechnung Lieferant", wert: "passt zur Lieferung", hervor: true },
      ],
      fuss: { icon: "spark", text: "Kabel war bei Großhandel Süd günstiger – die Position wurde dorthin verschoben." },
    },
    schritte: [
      {
        titel: "Bedarf sammeln",
        text: "Aus Aufträgen, Mindestbeständen und Wünschen vom Team entsteht eine Bestellliste.",
      },
      {
        titel: "Bestellen",
        text: "Macher schlägt Lieferant und Menge vor. Ein Klick, und die Bestellung geht raus.",
      },
      {
        titel: "Ware annehmen",
        text: "Lieferung im Lager oder auf der Baustelle abhaken. Fehlende Teile werden gemeldet.",
      },
      {
        titel: "Rechnung prüfen",
        text: "Die Lieferantenrechnung wird mit Bestellung und Lieferung verglichen.",
      },
    ],
    automatisch: [
      "sammelt den Bedarf aus allen Aufträgen",
      "schlägt Lieferant und Menge vor",
      "fasst kleine Bestellungen zusammen",
      "meldet fehlende oder verspätete Lieferungen",
      "gleicht Lieferantenrechnungen ab",
    ],
    geraete: {
      handy: [
        "Material beim Büro anfordern",
        "Lieferung auf der Baustelle abhaken",
        "Lieferschein fotografieren",
      ],
      computer: [
        "Bestellliste und offene Bestellungen",
        "Lieferanten mit Preisen und Bedingungen",
        "Rechnungsabgleich und Übergabe an die Buchhaltung",
      ],
      handyVisual: {
        kopf: "Wareneingang · Baustelle",
        titel: "Lieferung Großhandel Nord",
        sub: "für Bad sanieren · Krüger",
        tags: [{ text: "13 von 14", ton: "sky" }],
        felder: [
          { label: "Wandfliesen", wert: "26,5 m² ✓" },
          { label: "Fliesenkleber", wert: "8 Sack ✓" },
          { label: "Duschrinne", wert: "fehlt" },
        ],
        aktion: { icon: "camera", text: "Lieferschein fotografieren" },
      },
    },
    gewerke: [
      { slug: "shk", text: "Viele Teile von mehreren Großhändlern – sauber gebündelt." },
      { slug: "elektriker", text: "Kabel, Verteiler und Schalter zu aktuellen Preisen." },
      { slug: "tischler", text: "Platten, Kanten und Beschläge pro Auftrag bestellen." },
    ],
    kunde: {
      slug: "tischlerei-weber",
      text: "Wie eine Tischlerei Material pro Auftrag bestellt und die Kosten im Griff behält.",
    },
    werkzeug: "materialaufschlag-rechner",
    faq: [
      {
        frage: "Kann ich direkt bei meinem Großhändler bestellen?",
        antwort:
          "Ja, per Mail oder als Bestelldatei. Welche Großhändler direkt angebunden sind, siehst du beim Einrichten.",
      },
      {
        frage: "Darf jeder Mitarbeiter bestellen?",
        antwort:
          "Du legst fest, wer bestellen darf und bis zu welchem Betrag. Alle anderen fordern Material an, und das Büro gibt frei.",
      },
      {
        frage: "Wie vergleiche ich Preise?",
        antwort:
          "Wenn du Artikellisten mehrerer Lieferanten hinterlegst, zeigt Handwerk OS bei jeder Position, wo sie gerade günstiger ist.",
      },
      {
        frage: "Was passiert mit der Lieferantenrechnung?",
        antwort:
          "Du lädst sie hoch oder leitest sie per Mail weiter. Handwerk OS vergleicht sie mit Bestellung und Lieferung und zeigt dir Abweichungen.",
      },
    ],
    verwandt: ["material", "lager", "auswertung"],
  },

  werkzeuge: {
    icon: "wrench",
    kurz: "Wo ist welches Gerät, wer hat es, wann ist die nächste Prüfung? Mit Ausgabe per Code.",
    enthalten: ["Werkzeug bereit?", "Ausgabe & Rückgabe", "Prüffristen"],
    meta: {
      title: "Werkzeugverwaltung im Handwerk – Geräte, Standort, Prüfung",
      description:
        "Maschinen und Geräte mit Standort, Besitzer und Prüftermin. Ausgabe und Rückgabe per App, Reservierung für Einsätze und Erinnerung an Prüfung und Wartung.",
    },
    hero: {
      titel: "Wo ist der Kernbohrer? Jetzt weißt du es.",
      problem:
        "Teure Maschinen wandern von Baustelle zu Baustelle. Wer was hat, steht nirgends. Prüftermine für Elektrogeräte gehen unter.",
      loesung:
        "Handwerk OS zeigt, wo jedes Gerät ist und wer es hat, plant es für Einsätze ein und erinnert an Prüfung und Wartung.",
    },
    visual: {
      bereich: "Betrieb",
      titel: "Werkzeuge & Geräte",
      untertitel: "48 Geräte",
      kennzahlen: [
        ["31", "im Lager"],
        ["17", "unterwegs"],
        ["4", "Prüfung fällig"],
      ],
      liste: {
        ueberschrift: "Unterwegs",
        zeilen: [
          { titel: "Kernbohrgerät 2-Gang", sub: "Ali · Baustelle Petersen · zurück Do", tag: "reserviert Fr", ton: "sky" },
          { titel: "Rotationslaser", sub: "Lukas · Bad Krüger", tag: "unterwegs", ton: "sky" },
          { titel: "Bautrockner", sub: "seit 19 Tagen bei Fam. Demir", tag: "abholen?", ton: "signal" },
        ],
      },
      hinweis: {
        icon: "shield",
        ton: "signal",
        titel: "Prüfung fällig:",
        text: "4 Elektrogeräte bis Ende November. Termin vorschlagen?",
      },
    },
    problemTitel: "Werkzeug ist teuer. Suchen auch.",
    probleme: [
      {
        titel: "Die Suche am Morgen",
        text: "Der Kernbohrer wird gebraucht. Wer hatte ihn zuletzt? Drei Anrufe, eine Stunde später ist er gefunden.",
      },
      {
        titel: "Doppelt verplant",
        text: "Zwei Baustellen brauchen am Dienstag die Rüttelplatte. Es gibt nur eine.",
      },
      {
        titel: "Prüfung vergessen",
        text: "Elektrogeräte müssen regelmäßig geprüft werden. Die Liste dazu ist von vorletztem Jahr.",
      },
      {
        titel: "Einfach weg",
        text: "Der Laser ist verschwunden. Auf der Baustelle liegen gelassen oder verliehen? Keiner weiß es.",
      },
    ],
    loesung: {
      titel: "Jedes Gerät mit Ort, Besitzer und Prüftermin.",
      text: "Teure Maschinen und Geräte legst du einmal an – mit Foto, Seriennummer und Prüftermin. Ausgabe und Rückgabe laufen per App über einen Aufkleber mit Code. In der Einsatzplanung siehst du, ob das nötige Gerät frei ist. Vor Prüf- und Wartungsterminen erinnert Macher rechtzeitig.",
      punkte: [
        "Wo ist was – und wer hat es gerade?",
        "Ausgabe und Rückgabe per App mit Code",
        "Geräte für Einsätze reservieren",
        "Prüf- und Wartungstermine mit Erinnerung",
        "Prüfprotokolle direkt beim Gerät",
      ],
    },
    detail: {
      kopf: "Gerät W-031",
      titel: "Kernbohrgerät 2-Gang",
      sub: "Seriennummer 7741-K",
      status: { text: "unterwegs", ton: "sky" },
      zeilen: [
        { label: "Bei", wert: "Ali · Baustelle Petersen" },
        { label: "Zurück bis", wert: "Donnerstag" },
        { label: "Reserviert", wert: "Freitag, Bad Krüger" },
        { label: "Nächste Prüfung", wert: "15. November", hervor: true },
        { label: "Letzte Prüfung", wert: "bestanden, Protokoll gespeichert" },
      ],
      fuss: { icon: "bell", text: "Ali wird am Donnerstag früh an die Rückgabe erinnert." },
    },
    schritte: [
      {
        titel: "Gerät anlegen",
        text: "Foto, Seriennummer, Prüftermin. Aufkleber mit Code ausdrucken und aufs Gerät kleben.",
      },
      {
        titel: "Ausgeben",
        text: "Code scannen, Mitarbeiter oder Baustelle wählen – fertig.",
      },
      {
        titel: "Einplanen",
        text: "Einsätze, die ein bestimmtes Gerät brauchen, reservieren es gleich mit.",
      },
      {
        titel: "Prüfen und warten",
        text: "Macher erinnert an Prüftermine und speichert das Protokoll beim Gerät.",
      },
    ],
    automatisch: [
      "zeigt, wer welches Gerät gerade hat",
      "reserviert Geräte für geplante Einsätze",
      "warnt bei doppelter Planung",
      "erinnert an Rückgabe, Prüfung und Wartung",
      "legt Prüfprotokolle beim Gerät ab",
    ],
    geraete: {
      handy: [
        "Code scannen: ausleihen oder zurückgeben",
        "Meine Geräte auf einen Blick",
        "Schaden mit Foto melden",
      ],
      computer: [
        "Geräteliste mit Standort und Stand",
        "Prüf- und Wartungskalender",
        "Kosten und Nutzung pro Gerät",
      ],
      handyVisual: {
        kopf: "Gerät gescannt",
        titel: "Kernbohrgerät 2-Gang",
        sub: "W-031 · im Lager",
        tags: [{ text: "frei bis Donnerstag", ton: "moss" }],
        felder: [
          { label: "Nächste Prüfung", wert: "15. November" },
          { label: "Reserviert", wert: "Fr, Bad Krüger" },
          { label: "Zubehör", wert: "Bohrkronen 68/82 mm" },
        ],
        aktion: { icon: "check", text: "Ausleihen" },
      },
    },
    gewerke: [
      { slug: "bau", text: "Rüttelplatte, Kernbohrer, Laser – über alle Baustellen verteilt." },
      { slug: "elektriker", text: "Messgeräte mit Prüf- und Kalibrierterminen." },
      { slug: "galabau", text: "Maschinen und Anbaugeräte für die Saison planen." },
    ],
    kunde: {
      slug: "dach-hansen",
      text: "Wie ein Dachdeckerbetrieb Geräte und Prüftermine für alle Kolonnen im Blick hat.",
    },
    faq: [
      {
        frage: "Muss ich jedes kleine Werkzeug erfassen?",
        antwort:
          "Nein. Erfasse, was teuer ist, geprüft werden muss oder oft gesucht wird. Den Akkuschrauber im eigenen Koffer musst du nicht anlegen.",
      },
      {
        frage: "Welche Codes brauche ich?",
        antwort:
          "Du druckst Aufkleber mit Code direkt aus Handwerk OS. Gescannt wird mit der Handykamera – ohne extra Gerät.",
      },
      {
        frage: "Kann ich Prüfprotokolle für Elektrogeräte speichern?",
        antwort: "Ja. Prüfdatum, Ergebnis und Protokoll liegen beim Gerät. Macher erinnert vor dem nächsten Termin.",
      },
      {
        frage: "Kann ich auch Mietgeräte erfassen?",
        antwort:
          "Ja. Mietgeräte bekommen ein Rückgabedatum. Macher erinnert rechtzeitig, damit keine unnötigen Miettage entstehen.",
      },
    ],
    verwandt: ["fahrzeuge", "einsatzplanung", "lager"],
  },

  fahrzeuge: {
    icon: "truck",
    kurz: "Fahrzeuge mit den Einsätzen planen, an Fristen erinnern und Kosten pro Wagen sehen.",
    enthalten: ["Fahrzeug bereit?", "Fahrzeugplanung", "Fristen", "Kosten"],
    meta: {
      title: "Fahrzeugverwaltung für Handwerker – Planung, Fristen, Kosten",
      description:
        "Transporter, Kipper und Anhänger mit den Einsätzen planen. Erinnerung an Hauptuntersuchung, Wartung und Reifenwechsel, Schadensmeldung per App und Kosten pro Fahrzeug.",
    },
    hero: {
      titel: "Jeder Wagen eingeplant. Keine Frist verpasst.",
      problem:
        "Wer fährt heute welchen Transporter? Wann ist der Ölwechsel fällig, wann die Hauptuntersuchung? Und wer hatte den Sprinter mit dem Anhänger?",
      loesung:
        "Handwerk OS plant Fahrzeuge mit den Einsätzen, erinnert an Hauptuntersuchung, Wartung und Reifenwechsel und zeigt, was jeder Wagen kostet.",
    },
    visual: {
      bereich: "Betrieb",
      titel: "Fahrzeuge",
      untertitel: "5 Fahrzeuge · 2 Anhänger",
      kennzahlen: [
        ["5", "im Einsatz"],
        ["1", "Frist bald"],
        ["1", "Schaden gemeldet"],
      ],
      liste: {
        ueberschrift: "Diese Woche",
        zeilen: [
          { titel: "Sprinter 1 · H-MO 214", sub: "Lukas · Bad Krüger · HU im November", tag: "Frist bald", ton: "signal" },
          { titel: "Caddy 2 · H-MO 377", sub: "Tom · Kundendienst", tag: "im Einsatz", ton: "sky" },
          { titel: "Pritsche + Anhänger", sub: "Mi frei · Do Gartenstr. Entsorgung", tag: "frei Mi", ton: "moss" },
        ],
      },
      hinweis: {
        icon: "camera",
        ton: "sky",
        titel: "Neu:",
        text: "Tom hat einen Steinschlag an Caddy 2 gemeldet – mit Foto.",
      },
    },
    problemTitel: "Fahrzeuge laufen nebenher. Bis einer fehlt.",
    probleme: [
      {
        titel: "Zwei Teams, ein Sprinter",
        text: "Beide brauchen den großen Wagen für die Küchenmontage. Gemerkt wird es um 7 Uhr auf dem Hof.",
      },
      {
        titel: "Frist verpasst",
        text: "Die Hauptuntersuchung ist seit zwei Monaten fällig. Aufgefallen ist es bei der Polizeikontrolle.",
      },
      {
        titel: "Schäden ohne Meldung",
        text: "Die Delle hinten links war schon da – sagt jeder.",
      },
      {
        titel: "Kosten unklar",
        text: "Was kostet der alte Transporter im Jahr? Sprit, Werkstatt, Reifen – verteilt über drei Ordner.",
      },
    ],
    loesung: {
      titel: "Fahrzeuge planen wie Mitarbeiter.",
      text: "Jedes Fahrzeug hat ein Profil mit Kennzeichen, Fristen und Ausstattung. In der Einsatzplanung wird es mit eingeplant – der große Wagen für die Küchenmontage, die Pritsche für den Aushub. Macher erinnert an Hauptuntersuchung, Wartung und Reifenwechsel. Schäden meldet das Team mit Foto per App.",
      punkte: [
        "Fahrzeuge mit den Einsätzen einplanen",
        "Fristen: Hauptuntersuchung, Wartung, Reifen",
        "Schäden mit Foto melden",
        "Tankbelege und Werkstattkosten pro Fahrzeug",
        "Ausstattung und Ladung im Blick",
      ],
    },
    detail: {
      kopf: "Fahrzeug",
      titel: "Sprinter 1 · H-MO 214",
      sub: "Kastenwagen mit Regalsystem · Fahrer: Lukas",
      status: { text: "Frist bald", ton: "signal" },
      zeilen: [
        { label: "Hauptuntersuchung", wert: "fällig im November", hervor: true },
        { label: "Nächste Wartung", wert: "bei 120.000 km (jetzt 113.400)" },
        { label: "Reifen", wert: "Wechsel ab 20.10. eingeplant" },
        { label: "Diese Woche", wert: "Mo–Fr Bad Krüger" },
        { label: "Kosten dieses Jahr", wert: "4.820 €" },
      ],
      fuss: { icon: "calendar", text: "Werkstatttermin vorgeschlagen: Freitag, 24.10. – an dem Tag ist Sprinter 2 frei." },
    },
    schritte: [
      {
        titel: "Fahrzeuge anlegen",
        text: "Kennzeichen, Fristen, Ausstattung. Fahrer oder Kolonne zuordnen.",
      },
      {
        titel: "Mit einplanen",
        text: "Einsätze, die einen bestimmten Wagen brauchen, reservieren ihn gleich mit.",
      },
      {
        titel: "Fristen im Blick",
        text: "Macher erinnert rechtzeitig und schlägt einen Werkstatttag vor, an dem der Wagen fehlen kann.",
      },
      {
        titel: "Kosten sammeln",
        text: "Tankbelege und Werkstattrechnungen landen beim Fahrzeug.",
      },
    ],
    automatisch: [
      "plant Fahrzeuge mit den Einsätzen ein",
      "warnt bei doppelter Belegung",
      "erinnert an Hauptuntersuchung, Wartung und Reifen",
      "schlägt Werkstatttermine an ruhigen Tagen vor",
      "ordnet Tank- und Werkstattbelege dem Fahrzeug zu",
    ],
    geraete: {
      handy: [
        "Mein Fahrzeug für heute",
        "Schaden mit Foto melden",
        "Tankbeleg fotografieren",
      ],
      computer: [
        "Fahrzeugplan für die Woche",
        "Fristen und Werkstatttermine",
        "Kosten pro Fahrzeug und Jahr",
      ],
      handyVisual: {
        kopf: "Mein Fahrzeug · heute",
        titel: "Sprinter 1",
        sub: "H-MO 214 · 113.400 km",
        tags: [{ text: "HU im November", ton: "signal" }],
        felder: [
          { label: "Einsatz", wert: "Bad Krüger" },
          { label: "Ladung", wert: "Fliesen, Kleber, WC-Element" },
          { label: "Getankt", wert: "Montag" },
        ],
        aktion: { icon: "camera", text: "Schaden melden" },
      },
    },
    gewerke: [
      { slug: "bau", text: "Pritsche, Kipper, Anhänger – mit Baustelle und Kolonne geplant." },
      { slug: "galabau", text: "Fahrzeuge und Anhänger für Pflege und Neuanlage." },
      { slug: "shk", text: "Kundendienstwagen mit Ersatzteilen immer startklar." },
    ],
    kunde: {
      slug: "gruen-werk",
      text: "Wie ein Gartenbaubetrieb Fahrzeuge und Anhänger für alle Kolonnen plant.",
    },
    werkzeug: "fahrtkosten-rechner",
    faq: [
      {
        frage: "Ist das ein Fahrtenbuch?",
        antwort:
          "Nein, kein Fahrtenbuch fürs Finanzamt. Handwerk OS plant Fahrzeuge, verwaltet Fristen und sammelt Kosten. Für ein Fahrtenbuch nutzt du weiter die Lösung, die dein Steuerbüro empfiehlt.",
      },
      {
        frage: "Werden Fahrzeuge geortet?",
        antwort: "Nein. Handwerk OS weiß, wo ein Fahrzeug laut Plan im Einsatz ist. Eine Ortung braucht es dafür nicht.",
      },
      {
        frage: "Kann ich Anhänger und Maschinen auch erfassen?",
        antwort: "Ja. Anhänger planst du wie Fahrzeuge, Maschinen wie Werkzeuge – jeweils mit Fristen.",
      },
      {
        frage: "Wie kommen Tankbelege ins System?",
        antwort:
          "Der Fahrer fotografiert den Beleg in der App. Betrag und Datum werden ausgelesen und dem Fahrzeug zugeordnet.",
      },
    ],
    verwandt: ["werkzeuge", "einsatzplanung", "auswertung"],
  },

  auswertung: {
    icon: "chart",
    kurz: "Nachkalkulation für jeden Auftrag – automatisch. Du siehst, was sich lohnt und was nicht.",
    enthalten: ["Nachkalkulation", "Kosten pro Auftrag", "Auslastung", "Umsatz"],
    meta: {
      title: "Nachkalkulation und Auswertungen im Handwerk",
      description:
        "Geplant und tatsächlich nebeneinander: Handwerk OS erstellt für jeden Auftrag die Nachkalkulation aus Stunden, Material und Fahrten und zeigt, welche Leistungen und Kunden sich lohnen.",
    },
    hero: {
      titel: "Wissen, welcher Auftrag sich gelohnt hat.",
      problem:
        "Am Jahresende sagt das Steuerbüro, wie es lief. Welche Aufträge Geld gebracht haben und welche nicht, weiß man nur aus dem Bauch.",
      loesung:
        "Handwerk OS vergleicht für jeden Auftrag Plan und Wirklichkeit: Stunden, Material, Fahrten. Du siehst laufend, was übrig bleibt – pro Auftrag, Kunde und Leistung.",
    },
    visual: {
      bereich: "Betrieb",
      titel: "Auswertung · Oktober",
      untertitel: "bis heute",
      kennzahlen: [
        ["48.260 €", "Umsatz netto"],
        ["86 %", "Auslastung"],
        ["2", "unter Plan"],
      ],
      liste: {
        ueberschrift: "Nachkalkulation abgeschlossener Aufträge",
        zeilen: [
          { titel: "Dachfenster · Fr. Lindner", sub: "7,5 Std. statt 8 geplant", wert: "+ 64 €", tag: "über Plan", ton: "moss" },
          { titel: "Bad sanieren · Fam. Krüger", sub: "46,5 Std. statt 42 geplant", wert: "– 580 €", tag: "unter Plan", ton: "signal" },
          { titel: "Treppenhaus · HV Nordblick", sub: "wie geplant", wert: "± 0 €", tag: "im Plan", ton: "sky" },
        ],
      },
      hinweis: {
        icon: "chart",
        ton: "signal",
        titel: "Auffällig:",
        text: "Badsanierungen dauern im Schnitt 4 Std. länger als kalkuliert.",
      },
    },
    problemTitel: "Viel gearbeitet. Aber was ist übrig geblieben?",
    probleme: [
      {
        titel: "Erst das Steuerbüro weiß Bescheid",
        text: "Ob das Jahr gut war, erfährst du im Mai des nächsten Jahres.",
      },
      {
        titel: "Nachkalkulation? Keine Zeit.",
        text: "Dafür müsste man Stunden, Material und Fahrten zusammensuchen. Also macht es keiner.",
      },
      {
        titel: "Gefühlt gute Kunden",
        text: "Der Stammkunde mit den vielen Kleinaufträgen – lohnt der sich eigentlich?",
      },
      {
        titel: "Falsche Zeitansätze",
        text: "Badsanierungen dauern immer länger als geplant. Wie viel länger, weiß keiner genau.",
      },
    ],
    loesung: {
      titel: "Nachkalkulation ohne Mehrarbeit.",
      text: "Weil Stunden, Material und Fahrten schon beim Auftrag erfasst werden, steht die Nachkalkulation von selbst. Du siehst geplant und tatsächlich nebeneinander. Auf einen Blick erkennst du, welche Leistungen sich lohnen, welche Kunden gut sind und wo deine Zeitansätze nicht stimmen.",
      punkte: [
        "Nachkalkulation für jeden Auftrag – automatisch",
        "Geplant und tatsächlich nebeneinander",
        "Auswertung nach Leistung, Kunde und Mitarbeiter",
        "Auslastung des Teams für die nächsten Wochen",
        "Umsatz und offene Beträge im Monat",
      ],
    },
    detail: {
      kopf: "Nachkalkulation · abgeschlossen",
      titel: "Bad sanieren · Fam. Krüger",
      sub: "Auftrag A-2026-118",
      status: { text: "unter Plan", ton: "signal" },
      zeilen: [
        { label: "Stunden", wert: "46,5 statt 42" },
        { label: "Material", wert: "3.910 € statt 3.780 €" },
        { label: "Fahrten", wert: "11 statt 9" },
        { label: "Umsatz netto", wert: "12.600 €" },
        { label: "Deckungsbeitrag", wert: "3.140 € statt 3.720 €", hervor: true },
      ],
      fuss: { icon: "chart", text: "Bei Badsanierungen fehlen im Schnitt 4 Stunden. Zeitansatz anpassen?" },
    },
    schritte: [
      {
        titel: "Erfassen wie immer",
        text: "Stunden, Material und Fahrten werden im Alltag erfasst – ohne Zusatzarbeit.",
      },
      {
        titel: "Auftrag abschließen",
        text: "Mit der Rechnung steht auch die Nachkalkulation.",
      },
      {
        titel: "Vergleichen",
        text: "Geplant und tatsächlich nebeneinander. Abweichungen sind markiert.",
      },
      {
        titel: "Besser kalkulieren",
        text: "Macher schlägt vor, Zeitansätze anzupassen, wo es immer wieder hakt.",
      },
    ],
    automatisch: [
      "erstellt die Nachkalkulation für jeden Auftrag",
      "markiert Aufträge, die unter Plan liegen",
      "schlägt bessere Zeitansätze vor",
      "zeigt die Auslastung der nächsten Wochen",
      "schickt dir zum Monatsende eine kurze Übersicht",
    ],
    geraete: {
      handy: [
        "Kurze Übersicht: Umsatz, offene Beträge, Auslastung",
        "Nachkalkulation eines Auftrags ansehen",
        "Monatsübersicht als Nachricht",
      ],
      computer: [
        "Auswertungen nach Leistung, Kunde, Mitarbeiter",
        "Vergleich über Monate und Jahre",
        "Ausgabe für Steuerbüro und Bank",
      ],
      handyVisual: {
        kopf: "Übersicht · Oktober",
        titel: "Dein Monat bisher",
        sub: "Stand heute, 7:00 Uhr",
        tags: [{ text: "Auslastung 86 %", ton: "moss" }],
        felder: [
          { label: "Umsatz netto", wert: "48.260 €" },
          { label: "Offen", wert: "7.940 €" },
          { label: "Unter Plan", wert: "2 Aufträge" },
        ],
        aktion: { icon: "chart", text: "Auswertung öffnen" },
      },
    },
    gewerke: [
      { slug: "tischler", text: "Werkstatt- und Montagezeit getrennt nachkalkulieren." },
      { slug: "bau", text: "Bauabschnitte einzeln auswerten." },
      { slug: "maler", text: "Welche Leistung lohnt sich: Innenanstrich, Fassade oder Tapete?" },
    ],
    kunde: {
      slug: "tischlerei-weber",
      text: "Wie eine Tischlerei für jeden Auftrag eine Nachkalkulation hat – ohne Tabellen.",
    },
    werkzeug: "deckungsbeitrags-rechner",
    faq: [
      {
        frage: "Ersetzt das meine Buchhaltung?",
        antwort:
          "Nein. Handwerk OS zeigt dir, wie es im Betrieb läuft – Aufträge, Stunden, Material. Die Buchhaltung macht weiter dein Steuerbüro. Die Daten dafür gibst du aus Handwerk OS aus.",
      },
      {
        frage: "Woher kommen die Kosten für einen Auftrag?",
        antwort:
          "Aus den erfassten Stunden mit deinem Stundensatz, dem gebuchten Material mit Einkaufspreis und den Fahrten. Weitere Kosten wie Fremdleistungen oder Entsorgung trägst du einfach dazu ein.",
      },
      {
        frage: "Wer sieht die Auswertungen?",
        antwort: "Nur wer das Recht dazu hat – meistens Chef und Büro.",
      },
      {
        frage: "Brauche ich dafür besondere Kenntnisse?",
        antwort:
          "Nein. Die wichtigsten Zahlen stehen auf einer Seite in einfachen Worten. Wer tiefer schauen will, kann filtern.",
      },
    ],
    verwandt: ["kalkulation", "zeiterfassung", "zahlungen"],
  },

  /* ───────────────────────── Macher erledigt ───────────────────────── */

  "automatisch-erledigen": {
    icon: "spark",
    kurz: "Anrufe, Termine, Angebote, Rechnungen, Erinnerungen: Was sich wiederholt, übernimmt Macher.",
    meta: {
      title: "Macher erledigt automatisch – Büroarbeit, die sich selbst macht",
      description:
        "Macher nimmt Anrufe an, erfasst Anfragen, stimmt Termine ab, bereitet Angebote und Rechnungen vor, erkennt fehlendes Material und bleibt an offenen Zahlungen dran. Du gibst frei.",
    },
    hero: {
      titel: "Macher erledigt die Büroarbeit. Du machst das Handwerk.",
      problem:
        "Anrufe, Termine, Angebote, Rechnungen, Erinnerungen – die Büroarbeit läuft neben der Baustelle her und bleibt abends liegen.",
      loesung:
        "Macher übernimmt, was sich wiederholt: nimmt Anrufe an, stimmt Termine ab, bereitet Angebote und Rechnungen vor und bleibt an offenen Zahlungen dran. Was wichtig ist, gibst du frei.",
    },
    visual: {
      bereich: "Heute",
      titel: "Guten Morgen, Jana",
      untertitel: "Dienstag, 14. Oktober",
      kennzahlen: [
        ["14", "Aufgaben erledigt"],
        ["3", "warten auf dich"],
        ["2", "neue Anfragen"],
      ],
      liste: {
        ueberschrift: "Macher hat erledigt",
        zeilen: [
          { titel: "Anruf von Fam. Krüger aufgenommen", sub: "Notiz mit Rückrufwunsch · 07:12", tag: "erledigt", ton: "moss" },
          { titel: "Angebot „Bad sanieren“ vorbereitet", sub: "aus dem Aufmaß · wartet auf dich", tag: "zur Freigabe", ton: "signal" },
          { titel: "Termin mit Hr. Petersen bestätigt", sub: "Erinnerung geht morgen raus", tag: "erledigt", ton: "moss" },
        ],
      },
      hinweis: {
        icon: "box",
        ton: "signal",
        titel: "Material fehlt:",
        text: "Duschrinne für Montag. Die Bestellung ist vorbereitet.",
      },
    },
    aufgaben: [
      {
        titel: "Anrufe aufnehmen",
        icon: "phone",
        funktion: "telefon-ki",
        vorher: "Anruf verpasst, auf der Mailbox ein halber Satz. Abends wartet ein Stapel Rückrufe.",
        nachher: "Macher geht ran, fragt das Anliegen ab und legt dir eine Notiz mit Rückrufwunsch an. Den Telefonassistenten richten wir auf Anfrage für deinen Betrieb ein.",
        duEntscheidest: "wann Macher rangeht und was er fragt",
      },
      {
        titel: "Anfragen erfassen",
        icon: "inbox",
        funktion: "anfragen",
        vorher: "Mails und Zettel abtippen, fehlenden Angaben hinterhertelefonieren.",
        nachher: "Jede Anfrage wird angelegt, der Kunde erkannt, fehlende Fotos und Adresse werden nachgefragt.",
        duEntscheidest: "welche Anfragen du annimmst",
      },
      {
        titel: "Termine abstimmen",
        icon: "calendar",
        funktion: "kalender",
        vorher: "Drei Anrufe pro Termin. Und dann vergisst der Kunde ihn trotzdem.",
        nachher: "Der Kunde bucht aus passenden Zeiten und bekommt Bestätigung und Erinnerung am Vortag.",
        duEntscheidest: "welche Zeiten buchbar sind",
      },
      {
        titel: "Angebote vorbereiten",
        icon: "file",
        funktion: "angebote",
        vorher: "Abends Positionen zusammensuchen und Preise nachschlagen.",
        nachher: "Das Angebot aus Anfrage, Aufmaß und deinen Vorlagen liegt fertig zum Prüfen bereit.",
        duEntscheidest: "Preis und Inhalt – kein Angebot geht ohne dich raus",
      },
      {
        titel: "Aufträge einplanen",
        icon: "route",
        funktion: "einsatzplanung",
        vorher: "Abends die Plantafel umstecken, morgens wegen einer Krankmeldung alles umwerfen.",
        nachher: "Vorschlag mit passenden Leuten, Fahrzeug und Material – und Ersatz, wenn jemand ausfällt.",
        duEntscheidest: "bestätigen oder umschieben",
      },
      {
        titel: "Kunden informieren",
        icon: "chat",
        funktion: "auftraege",
        vorher: "„Wann kommen Sie denn?“ Kunden rufen an, weil ihnen keiner Bescheid gesagt hat.",
        nachher: "Der Kunde bekommt eine Nachricht: Termin bestätigt, Team unterwegs, Arbeit fertig.",
        duEntscheidest: "welche Nachrichten rausgehen und in welchem Ton",
      },
      {
        titel: "Fehlendes Material erkennen",
        icon: "box",
        funktion: "material",
        vorher: "Auf der Baustelle merken, dass etwas fehlt. Eine Stunde zum Großhändler und zurück.",
        nachher: "Drei Tage vor dem Start kommt die Meldung, was fehlt – mit fertigem Bestellvorschlag.",
        duEntscheidest: "ob und wo bestellt wird",
      },
      {
        titel: "Rechnungen vorbereiten",
        icon: "euro",
        funktion: "rechnungen",
        vorher: "Samstags Stundenzettel abtippen. Zusatzarbeiten gehen dabei unter.",
        nachher: "Nach der Abnahme liegt die Rechnung mit Stunden, Material und Zusatzarbeiten als Entwurf bereit.",
        duEntscheidest: "prüfen und freigeben",
      },
      {
        titel: "Offene Zahlungen verfolgen",
        icon: "chart",
        funktion: "zahlungen",
        vorher: "Kontoauszug neben die Rechnungsliste legen. Die Mahnung schieben, weil sie unangenehm ist.",
        nachher: "Zahlungen werden zugeordnet, nach der Frist geht eine freundliche Erinnerung raus.",
        duEntscheidest: "Mahnungen gibst nur du frei",
      },
      {
        titel: "Mitarbeiter an Schulungen erinnern",
        icon: "award",
        funktion: "schulungen",
        vorher: "Fristen stehen im Ordner. Die Unterweisung fällt erst auf, wenn jemand fragt.",
        nachher: "Jeder wird rechtzeitig erinnert, die Bestätigung mit Unterschrift landet in der App.",
        duEntscheidest: "welche Schulungen für wen gelten",
      },
    ],
    prinzipien: [
      {
        titel: "Macher schlägt vor. Du entscheidest.",
        text: "Alles, was Geld kostet oder nach außen geht, gibst du frei – so lange du willst.",
        skizze: "freigabe",
      },
      {
        titel: "Du bestimmst, wie viel.",
        text: "Für jede Aufgabe stellst du ein: aus, nur vorschlagen oder selbst erledigen.",
        skizze: "stufen",
      },
      {
        titel: "Alles nachvollziehbar.",
        text: "Jede Aktion von Macher steht im Verlauf: was, wann und warum.",
        skizze: "verlauf",
      },
      {
        titel: "Ehrlich zu deinen Kunden.",
        text: "Am Telefon und in Nachrichten sagt Macher offen, dass er der digitale Assistent deines Betriebs ist.",
        skizze: "ehrlich",
      },
    ],
    tagesablauf: [
      { zeit: "06:40", text: "Tom meldet sich krank. Macher zeigt drei betroffene Einsätze und schlägt Ersatz vor." },
      { zeit: "07:15", text: "Du bestätigst vom Handy. Kunden mit geändertem Team bekommen eine Nachricht." },
      { zeit: "09:30", text: "Zwei Anrufe, während das Büro telefoniert. Macher nimmt beide an und legt Notizen an." },
      { zeit: "12:05", text: "Neue Anfrage übers Webformular. Fotos fehlen – Macher fragt beim Kunden nach." },
      { zeit: "15:46", text: "Fr. Lindner unterschreibt die Abnahme. Die Rechnung liegt als Entwurf bereit." },
      { zeit: "17:00", text: "Für Montag fehlt die Duschrinne. Die Bestellung ist vorbereitet, du gibst sie frei." },
      { zeit: "19:30", text: "Du bist zu Hause. Der Küchentisch bleibt frei." },
    ],
    gewerke: [
      { slug: "elektriker", text: "Viele Kleinaufträge, viele Anrufe – Macher hält dir den Rücken frei." },
      { slug: "shk", text: "Wartung, Notdienst und Kundendienst laufen fast von selbst." },
      { slug: "maler", text: "Angebote aus dem Aufmaß, Termine ohne Telefon-Pingpong." },
    ],
    kunde: {
      slug: "elektro-brandt",
      text: "Wie ein Elektrobetrieb die Büroarbeit Schritt für Schritt an Macher abgibt.",
    },
    faq: [
      {
        frage: "Macht Macher auch Fehler?",
        antwort:
          "Macher kann sich irren – wie jeder. Deshalb gibst du alles frei, was nach außen geht oder Geld betrifft. Alles, was Macher getan hat, kannst du im Verlauf nachlesen.",
      },
      {
        frage: "Muss ich alles automatisch erledigen lassen?",
        antwort:
          "Nein. Für jede Aufgabe entscheidest du: aus, nur vorschlagen oder selbst erledigen. Viele starten mit Vorschlägen und geben später mehr ab.",
      },
      {
        frage: "Ist Macher eine künstliche Intelligenz?",
        antwort:
          "Macher nutzt moderne Sprach- und Planungstechnik, damit er Anrufe versteht, Texte schreibt und Pläne vorschlägt. Für dich zählt: Er erledigt Büroarbeit – und du behältst die Kontrolle.",
      },
      {
        frage: "Wie lernt Macher meinen Betrieb kennen?",
        antwort:
          "Beim Start sagst du, welcher Betrieb du bist. Macher liest Gewerk und Leistungen von deiner Website oder nimmt die Vorlage deines Gewerks. Dazu kommen deine Vorlagen, Preise und Regeln. Daraus weiß Macher, wie bei dir gearbeitet wird.",
      },
    ],
    verwandt: ["telefon", "einsatzplanung", "rechnungen"],
  },
};
