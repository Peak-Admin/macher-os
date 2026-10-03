import { PARTNER_EMAIL } from "@/content/unternehmen";
import { testTage } from "@/content/preise";
import { cta } from "@/lib/site";
import type { Landing } from "./typ";

/**
 * Themenseiten für die Suche: Handwerker-App, Bürosoftware, Cloud-Handwerkersoftware, Schnittstellen.
 *
 * Schnittstellen: Stand aus `src/os/modules/schnittstellen/connectoren.ts`. Was dort `geplant` ist, steht hier
 * ausdrücklich als „kommt“ – nie als fertig.
 */

export const handwerkerApp: Landing = {
  pfad: "/handwerker-app",
  meta: {
    title: "Handwerker-App – Aufträge, Zeiten und Fotos auf dem Handy",
    description:
      "Die Handwerker-App von Handwerk OS: Einsätze, Navigation, Fotos, Zeiterfassung, Material und Unterschrift auf dem Handy – auch ohne Netz. Für Chef, Büro und Monteure.",
  },
  breadcrumbs: [{ label: "Handwerker-App" }],
  hero: {
    eyebrow: "Handwerker-App",
    title: "Die App, die deine Leute wirklich benutzen.",
    intro:
      "Große Knöpfe, wenig Text, nur der eigene Einsatz. Anmelden mit der Handynummer, kein Passwort. Und das Büro sieht sofort, was auf der Baustelle passiert.",
    bild: "alltag/baustelle",
  },
  schmerz: {
    titel: "Zettel im Auto, Fotos im privaten Handy.",
    punkte: [
      "Stundenzettel, die am Freitag erst zusammengesucht werden",
      "Fotos von der Baustelle in fünf privaten Chats",
      "„Wo muss ich morgen hin?“ – Anruf beim Chef",
      "Material verbraucht, aber nirgends aufgeschrieben",
    ],
    antwort: "Mit der App hat jeder seinen Tag auf dem Handy – und alles landet direkt am Auftrag.",
  },
  vorteile: {
    eyebrow: "Was die App kann",
    titel: "Alles für den Einsatz. Nichts zu viel.",
    karten: [
      { titel: "Mein Tag", text: "Einsätze mit Adresse, Kunde und Aufgabe. Mit einem Tipp zur Baustelle navigieren.", icon: "calendar" },
      { titel: "Zeiten", text: "Arbeitszeit starten und stoppen – pro Auftrag, ohne Stundenzettel.", icon: "clock" },
      { titel: "Fotos & Sprache", text: "Fotos und eingesprochene Notizen landen direkt am Auftrag.", icon: "camera" },
      { titel: "Unterschrift", text: "Abnahme vom Kunden auf dem Handy unterschreiben lassen.", icon: "signature" },
    ],
  },
  checkliste: {
    eyebrow: "Auch ohne Netz",
    titel: "Kein Empfang im Keller? Kein Problem.",
    intro: "Das Wichtigste geht offline. Sobald wieder Netz da ist, wird alles übertragen.",
    punkte: ["Einsätze ansehen", "Zeiten erfassen", "Fotos und Notizen", "Material eintragen", "Unterschrift einholen"],
    link: { label: "Mehr zur App", href: "/app" },
  },
  faq: [
    {
      frage: "Was kostet die Handwerker-App?",
      antwort: "Die App gehört zu Handwerk OS und ist in jedem Plan drin. Du zahlst einen Preis je Betrieb nach Teamgröße.",
    },
    {
      frage: "Läuft die App auf iPhone und Android?",
      antwort:
        "Handwerk OS läuft heute im Browser auf jedem aktuellen Handy und lässt sich auf den Startbildschirm legen. Die Store-Apps für iPhone und Android folgen.",
    },
    {
      frage: "Sehen meine Mitarbeiter Preise?",
      antwort: "Nur wenn du es erlaubst. Über Rollen legst du fest, wer was sieht.",
    },
    {
      frage: "Brauchen meine Leute eine E-Mail-Adresse?",
      antwort: "Nein. Sie melden sich mit ihrer Handynummer an – ohne Passwort.",
    },
  ],
  weiter: {
    links: [
      { label: "Die App im Detail", href: "/app", text: "Ein Tag auf der Baustelle mit Handwerk OS." },
      { label: "Zeiterfassung", href: "/funktionen/zeiterfassung", text: "Arbeitszeiten ohne Stundenzettel." },
      { label: "Fotos & Dokumentation", href: "/funktionen/dokumentation", text: "Alles am Auftrag statt im privaten Handy." },
    ],
  },
  cta: { title: "Gib deinem Team die App.", intro: `Teste ${testTage} Tage kostenlos – mit deinen Leuten auf der Baustelle.` },
};

export const buerosoftware: Landing = {
  pfad: "/buerosoftware-handwerk",
  meta: {
    title: "Bürosoftware fürs Handwerk – Angebote, Rechnungen und Termine in einem",
    description:
      "Bürosoftware für Handwerksbetriebe: Anfragen, Angebote, Aufträge, Rechnungen, Mahnungen und Termine in einer Software. Mit DATEV-Export und App für die Baustelle.",
  },
  breadcrumbs: [{ label: "Bürosoftware fürs Handwerk" }],
  hero: {
    eyebrow: "Bürosoftware fürs Handwerk",
    title: "Weniger Büro. Mehr Handwerk.",
    intro:
      "Handwerk OS ist die Bürosoftware, die dir Büroarbeit abnimmt, statt neue zu machen. Von der Anfrage bis zur bezahlten Rechnung – an einem Ort.",
    bild: "alltag/buero",
  },
  schmerz: {
    titel: "Das Büro frisst die Abende.",
    punkte: [
      "Angebote schreiben, wenn eigentlich Feierabend ist",
      "Rechnungen, die Wochen liegen bleiben",
      "Hinterhertelefonieren, weil keiner weiß, was offen ist",
      "Drei Programme, die nicht miteinander reden",
    ],
    antwort: "Handwerk OS hält alles zusammen und erinnert dich, bevor etwas liegen bleibt.",
  },
  vorteile: {
    eyebrow: "Alles drin",
    titel: "Dein ganzes Büro in einer Software.",
    karten: [
      { titel: "Anfragen", text: "Anrufe, E-Mails und Formulare landen an einem Ort.", icon: "inbox" },
      { titel: "Angebote", text: "Mit Vorlagen für dein Gewerk, Kalkulation und Aufmaß.", icon: "file" },
      { titel: "Rechnungen & Mahnungen", text: "Aus dem Angebot mit einem Klick, XRechnung eingebaut. Lotte erinnert an Offenes.", icon: "euro" },
      { titel: "Termine & Planung", text: "Kalender und Plantafel für dein ganzes Team.", icon: "calendar" },
      { titel: "Zahlungen", text: "Kontoauszug einlesen – Lotte ordnet die Zahlungen den Rechnungen zu.", icon: "check" },
      { titel: "Steuerberater", text: "Rechnungen und Belege im DATEV-Format übergeben.", icon: "calculator" },
    ],
  },
  ablauf: {
    titel: "Ein Auftrag, kein Abtippen.",
    schritte: [
      { titel: "Anfrage", text: "Kunde ruft an oder schreibt – die Anfrage ist da." },
      { titel: "Angebot", text: "Positionen aus Vorlagen, PDF raus." },
      { titel: "Auftrag & Termin", text: "Angebot angenommen, Einsatz geplant." },
      { titel: "Rechnung", text: "Mit einem Klick aus dem Auftrag." },
      { titel: "Bezahlt", text: "Zahlung zugeordnet, Auftrag erledigt." },
    ],
  },
  faq: [
    {
      frage: "Ist Handwerk OS eine Buchhaltungssoftware?",
      antwort:
        "Nein. Handwerk OS schreibt Angebote und Rechnungen und ordnet Zahlungen zu. Die Buchhaltung macht dein Steuerberater – du übergibst die Daten im DATEV-Format.",
    },
    {
      frage: "Kann ich E-Rechnungen schreiben?",
      antwort: "Ja. Rechnungen gibt es auch als XRechnung.",
    },
    {
      frage: "Brauche ich eine Bürokraft, um das zu bedienen?",
      antwort: "Nein. Handwerk OS spricht Handwerkersprache und startet mit einer Frage. Viele Chefs machen ihr Büro damit selbst – auch vom Handy.",
    },
  ],
  weiter: {
    links: [
      { label: "Lotte erledigt automatisch", href: "/funktionen/automatisch-erledigen", text: "Büroarbeit, die von selbst passiert." },
      { label: "Handwerk OS vs. Word & Excel", href: "/vergleich/word-excel", text: "Raus aus den Vorlagen." },
      { label: "Schnittstellen", href: "/schnittstellen", text: "DATEV, GAEB, Datanorm und mehr." },
    ],
  },
};

export const cloudSoftware: Landing = {
  pfad: "/cloud-handwerkersoftware",
  meta: {
    title: "Cloud-Handwerkersoftware – überall arbeiten, Server in Frankfurt",
    description:
      "Handwerkersoftware aus der Cloud: im Browser und auf dem Handy, ohne Installation und ohne eigenen Server. Handwerk OS speichert deine Daten in Frankfurt.",
  },
  breadcrumbs: [{ label: "Cloud-Handwerkersoftware" }],
  hero: {
    eyebrow: "Cloud-Handwerkersoftware",
    title: "Dein Betrieb. Überall dabei.",
    intro:
      "Handwerk OS läuft im Browser und auf dem Handy. Kein Programm installieren, kein Server im Keller, keine Updates von Hand. Deine Daten liegen auf Servern in Frankfurt.",
    bild: "start/hero",
  },
  vorteile: {
    eyebrow: "Was die Cloud bringt",
    titel: "Büro, Baustelle und Zuhause sehen dasselbe.",
    karten: [
      { titel: "Nichts installieren", text: "Browser auf, anmelden, loslegen – am PC, Tablet oder Handy.", icon: "monitor" },
      { titel: "Immer aktuell", text: "Alle Updates kommen automatisch und sind im Preis drin.", icon: "bolt" },
      { titel: "Alle sehen dasselbe", text: "Was der Monteur erfasst, sieht das Büro sofort.", icon: "users" },
    ],
  },
  checkliste: {
    eyebrow: "Sicherheit",
    titel: "Deine Daten bleiben deine Daten.",
    punkte: [
      "Server in Frankfurt",
      "Vertrag zur Auftragsverarbeitung",
      "Mitarbeiter sehen in der App nur ihre eigenen Einsätze",
      "Export aller Daten jederzeit und kostenlos",
      "Wichtiges geht auch offline und wird später übertragen",
    ],
    link: { label: "Zum Datenschutz", href: "/datenschutz" },
  },
  faq: [
    {
      frage: "Was ist, wenn das Internet weg ist?",
      antwort: "Auf der Baustelle geht das Wichtigste auch offline: Einsätze, Zeiten, Fotos, Material, Unterschrift. Sobald wieder Netz da ist, wird übertragen.",
    },
    {
      frage: "Wo liegen meine Daten?",
      antwort: "Auf Servern in Frankfurt. Den Vertrag zur Auftragsverarbeitung findest du auf unserer Website.",
    },
    {
      frage: "Kann ich zurück, wenn ich die Cloud nicht will?",
      antwort: "Du kannst alle Daten jederzeit kostenlos exportieren und mitnehmen.",
    },
  ],
  weiter: {
    links: [
      { label: "Handwerk OS vs. klassische Software", href: "/vergleich/klassische-handwerkersoftware", text: "Installiert oder Cloud?" },
      { label: "Handwerker-App", href: "/handwerker-app", text: "Handwerk OS auf dem Handy." },
      { label: "Auftragsverarbeitung", href: "/auftragsverarbeitung", text: "Der Vertrag zum Nachlesen." },
    ],
  },
};

export const schnittstellen: Landing = {
  pfad: "/schnittstellen",
  meta: {
    title: "Schnittstellen – DATEV, GAEB, Datanorm, XRechnung und mehr",
    description:
      "Handwerk OS arbeitet mit DATEV, GAEB, Datanorm, XRechnung, Kontoauszügen und Kalendern. Was heute geht und was als Nächstes kommt.",
  },
  breadcrumbs: [{ label: "Schnittstellen" }],
  hero: {
    eyebrow: "Schnittstellen",
    title: "Passt zu Steuerberater, Großhändler und Ausschreibung.",
    intro:
      "Handwerk OS spricht die Formate, die im Handwerk zählen. Hier siehst du ehrlich, was heute schon geht – und was als Nächstes kommt.",
    aktionen: { primaer: { label: "Kostenlos testen", href: cta.primary.href }, sekundaer: { label: "Schnittstelle anfragen", href: "#anfrage" } },
  },
  vorteile: {
    eyebrow: "Heute verfügbar",
    titel: "Das geht schon heute.",
    bild: "fenster",
    karten: [
      { titel: "DATEV", text: "Rechnungen und Belege im DATEV-Format an deinen Steuerberater übergeben.", icon: "calculator" },
      { titel: "GAEB", text: "Leistungsverzeichnis aus einer Ausschreibung einlesen – die Positionen landen im Angebot.", icon: "file" },
      { titel: "Datanorm", text: "Artikel und Preise deines Großhändlers einlesen. Vorhandene Artikel werden aktualisiert.", icon: "warehouse" },
      { titel: "XRechnung", text: "E-Rechnungen nach XRechnung 3.0 für öffentliche und private Auftraggeber.", icon: "euro" },
      { titel: "Kontoauszug", text: "Umsätze als CAMT.053 oder CSV einlesen – Lotte ordnet die Zahlungen zu.", icon: "check" },
      { titel: "Kalenderdatei", text: "Termine für Outlook, Google Kalender oder das iPhone herunterladen.", icon: "calendar" },
      { titel: "Excel & CSV", text: "Kunden, Artikel und Mitarbeiter per Datei übernehmen.", icon: "layers" },
      { titel: "Datenexport & Webhooks", text: "Alle Daten als JSON, Ereignisse für eigene Programme.", icon: "link" },
    ],
  },
  vergleich: {
    eyebrow: "Was als Nächstes kommt",
    titel: "In Arbeit.",
    intro: "Diese Verbindungen sind geplant. Bis sie da sind, gibt es meist einen Weg per Datei.",
    spalten: ["Bis dahin", "Geplant"],
    zeilen: [
      { merkmal: "Lexware Office", links: "Export im DATEV-Format", rechts: "Rechnungen und Belege automatisch übertragen" },
      { merkmal: "Bankkonto verbinden", links: "Kontoauszug als Datei einlesen", rechts: "Umsätze kommen jeden Tag von selbst" },
      { merkmal: "IDS Connect / OCI", links: "Bestellung in Handwerk OS anlegen und per E-Mail senden", rechts: "Im Shop des Großhändlers bestellen, Warenkorb kommt zurück" },
      { merkmal: "UGL", links: "Bestellung per E-Mail", rechts: "Anfragen, Bestellungen und Lieferscheine als Datei" },
      { merkmal: "SHK Connect", links: "Artikel per Datanorm", rechts: "Herstellerdaten, Bilder und Ersatzteile" },
      { merkmal: "Google Kalender & Outlook", links: "Kalenderdatei herunterladen", rechts: "Termine laufend abgleichen" },
      { merkmal: "Telefonanlage", links: "Anrufe von Hand erfassen", rechts: "Bei einem Anruf sofort sehen, wer dran ist" },
      { merkmal: "ZUGFeRD", links: "XRechnung", rechts: "PDF mit eingebetteten Rechnungsdaten" },
    ],
    hinweis: "Stand Oktober 2026. Wann eine Verbindung kommt, hängt auch von den Anbietern ab – deshalb nennen wir keine Termine.",
  },
  anfrage: {
    titel: "Schnittstelle fehlt?",
    intro: "Sag uns, womit Handwerk OS sprechen soll. Was viele Betriebe brauchen, kommt zuerst.",
    frage: "Wer fragt?",
    betreff: "Schnittstelle",
    email: PARTNER_EMAIL,
    anliegen: [
      {
        id: "betrieb",
        label: "Handwerksbetrieb",
        beschreibung: "Du brauchst eine Verbindung zu einem Programm oder Großhändler.",
        icon: "home",
        email: PARTNER_EMAIL,
        platzhalter: "Welche Software oder welcher Großhändler, und was soll ausgetauscht werden?",
      },
      {
        id: "anbieter",
        label: "Software-Anbieter",
        beschreibung: "Ihr wollt eure Software mit Handwerk OS verbinden.",
        icon: "link",
        email: PARTNER_EMAIL,
        platzhalter: "Wer seid ihr, welche Daten wollt ihr austauschen, gibt es eine Schnittstellenbeschreibung?",
      },
    ],
  },
  faq: [
    {
      frage: "Brauche ich für DATEV ein Zusatzmodul?",
      antwort: "Nein. Der Export im DATEV-Format ist in jedem Plan drin.",
    },
    {
      frage: "Welche GAEB-Dateien kann ich einlesen?",
      antwort: "Leistungsverzeichnisse aus Ausschreibungen im GAEB-XML-Format. Die Positionen landen im Angebot, du trägst die Preise ein.",
    },
    {
      frage: "Kostet eine Schnittstelle extra?",
      antwort: "Die Verbindungen in Handwerk OS sind in jedem Plan drin. Spezielle Anbindungen nur für deinen Betrieb gibt es ab dem Plan Betrieb auf Anfrage.",
    },
  ],
  weiter: {
    links: [
      { label: "Daten übernehmen", href: "/hilfe/daten-uebernehmen", text: "Kunden, Artikel und Mitarbeiter mitnehmen." },
      { label: "Großhändler-Daten", href: "/hilfe-center/grosshaendler-daten", text: "Artikel per Datanorm einlesen." },
      { label: "Partner", href: "/partner", text: "Integrationspartner werden." },
    ],
  },
};
