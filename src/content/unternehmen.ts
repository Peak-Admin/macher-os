import type { IconName } from "@/components/ui";

/**
 * Inhalte für Unternehmens- und Rechtsseiten.
 *
 * Wichtig: Hier stehen bewusst keine echten Firmendaten. Alles in eckigen
 * Klammern ist ein Platzhalter und muss vor der Veröffentlichung ersetzt
 * und rechtlich geprüft werden.
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

/** Allgemeiner Hinweis über allen Rechtsseiten. */
export const rechtsEntwurfHinweis =
  "Entwurf – vor Veröffentlichung rechtlich prüfen lassen. Alle Angaben in [eckigen Klammern] sind Platzhalter und müssen ersetzt werden.";

/** Anbieter von Macher OS. Angaben laut Impressum von mission-mittelstand.de. */
export const firma = {
  name: "Mission Mittelstand",
  rechtsform: "GmbH",
  anschrift: "Industriezubringer 53",
  ort: "49661 Cloppenburg",
  vertreten: "Matthias Aumann (Geschäftsführer)",
  register: "Amtsgericht Oldenburg",
  registernummer: "HRB 208841",
  ustId: "DE296230256",
  telefon: "+49 4471 7097653",
  email: KONTAKT_EMAIL,
  datenschutzbeauftragter: "[Name / Kontakt des Datenschutzbeauftragten, falls bestellt]",
  hosting: "[Name und Sitz des Hosting-Anbieters]",
};

/** Abschnitt einer Rechtsseite. */
export type RechtsAbschnitt = {
  id: string;
  titel: string;
  absaetze?: string[];
  liste?: string[];
};

/* ------------------------------------------------------------------ */
/* Rechtstexte – ENTWÜRFE mit Platzhaltern, vor Veröffentlichung prüfen */
/* ------------------------------------------------------------------ */

export const impressumAbschnitte: RechtsAbschnitt[] = [
  {
    id: "anbieter",
    titel: "Angaben gemäß § 5 DDG",
    absaetze: [`${firma.name} ${firma.rechtsform}`, `${firma.anschrift}, ${firma.ort}`],
  },
  {
    id: "vertretung",
    titel: "Vertreten durch",
    absaetze: [firma.vertreten],
  },
  {
    id: "kontakt",
    titel: "Kontakt",
    liste: [`Telefon: ${firma.telefon}`, `E-Mail: ${firma.email}`],
  },
  {
    id: "register",
    titel: "Registereintrag",
    liste: [`Registergericht: ${firma.register}`, `Registernummer: ${firma.registernummer}`],
  },
  {
    id: "umsatzsteuer",
    titel: "Umsatzsteuer-ID",
    absaetze: [`Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz: ${firma.ustId}`],
  },
  {
    id: "verantwortlich",
    titel: "Verantwortlich für den Inhalt",
    absaetze: [`Verantwortlich nach § 18 Abs. 2 MStV: Matthias Aumann, ${firma.anschrift}, ${firma.ort}`],
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
];

export const datenschutzAbschnitte: RechtsAbschnitt[] = [
  {
    id: "verantwortlicher",
    titel: "Verantwortlicher",
    absaetze: [
      "Verantwortlich für die Verarbeitung personenbezogener Daten auf dieser Website ist:",
      `${firma.name} ${firma.rechtsform}, ${firma.anschrift}, ${firma.ort}, E-Mail: ${DATENSCHUTZ_EMAIL}`,
    ],
  },
  {
    id: "datenschutzbeauftragter",
    titel: "Datenschutzbeauftragter",
    absaetze: [firma.datenschutzbeauftragter],
  },
  {
    id: "ueberblick",
    titel: "Überblick: Welche Daten wir verarbeiten",
    liste: [
      "Daten, die beim Besuch der Website technisch anfallen (z. B. IP-Adresse, Zeitpunkt, aufgerufene Seite, Browser)",
      "Daten, die du uns selbst mitteilst (z. B. per E-Mail oder bei der Registrierung)",
      "Daten, die du als Kunde in Macher OS speicherst (siehe Abschnitt „Registrierung und Nutzung von Macher OS“)",
    ],
  },
  {
    id: "hosting",
    titel: "Hosting und Server-Logdateien",
    absaetze: [
      `Diese Website wird bei ${firma.hosting} betrieben. Beim Aufruf werden technisch notwendige Daten in Server-Logdateien gespeichert, um die Website sicher und stabil bereitzustellen.`,
      "Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem sicheren Betrieb). Speicherdauer: [Dauer angeben].",
      "[Serverstandort und ggf. Übermittlung in Drittländer angeben und prüfen.]",
    ],
  },
  {
    id: "kontaktaufnahme",
    titel: "Kontaktaufnahme per E-Mail",
    absaetze: [
      "Die Kontaktformulare auf dieser Website verschicken nichts selbst. Sie öffnen dein E-Mail-Programm mit einer vorbereiteten Nachricht. Erst wenn du diese E-Mail abschickst, erhalten wir deine Angaben.",
      "Wir verarbeiten deine Angaben, um deine Anfrage zu beantworten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen) bzw. lit. f DSGVO (berechtigtes Interesse an der Beantwortung). Speicherdauer: [Dauer angeben].",
    ],
  },
  {
    id: "registrierung",
    titel: "Registrierung und Nutzung von Macher OS",
    absaetze: [
      "Wenn du ein Konto anlegst, verarbeiten wir die dafür nötigen Daten (z. B. Name, E-Mail, Betriebsangaben), um dir Macher OS bereitzustellen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.",
      "Daten, die du in Macher OS über deine Kunden, Mitarbeiter und Aufträge speicherst, verarbeiten wir in deinem Auftrag. Dafür schließen wir einen Vertrag zur Auftragsverarbeitung nach Art. 28 DSGVO ab.",
    ],
  },
  {
    id: "cookies",
    titel: "Cookies und ähnliche Techniken",
    absaetze: [
      "[Prüfen und anpassen:] Wir setzen auf dieser Website nur Cookies und Speichertechniken ein, die für den Betrieb technisch notwendig sind (z. B. für die Anmeldung). Rechtsgrundlage ist § 25 Abs. 2 TDDDG in Verbindung mit Art. 6 Abs. 1 lit. f DSGVO.",
      "[Falls Analyse- oder Marketingwerkzeuge eingesetzt werden: einzeln mit Anbieter, Zweck, Rechtsgrundlage (Einwilligung nach § 25 Abs. 1 TDDDG, Art. 6 Abs. 1 lit. a DSGVO), Speicherdauer und Widerrufsmöglichkeit aufführen.]",
      "Cookie-Einstellungen: [Hier Link bzw. Schaltfläche zur Einwilligungsverwaltung einfügen, sobald eingesetzt.]",
    ],
  },
  {
    id: "empfaenger",
    titel: "Empfänger und Dienstleister",
    absaetze: [
      "Wir setzen Dienstleister ein, z. B. für Hosting und E-Mail-Versand. Sie verarbeiten Daten nur nach unserer Weisung.",
      "[Liste der eingesetzten Dienstleister mit Zweck und Sitz einfügen.]",
    ],
  },
  {
    id: "drittland",
    titel: "Übermittlung in Drittländer",
    absaetze: [
      "[Angeben, ob Daten außerhalb der EU/des EWR verarbeitet werden, und auf welcher Grundlage (z. B. Angemessenheitsbeschluss oder Standardvertragsklauseln).]",
    ],
  },
  {
    id: "speicherdauer",
    titel: "Speicherdauer",
    absaetze: [
      "Wir speichern personenbezogene Daten nur so lange, wie es für den jeweiligen Zweck nötig ist oder gesetzliche Aufbewahrungspflichten bestehen. [Konkrete Fristen ergänzen.]",
    ],
  },
  {
    id: "rechte",
    titel: "Deine Rechte",
    absaetze: ["Du hast nach der DSGVO folgende Rechte:"],
    liste: [
      "Auskunft (Art. 15 DSGVO)",
      "Berichtigung (Art. 16 DSGVO)",
      "Löschung (Art. 17 DSGVO)",
      "Einschränkung der Verarbeitung (Art. 18 DSGVO)",
      "Datenübertragbarkeit (Art. 20 DSGVO)",
      "Widerspruch gegen Verarbeitungen auf Grundlage berechtigter Interessen (Art. 21 DSGVO)",
      "Widerruf einer Einwilligung mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO)",
      "Beschwerde bei einer Datenschutz-Aufsichtsbehörde (Art. 77 DSGVO), z. B. [zuständige Aufsichtsbehörde]",
    ],
  },
  {
    id: "sicherheit",
    titel: "Datensicherheit",
    absaetze: [
      "Diese Website nutzt eine verschlüsselte Verbindung (TLS). [Weitere technische und organisatorische Maßnahmen beschreiben.]",
    ],
  },
  {
    id: "aenderungen",
    titel: "Änderungen dieser Datenschutzerklärung",
    absaetze: [
      "Wir passen diese Erklärung an, wenn sich unsere Website oder die Rechtslage ändert. Es gilt die jeweils hier veröffentlichte Fassung.",
    ],
  },
];

export const agbAbschnitte: RechtsAbschnitt[] = [
  {
    id: "geltung",
    titel: "Geltungsbereich",
    absaetze: [
      `Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge über die Nutzung von Macher OS zwischen ${firma.name} ${firma.rechtsform} („Anbieter“) und dem Kunden.`,
      "Macher OS richtet sich ausschließlich an Unternehmer im Sinne von § 14 BGB. [Prüfen und anpassen.]",
      "Abweichende Bedingungen des Kunden gelten nur, wenn der Anbieter ihnen ausdrücklich zustimmt.",
    ],
  },
  {
    id: "leistung",
    titel: "Leistungen",
    absaetze: [
      "Der Anbieter stellt Macher OS als Software über das Internet (Browser und App) zur Verfügung. Der Umfang ergibt sich aus dem gewählten Tarif und der Leistungsbeschreibung: [Verweis auf Leistungsbeschreibung].",
      "Verfügbarkeit: [Zugesagte Verfügbarkeit und Wartungsfenster angeben.]",
    ],
  },
  {
    id: "vertragsschluss",
    titel: "Vertragsschluss und Testphase",
    absaetze: [
      "Der Vertrag kommt mit der Registrierung und Bestätigung durch den Anbieter zustande.",
      "Testphase: [Dauer, Umfang und was nach Ende der Testphase passiert, angeben.]",
    ],
  },
  {
    id: "pflichten",
    titel: "Pflichten des Kunden",
    liste: [
      "Zugangsdaten geheim halten und nicht an Unbefugte weitergeben",
      "Macher OS nicht missbräuchlich oder rechtswidrig nutzen",
      "für die Rechtmäßigkeit der eingegebenen Daten verantwortlich sein",
      "[Weitere Pflichten ergänzen]",
    ],
  },
  {
    id: "preise",
    titel: "Preise und Zahlung",
    absaetze: [
      "Es gelten die bei Vertragsschluss gültigen Preise laut Preisseite. Alle Preise verstehen sich zuzüglich gesetzlicher Umsatzsteuer.",
      "Abrechnung und Zahlungsweise: [monatlich / jährlich, Zahlungsarten, Fälligkeit angeben.]",
      "Preisänderungen: [Regelung angeben.]",
    ],
  },
  {
    id: "laufzeit",
    titel: "Laufzeit und Kündigung",
    absaetze: [
      "Laufzeit und Kündigungsfristen richten sich nach dem gewählten Tarif: [Angaben einfügen].",
      "Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt.",
    ],
  },
  {
    id: "daten",
    titel: "Daten des Kunden",
    absaetze: [
      "Die vom Kunden gespeicherten Daten gehören dem Kunden. Der Kunde kann sie jederzeit exportieren.",
      "Nach Vertragsende werden die Daten nach [Frist] gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.",
      "Soweit der Anbieter personenbezogene Daten im Auftrag verarbeitet, gilt der Vertrag zur Auftragsverarbeitung.",
    ],
  },
  {
    id: "haftung",
    titel: "Haftung",
    absaetze: [
      "[Haftungsregelung rechtlich ausarbeiten lassen – z. B. Vorsatz und grobe Fahrlässigkeit, wesentliche Vertragspflichten, Haftungshöchstgrenzen.]",
    ],
  },
  {
    id: "aenderungen",
    titel: "Änderungen der AGB",
    absaetze: ["[Verfahren für Änderungen der AGB und Widerspruchsrecht des Kunden angeben.]"],
  },
  {
    id: "schluss",
    titel: "Schlussbestimmungen",
    absaetze: [
      "Es gilt das Recht der Bundesrepublik Deutschland.",
      "Gerichtsstand ist, soweit zulässig, [Ort].",
      "Sollte eine Bestimmung unwirksam sein, bleibt der Vertrag im Übrigen wirksam.",
    ],
  },
];

export const avvAbschnitte: RechtsAbschnitt[] = [
  {
    id: "gegenstand",
    titel: "Gegenstand und Dauer",
    absaetze: [
      `Dieser Vertrag regelt die Verarbeitung personenbezogener Daten durch ${firma.name} ${firma.rechtsform} („Auftragsverarbeiter“) im Auftrag des Kunden („Verantwortlicher“) nach Art. 28 DSGVO.`,
      "Er gilt für die Dauer des Hauptvertrags über die Nutzung von Macher OS.",
    ],
  },
  {
    id: "art-zweck",
    titel: "Art und Zweck der Verarbeitung",
    absaetze: [
      "Der Auftragsverarbeiter stellt Macher OS bereit. Dabei speichert und verarbeitet er Daten, die der Verantwortliche eingibt, um Aufträge, Planung, Mitarbeiter, Material und Rechnungen zu verwalten.",
    ],
  },
  {
    id: "datenarten",
    titel: "Art der Daten und betroffene Personen",
    liste: [
      "Kunden und Ansprechpartner des Verantwortlichen: Name, Anschrift, Kontaktdaten, Auftrags- und Rechnungsdaten",
      "Mitarbeiter des Verantwortlichen: Name, Kontaktdaten, Rolle, Arbeitszeiten, Qualifikationen, Einsätze",
      "Fotos und Dokumente aus Aufträgen",
      "[Weitere Datenarten ergänzen, z. B. Standortdaten in der App]",
    ],
  },
  {
    id: "weisungen",
    titel: "Weisungsgebundenheit",
    absaetze: [
      "Der Auftragsverarbeiter verarbeitet die Daten nur auf dokumentierte Weisung des Verantwortlichen, es sei denn, er ist gesetzlich zur Verarbeitung verpflichtet (Art. 28 Abs. 3 lit. a DSGVO).",
    ],
  },
  {
    id: "vertraulichkeit",
    titel: "Vertraulichkeit",
    absaetze: [
      "Alle Personen, die Zugang zu den Daten haben, sind zur Vertraulichkeit verpflichtet (Art. 28 Abs. 3 lit. b DSGVO).",
    ],
  },
  {
    id: "tom",
    titel: "Technische und organisatorische Maßnahmen",
    absaetze: [
      "Der Auftragsverarbeiter trifft geeignete Maßnahmen nach Art. 32 DSGVO. Die Maßnahmen sind in Anlage 1 beschrieben: [Anlage TOM einfügen].",
    ],
  },
  {
    id: "unterauftragsverarbeiter",
    titel: "Unterauftragsverarbeiter",
    absaetze: [
      "Der Verantwortliche erteilt die allgemeine Genehmigung zum Einsatz von Unterauftragsverarbeitern. Der Auftragsverarbeiter informiert vorab über Änderungen; der Verantwortliche kann widersprechen.",
      "Liste der Unterauftragsverarbeiter: [Anlage 2 – Name, Sitz, Zweck].",
    ],
  },
  {
    id: "unterstuetzung",
    titel: "Unterstützung des Verantwortlichen",
    absaetze: [
      "Der Auftragsverarbeiter unterstützt den Verantwortlichen bei der Erfüllung der Rechte betroffener Personen sowie bei den Pflichten nach Art. 32 bis 36 DSGVO.",
    ],
  },
  {
    id: "meldung",
    titel: "Meldung von Datenschutzverletzungen",
    absaetze: [
      "Der Auftragsverarbeiter informiert den Verantwortlichen unverzüglich, wenn ihm eine Verletzung des Schutzes personenbezogener Daten bekannt wird.",
    ],
  },
  {
    id: "loeschung",
    titel: "Löschung und Rückgabe",
    absaetze: [
      "Nach Ende des Vertrags löscht der Auftragsverarbeiter die Daten oder gibt sie zurück – nach Wahl des Verantwortlichen –, sofern keine Pflicht zur Speicherung besteht. [Frist angeben.]",
    ],
  },
  {
    id: "kontrolle",
    titel: "Nachweise und Kontrollen",
    absaetze: [
      "Der Auftragsverarbeiter stellt alle nötigen Informationen zum Nachweis der Pflichten bereit und ermöglicht Überprüfungen durch den Verantwortlichen oder einen beauftragten Prüfer. [Ausgestaltung regeln.]",
    ],
  },
  {
    id: "abschluss",
    titel: "Abschluss des Vertrags",
    absaetze: [
      "[Beschreiben, wie der Vertrag abgeschlossen wird – z. B. digital bei der Registrierung oder in den Einstellungen von Macher OS.]",
    ],
  },
];
