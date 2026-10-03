import type { FunktionInhalt, StandardSlug } from "../funktionen";

export const teil4 = {
  /* ───────────────────────── Automatische Planung ───────────────────────── */

  "automatische-planung": {
    icon: "spark",
    kurz: "Lotte schlägt Termin und Team für jeden offenen Auftrag vor – mit Begründung. Du prüfst und übernimmst.",
    enthalten: ["Planvorschläge", "Alle offenen vorplanen", "Einsatz-Check", "Dringendes zuerst"],
    meta: {
      title: "Automatische Planung für Handwerker – Termin und Team per Vorschlag",
      description:
        "Handwerk OS schlägt für jeden offenen Auftrag Termin und Team vor – nach Verfügbarkeit, Qualifikation, Fahrweg, Auslastung und Kundenwunsch. Mit Begründung, du entscheidest.",
    },
    hero: {
      titel: "Die Woche ist vorgeplant, bevor du den Kaffee ausgetrunken hast.",
      problem:
        "Wochenplanung ist ein Puzzle im Kopf vom Chef. Wer ist frei, wer darf das, wer ist am nächsten dran? Das dauert Stunden – und fällt der Chef aus, steht alles.",
      loesung:
        "Lotte plant alle offenen Aufträge vor und sagt dir zu jedem Vorschlag, warum. Du prüfst, änderst, wenn nötig, und übernimmst mit einem Klick.",
    },
    visual: {
      bereich: "Planen",
      titel: "Automatische Planung",
      untertitel: "KW 42",
      kennzahlen: [
        ["6", "Aufträge ohne Termin"],
        ["5", "Vorschläge bereit"],
        ["1", "dringend"],
      ],
      liste: {
        ueberschrift: "Vorschläge",
        zeilen: [
          { titel: "Heizung tauschen, Fam. Brück", sub: "Di 08:00 · Ali + Mia · 2 Tage", tag: "dringend", ton: "signal" },
          { titel: "Bad Gäste-WC, Hr. Lorenz", sub: "Do 07:30 · Lukas", tag: "88 / 100", ton: "moss" },
          { titel: "Wartung Therme, WEG Lindenhof", sub: "Fr 13:00 · Tom", tag: "74 / 100", ton: "sky" },
        ],
      },
      hinweis: {
        icon: "spark",
        ton: "moss",
        titel: "Warum Ali + Mia?",
        text: "Beide frei, Ali hat den Gasschein, 6 km vom Vortermin, Woche zu 70 % verplant.",
      },
    },
    problemTitel: "Planen kostet Zeit. Und hängt an einer Person.",
    probleme: [
      {
        titel: "Das Puzzle am Sonntagabend",
        text: "Zwölf Aufträge, sechs Leute, zwei Transporter. Du schiebst Namen hin und her, bis es irgendwie passt.",
      },
      {
        titel: "Etwas wird übersehen",
        text: "Der Urlaub von Tom, der fehlende Schein beim Azubi, der Kunde, der nur nachmittags kann. Es fällt erst auf, wenn es zu spät ist.",
      },
      {
        titel: "Beauftragt, aber ohne Termin",
        text: "Der Kunde hat zugesagt. Dann liegt der Auftrag drei Wochen herum, weil keiner ihn eingeplant hat.",
      },
      {
        titel: "Der Notfall kommt rein",
        text: "Heizung aus, Kunde ruft an. Wer kann am schnellsten hin – und wer darf das? Alle telefonieren durcheinander.",
      },
    ],
    loesung: {
      titel: "Vorschläge, die du nachvollziehen kannst.",
      text: "Lotte schaut sich jeden Auftrag ohne Termin an und sucht das passende Team und die passende Zeit. Dabei zählen Verfügbarkeit, Qualifikation, Fahrweg vom Vortermin, Auslastung der Woche, Kundenwunsch und Dringlichkeit. Zu jedem Vorschlag steht in Klartext, warum er passt. Nichts wird eingetragen, bevor du zustimmst.",
      punkte: [
        "Alle offenen Aufträge auf einmal vorplanen – mit Vorschau",
        "Begründung zu jedem Vorschlag: frei, darf das, kurzer Weg",
        "Große Aufträge werden über mehrere Tage verteilt",
        "Beim Übernehmen keine Doppelbuchung – und mit Rückgängig",
      ],
    },
    detail: {
      kopf: "Vorschlag · Bester Vorschlag",
      titel: "Ali + Mia",
      sub: "Heizung tauschen · Fam. Brück, Wiesenweg 12",
      status: { text: "84 / 100", ton: "moss" },
      zeilen: [
        { label: "Wann", wert: "Di 08:00 – Mi 16:00 · 2 Termine" },
        { label: "Qualifikation", wert: "Ali hat den Gasschein" },
        { label: "Anfahrt", wert: "ca. 6 km vom Vortermin" },
        { label: "Kundenwunsch", wert: "„Anfang der Woche“ – passt" },
        { label: "Nächster Schritt", wert: "2 Termine anlegen", hervor: true },
      ],
      fuss: { icon: "check", text: "Material und Werkzeug sind für beide Tage geprüft. Nichts fehlt." },
    },
    schritte: [
      {
        titel: "Aufträge sammeln sich",
        text: "Jeder beauftragte Auftrag ohne Termin erscheint in der Liste. Dringende stehen oben.",
      },
      {
        titel: "Lotte schlägt vor",
        text: "Team, Tag und Uhrzeit – mit Punktzahl und einer Begründung, die du in zwei Sekunden liest.",
      },
      {
        titel: "Du prüfst",
        text: "Passt es, hakst du ab. Passt es nicht, schaust du dir die Alternativen an oder planst von Hand.",
      },
      {
        titel: "Übernehmen",
        text: "Ein Klick legt alle Termine an. Hat sich inzwischen etwas geändert, rechnet Lotte neu.",
      },
    ],
    automatisch: [
      "legt bei dringenden Aufträgen sofort einen Planvorschlag zur Freigabe hin",
      "prüft Urlaub, Krankheit und Berufsschule beim Vorschlagen",
      "prüft Qualifikation und gültige Nachweise am Einsatztag",
      "prüft, ob Material, Werkzeug und Fahrzeug bereit sind",
      "teilt Aufträge ab 16 Stunden auf zwei Leute auf, wenn es geht",
      "schließt die Freigabe, sobald der Termin steht",
    ],
    geraete: {
      handy: [
        "Dringenden Vorschlag mit „So einplanen“ freigeben",
        "Am Auftrag „Einplanen“ tippen und Vorschlag übernehmen",
        "Warnungen zu Qualifikation und Material sehen",
      ],
      computer: [
        "Alle offenen Aufträge auf einmal vorplanen",
        "Vorschläge mit Begründung vergleichen",
        "Frühestes Startdatum setzen und neu rechnen lassen",
      ],
      handyVisual: {
        kopf: "Braucht dich · Freigabe",
        titel: "Dringend einplanen: Heizung tauschen",
        sub: "Fam. Brück · Wiesenweg 12",
        tags: [
          { text: "dringend", ton: "signal" },
          { text: "Gasschein ok", ton: "moss" },
        ],
        felder: [
          { label: "Vorschlag", wert: "Di 08:00 · Ali + Mia" },
          { label: "Dauer", wert: "2 Tage" },
          { label: "Anfahrt", wert: "ca. 6 km" },
        ],
        aktion: { icon: "check", text: "So einplanen" },
      },
    },
    gewerke: [
      { slug: "shk", text: "Gasarbeiten, Notdienst, Wartungen: Lotte plant nur Leute ein, die die Arbeit machen dürfen." },
      { slug: "elektriker", text: "Für Arbeiten mit Elektrofachkraft prüft Lotte, ob eine im Team ist – am Einsatztag gültig." },
      { slug: "bau", text: "Große Gewerke über mehrere Tage: Lotte verteilt die Stunden und plant zu zweit, wenn es geht." },
    ],
    kunde: {
      slug: "haustechnik-yilmaz",
      text: "Beispiel: Wie ein SHK-Betrieb mit 22 Leuten die Wochenplanung nicht mehr allein dem Chef überlässt.",
    },
    faq: [
      {
        frage: "Plant Lotte einfach ohne mich?",
        antwort:
          "Nein. Lotte macht Vorschläge. Termine entstehen erst, wenn du auf „Übernehmen“ tippst. Bei dringenden Aufträgen liegt der Vorschlag als Freigabe für dich bereit.",
      },
      {
        frage: "Woher weiß Lotte, wie lange ein Auftrag dauert?",
        antwort:
          "Aus den geschätzten Stunden am Auftrag. Fehlen sie, sagt Lotte dir das, statt zu raten. Was schon in Terminen steht, wird abgezogen.",
      },
      {
        frage: "Was, wenn ich mit einem Vorschlag nicht einverstanden bin?",
        antwort:
          "Du siehst zu jedem Auftrag mehrere Alternativen und kannst jederzeit von Hand planen. Einen übernommenen Vorschlag machst du mit einem Tipp rückgängig.",
      },
      {
        frage: "Berücksichtigt Lotte Material und Werkzeug?",
        antwort:
          "Ja, als Prüfung. Fehlt Material oder ist ein Gerät nicht geprüft, siehst du es am Termin und am Auftrag. Einen Termin verhindert das nicht – du entscheidest.",
      },
    ],
    verwandt: ["einsatzplanung", "auslastung", "qualifikationen"],
  },

  /* ───────────────────────── Auslastung ───────────────────────── */

  auslastung: {
    icon: "chart",
    kurz: "Sieh auf einen Blick, wer diese und nächste Woche noch Luft hat – und wer schon zu viel auf dem Zettel hat.",
    enthalten: ["Auslastung je Woche", "Offen einzuplanen", "Wer ist wann da?", "Freie Zeit finden"],
    meta: {
      title: "Auslastung im Handwerksbetrieb – wer hat noch Luft?",
      description:
        "Geplante Stunden gegen Wochenstunden – mit Urlaub, Krankheit und Feiertagen. Handwerk OS zeigt dir, wer frei ist, wer überlastet ist und welche Aufträge noch keinen Termin haben.",
    },
    hero: {
      titel: "Wer hat noch Luft? Du siehst es sofort.",
      problem:
        "Einer schiebt Überstunden, der andere wartet aufs nächste Material. Und wenn ein Kunde fragt, wann es losgeht, weißt du es nicht genau.",
      loesung:
        "Handwerk OS rechnet geplante Stunden gegen die Wochenstunden – Urlaub, Krankheit und Feiertage sind schon abgezogen. Du siehst, wer frei ist und was noch keinen Termin hat.",
    },
    visual: {
      bereich: "Planen",
      titel: "Auslastung",
      untertitel: "KW 42 und KW 43",
      kennzahlen: [
        ["82 %", "Team diese Woche"],
        ["61 %", "nächste Woche"],
        ["4", "Aufträge ohne Termin"],
      ],
      liste: {
        ueberschrift: "Diese Woche",
        zeilen: [
          { titel: "Lukas", sub: "46 von 40 h verplant", tag: "Überlast: 6 h zu viel", ton: "signal" },
          { titel: "Mia", sub: "31 von 40 h verplant", tag: "9 h frei", ton: "moss" },
          { titel: "Tom", sub: "Urlaub bis Freitag", tag: "Nicht da", ton: "ink" },
        ],
      },
      hinweis: {
        icon: "achtung",
        ton: "signal",
        titel: "Lukas ist diese Woche überlastet.",
        text: "Verteile Einsätze um oder plane sie später ein. Mia hat noch 9 Stunden frei.",
      },
    },
    problemTitel: "Ohne Überblick ist der eine kaputt und der andere langweilt sich.",
    probleme: [
      {
        titel: "Überstunden bei den Besten",
        text: "Wer gut ist, bekommt alles. Nach drei Wochen ist er platt – und der Rest hat Lücken im Plan.",
      },
      {
        titel: "„Wann können Sie anfangen?“",
        text: "Der Kunde fragt am Telefon. Du blätterst im Kalender und sagst „melde mich“. Er fragt den Nächsten.",
      },
      {
        titel: "Urlaub vergessen",
        text: "Der Plan sieht gut aus. Bis auffällt, dass zwei Leute nächste Woche im Urlaub sind.",
      },
      {
        titel: "Aufträge ohne Termin",
        text: "Zugesagt ist schnell. Aber welche Aufträge warten eigentlich noch auf einen Termin – und seit wann?",
      },
    ],
    loesung: {
      titel: "Stunden, die stimmen. Pro Kopf und Woche.",
      text: "Für jeden Mitarbeiter und jede der nächsten Wochen stellt Lotte geplante und verfügbare Stunden gegenüber. Verfügbar heißt: Wochenstunden minus genehmigter Urlaub, Krankheit, Berufsschule und Feiertage. Dazu siehst du, welche Aufträge und Besichtigungen noch keinen Termin haben – das Dringendste zuerst.",
      punkte: [
        "Geplant und verfügbar je Person – für die nächsten vier Wochen",
        "Klarer Text statt Farbe: „Überlast“, „Voll“, „Freiraum“, „Nicht da“",
        "Liste aller Aufträge und Besichtigungen ohne Termin",
        "„Freie Zeit finden“ für Rückfragen am Telefon",
      ],
    },
    detail: {
      kopf: "Auslastung · Lukas",
      titel: "KW 42",
      sub: "ab Montag, 13. Oktober",
      status: { text: "Überlast", ton: "signal" },
      zeilen: [
        { label: "Verplant", wert: "46 h" },
        { label: "Verfügbar", wert: "40 h" },
        { label: "Abwesend", wert: "keine" },
        { label: "Nächste Woche", wert: "32 von 40 h · 8 h frei" },
        { label: "Nächster Schritt", wert: "Einsatz Fr an Mia geben", hervor: true },
      ],
      fuss: { icon: "calendar", text: "Feiertage deines Bundeslands sind automatisch frei." },
    },
    schritte: [
      {
        titel: "Team mit Wochenstunden",
        text: "Du trägst bei jedem Mitarbeiter die Wochenstunden ein. Mehr braucht es nicht.",
      },
      {
        titel: "Planen wie gewohnt",
        text: "Termine und Einsätze zählen automatisch mit – auch interne Termine.",
      },
      {
        titel: "Auslastung sehen",
        text: "Je Person und Woche: verplant, verfügbar und was das bedeutet, in einem Satz.",
      },
      {
        titel: "Ausgleichen",
        text: "Von der Überlast-Warnung direkt in die Plantafel – und den Einsatz an jemanden mit Luft geben.",
      },
    ],
    automatisch: [
      "zieht Urlaub, Krankheit und Berufsschule von den Stunden ab",
      "berücksichtigt gesetzliche Feiertage deines Bundeslands",
      "meldet, wenn jemand diese oder nächste Woche überlastet ist",
      "zeigt Aufträge wieder als offen, wenn ihr Termin abgesagt wurde",
      "erinnert an beauftragte Aufträge, die über zwei Wochen ohne Termin sind",
      "warnt bei dringenden Aufträgen ohne Termin",
    ],
    geraete: {
      handy: [
        "Auslastung als Karte je Mitarbeiter",
        "Am Telefon die nächste freie Zeit nachschlagen",
        "Sehen, wer heute da ist",
      ],
      computer: [
        "Ganzes Team über vier Wochen im Blick",
        "Offene Aufträge filtern: dringend, Einsätze, Besichtigungen",
        "Arbeitstage und Bundesland für Feiertage einstellen",
      ],
      handyVisual: {
        kopf: "Freie Zeit finden",
        titel: "4 Stunden, nächste Woche",
        sub: "Für Rückfrage von Fr. Albers",
        tags: [
          { text: "egal wer", ton: "sky" },
          { text: "3 Treffer", ton: "moss" },
        ],
        felder: [
          { label: "Di, 21.10.", wert: "08:00–12:00 · Mia" },
          { label: "Mi, 22.10.", wert: "12:00–16:00 · Lukas" },
          { label: "Do, 23.10.", wert: "08:00–12:00 · Mia, Tom" },
        ],
        aktion: { icon: "calendar", text: "Termin eintragen" },
      },
    },
    gewerke: [
      { slug: "tischler", text: "Werkstatt und Montage: Du siehst, wer nächste Woche für den Einbau frei ist." },
      { slug: "maler", text: "Saisonspitze im Frühjahr? Du erkennst früh, wann das Team voll ist." },
      { slug: "galabau", text: "Wetterlücken nutzen: freie Stunden siehst du sofort und füllst sie mit offenen Aufträgen." },
    ],
    kunde: {
      slug: "tischlerei-weber",
      text: "Beispiel: Wie eine Tischlerei Montage und Werkstatt so plant, dass niemand dauerhaft Überstunden schiebt.",
    },
    faq: [
      {
        frage: "Woher kommen die verfügbaren Stunden?",
        antwort:
          "Aus den Wochenstunden am Mitarbeiter. Genehmigter Urlaub, Krankheit, Berufsschule und gesetzliche Feiertage werden abgezogen. Halbe Tage zählen halb.",
      },
      {
        frage: "Zählen auch die tatsächlich gearbeiteten Stunden?",
        antwort:
          "Nein. Die Auslastung zeigt, was geplant ist. Gearbeitete Stunden findest du in der Zeiterfassung.",
      },
      {
        frage: "Was ist „Offen einzuplanen“?",
        antwort:
          "Eine Liste aller beauftragten Aufträge ohne künftigen Termin und aller Anfragen mit Besichtigungswunsch. Dringende stehen oben, dann nach Wunschtermin und Wartezeit.",
      },
      {
        frage: "Sieht jeder Mitarbeiter die Auslastung der anderen?",
        antwort:
          "Hinweise zur Überlast gehen an Chef und Büro. Was ein Monteur sonst sieht, legst du unter Rollen & Rechte fest.",
      },
    ],
    verwandt: ["einsatzplanung", "automatische-planung", "urlaub-krankheit"],
  },

  /* ───────────────────────── Fahrt & Route ───────────────────────── */

  "fahrt-route": {
    icon: "map",
    kurz: "Fahrzeiten zwischen Einsätzen prüfen und die Tagesroute mit einem Tipp in Google Maps öffnen.",
    enthalten: ["Tagesroute", "Fahrzeit-Prüfung", "Reihenfolge", "Route aufs Handy"],
    meta: {
      title: "Tagesroute und Fahrzeiten für Handwerker – Fahrt & Route",
      description:
        "Handwerk OS prüft, ob die Fahrzeit zwischen zwei Einsätzen reicht, schlägt eine kürzere Reihenfolge vor und schickt jedem Monteur morgens seine Route mit Google-Maps-Link.",
    },
    hero: {
      titel: "Die Route steht. Die Zeit dazwischen reicht.",
      problem:
        "Zwei Einsätze, 40 Minuten auseinander, aber nur 15 Minuten Lücke im Plan. Der Monteur kommt zu spät, der Kunde ist verärgert.",
      loesung:
        "Lotte prüft jede Lücke zwischen zwei Einsätzen, schlägt eine passende Uhrzeit vor und schickt deinen Leuten morgens die Route mit Google-Maps-Link aufs Handy.",
    },
    visual: {
      bereich: "Planen",
      titel: "Route heute",
      untertitel: "Lukas · Donnerstag",
      kennzahlen: [
        ["4", "Stopps"],
        ["ca. 38 km", "Fahrt"],
        ["1", "Zeit wird knapp"],
      ],
      liste: {
        ueberschrift: "In Fahrtreihenfolge",
        zeilen: [
          { titel: "07:30–10:00 · Steckdosen Küche", sub: "Hr. Öztürk · ca. 9 km vom Betrieb", tag: "passt", ton: "moss" },
          { titel: "10:15–12:00 · Zählerschrank", sub: "Fr. Lindner · ca. 21 km", tag: "zu knapp", ton: "signal" },
          { titel: "13:00–15:30 · Wallbox", sub: "Fam. Petersen · ca. 4 km", tag: "passt", ton: "moss" },
        ],
      },
      hinweis: {
        icon: "clock",
        ton: "signal",
        titel: "Fahrzeit reicht nicht:",
        text: "Von Hr. Öztürk zu Fr. Lindner ca. 28 Minuten. Vorschlag: auf 10:40 Uhr schieben.",
      },
    },
    problemTitel: "Wer schlecht plant, fährt mehr – und kommt zu spät.",
    probleme: [
      {
        titel: "Termine ohne Luft",
        text: "Im Kalender sieht es gut aus. Auf der Straße fehlen 20 Minuten – jeden Tag aufs Neue.",
      },
      {
        titel: "Kreuz und quer durch die Stadt",
        text: "Erst Norden, dann Süden, dann wieder Norden. Die Reihenfolge war Zufall, die Kilometer bezahlst du.",
      },
      {
        titel: "Adressen abtippen",
        text: "Morgens im Wagen jede Adresse einzeln ins Navi tippen. Bei vier Stopps dauert das.",
      },
      {
        titel: "Die WhatsApp-Runde vom Chef",
        text: "Jeden Morgen schreibt der Chef jedem, wohin er fährt. Ist er krank, weiß keiner Bescheid.",
      },
    ],
    loesung: {
      titel: "Jeder Tag als Route. Mit Puffer.",
      text: "Lotte legt alle Einsätze eines Mitarbeiters in Fahrtreihenfolge und schätzt die Fahrzeit dazwischen. Reicht die Lücke nicht, siehst du das sofort – mit einer konkreten Uhrzeit als Lösung. Die ganze Tour öffnet sich mit einem Tipp in Google Maps, alle Stopps sind schon drin.",
      punkte: [
        "Fahrzeit und Puffer zwischen allen Einsätzen geprüft",
        "Konkreter Vorschlag: „Auf 10:40 Uhr schieben“",
        "Kürzere Reihenfolge mit gesparten Kilometern",
        "Ein Google-Maps-Link für die ganze Tagesroute",
      ],
    },
    detail: {
      kopf: "Übergang · Donnerstag",
      titel: "Hr. Öztürk → Fr. Lindner",
      sub: "Lukas · Ende 10:00 Uhr, nächster Start 10:15 Uhr",
      status: { text: "Zeit wird knapp", ton: "signal" },
      zeilen: [
        { label: "Entfernung", wert: "ca. 21 km" },
        { label: "Fahrzeit", wert: "ca. 28 Min." },
        { label: "Puffer", wert: "10 Min." },
        { label: "Es fehlen", wert: "23 Min." },
        { label: "Vorschlag", wert: "Auf 10:40 Uhr schieben", hervor: true },
      ],
      fuss: { icon: "route", text: "Andere Reihenfolge spart heute ca. 7 km." },
    },
    schritte: [
      {
        titel: "Einsätze planen",
        text: "Wie gewohnt in Plantafel oder Kalender. Die Adressen kommen vom Kunden oder Einsatzort.",
      },
      {
        titel: "Lotte prüft die Lücken",
        text: "Zwischen zwei Einsätzen muss die Fahrzeit plus Puffer passen. Sonst meldet sich Lotte.",
      },
      {
        titel: "Mit einem Tipp lösen",
        text: "Den Termin auf die vorgeschlagene Uhrzeit schieben. Die Dauer bleibt gleich.",
      },
      {
        titel: "Route aufs Handy",
        text: "Morgens bekommt jeder mit mehreren Einsätzen seine Route mit Google-Maps-Link.",
      },
    ],
    automatisch: [
      "prüft Fahrzeit und Puffer zwischen allen Einsätzen der nächsten Woche",
      "schlägt eine passende neue Uhrzeit vor, wenn die Zeit nicht reicht",
      "schickt morgens jedem mit mehreren Einsätzen seine Tagesroute",
      "baut einen Google-Maps-Link mit allen Stopps",
      "zeigt, wie viele Kilometer eine andere Reihenfolge spart",
      "rechnet den Fahrweg in die automatische Planung ein",
    ],
    geraete: {
      handy: [
        "Morgens die Route als Nachricht",
        "Ganze Tour mit einem Tipp in Google Maps",
        "Reihenfolge und Fahrzeiten des Tages",
      ],
      computer: [
        "Route je Mitarbeiter und Tag ansehen",
        "Knappe Übergänge mit einem Klick verschieben",
        "Puffer zwischen Einsätzen einstellen",
      ],
      handyVisual: {
        kopf: "Deine Route heute · 06:30",
        titel: "4 Stopps",
        sub: "ca. 38 km, 52 Min. Fahrt",
        tags: [
          { text: "Start 07:30", ton: "sky" },
          { text: "Zeiten passen", ton: "moss" },
        ],
        felder: [
          { label: "1. Stopp", wert: "Hr. Öztürk · Lindenallee 4" },
          { label: "2. Stopp", wert: "Fr. Lindner · Am Markt 9" },
          { label: "3. Stopp", wert: "Fam. Petersen · Feldweg 2" },
        ],
        aktion: { icon: "map", text: "In Google Maps öffnen" },
      },
    },
    gewerke: [
      { slug: "elektriker", text: "Viele kurze Kundendienste am Tag: Die Lücken dazwischen stimmen, die Route steht." },
      { slug: "shk", text: "Wartungsrunden durch die Stadt in sinnvoller Reihenfolge – weniger Kilometer, mehr Termine." },
      { slug: "gebaeude-service", text: "Feste Touren zu mehreren Objekten: Jeder bekommt morgens seine Strecke aufs Handy." },
    ],
    kunde: {
      slug: "elektro-brandt",
      text: "Beispiel: Wie ein Elektrobetrieb mit vielen Kundendiensten am Tag pünktlicher beim Kunden ist.",
    },
    werkzeug: "fahrtkosten-rechner",
    faq: [
      {
        frage: "Wie genau sind die Fahrzeiten?",
        antwort:
          "Lotte schätzt sie aus der Entfernung zwischen den Adressen. Live-Verkehr und Baustellen auf der Straße kennt Lotte nicht. Ist eine Adresse nur grob bekannt, steht „grob geschätzt“ dabei.",
      },
      {
        frage: "Brauche ich eine eigene Navi-App?",
        antwort:
          "Nein. Die Route öffnet sich in Google Maps – mit allen Stopps in der richtigen Reihenfolge. Das funktioniert auf jedem Handy.",
      },
      {
        frage: "Kann ich den Puffer ändern?",
        antwort:
          "Ja. Standard sind 10 Minuten zusätzlich zur Fahrzeit. Du stellst ein, wie viel Luft dein Betrieb zwischen zwei Einsätzen braucht.",
      },
      {
        frage: "Werden meine Leute per GPS verfolgt?",
        antwort:
          "Nein. Lotte rechnet nur mit den Adressen der Einsätze. Es gibt keine Standortverfolgung.",
      },
    ],
    verwandt: ["einsatzplanung", "mein-tag", "fahrzeuge"],
  },

  /* ───────────────────────── Mein Tag ───────────────────────── */

  "mein-tag": {
    icon: "smartphone",
    kurz: "Die App fürs Team auf der Baustelle: Tagesplan, nächster Einsatz mit Adresse und Zugang, erfassen mit einem Tipp – auch ohne Netz.",
    enthalten: ["Tagesplan", "Nächster Einsatz", "Erfassen", "Ohne Netz arbeiten"],
    meta: {
      title: "Mitarbeiter-App für Handwerker – Tagesplan und Einsatz aufs Handy",
      description:
        "Jeder im Team sieht morgens seinen Tag: Einsätze, Adresse, Zugang, Aufgaben. Starten, Fotos und Zeiten erfassen mit einem Tipp – auch ohne Netz auf der Baustelle.",
    },
    hero: {
      titel: "Dein Tag auf dem Handy. Mehr braucht keiner.",
      problem:
        "Morgens um halb sieben: Wer fährt wohin, wo ist der Schlüssel, was ist zu tun? Der Chef schreibt jedem einzeln – und im Keller hat sowieso keiner Netz.",
      loesung:
        "Jeder bekommt morgens seinen Tagesplan aufs Handy. Der nächste Einsatz zeigt Adresse, Zugang, Kunde und Arbeit. Fotos, Zeiten und Notizen gehen mit einem Tipp ans Büro – auch ohne Netz.",
    },
    visual: {
      bereich: "Heute",
      titel: "Mein Tag",
      untertitel: "Donnerstag, 16. Oktober",
      kennzahlen: [
        ["3", "Termine"],
        ["2", "Aufgaben"],
        ["07:30", "Start"],
      ],
      liste: {
        ueberschrift: "Heute",
        zeilen: [
          { titel: "07:30 · Bad sanieren", sub: "Fam. Krüger · Gartenstr. 3", tag: "Vor Ort", ton: "moss" },
          { titel: "13:00 · Wartung Therme", sub: "WEG Lindenhof · Haus B", tag: "geplant", ton: "sky" },
          { titel: "Fotos vom Estrich hochladen", sub: "Aufgabe · fällig heute", tag: "offen", ton: "sand" },
        ],
      },
      hinweis: {
        icon: "achtung",
        ton: "sky",
        titel: "Zugang:",
        text: "Schlüssel beim Hausmeister, Klingel „Berger“. Hund im Garten.",
      },
    },
    problemTitel: "Der Tag fängt mit Fragen an. Und hört mit Zetteln auf.",
    probleme: [
      {
        titel: "Die Nachrichtenrunde am Morgen",
        text: "Der Chef tippt jedem einzeln, wohin er fährt. Fragt einer nach, geht es von vorne los.",
      },
      {
        titel: "Vor der Tür und nicht rein",
        text: "Der Schlüssel liegt beim Nachbarn, aber das stand nur in einer Mail an das Büro.",
      },
      {
        titel: "Kein Netz im Keller",
        text: "Die App dreht sich, das Foto geht nicht raus. Also wird es auf später verschoben – und vergessen.",
      },
      {
        titel: "Stunden am Freitagabend",
        text: "Wann war ich wo? Am Ende der Woche wird geschätzt. Das Büro rechnet nach.",
      },
    ],
    loesung: {
      titel: "Ein Bildschirm für den ganzen Arbeitstag.",
      text: "„Mein Tag“ zeigt jedem seine Termine und Aufgaben für heute – nach Uhrzeit, mit Kunde und Ort. Der nächste Einsatz hat alles, was vor Ort zählt: Zugangshinweise oben, große Knöpfe für Navigation und Anruf, die Arbeit als kurze Liste. Erfasst wird mit einem Tipp. Ohne Netz bleibt alles auf dem Handy und geht automatisch raus, sobald wieder Empfang da ist.",
      punkte: [
        "Termine und Aufgaben für heute, überfällige zuerst",
        "Nächster Einsatz mit Zugang, Navigation und Anrufen",
        "Losfahren, vor Ort, beenden – je ein Tipp",
        "Fotos, Sprachnotiz und Zeit erfassen – auch ohne Netz",
      ],
    },
    detail: {
      kopf: "Nächster Einsatz · 07:30",
      titel: "Bad sanieren",
      sub: "Fam. Krüger · Gartenstr. 3, Hannover",
      status: { text: "Unterwegs", ton: "sky" },
      zeilen: [
        { label: "Zugang", wert: "Schlüssel beim Hausmeister" },
        { label: "Ansprechpartner", wert: "Sabine Krüger" },
        { label: "Zu tun", wert: "Wand fliesen, 3 Aufgaben offen" },
        { label: "Material", wert: "liegt bereit" },
        { label: "Nächster Schritt", wert: "Bin vor Ort", hervor: true },
      ],
      fuss: { icon: "chat", text: "Der Kunde hat beim Losfahren Bescheid bekommen: „Wir sind auf dem Weg.“" },
    },
    schritte: [
      {
        titel: "Morgens kommt der Plan",
        text: "Wer heute Termine hat, bekommt seinen Tag als Nachricht aufs Handy. Der Chef muss nichts schreiben.",
      },
      {
        titel: "Losfahren",
        text: "Ein Tipp öffnet die Navigation. Ist es eingerichtet, bekommt der Kunde Bescheid, dass ihr unterwegs seid.",
      },
      {
        titel: "Vor Ort arbeiten",
        text: "Zugang, Aufgaben, Material auf einen Blick. Fotos und Sprachnotizen landen direkt am Auftrag.",
      },
      {
        titel: "Einsatz beenden",
        text: "Ein Tipp – oder per Sprache sagen, was gemacht wurde. Das Büro sieht es sofort.",
      },
    ],
    automatisch: [
      "schickt jedem morgens seinen Tagesplan aufs Handy",
      "zeigt immer genau einen Einsatz: den laufenden oder den nächsten",
      "sagt dem Kunden Bescheid, wenn ihr losfahrt – oder schlägt es dir vor",
      "setzt vergangene Termine mit erfassten Zeiten auf „erledigt“",
      "erinnert, wenn ein Einsatz nicht gestartet oder nicht beendet wurde",
      "hebt Erfasstes ohne Netz auf und schickt es, sobald Empfang da ist",
    ],
    geraete: {
      handy: [
        "Tagesplan und nächster Einsatz auf einen Blick",
        "Navigation und Anruf mit großen Knöpfen",
        "Foto, Sprachnotiz und Zeit mit einem Tipp",
      ],
      computer: [
        "Chef und Büro sehen: Wer ist wo – vor Ort, unterwegs, abwesend",
        "Was heute erledigt ist und was noch läuft",
        "Einsätze ohne Mitarbeiter sofort erkennen",
      ],
      handyVisual: {
        kopf: "Nächster Einsatz · 07:30",
        titel: "Bad sanieren",
        sub: "Fam. Krüger · Gartenstr. 3",
        tags: [
          { text: "Material bereit", ton: "moss" },
          { text: "3 Aufgaben", ton: "sky" },
        ],
        felder: [
          { label: "Zugang", wert: "Schlüssel beim Hausmeister" },
          { label: "Anrufen", wert: "Sabine Krüger" },
          { label: "Fahrt", wert: "ca. 14 km" },
        ],
        aktion: { icon: "play", text: "Einsatz starten" },
      },
    },
    gewerke: [
      { slug: "dachdecker", text: "Fotos vom Dach direkt am Auftrag – auch wenn oben kein Empfang ist." },
      { slug: "shk", text: "Zugang zum Heizungskeller und Ansprechpartner stehen ganz oben im Einsatz." },
      { slug: "fliesenleger", text: "Aufgaben am Auftrag abhaken, Restarbeiten per Sprachnotiz festhalten." },
    ],
    kunde: {
      slug: "dach-hansen",
      text: "Beispiel: Wie ein Dachdeckerbetrieb die Morgenrunde per Nachricht abgeschafft hat und Fotos direkt vom Dach kommen.",
    },
    faq: [
      {
        frage: "Brauchen meine Leute ein Passwort?",
        antwort:
          "Nein. Die Anmeldung läuft über die Handynummer. Jeder sieht nur seinen eigenen Tag und seine Einsätze.",
      },
      {
        frage: "Funktioniert das ohne Netz?",
        antwort:
          "Ja. Fotos, Zeiten und Notizen bleiben auf dem Handy und gehen automatisch raus, sobald wieder Empfang da ist. Auf dem Bildschirm steht, was noch wartet.",
      },
      {
        frage: "Muss ich eine App installieren?",
        antwort:
          "Nein. Handwerk OS läuft im Browser. Du kannst es mit einem Tipp auf den Startbildschirm legen – dann sieht es aus wie eine App.",
      },
      {
        frage: "Sieht der Chef, wo ich gerade bin?",
        antwort:
          "Er sieht den Stand deiner Einsätze: unterwegs, vor Ort, erledigt. Es gibt keine GPS-Ortung und keine Karte mit Standorten.",
      },
    ],
    verwandt: ["zeiterfassung", "dokumentation", "fahrt-route"],
  },

  /* ───────────────────────── Urlaub & Krankheit ───────────────────────── */

  "urlaub-krankheit": {
    icon: "calendar",
    kurz: "Urlaub beantragen, krank melden, mit einem Tipp genehmigen – und sofort sehen, welche Termine betroffen sind.",
    enthalten: ["Urlaubsantrag", "Krankmeldung", "Resturlaub", "Jahresübersicht"],
    meta: {
      title: "Urlaubsplanung und Krankmeldung im Handwerk – per Handy",
      description:
        "Urlaub beantragen und genehmigen, krank melden mit Foto der AU, Resturlaub und Jahresübersicht. Handwerk OS zeigt sofort, welche Termine umgeplant werden müssen.",
    },
    hero: {
      titel: "Urlaub beantragt. Genehmigt. Eingeplant.",
      problem:
        "Der Urlaubszettel hängt an der Pinnwand, die Krankmeldung kommt um 6:40 per Nachricht. Und welche Baustelle jetzt ohne Leute ist, merkt man erst um acht.",
      loesung:
        "Urlaub beantragt jeder in Sekunden am Handy, du genehmigst mit einem Tipp. Meldet sich jemand krank, wissen Chef und Büro sofort Bescheid – mit den Terminen, die umgeplant werden müssen.",
    },
    visual: {
      bereich: "Betrieb",
      titel: "Urlaub & Krankheit",
      untertitel: "Oktober",
      kennzahlen: [
        ["2", "Anträge offen"],
        ["1", "heute krank"],
        ["3", "Termine umplanen"],
      ],
      liste: {
        ueberschrift: "Demnächst",
        zeilen: [
          { titel: "Tom · Krank", sub: "heute bis Fr · 2 Termine betroffen", tag: "umplanen", ton: "signal" },
          { titel: "Mia · Urlaub", sub: "27.10.–31.10. · 5 Arbeitstage", tag: "beantragt", ton: "sand" },
          { titel: "Kevin · Berufsschule", sub: "jeden Dienstag", tag: "eingetragen", ton: "sky" },
        ],
      },
      hinweis: {
        icon: "calendar",
        ton: "sky",
        titel: "Antrag von Mia:",
        text: "Gleichzeitig weg: Lukas am 31.10. Mias Resturlaub danach: 9 Tage.",
      },
    },
    problemTitel: "Abwesenheiten kommen immer dann, wenn der Plan steht.",
    probleme: [
      {
        titel: "Der Zettel an der Pinnwand",
        text: "Urlaub wird auf Papier beantragt. Wer hat schon zugesagt, wer fehlt noch, wie viele Tage sind übrig?",
      },
      {
        titel: "Krank um 6:40 Uhr",
        text: "Die Nachricht geht an den Chef. Der steht unter der Dusche. Das Büro erfährt es um acht.",
      },
      {
        titel: "Zwei gleichzeitig weg",
        text: "Beide Urlaube einzeln genehmigt. Dass in der Woche nur noch einer da ist, fällt erst später auf.",
      },
      {
        titel: "Resturlaub im Kopf",
        text: "„Wie viele Tage hab ich noch?“ Das Büro sucht in der Tabelle vom letzten Jahr.",
      },
    ],
    loesung: {
      titel: "Antrag in Sekunden. Entscheidung mit einem Tipp.",
      text: "Art wählen, von wann bis wann, fertig. Schon beim Ausfüllen siehst du die Arbeitstage, den Resturlaub danach und welche Termine im Zeitraum liegen. Krankmeldungen gelten sofort – das Foto der AU ist freiwillig und nur für Chef und Mitarbeiter sichtbar. Alles fließt direkt in die Planung ein.",
      punkte: [
        "Urlaub, krank, Berufsschule, Schulung, Überstundenabbau",
        "Arbeitstage und Resturlaub schon beim Antrag",
        "Genehmigen oder ablehnen in Liste, Detail oder Hinweis",
        "Jahresübersicht fürs ganze Team je Monat",
      ],
    },
    detail: {
      kopf: "Abwesenheit · Krank",
      titel: "Tom Becker",
      sub: "Do, 16.10. bis Fr, 17.10. · 2 Arbeitstage",
      status: { text: "gilt sofort", ton: "signal" },
      zeilen: [
        { label: "Gemeldet", wert: "06:40 Uhr am Handy" },
        { label: "AU", wert: "Foto liegt vor" },
        { label: "Betroffen", wert: "2 Termine" },
        { label: "Info an", wert: "Chef und Büro" },
        { label: "Nächster Schritt", wert: "Termine umplanen", hervor: true },
      ],
      fuss: { icon: "bell", text: "Lotte hat Chef und Büro um 06:40 Uhr Bescheid gegeben – mit beiden Terminen." },
    },
    schritte: [
      {
        titel: "Eintragen",
        text: "Am Handy: Urlaub beantragen oder krank melden. Halbe Tage gehen auch.",
      },
      {
        titel: "Lotte prüft",
        text: "Arbeitstage, Feiertage, Resturlaub, betroffene Termine und wer gleichzeitig weg ist.",
      },
      {
        titel: "Du entscheidest",
        text: "Genehmigen oder ablehnen mit einem Tipp. Der Mitarbeiter bekommt sofort Bescheid.",
      },
      {
        titel: "Planung passt sich an",
        text: "Wer weg ist, wird nicht mehr eingeplant. Betroffene Termine planst du direkt um.",
      },
    ],
    automatisch: [
      "gibt Krankmeldungen sofort an Chef und Büro weiter – mit betroffenen Terminen",
      "schickt dem Mitarbeiter Bescheid, wenn ein Antrag entschieden ist",
      "zeigt beim Antrag, wer im gleichen Zeitraum schon weg ist",
      "rechnet Arbeitstage und gesetzliche Feiertage deines Bundeslands",
      "meldet Termine, die in einer Abwesenheit liegen – mit „Umplanen“",
      "nimmt Abwesende aus der Planung und den Vorschlägen",
    ],
    geraete: {
      handy: [
        "Urlaub beantragen in Sekunden",
        "Krank melden, Foto der AU anhängen",
        "Resturlaub und eigene Abwesenheiten sehen",
      ],
      computer: [
        "Anträge genehmigen oder ablehnen",
        "Jahresübersicht fürs ganze Team",
        "Betroffene Termine direkt umplanen",
      ],
      handyVisual: {
        kopf: "Urlaub beantragen",
        titel: "27.10. bis 31.10.",
        sub: "Mia Schulz",
        tags: [
          { text: "5 Arbeitstage", ton: "sky" },
          { text: "kein Termin betroffen", ton: "moss" },
        ],
        felder: [
          { label: "Art", wert: "Urlaub" },
          { label: "Resturlaub danach", wert: "9 Tage" },
          { label: "Entscheidet", wert: "Chef" },
        ],
        aktion: { icon: "check", text: "Antrag senden" },
      },
    },
    gewerke: [
      { slug: "maler", text: "Saisonbetrieb: Urlaub im Sommer früh sehen und Baustellen danach planen." },
      { slug: "bau", text: "Kolonnen bleiben vollständig – du siehst, wer gleichzeitig weg ist." },
      { slug: "friseur-dienstleistungen", text: "Wer krank ist, fehlt sofort im Plan. Termine lassen sich rechtzeitig verschieben." },
    ],
    kunde: {
      slug: "malerei-koch",
      text: "Beispiel: Wie ein Malerbetrieb mit 8 Leuten Urlaub ohne Zettel an der Pinnwand plant.",
    },
    faq: [
      {
        frage: "Wer sieht die Krankmeldung?",
        antwort:
          "Chef und Büro erfahren, dass jemand krank ist und welche Termine betroffen sind. Das Foto der AU sehen nur der Mitarbeiter selbst und der Chef.",
      },
      {
        frage: "Werden Feiertage berücksichtigt?",
        antwort:
          "Ja. Gesetzliche Feiertage deines Bundeslands sind automatisch frei und zählen nicht als Urlaubstag.",
      },
      {
        frage: "Kann der Chef Urlaub auch direkt eintragen?",
        antwort:
          "Ja. Wer Personaldaten verwalten darf, trägt Urlaub direkt genehmigt ein – zum Beispiel für den Betriebsurlaub.",
      },
      {
        frage: "Wird Resturlaub ins nächste Jahr übertragen?",
        antwort:
          "Das rechnet Handwerk OS heute noch nicht automatisch. Den Urlaubsanspruch im Jahr trägst du beim Mitarbeiter ein.",
      },
    ],
    verwandt: ["einsatzplanung", "mitarbeiter", "auslastung"],
  },

  /* ───────────────────────── Rollen & Rechte ───────────────────────── */

  "rollen-rechte": {
    icon: "shield",
    kurz: "Leg fest, wer was sehen und ändern darf – Chef, Büro, Monteur, Azubi. Jeder sieht nur, was er braucht.",
    enthalten: ["Vier Rollen", "Rechte je Rolle", "Vorschau", "Als … ansehen"],
    meta: {
      title: "Rollen und Rechte im Handwerksbetrieb – wer sieht was?",
      description:
        "Chef, Büro, Monteur, Azubi: Leg fest, wer Preise sieht, wer plant und wer an Kunden sendet. Mit Vorschau, was jede Rolle sieht. Lotte hält sich an dieselben Rechte.",
    },
    hero: {
      titel: "Jeder sieht, was er braucht. Nicht mehr.",
      problem:
        "Der Monteur soll Fotos hochladen, aber nicht die Preise sehen. Der Azubi soll Zeiten erfassen, aber keine Rechnung verschicken. Bei vielen Programmen heißt das: alles oder nichts.",
      loesung:
        "In Handwerk OS hat jeder eine Rolle – Chef, Büro, Monteur oder Azubi. Für jede Rolle legst du mit einem Schalter fest, was sie darf. Eine Vorschau zeigt dir, was die Rolle dann sieht.",
    },
    visual: {
      bereich: "Betrieb",
      titel: "Rollen & Rechte",
      untertitel: "Standardrechte",
      kennzahlen: [
        ["4", "Rollen"],
        ["8", "Rechte"],
        ["14", "im Team"],
      ],
      liste: {
        ueberschrift: "Rechte je Rolle",
        zeilen: [
          { titel: "Chef", sub: "alle Rechte · nicht entziehbar", tag: "alles", ton: "ink" },
          { titel: "Büro", sub: "Planen, Preise & Geld, an Kunden senden", tag: "6 von 8", ton: "sky" },
          { titel: "Monteur / Geselle", sub: "Ansehen, Bearbeiten", tag: "2 von 8", ton: "moss" },
        ],
      },
      hinweis: {
        icon: "shield",
        ton: "sky",
        titel: "Gut zu wissen:",
        text: "Lotte hält sich an dieselben Rechte wie der Mensch, für den es arbeitet.",
      },
    },
    problemTitel: "Alle sehen alles – oder keiner sieht genug.",
    probleme: [
      {
        titel: "Preise auf dem Handy vom Gesellen",
        text: "Wer die Kalkulation sieht, rechnet nach. Und erzählt es auf der Baustelle weiter.",
      },
      {
        titel: "Versehentlich an den Kunden",
        text: "Der Azubi tippt auf „Senden“. Das Angebot war noch nicht fertig.",
      },
      {
        titel: "Zu viel auf dem Bildschirm",
        text: "Der Monteur braucht seinen Tag und seinen Einsatz. Rechnungen, Mahnungen und Auswertungen verwirren nur.",
      },
      {
        titel: "Lohn und Krankheit für alle",
        text: "Stundenkonten und Abwesenheiten der Kollegen gehen nicht jeden etwas an.",
      },
    ],
    loesung: {
      titel: "Vier Rollen. Acht klare Rechte.",
      text: "Jedes Recht ist in einem Satz erklärt: Ansehen, Bearbeiten, Einsätze planen, Preise & Geld, An Kunden senden, Personaldaten, Löschen, Einstellungen. Du schaltest sie je Rolle an oder aus. Die Vorschau zeigt, was die Rolle danach kann und welche Bereiche in ihrer Navigation stehen. Mit „Als … ansehen“ prüfst du es aus Sicht eines echten Mitarbeiters.",
      punkte: [
        "Chef, Büro, Monteur / Geselle, Azubi",
        "Jedes Recht in einem Satz erklärt",
        "Vorschau: Was kann diese Rolle, was nicht?",
        "Mit einem Klick zurück auf die Standardrechte",
      ],
    },
    detail: {
      kopf: "Vorschau · Rolle",
      titel: "Monteur / Geselle",
      sub: "6 Personen im Team",
      status: { text: "Standardrechte", ton: "moss" },
      zeilen: [
        { label: "Kann", wert: "Fotos, Notizen, Zeiten, Material erfassen" },
        { label: "Kann nicht", wert: "Preise, Kosten und Rechnungen sehen" },
        { label: "Kann nicht", wert: "Angebote oder Rechnungen senden" },
        { label: "Sieht", wert: "nur eigene Zeiten und Abwesenheiten" },
        { label: "Prüfen", wert: "Als Lukas ansehen", hervor: true },
      ],
      fuss: { icon: "check", text: "Änderungen gelten sofort. Der Chef hat immer alle Rechte." },
    },
    schritte: [
      {
        titel: "Rolle vergeben",
        text: "Beim Anlegen eines Mitarbeiters wählst du die Rolle. Das war's für die meisten Betriebe.",
      },
      {
        titel: "Standard passt meistens",
        text: "Monteur und Azubi erfassen und sehen. Büro plant und schreibt Rechnungen. Chef darf alles.",
      },
      {
        titel: "Anpassen, wenn nötig",
        text: "Soll das Büro nichts löschen? Ein Schalter. Die Vorschau zeigt sofort, was sich ändert.",
      },
      {
        titel: "Gegenprüfen",
        text: "„Als … ansehen“ zeigt dir Handwerk OS so, wie dein Mitarbeiter es sieht.",
      },
    ],
    automatisch: [
      "blendet Preise, Kosten und Ertrag ohne das Recht „Preise & Geld“ aus",
      "zeigt jedem nur die Bereiche, die er nutzen darf",
      "lässt Lotte nur tun, was der jeweilige Mensch auch darf",
      "schaltet „Ansehen“ mit an, wenn ein anderes Recht dazukommt",
      "hält dem Chef immer alle Rechte frei",
      "repariert kaputte Einstellungen von selbst",
    ],
    geraete: {
      handy: [
        "Monteure sehen nur ihren Tag und ihre Einsätze",
        "Keine Preise ohne das passende Recht",
        "Senden-Knöpfe nur für die, die senden dürfen",
      ],
      computer: [
        "Rechte je Rolle mit Schaltern festlegen",
        "Vorschau, was eine Rolle sieht",
        "Als einzelner Mitarbeiter ansehen",
      ],
      handyVisual: {
        kopf: "Rollen & Rechte",
        titel: "Azubi",
        sub: "2 Personen im Team",
        tags: [
          { text: "Ansehen", ton: "moss" },
          { text: "Bearbeiten", ton: "moss" },
        ],
        felder: [
          { label: "Preise & Geld", wert: "aus" },
          { label: "An Kunden senden", wert: "aus" },
          { label: "Personaldaten", wert: "aus" },
        ],
        aktion: { icon: "users", text: "Als Kevin ansehen" },
      },
    },
    gewerke: [
      { slug: "elektriker", text: "Monteure dokumentieren alles vom Handy – Preise und Kalkulation bleiben im Büro." },
      { slug: "tischler", text: "Werkstatt sieht Aufträge und Maße, aber nicht den Ertrag." },
      { slug: "gebaeude-service", text: "Viele Leute im Außendienst: Jeder sieht nur seine Objekte und Einsätze." },
    ],
    kunde: {
      slug: "elektro-brandt",
      text: "Beispiel: Wie ein Elektrobetrieb mit 14 Leuten allen das Handy gibt – und die Preise trotzdem im Büro bleiben.",
    },
    faq: [
      {
        frage: "Kann ich eigene Rollen anlegen?",
        antwort:
          "Heute nicht. Es gibt vier Rollen: Chef, Büro, Monteur / Geselle und Azubi. Für jede Rolle legst du die Rechte selbst fest.",
      },
      {
        frage: "Kann ich einer einzelnen Person mehr Rechte geben?",
        antwort:
          "Rechte gelten je Rolle. Braucht jemand mehr, gibst du ihm eine andere Rolle – zum Beispiel Büro statt Monteur.",
      },
      {
        frage: "Was darf Lotte, wenn es für mich arbeitet?",
        antwort:
          "Genau das, was du auch darfst. Darf ein Monteur keine Rechnungen senden, kann Lotte es in seinem Namen auch nicht.",
      },
      {
        frage: "Kann ich mich aussperren?",
        antwort:
          "Nein. Der Chef hat immer alle Rechte. Die kann ihm niemand nehmen, auch nicht aus Versehen.",
      },
    ],
    verwandt: ["mitarbeiter", "mein-tag", "zeiterfassung"],
  },

  /* ───────────────────────── Unterweisungen ───────────────────────── */

  unterweisungen: {
    icon: "signature",
    kurz: "Pflichtunterweisungen am Handy lesen und bestätigen lassen – der Nachweis ist dann schon fertig.",
    enthalten: ["Vorlagen", "Bestätigen am Handy", "Nachweisliste", "Erinnerungen"],
    meta: {
      title: "Unterweisungen digital im Handwerk – am Handy bestätigen",
      description:
        "Jährliche Pflichtunterweisungen digital: Inhalt kurz am Handy lesen, bestätigen, fertig. Mit Vorlagen, Nachweisliste je Mitarbeiter und Erinnerung vor Ablauf.",
    },
    hero: {
      titel: "Lesen. Bestätigen. Nachweis fertig.",
      problem:
        "Einmal im Jahr alle in die Werkstatt holen, Zettel vorlesen, Unterschriften sammeln. Zwei fehlen immer. Und der Ordner ist bei der Kontrolle nicht auffindbar.",
      loesung:
        "Jeder liest die Unterweisung als kurze Punkte am Handy und bestätigt mit einem Tipp. Du siehst in einer Liste, wer auf dem Stand ist – und Lotte erinnert, bevor etwas abläuft.",
    },
    visual: {
      bereich: "Betrieb",
      titel: "Unterweisungen",
      untertitel: "Stand heute",
      kennzahlen: [
        ["5", "Unterweisungen"],
        ["4", "Bestätigungen offen"],
        ["2", "laufen bald ab"],
      ],
      liste: {
        ueberschrift: "Pflichtthemen",
        zeilen: [
          { titel: "Arbeitsschutz allgemein", sub: "jährlich · 9 von 11 aktuell", tag: "2 offen", ton: "signal" },
          { titel: "Leitern und Tritte", sub: "jährlich · 11 von 11 aktuell", tag: "aktuell", ton: "moss" },
          { titel: "Fahrzeug und Ladungssicherung", sub: "jährlich · 6 von 8 aktuell", tag: "bald fällig", ton: "sand" },
        ],
      },
      hinweis: {
        icon: "bell",
        ton: "sky",
        titel: "Lotte hat erinnert:",
        text: "Kevin und Tom haben eine Nachricht bekommen, „Arbeitsschutz allgemein“ zu bestätigen.",
      },
    },
    problemTitel: "Die Unterweisung ist Pflicht. Der Ordner dazu ist eine Last.",
    probleme: [
      {
        titel: "Termin für alle",
        text: "Alle gleichzeitig in der Werkstatt – das klappt nie. Einer ist krank, einer auf Montage.",
      },
      {
        titel: "Fehlt eine Unterschrift?",
        text: "Wer hat letztes Jahr unterschrieben? Die Liste liegt irgendwo zwischen den Lieferscheinen.",
      },
      {
        titel: "Abgelaufen, ohne es zu merken",
        text: "Die Unterweisung war im März fällig. Jetzt ist Oktober. Es fällt erst auf, wenn etwas passiert.",
      },
      {
        titel: "Lange Texte, die keiner liest",
        text: "Zehn Seiten Kopie vom Verband. Unterschrieben wird trotzdem – gelesen hat es keiner.",
      },
    ],
    loesung: {
      titel: "Kurze Punkte statt dicker Ordner.",
      text: "Jede Unterweisung besteht aus wenigen, konkreten Punkten – so liest sie der Monteur in zwei Minuten am Handy. Er bestätigt mit Häkchen und einem Tipp. Du legst fest, für welche Rollen sie gilt und wie oft sie wiederholt wird. Unterweist du persönlich, trägst du das in der Nachweisliste ein. Zum Start gibt es fünf Vorlagen, passend zu deinem Gewerk.",
      punkte: [
        "Vorlagen: Arbeitsschutz, Leitern, Elektrik, Fahrzeug, Gefahrstoffe",
        "Bestätigen am Handy mit einem Tipp",
        "Nachweisliste je Unterweisung und je Mitarbeiter",
        "Bestätigung verlängert die passende Qualifikation",
      ],
    },
    detail: {
      kopf: "Unterweisung · jährlich",
      titel: "Leitern und Tritte",
      sub: "Gilt für Monteur / Geselle und Azubi",
      status: { text: "11 von 11 aktuell", ton: "moss" },
      zeilen: [
        { label: "Lukas", wert: "bestätigt 12.03. · nächste bis 12.03." },
        { label: "Mia", wert: "bestätigt 14.03. · nächste bis 14.03." },
        { label: "Kevin (Azubi)", wert: "persönlich unterwiesen 02.09." },
        { label: "Wiederholung", wert: "alle 12 Monate" },
        { label: "Nächster Schritt", wert: "Nichts zu tun", hervor: true },
      ],
      fuss: { icon: "bell", text: "Rund 30 Tage vor Ablauf bekommt jeder eine Erinnerung aufs Handy." },
    },
    schritte: [
      {
        titel: "Vorlage wählen",
        text: "Lotte legt passende Pflichtthemen für dein Gewerk an. Du änderst Text, Rollen und Intervall.",
      },
      {
        titel: "Team bekommt Bescheid",
        text: "Jeder, für den die Unterweisung gilt, sieht sie oben unter „Für dich zu bestätigen“.",
      },
      {
        titel: "Lesen und bestätigen",
        text: "Kurze Punkte lesen, Häkchen setzen, „Jetzt bestätigen“. Dauert zwei Minuten.",
      },
      {
        titel: "Nachweis steht",
        text: "Die Liste zeigt, wer wann bestätigt hat und wann die nächste Runde fällig ist.",
      },
    ],
    automatisch: [
      "legt fünf Startvorlagen passend zu deinem Gewerk an",
      "erinnert jeden rund 30 Tage vor Ablauf – einmal je Runde",
      "bündelt mehrere offene Unterweisungen in einer Nachricht",
      "zeigt dem Büro, wer nicht auf dem Stand ist – mit „Alle erinnern“",
      "verlängert mit der Bestätigung die passende Qualifikation",
      "meldet beim Einplanen, wenn ein nötiger Nachweis fehlt",
    ],
    geraete: {
      handy: [
        "Offene Unterweisungen ganz oben",
        "Inhalt als kurze Punkte lesen",
        "Mit einem Tipp bestätigen",
      ],
      computer: [
        "Unterweisungen anlegen und anpassen",
        "Nachweisliste mit Stand je Mitarbeiter",
        "Persönliche Unterweisung eintragen",
      ],
      handyVisual: {
        kopf: "Für dich zu bestätigen",
        titel: "Arbeitsschutz allgemein",
        sub: "jährlich · dauert ca. 2 Minuten",
        tags: [
          { text: "fällig", ton: "signal" },
          { text: "6 Punkte", ton: "sky" },
        ],
        felder: [
          { label: "Zuletzt bestätigt", wert: "vor 11 Monaten" },
          { label: "Gilt bis", wert: "28.10." },
          { label: "Fragen an", wert: "den Chef" },
        ],
        aktion: { icon: "check", text: "Jetzt bestätigen" },
      },
    },
    gewerke: [
      { slug: "elektriker", text: "Elektrische Gefährdungen jährlich – bestätigt am Handy, auch vom Azubi." },
      { slug: "dachdecker", text: "Leitern, Tritte und Höhe: Wer nicht auf dem Stand ist, siehst du vor dem Einsatz." },
      { slug: "maler", text: "Gefahrstoffe und Staub: Die Unterweisung steht als kurze Punkte auf dem Handy." },
    ],
    kunde: {
      slug: "dach-hansen",
      text: "Beispiel: Wie ein Dachdeckerbetrieb die jährliche Unterweisung ohne Termin in der Werkstatt erledigt.",
    },
    faq: [
      {
        frage: "Reicht eine Bestätigung am Handy als Nachweis?",
        antwort:
          "Handwerk OS speichert, wer wann bestätigt hat. Ob das für deine Berufsgenossenschaft reicht, klär bitte mit ihr. Unterweist du persönlich, trägst du das zusätzlich als „Unterwiesen“ ein.",
      },
      {
        frage: "Kann ich eigene Unterweisungen anlegen?",
        antwort:
          "Ja. Titel, Inhalt als kurze Punkte, für welche Rollen sie gilt und alle wie viele Monate sie wiederholt wird.",
      },
      {
        frage: "Was passiert, wenn jemand nicht bestätigt?",
        antwort:
          "Er bekommt eine Erinnerung aufs Handy. Das Büro sieht in der Liste, wer offen ist, und kann alle mit einem Klick noch einmal erinnern.",
      },
      {
        frage: "Was ist der Unterschied zu Schulungen?",
        antwort:
          "Unterweisungen sind die kurzen Pflichtthemen, die jeder regelmäßig bestätigt. Schulungen sind Kurse und Termine, etwa Erste Hilfe – die findest du unter Schulungen.",
      },
    ],
    verwandt: ["schulungen", "qualifikationen", "einarbeitung"],
  },
} satisfies Partial<Record<StandardSlug, FunktionInhalt>>;
