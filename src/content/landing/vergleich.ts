import { testTage } from "@/content/preise";
import { cta } from "@/lib/site";
import type { Landing } from "./typ";

/**
 * Vergleichsseiten unter `/vergleich`.
 *
 * Fair vergleichen (§ 6 UWG): Wir nennen keine Funktionen, Preise oder Schwächen anderer Anbieter, die wir nicht
 * selbst belegen können – die ändern sich laufend. Bei Wettbewerbern zeigt die linke Spalte deshalb die Frage, die du
 * dort stellen solltest; die rechte Spalte zeigt, wie es bei Macher OS heute ist. HERO und ToolTime sind Marken
 * ihrer jeweiligen Inhaber.
 */

const vergleichBreadcrumb = { label: "Software-Vergleich", href: "/vergleich" };

const fairHinweis =
  "Stand Oktober 2026. Funktionen und Preise anderer Anbieter ändern sich – frag dort direkt nach. Wir zeigen dir nur, wie es bei Macher OS heute ist.";

export const vergleichsSeiten = {
  "word-excel": {
    pfad: "/vergleich/word-excel",
    meta: {
      title: "Macher OS vs. Word & Excel – Handwerkersoftware statt Vorlagen",
      description:
        "Angebote in Word, Stundenzettel in Excel, Termine im Kopf? So hilft Macher OS: Angebot, Auftrag und Rechnung hängen zusammen – auf dem Handy und im Büro.",
    },
    breadcrumbs: [vergleichBreadcrumb, { label: "Word & Excel" }],
    hero: {
      eyebrow: "Macher OS vs. Word & Excel",
      title: "Schluss mit Vorlagen-Chaos.",
      intro:
        "Word und Excel sind gute Programme – aber keine Betriebssoftware. In Macher OS wird aus dem Angebot der Auftrag und aus dem Auftrag die Rechnung. Ohne Abtippen.",
      bild: "alltag/buero",
    },
    schmerz: {
      titel: "Jede Datei ein bisschen anders. Und keine weiß von der anderen.",
      punkte: [
        "Angebot als Word-Datei, Rechnung als neue Word-Datei – die Positionen tippst du zweimal",
        "Rechnungsnummern von Hand hochzählen und hoffen, dass keine doppelt ist",
        "Stundenzettel in Excel, die erst am Monatsende zusammenkommen",
        "„angebot_final_neu2.docx“ – welche Version ging an den Kunden?",
        "Offene Rechnungen merkst du erst, wenn du die Liste durchgehst",
      ],
      antwort: "In Macher OS hängt alles am Auftrag. Einmal eingeben, überall richtig.",
    },
    vergleich: {
      titel: "Was sich im Alltag ändert.",
      spalten: ["Word & Excel", "Macher OS"],
      zeilen: [
        { merkmal: "Vom Angebot zur Rechnung", links: "neue Datei, Positionen kopieren", rechts: "ein Klick – die Positionen kommen mit" },
        { merkmal: "Rechnungsnummern", links: "von Hand zählen", rechts: "fortlaufend und automatisch" },
        { merkmal: "E-Rechnung (XRechnung)", links: "nicht vorgesehen", rechts: true },
        { merkmal: "Offene Rechnungen im Blick", links: "eigene Liste pflegen", rechts: "Macher erinnert dich" },
        { merkmal: "Termine und Einsätze", links: "getrennt im Kalender oder im Kopf", rechts: "am Auftrag, fürs Team sichtbar" },
        { merkmal: "Auf der Baustelle", links: "Dateien am Handy kaum bearbeitbar", rechts: "App mit großen Knöpfen, auch ohne Netz" },
        { merkmal: "Fotos und Unterschrift", links: "im privaten Handy", rechts: "direkt am Auftrag" },
        { merkmal: "Übergabe an den Steuerberater", links: "Ordner und PDFs sammeln", rechts: "Export im DATEV-Format" },
      ],
      hinweis: "Deine alten Excel-Listen nimmst du mit: Kunden und Artikel übernimmst du per Datei.",
    },
    ablauf: {
      eyebrow: "Umstieg",
      titel: "Raus aus den Vorlagen – in einem Nachmittag.",
      schritte: [
        { titel: "Gewerk wählen", text: "Macher OS richtet sich mit Vorlagen für dein Gewerk ein." },
        { titel: "Kundenliste hochladen", text: "Excel oder CSV hochladen, Spalten zuordnen, fertig." },
        { titel: "Erstes Angebot schreiben", text: "Mit deinem Logo und deinen Zahlungsbedingungen." },
        { titel: "Rechnung mit einem Klick", text: "Wenn der Auftrag fertig ist, wird aus dem Angebot die Rechnung." },
      ],
      link: { label: "So übernimmst du deine Daten", href: "/hilfe/daten-uebernehmen" },
    },
    faq: [
      {
        frage: "Kann ich meine Word-Vorlage weiter nutzen?",
        antwort:
          "Dein Logo, deine Anschrift, Bankverbindung und Texte trägst du einmal ein. Danach sehen Angebote und Rechnungen immer gleich aus – ohne Vorlage zu kopieren.",
      },
      {
        frage: "Was passiert mit meinen alten Excel-Listen?",
        antwort:
          "Kunden, Artikel und Mitarbeiter übernimmst du als Excel- oder CSV-Datei. Macher OS schlägt vor, welche Spalte wohin gehört.",
      },
      {
        frage: "Brauche ich dann noch Word und Excel?",
        antwort:
          "Für Angebote, Rechnungen, Termine und Stundenzettel nicht mehr. Für alles andere kannst du sie natürlich weiter nutzen.",
      },
      {
        frage: "Ist das nicht viel teurer als Word und Excel?",
        antwort: `Macher OS kostet einen festen Monatspreis je Betrieb. Du testest ${testTage} Tage kostenlos und siehst selbst, wie viel Zeit du sparst.`,
      },
    ],
    weiter: {
      links: [
        { label: "Software-Vergleich", href: "/vergleich", text: "Alle Vergleiche auf einen Blick." },
        { label: "Rechnungen schreiben", href: "/funktionen/rechnungen", text: "Rechnung mit einem Klick aus dem Angebot." },
        { label: "Für Neugründer", href: "/fuer/neugruender", text: "Gleich richtig anfangen statt später umziehen." },
      ],
    },
    cta: { title: "Weg von Vorlagen. Hin zum Feierabend.", intro: "Starte kostenlos und schreib dein erstes Angebot noch heute." },
  },

  hero: {
    pfad: "/vergleich/hero",
    meta: {
      title: "Macher OS vs. HERO – fairer Vergleich für Handwerksbetriebe",
      description:
        "Du überlegst zwischen HERO und Macher OS? Die Fragen, die du jedem Anbieter stellen solltest – und wie Macher OS sie heute beantwortet.",
    },
    breadcrumbs: [vergleichBreadcrumb, { label: "HERO" }],
    hero: {
      eyebrow: "Macher OS vs. HERO",
      title: "Welche Software passt zu deinem Betrieb?",
      intro:
        "HERO ist eine bekannte Handwerkersoftware. Wir machen dir die Entscheidung leichter: mit den Fragen, die wirklich zählen – und ehrlichen Antworten für Macher OS.",
      bild: "alltag/planung",
    },
    vorteile: {
      eyebrow: "Wofür Macher OS steht",
      titel: "Einfach vorne. Vollständig hinten.",
      karten: [
        { titel: "Ein Preis, alles drin", text: "Ein fester Monatspreis je Betrieb nach Teamgröße. Keine Zusatzmodule zum Freischalten.", icon: "euro" },
        { titel: "Eine Frage zum Start", text: "Du wählst dein Gewerk, Macher OS richtet den Rest mit Vorlagen ein.", icon: "spark" },
        { titel: "Macher erledigt", text: "Erinnerungen, Mahnungen und Vorschläge kommen von selbst – du bestätigst nur.", icon: "bolt" },
      ],
    },
    vergleich: {
      titel: "Die Fragen, die du stellen solltest.",
      intro: "Leg diese Liste neben jedes Angebot. Was HERO heute genau kann und kostet, erfährst du direkt bei HERO.",
      spalten: ["Frag bei HERO nach", "So ist es bei Macher OS"],
      zeilen: [
        { merkmal: "Was kostet es wirklich?", links: "Welche Funktionen sind im Grundpreis, welche kosten extra?", rechts: "Ein Preis nach Teamgröße, alle Funktionen drin" },
        { merkmal: "Wie lange bin ich gebunden?", links: "Mindestlaufzeit und Kündigungsfrist?", rechts: "monatlich kündbar" },
        { merkmal: "Kann ich ohne Vertrag testen?", links: "Wie lange, und brauche ich Zahlungsdaten?", rechts: `${testTage} Tage, ohne Kreditkarte` },
        { merkmal: "Wie schnell bin ich startklar?", links: "Brauche ich eine Schulung oder Einrichtung?", rechts: "eine Frage zum Start, Vorlagen je Gewerk" },
        { merkmal: "Nutzen meine Leute das?", links: "Wie melden sich Monteure an?", rechts: "Anmeldung mit Handynummer, nur der eigene Einsatz" },
        { merkmal: "Geht es ohne Netz?", links: "Was funktioniert im Keller ohne Empfang?", rechts: "Zeiten, Fotos, Material, Unterschrift" },
        { merkmal: "Komme ich wieder raus?", links: "Kann ich alle Daten exportieren – kostenlos?", rechts: "Export jederzeit, immer kostenlos" },
        { merkmal: "Wo liegen die Daten?", links: "In welchem Land stehen die Server?", rechts: "Server in Frankfurt" },
      ],
      hinweis: `${fairHinweis} HERO ist eine Marke ihres Inhabers; wir stehen in keiner Verbindung zu HERO.`,
    },
    checkliste: {
      eyebrow: "Selbst prüfen",
      titel: "Teste mit einem echten Auftrag – nicht mit einer Vorführung.",
      intro: "Am besten vergleichst du Software, indem du denselben Auftrag in beiden durchspielst.",
      punkte: [
        "Anfrage eines echten Kunden anlegen",
        "Angebot schreiben und als PDF verschicken",
        "Einsatz für einen Mitarbeiter planen",
        "Auf dem Handy Fotos und Zeiten erfassen",
        "Rechnung schreiben – wie viele Klicks waren es?",
      ],
      link: { label: "Macher OS kostenlos testen", href: cta.primary.href },
    },
    faq: [
      {
        frage: "Ist Macher OS besser als HERO?",
        antwort:
          "Das hängt von deinem Betrieb ab. Macher OS ist für Betriebe gemacht, die eine einfache Software ohne Zusatzmodule wollen, die auch ihre Leute auf der Baustelle nutzen. Teste beides mit einem echten Auftrag.",
      },
      {
        frage: "Kann ich von HERO zu Macher OS wechseln?",
        antwort:
          "Ja. Kunden, Artikel und Mitarbeiter übernimmst du als Excel- oder CSV-Export. Wie du die Daten aus HERO exportierst, erfährst du bei HERO. Im Zweifel schauen wir uns eine Beispieldatei an.",
      },
      {
        frage: "Warum nennt ihr keine Preise von HERO?",
        antwort:
          "Weil sie sich ändern können und wir nichts behaupten wollen, was wir nicht belegen können. Frag direkt bei HERO nach – mit unserer Frageliste.",
      },
    ],
    weiter: {
      links: [
        { label: "Wechseln zu Macher OS", href: "/wechseln", text: "So kommst du aus deinem alten System raus." },
        { label: "Macher OS vs. ToolTime", href: "/vergleich/tooltime", text: "Dieselben Fragen für ToolTime." },
        { label: "Preise", href: "/preise", text: "Ein Preis je Betrieb, alles drin." },
      ],
    },
    cta: { title: "Vergleich es selbst – mit deinem nächsten Auftrag.", intro: `${testTage} Tage kostenlos, ohne Kreditkarte, endet von selbst.` },
  },

  tooltime: {
    pfad: "/vergleich/tooltime",
    meta: {
      title: "Macher OS vs. ToolTime – fairer Vergleich für Handwerksbetriebe",
      description:
        "Du überlegst zwischen ToolTime und Macher OS? Die Fragen, die du jedem Anbieter stellen solltest – und wie Macher OS sie heute beantwortet.",
    },
    breadcrumbs: [vergleichBreadcrumb, { label: "ToolTime" }],
    hero: {
      eyebrow: "Macher OS vs. ToolTime",
      title: "Zwei Programme. Eine Entscheidung.",
      intro:
        "ToolTime ist im Handwerk verbreitet. Damit du gut entscheidest: die Fragen, auf die es ankommt – und was Macher OS darauf heute antwortet.",
      bild: "alltag/baustelle",
    },
    vorteile: {
      eyebrow: "Wofür Macher OS steht",
      titel: "Gebaut für Baustelle und Büro.",
      karten: [
        { titel: "App für die Baustelle", text: "Große Knöpfe, wenig Text. Jeder sieht nur seinen nächsten Einsatz.", icon: "smartphone" },
        { titel: "Alles hängt zusammen", text: "Anfrage, Angebot, Einsatz, Rechnung und Zahlung an einem Auftrag.", icon: "layers" },
        { titel: "Deine Daten bleiben deine", text: "Server in Frankfurt, Export jederzeit kostenlos, monatlich kündbar.", icon: "shield" },
      ],
    },
    vergleich: {
      titel: "Die Fragen, die du stellen solltest.",
      intro: "Was ToolTime heute genau kann und kostet, erfährst du direkt bei ToolTime.",
      spalten: ["Frag bei ToolTime nach", "So ist es bei Macher OS"],
      zeilen: [
        { merkmal: "Was kostet es für mein Team?", links: "Preis je Nutzer oder je Betrieb? Was kommt dazu?", rechts: "ein Preis nach Teamgröße, alle Funktionen drin" },
        { merkmal: "Wie lange bin ich gebunden?", links: "Mindestlaufzeit und Kündigungsfrist?", rechts: "monatlich kündbar" },
        { merkmal: "Kann ich ohne Vertrag testen?", links: "Wie lange, und brauche ich Zahlungsdaten?", rechts: `${testTage} Tage, ohne Kreditkarte` },
        { merkmal: "Einsatzplanung", links: "Wie plane ich Leute, Fahrzeuge und Material zusammen?", rechts: "Plantafel mit Mitarbeitern, Fahrzeugen und Material" },
        { merkmal: "Ausschreibungen", links: "Kann ich GAEB-Dateien einlesen?", rechts: "GAEB-Import ins Angebot" },
        { merkmal: "E-Rechnung", links: "Gibt es XRechnung?", rechts: "XRechnung eingebaut" },
        { merkmal: "Steuerberater", links: "Wie kommen Rechnungen zu DATEV?", rechts: "Export im DATEV-Format" },
        { merkmal: "Komme ich wieder raus?", links: "Kann ich alle Daten exportieren – kostenlos?", rechts: "Export jederzeit, immer kostenlos" },
      ],
      hinweis: `${fairHinweis} ToolTime ist eine Marke ihres Inhabers; wir stehen in keiner Verbindung zu ToolTime.`,
    },
    checkliste: {
      eyebrow: "Selbst prüfen",
      titel: "Gib das Handy deinem Monteur.",
      intro: "Ob eine Software taugt, merkst du daran, ob deine Leute sie ohne Erklärung benutzen.",
      punkte: [
        "Findet er seinen nächsten Einsatz ohne Hilfe?",
        "Kann er Fotos und Zeiten in unter einer Minute erfassen?",
        "Klappt die Unterschrift vom Kunden auf dem Handy?",
        "Geht das auch im Keller ohne Netz?",
      ],
      link: { label: "Macher OS kostenlos testen", href: cta.primary.href },
    },
    faq: [
      {
        frage: "Ist Macher OS eine Alternative zu ToolTime?",
        antwort:
          "Ja – beide sind Software für Handwerksbetriebe. Welche besser passt, hängt von deinem Betrieb ab. Teste beide mit einem echten Auftrag.",
      },
      {
        frage: "Kann ich meine Daten aus ToolTime mitnehmen?",
        antwort:
          "Kunden, Artikel und Mitarbeiter übernimmst du als Excel- oder CSV-Datei. Wie du sie aus ToolTime exportierst, erfährst du bei ToolTime.",
      },
      {
        frage: "Warum vergleicht ihr keine Preise?",
        antwort: "Weil sich Preise anderer Anbieter ändern und wir nichts behaupten wollen, was wir nicht belegen können.",
      },
    ],
    weiter: {
      links: [
        { label: "Wechseln zu Macher OS", href: "/wechseln", text: "So kommst du aus deinem alten System raus." },
        { label: "Macher OS vs. HERO", href: "/vergleich/hero", text: "Dieselben Fragen für HERO." },
        { label: "Handwerker-App", href: "/handwerker-app", text: "Die App für deine Leute auf der Baustelle." },
      ],
    },
    cta: { title: "Teste es mit deinem Team.", intro: `${testTage} Tage kostenlos, ohne Kreditkarte, endet von selbst.` },
  },

  "klassische-handwerkersoftware": {
    pfad: "/vergleich/klassische-handwerkersoftware",
    meta: {
      title: "Macher OS vs. klassische Handwerkersoftware",
      description:
        "Installiert, Server im Keller, Schulung nötig, Module extra? Macher OS läuft im Browser und auf dem Handy, startet mit einer Frage und hat alles drin.",
    },
    breadcrumbs: [vergleichBreadcrumb, { label: "Klassische Handwerkersoftware" }],
    hero: {
      eyebrow: "Macher OS vs. klassische Handwerkersoftware",
      title: "Modern statt Masken-Marathon.",
      intro:
        "Viele Handwerksprogramme stammen aus einer Zeit vor dem Smartphone. Macher OS ist für heute gebaut: im Browser, auf dem Handy, in Handwerkersprache.",
      bild: "alltag/werkstatt",
    },
    schmerz: {
      titel: "Software, die mehr Arbeit macht, als sie abnimmt.",
      punkte: [
        "Installiert auf einem Rechner im Büro – unterwegs kommst du nicht ran",
        "Updates per CD oder Download, Server im Keller",
        "Zehn Reiter, hundert Felder – ohne Schulung findet keiner was",
        "Jede Erweiterung ist ein eigenes Modul mit eigenem Preis",
        "Für die Monteure gibt es keine oder eine extra App",
      ],
      antwort: "Macher OS läuft im Browser und auf dem Handy, startet mit einer Frage und hat alle Funktionen drin.",
    },
    vergleich: {
      titel: "Was anders ist.",
      intro: "Nicht jede klassische Software hat alle diese Punkte. Prüf deine – die Liste hilft dabei.",
      spalten: ["Oft bei klassischer Software", "Macher OS"],
      zeilen: [
        { merkmal: "Installation", links: "Programm auf dem Bürorechner, oft eigener Server", rechts: "nichts installieren – Browser und Handy" },
        { merkmal: "Updates", links: "von Hand, manchmal kostenpflichtig", rechts: "automatisch, alle Updates inklusive" },
        { merkmal: "Einstieg", links: "Schulung, Einrichtung durch Händler", rechts: "eine Frage zum Start, Vorlagen je Gewerk" },
        { merkmal: "Preis", links: "Lizenz plus Wartung plus Module", rechts: "ein Monatspreis, alles drin" },
        { merkmal: "Baustelle", links: "keine oder eigene App", rechts: "App inklusive, auch ohne Netz" },
        { merkmal: "Datensicherung", links: "eigene Aufgabe", rechts: "mit Konto in der Cloud, Server in Frankfurt" },
        { merkmal: "Was trotzdem bleibt", links: "DATEV, GAEB, Datanorm", rechts: "DATEV-Export, GAEB- und Datanorm-Import" },
      ],
      hinweis: "„Klassische Handwerkersoftware“ meint hier installierte Programme mit Lizenz und Modulen – nicht ein bestimmtes Produkt.",
    },
    vorteile: {
      eyebrow: "Was du behältst",
      titel: "Modern heißt nicht: weniger können.",
      karten: [
        { titel: "Kalkulation & Aufmaß", text: "Positionen, Aufschläge, Aufmaß und Nachkalkulation.", icon: "calculator" },
        { titel: "Ausschreibungen", text: "Leistungsverzeichnisse per GAEB direkt ins Angebot.", icon: "file" },
        { titel: "Großhandel", text: "Artikel und Preise per Datanorm einlesen.", icon: "warehouse" },
        { titel: "Buchhaltung", text: "Export im DATEV-Format und E-Rechnung nach XRechnung.", icon: "euro" },
      ],
    },
    faq: [
      {
        frage: "Kann Macher OS so viel wie meine alte Software?",
        antwort:
          "Für die meisten Betriebe ja: von Anfrage und Kalkulation über Einsatzplanung bis Rechnung, Mahnung und DATEV-Export. Probier es mit einem echten Auftrag aus – am besten parallel zur alten Software.",
      },
      {
        frage: "Was ist mit meinen alten Daten?",
        antwort:
          "Kunden, Artikel und Mitarbeiter übernimmst du per Excel- oder CSV-Export. Alte Rechnungen bewahrst du für die gesetzliche Frist weiter auf – als PDF oder in der alten Software.",
      },
      {
        frage: "Ist eine Cloud-Software sicher?",
        antwort:
          "Deine Daten liegen auf Servern in Frankfurt, Zugänge sind geschützt und du kannst jederzeit alles exportieren. Mehr dazu auf der Seite zur Cloud-Handwerkersoftware.",
      },
    ],
    weiter: {
      links: [
        { label: "Cloud-Handwerkersoftware", href: "/cloud-handwerkersoftware", text: "Was die Cloud für deinen Betrieb bedeutet." },
        { label: "Schnittstellen", href: "/schnittstellen", text: "DATEV, GAEB, Datanorm und mehr." },
        { label: "Wechseln zu Macher OS", href: "/wechseln", text: "Schritt für Schritt umsteigen." },
      ],
    },
    cta: { title: "Software, die mitkommt.", intro: "Starte kostenlos – im Browser, auf dem Handy, ohne Installation." },
  },
} satisfies Record<string, Landing>;

export type VergleichSlug = keyof typeof vergleichsSeiten;

export const vergleichUebersicht: Landing = {
  pfad: "/vergleich",
  meta: {
    title: "Handwerkersoftware im Vergleich",
    description:
      "Handwerkersoftware vergleichen: Macher OS vs. Word & Excel, HERO, ToolTime und klassische Handwerkersoftware. Mit Frageliste für deine Entscheidung.",
  },
  breadcrumbs: [{ label: "Software-Vergleich" }],
  hero: {
    eyebrow: "Software-Vergleich",
    title: "Die richtige Software für deinen Betrieb.",
    intro:
      "Du stehst kurz vor der Entscheidung? Hier findest du ehrliche Vergleiche – und die Fragen, die du jedem Anbieter stellen solltest.",
    aktionen: { primaer: { label: "Vergleiche ansehen", href: "#uebersicht" }, sekundaer: { label: "Kostenlos testen", href: cta.primary.href } },
  },
  wegweiser: {
    eyebrow: "Vergleiche",
    titel: "Womit arbeitest du heute?",
    karten: [
      { titel: "Word & Excel", text: "Vorlagen, Listen und Zettel – und viel Abtippen.", href: "/vergleich/word-excel", icon: "file" },
      { titel: "HERO", text: "Die Fragen, die du stellen solltest – und unsere Antworten.", href: "/vergleich/hero", icon: "search" },
      { titel: "ToolTime", text: "Worauf es ankommt, wenn du dich entscheidest.", href: "/vergleich/tooltime", icon: "search" },
      { titel: "Klassische Handwerkersoftware", text: "Installiert, Module, Schulung – und was heute anders geht.", href: "/vergleich/klassische-handwerkersoftware", icon: "monitor" },
      { titel: "Wechseln zu Macher OS", text: "So kommst du aus deinem alten System raus.", href: "/wechseln", icon: "route" },
      { titel: "Wechselbonus", text: "Du hast noch einen laufenden Vertrag? Sprich uns an.", href: "/wechselbonus", icon: "award" },
    ],
  },
  checkliste: {
    eyebrow: "Frageliste",
    titel: "Sieben Fragen an jede Handwerkersoftware.",
    intro: "Stell sie jedem Anbieter – auch uns. Die Antworten sagen mehr als jede Funktionsliste.",
    punkte: [
      "Was kostet es für mein ganzes Team – mit allem, was ich brauche?",
      "Wie lange bin ich gebunden, wie schnell kann ich kündigen?",
      "Kann ich mit einem echten Auftrag testen, ohne Zahlungsdaten?",
      "Wie schnell bin ich startklar – ohne Schulung?",
      "Nutzen meine Leute die App auf der Baustelle, auch ohne Netz?",
      "Komme ich mit DATEV, GAEB und meinem Großhändler klar?",
      "Kann ich alle Daten jederzeit kostenlos exportieren?",
    ],
    link: { label: "Macher OS kostenlos testen", href: cta.primary.href },
  },
  faq: [
    {
      frage: "Welche Handwerkersoftware ist die beste?",
      antwort:
        "Die, die deine Leute wirklich benutzen. Teste jede Software mit einem echten Auftrag – von der Anfrage bis zur Rechnung – und gib das Handy einem Monteur.",
    },
    {
      frage: "Warum vergleicht ihr keine Preise anderer Anbieter?",
      antwort:
        "Weil sie sich ändern und wir nichts behaupten wollen, was wir nicht belegen können. Unsere Preise stehen offen auf der Preisseite.",
    },
    {
      frage: "Wie lange dauert ein Wechsel?",
      antwort:
        "Das Einrichten geht in wenigen Minuten. Wie lange die Datenübernahme dauert, hängt davon ab, was du mitnimmst. Viele starten mit dem nächsten Auftrag und holen den Rest nach.",
    },
  ],
  weiter: {
    links: [
      { label: "Preise", href: "/preise", text: "Ein Preis je Betrieb, alles drin." },
      { label: "Demo ansehen", href: "/demo", text: "Macher OS mit Beispieldaten ausprobieren." },
      { label: "Schnittstellen", href: "/schnittstellen", text: "DATEV, GAEB, Datanorm und mehr." },
    ],
  },
};
