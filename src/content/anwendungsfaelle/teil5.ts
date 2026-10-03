import type { FunktionInhalt, StandardSlug } from "../funktionen";

export const teil5 = {
  /* ───────────────────────── Mitarbeiter einarbeiten ───────────────────────── */

  einarbeitung: {
    icon: "clipboard",
    kurz: "Neue Leute bekommen automatisch einen Plan je Rolle – vom Vertrag bis zum Gespräch vor Ende der Probezeit.",
    enthalten: ["Plan je Rolle", "Pflicht-Unterweisungen", "Probezeit-Gespräch"],
    meta: {
      title: "Neue Mitarbeiter einarbeiten – Plan je Rolle für Handwerksbetriebe",
      description:
        "Legst du einen neuen Mitarbeiter an, steht sofort sein Einarbeitungsplan: Unterlagen, Kleidung, Werkzeug, Unterweisungen, erste Einsätze und Gespräche. Handwerk OS meldet, was liegen bleibt.",
    },
    hero: {
      titel: "Der Neue fängt an. Der Plan steht schon.",
      problem:
        "Am ersten Tag hat keiner Zeit. Die Steuer-ID fehlt, die Schutzschuhe auch, und die Unterweisung wird „nächste Woche“ nachgeholt.",
      loesung:
        "Handwerk OS erstellt beim Anlegen sofort einen Einarbeitungsplan passend zur Rolle. Du hakst nur ab – und siehst, was überfällig ist.",
    },
    visual: {
      bereich: "Betrieb",
      titel: "Mitarbeiter einarbeiten",
      untertitel: "2 laufend",
      kennzahlen: [
        ["2", "laufend"],
        ["64 %", "erledigt"],
        ["1", "Schritt überfällig"],
      ],
      liste: {
        ueberschrift: "Laufende Einarbeitungen",
        zeilen: [
          { titel: "Lena Hoffmann · Azubi", sub: "Start 1. September · Erste Woche", tag: "1 überfällig", ton: "signal" },
          { titel: "Marco Weiß · Monteur", sub: "Start 15. September · Erster Monat", tag: "78 %", ton: "sky" },
          { titel: "Sandra Kühn · Büro", sub: "Start 1. Juli · abgeschlossen", tag: "fertig", ton: "moss" },
        ],
      },
      hinweis: {
        icon: "spark",
        ton: "moss",
        titel: "Macher hat erledigt:",
        text: "Einarbeitungsplan für Marco Weiß angelegt – 14 Schritte, inklusive Pflicht-Unterweisungen.",
      },
    },
    problemTitel: "Einarbeiten passiert nebenbei – und dann fehlt etwas.",
    probleme: [
      {
        titel: "Der erste Tag ohne Plan",
        text: "Der Neue steht um sieben im Hof. Der Chef ist schon auf der Baustelle, Arbeitskleidung liegt noch im Karton.",
      },
      {
        titel: "Unterlagen fürs Lohnbüro fehlen",
        text: "Steuer-ID, Sozialversicherungsnummer, Krankenkasse: Am Monatsende fragt das Lohnbüro nach – und keiner hat sie.",
      },
      {
        titel: "Unterweisung vergessen",
        text: "Pflicht-Unterweisungen sollen vor dem ersten Einsatz sitzen. Im Alltag rutschen sie nach hinten – bis etwas passiert.",
      },
      {
        titel: "Probezeit vorbei, kein Gespräch",
        text: "Feedback nach den ersten Wochen? Gespräch vor Ende der Probezeit? Beides fällt erst auf, wenn es zu spät ist.",
      },
    ],
    loesung: {
      titel: "Ein Plan je Rolle – automatisch beim Anlegen.",
      text: "Legst du einen Monteur, Azubi oder eine Bürokraft an, erstellt Macher den passenden Einarbeitungsplan. Jeder Schritt hat ein Fälligkeitsdatum ab dem Eintritt: erster Tag, erste Woche, erster Monat, Probezeit. Pflicht-Unterweisungen der Rolle sind schon drin.",
      punkte: [
        "Unterlagen, Ausstattung, Zugänge, Praxis und Gespräche in einem Plan",
        "Eigener Plan für Monteure, Azubis und Büro",
        "Pflicht-Unterweisungen der Rolle automatisch dabei",
        "Eigene Schritte ergänzen, zum Beispiel „Baustelle Haus 24 zeigen“",
      ],
    },
    detail: {
      kopf: "Einarbeitung · Start 1. September",
      titel: "Lena Hoffmann",
      sub: "Azubi · Erste Woche",
      status: { text: "läuft", ton: "sky" },
      zeilen: [
        { label: "Fortschritt", wert: "9 von 15 Schritten" },
        { label: "Erster Tag", wert: "alles erledigt" },
        { label: "Berufsschultage eintragen", wert: "fällig 4. September" },
        { label: "Unterweisung Leitern", wert: "bestätigt am Handy" },
        { label: "Überfällig", wert: "Berichtsheft erklären", hervor: true },
      ],
      fuss: { icon: "check", text: "Lena hat die Unterweisung am Handy bestätigt. Der Schritt ist von selbst abgehakt." },
    },
    schritte: [
      {
        titel: "Mitarbeiter anlegen",
        text: "Name, Rolle, Eintrittsdatum. Mehr braucht Macher nicht, um den Plan zu erstellen.",
      },
      {
        titel: "Plan steht sofort",
        text: "Alle Schritte für die Rolle mit Fälligkeit ab dem ersten Arbeitstag – inklusive Unterweisungen.",
      },
      {
        titel: "Abhaken",
        text: "Du oder der neue Mitarbeiter hakt erledigte Schritte ab. Eigene Schritte ergänzt das Büro mit einer Zeile.",
      },
      {
        titel: "Abschluss",
        text: "Ist alles erledigt, ist die Einarbeitung abgeschlossen. Der Plan bleibt in der Liste unter „Abgeschlossen“.",
      },
    ],
    automatisch: [
      "erstellt den Einarbeitungsplan beim Anlegen eines Mitarbeiters",
      "richtet den Plan nach der Rolle: Monteur, Azubi oder Büro",
      "nimmt die Pflicht-Unterweisungen der Rolle mit auf",
      "hakt Unterweisungen ab, sobald sie am Handy bestätigt sind",
      "meldet dir überfällige Schritte",
      "rechnet alle Fristen ab dem Eintrittsdatum",
    ],
    geraete: {
      handy: [
        "Neuer Mitarbeiter sieht und hakt seine Schritte selbst ab",
        "Unterweisungen direkt am Handy bestätigen",
        "Fällige Schritte mit Datum sehen",
      ],
      computer: [
        "Alle laufenden Einarbeitungen mit Fortschritt",
        "Überfällige Schritte auf einen Blick",
        "Einarbeitung auch für Mitarbeiter starten, die schon da sind",
      ],
      handyVisual: {
        kopf: "Meine Einarbeitung",
        titel: "Erste Woche",
        sub: "Lena Hoffmann · Azubi",
        tags: [
          { text: "9 von 15", ton: "sky" },
          { text: "1 überfällig", ton: "signal" },
        ],
        felder: [
          { label: "Heute", wert: "Erste Einsätze mit Kollegen" },
          { label: "Fällig Do", wert: "Berufsschultage eintragen" },
          { label: "Ausbilder", wert: "Thomas" },
        ],
        aktion: { icon: "check", text: "Schritt erledigt" },
      },
    },
    gewerke: [
      { slug: "elektriker", text: "Unterweisungen für Arbeiten an elektrischen Anlagen gehören vor den ersten Einsatz – sie stehen gleich im Plan." },
      { slug: "shk", text: "Monteure bekommen Werkzeugkoffer, Fahrzeug und Führerscheinkontrolle als eigene Schritte." },
      { slug: "bau", text: "Schutzausrüstung, erste Einsätze mit einem erfahrenen Kollegen – nichts bleibt dem Zufall überlassen." },
    ],
    kunde: {
      slug: "malerei-koch",
      text: "Wie ein Malerbetrieb Azubis und neue Gesellen nach einem festen Plan einarbeitet – statt „mach einfach mit“.",
    },
    faq: [
      {
        frage: "Was steht im Einarbeitungsplan?",
        antwort:
          "Unterlagen wie Vertrag und Steuer-ID, Ausstattung wie Arbeitskleidung und Werkzeug, Zugänge, Praxis auf der Baustelle, die Pflicht-Unterweisungen der Rolle und zwei Gespräche: nach den ersten Wochen und vor Ende der Probezeit.",
      },
      {
        frage: "Kann ich den Plan anpassen?",
        antwort:
          "Ja. Du ergänzt eigene Schritte direkt am Plan. Die Grundschritte je Rolle gibt Handwerk OS vor, damit nichts Wichtiges fehlt.",
      },
      {
        frage: "Gibt es einen Plan für Azubis?",
        antwort:
          "Ja. Azubis bekommen zusätzlich Schritte wie Ausbilder vorstellen, Berufsschultage eintragen und Berichtsheft erklären.",
      },
      {
        frage: "Ich habe schon Mitarbeiter. Geht das auch nachträglich?",
        antwort:
          "Ja. Du startest die Einarbeitung für jeden Mitarbeiter, der noch keinen Plan hat. Bereits Erledigtes hakst du einfach ab.",
      },
    ],
    verwandt: ["unterweisungen", "mitarbeiter", "bewerber"],
  },

  /* ───────────────────────── Bewerber ───────────────────────── */

  bewerber: {
    icon: "user",
    kurz: "Bewerbungen in Sekunden erfassen, mit Vorlagen antworten und bei Zusage direkt einstellen.",
    enthalten: ["Bewerbungen erfassen", "Antwortvorlagen", "Zusage & einstellen"],
    meta: {
      title: "Bewerber verwalten im Handwerk – schnell antworten, gute Leute halten",
      description:
        "Bewerbungen per Anruf, Mail oder WhatsApp in einer Liste. Handwerk OS meldet, wer zu lange wartet, hilft mit fertigen Antworten und legt bei Zusage den Mitarbeiter an.",
    },
    hero: {
      titel: "Gute Leute warten nicht. Du auch nicht mehr.",
      problem:
        "Bewerbungen kommen per Anruf, Mail und WhatsApp. Im Alltag bleiben sie eine Woche liegen – und der Bewerber ist beim nächsten Betrieb.",
      loesung:
        "Handwerk OS sammelt alle Bewerbungen in einer Liste, meldet sich, wenn jemand zu lange wartet, und gibt dir fertige Antworten für jeden Schritt.",
    },
    visual: {
      bereich: "Betrieb",
      titel: "Bewerber",
      untertitel: "3 offen",
      kennzahlen: [
        ["3", "offen"],
        ["1", "wartet auf Antwort"],
        ["1", "Probearbeiten"],
      ],
      liste: {
        ueberschrift: "Bewerbungen",
        zeilen: [
          { titel: "Kevin Brandt · Monteur / Geselle", sub: "Jobportal · seit 5 Tagen", tag: "Antwort fehlt", ton: "signal" },
          { titel: "Laura Meier · Azubi", sub: "Aushang am Fahrzeug · Gespräch Do 10 Uhr", tag: "Gespräch", ton: "sky" },
          { titel: "Tobias Schäfer · Monteur / Geselle", sub: "Empfehlung von Jonas", tag: "Probearbeiten", ton: "moss" },
        ],
      },
      hinweis: {
        icon: "bell",
        ton: "signal",
        titel: "Braucht dich:",
        text: "Kevin Brandt wartet seit 5 Tagen. Antwort mit Vorlage dauert eine Minute.",
      },
    },
    problemTitel: "Bewerber gibt es. Nur nicht lange.",
    probleme: [
      {
        titel: "Eine Woche ohne Antwort",
        text: "Die Bewerbung kam am Montag. Am Freitag fällt sie dir wieder ein. Der Geselle hat inzwischen woanders zugesagt.",
      },
      {
        titel: "Überall verteilt",
        text: "Einer ruft an, einer schreibt per WhatsApp, einer spricht dich auf der Baustelle an. Eine Liste gibt es nicht.",
      },
      {
        titel: "Antworten kostet Überwindung",
        text: "Was schreibt man in eine Einladung? Und wie sagt man freundlich ab? Also bleibt die Mail liegen.",
      },
      {
        titel: "Bei Zusage alles neu tippen",
        text: "Name, Telefon, Mail: alles schon einmal aufgeschrieben. Für den neuen Mitarbeiter tippst du es noch einmal ab.",
      },
    ],
    loesung: {
      titel: "Eine Liste für alle Bewerbungen – mit klarem nächsten Schritt.",
      text: "Du erfasst eine Bewerbung mit Name, einem Kontaktweg und der Stelle. Jede Bewerbung hat einen Stand: neu, Gespräch, Probearbeiten, Zusage oder Absage. Für jeden Schritt gibt es eine fertige Antwort, die du per Mail schickst oder für WhatsApp kopierst.",
      punkte: [
        "Bewerbung in Sekunden erfassen – auch nur mit Telefonnummer",
        "Antwortvorlagen für Eingang, Gespräch, Probearbeiten, Zusage und Absage",
        "Gesprächstermin direkt in den Kalender eintragen",
        "Bei Zusage: Mitarbeiter anlegen, ohne etwas neu zu tippen",
      ],
    },
    detail: {
      kopf: "Bewerbung · Jobportal",
      titel: "Kevin Brandt",
      sub: "Monteur / Geselle · eingegangen vor 5 Tagen",
      status: { text: "neu", ton: "signal" },
      zeilen: [
        { label: "Telefon", wert: "0176 …" },
        { label: "Notiz", wert: "Geselle, sucht Betrieb in der Nähe" },
        { label: "Letzte Antwort", wert: "noch keine" },
        { label: "Gespräch", wert: "noch nicht geplant" },
        { label: "Nächster Schritt", wert: "Zum Gespräch einladen", hervor: true },
      ],
      fuss: { icon: "chat", text: "Vorlage „Zum Gespräch einladen“ öffnen – Name und Stelle sind schon eingesetzt." },
    },
    schritte: [
      {
        titel: "Bewerbung erfassen",
        text: "Name, Telefon oder Mail, Stelle. Woher die Bewerbung kommt, wählst du mit einem Tipp.",
      },
      {
        titel: "Antworten",
        text: "Vorlage wählen, im Mailprogramm öffnen oder Text kopieren. Den passenden Stand schlägt Macher gleich vor.",
      },
      {
        titel: "Kennenlernen",
        text: "Gespräch oder Probearbeiten in den Kalender eintragen. Notizen zum Eindruck bleiben bei der Bewerbung.",
      },
      {
        titel: "Zusage & einstellen",
        text: "Ein Klick legt den Mitarbeiter an. Der Einarbeitungsplan entsteht automatisch.",
      },
    ],
    automatisch: [
      "meldet dem Chef jede neue Bewerbung",
      "erinnert, wenn eine Bewerbung länger als drei Tage unbeantwortet ist",
      "setzt Name, Stelle und Betrieb in die Antwortvorlagen ein",
      "schlägt nach jeder Antwort den nächsten Stand vor",
      "übernimmt bei Zusage die Daten in den neuen Mitarbeiter",
      "erstellt danach den Einarbeitungsplan",
    ],
    geraete: {
      handy: [
        "Bewerbung auf der Baustelle erfassen",
        "Bewerber direkt anrufen",
        "Antwort kopieren und per WhatsApp schicken",
      ],
      computer: [
        "Alle Bewerbungen mit Stand, Unbeantwortete zuerst",
        "Antworten per Mail mit Vorlage",
        "Gespräche und Probearbeiten im Kalender",
      ],
      handyVisual: {
        kopf: "Bewerbung · Aushang",
        titel: "Laura Meier",
        sub: "Azubi · seit 9 Tagen",
        tags: [{ text: "Gespräch", ton: "sky" }],
        felder: [
          { label: "Gespräch", wert: "Do, 10:00 Uhr" },
          { label: "Telefon", wert: "0157 …" },
          { label: "Notiz", wert: "Praktikum im Sommer gemacht" },
        ],
        aktion: { icon: "phone", text: "Anrufen" },
      },
    },
    gewerke: [
      { slug: "shk", text: "Monteure sind gefragt. Wer zuerst antwortet, hat die besseren Chancen." },
      { slug: "elektriker", text: "Azubi-Bewerbungen kommen oft gebündelt – alle mit Stand in einer Liste." },
      { slug: "dachdecker", text: "Probearbeiten auf dem Dach planen und den Termin gleich im Kalender haben." },
    ],
    kunde: {
      slug: "elektro-brandt",
      text: "Wie ein Elektrobetrieb jede Bewerbung innerhalb weniger Tage beantwortet – auch in der Hochsaison.",
    },
    faq: [
      {
        frage: "Wer sieht die Bewerbungen?",
        antwort: "Nur Chef und Büro. Monteure und Azubis sehen keine Bewerbungen.",
      },
      {
        frage: "Was ist, wenn ich nur eine Telefonnummer habe?",
        antwort:
          "Reicht völlig. Name, ein Kontaktweg und die Stelle genügen. Die Antwortvorlagen kannst du kopieren und per WhatsApp oder SMS schicken.",
      },
      {
        frage: "Werden die Antworten automatisch verschickt?",
        antwort:
          "Nein. Macher bereitet die Antwort vor, du schickst sie selbst ab. So bleibt jede Nachricht in deiner Hand.",
      },
      {
        frage: "Was passiert mit Bewerberdaten nach einer Absage?",
        antwort:
          "Du löschst die Bewerbung mit einem Klick. Sie kommt erst in den Papierkorb und lässt sich zurückholen. Macher erinnert dich daran, Bewerberdaten nicht länger als nötig aufzubewahren.",
      },
    ],
    verwandt: ["einarbeitung", "mitarbeiter", "kalender"],
  },

  /* ───────────────────────── Subunternehmer ───────────────────────── */

  subunternehmer: {
    icon: "users",
    kurz: "Fremdfirmen mit Nachweisen, Einsätzen und Kosten – und eine Warnung, bevor die Freistellung abläuft.",
    enthalten: ["Freistellung & Nachweise", "Einsätze am Auftrag", "Kosten im Blick"],
    meta: {
      title: "Subunternehmer verwalten – Freistellungsbescheinigung, Einsätze, Kosten",
      description:
        "Subunternehmer mit Freistellungsbescheinigung nach § 48b, Unbedenklichkeitsbescheinigungen und Ablaufdatum. Einsätze und Kosten am Auftrag. Handwerk OS warnt, bevor ein Nachweis abläuft.",
    },
    hero: {
      titel: "Die Freistellung läuft ab? Du weißt es vorher.",
      problem:
        "Nachweise der Fremdfirmen liegen im Ordner. Dass die Freistellungsbescheinigung abgelaufen ist, merkt keiner – bis die Rechnung bezahlt ist.",
      loesung:
        "Handwerk OS hält Nachweise mit Ablaufdatum bei jeder Firma, zeigt Einsätze und Kosten am Auftrag und warnt rechtzeitig vor dem Ablauf.",
    },
    visual: {
      bereich: "Betrieb",
      titel: "Subunternehmer",
      untertitel: "4 Firmen",
      kennzahlen: [
        ["4", "Firmen aktiv"],
        ["3", "Einsätze offen"],
        ["1", "Nachweis prüfen"],
      ],
      liste: {
        ueberschrift: "Firmen",
        zeilen: [
          { titel: "Trockenbau Özdemir", sub: "Trockenbau · Freistellung bis 14. Oktober", tag: "läuft ab", ton: "signal" },
          { titel: "Gerüstbau Krause GmbH", sub: "Gerüstbau · 1 Einsatz läuft", tag: "in Ordnung", ton: "moss" },
          { titel: "Estrich Nord", sub: "Estrich · Einsatz ab 20. Oktober", tag: "in Ordnung", ton: "moss" },
        ],
      },
      hinweis: {
        icon: "achtung",
        ton: "signal",
        titel: "Braucht dich:",
        text: "Freistellungsbescheinigung von Trockenbau Özdemir läuft in 12 Tagen ab. Fordere rechtzeitig eine neue an.",
      },
    },
    problemTitel: "Fremdfirmen helfen. Der Papierkram bleibt bei dir.",
    probleme: [
      {
        titel: "Nachweis abgelaufen, Rechnung bezahlt",
        text: "Die Freistellungsbescheinigung war seit drei Wochen ungültig. Jetzt hättest du einen Teil einbehalten müssen.",
      },
      {
        titel: "Wer ist auf welcher Baustelle?",
        text: "Der Gerüstbauer kommt Dienstag – oder Mittwoch? Das weiß nur der Chef, und der ist nicht erreichbar.",
      },
      {
        titel: "Kosten nicht im Blick",
        text: "Die Fremdfirma war teurer als gedacht. Ob sich der Auftrag noch rechnet, siehst du erst bei der Schlussrechnung.",
      },
      {
        titel: "Kontakt nur im Chef-Handy",
        text: "Der Monteur braucht den Ansprechpartner vom Trockenbauer. Die Nummer hat nur einer.",
      },
    ],
    loesung: {
      titel: "Jede Fremdfirma mit Nachweisen, Einsätzen und Kosten.",
      text: "Du legst die Firma einmal an – mit Gewerk, Ansprechpartner und Stundensatz. Nachweise trägst du mit Ablaufdatum ein und hängst Foto oder PDF dran. Einsätze planst du direkt am Auftrag: Zeitraum, Leistung, vereinbarte Kosten.",
      punkte: [
        "Freistellung § 48b, Unbedenklichkeit Finanzamt, Krankenkasse, BG und Haftpflicht",
        "Ablaufdatum und Scan bei jedem Nachweis",
        "Einsätze mit Zeitraum, Leistung, Kosten und Stand am Auftrag",
        "Eingangsrechnungen der Firma auf einen Blick",
      ],
    },
    detail: {
      kopf: "Subunternehmer · Trockenbau",
      titel: "Trockenbau Özdemir",
      sub: "Kemal Özdemir · 0176 …",
      status: { text: "Nachweis läuft ab", ton: "signal" },
      zeilen: [
        { label: "Freistellung § 48b", wert: "gültig bis 14. Oktober", hervor: true },
        { label: "Stundensatz", wert: "52,00 € netto" },
        { label: "Einsatz", wert: "Vorwandinstallation beplanken · 10.–12. Oktober" },
        { label: "Kosten offene Einsätze", wert: "960,00 € netto" },
        { label: "Eingangsrechnungen", wert: "2 · 3.480,00 € netto" },
      ],
      fuss: { icon: "file", text: "Scan der Freistellungsbescheinigung liegt als PDF bei der Firma." },
    },
    schritte: [
      {
        titel: "Firma anlegen",
        text: "Name, Gewerk, Ansprechpartner, Stundensatz. Die Firma ist gleichzeitig Lieferant – Rechnungen hängen automatisch dran.",
      },
      {
        titel: "Nachweise eintragen",
        text: "Art wählen, gültig bis eintragen, Foto oder PDF anhängen. Fertig.",
      },
      {
        titel: "Einsatz am Auftrag",
        text: "Zeitraum, Leistung und vereinbarte Kosten. Der Auftrag zeigt alle Fremdfirmen und ihre Kosten.",
      },
      {
        titel: "Rechtzeitig nachfordern",
        text: "Läuft ein Nachweis ab, meldet sich Macher – 30 Tage vorher und noch einmal, wenn ein Einsatz offen ist.",
      },
    ],
    automatisch: [
      "warnt 30 Tage, bevor ein Nachweis abläuft",
      "meldet sofort, wenn bei einem offenen Einsatz die Freistellung fehlt oder abgelaufen ist",
      "zeigt bei jeder Firma, ob die Nachweise in Ordnung sind",
      "nimmt immer den Nachweis mit dem spätesten Ablaufdatum",
      "rechnet die Kosten offener Einsätze je Firma und je Auftrag zusammen",
      "zeigt die Eingangsrechnungen der Firma direkt bei ihr",
    ],
    geraete: {
      handy: [
        "Ansprechpartner der Fremdfirma anrufen",
        "Nachweis mit der Kamera abfotografieren",
        "Fremdfirmen am Auftrag mit Zeitraum sehen",
      ],
      computer: [
        "Alle Firmen mit Stand der Nachweise",
        "Filter „Nachweise prüfen“",
        "Kosten der Fremdfirmen je Auftrag",
      ],
      handyVisual: {
        kopf: "Auftrag · Umbau Praxis Dr. Lenz",
        titel: "Subunternehmer",
        sub: "2 Firmen an diesem Auftrag",
        tags: [
          { text: "1 läuft", ton: "sky" },
          { text: "1 geplant", ton: "moss" },
        ],
        felder: [
          { label: "Gerüstbau Krause", wert: "läuft bis 22. Oktober" },
          { label: "Trockenbau Özdemir", wert: "ab 10. Oktober" },
          { label: "Kosten", wert: "2.810,00 € netto" },
        ],
        aktion: { icon: "plus", text: "Einsatz hinzufügen" },
      },
    },
    gewerke: [
      { slug: "bau", text: "Gerüst, Estrich, Trockenbau: Viele Fremdfirmen an einem Bau – alle Nachweise an einem Ort." },
      { slug: "shk", text: "Bei großen Badsanierungen kommen Fliesenleger und Trockenbauer dazu. Die Kosten stehen am Auftrag." },
      { slug: "dachdecker", text: "Der Gerüstbauer ist fast immer dabei. Seine Freistellung hast du im Blick." },
    ],
    kunde: {
      slug: "haustechnik-yilmaz",
      text: "Wie ein SHK-Betrieb Fremdfirmen für Großprojekte einbindet – mit gültigen Nachweisen und klaren Kosten.",
    },
    werkzeug: "deckungsbeitrags-rechner",
    faq: [
      {
        frage: "Prüft Macher die Freistellungsbescheinigung beim Finanzamt?",
        antwort:
          "Nein. Du trägst den Nachweis mit Ablaufdatum ein. Macher erinnert dich, bevor er abläuft, und warnt, wenn bei einem offenen Einsatz keiner gilt.",
      },
      {
        frage: "Muss ich die Firma doppelt anlegen – als Lieferant und als Subunternehmer?",
        antwort:
          "Nein. Die Firma gibt es nur einmal. Eingangsrechnungen der Firma siehst du direkt bei ihr.",
      },
      {
        frage: "Sehen meine Monteure die Kosten der Fremdfirmen?",
        antwort:
          "Nur wenn sie Geldbeträge sehen dürfen. Das legst du über Rollen und Rechte fest.",
      },
      {
        frage: "Was passiert mit Firmen, mit denen wir nicht mehr arbeiten?",
        antwort:
          "Du setzt sie auf inaktiv. Dann tauchen sie nicht mehr in der Auswahl auf, und es kommen keine Hinweise mehr. Einsätze und Rechnungen bleiben erhalten.",
      },
    ],
    verwandt: ["belege", "auftraege", "nachkalkulation"],
  },

  /* ───────────────────────── Materialbedarf ───────────────────────── */

  materialbedarf: {
    icon: "cart",
    kurz: "Macher rechnet aus, welches Material für die nächsten Aufträge fehlt – und legt die Bestellung je Lieferant an.",
    enthalten: ["Fehlmengen je Auftrag", "Mindestbestand", "Bestellvorschlag je Lieferant"],
    meta: {
      title: "Materialbedarf im Handwerk – wissen, was für die nächsten Aufträge fehlt",
      description:
        "Handwerk OS vergleicht das geplante Material aller anstehenden Aufträge mit Lager und offenen Bestellungen. Was fehlt, landet mit einem Klick als Bestellentwurf beim richtigen Lieferanten.",
    },
    hero: {
      titel: "Material fehlt? Du weißt es, bevor der Monteur losfährt.",
      problem:
        "Für jeden Auftrag wird das Material einzeln zusammengesucht. Was im Lager liegt und was schon bestellt ist, weiß keiner genau.",
      loesung:
        "Handwerk OS prüft jeden Tag, was für die anstehenden Aufträge fehlt – abzüglich Lager und offener Bestellungen – und schlägt die Bestellung vor.",
    },
    visual: {
      bereich: "Betrieb",
      titel: "Bedarf",
      untertitel: "geprüft heute 06:00",
      kennzahlen: [
        ["5", "Artikel fehlen"],
        ["3", "Aufträge betroffen"],
        ["2", "unter Mindestbestand"],
      ],
      liste: {
        ueberschrift: "Elektrogroßhandel Nord",
        zeilen: [
          { titel: "NYM-J 3×1,5 – 150 m", sub: "Neubau Fam. Sommer · ab Mo", tag: "fehlt", ton: "signal" },
          { titel: "Unterverteiler 3-reihig – 1 Stück", sub: "Praxis Dr. Lenz · ab Mi", tag: "fehlt", ton: "signal" },
          { titel: "Abzweigdosen – 40 Stück", sub: "Lager · Mindestbestand 50", tag: "auffüllen", ton: "sky" },
        ],
      },
      hinweis: {
        icon: "cart",
        ton: "moss",
        titel: "Vorschlag:",
        text: "Ein Klick legt 2 Bestellentwürfe an – je einen pro Lieferant.",
      },
    },
    problemTitel: "Material fehlt immer genau dann, wenn es gebraucht wird.",
    probleme: [
      {
        titel: "Der Umweg zum Großhandel",
        text: "Um halb acht merkt der Monteur, dass der Unterverteiler fehlt. Eine Stunde Fahrt, bevor die Arbeit anfängt.",
      },
      {
        titel: "Doppelt bestellt",
        text: "Das Kabel war schon bestellt. Das Büro wusste es nicht und hat noch einmal bestellt.",
      },
      {
        titel: "Lager vergessen",
        text: "Im Regal liegen noch 200 Meter. Trotzdem wird neu bestellt – oder das Material ist schon für einen anderen Auftrag beiseitegelegt.",
      },
      {
        titel: "Jeden Tag die gleiche Suche",
        text: "Aufträge durchgehen, Lager prüfen, Bestellungen vergleichen. Jeden Morgen eine Viertelstunde, die keiner hat.",
      },
    ],
    loesung: {
      titel: "Eine Liste: Was fehlt, für wen, ab wann.",
      text: "Macher nimmt das geplante Material aller anstehenden Aufträge und zieht ab, was im Lager liegt und was schon bestellt ist. Bereits beiseitegelegtes Material wird nicht doppelt gezählt. Übrig bleibt die Fehlmenge – sortiert nach dem frühesten Termin und gruppiert nach Lieferant.",
      punkte: [
        "Fehlmenge je Artikel mit betroffenen Aufträgen",
        "Lager, beiseitegelegtes Material und offene Bestellungen sind abgezogen",
        "Freitext-Material und Mindestbestand sind mit drin",
        "Ein Klick: Bestellentwurf je Lieferant – bestehende Entwürfe werden ergänzt",
      ],
    },
    detail: {
      kopf: "Bedarf · Artikel",
      titel: "NYM-J 3×1,5",
      sub: "Elektrogroßhandel Nord",
      status: { text: "fehlt", ton: "signal" },
      zeilen: [
        { label: "Gebraucht", wert: "350 m für 2 Aufträge" },
        { label: "Im Lager frei", wert: "150 m" },
        { label: "Bestellt", wert: "50 m (Rest einer Teillieferung)" },
        { label: "Frühester Termin", wert: "Montag, Neubau Fam. Sommer" },
        { label: "Fehlt", wert: "150 m", hervor: true },
      ],
      fuss: { icon: "spark", text: "Macher hat den Bedarf neu berechnet, nachdem der Termin bei Fam. Sommer vorgezogen wurde." },
    },
    schritte: [
      {
        titel: "Material am Auftrag planen",
        text: "Wie gewohnt: Material aus Angebot oder Kalkulation steht am Auftrag. Sonderteile gehen auch als Freitext.",
      },
      {
        titel: "Macher rechnet",
        text: "Jeden Tag und bei jeder Änderung: geplantes Material minus Lager minus offene Bestellungen.",
      },
      {
        titel: "Vorschlag prüfen",
        text: "Du siehst, was fehlt, für welchen Auftrag und ab wann. Ein Klick legt die Bestellentwürfe an.",
      },
      {
        titel: "Bestellen",
        text: "Du prüfst den Entwurf und schickst ihn ab. Bestellt ist erst, was du freigibst.",
      },
    ],
    automatisch: [
      "prüft jeden Tag den Materialbedarf aller anstehenden Aufträge",
      "rechnet neu, sobald sich Material, Termine oder Bestellungen ändern",
      "zieht Lagerbestand, beiseitegelegtes Material und offene Bestellungen ab",
      "berücksichtigt Restmengen aus Teillieferungen",
      "bündelt den Bestellvorschlag je Lieferant und ergänzt bestehende Entwürfe",
      "schließt den Hinweis von selbst, sobald alles abgedeckt ist",
    ],
    geraete: {
      handy: [
        "Sehen, ob das Material für morgen da ist",
        "Hinweis „Material fehlt“ mit Bestellvorschlag",
        "Betroffene Aufträge direkt öffnen",
      ],
      computer: [
        "Fehlmengen je Lieferant, frühester Termin zuerst",
        "Bestellentwürfe mit einem Klick",
        "Mindestbestand im Lager im Blick",
      ],
      handyVisual: {
        kopf: "Braucht dich",
        titel: "Material fehlt: 3 Artikel",
        sub: "für anstehende Aufträge",
        tags: [
          { text: "ab Montag", ton: "signal" },
          { text: "2 Lieferanten", ton: "sky" },
        ],
        felder: [
          { label: "NYM-J 3×1,5", wert: "150 m" },
          { label: "Unterverteiler 3-reihig", wert: "1 Stück" },
          { label: "Abzweigdosen", wert: "40 Stück" },
        ],
        aktion: { icon: "cart", text: "Bestellvorschlag erstellen" },
      },
    },
    gewerke: [
      { slug: "elektriker", text: "Kabel, Verteiler, Schalter: Was für die Woche fehlt, steht vor dem ersten Einsatz fest." },
      { slug: "shk", text: "Heizkörper, Rohre, Formteile – lange Lieferzeiten fallen früh genug auf." },
      { slug: "fliesenleger", text: "Fliesen, Kleber, Fugenmasse für mehrere Bäder auf einen Blick – gebündelt beim Händler." },
    ],
    kunde: {
      slug: "elektro-brandt",
      text: "Wie ein Elektrobetrieb Material für die ganze Woche gebündelt bestellt – statt täglich zum Großhandel zu fahren.",
    },
    faq: [
      {
        frage: "Bestellt Macher selbst beim Lieferanten?",
        antwort:
          "Nein. Macher legt Bestellentwürfe an. Bestellt ist erst, was du prüfst und abschickst.",
      },
      {
        frage: "Zählen auch Angebote, die noch nicht zugesagt sind?",
        antwort:
          "Nein. Mit drin sind Aufträge, die beauftragt, in Arbeit oder in der Abnahme sind oder einen Termin haben. So bläht kein offenes Angebot den Bedarf auf.",
      },
      {
        frage: "Was ist mit Material ohne Artikelnummer?",
        antwort:
          "Freitext-Material wie Sonderteile steht ebenfalls im Bedarf. Es landet im Entwurf ohne festen Lieferanten, den wählst du dann aus.",
      },
      {
        frage: "Wie kommt der richtige Lieferant in die Bestellung?",
        antwort:
          "Hinterlege beim Artikel einen Lieferanten. Dann bündelt Macher alles, was du bei ihm brauchst, in einer Bestellung.",
      },
    ],
    verwandt: ["material", "einkauf", "lager"],
  },

  /* ───────────────────────── Eingangsrechnungen & Belege ───────────────────────── */

  belege: {
    icon: "file",
    kurz: "Quittungen und Lieferantenrechnungen fotografieren, dem Auftrag zuordnen und Skonto nicht mehr verpassen.",
    enthalten: ["Beleg fotografieren", "Zuordnung zum Auftrag", "Skonto & Zahlungsziel"],
    meta: {
      title: "Eingangsrechnungen & Belege im Handwerk – fotografieren, zuordnen, Skonto sichern",
      description:
        "Quittung mit dem Handy fotografieren, Lieferant und Betrag eintragen, fertig. Handwerk OS ordnet Belege dem Auftrag zu, trägt Skonto und Zahlungsziel ein und erinnert rechtzeitig.",
    },
    hero: {
      titel: "Die Quittung ist im Kasten. Nicht im Handschuhfach.",
      problem:
        "Quittungen verschwinden im Fahrzeug. Lieferantenrechnungen liegen im Stapel, Skonto verfällt, und am Monatsende sucht das Büro alles zusammen.",
      loesung:
        "Handwerk OS nimmt den Beleg per Foto auf, ordnet ihn dem richtigen Auftrag zu und erinnert dich an Skonto und Zahlungsziel.",
    },
    visual: {
      bereich: "Betrieb",
      titel: "Eingangsrechnungen & Belege",
      untertitel: "Oktober",
      kennzahlen: [
        ["4", "zu prüfen"],
        ["2", "Skonto möglich"],
        ["1", "fällig"],
      ],
      liste: {
        ueberschrift: "Belege",
        zeilen: [
          { titel: "Holzhandel Berger · 1.842,60 €", sub: "Eingangsrechnung · Skonto bis Fr", tag: "Skonto sichern", ton: "signal" },
          { titel: "Baumarkt · 37,90 €", sub: "Quittung · Küche Familie Roth", tag: "zugeordnet", ton: "moss" },
          { titel: "Tankstelle · 92,14 €", sub: "Tankbeleg · heute", tag: "neu", ton: "sky" },
        ],
      },
      hinweis: {
        icon: "euro",
        ton: "signal",
        titel: "Skonto sichern:",
        text: "Holzhandel Berger – 55,28 € sparen, wenn du bis Freitag zahlst.",
      },
    },
    problemTitel: "Belege gibt es jeden Tag. Ordnung selten.",
    probleme: [
      {
        titel: "Die Quittung im Handschuhfach",
        text: "Schrauben, Silikon, ein Sack Kleber: schnell im Baumarkt gekauft. Die Quittung taucht drei Wochen später zerknittert wieder auf.",
      },
      {
        titel: "Skonto verpasst",
        text: "3 % Skonto bei Zahlung in 10 Tagen. Die Rechnung lag im Stapel – am elften Tag wird der volle Betrag fällig.",
      },
      {
        titel: "Welcher Auftrag war das?",
        text: "Gleicher Händler, fünf Baustellen. Wer den Beleg nicht zuordnet, rechnet bei der Nachkalkulation falsch.",
      },
      {
        titel: "Monatsende im Schuhkarton",
        text: "Der Steuerberater will die Belege. Das Büro sucht einen Nachmittag lang zusammen, was im Monat angefallen ist.",
      },
    ],
    loesung: {
      titel: "Foto, drei Angaben, fertig.",
      text: "Der Monteur fotografiert den Beleg direkt an der Kasse. Lieferant, Datum und Bruttobetrag reichen – Netto und Umsatzsteuer rechnet Macher. Das Büro prüft, ordnet zu, und Macher erinnert an Skonto und Zahlungsziel.",
      punkte: [
        "Beleg fotografieren oder PDF hochladen – das Foto wird verkleinert",
        "Lieferant, Datum, Brutto und Steuersatz – Netto und USt rechnet Macher",
        "Vorschlag für den passenden Auftrag mit Begründung",
        "Stand neu, geprüft, bezahlt – mit Skonto- und Zahlungsfrist",
      ],
    },
    detail: {
      kopf: "Beleg · Eingangsrechnung",
      titel: "Holzhandel Berger",
      sub: "Rechnung 2026-4471 · 3. Oktober",
      status: { text: "geprüft", ton: "sky" },
      zeilen: [
        { label: "Brutto", wert: "1.842,60 €" },
        { label: "Auftrag", wert: "Küche Familie Roth" },
        { label: "Warum dieser Auftrag?", wert: "Material vom selben Lieferanten · Einsatz am selben Tag" },
        { label: "Zahlen bis", wert: "2. November" },
        { label: "Skonto 3 % bis", wert: "Freitag, 13. Oktober", hervor: true },
      ],
      fuss: { icon: "spark", text: "Macher hat Skonto und Zahlungsziel aus den Konditionen des Lieferanten eingetragen." },
    },
    schritte: [
      {
        titel: "Fotografieren",
        text: "„Beleg fotografieren“ antippen, Foto machen, Lieferant und Betrag eintragen. Dauert Sekunden.",
      },
      {
        titel: "Zuordnen",
        text: "Passt der Beleg eindeutig zu einem Auftrag, ordnet Macher ihn zu. Sonst siehst du Vorschläge mit Begründung.",
      },
      {
        titel: "Prüfen",
        text: "Das Büro prüft Betrag, Kategorie und Fristen. Skonto und Zahlungsziel stehen schon drin.",
      },
      {
        titel: "Bezahlen",
        text: "Vor Ablauf von Skonto oder Zahlungsziel meldet sich Macher. Bezahlt? Ein Klick.",
      },
    ],
    automatisch: [
      "ordnet eindeutige Belege dem passenden Auftrag zu – du kannst es rückgängig machen",
      "trägt Skonto und Zahlungsziel aus den Konditionen des Lieferanten ein",
      "rechnet Netto und Umsatzsteuer aus dem Bruttobetrag",
      "erinnert drei Tage vor Ablauf von Skonto oder Zahlungsziel",
      "meldet Belege, die seit über einer Woche ungeprüft liegen",
      "verkleinert Fotos, damit der Speicher nicht vollläuft",
    ],
    geraete: {
      handy: [
        "Beleg direkt an der Kasse fotografieren",
        "Auftrag vorgeschlagen bekommen",
        "Tankbeleg in Sekunden erfassen",
      ],
      computer: [
        "Alle Belege mit Stand und Fristen",
        "Belege am Auftrag für die Nachkalkulation",
        "Geprüfte Belege für den DATEV-Export",
      ],
      handyVisual: {
        kopf: "Beleg fotografieren",
        titel: "Baumarkt",
        sub: "Quittung · heute 14:12",
        tags: [{ text: "Foto gespeichert", ton: "moss" }],
        felder: [
          { label: "Brutto", wert: "37,90 € · 19 %" },
          { label: "Kategorie", wert: "Material" },
          { label: "Auftrag", wert: "Küche Familie Roth" },
        ],
        aktion: { icon: "check", text: "Beleg speichern" },
      },
    },
    gewerke: [
      { slug: "tischler", text: "Holz, Beschläge, Platten: Jede Lieferantenrechnung landet beim richtigen Möbelauftrag." },
      { slug: "maler", text: "Farbe und Abdeckmaterial im Baumarkt gekauft? Die Quittung ist fotografiert, bevor sie verschwindet." },
      { slug: "galabau", text: "Pflanzen, Schotter, Tankbelege der Maschinen – alles mit Kategorie und Auftrag." },
    ],
    kunde: {
      slug: "tischlerei-weber",
      text: "Wie eine Tischlerei jeden Beleg dem Auftrag zuordnet – und die Nachkalkulation ohne Zettelsuche schafft.",
    },
    faq: [
      {
        frage: "Liest Macher Betrag und Lieferant vom Foto ab?",
        antwort:
          "Noch nicht. Du trägst Lieferant, Datum und Bruttobetrag ein. Netto, Umsatzsteuer, Fristen und den passenden Auftrag ergänzt Macher.",
      },
      {
        frage: "Woher kennt Macher Skonto und Zahlungsziel?",
        antwort:
          "Aus den Konditionen beim Lieferanten, zum Beispiel „3 % Skonto 10 Tage, 30 Tage netto“. Daraus rechnet Macher die Fristen für jeden Beleg aus.",
      },
      {
        frage: "Sehen Monteure die Einkaufspreise?",
        antwort:
          "Nur wenn sie Geldbeträge sehen dürfen. Ohne dieses Recht fotografieren sie den Beleg, sehen aber keine Summen in der Liste.",
      },
      {
        frage: "Wie kommen die Belege zum Steuerberater?",
        antwort:
          "Über den DATEV-Export. Die Eingangsbelege des Monats gehen als Buchungen mit raus und werden als exportiert markiert.",
      },
    ],
    verwandt: ["datev", "nachkalkulation", "einkauf"],
  },

  /* ───────────────────────── Maschinen & Geräte ───────────────────────── */

  maschinen: {
    icon: "bolt",
    kurz: "Größere Maschinen mit Standort, Besitzer, Zustand und Prüffrist – in einer eigenen Liste.",
    enthalten: ["Wo ist die Maschine?", "Defekt melden", "Prüfung & Verlauf"],
    meta: {
      title: "Maschinen & Geräte verwalten – Standort, Defekte, Prüffristen",
      description:
        "Kernbohrgerät, Rüttelplatte, Bautrockner: Handwerk OS zeigt, wo jede Maschine ist, wer sie hat und ob sie einsatzbereit ist. Defekte und Prüfungen werden beim Gerät festgehalten.",
    },
    hero: {
      titel: "Die Rüttelplatte ist nicht weg. Sie ist bei Jonas.",
      problem:
        "Große Maschinen wandern zwischen Baustellen, Fahrzeugen und Werkstatt. Wer sie hat und ob sie heil ist, weiß meist nur einer.",
      loesung:
        "Handwerk OS zeigt für jede Maschine, wo sie steht, wer sie hat, ob sie defekt ist und wann die nächste Prüfung fällig ist.",
    },
    visual: {
      bereich: "Betrieb",
      titel: "Maschinen & Geräte",
      untertitel: "12 Maschinen",
      kennzahlen: [
        ["7", "verfügbar"],
        ["4", "ausgegeben"],
        ["1", "defekt"],
      ],
      liste: {
        ueberschrift: "Maschinen",
        zeilen: [
          { titel: "Rüttelplatte 90 kg", sub: "M-004 · bei Jonas", tag: "Ausgegeben", ton: "sky" },
          { titel: "Kernbohrgerät 2-Gang", sub: "M-007 · Werkstatt", tag: "Defekt", ton: "signal" },
          { titel: "Bautrockner", sub: "M-011 · Baustelle Goethestraße", tag: "Ausgegeben", ton: "sky" },
        ],
      },
      hinweis: {
        icon: "achtung",
        ton: "signal",
        titel: "Defekt gemeldet:",
        text: "Kernbohrgerät – Kohlen verschlissen. Wieder einsatzbereit ab Donnerstag.",
      },
    },
    problemTitel: "Große Maschinen, kleine Übersicht.",
    probleme: [
      {
        titel: "Schon auf der anderen Baustelle",
        text: "Morgen wird der Kernbohrer gebraucht. Heute Abend stellt sich raus: Er steht 40 Kilometer entfernt im anderen Fahrzeug.",
      },
      {
        titel: "Kaputt, aber keiner sagt es",
        text: "Der Bautrockner lief zuletzt nicht mehr richtig. Gemeldet hat es keiner – bis er beim nächsten Kunden ausfällt.",
      },
      {
        titel: "Seit wann in der Reparatur?",
        text: "Die Maschine ist in der Werkstatt. Wann sie zurückkommt und was kaputt war, steht nirgends.",
      },
      {
        titel: "Seriennummer gesucht",
        text: "Der Hersteller will für die Garantie Seriennummer und Kaufdatum. Die Rechnung ist irgendwo im Ordner.",
      },
    ],
    loesung: {
      titel: "Jede Maschine mit Ort, Zustand und Verlauf.",
      text: "Du legst eine Maschine einmal an – mit Inventarnummer, Hersteller, Seriennummer, Anschaffung und Prüfart. Ausgeben geht an einen Mitarbeiter, in ein Fahrzeug oder an einen Ort. Defekte meldest du mit kurzer Beschreibung, Prüfungen trägst du direkt beim Gerät ein.",
      punkte: [
        "Standort oder Besitzer direkt in der Liste",
        "Ausgeben an Mitarbeiter, Fahrzeug oder Baustelle – und zurück ins Lager",
        "Defekt melden mit Datum, ab wann sie wieder einsatzbereit ist",
        "Prüfungen, Defekte und Ausgaben im Verlauf des Geräts",
      ],
    },
    detail: {
      kopf: "Maschine M-007",
      titel: "Kernbohrgerät 2-Gang",
      sub: "Seriennummer 7741-K · angeschafft März 2023",
      status: { text: "Defekt", ton: "signal" },
      zeilen: [
        { label: "Wo ist es?", wert: "Werkstatt" },
        { label: "Defekt seit", wert: "Montag – Kohlen verschlissen" },
        { label: "Wieder einsatzbereit", wert: "ab Donnerstag" },
        { label: "Prüfung", wert: "DGUV V3 · nächste am 15. März" },
        { label: "Nächster Schritt", wert: "Nach Reparatur freigeben", hervor: true },
      ],
      fuss: { icon: "clock", text: "Im Verlauf: ausgegeben an Ali, Defekt gemeldet, in die Werkstatt gebracht." },
    },
    schritte: [
      {
        titel: "Maschine anlegen",
        text: "Bezeichnung, Inventarnummer, Seriennummer, Prüfart und nächste Prüfung. Den Rest kannst du später ergänzen.",
      },
      {
        titel: "Ausgeben",
        text: "An einen Mitarbeiter, in ein Fahrzeug oder an eine Baustelle. Die Liste zeigt sofort, wo die Maschine ist.",
      },
      {
        titel: "Defekt melden",
        text: "Was ist kaputt, ab wann geht es wieder? Die Maschine erscheint unter „Defekt / Prüfung“.",
      },
      {
        titel: "Wieder freigeben",
        text: "Nach der Reparatur ein Klick auf „Wieder einsatzbereit“. Der Verlauf bleibt beim Gerät.",
      },
    ],
    automatisch: [
      "zeigt in der Liste, wo jede Maschine gerade ist",
      "zeigt auf der Kachel, wie viele Maschinen defekt oder ausgegeben sind",
      "hält Ausgaben, Defekte und Prüfungen im Verlauf fest",
      "erinnert 30 und 14 Tage vor der nächsten Prüfung",
      "warnt bei überfälliger Prüfung: nicht verwenden",
      "rechnet die nächste Prüffrist nach jeder Prüfung selbst aus",
    ],
    geraete: {
      handy: [
        "Sehen, wer die Maschine gerade hat",
        "Maschine an dich oder ins Fahrzeug ausgeben",
        "Defekt direkt auf der Baustelle melden",
      ],
      computer: [
        "Alle Maschinen mit Standort und Zustand",
        "Filter für defekte Maschinen und fällige Prüfungen",
        "Seriennummer, Anschaffung und Verlauf je Gerät",
      ],
      handyVisual: {
        kopf: "Maschine M-004",
        titel: "Rüttelplatte 90 kg",
        sub: "im Lager · verfügbar",
        tags: [{ text: "Verfügbar", ton: "moss" }],
        felder: [
          { label: "Nächste Prüfung", wert: "UVV · 20. Januar" },
          { label: "Zuletzt bei", wert: "Jonas" },
          { label: "Inventarnummer", wert: "M-004" },
        ],
        aktion: { icon: "check", text: "Ausgeben" },
      },
    },
    gewerke: [
      { slug: "bau", text: "Rüttelplatte, Kernbohrer, Estrichmischer: Du weißt, auf welcher Baustelle welche Maschine steht." },
      { slug: "galabau", text: "Minibagger-Anbaugeräte, Rasenmäher, Häcksler – mit Zustand und Standort." },
      { slug: "metall-maschinen", text: "Schweißgeräte und Bohrmaschinen mit Seriennummer und Prüffrist." },
    ],
    kunde: {
      slug: "gruen-werk",
      text: "Wie ein Gartenbaubetrieb seine Maschinen über alle Baustellen im Blick behält – auch in der Hochsaison.",
    },
    faq: [
      {
        frage: "Was ist der Unterschied zu Werkzeugen?",
        antwort:
          "Maschinen sind die größeren, teuren Geräte. Sie haben eine eigene Liste, funktionieren aber genauso: ausgeben, zurückgeben, Defekt melden, Prüfung eintragen.",
      },
      {
        frage: "Kann ich eine Maschine an eine Baustelle statt an eine Person ausgeben?",
        antwort:
          "Ja. Du gibst an einen Mitarbeiter, in ein Fahrzeug oder an einen Ort aus, zum Beispiel „Baustelle Goethestraße“.",
      },
      {
        frage: "Was passiert mit Maschinen, die wir verkauft haben?",
        antwort:
          "Du musterst sie aus. Dann tauchen sie nicht mehr in Listen und Prüffristen auf. Der Verlauf bleibt erhalten.",
      },
      {
        frage: "Wo landen die Prüfprotokolle?",
        antwort:
          "Beim Gerät. Du dokumentierst die Prüfung mit Ergebnis, Prüfer und Protokoll als PDF oder Foto. Die nächste Frist rechnet Macher aus.",
      },
    ],
    verwandt: ["werkzeuge", "pruefungen", "fahrzeuge"],
  },

  /* ───────────────────────── Prüfungen & Fristen ───────────────────────── */

  pruefungen: {
    icon: "shield",
    kurz: "TÜV, DGUV V3, UVV, Leiterprüfung und Kalibrierung – alle Fristen in einer Liste, mit Erinnerung.",
    enthalten: ["Prüffristen", "Prüfung dokumentieren", "Sperre bei Überfälligkeit"],
    meta: {
      title: "Prüffristen im Handwerk – DGUV V3, UVV, TÜV, Leiterprüfung im Blick",
      description:
        "Alle Prüffristen für Werkzeuge, Maschinen, Leitern und Fahrzeuge an einem Ort. Handwerk OS erinnert 30 und 14 Tage vorher, rechnet die nächste Frist aus und warnt bei Überfälligkeit.",
    },
    hero: {
      titel: "Keine Prüffrist mehr verpasst.",
      problem:
        "Prüftermine stehen auf Plaketten, in Excel und im Kalender. Läuft eine Frist ab, merkt es keiner – und das Gerät wird weiter benutzt.",
      loesung:
        "Handwerk OS sammelt alle Prüffristen in einer Liste, erinnert rechtzeitig und warnt, sobald ein Gerät nicht mehr verwendet werden darf.",
    },
    visual: {
      bereich: "Betrieb",
      titel: "Prüfungen & Wartung",
      untertitel: "DGUV V3, TÜV/HU, UVV, Leitern, Kalibrierung",
      kennzahlen: [
        ["1", "überfällig"],
        ["5", "nächste 30 Tage"],
        ["3", "ohne Frist"],
      ],
      liste: {
        ueberschrift: "Nächste 30 Tage",
        zeilen: [
          { titel: "Anlegeleiter 3-teilig", sub: "Leiterprüfung · bei Mehmet", tag: "seit 4 Tagen überfällig", ton: "signal" },
          { titel: "Installationstester", sub: "Kalibrierung · Fahrzeug KS-MO 101", tag: "in 9 Tagen", ton: "signal" },
          { titel: "VW Crafter KS-MO 102", sub: "UVV · Hof", tag: "in 26 Tagen", ton: "sky" },
        ],
      },
      hinweis: {
        icon: "achtung",
        ton: "signal",
        titel: "Nicht verwenden:",
        text: "Leiterprüfung der Anlegeleiter ist überfällig. Mehmet hat eine Nachricht bekommen.",
      },
    },
    problemTitel: "Prüfpflicht hat jeder. Den Überblick nicht.",
    probleme: [
      {
        titel: "Fristen überall verteilt",
        text: "Die Plakette am Gerät, eine Excel-Liste im Büro, der TÜV-Termin im Kalender. Einen Gesamtüberblick gibt es nicht.",
      },
      {
        titel: "Abgelaufen und trotzdem benutzt",
        text: "Die Prüfung der Leiter ist seit Wochen fällig. Sie steht trotzdem jeden Tag im Einsatz.",
      },
      {
        titel: "Zu spät erinnert",
        text: "Der Prüfer hat erst in drei Wochen Zeit. Die Frist läuft nächsten Dienstag ab.",
      },
      {
        titel: "Wo ist das Protokoll?",
        text: "Die Berufsgenossenschaft fragt nach den Prüfprotokollen. Das letzte liegt irgendwo im Ordner – vielleicht.",
      },
    ],
    loesung: {
      titel: "Alle Fristen in einer Liste, früheste zuerst.",
      text: "Für jedes Werkzeug, jede Maschine, jede Leiter und jedes Fahrzeug trägst du Prüfart und nächste Prüfung ein. Macher zeigt, was in den nächsten 30 Tagen fällig ist, was überfällig ist und wo das Gerät gerade steht. Nach der Prüfung rechnet Macher die nächste Frist selbst aus.",
      punkte: [
        "DGUV V3, TÜV/HU, UVV, Leiterprüfung, Kalibrierung und Wartung",
        "Erinnerung 30 und 14 Tage vorher",
        "Prüfung dokumentieren mit Ergebnis, Prüfer und Protokoll",
        "„Nicht bestanden“ sperrt das Gerät",
      ],
    },
    detail: {
      kopf: "Prüfung dokumentieren",
      titel: "Installationstester",
      sub: "W-014 · Fahrzeug KS-MO 101",
      status: { text: "bestanden", ton: "moss" },
      zeilen: [
        { label: "Prüfart", wert: "Kalibrierung" },
        { label: "Geprüft am", wert: "2. Oktober" },
        { label: "Prüfer", wert: "Messtechnik Meier" },
        { label: "Protokoll", wert: "PDF gespeichert" },
        { label: "Nächste Prüfung", wert: "2. Oktober nächstes Jahr", hervor: true },
      ],
      fuss: { icon: "spark", text: "Macher hat die nächste Frist nach 12 Monaten ausgerechnet und die Erinnerung gesetzt." },
    },
    schritte: [
      {
        titel: "Frist eintragen",
        text: "Beim Gerät Prüfart und nächste Prüfung wählen – das Datum steht meist auf der Plakette.",
      },
      {
        titel: "Erinnert werden",
        text: "30 und 14 Tage vorher meldet sich Macher. Genug Zeit für einen Termin beim Prüfer.",
      },
      {
        titel: "Prüfung dokumentieren",
        text: "Datum, Ergebnis, Prüfer, Protokoll als PDF oder Foto. Fertig in einer Minute.",
      },
      {
        titel: "Nächste Frist steht",
        text: "Macher rechnet die nächste Prüfung nach dem Intervall aus. Die Historie bleibt beim Gerät.",
      },
    ],
    automatisch: [
      "erinnert 30 und 14 Tage vor jeder Prüfung",
      "warnt bei überfälliger Prüfung: nicht verwenden",
      "schickt dem Mitarbeiter, der das Gerät hat, eine Nachricht",
      "rechnet die nächste Frist nach dem Intervall der Prüfart aus",
      "sperrt Geräte, die eine Prüfung nicht bestanden haben",
      "zeigt Geräte ohne hinterlegte Frist",
    ],
    geraete: {
      handy: [
        "Nachricht, wenn dein Gerät nicht mehr verwendet werden darf",
        "Prüfung mit Foto vom Protokoll eintragen",
        "Sehen, wo das Gerät zur Prüfung gerade ist",
      ],
      computer: [
        "Alle Prüffristen, früheste zuerst",
        "Filter: nächste 30 Tage, überfällig, alle",
        "Prüfhistorie und Protokolle je Gerät",
      ],
      handyVisual: {
        kopf: "Wichtig · Nachricht von Macher",
        titel: "Nicht verwenden: Anlegeleiter",
        sub: "Leiterprüfung war am 28. September fällig",
        tags: [{ text: "überfällig", ton: "signal" }],
        felder: [
          { label: "Bei", wert: "Mehmet" },
          { label: "Prüfart", wert: "Leiterprüfung" },
          { label: "Bitte", wert: "zur Prüfung bringen oder im Lager abgeben" },
        ],
        aktion: { icon: "check", text: "Prüfung eintragen" },
      },
    },
    gewerke: [
      { slug: "elektriker", text: "DGUV V3 für Elektrogeräte und Kalibrierung der Messgeräte – für Protokolle beim Kunden." },
      { slug: "dachdecker", text: "Leitern, Gerüstteile und Fahrzeuge mit UVV – jede Frist mit Erinnerung." },
      { slug: "bau", text: "Baustellengeräte haben kürzere Prüfintervalle. Du stellst das Intervall je Gerät ein." },
    ],
    kunde: {
      slug: "dach-hansen",
      text: "Wie ein Dachdeckerbetrieb Leitern, Geräte und Fahrzeuge aller Kolonnen pünktlich prüfen lässt.",
    },
    faq: [
      {
        frage: "Welche Prüfarten gibt es?",
        antwort:
          "DGUV V3, TÜV/HU, UVV, Leiterprüfung, Kalibrierung und Wartung. Jede Prüfart hat ein Standard-Intervall, das du je Gerät ändern kannst.",
      },
      {
        frage: "Was passiert, wenn ein Gerät durchfällt?",
        antwort:
          "Es wird als defekt markiert und darf nicht verwendet werden, bis es repariert und erneut geprüft ist.",
      },
      {
        frage: "Gilt das auch für Fahrzeuge?",
        antwort:
          "Ja. Fahrzeuge stehen mit TÜV/HU oder UVV in derselben Liste wie Werkzeuge und Maschinen.",
      },
      {
        frage: "Kann ich alte Prüfprotokolle nachtragen?",
        antwort:
          "Ja. Du dokumentierst eine Prüfung mit dem tatsächlichen Datum und hängst das Protokoll an. Die nächste Frist rechnet Macher ab diesem Datum.",
      },
    ],
    verwandt: ["maschinen", "werkzeuge", "fahrzeuge"],
  },
} satisfies Partial<Record<StandardSlug, FunktionInhalt>>;
