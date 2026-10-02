import type { FunktionInhalt, StandardSlug } from "../funktionen";

export const teil9 = {
  /* ───────────────────────── Finanzen im Blick ───────────────────────── */

  finanzen: {
    icon: "euro",
    kurz: "Rechnungen, Zahlungseingänge, Mahnungen und Belege an einer Stelle – du siehst jeden Tag, wo dein Geld steht.",
    enthalten: ["Offene Posten und Zahlungseingänge", "Mahnungen zur Freigabe", "Belege und Kosten am Auftrag", "Übergabe an den Steuerberater"],
    meta: {
      title: "Finanzen im Handwerk – Rechnungen, Zahlungen und Mahnungen im Blick",
      description:
        "Vom Angebot bis zum Geld auf dem Konto: Macher OS verbindet Rechnungen, Kontoauszug, Mahnungen, Belege und Nachkalkulation. Du siehst offene Posten sofort und übergibst alles im DATEV-Format.",
    },
    hero: {
      titel: "Du weißt jeden Tag, wo dein Geld steht.",
      problem:
        "Die Rechnungen stehen im einen Programm, die Zahlungen auf dem Konto, die Belege im Handschuhfach. Wer noch nicht bezahlt hat, merkst du erst, wenn das Geld knapp wird.",
      loesung:
        "Macher OS hängt alles am Auftrag zusammen. Der Kontoauszug zeigt, was bezahlt ist. Was offen ist, wird erinnert. Und am Monatsende geht alles an den Steuerberater.",
    },
    visual: {
      bereich: "Betrieb",
      titel: "Geld",
      untertitel: "Stand heute",
      kennzahlen: [
        ["12", "Rechnungen offen"],
        ["3", "überfällig"],
        ["4", "Belege ungeprüft"],
      ],
      liste: {
        ueberschrift: "Braucht dich",
        zeilen: [
          { titel: "R-2026-0142 · Fam. Krüger", sub: "seit 9 Tagen fällig", wert: "2.380 €", tag: "überfällig", ton: "signal" },
          { titel: "Zahlung 1.150 € · „RE 2026 139“", sub: "aus dem Kontoauszug", tag: "zuordnen", ton: "sand" },
          { titel: "R-2026-0137 · Hausverwaltung Ost", sub: "bezahlt mit Skonto", wert: "4.612 €", tag: "bezahlt", ton: "moss" },
        ],
      },
      hinweis: {
        icon: "bell",
        ton: "signal",
        titel: "Zwei Mahnungen fertig:",
        text: "Die Schreiben liegen bereit. Du entscheidest: senden oder noch warten.",
      },
    },
    problemTitel: "Das Geld ist verdient – aber noch lange nicht da.",
    probleme: [
      {
        titel: "Rechnungen bleiben liegen",
        text: "Der Auftrag ist fertig, die Rechnung schreibt man „am Wochenende“. Bis dahin hat der Kunde längst vergessen, was gemacht wurde.",
      },
      {
        titel: "Wer hat bezahlt?",
        text: "Du gehst den Kontoauszug Zeile für Zeile durch und suchst die passende Rechnung. Bei Teilzahlungen und Skonto wird es richtig zäh.",
      },
      {
        titel: "Mahnen ist unangenehm",
        text: "Keiner will den guten Kunden verärgern. Also wartet man – und das Geld fehlt bei Lohn und Material.",
      },
      {
        titel: "Monatsende im Schuhkarton",
        text: "Quittungen, Tankbelege und Lieferantenrechnungen liegen verteilt. Der Steuerberater fragt Wochen später nach, was fehlt.",
      },
    ],
    loesung: {
      titel: "Ein Weg vom Auftrag bis zum Geld auf dem Konto.",
      text: "Die Rechnung entsteht aus dem Auftrag, ohne Abtippen. Der Kontoauszug als Datei sagt Macher, was bezahlt ist. Was offen bleibt, landet als fertige Mahnung bei dir zur Freigabe. Belege hängen am Auftrag, und die Nachkalkulation zeigt, was übrig bleibt. Am Ende übergibst du alles im DATEV-Format.",
      punkte: [
        "Offene Posten mit Überfällig-Filter",
        "Kontoauszug als CAMT- oder CSV-Datei abgleichen",
        "Mahnungen erst nach deiner Freigabe",
        "Belege, Ertrag und DATEV-Export am selben Ort",
      ],
    },
    detail: {
      kopf: "Auftrag A-2026-131",
      titel: "Badsanierung Krüger",
      sub: "abgenommen am 12. September",
      status: { text: "Teilweise bezahlt", ton: "sand" },
      zeilen: [
        { label: "Abschlag 1", wert: "4.000 € · bezahlt" },
        { label: "Schlussrechnung", wert: "2.380 € · offen" },
        { label: "Fällig seit", wert: "9 Tagen" },
        { label: "Belege am Auftrag", wert: "7 · 2.940 €" },
        { label: "Deckungsbeitrag", wert: "1.870 € (29 %)", hervor: true },
      ],
      fuss: { icon: "bell", text: "Zahlungserinnerung liegt zur Freigabe bereit." },
    },
    schritte: [
      {
        titel: "Rechnung aus dem Auftrag",
        text: "Leistungen, Stunden und Material sind schon da. Du prüfst, schickst ab – auch als E-Rechnung.",
      },
      {
        titel: "Kontoauszug einlesen",
        text: "Lade die Datei aus deinem Online-Banking hoch. Macher ordnet die Zahlungen den Rechnungen zu.",
      },
      {
        titel: "Offenes klären",
        text: "Überfällige Rechnungen und unklare Zahlungen kommen zu dir. Mahnungen sind schon geschrieben – du gibst sie frei.",
      },
      {
        titel: "Abschließen und übergeben",
        text: "Belege prüfen, Ertrag ansehen, Monat als DATEV-Datei an den Steuerberater geben.",
      },
    ],
    automatisch: [
      "ordnet Zahlungen über Rechnungsnummer, Betrag und Kunde zu",
      "erkennt Teilzahlungen, Skonto und Sammelzahlungen",
      "setzt die Rechnung auf bezahlt und verwirft vorbereitete Mahnungen",
      "schreibt Erinnerung und Mahnung mit Gebühr und Zinsen nach deinen Regeln",
      "rechnet Lohn, Material und Belege je Auftrag zum Ertrag zusammen",
      "erinnert ab dem 3. des Monats an die Übergabe an den Steuerberater",
    ],
    geraete: {
      handy: [
        "Offene Posten unterwegs ansehen",
        "Mahnung mit einem Tipp freigeben",
        "Beleg direkt im Laden fotografieren",
      ],
      computer: [
        "Kontoauszug einlesen und Zahlungen zuordnen",
        "Rechnungen, Mahnungen und Belege in Ruhe prüfen",
        "Ertrag je Auftrag und DATEV-Export",
      ],
      handyVisual: {
        kopf: "Braucht dich · Geld",
        titel: "R-2026-0142 · Fam. Krüger",
        sub: "seit 9 Tagen fällig",
        tags: [
          { text: "überfällig", ton: "signal" },
          { text: "Erinnerung bereit", ton: "sand" },
        ],
        felder: [
          { label: "Offen", wert: "2.380 €" },
          { label: "Fällig am", wert: "23. September" },
          { label: "Bisher gemahnt", wert: "noch nicht" },
        ],
        aktion: { icon: "bell", text: "Erinnerung senden" },
      },
    },
    gewerke: [
      { slug: "galabau", text: "Viele kleine Aufträge im Sommer: Rechnungen gehen am Tag der Abnahme raus, Zahlungen ordnen sich selbst zu." },
      { slug: "shk", text: "Wartungen und Notdienste in großer Zahl – offene Posten und Mahnungen bleiben trotzdem überschaubar." },
      { slug: "bau", text: "Abschläge und Schlussrechnung je Bauabschnitt: Du siehst, was bezahlt ist und was noch kommt." },
    ],
    kunde: {
      slug: "gruen-werk",
      text: "Beispiel: Wie ein Gartenbaubetrieb Rechnungen am Tag der Abnahme verschickt und Zahlungen per Kontoauszug abgleicht.",
    },
    werkzeug: "deckungsbeitrags-rechner",
    faq: [
      {
        frage: "Ist meine Bank direkt angebunden?",
        antwort:
          "Noch nicht. Heute lädst du den Kontoauszug als Datei hoch (CAMT oder CSV aus dem Online-Banking). Die direkte Verbindung zur Bank ist geplant.",
      },
      {
        frage: "Gehen Mahnungen von selbst raus?",
        antwort:
          "Nein. Macher schreibt die Erinnerung oder Mahnung fertig. Senden tust du – oder du sagst „Noch warten“. Für gute Kunden kannst du das Mahnen ganz abschalten.",
      },
      {
        frage: "Wer sieht die Zahlen?",
        antwort:
          "Nur wer im Team das Recht für Geld hat. Monteure sehen keine Beträge, keine offenen Posten und keinen Ertrag.",
      },
      {
        frage: "Ersetzt das meine Buchhaltung?",
        antwort:
          "Nein. Macher OS kümmert sich um Rechnungen, Zahlungen und Belege im Betrieb. Die Buchhaltung macht weiter dein Steuerberater – er bekommt alles als DATEV-Datei.",
      },
    ],
    verwandt: ["rechnungen", "zahlungen", "datev"],
  },

  /* ───────────────────────── Buchhaltung ───────────────────────── */

  buchhaltung: {
    icon: "book",
    kurz: "Belege und Buchungen so vorbereitet, dass dein Steuerberater nichts abtippen muss. Kommt bald – der DATEV-Export geht schon heute.",
    enthalten: ["Belege fotografieren und zuordnen", "Zahlungsabgleich per Kontoauszug", "DATEV-Export SKR03 und SKR04"],
    meta: {
      title: "Buchhaltung für Handwerker – Belege und Buchungen für den Steuerberater",
      description:
        "Macher OS ist kein Buchhaltungsprogramm. Es bereitet Rechnungen, Belege und Zahlungen so vor, dass dein Steuerberater sie ohne Abtippen übernimmt. Heute schon: DATEV-Export mit SKR03 oder SKR04.",
    },
    bald: {
      text: "Wir bauen aus, wie Macher OS Belege und Buchungen für deine Buchhaltung vorbereitet – damit dein Steuerberater oder dein Buchhaltungsprogramm sie ohne Abtippen übernimmt. Direkte Verbindungen zu DATEV Unternehmen online und Lexware Office sind geplant.",
      heute: [
        "DATEV-Export als Buchungsstapel (EXTF) mit SKR03 oder SKR04",
        "Belege fotografieren, prüfen und dem Auftrag zuordnen",
        "Zahlungen per Kontoauszug-Datei (CAMT oder CSV) abgleichen",
        "Checkliste für den Monatsabschluss",
      ],
    },
    hero: {
      titel: "Dein Steuerberater bekommt alles – ohne Schuhkarton.",
      problem:
        "Am Monatsende suchst du Quittungen zusammen, schreibst Listen und schickst Rechnungen doppelt. Der Steuerberater tippt ab und fragt Wochen später nach.",
      loesung:
        "Macher OS sammelt Rechnungen, Belege und Zahlungen im Alltag mit. Am Monatsende gibst du alles als DATEV-Datei weiter. Buchen und Steuern bleiben beim Steuerberater.",
    },
    visual: {
      bereich: "Betrieb",
      titel: "Monatsabschluss",
      untertitel: "September",
      kennzahlen: [
        ["38", "Rechnungen"],
        ["61", "Belege"],
        ["3", "noch ungeprüft"],
      ],
      liste: {
        ueberschrift: "Checkliste",
        zeilen: [
          { titel: "Rechnungen festgeschrieben", sub: "keine Entwürfe mehr offen", tag: "erledigt", ton: "moss" },
          { titel: "Belege geprüft", sub: "3 Belege noch ungeprüft", tag: "offen", ton: "sand" },
          { titel: "Zahlungen abgeglichen", sub: "Kontoauszug bis 30.09.", tag: "erledigt", ton: "moss" },
          { titel: "An Steuerberater übergeben", sub: "SKR03 · Buchungsstapel", tag: "bereit", ton: "sky" },
        ],
      },
      hinweis: {
        icon: "clock",
        ton: "sky",
        titel: "Vormonat übergeben:",
        text: "Es ist der 3. Oktober. Der September ist noch nicht beim Steuerberater.",
      },
    },
    problemTitel: "Buchhaltung frisst Zeit, die du nicht hast.",
    probleme: [
      {
        titel: "Belege gehen verloren",
        text: "Die Tankquittung liegt im Auto, der Baumarkt-Bon in der Jacke. Was fehlt, merkt erst der Steuerberater.",
      },
      {
        titel: "Alles wird zweimal getippt",
        text: "Rechnungen schreibst du einmal für den Kunden und einmal in eine Liste. Der Steuerberater tippt sie dann ein drittes Mal.",
      },
      {
        titel: "Konten versteht keiner",
        text: "SKR03, SKR04, Debitoren, Kreditoren – im Betrieb weiß niemand, was wohin gehört.",
      },
      {
        titel: "Was ist schon übergeben?",
        text: "Keiner weiß genau, welche Belege schon beim Steuerberater sind. Manches kommt doppelt, manches gar nicht.",
      },
    ],
    loesung: {
      titel: "Vorbereitet im Alltag, übergeben mit einem Klick.",
      text: "Rechnungen entstehen in Macher OS, Belege fotografierst du direkt mit dem Handy. Zahlungen kommen über den Kontoauszug dazu. Für den Export bestimmt Macher Konten und Steuerschlüssel aus Kategorie und Steuersatz. Dein Steuerberater liest die Datei in DATEV ein – und bucht wie gewohnt.",
      punkte: [
        "Buchungsstapel im DATEV-Format, SKR03 oder SKR04",
        "Debitoren- und Kreditorennummern von selbst",
        "Warnung, bevor etwas doppelt übergeben wird",
        "Protokoll, wann was exportiert wurde",
      ],
    },
    detail: {
      kopf: "Steuerberater & DATEV",
      titel: "Export September",
      sub: "01.09. bis 30.09.",
      status: { text: "Bereit zur Übergabe", ton: "sky" },
      zeilen: [
        { label: "Kontenrahmen", wert: "SKR03" },
        { label: "Ausgangsrechnungen", wert: "38" },
        { label: "Belege", wert: "61" },
        { label: "Schon übergeben", wert: "keine doppelt" },
        { label: "Format", wert: "EXTF Buchungsstapel", hervor: true },
      ],
      fuss: { icon: "download", text: "Die Datei liest dein Steuerberater in DATEV ein." },
    },
    schritte: [
      {
        titel: "Beleg fotografieren",
        text: "Quittung oder Lieferantenrechnung mit dem Handy aufnehmen. Lieferant, Datum, Betrag und Steuersatz eintragen, Auftrag wählen.",
      },
      {
        titel: "Zahlungen abgleichen",
        text: "Kontoauszug als Datei hochladen. Macher ordnet die Eingänge den Rechnungen zu.",
      },
      {
        titel: "Monat prüfen",
        text: "Die Checkliste zeigt, was noch fehlt: Entwürfe, ungeprüfte Belege, offene Zeiten.",
      },
      {
        titel: "An den Steuerberater",
        text: "Zeitraum wählen, Datei erzeugen, weitergeben. Was schon übergeben ist, ist markiert.",
      },
    ],
    automatisch: [
      "vergibt Debitoren ab 10000 und Kreditoren ab 70000 dauerhaft",
      "bestimmt Konto und Steuerschlüssel aus Belegkategorie und Steuersatz",
      "markiert übergebene Rechnungen und Belege",
      "warnt, bevor etwas ein zweites Mal exportiert wird",
      "prüft die Checkliste für den Monatsabschluss",
      "erinnert ab dem 3. des Monats an die Übergabe",
    ],
    geraete: {
      handy: [
        "Beleg im Laden oder an der Tankstelle fotografieren",
        "Beleg gleich dem Auftrag zuordnen",
        "Sehen, ob der Monat vollständig ist",
      ],
      computer: [
        "Belege prüfen und Kategorie setzen",
        "Kontoauszug einlesen",
        "DATEV-Export erzeugen und Protokoll ansehen",
      ],
      handyVisual: {
        kopf: "Beleg erfassen",
        titel: "Tankstelle · Diesel",
        sub: "heute, 07:42",
        tags: [
          { text: "Tankbeleg", ton: "sky" },
          { text: "neu", ton: "sand" },
        ],
        felder: [
          { label: "Betrag brutto", wert: "84,20 €" },
          { label: "Steuersatz", wert: "19 %" },
          { label: "Auftrag", wert: "A-2026-131 · Krüger" },
        ],
        aktion: { icon: "camera", text: "Beleg speichern" },
      },
    },
    gewerke: [
      { slug: "elektriker", text: "Viele Großhandelsrechnungen im Monat: Sie hängen am Auftrag und gehen gesammelt an den Steuerberater." },
      { slug: "maler", text: "Baumarkt-Bons und Farbe auf Rechnung – fotografiert, bevor sie im Auto verschwinden." },
      { slug: "dachdecker", text: "Material, Gerüst, Entsorgung: Belege landen am richtigen Auftrag und im richtigen Monat." },
    ],
    kunde: {
      slug: "malerei-koch",
      text: "Beispiel: Wie ein Malerbetrieb Belege direkt vom Handy erfasst und dem Steuerberater jeden Monat eine DATEV-Datei gibt.",
    },
    faq: [
      {
        frage: "Ersetzt Macher OS meinen Steuerberater?",
        antwort:
          "Nein. Macher OS ist kein Buchhaltungsprogramm und keine Steuerberatung. Es bereitet Rechnungen, Belege und Zahlungen vor. Buchen, Umsatzsteuer und Abschluss macht weiter dein Steuerberater.",
      },
      {
        frage: "Ab wann geht das?",
        antwort:
          "Ein festes Datum nennen wir nicht. Den DATEV-Export, die Belege und den Zahlungsabgleich per Datei kannst du heute schon nutzen. Was dazukommt, siehst du in Macher OS unter „Schnittstellen“.",
      },
      {
        frage: "Was kann mein Steuerberater mit der Datei anfangen?",
        antwort:
          "Es ist ein Buchungsstapel im DATEV-Format (EXTF) mit SKR03 oder SKR04. Den liest er in DATEV ein. Sprich am besten vorher kurz mit ihm über Kontenrahmen, Berater- und Mandantennummer.",
      },
      {
        frage: "Werden auch die Belegbilder übergeben?",
        antwort:
          "Heute nicht. Der Export enthält die Buchungen. Die Fotos der Belege bleiben in Macher OS am Auftrag und lassen sich dort jederzeit aufrufen.",
      },
    ],
    verwandt: ["datev", "belege", "zahlungen"],
  },

  /* ───────────────────────── Dokumentenmanagement ───────────────────────── */

  dokumentenmanagement: {
    icon: "layers",
    kurz: "Pläne, PDFs, Fotos und Berichte geordnet am Auftrag und schnell gefunden. Kommt bald als Ablage für alle Unterlagen im Betrieb.",
    enthalten: ["Dateien am Auftrag", "Zentrale Dateiliste mit Filter", "Suche über alles", "Für Kunden sichtbar"],
    meta: {
      title: "Dokumentenmanagement im Handwerk – Unterlagen geordnet und schnell gefunden",
      description:
        "Pläne, PDFs, Fotos und Berichte liegen in Macher OS am richtigen Auftrag und sind über die Suche schnell gefunden. Eine Ablage für alle Unterlagen des Betriebs ist in Arbeit.",
    },
    bald: {
      text: "Wir bauen Macher OS zur Ablage für alle Unterlagen im Betrieb aus: auch am Kunden, am Einsatzort und am Mitarbeiter, mit mehr Platz je Datei.",
      heute: [
        "Pläne, PDFs und Dateien am Auftrag hochladen",
        "Zentrale Dateiliste mit Filter für Pläne, PDFs und Kundendateien",
        "Suche findet Dateien, Dokumente und Rechnungen",
        "Fotos, Berichte und Belege hängen am Auftrag",
      ],
    },
    hero: {
      titel: "Jede Unterlage liegt da, wo sie hingehört.",
      problem:
        "Der Plan steckt im Postfach vom Chef, das Datenblatt auf dem Büro-PC, das Foto auf einem Handy. Wer etwas sucht, ruft herum.",
      loesung:
        "In Macher OS hängt jede Datei am Auftrag. Monteur und Büro sehen denselben Stand. Und die Suche findet Dateien, Berichte und Rechnungen mit ein paar Buchstaben.",
    },
    visual: {
      bereich: "Betrieb",
      titel: "Dateien",
      untertitel: "alle Aufträge",
      kennzahlen: [
        ["86", "Dateien"],
        ["14", "Pläne"],
        ["9", "für Kunden"],
      ],
      liste: {
        ueberschrift: "Zuletzt hochgeladen",
        zeilen: [
          { titel: "Grundriss Keller", sub: "A-2026-124 · Wohnanlage Haus 24", tag: "Plan", ton: "sky" },
          { titel: "Datenblatt Speicher", sub: "A-2026-131 · Badsanierung Krüger", tag: "PDF", ton: "ink" },
          { titel: "Abnahmeprotokoll", sub: "A-2026-118 · Einbauschrank Flur", tag: "für Kunden", ton: "moss" },
        ],
      },
      hinweis: {
        icon: "search",
        ton: "moss",
        titel: "Schnell gefunden:",
        text: "Tippe „Keller“ in die Suche – Plan, Fotos und Auftrag stehen untereinander.",
      },
    },
    problemTitel: "Unterlagen gibt es genug. Sie liegen nur nie da, wo man sie braucht.",
    probleme: [
      {
        titel: "Der Plan fehlt auf der Baustelle",
        text: "Der Monteur steht vor Ort, der aktuelle Plan liegt im Büro. Also wird angerufen, fotografiert, weitergeleitet.",
      },
      {
        titel: "Vier Ordner, drei Rechner",
        text: "Jeder legt anders ab. Was der Kollege gespeichert hat, findet nur der Kollege.",
      },
      {
        titel: "Dateien heißen „Scan_0042“",
        text: "Ohne Namen und ohne Auftrag weiß niemand, was drinsteht. Öffnen, schließen, nächste Datei.",
      },
      {
        titel: "Was darf der Kunde sehen?",
        text: "Protokoll ja, Kalkulation nein. Wer das jedes Mal neu entscheiden muss, schickt irgendwann das Falsche.",
      },
    ],
    loesung: {
      titel: "Ablage am Auftrag statt Ordner auf dem Rechner.",
      text: "Du lädst eine Datei hoch und wählst den Auftrag. Macher übernimmt den Titel aus dem Dateinamen und erkennt Plan oder PDF. Fotos, Berichte, Belege und Schreiben hängen ohnehin am Auftrag. In der zentralen Liste filterst du nach Art, die Suche findet alles über den Titel.",
      punkte: [
        "Eine Liste aller Dateien mit Filter",
        "Vorschau für Bilder und PDFs, auch auf dem Handy",
        "Schalter „Für Kunden sichtbar“ je Datei",
        "Löschen mit Rückgängig, Pflichtunterlagen bleiben",
      ],
    },
    detail: {
      kopf: "Datei · A-2026-124",
      titel: "Grundriss Keller",
      sub: "Wohnanlage Haus 24",
      status: { text: "Nur intern", ton: "ink" },
      zeilen: [
        { label: "Art", wert: "Plan" },
        { label: "Größe", wert: "0,8 MB" },
        { label: "Hochgeladen", wert: "von Büro, vor 2 Tagen" },
        { label: "Auftrag", wert: "A-2026-124" },
        { label: "Für Kunden sichtbar", wert: "nein", hervor: true },
      ],
      fuss: { icon: "clock", text: "Im Zeitstrahl steht, wer die Datei wann geändert hat." },
    },
    schritte: [
      {
        titel: "Datei hochladen",
        text: "Am Auftrag oder in der zentralen Liste. Titel und Art schlägt Macher aus dem Dateinamen vor.",
      },
      {
        titel: "Auftrag wählen",
        text: "Damit liegt die Datei beim Kunden, beim Team und bei allen anderen Unterlagen zum Auftrag.",
      },
      {
        titel: "Freigeben oder nicht",
        text: "Ein Schalter entscheidet, ob der Kunde die Datei in seinem Kundenbereich sieht.",
      },
      {
        titel: "Finden",
        text: "Über den Auftrag, die Dateiliste mit Filter oder die Suche – im Büro und auf dem Handy.",
      },
    ],
    automatisch: [
      "nimmt den Titel aus dem Dateinamen",
      "erkennt Plan, PDF oder sonstige Datei",
      "verkleinert Fotos vor dem Speichern",
      "prüft vor dem Hochladen, ob die Datei passt, und sagt warum nicht",
      "hält Rechnungen, Zahlungen, Belege und Angebote wegen der Aufbewahrungspflicht zurück",
      "zeigt im Zeitstrahl, wer was wann geändert hat",
    ],
    geraete: {
      handy: [
        "Plan vor Ort öffnen und heranzoomen",
        "Foto vom Papierplan als Datei ablegen",
        "Datei über die Suche finden",
      ],
      computer: [
        "Dateien hochladen und dem Auftrag zuordnen",
        "Zentrale Liste mit Filter",
        "Festlegen, was der Kunde sieht",
      ],
      handyVisual: {
        kopf: "Auftrag · Dateien",
        titel: "Grundriss Keller",
        sub: "A-2026-124 · Haus 24",
        tags: [
          { text: "Plan", ton: "sky" },
          { text: "nur intern", ton: "ink" },
        ],
        felder: [
          { label: "Größe", wert: "0,8 MB" },
          { label: "Hochgeladen", wert: "vor 2 Tagen" },
          { label: "Von", wert: "Büro" },
        ],
        aktion: { icon: "file", text: "Plan öffnen" },
      },
    },
    gewerke: [
      { slug: "elektriker", text: "Stromlaufpläne und Datenblätter liegen am Auftrag – der Monteur hat sie auf dem Handy dabei." },
      { slug: "tischler", text: "Zeichnungen und Aufmaße am Auftrag, damit Werkstatt und Montage mit demselben Stand arbeiten." },
      { slug: "bau-rohbau", text: "Viele Pläne, viele Beteiligte: Was intern bleibt und was der Bauherr sieht, ist je Datei klar." },
    ],
    kunde: {
      slug: "dach-hansen",
      text: "Beispiel: Wie ein Dachdecker Pläne, Fotos und Protokolle am Auftrag ablegt und vom Handy aus wiederfindet.",
    },
    faq: [
      {
        frage: "Ab wann geht das?",
        antwort:
          "Ein festes Datum nennen wir nicht. Dateien am Auftrag, die zentrale Liste und die Suche kannst du heute schon nutzen. Die Ablage am Kunden, am Ort und am Mitarbeiter kommt danach.",
      },
      {
        frage: "Wie groß darf eine Datei sein?",
        antwort:
          "Heute höchstens 1,5 MB je Datei. Fotos verkleinert Macher von selbst. Ist ein PDF zu groß, sagt Macher dir, warum – und dass du es verkleinern oder aufteilen kannst.",
      },
      {
        frage: "Gibt es Ordner und Versionen?",
        antwort:
          "Nein. Statt Ordnern gibt es den Auftrag als Ablage. Versionen von Plänen gibt es noch nicht. Gib dem neuen Stand einen klaren Titel, zum Beispiel mit Datum.",
      },
      {
        frage: "Durchsucht die Suche auch den Inhalt von PDFs?",
        antwort:
          "Nein. Die Suche findet Dateien über Titel und Stichworte, dazu Kunden, Aufträge, Rechnungen und Termine. Ein klarer Titel hilft also.",
      },
    ],
    verwandt: ["dokumente", "dokumentation", "berichte"],
  },

  /* ───────────────────────── IDS Connect ───────────────────────── */

  "ids-connect": {
    icon: "cart",
    kurz: "Im Shop deines Großhändlers bestellen, der Warenkorb kommt zurück an den Auftrag. Kommt bald – DATANORM und Bestellungen per E-Mail gehen schon.",
    enthalten: ["Shop aus Macher OS öffnen", "Warenkorb als Bestellung zurück", "Preise und Verfügbarkeit"],
    meta: {
      title: "IDS Connect für Handwerker – Großhandel direkt aus Macher OS",
      description:
        "Geplant: den Shop deines Großhändlers aus Macher OS öffnen und den Warenkorb als Bestellung zurück an den Auftrag holen. Heute schon: DATANORM-Import und Bestellungen je Lieferant per E-Mail.",
    },
    bald: {
      text: "Mit IDS Connect öffnest du den Online-Shop deines Großhändlers direkt aus Macher OS. Der Warenkorb kommt als Bestellung zurück – mit Preisen und Verfügbarkeit, am richtigen Auftrag.",
      heute: [
        "Artikel und Preise per DATANORM einlesen (Version 4 und 5)",
        "Materialbedarf aller Aufträge mit Fehlmengen je Lieferant",
        "Bestellungen je Lieferant anlegen und per E-Mail senden",
        "Wareneingang buchen, auch in Teilmengen",
      ],
    },
    hero: {
      titel: "Bestellen beim Großhandel, ohne alles abzutippen.",
      problem:
        "Du stellst den Warenkorb im Shop zusammen, druckst ihn aus und tippst ihn in den Auftrag. Oder du lässt es – und weißt später nicht mehr, was wofür bestellt war.",
      loesung:
        "Mit IDS Connect startest du im Auftrag, bestellst im gewohnten Shop und bekommst den Warenkorb als Bestellung zurück. Artikel, Mengen und Preise stehen dann am Auftrag.",
    },
    visual: {
      bereich: "Betrieb",
      titel: "Bestellung",
      untertitel: "aus dem Großhandels-Shop",
      kennzahlen: [
        ["6", "Positionen"],
        ["5", "lieferbar"],
        ["1", "Lieferzeit"],
      ],
      liste: {
        ueberschrift: "Warenkorb zurück · A-2026-127",
        zeilen: [
          { titel: "Kupferrohr 15 mm", sub: "25 m", wert: "lieferbar", tag: "Rohr", ton: "moss" },
          { titel: "Pressfitting Bogen 15", sub: "20 Stück", wert: "lieferbar", tag: "Fitting", ton: "moss" },
          { titel: "Heizkreisverteiler", sub: "1 Stück", wert: "3–5 Tage", tag: "Lieferzeit", ton: "sand" },
        ],
      },
      hinweis: {
        icon: "cart",
        ton: "sky",
        titel: "Kommt bald:",
        text: "So soll der Warenkorb aus dem Shop am Auftrag ankommen. Heute bestellst du per E-Mail aus Macher.",
      },
    },
    problemTitel: "Bestellen heißt heute: zweimal tippen.",
    probleme: [
      {
        titel: "Shop und Auftrag sind getrennt",
        text: "Im Shop siehst du Preise und Lagerbestand. Im Auftrag weiß davon keiner etwas.",
      },
      {
        titel: "Abtippen nach dem Bestellen",
        text: "Artikelnummer, Menge, Preis – alles noch einmal in den Auftrag oder in die Rechnung. Dabei passieren Fehler.",
      },
      {
        titel: "Was war für welchen Auftrag?",
        text: "Die Sammelbestellung kommt, aber keiner weiß mehr, welcher Teil für welche Baustelle war.",
      },
      {
        titel: "Preise von gestern",
        text: "In der Kalkulation stehen alte Preise. Erst die Lieferantenrechnung zeigt, was es wirklich gekostet hat.",
      },
    ],
    loesung: {
      titel: "Vom Auftrag in den Shop – und zurück.",
      text: "Mit IDS Connect öffnest du aus dem Auftrag heraus den Shop deines Großhändlers. Du bestellst wie gewohnt. Der Warenkorb kommt als Bestellung zurück an den Auftrag. Bis es so weit ist, liest du Artikel und Preise per DATANORM ein und bestellst je Lieferant per E-Mail aus Macher OS.",
      punkte: [
        "Shop aus dem Auftrag öffnen",
        "Warenkorb kommt als Bestellung zurück",
        "Preise und Verfügbarkeit aus dem Shop",
        "Heute: DATANORM und Bestellung per E-Mail",
      ],
    },
    detail: {
      kopf: "Schnittstellen · Großhandel",
      titel: "IDS Connect",
      sub: "Bestellen im Shop deines Großhändlers",
      status: { text: "Geplant", ton: "ink" },
      zeilen: [
        { label: "Verbindung", wert: "mit Zugangsdaten" },
        { label: "Du brauchst", wert: "Kundennummer" },
        { label: "und", wert: "Shop-Benutzer" },
        { label: "Version", wert: "IDS Connect 2.x" },
        { label: "Bis dahin", wert: "Bestellung per E-Mail", hervor: true },
      ],
      fuss: { icon: "link", text: "Der Warenkorb kommt über eine Rücksprung-Adresse an Macher OS." },
    },
    schritte: [
      {
        titel: "Zugang eintragen",
        text: "Einmal Kundennummer und Shop-Benutzer deines Großhändlers hinterlegen.",
      },
      {
        titel: "Shop aus dem Auftrag öffnen",
        text: "Du startest im Auftrag. Der Shop öffnet sich mit deinen Konditionen.",
      },
      {
        titel: "Warenkorb zurückschicken",
        text: "Statt im Shop abzuschließen, schickst du den Warenkorb an Macher OS zurück.",
      },
      {
        titel: "Bestellung prüfen und senden",
        text: "Artikel, Mengen und Preise stehen am Auftrag. Du prüfst und bestellst.",
      },
    ],
    automatisch: [
      "übernimmt Artikel, Mengen und Preise aus dem Warenkorb",
      "hängt die Bestellung an den richtigen Auftrag",
      "setzt das Material am Auftrag auf „bestellt“",
      "erkennt Artikel, die per DATANORM schon da sind",
      "meldet, wenn eine Lieferung überfällig ist",
    ],
    geraete: {
      handy: [
        "Bestellstatus am Auftrag sehen",
        "Wareneingang auf der Baustelle buchen",
        "Fehlendes Material melden",
      ],
      computer: [
        "Shop des Großhändlers aus dem Auftrag öffnen",
        "Warenkorb prüfen und bestellen",
        "DATANORM einlesen und Bestellungen per E-Mail senden",
      ],
      handyVisual: {
        kopf: "Auftrag · Material",
        titel: "B-2026-0058 · Großhandel",
        sub: "bestellt für A-2026-127",
        tags: [
          { text: "bestellt", ton: "sky" },
          { text: "1 Position mit Lieferzeit", ton: "sand" },
        ],
        felder: [
          { label: "Positionen", wert: "6" },
          { label: "Erwartet", wert: "Donnerstag" },
          { label: "Lieferort", wert: "Hauptlager" },
        ],
        aktion: { icon: "box", text: "Wareneingang buchen" },
      },
    },
    gewerke: [
      { slug: "shk", text: "Rohre, Fittings, Armaturen: viele Positionen je Auftrag, die nicht mehr abgetippt werden sollen." },
      { slug: "elektriker", text: "Kabel, Schalter, Verteiler – der Warenkorb aus dem Elektrogroßhandel landet direkt am Auftrag." },
      { slug: "shk-gebaeudetechnik", text: "Für Lüftung, Klima und Kälte: Preise und Lieferzeiten stehen an der Bestellung." },
    ],
    kunde: {
      slug: "haustechnik-yilmaz",
      text: "Beispiel: Wie ein SHK-Betrieb Großhandelspreise per DATANORM einliest und Bestellungen je Lieferant aus Macher OS verschickt.",
    },
    werkzeug: "materialaufschlag-rechner",
    faq: [
      {
        frage: "Ab wann geht das?",
        antwort:
          "Ein festes Datum nennen wir nicht. Bis dahin liest du Artikel und Preise per DATANORM ein und schickst Bestellungen je Lieferant per E-Mail aus Macher OS.",
      },
      {
        frage: "Welche Großhändler werden unterstützt?",
        antwort:
          "Geplant ist IDS Connect in Version 2.x. Ob dein Großhändler das anbietet, erfährst du bei ihm. Feste Partner nennen wir erst, wenn die Verbindung wirklich läuft.",
      },
      {
        frage: "Was brauche ich dafür?",
        antwort:
          "Deine Kundennummer und einen Shop-Benutzer bei deinem Großhändler. Die trägst du einmal in Macher OS ein.",
      },
      {
        frage: "Was mache ich bis dahin?",
        antwort:
          "Lies die DATANORM-Datei deines Großhändlers ein. Der Materialbedarf zeigt, was fehlt, und macht daraus Bestellungen je Lieferant. Die gehen per E-Mail raus, der Wareneingang wird in Macher gebucht.",
      },
    ],
    verwandt: ["datanorm", "einkauf", "materialbedarf"],
  },
} satisfies Partial<Record<StandardSlug, FunktionInhalt>>;
