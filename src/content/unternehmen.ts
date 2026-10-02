import type { IconName } from "@/components/ui";

/**
 * Inhalte für Unternehmens- und Rechtsseiten.
 *
 * Die Rechtstexte unten sind ausformuliert, sollten aber vor dem Start einmal anwaltlich geprüft werden.
 * Offene Angaben in eckigen Klammern werden auf der Seite sichtbar markiert.
 */

export const KONTAKT_EMAIL = "hallo@macher-os.de";
export const SUPPORT_EMAIL = "support@macher-os.de";
export const PARTNER_EMAIL = "partner@macher-os.de";
export const PRESSE_EMAIL = "presse@macher-os.de";
export const KARRIERE_EMAIL = "karriere@macher-os.de";
export const DATENSCHUTZ_EMAIL = "datenschutz@macher-os.de";

/** Ein Anliegen, das im Formular ausgewählt werden kann. */
export type Anliegen = {
  id: string;
  label: string;
  beschreibung: string;
  icon: IconName;
  /** Empfänger der E-Mail. */
  email: string;
  /** Hinweis über dem Textfeld. */
  platzhalter: string;
};

/** Auswahl auf `/kontakt` (Abschnitt 33). */
export const kontaktAnliegen: Anliegen[] = [
  {
    id: "produkt",
    label: "Frage zum Produkt",
    beschreibung: "Was kann Macher OS? Passt es zu meinem Betrieb?",
    icon: "chat",
    email: KONTAKT_EMAIL,
    platzhalter: "Was möchtest du wissen? Erzähl gern kurz von deinem Betrieb.",
  },
  {
    id: "hilfe",
    label: "Hilfe",
    beschreibung: "Du nutzt Macher OS schon und kommst nicht weiter.",
    icon: "shield",
    email: SUPPORT_EMAIL,
    platzhalter: "Wobei hängst du gerade? Was hast du schon versucht?",
  },
  {
    id: "partnerschaft",
    label: "Partnerschaft",
    beschreibung: "Steuerberater, Großhändler, Verband oder Berater.",
    icon: "link",
    email: PARTNER_EMAIL,
    platzhalter: "Wer seid ihr und wie stellt ihr euch die Zusammenarbeit vor?",
  },
  {
    id: "presse",
    label: "Presse",
    beschreibung: "Anfragen für Artikel, Interviews und Material.",
    icon: "file",
    email: PRESSE_EMAIL,
    platzhalter: "Für welches Medium schreibst du und worum geht es?",
  },
  {
    id: "sonstiges",
    label: "Sonstiges",
    beschreibung: "Alles andere – wir lesen jede Nachricht.",
    icon: "inbox",
    email: KONTAKT_EMAIL,
    platzhalter: "Worum geht es?",
  },
];

/** Grundsätze, die auf Über uns und Karriere auftauchen. */
export const werte: { titel: string; text: string; icon: IconName }[] = [
  {
    titel: "Handwerk zuerst",
    text: "Wir bauen für Leute, die mit den Händen arbeiten. Jede Funktion muss auf der Baustelle bestehen, nicht nur im Büro.",
    icon: "wrench",
  },
  {
    titel: "Einfach vorne",
    text: "Jeder sieht nur, was er für seine Arbeit braucht. Wenn etwas erklärt werden muss, ist es noch nicht fertig.",
    icon: "smartphone",
  },
  {
    titel: "Vollständig hinten",
    text: "Im Hintergrund hängt alles zusammen: Auftrag, Plan, Material, Zeit und Rechnung. Nichts wird doppelt eingetippt.",
    icon: "layers",
  },
  {
    titel: "Ehrlich und klar",
    text: "Klare Preise, klare Sprache, keine Versprechen, die wir nicht halten. Deine Daten gehören dir.",
    icon: "shield",
  },
];

/** Partnergruppen auf `/partner` (Abschnitt 34). */
export const partnerGruppen: {
  id: string;
  titel: string;
  text: string;
  nutzen: string[];
  icon: IconName;
}[] = [
  {
    id: "steuerberater",
    titel: "Steuerberater",
    text: "Eure Handwerksmandanten liefern sauberere Belege – ohne Schuhkarton.",
    nutzen: ["Rechnungen und Zahlungen geordnet", "Übergabe per Export, z. B. für DATEV", "weniger Rückfragen"],
    icon: "calculator",
  },
  {
    id: "grosshaendler",
    titel: "Großhändler",
    text: "Eure Kunden bestellen dort, wo sie planen und kalkulieren.",
    nutzen: ["Artikeldaten z. B. per Datanorm", "Bestellungen direkt aus dem Auftrag", "weniger Fehlbestellungen"],
    icon: "warehouse",
  },
  {
    id: "verbaende",
    titel: "Verbände & Innungen",
    text: "Digitale Arbeit verständlich machen – für eure Mitgliedsbetriebe.",
    nutzen: ["gemeinsame Webinare", "Vorlagen und Checklisten", "Angebote für Mitglieder"],
    icon: "users",
  },
  {
    id: "berater",
    titel: "Berater",
    text: "Ihr begleitet Betriebe bei Abläufen und Digitalisierung.",
    nutzen: ["Zugang zu Testkonten", "Unterlagen für Schulungen", "direkter Draht zu uns"],
    icon: "chat",
  },
  {
    id: "hersteller",
    titel: "Hersteller",
    text: "Eure Produkte sauber im Auftrag – von der Planung bis zur Wartung.",
    nutzen: ["Produktdaten im Material", "Wartungsintervalle im Plan", "Schulungen für Monteure"],
    icon: "box",
  },
  {
    id: "integration",
    titel: "Integrationspartner",
    text: "Eure Software spricht mit Macher OS – statt Daten doppelt zu pflegen.",
    nutzen: ["Daten austauschen statt abtippen", "gemeinsame Kunden", "technische Abstimmung"],
    icon: "link",
  },
];

/** Anbieter von Macher OS. */
export const firma = {
  name: "Peak Atlas Group",
  rechtsform: "AG",
  anschrift: "Eichhornstraße 5",
  ort: "97070 Würzburg",
  vorstand: "Philipp Rückert",
  vertreten: "Philipp Rückert (Vorstand)",
  register: "Amtsgericht Würzburg",
  registernummer: "HRB 17861",
  /** Umsatzsteuer-Identifikationsnummer – leer lassen, bis sie vorliegt; dann erscheint sie im Impressum. */
  ustId: "",
  email: KONTAKT_EMAIL,
};

const anbieter = `${firma.name} ${firma.rechtsform}`;
const anbieterAnschrift = `${anbieter}, ${firma.anschrift}, ${firma.ort}`;

/** Stand der Rechtstexte. */
export const rechtStand = "2. Oktober 2026";

/** Dienstleister, die für Website und Macher OS Daten verarbeiten (Datenschutz + Anlage 2 der AVV). */
export const dienstleister: { name: string; sitz: string; zweck: string; ort: string }[] = [
  {
    name: "Vercel Inc.",
    sitz: "Covina, USA",
    zweck: "Hosting von Website und Macher OS, Server-Funktionen",
    ort: "Rechenzentrum Frankfurt am Main",
  },
  {
    name: "Supabase Inc.",
    sitz: "Wilmington, USA",
    zweck: "Datenbank, Anmeldung, Dateispeicher",
    ort: "Rechenzentrum Frankfurt am Main (AWS eu-central-1)",
  },
  {
    name: "Plus Five Five, Inc. (Resend)",
    sitz: "San Francisco, USA",
    zweck: "Versand von E-Mails (Anmeldung, Angebote, Rechnungen, Benachrichtigungen)",
    ort: "EU-Region, soweit verfügbar",
  },
  {
    name: "seven communications GmbH & Co. KG (seven.io)",
    sitz: "Kiel, Deutschland",
    zweck: "Versand von SMS (Anmeldecodes, Einladungen, Nachrichten an Kunden)",
    ort: "Deutschland",
  },
  {
    name: "Anthropic",
    sitz: "San Francisco, USA",
    zweck: "KI-Funktionen, z. B. Briefkopf aus Foto, Preisliste lesen, Positionen aus Sprache",
    ort: "USA",
  },
  {
    name: "Stripe Payments Europe, Ltd.",
    sitz: "Dublin, Irland",
    zweck: "Abrechnung des Abos (SEPA-Lastschrift, Karte)",
    ort: "EU, teilweise USA",
  },
  {
    name: "Meta Platforms Ireland Ltd.",
    sitz: "Dublin, Irland",
    zweck: "Nachrichten über WhatsApp Business – nur wenn der Betrieb das einschaltet",
    ort: "EU, teilweise USA",
  },
];

/** Ein Abschnitt einer Rechtsseite. */
export type RechtsAbschnitt = {
  id: string;
  titel: string;
  absaetze?: string[];
  liste?: string[];
};

/* ------------------------------------------------------------------ */
/* Rechtstexte                                                         */
/* ------------------------------------------------------------------ */

export const impressumAbschnitte: RechtsAbschnitt[] = [
  {
    id: "anbieter",
    titel: "Angaben gemäß § 5 DDG",
    absaetze: [anbieter, `${firma.anschrift}, ${firma.ort}`],
  },
  {
    id: "vertretung",
    titel: "Vertreten durch den Vorstand",
    absaetze: [firma.vorstand],
  },
  {
    id: "kontakt",
    titel: "Kontakt",
    liste: [`E-Mail: ${firma.email}`],
  },
  {
    id: "register",
    titel: "Registereintrag",
    liste: [`Registergericht: ${firma.register}`, `Registernummer: ${firma.registernummer}`],
  },
  ...(firma.ustId
    ? [
        {
          id: "umsatzsteuer",
          titel: "Umsatzsteuer-ID",
          absaetze: [`Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz: ${firma.ustId}`],
        },
      ]
    : []),
  {
    id: "verantwortlich",
    titel: "Verantwortlich für den Inhalt",
    absaetze: [`Verantwortlich nach § 18 Abs. 2 MStV: ${firma.vorstand}, ${firma.anschrift}, ${firma.ort}`],
  },
  {
    id: "streitbeilegung",
    titel: "Verbraucherstreitbeilegung",
    absaetze: [
      "Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.",
    ],
  },
  {
    id: "haftung",
    titel: "Haftung für Inhalte und Links",
    absaetze: [
      "Wir erstellen die Inhalte dieser Website mit Sorgfalt. Für Richtigkeit, Vollständigkeit und Aktualität sind wir im Rahmen der gesetzlichen Vorschriften verantwortlich.",
      "Unsere Website kann Links zu Websites Dritter enthalten. Für deren Inhalte sind die jeweiligen Anbieter verantwortlich. Werden uns Rechtsverletzungen bekannt, entfernen wir solche Links umgehend.",
    ],
  },
  {
    id: "bilder",
    titel: "Bildnachweise",
    absaetze: ["Die Nachweise zu Fotos und Grafiken stehen auf der Seite Bildnachweise."],
  },
];

export const datenschutzAbschnitte: RechtsAbschnitt[] = [
  {
    id: "verantwortlicher",
    titel: "Verantwortlicher",
    absaetze: [
      "Verantwortlich für die Verarbeitung personenbezogener Daten auf dieser Website und in Macher OS ist:",
      `${anbieterAnschrift}, vertreten durch den Vorstand ${firma.vorstand}.`,
      `Fragen zum Datenschutz: ${DATENSCHUTZ_EMAIL}`,
    ],
  },
  {
    id: "ueberblick",
    titel: "Überblick: Welche Daten wir verarbeiten",
    liste: [
      "Daten, die beim Besuch der Website oder beim Öffnen von Macher OS technisch anfallen (z. B. IP-Adresse, Zeitpunkt, aufgerufene Seite, Browser)",
      "Daten, die du uns selbst mitteilst (z. B. per E-Mail oder bei der Anmeldung)",
      "Daten zu deinem Konto, deinem Betrieb und deinem Abo",
      "Daten, die du als Betrieb in Macher OS über deine Kunden, Mitarbeiter und Aufträge speicherst – diese verarbeiten wir in deinem Auftrag (siehe „Daten deines Betriebs“)",
    ],
  },
  {
    id: "hosting",
    titel: "Hosting und Server-Logdateien",
    absaetze: [
      "Website und Macher OS laufen bei Vercel Inc. (USA) im Rechenzentrum Frankfurt am Main. Die Datenbank und die Dateien von Macher OS liegen bei Supabase Inc. (USA), ebenfalls im Rechenzentrum Frankfurt am Main.",
      "Beim Aufruf werden technisch notwendige Daten in Server-Logdateien gespeichert: IP-Adresse, Datum und Uhrzeit, aufgerufene Adresse, übertragene Datenmenge, Browser und Betriebssystem. Wir brauchen sie, um Website und Software sicher und stabil bereitzustellen und Angriffe zu erkennen.",
      "Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem sicheren Betrieb). Die Logdateien werden nach spätestens 30 Tagen gelöscht.",
    ],
  },
  {
    id: "kontaktaufnahme",
    titel: "Kontaktaufnahme per E-Mail",
    absaetze: [
      "Die Kontaktformulare auf dieser Website verschicken nichts selbst. Sie öffnen dein E-Mail-Programm mit einer vorbereiteten Nachricht. Erst wenn du diese E-Mail abschickst, erhalten wir deine Angaben.",
      "Wir verarbeiten deine Angaben, um deine Anfrage zu beantworten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertrag oder vorvertragliche Maßnahmen) bzw. lit. f DSGVO (berechtigtes Interesse an der Beantwortung).",
      "Wir löschen die Nachrichten, wenn die Anfrage erledigt ist und keine Rückfragen mehr zu erwarten sind, spätestens nach 2 Jahren. Geschäftsbriefe bewahren wir so lange auf, wie das Handels- und Steuerrecht es verlangt (6 bzw. 8 Jahre).",
    ],
  },
  {
    id: "konto",
    titel: "Anmeldung und Konto in Macher OS",
    absaetze: [
      "Für ein Konto brauchen wir deine E-Mail-Adresse oder Handynummer, deinen Namen und die Angaben zu deinem Betrieb. Die Anmeldung läuft ohne Passwort: per Link oder Code per E-Mail bzw. SMS. Wenn du „Mit Google anmelden“ wählst, erhalten wir von Google (Google Ireland Limited, Dublin) deinen Namen und deine E-Mail-Adresse.",
      "Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertrag). Wir speichern die Daten, solange dein Konto besteht. Nach dem Löschen des Kontos löschen wir sie innerhalb von 30 Tagen, soweit keine Aufbewahrungspflicht besteht.",
    ],
  },
  {
    id: "betriebsdaten",
    titel: "Daten deines Betriebs",
    absaetze: [
      "Was du in Macher OS über deine Kunden, Mitarbeiter, Aufträge, Termine, Zeiten, Fotos, Angebote und Rechnungen speicherst, verarbeiten wir nur in deinem Auftrag und nach deinen Weisungen. Verantwortlich für diese Daten bist du als Betrieb. Dafür gilt unser Vertrag zur Auftragsverarbeitung nach Art. 28 DSGVO (Seite „Auftragsverarbeitung“).",
      "Das gilt auch für deine Kunden, wenn sie einen Link aus Macher OS öffnen (z. B. Kundenbereich, Angebot, Terminbuchung): Wir vermerken für dich, dass und wann der Link geöffnet wurde.",
    ],
  },
  {
    id: "versand",
    titel: "E-Mails, SMS und Benachrichtigungen",
    absaetze: [
      "E-Mails verschicken wir über Resend (Plus Five Five, Inc., USA), SMS über seven.io (seven communications GmbH & Co. KG, Kiel). Wenn ein Betrieb es einschaltet, gehen Nachrichten auch über WhatsApp Business (Meta Platforms Ireland Ltd., Dublin).",
      "Wenn du Benachrichtigungen auf deinem Gerät einschaltest, speichern wir die technische Adresse deines Geräts beim Push-Dienst deines Browsers (z. B. Google, Apple, Mozilla). Du kannst Benachrichtigungen jederzeit in Macher OS oder in deinem Browser abschalten; dann löschen wir die Adresse.",
      "Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertrag).",
    ],
  },
  {
    id: "ki",
    titel: "KI-Funktionen",
    absaetze: [
      "Einige Funktionen nutzen künstliche Intelligenz, z. B. Briefkopf aus dem Foto einer Rechnung lesen, Preisliste übernehmen oder Positionen aus gesprochenem Text bilden. Dafür schicken wir nur die dafür nötigen Inhalte (z. B. das Foto oder den Text) an Anthropic (USA). Anthropic verwendet diese Daten nach seinen Geschäftsbedingungen nicht zum Training seiner Modelle.",
      "KI-Ergebnisse sind immer Vorschläge. Du prüfst und bestätigst sie, bevor sie gespeichert oder verschickt werden.",
      "Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertrag); für Daten deines Betriebs gilt der Vertrag zur Auftragsverarbeitung.",
    ],
  },
  {
    id: "zahlung",
    titel: "Bezahlung des Abos",
    absaetze: [
      "Die Abrechnung läuft über Stripe (Stripe Payments Europe, Ltd., Dublin). Deine Kontoverbindung oder Kartendaten gibst du direkt bei Stripe ein; wir sehen sie nicht vollständig. Wir erhalten von Stripe den Zahlungsstatus, die Zahlungsart (z. B. „Lastschrift, Endung 1234“) und die Rechnungen.",
      "Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertrag) und lit. c DSGVO (steuerrechtliche Pflichten). Rechnungen und Buchungsbelege bewahren wir 8 Jahre auf.",
    ],
  },
  {
    id: "messung",
    titel: "Messung ohne Cookies",
    absaetze: [
      "Um Macher OS besser zu machen, zählen wir in der Software einzelne Schritte, z. B. „Einrichtung fertig“ oder „Angebot versendet“. Dabei speichern wir nur den Namen des Schritts, die Uhrzeit, deinen Betrieb und grobe Werte (z. B. Dauer in Sekunden) – keine Inhalte wie Kundennamen oder Beträge, keine Cookies, kein Profil über mehrere Websites.",
      "Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer funktionierenden, verständlichen Software). Du kannst jederzeit widersprechen; schreib dafür an die Adresse oben. Die Messwerte löschen wir nach spätestens 24 Monaten.",
    ],
  },
  {
    id: "cookies",
    titel: "Cookies und Speicher im Browser",
    absaetze: [
      "Wir setzen keine Cookies oder Werkzeuge für Werbung oder Analyse ein. Deshalb gibt es auch kein Cookie-Banner.",
      "Macher OS speichert technisch notwendige Daten in deinem Browser: deine Anmeldung, die Daten deines Betriebs für die Arbeit ohne Netz und Einstellungen wie die gewählte Ansicht. Die Website merkt sich für die laufende Sitzung, ob du den Markenauftakt schon gesehen hast. Rechtsgrundlage ist § 25 Abs. 2 Nr. 2 TDDDG; die Daten bleiben, bis du dich abmeldest oder sie in deinem Browser löschst.",
      "Links zu Karten (z. B. „Route öffnen“) öffnen Google Maps erst, wenn du darauf tippst. Ab dann gilt die Datenschutzerklärung von Google.",
    ],
  },
  {
    id: "empfaenger",
    titel: "Empfänger und Dienstleister",
    absaetze: [
      "Wir setzen Dienstleister ein, die Daten nur nach unserer Weisung verarbeiten (Auftragsverarbeitung nach Art. 28 DSGVO):",
    ],
    liste: dienstleister.map((d) => `${d.name}, ${d.sitz} – ${d.zweck} (Verarbeitung: ${d.ort})`),
  },
  {
    id: "drittland",
    titel: "Übermittlung in Drittländer",
    absaetze: [
      "Die Daten von Macher OS speichern wir in Frankfurt am Main. Einige Dienstleister haben ihren Sitz in den USA oder gehören zu Unternehmen dort, sodass ein Zugriff aus den USA nicht ausgeschlossen ist; Anthropic verarbeitet die Inhalte für KI-Funktionen in den USA.",
      "Grundlage dafür ist der Angemessenheitsbeschluss der EU-Kommission für das EU-US Data Privacy Framework, soweit der Anbieter danach zertifiziert ist, und sonst die Standardvertragsklauseln der EU-Kommission (Art. 46 Abs. 2 lit. c DSGVO).",
    ],
  },
  {
    id: "speicherdauer",
    titel: "Speicherdauer",
    absaetze: [
      "Wir speichern personenbezogene Daten nur so lange, wie es für den jeweiligen Zweck nötig ist. Die Fristen stehen bei den einzelnen Abschnitten. Gesetzliche Aufbewahrungspflichten gehen vor: Buchungsbelege und Rechnungen 8 Jahre, Handels- und Geschäftsbriefe 6 Jahre, Bücher und Jahresabschlüsse 10 Jahre.",
    ],
  },
  {
    id: "rechte",
    titel: "Deine Rechte",
    absaetze: [`Du hast nach der DSGVO folgende Rechte. Schreib uns dafür einfach an ${DATENSCHUTZ_EMAIL}.`],
    liste: [
      "Auskunft (Art. 15 DSGVO)",
      "Berichtigung (Art. 16 DSGVO)",
      "Löschung (Art. 17 DSGVO)",
      "Einschränkung der Verarbeitung (Art. 18 DSGVO)",
      "Datenübertragbarkeit (Art. 20 DSGVO)",
      "Widerspruch gegen Verarbeitungen auf Grundlage berechtigter Interessen (Art. 21 DSGVO)",
      "Widerruf einer Einwilligung mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO)",
      "Beschwerde bei einer Datenschutz-Aufsichtsbehörde (Art. 77 DSGVO), z. B. bei der für uns zuständigen: Bayerisches Landesamt für Datenschutzaufsicht, Promenade 18, 91522 Ansbach",
    ],
  },
  {
    id: "sicherheit",
    titel: "Datensicherheit",
    absaetze: [
      "Alle Verbindungen sind verschlüsselt (TLS). Die Daten liegen verschlüsselt in Frankfurt am Main. Jeder Betrieb sieht nur seine eigenen Daten – das stellt die Datenbank selbst sicher. Innerhalb eines Betriebs sehen Mitarbeiter nur, was ihre Rolle erlaubt; Geld und Lohnkosten zum Beispiel nur Chef und Büro. Änderungen werden protokolliert, gelöschte Einträge lassen sich wiederherstellen.",
    ],
  },
  {
    id: "aenderungen",
    titel: "Änderungen dieser Datenschutzerklärung",
    absaetze: [
      "Wir passen diese Erklärung an, wenn sich unsere Website, Macher OS oder die Rechtslage ändert. Es gilt die jeweils hier veröffentlichte Fassung.",
    ],
  },
];

export const agbAbschnitte: RechtsAbschnitt[] = [
  {
    id: "geltung",
    titel: "Geltungsbereich",
    absaetze: [
      `Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge über die Nutzung von Macher OS zwischen der ${anbieterAnschrift} („Anbieter“, „wir“) und dem Kunden.`,
      "Macher OS richtet sich ausschließlich an Unternehmer im Sinne von § 14 BGB, also an Betriebe, Selbstständige und Unternehmen. Verbraucher können keinen Vertrag schließen.",
      "Abweichende Bedingungen des Kunden gelten nur, wenn wir ihnen ausdrücklich in Textform zustimmen.",
    ],
  },
  {
    id: "leistung",
    titel: "Leistungen",
    absaetze: [
      "Wir stellen Macher OS als Software über das Internet bereit – im Browser und als installierbare App. Der Funktionsumfang ergibt sich aus der Beschreibung auf unserer Website zum Zeitpunkt des Vertragsschlusses. In jedem Plan sind alle Funktionen enthalten; die Pläne unterscheiden sich nur nach der Zahl der aktiven Personen im Betrieb.",
      "Wir entwickeln Macher OS laufend weiter. Wir dürfen Funktionen ändern, wenn dadurch der vereinbarte Zweck nicht wesentlich eingeschränkt wird. Fällt eine wesentliche Funktion weg, informieren wir den Kunden mindestens 6 Wochen vorher; er kann dann zum Zeitpunkt der Änderung kündigen.",
      "Wir bemühen uns um eine möglichst unterbrechungsfreie Verfügbarkeit. Geplante Wartungen legen wir möglichst außerhalb der üblichen Arbeitszeiten (werktags 6 bis 19 Uhr) und kündigen längere Wartungen in Macher OS vorher an. Eine bestimmte Verfügbarkeit sichern wir nur zu, wenn das gesondert vereinbart ist. Ausfälle durch Störungen außerhalb unseres Einflussbereichs (z. B. Internetanbieter des Kunden, höhere Gewalt) gehen nicht zu unseren Lasten.",
      "Ergebnisse von KI-Funktionen sind Vorschläge. Der Kunde prüft sie, bevor er sie verwendet oder verschickt.",
      "Für den Versand von E-Mails, SMS und WhatsApp-Nachrichten aus Macher OS an Kunden des Kunden setzen wir Dienstleister ein. Wir stellen den Versand bereit, schulden aber nicht die Zustellung beim Empfänger.",
    ],
  },
  {
    id: "vertragsschluss",
    titel: "Vertragsschluss und Testphase",
    absaetze: [
      "Der Vertrag über die Testphase kommt zustande, wenn der Kunde Macher OS einrichtet und ein Konto anlegt. Die Testphase dauert 30 Tage, ist kostenlos und braucht keine Zahlungsdaten. Sie endet automatisch; sie verlängert sich nicht von selbst in ein kostenpflichtiges Abo.",
      "Der kostenpflichtige Vertrag kommt zustande, wenn der Kunde in Macher OS unter „Dein Plan“ einen Plan wählt und den Bezahlvorgang abschließt.",
      "Nach dem Ende der Testphase ohne Abo bleibt Macher OS lesbar: Der Kunde kann seine Daten ansehen und exportieren, aber nichts Neues anlegen. Kundenbereich und Links zu bereits versendeten Rechnungen funktionieren weiter. Die Daten bleiben 12 Monate gespeichert; vor dem Löschen erinnern wir den Kunden per E-Mail.",
    ],
  },
  {
    id: "pflichten",
    titel: "Pflichten des Kunden",
    liste: [
      "Anmeldezugänge (E-Mail-Postfach, Handy) vor Unbefugten schützen und uns einen Missbrauch sofort melden",
      "nur Personen Zugang geben, die zum Betrieb gehören oder für ihn arbeiten",
      "Macher OS nicht missbräuchlich oder rechtswidrig nutzen, insbesondere keine Werbung ohne Einwilligung des Empfängers verschicken",
      "für die Rechtmäßigkeit der eingegebenen Daten verantwortlich sein, insbesondere für Daten seiner Kunden und Mitarbeiter",
      "steuer- und handelsrechtliche Pflichten selbst erfüllen (z. B. Aufbewahrung nach GoBD, Prüfung von Rechnungen vor dem Versand); Macher OS unterstützt dabei, ersetzt aber weder Steuerberater noch Buchhaltung",
      "wichtige Daten regelmäßig über den Export sichern, wenn er sie unabhängig von Macher OS braucht",
    ],
  },
  {
    id: "preise",
    titel: "Preise und Zahlung",
    absaetze: [
      "Es gelten die Preise, die bei Abschluss des Abos auf der Preisseite und in Macher OS genannt sind. Alle Preise verstehen sich zuzüglich der gesetzlichen Umsatzsteuer.",
      "Der Preis richtet sich nach der Zahl der aktiven Personen im Betrieb. Wächst der Betrieb über die Grenze seines Plans, fragen wir vor einer Umstellung nach. Ändert sich der Plan während eines Abrechnungszeitraums, rechnen wir anteilig ab.",
      "Abgerechnet wird monatlich oder – auf Wunsch mit Rabatt – jährlich, jeweils im Voraus. Der Kunde zahlt per SEPA-Lastschrift oder Karte über unseren Zahlungsdienstleister Stripe. Die Rechnung kommt als E-Rechnung per E-Mail.",
      "Schlägt eine Zahlung fehl, erinnern wir den Kunden bis zu dreimal. Ist der Betrag 14 Tage nach der ersten Erinnerung nicht bezahlt, schalten wir Macher OS in den Lesemodus (siehe Testphase). Daten gehen dabei nicht verloren. Kosten einer zurückgegebenen Lastschrift trägt der Kunde, wenn er sie zu vertreten hat.",
      "Preisänderungen teilen wir mindestens 6 Wochen vorher in Textform mit. Sie gelten ab dem nächsten Abrechnungszeitraum. Der Kunde kann bis zum Inkrafttreten kündigen; darauf weisen wir in der Mitteilung hin.",
    ],
  },
  {
    id: "laufzeit",
    titel: "Laufzeit und Kündigung",
    absaetze: [
      "Das monatliche Abo läuft auf unbestimmte Zeit und kann jederzeit zum Ende des laufenden Monats gekündigt werden. Das jährliche Abo verlängert sich um jeweils ein Jahr, wenn es nicht bis zum Ende der Laufzeit gekündigt wird.",
      "Der Kunde kann direkt in Macher OS unter „Dein Plan“ kündigen oder per E-Mail. Wir können mit einer Frist von 3 Monaten zum Monatsende kündigen.",
      "Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt. Ein wichtiger Grund liegt für uns insbesondere vor, wenn der Kunde Macher OS trotz Hinweis rechtswidrig nutzt.",
    ],
  },
  {
    id: "daten",
    titel: "Daten des Kunden",
    absaetze: [
      "Die Daten, die der Kunde in Macher OS speichert, gehören dem Kunden. Er kann sie jederzeit kostenlos exportieren – auch im Lesemodus und nach einer Kündigung.",
      "Nach Vertragsende bleiben die Daten 90 Tage lesbar und exportierbar. Danach löschen wir sie, Sicherungskopien spätestens 30 Tage später, sofern keine gesetzliche Pflicht zur Aufbewahrung besteht. Vor dem Löschen erinnern wir den Kunden per E-Mail.",
      "Soweit wir personenbezogene Daten im Auftrag des Kunden verarbeiten, gilt der Vertrag zur Auftragsverarbeitung (Seite „Auftragsverarbeitung“). Er ist Teil dieses Vertrags.",
    ],
  },
  {
    id: "haftung",
    titel: "Haftung",
    absaetze: [
      "Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit, bei Verletzung von Leben, Körper oder Gesundheit, nach dem Produkthaftungsgesetz und soweit wir eine Garantie übernommen haben.",
      "Bei leichter Fahrlässigkeit haften wir nur, wenn wir eine wesentliche Vertragspflicht verletzen – also eine Pflicht, deren Erfüllung den Vertrag überhaupt erst möglich macht und auf die der Kunde regelmäßig vertrauen darf. Die Haftung ist dann auf den bei Vertragsschluss vorhersehbaren, vertragstypischen Schaden begrenzt, höchstens auf die Vergütung, die der Kunde in den 12 Monaten vor dem Schadensfall gezahlt hat.",
      "Für den Verlust von Daten haften wir nur in dem Umfang, der bei regelmäßiger Sicherung durch den Kunden (Export) ebenfalls eingetreten wäre. Die verschuldensunabhängige Haftung für Mängel, die schon bei Vertragsschluss vorhanden waren (§ 536a Abs. 1 BGB), ist ausgeschlossen.",
      "Diese Regeln gelten auch für unsere Mitarbeiter, Vertreter und Erfüllungsgehilfen.",
    ],
  },
  {
    id: "aenderungen",
    titel: "Änderungen der AGB",
    absaetze: [
      "Wir können diese AGB mit Wirkung für die Zukunft ändern, wenn es dafür einen sachlichen Grund gibt (z. B. neue Gesetze, neue Funktionen). Wir teilen die Änderungen mindestens 6 Wochen vor dem Inkrafttreten in Textform mit.",
      "Widerspricht der Kunde nicht bis zum Inkrafttreten, gelten die Änderungen als angenommen. Auf diese Folge und auf das Widerspruchsrecht weisen wir in der Mitteilung ausdrücklich hin. Widerspricht der Kunde, können beide Seiten zum Inkrafttreten kündigen.",
      "Änderungen der Hauptleistungen und Preise richten sich nach den Abschnitten „Leistungen“ und „Preise und Zahlung“.",
    ],
  },
  {
    id: "schluss",
    titel: "Schlussbestimmungen",
    absaetze: [
      "Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.",
      "Gerichtsstand für alle Streitigkeiten aus diesem Vertrag ist Würzburg, wenn der Kunde Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen ist.",
      "Sollte eine Bestimmung unwirksam sein, bleibt der Vertrag im Übrigen wirksam. An die Stelle der unwirksamen Bestimmung tritt die gesetzliche Regelung.",
    ],
  },
];

export const avvAbschnitte: RechtsAbschnitt[] = [
  {
    id: "gegenstand",
    titel: "Gegenstand und Dauer",
    absaetze: [
      `Dieser Vertrag regelt die Verarbeitung personenbezogener Daten durch die ${anbieterAnschrift} („Auftragsverarbeiter“, „wir“) im Auftrag des Kunden („Verantwortlicher“) nach Art. 28 DSGVO.`,
      "Er gilt für die Dauer des Hauptvertrags über die Nutzung von Macher OS einschließlich Testphase und Lesemodus und endet mit der Löschung der Daten.",
    ],
  },
  {
    id: "art-zweck",
    titel: "Art und Zweck der Verarbeitung",
    absaetze: [
      "Wir stellen Macher OS bereit. Dabei speichern und verarbeiten wir Daten, die der Verantwortliche oder seine Mitarbeiter eingeben oder die seine Kunden über Links aus Macher OS übermitteln. Zweck ist die Verwaltung von Anfragen, Kunden, Aufträgen, Planung, Zeiten, Material, Dokumenten, Angeboten und Rechnungen und der Versand von Nachrichten an Kunden des Verantwortlichen.",
      "Die Verarbeitung umfasst Speichern, Abgleichen zwischen Geräten, Anzeigen, Versenden, Auswerten im Auftrag des Verantwortlichen (z. B. Erinnerungen, KI-Vorschläge), Exportieren und Löschen.",
      "Wir nutzen die Daten nicht für eigene Zwecke. Davon ausgenommen sind die Daten, die wir als eigener Verantwortlicher für Konto, Abrechnung und Betrieb der Software brauchen (siehe Datenschutzerklärung).",
    ],
  },
  {
    id: "datenarten",
    titel: "Art der Daten und betroffene Personen",
    liste: [
      "Kunden, Interessenten und Ansprechpartner des Verantwortlichen: Name, Anschrift, Kontaktdaten, Objekte und Anlagen, Anfragen, Auftrags-, Angebots- und Rechnungsdaten, Zahlungsstatus, Nachrichten, Unterschriften, Öffnen-Status von Links und E-Mails",
      "Mitarbeiter des Verantwortlichen: Name, Kontaktdaten, Rolle, Arbeitszeiten, Abwesenheiten, Qualifikationen und Unterweisungen, Einsätze, Fahrten, Kostensätze",
      "Subunternehmer, Lieferanten und Partner: Name, Kontaktdaten, Bestellungen, Belege",
      "Fotos, Sprachnotizen und Dokumente aus Aufträgen und Baustellen",
      "Standort nur, wenn ein Mitarbeiter ihn selbst teilt (z. B. Abfahrt zur Baustelle)",
    ],
  },
  {
    id: "weisungen",
    titel: "Weisungsgebundenheit",
    absaetze: [
      "Wir verarbeiten die Daten nur auf dokumentierte Weisung des Verantwortlichen, es sei denn, wir sind gesetzlich zur Verarbeitung verpflichtet; dann teilen wir ihm das vorher mit, soweit das Gesetz es erlaubt (Art. 28 Abs. 3 lit. a DSGVO).",
      "Die Weisungen ergeben sich aus diesem Vertrag und aus der Nutzung von Macher OS durch den Verantwortlichen. Weitere Weisungen erteilt er in Textform. Halten wir eine Weisung für rechtswidrig, sagen wir das sofort.",
    ],
  },
  {
    id: "vertraulichkeit",
    titel: "Vertraulichkeit",
    absaetze: [
      "Alle Personen, die bei uns Zugang zu den Daten haben, sind zur Vertraulichkeit verpflichtet (Art. 28 Abs. 3 lit. b DSGVO). Sie greifen nur auf Daten zu, wenn das für Betrieb, Support oder Fehlerbehebung nötig ist.",
    ],
  },
  {
    id: "tom",
    titel: "Technische und organisatorische Maßnahmen (Anlage 1)",
    absaetze: [
      "Wir treffen geeignete Maßnahmen nach Art. 32 DSGVO und passen sie dem Stand der Technik an, ohne das Schutzniveau zu senken. Derzeit sind das:",
    ],
    liste: [
      "Speicherort: Datenbank und Dateien in Rechenzentren in Frankfurt am Main, die nach ISO 27001 bzw. SOC 2 geprüft sind",
      "Verschlüsselung: alle Verbindungen per TLS; Daten und Sicherungen verschlüsselt gespeichert",
      "Trennung: jeder Betrieb ist in der Datenbank durch Zugriffsregeln (Row Level Security) von allen anderen getrennt",
      "Zugriff im Betrieb: Rollen (Chef, Büro, Monteur) – Geld, Rechnungen und Kostensätze sehen nur Chef und Büro",
      "Anmeldung ohne Passwort über Einmal-Links und Einmal-Codes; Dateien nur über zeitlich begrenzte, signierte Links",
      "Zugriff bei uns: nur wenige berechtigte Personen, persönliche Zugänge mit Zwei-Faktor-Anmeldung, Geheimnisse nur auf dem Server",
      "Nachvollziehbarkeit: Änderungen an Objekten werden mit Zeit und Person protokolliert",
      "Verfügbarkeit und Wiederherstellung: tägliche Sicherungen der Datenbank, gelöschte Einträge lassen sich wiederherstellen, Arbeit ohne Netz auf dem Gerät",
      "Datensparsamkeit: an KI-Dienste nur die für die Funktion nötigen Inhalte; keine Werbe- oder Analyse-Cookies",
    ],
  },
  {
    id: "unterauftragsverarbeiter",
    titel: "Unterauftragsverarbeiter (Anlage 2)",
    absaetze: [
      "Der Verantwortliche genehmigt allgemein den Einsatz von Unterauftragsverarbeitern. Wir verpflichten sie vertraglich auf dasselbe Schutzniveau wie in diesem Vertrag.",
      "Über neue oder geänderte Unterauftragsverarbeiter informieren wir mindestens 4 Wochen vorher per E-Mail. Der Verantwortliche kann aus wichtigem datenschutzrechtlichem Grund widersprechen; können wir uns nicht einigen, kann er den Hauptvertrag zum Zeitpunkt der Änderung kündigen.",
      "Derzeit eingesetzt:",
    ],
    liste: dienstleister.map((d) => `${d.name}, ${d.sitz} – ${d.zweck} (Verarbeitung: ${d.ort})`),
  },
  {
    id: "drittland",
    titel: "Verarbeitung außerhalb der EU",
    absaetze: [
      "Daten werden in Frankfurt am Main gespeichert. Soweit Unterauftragsverarbeiter Daten außerhalb der EU verarbeiten oder darauf zugreifen können, geschieht das nur auf Grundlage eines Angemessenheitsbeschlusses (z. B. EU-US Data Privacy Framework) oder der Standardvertragsklauseln der EU-Kommission.",
    ],
  },
  {
    id: "unterstuetzung",
    titel: "Unterstützung des Verantwortlichen",
    absaetze: [
      "Wir unterstützen den Verantwortlichen bei Anfragen betroffener Personen (Auskunft, Berichtigung, Löschung, Export) – die meisten kann er direkt in Macher OS erledigen. Erreicht uns eine solche Anfrage direkt, leiten wir sie an ihn weiter.",
      "Wir unterstützen ihn außerdem bei seinen Pflichten nach Art. 32 bis 36 DSGVO (Sicherheit, Meldungen, Datenschutz-Folgenabschätzung).",
    ],
  },
  {
    id: "meldung",
    titel: "Meldung von Datenschutzverletzungen",
    absaetze: [
      "Wird uns eine Verletzung des Schutzes personenbezogener Daten bekannt, informieren wir den Verantwortlichen unverzüglich, möglichst innerhalb von 24 Stunden, mit den Angaben, die er für seine Meldung an die Aufsichtsbehörde braucht.",
    ],
  },
  {
    id: "loeschung",
    titel: "Löschung und Rückgabe",
    absaetze: [
      "Der Verantwortliche kann seine Daten jederzeit selbst exportieren. Nach Ende des Hauptvertrags bleiben sie 90 Tage lesbar und exportierbar; danach löschen wir sie, Sicherungskopien spätestens 30 Tage später, sofern keine gesetzliche Pflicht zur Speicherung besteht. Auf Wunsch bestätigen wir die Löschung in Textform.",
    ],
  },
  {
    id: "kontrolle",
    titel: "Nachweise und Kontrollen",
    absaetze: [
      "Wir stellen dem Verantwortlichen alle Informationen bereit, die er zum Nachweis unserer Pflichten braucht – in der Regel durch Selbstauskunft und Nachweise unserer Dienstleister (z. B. Zertifikate, Prüfberichte).",
      "Darüber hinaus ermöglichen wir Überprüfungen durch den Verantwortlichen oder einen von ihm beauftragten, zur Verschwiegenheit verpflichteten Prüfer nach Anmeldung mit angemessener Frist, während der üblichen Geschäftszeiten und ohne Störung des Betriebs.",
    ],
  },
  {
    id: "haftung",
    titel: "Haftung",
    absaetze: ["Für die Haftung gilt Art. 82 DSGVO. Im Übrigen gelten die Haftungsregeln der AGB."],
  },
  {
    id: "abschluss",
    titel: "Abschluss des Vertrags",
    absaetze: [
      "Dieser Vertrag ist Teil der AGB. Er kommt mit dem Anlegen eines Kontos in Macher OS zustande und gilt ohne gesonderte Unterschrift. Wer eine unterschriebene Fassung braucht, bekommt sie auf Anfrage per E-Mail.",
      "Bei Widersprüchen zwischen diesem Vertrag und den AGB geht dieser Vertrag vor, soweit es um den Schutz personenbezogener Daten geht.",
    ],
  },
];
