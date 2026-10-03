import type { FunktionInhalt, StandardSlug } from "../funktionen";

export const teil2 = {
  /* ───────────────────────── Berichte & Protokolle ───────────────────────── */

  berichte: {
    icon: "clipboard",
    kurz: "Nach dem Einsatz liegt der Bericht schon bereit – mit Zeiten, Material, Fotos und erledigten Aufgaben.",
    enthalten: ["Baustellenbericht", "Arbeitsbericht (Regie)", "Rapport", "Prüfprotokoll"],
    meta: {
      title: "Baustellenbericht & Arbeitsbericht per App – Handwerk OS",
      description:
        "Baustellenbericht, Regiebericht, Rapport und Prüfprotokoll: Lotte bereitet den Bericht nach dem Einsatz vor. Der Kunde unterschreibt auf dem Handy.",
    },
    hero: {
      titel: "Der Bericht ist fertig, bevor du im Auto sitzt.",
      problem:
        "Nach zehn Stunden Baustelle noch Berichte schreiben. Stunden und Material stehen auf Zetteln, die Unterschrift fehlt.",
      loesung:
        "Ist der Einsatz beendet, legt Lotte den Bericht an – mit Zeiten, Material, Fotos und erledigten Aufgaben. Du prüfst kurz, der Kunde unterschreibt.",
    },
    visual: {
      bereich: "Aufträge",
      titel: "Berichte & Protokolle",
      untertitel: "diese Woche",
      kennzahlen: [
        ["2", "zum Prüfen"],
        ["1", "Bericht fehlt"],
        ["6", "unterschrieben"],
      ],
      liste: {
        ueberschrift: "Offen",
        zeilen: [
          { titel: "Baustellenbericht · Haus 24", sub: "BR-2026-0141 · gestern · von Lotte vorbereitet", tag: "prüfen", ton: "sky" },
          { titel: "Arbeitsbericht · Kellerverteilung", sub: "BR-2026-0142 · 3,50 h · 2 Positionen", tag: "Unterschrift fehlt", ton: "signal" },
          { titel: "Prüfprotokoll · Zählerschrank Kurz", sub: "BR-2026-0139 · 7 Prüfpunkte", tag: "unterschrieben", ton: "moss" },
        ],
      },
      hinweis: {
        icon: "spark",
        ton: "moss",
        titel: "Lotte hat vorbereitet:",
        text: "Baustellenbericht für Haus 24 – Zeiten, Material und 4 Fotos sind schon drin.",
      },
    },
    problemTitel: "Die Arbeit ist gemacht. Der Nachweis fehlt.",
    probleme: [
      {
        titel: "Schreiben nach Feierabend",
        text: "Um sieben Uhr abends am Küchentisch den Tag aufschreiben. Was war heute Mittag noch mal mit dem Verteiler?",
      },
      {
        titel: "Regie ohne Unterschrift",
        text: "Drei Stunden Stundenlohnarbeit, aber keiner hat gegengezeichnet. Bei der Rechnung heißt es: „Das war so nicht abgesprochen.“",
      },
      {
        titel: "Alles doppelt",
        text: "Stunden auf dem Stundenzettel, Material auf dem Lieferschein, dann alles noch mal in den Bericht. Und im Büro ein drittes Mal in die Rechnung.",
      },
      {
        titel: "Zettel, die keiner lesen kann",
        text: "Der Rapport kommt zerknittert und eine Woche zu spät ins Büro. Die Hälfte ist nicht zu entziffern.",
      },
    ],
    loesung: {
      titel: "Prüfen statt schreiben.",
      text: "Lotte sammelt, was am Einsatztag zum Auftrag erfasst wurde: Zeiten, verbrauchtes Material, Fotos und erledigte Aufgaben. Notizen und Sprachnotizen des Tages stehen schon als Tätigkeiten drin. Du ergänzt, was fehlt, und lässt den Kunden direkt auf dem Handy unterschreiben.",
      punkte: [
        "Vier Arten: Baustellenbericht, Arbeitsbericht, Rapport, Prüfprotokoll",
        "Zeiten, Material, Fotos und Aufgaben des Tages automatisch drin",
        "Unterschrift des Kunden auf dem Handy – danach nicht mehr änderbar",
        "Fortlaufende Nummer und eine saubere Druckansicht",
      ],
    },
    detail: {
      kopf: "Arbeitsbericht · BR-2026-0142",
      titel: "Alte Verteilung im Keller abgeklemmt",
      sub: "Sanierung Wohnanlage, Haus 24 · Mittwoch",
      status: { text: "Vorbereitet, bitte prüfen", ton: "sky" },
      zeilen: [
        { label: "Arbeitszeit", wert: "3,50 h · Tom, Kemal" },
        { label: "Material", wert: "2 Positionen" },
        { label: "Fotos", wert: "4 vom Einsatztag" },
        { label: "Erledigte Aufgaben", wert: "Verteilung gesichert" },
        { label: "Nächster Schritt", wert: "Kunde unterschreibt", hervor: true },
      ],
      fuss: { icon: "spark", text: "Die Tätigkeiten hat Lotte aus den Sprachnotizen von Tom übernommen." },
    },
    schritte: [
      {
        titel: "Einsatz beenden",
        text: "Dein Monteur schließt den Einsatz in der App ab. Mehr muss er nicht tun.",
      },
      {
        titel: "Bericht liegt bereit",
        text: "Lotte legt den Bericht an und trägt Zeiten, Material, Fotos und erledigte Aufgaben ein.",
      },
      {
        titel: "Kurz prüfen",
        text: "Tätigkeiten ergänzen, Bemerkung für den Kunden schreiben. Fehlt etwas, liest Lotte den Tag neu ein.",
      },
      {
        titel: "Unterschreiben lassen",
        text: "Der Kunde unterschreibt auf dem Display. Oder du schließt den Bericht ohne Unterschrift ab.",
      },
    ],
    automatisch: [
      "legt nach jedem beendeten Einsatz den Bericht an",
      "übernimmt Zeiten, Material, Fotos und erledigte Aufgaben des Tages",
      "schreibt Notizen und Sprachnotizen als Tätigkeiten vor",
      "rechnet die Stunden ohne Pausen zusammen",
      "schlägt Prüfpunkte passend zu deinem Gewerk vor",
      "meldet sich, wenn zu einem Einsatz noch der Bericht fehlt",
    ],
    geraete: {
      handy: [
        "Vorbereiteten Bericht vor Ort prüfen",
        "Prüfpunkte mit Ergebnis und Messwert abhaken",
        "Kunde unterschreibt mit dem Finger",
      ],
      computer: [
        "Alle offenen Berichte auf einen Blick",
        "Bericht drucken oder als PDF speichern",
        "Berichte nach Auftrag, Nummer oder Art suchen",
      ],
      handyVisual: {
        kopf: "Bericht · von Lotte vorbereitet",
        titel: "Baustellenbericht Haus 24",
        sub: "Sanierung Wohnanlage · gestern",
        tags: [
          { text: "4 Fotos", ton: "sky" },
          { text: "7,25 h", ton: "moss" },
        ],
        felder: [
          { label: "Tätigkeiten", wert: "Unterverteilung gesetzt" },
          { label: "Material", wert: "3 Positionen" },
          { label: "Bemerkung", wert: "Restarbeiten Freitag" },
        ],
        aktion: { icon: "signature", text: "Vom Kunden unterschreiben lassen" },
      },
    },
    gewerke: [
      { slug: "elektriker", text: "Prüfprotokoll mit Isolationswiderstand, Schleifenimpedanz und RCD-Prüfung – die Prüfpunkte sind schon vorgeschlagen." },
      { slug: "shk", text: "Druckprüfung, Dichtheit und Abgasmessung mit Messwert festhalten. Der Kunde zeichnet direkt ab." },
      { slug: "bau", text: "Stundenlohnarbeiten als Arbeitsbericht, vom Bauleiter vor Ort gegengezeichnet." },
    ],
    kunde: {
      slug: "elektro-brandt",
      text: "Beispiel: Wie ein Elektrobetrieb Berichte nicht mehr abends schreibt, sondern morgens nur noch prüft.",
    },
    faq: [
      {
        frage: "Welche Berichte kann ich erstellen?",
        antwort:
          "Baustellenbericht (was heute passiert ist), Arbeitsbericht für Stundenlohnarbeiten, Rapport für den Kundendienst und Prüfprotokoll mit Prüfpunkten und Messwerten.",
      },
      {
        frage: "Kann der Bericht nach der Unterschrift noch geändert werden?",
        antwort:
          "Nein. Hat der Kunde unterschrieben, ist der Bericht gesperrt. So bleibt klar, was er bestätigt hat.",
      },
      {
        frage: "Was ist, wenn im Bericht etwas fehlt?",
        antwort:
          "Trag die fehlende Zeit oder das Material am Auftrag nach und tipp auf „Neu einlesen“. Lotte holt alles vom Tag noch einmal in den Bericht.",
      },
      {
        frage: "Muss der Kunde unterschreiben?",
        antwort:
          "Nein. Du kannst den Bericht auch ohne Unterschrift abschließen. Bei Stundenlohnarbeiten empfehlen wir die Unterschrift – dann gibt es später keine Diskussion.",
      },
    ],
    verwandt: ["dokumentation", "zeiterfassung", "abnahme"],
  },

  /* ───────────────────────── Zusatzleistungen ───────────────────────── */

  zusatzleistungen: {
    icon: "plus",
    kurz: "Mehrarbeit vor Ort sofort festhalten, vom Kunden freigeben lassen – und sie landet in der Rechnung.",
    enthalten: ["Nachtrag erfassen", "Freigabe per Unterschrift", "Automatisch in die Rechnung"],
    meta: {
      title: "Nachträge & Zusatzleistungen erfassen – nichts mehr verschenken",
      description:
        "Zusatzarbeit auf der Baustelle in Sekunden erfassen, vom Kunden per Unterschrift freigeben lassen. Lotte übernimmt freigegebene Nachträge automatisch in die Rechnung.",
    },
    hero: {
      titel: "Was du mehr machst, wird auch bezahlt.",
      problem:
        "„Können Sie das gleich mitmachen?“ Klar. Aufgeschrieben wird es nicht – und auf der Rechnung fehlt es.",
      loesung:
        "Du erfasst die Zusatzleistung direkt vor Ort, der Kunde gibt sie mit seiner Unterschrift frei. Lotte übernimmt sie automatisch in die Rechnung.",
    },
    visual: {
      bereich: "Aufträge",
      titel: "Zusatzleistungen",
      untertitel: "alle Aufträge",
      kennzahlen: [
        ["1", "ohne Freigabe"],
        ["2", "abrechenbar"],
        ["5", "abgerechnet"],
      ],
      liste: {
        ueberschrift: "Nachträge",
        zeilen: [
          { titel: "Alte Verteilung im Keller abgeklemmt", sub: "Haus 24 · 2 h nach Stundensatz", tag: "wartet auf Freigabe", ton: "signal" },
          { titel: "Zusätzliche Außenleuchte am Eingang", sub: "Haus 24 · Festpreis 185,00 €", tag: "freigegeben", ton: "moss" },
          { titel: "Bewegungsmelder getauscht", sub: "Treppenhaus · mündlich, Hr. Albers", tag: "freigegeben", ton: "sand" },
        ],
      },
      hinweis: {
        icon: "euro",
        ton: "sky",
        titel: "Abrechnen:",
        text: "2 freigegebene Nachträge zu Haus 24 sind noch in keiner Rechnung.",
      },
    },
    problemTitel: "Zusatzarbeit, die keiner aufschreibt, bezahlt auch keiner.",
    probleme: [
      {
        titel: "Mal eben mitgemacht",
        text: "Der Kunde fragt, ob du die Steckdose im Flur noch setzt. Zwanzig Minuten, kein Thema. Auf der Rechnung taucht sie nie auf.",
      },
      {
        titel: "„Das hab ich nie bestellt.“",
        text: "Die Rechnung kommt, der Kunde streicht den Nachtrag. Abgesprochen war es nur mündlich, zwischen Tür und Angel.",
      },
      {
        titel: "Der Monteur kennt den Preis nicht",
        text: "Der Kunde will wissen, was es kostet. Dein Mann sagt: „Das klärt das Büro.“ Und das Büro erfährt erst Wochen später davon.",
      },
      {
        titel: "Zettel im Handschuhfach",
        text: "Die Nachträge stehen auf einem Block im Transporter. Die Rechnung ist da längst raus.",
      },
    ],
    loesung: {
      titel: "Erfassen, freigeben, abrechnen.",
      text: "Dein Monteur erfasst die Zusatzleistung am Auftrag: nach Stunden, als Festpreis oder aus deinem Leistungskatalog. Die Summe steht sofort da. Der Kunde liest, was es netto und brutto kostet, und unterschreibt. Bei der nächsten Rechnung zum Auftrag übernimmt Lotte alle freigegebenen Nachträge als Positionen.",
      punkte: [
        "Preis nach Stunden, Festpreis oder Leistungskatalog",
        "Freigabe per Unterschrift – mit Preis netto und brutto",
        "Zustimmung per Mail oder am Telefon sauber festhalten",
        "Foto als Nachweis, warum es nötig war",
      ],
    },
    detail: {
      kopf: "Zusatzleistung · Haus 24",
      titel: "Zusätzliche Außenleuchte am Eingang",
      sub: "Sanierung Wohnanlage · Hausverwaltung Nord",
      status: { text: "freigegeben", ton: "moss" },
      zeilen: [
        { label: "Preis nach", wert: "Festpreis" },
        { label: "Summe netto", wert: "185,00 €" },
        { label: "Freigabe", wert: "Unterschrift Fr. Neumann" },
        { label: "Foto", wert: "1 Nachweis" },
        { label: "Abrechnung", wert: "kommt in die nächste Rechnung", hervor: true },
      ],
      fuss: { icon: "spark", text: "Wird eine Rechnung zum Auftrag angelegt, hängt Lotte den Nachtrag als Position an." },
    },
    schritte: [
      {
        titel: "Vor Ort erfassen",
        text: "Am Auftrag auf „Zusatzleistung“ tippen. Was, wie viel, welcher Preis – fertig.",
      },
      {
        titel: "Kunde gibt frei",
        text: "Er sieht Leistung und Preis und unterschreibt auf dem Handy. Sagt er nein, hältst du die Ablehnung fest.",
      },
      {
        titel: "Büro sieht es sofort",
        text: "Der Nachtrag steht am Auftrag und in der Liste der Zusatzleistungen – mit Status.",
      },
      {
        titel: "Ab in die Rechnung",
        text: "Lotte übernimmt freigegebene Nachträge in die Rechnung. Nichts wird doppelt berechnet.",
      },
    ],
    automatisch: [
      "rechnet die Summe aus Stundensatz, Festpreis oder Leistungskatalog",
      "übernimmt freigegebene Nachträge in die Rechnung zum Auftrag",
      "verhindert, dass ein Nachtrag doppelt berechnet wird",
      "macht Nachträge nach einem Rechnungsstorno wieder abrechenbar",
      "erinnert an Nachträge, die noch auf Freigabe warten",
      "meldet freigegebene Nachträge, die noch in keiner Rechnung sind",
    ],
    geraete: {
      handy: [
        "Zusatzleistung in wenigen Tipps erfassen",
        "Foto als Nachweis anhängen",
        "Kunde unterschreibt die Freigabe auf dem Display",
      ],
      computer: [
        "Alle Nachträge nach Status filtern",
        "Zustimmung per Mail oder Telefon eintragen",
        "Sehen, was in welcher Rechnung abgerechnet ist",
      ],
      handyVisual: {
        kopf: "Nachtrag · Haus 24",
        titel: "Zusätzliche Steckdose im Flur",
        sub: "Sanierung Wohnanlage",
        tags: [
          { text: "Stunden", ton: "sky" },
          { text: "1 Foto", ton: "moss" },
        ],
        felder: [
          { label: "Stunden", wert: "1,5" },
          { label: "Summe netto", wert: "97,50 €" },
          { label: "Status", wert: "wartet auf Freigabe" },
        ],
        aktion: { icon: "signature", text: "Nachtrag freigeben lassen" },
      },
    },
    gewerke: [
      { slug: "tischler", text: "Noch eine Blende, ein Fachboden mehr: kleine Wünsche vor Ort direkt als Nachtrag festhalten." },
      { slug: "fliesenleger", text: "Untergrund schlechter als gedacht? Ausgleich erfassen, Foto dazu, Kunde unterschreibt." },
      { slug: "elektriker", text: "Zusätzliche Steckdose oder Leuchte gleich vor Ort mit Preis freigeben lassen." },
    ],
    kunde: {
      slug: "tischlerei-weber",
      text: "Beispiel: Wie eine Tischlerei Wünsche bei der Montage nicht mehr verschenkt, sondern sauber abrechnet.",
    },
    werkzeug: "stundensatz-rechner",
    faq: [
      {
        frage: "Was ist, wenn der Kunde am Telefon zugestimmt hat?",
        antwort:
          "Dann tippst du auf „Zustimmung anders erhalten“ und schreibst dazu, wie und wann – zum Beispiel „per E-Mail am 12.05., Frau Neumann“. Der Nachtrag gilt dann als freigegeben.",
      },
      {
        frage: "Sieht der Kunde vorher, was es kostet?",
        antwort: "Ja. Über der Unterschrift steht die Leistung mit Menge und Preis – netto und brutto.",
      },
      {
        frage: "Woher kommt der Preis?",
        antwort:
          "Nach Stunden rechnet Lotte mit deinem Stundensatz aus den Einstellungen. Du kannst auch einen Festpreis eingeben oder eine Leistung aus deinem Leistungskatalog wählen.",
      },
      {
        frage: "Was passiert, wenn ich die Rechnung storniere?",
        antwort:
          "Die Nachträge sind dann wieder abrechenbar. Mit der nächsten Rechnung zum Auftrag übernimmt Lotte sie erneut.",
      },
    ],
    verwandt: ["rechnungen", "abnahme", "nachkalkulation"],
  },

  /* ───────────────────────── Abnahme & Unterschrift ───────────────────────── */

  abnahme: {
    icon: "signature",
    kurz: "Abnahme in fünf Schritten mit Mängeln, Fotos und digitaler Unterschrift – danach ist die Rechnung dran.",
    enthalten: ["Abnahmeprotokoll", "Mängel als Aufgaben", "Digitale Unterschrift"],
    meta: {
      title: "Abnahmeprotokoll mit digitaler Unterschrift – per Handy",
      description:
        "Abnahme mit Mängelliste, Fotos und digitaler Unterschrift des Kunden auf dem Handy. Danach rückt der Auftrag in die Abrechnung und das Büro weiß Bescheid.",
    },
    hero: {
      titel: "Abnehmen, unterschreiben, abrechnen.",
      problem:
        "Die Arbeit ist fertig, der Kunde nickt – aber eine förmliche Abnahme gibt es nicht. Bei der Schlussrechnung tauchen dann plötzlich Mängel auf.",
      loesung:
        "Mit Handwerk OS machst du die Abnahme in fünf Schritten am Handy. Mängel werden Aufgaben mit Frist, der Kunde unterschreibt auf dem Display, das Büro bekommt Bescheid.",
    },
    visual: {
      bereich: "Aufträge",
      titel: "Abnahmen",
      untertitel: "Oktober",
      kennzahlen: [
        ["2", "warten auf Abnahme"],
        ["1", "Mangel offen"],
        ["4", "unterschrieben"],
      ],
      liste: {
        ueberschrift: "Aufträge",
        zeilen: [
          { titel: "Gartenanlage Familie Roth", sub: "Phase Abnahme · seit 2 Tagen", tag: "Abnahme machen", ton: "signal" },
          { titel: "Terrasse Am Lindenhof", sub: "1 Mangel · beseitigen bis 24.10.", tag: "mit Mängeln", ton: "sand" },
          { titel: "Kleinreparatur Treppenhaus", sub: "Fr. Neumann · Hausverwaltung Nord", tag: "ohne Mängel", ton: "moss" },
        ],
      },
      hinweis: {
        icon: "bell",
        ton: "moss",
        titel: "Erledigt:",
        text: "Abnahme unterschrieben. Auftrag ist in der Abrechnung, das Büro hat Bescheid.",
      },
    },
    problemTitel: "Ohne Abnahme kein sauberer Abschluss.",
    probleme: [
      {
        titel: "Abnahme per Handschlag",
        text: "„Passt alles, danke!“ Drei Wochen später kommt die Mail mit einer Liste. Unterschrieben hat damals keiner etwas.",
      },
      {
        titel: "Mängel auf dem Zettel",
        text: "Zwei Kleinigkeiten werden notiert. Der Zettel bleibt im Auto, die Mängel bleiben offen – und die Rechnung bleibt unbezahlt.",
      },
      {
        titel: "Das Büro weiß von nichts",
        text: "Die Baustelle ist seit Tagen fertig. Die Schlussrechnung geht trotzdem nicht raus, weil keiner Bescheid gesagt hat.",
      },
      {
        titel: "Protokoll verschwunden",
        text: "Es gab ein Protokoll. Irgendwo. Als es Streit gibt, findet es keiner mehr.",
      },
    ],
    loesung: {
      titel: "Die Abnahme führt dich durch.",
      text: "Fünf Schritte: Angaben, Mängel, Fotos, Bemerkungen, Unterschrift. Jeder Mangel wird sofort eine Aufgabe am Auftrag – mit Frist. Der Kunde unterschreibt mit dem Finger und schreibt seinen Namen in Druckbuchstaben dazu. Zeitpunkt und Ort hält Lotte fest.",
      punkte: [
        "Geführte Abnahme in fünf Schritten",
        "Jeder Mangel wird eine Aufgabe mit 14 Tagen Frist",
        "Digitale Unterschrift mit Name, Ort und Uhrzeit",
        "Verweigert der Kunde, hältst du den Grund fest",
        "Protokoll drucken oder als PDF speichern",
      ],
    },
    detail: {
      kopf: "Abnahmeprotokoll",
      titel: "Gartenanlage Familie Roth",
      sub: "Birkenweg 12, Leipzig · Donnerstag, 15:20 Uhr",
      status: { text: "unterschrieben", ton: "moss" },
      zeilen: [
        { label: "Dabei", wert: "Hr. Roth, Jonas (Vorarbeiter)" },
        { label: "Ergebnis", wert: "Abgenommen mit Mängeln" },
        { label: "Mängel", wert: "1 · beseitigen bis 30.10." },
        { label: "Fotos", wert: "6 im Protokoll" },
        { label: "Unterschrift", wert: "Thomas Roth, 15:24 Uhr", hervor: true },
      ],
      fuss: { icon: "spark", text: "Auftrag in „Abrechnung“ verschoben. Das Büro hat eine Nachricht bekommen." },
    },
    schritte: [
      {
        titel: "Abnahme starten",
        text: "Am Auftrag oder über den Hinweis „Abnahme mit Kunde machen“. Datum und Ort sind schon eingetragen.",
      },
      {
        titel: "Mängel und Fotos",
        text: "Mängel beschreiben, Foto dazu. Nachher-Fotos sind fürs Protokoll schon ausgewählt.",
      },
      {
        titel: "Kunde unterschreibt",
        text: "Auf dem Display, mit Name in Druckbuchstaben. Ohne Mängel oder mit Vorbehalt – es steht klar im Protokoll.",
      },
      {
        titel: "Weiter zur Rechnung",
        text: "Der Auftrag rückt in die Abrechnung. Lotte bereitet den Rechnungsentwurf vor.",
      },
    ],
    automatisch: [
      "legt aus jedem Mangel eine Aufgabe mit Frist an",
      "wählt Nachher- und Mangel-Fotos fürs Protokoll vor",
      "hält Name, Ort und Zeitpunkt der Unterschrift fest",
      "schiebt den Auftrag nach der Unterschrift in die Abrechnung",
      "sagt dem Büro Bescheid, dass die Schlussrechnung raus kann",
      "erinnert, wenn Mängel nach Fristablauf noch offen sind",
    ],
    geraete: {
      handy: [
        "Abnahme Schritt für Schritt beim Kunden",
        "Mangel mit Foto in Sekunden erfassen",
        "Unterschrift mit dem Finger auf dem Display",
      ],
      computer: [
        "Alle Aufträge, die auf Abnahme warten",
        "Offene Mängel mit Frist im Blick",
        "Protokoll drucken oder als PDF speichern",
      ],
      handyVisual: {
        kopf: "Abnahme · Schritt 5 von 5",
        titel: "Gartenanlage Familie Roth",
        sub: "Birkenweg 12 · heute",
        tags: [
          { text: "1 Mangel", ton: "sand" },
          { text: "6 Fotos", ton: "sky" },
        ],
        felder: [
          { label: "Ergebnis", wert: "Abgenommen mit Mängeln" },
          { label: "Name", wert: "Thomas Roth" },
          { label: "Ort", wert: "Leipzig" },
        ],
        aktion: { icon: "signature", text: "Abnahme unterschreiben" },
      },
    },
    gewerke: [
      { slug: "galabau", text: "Pflaster, Bepflanzung, Zaun: Abnahme draußen auf dem Handy, Mängel mit Foto." },
      { slug: "maler", text: "Wohnung fertig gestrichen? Mit dem Vermieter durchgehen, Kleinigkeiten notieren, unterschreiben lassen." },
      { slug: "bau-rohbau", text: "Teilschritte mit dem Bauherrn abnehmen – mit Vorbehalten schriftlich im Protokoll." },
    ],
    kunde: {
      slug: "gruen-werk",
      text: "Beispiel: Wie ein Gartenbaubetrieb die Rechnung noch am Tag der Abnahme rausschickt.",
    },
    faq: [
      {
        frage: "Ist die digitale Unterschrift genauso gültig wie auf Papier?",
        antwort:
          "Die Unterschrift wird mit Name in Druckbuchstaben, Ort und Uhrzeit gespeichert und hängt am Auftrag. Das ist ein guter Nachweis, dass der Kunde abgenommen hat. Ob für deinen Fall eine besondere Form nötig ist, klärst du am besten mit deinem Anwalt oder deiner Kammer.",
      },
      {
        frage: "Was passiert mit den Mängeln?",
        antwort:
          "Jeder Mangel wird eine Aufgabe am Auftrag mit 14 Tagen Frist. Ist die Frist um und der Mangel noch offen, meldet sich Lotte.",
      },
      {
        frage: "Und wenn der Kunde die Abnahme verweigert?",
        antwort:
          "Dann tippst du auf „Kunde verweigert die Abnahme“ und schreibst den Grund dazu. Lotte zeigt dir die verweigerte Abnahme als Hinweis, damit es weitergeht.",
      },
      {
        frage: "Wo wird die Unterschrift noch genutzt?",
        antwort:
          "Dieselbe Unterschrift gibt es bei Berichten, bei der Freigabe von Zusatzleistungen und auf dem Lieferschein.",
      },
    ],
    verwandt: ["berichte", "rechnungen", "reklamationen"],
  },

  /* ───────────────────────── Nachrichten ───────────────────────── */

  nachrichten: {
    icon: "chat",
    kurz: "Alles, was mit Kunden und im Team besprochen wird – gesammelt am Auftrag statt verstreut auf fünf Handys.",
    enthalten: ["Verlauf je Auftrag", "Team intern", "Schnellantworten"],
    meta: {
      title: "Kundenkommunikation im Handwerk – alle Nachrichten am Auftrag",
      description:
        "Nachrichten mit Kunden und im Team, gesammelt je Auftrag. Lotte zeigt dir, welcher Kunde auf Antwort wartet, und ordnet Nachrichten dem richtigen Auftrag zu.",
    },
    hero: {
      titel: "Wer was geschrieben hat, steht am Auftrag.",
      problem:
        "Der Kunde schreibt dem Chef, ruft das Büro an und schickt dem Monteur ein Foto. Keiner weiß, was der andere schon geantwortet hat.",
      loesung:
        "In Handwerk OS hat jeder Auftrag seinen eigenen Verlauf – mit Kunde und Team getrennt. Lotte zeigt dir, wer auf Antwort wartet.",
    },
    visual: {
      bereich: "Aufträge",
      titel: "Nachrichten",
      untertitel: "heute",
      kennzahlen: [
        ["3", "ungelesen"],
        ["1", "wartet seit 4 Std."],
        ["5", "intern"],
      ],
      liste: {
        ueberschrift: "Posteingang",
        zeilen: [
          { titel: "Dachrinne Fam. Petersen", sub: "„Kommen Sie Donnerstag oder Freitag?“ · 09:12", tag: "wartet", ton: "signal" },
          { titel: "Carport-Dach Hr. Basler", sub: "Kundenbereich · „Passt auch 8 Uhr?“ · 10:40", tag: "neu", ton: "sky" },
          { titel: "Team intern", sub: "Lars: „Brauche noch 2 Rollen Unterspannbahn.“", tag: "intern", ton: "sand" },
        ],
      },
      hinweis: {
        icon: "chat",
        ton: "sky",
        titel: "Kunde wartet:",
        text: "Fam. Petersen hat vor 4 Stunden geschrieben und noch keine Antwort.",
      },
    },
    problemTitel: "Fünf Kanäle, null Überblick.",
    probleme: [
      {
        titel: "Verstreut auf allen Handys",
        text: "Mail ans Büro, SMS an den Chef, Foto an den Monteur. Wer suchen muss, findet nichts.",
      },
      {
        titel: "Der Kunde wartet",
        text: "Die Frage zum Termin kam gestern Mittag. Jeder dachte, der andere hat geantwortet.",
      },
      {
        titel: "Infos von der Baustelle gehen unter",
        text: "Der Monteur weiß, dass Material fehlt. Das Büro erfährt es am nächsten Morgen – zu spät zum Bestellen.",
      },
      {
        titel: "Keiner weiß, was zugesagt wurde",
        text: "„Ihr Kollege hat gesagt, das geht noch diese Woche.“ Welcher Kollege? Wann?",
      },
    ],
    loesung: {
      titel: "Ein Verlauf je Auftrag.",
      text: "Jeder Auftrag und jeder Kunde hat einen Verlauf. Darin steht, was dem Kunden geschrieben wurde, was er geantwortet hat und was das Team intern besprochen hat – klar getrennt. Schreibt der Kunde über den Kundenbereich, landet die Nachricht direkt im Verlauf.",
      punkte: [
        "Verlauf am Auftrag und am Kunden",
        "Kunde und intern sind klar getrennt",
        "Schnellantworten für Standardfälle",
        "Ungelesene Nachrichten mit Zähler",
      ],
    },
    detail: {
      kopf: "Verlauf · Auftrag A-2026-0318",
      titel: "Dachrinne erneuern · Fam. Petersen",
      sub: "Am Deich 4, Kiel",
      status: { text: "wartet auf Antwort", ton: "signal" },
      zeilen: [
        { label: "Letzte Nachricht", wert: "Kunde · 09:12 · E-Mail" },
        { label: "Intern", wert: "Lars: Gerüst steht ab Donnerstag" },
        { label: "Ungelesen", wert: "1 vom Kunden" },
        { label: "Antworten über", wert: "E-Mail oder SMS" },
        { label: "Schnellantwort", wert: "„Wir sind jetzt auf dem Weg zu Ihnen.“", hervor: true },
      ],
      fuss: { icon: "spark", text: "Lotte hat die Nachricht dem einzigen offenen Auftrag des Kunden zugeordnet." },
    },
    schritte: [
      {
        titel: "Kunde meldet sich",
        text: "Über den Kundenbereich landet die Nachricht direkt im Verlauf. Kam sie per Mail oder Telefon, trägst du sie mit „Kunde hat geschrieben“ ein.",
      },
      {
        titel: "Lotte ordnet zu",
        text: "Hat der Kunde genau einen offenen Auftrag, kommt die Nachricht dorthin.",
      },
      {
        titel: "Antworten",
        text: "Schreiben oder Schnellantwort wählen. Gesendet wird über dein Mailprogramm, SMS oder WhatsApp – der Verlauf bleibt am Auftrag.",
      },
      {
        titel: "Team informieren",
        text: "Interne Nachricht ans Team, direkt am Auftrag. Der Kunde sieht sie nie.",
      },
    ],
    automatisch: [
      "ordnet Kundennachrichten dem offenen Auftrag zu",
      "zeigt dir, welcher Kunde auf Antwort wartet",
      "rückt den Hinweis nach vier Stunden weiter nach oben",
      "übernimmt Nachrichten aus dem Kundenbereich in den Verlauf",
      "markiert Nachrichten beim Lesen als gelesen",
    ],
    geraete: {
      handy: [
        "Neue Nachrichten am Auftrag lesen",
        "Mit Schnellantwort in Sekunden reagieren",
        "Dem Büro intern Bescheid geben",
      ],
      computer: [
        "Posteingang mit allen Verläufen",
        "Filter „Ungelesen“",
        "Alle Nachrichten eines Kunden auf einen Blick",
      ],
      handyVisual: {
        kopf: "Nachrichten · Auftrag",
        titel: "Dachrinne erneuern",
        sub: "Fam. Petersen · Kiel",
        tags: [
          { text: "1 ungelesen", ton: "signal" },
          { text: "2 intern", ton: "sand" },
        ],
        felder: [
          { label: "Kunde, 09:12", wert: "Kommen Sie Donnerstag?" },
          { label: "Lars, intern", wert: "Gerüst steht ab Do." },
          { label: "Senden über", wert: "E-Mail" },
        ],
        aktion: { icon: "chat", text: "Antworten" },
      },
    },
    gewerke: [
      { slug: "dachdecker", text: "Wetter macht den Plan kaputt? Kunden schnell Bescheid geben – und es steht am Auftrag." },
      { slug: "shk", text: "Kundendienst mit vielen kleinen Aufträgen: jede Rückfrage landet beim richtigen Einsatz." },
      { slug: "gebaeude-service", text: "Hausverwaltung, Mieter, Hausmeister: alle Absprachen zu einem Objekt in einem Verlauf." },
    ],
    kunde: {
      slug: "dach-hansen",
      text: "Beispiel: Wie ein Dachdeckerbetrieb Absprachen mit Kunden am Auftrag sammelt statt auf privaten Handys.",
    },
    faq: [
      {
        frage: "Verschickt Handwerk OS die Nachrichten selbst?",
        antwort:
          "Meistens nicht. Du wählst E-Mail, SMS oder WhatsApp, dann öffnet sich die passende App mit dem fertigen Text. Die Nachricht steht gleichzeitig im Verlauf am Auftrag.",
      },
      {
        frage: "Sieht der Kunde interne Nachrichten?",
        antwort: "Nein. Interne Nachrichten sind klar gekennzeichnet und bleiben im Team.",
      },
      {
        frage: "Wie kommen Antworten der Kunden in den Verlauf?",
        antwort:
          "Schreibt der Kunde über seinen Kundenbereich, landet die Nachricht automatisch im Verlauf. Kam sie per Mail oder Telefon, trägst du sie mit „Kunde hat geschrieben“ ein.",
      },
      {
        frage: "Darf jeder Mitarbeiter Kunden schreiben?",
        antwort:
          "Nur wer das Recht dazu hat. Alle anderen können intern schreiben und lesen, was am Auftrag besprochen wurde.",
      },
    ],
    verwandt: ["kundenbereich", "kunden", "telefon"],
  },

  /* ───────────────────────── Dokumente & Vorlagen ───────────────────────── */

  dokumente: {
    icon: "file",
    kurz: "Alle Schreiben mit einem Briefkopf, sauberen Nummern und Textbausteinen – und alle Pläne am Auftrag.",
    enthalten: ["Geschäftsdokumente", "Briefkopf & Textbausteine", "Nummernkreise", "Dateien & Pläne"],
    meta: {
      title: "Dokumente, Vorlagen & Pläne am Auftrag – Handwerk OS",
      description:
        "Auftragsbestätigung, Lieferschein, Berichte und Rechnungen mit einem Briefkopf und fortlaufenden Nummern. Textbausteine füllen sich selbst, Pläne liegen am Auftrag.",
    },
    hero: {
      titel: "Jedes Schreiben sieht nach deinem Betrieb aus.",
      problem:
        "Die Auftragsbestätigung kommt aus Word, der Lieferschein vom Block, der Plan steckt im Postfach vom Chef. Nummern passen nicht zusammen.",
      loesung:
        "In Handwerk OS entsteht jedes Dokument am Auftrag – mit deinem Briefkopf, der richtigen Nummer und Texten, die sich selbst füllen. Pläne und Unterlagen liegen gleich daneben.",
    },
    visual: {
      bereich: "Aufträge",
      titel: "Schreiben & Nachweise",
      untertitel: "Auftrag Badsanierung Krüger",
      kennzahlen: [
        ["7", "Dokumente"],
        ["3", "Pläne"],
        ["1", "Entwurf"],
      ],
      liste: {
        ueberschrift: "Am Auftrag",
        zeilen: [
          { titel: "Angebot AN-2026-0088", sub: "angenommen · 12.09.", tag: "angenommen", ton: "moss" },
          { titel: "Auftragsbestätigung AB-2026-0031", sub: "aus dem Angebot · Entwurf", tag: "senden", ton: "signal" },
          { titel: "Grundriss Bad, Obergeschoss", sub: "Plan · PDF · für Monteure", tag: "Plan", ton: "sky" },
        ],
      },
      hinweis: {
        icon: "file",
        ton: "sky",
        titel: "Vorschlag:",
        text: "Der Auftrag ist beauftragt – Auftragsbestätigung jetzt erstellen?",
      },
    },
    problemTitel: "Jedes Schreiben anders. Jede Datei woanders.",
    probleme: [
      {
        titel: "Briefkopf aus drei Jahrzehnten",
        text: "Das Angebot hat das neue Logo, die Mahnung das alte, der Lieferschein gar keins. Die Bankverbindung stimmt auch nicht überall.",
      },
      {
        titel: "Preise abgetippt",
        text: "Die Auftragsbestätigung wird in Word geschrieben. Positionen und Preise tippt jemand aus dem Angebot ab – mit Fehlern.",
      },
      {
        titel: "Der falsche Plan auf der Baustelle",
        text: "Der neue Grundriss liegt im Postfach vom Chef. Auf der Baustelle wird nach dem alten gearbeitet.",
      },
      {
        titel: "Was ging wann raus?",
        text: "Der Kunde sagt, er hat die Bestätigung nie bekommen. Wann, an wen und in welcher Fassung – keiner weiß es genau.",
      },
    ],
    loesung: {
      titel: "Ein Briefbogen. Ein Ort. Für alles.",
      text: "Angebot, Auftragsbestätigung, Lieferschein, Berichte, Abnahme, Rechnungen und Mahnungen nutzen denselben Briefkopf. Die Auftragsbestätigung entsteht aus dem angenommenen Angebot, der Lieferschein aus dem Material am Auftrag. Textbausteine füllen Kunde, Anrede, Betrag und Frist selbst. Pläne, PDFs und Zeichnungen lädst du direkt am Auftrag hoch.",
      punkte: [
        "Ein Briefkopf mit Logo und Fußzeile für alle Schreiben",
        "Textbausteine mit Platzhaltern für Kunde, Betrag, Frist",
        "Fortlaufende Nummern je Dokumentart, ohne Lücken",
        "Pläne und Unterlagen am Auftrag – auch für den Kunden freigeben",
      ],
    },
    detail: {
      kopf: "Auftragsbestätigung · AB-2026-0031",
      titel: "Badsanierung, ca. 8 m²",
      sub: "Sabine Krüger · Gartenstr. 3, Hannover",
      status: { text: "Entwurf", ton: "sky" },
      zeilen: [
        { label: "Positionen", wert: "aus Angebot AN-2026-0088" },
        { label: "Einleitung", wert: "Textbaustein mit Anrede" },
        { label: "Briefkopf", wert: "Logo, Bank, Steuernummer" },
        { label: "Versand", wert: "Vorschau vor dem Senden" },
        { label: "Nächster Schritt", wert: "prüfen und senden", hervor: true },
      ],
      fuss: { icon: "layers", text: "Ändert sich die Bankverbindung, steht sie ab sofort in jedem neuen Schreiben richtig drin." },
    },
    schritte: [
      {
        titel: "Briefkopf einrichten",
        text: "Logo hochladen, Fußzeile wählen. Bank und Steuerdaten kommen aus deinen Betriebsdaten.",
      },
      {
        titel: "Dokument am Auftrag erstellen",
        text: "Lotte schlägt vor, was zur Phase passt – zum Beispiel die Auftragsbestätigung nach der Beauftragung.",
      },
      {
        titel: "Prüfen und senden",
        text: "Du siehst eine Vorschau mit dem fertigen Text. Fehlt eine Angabe, sagt Lotte es dir vorher.",
      },
      {
        titel: "Alles bleibt am Auftrag",
        text: "Schreiben, Nachweise und Pläne liegen zusammen. Was wann rausging, steht im Verlauf.",
      },
    ],
    automatisch: [
      "füllt Textbausteine mit Kunde, Anrede, Betrag und Frist",
      "vergibt fortlaufende Nummern je Dokumentart",
      "übernimmt Positionen aus dem angenommenen Angebot",
      "hält fest, was wann an wen rausging",
      "erkennt beim Hochladen, ob es ein Plan, PDF oder Bild ist",
      "erinnert an Auftragsbestätigungen, die noch nicht raus sind",
    ],
    geraete: {
      handy: [
        "Aktuellen Plan auf der Baustelle öffnen",
        "Lieferschein vor Ort quittieren lassen",
        "Foto von einer Zeichnung direkt am Auftrag speichern",
      ],
      computer: [
        "Briefkopf, Textbausteine und Nummernkreise pflegen",
        "Dokument erstellen, Vorschau ansehen, senden",
        "Pläne und PDFs hochladen und für Kunden freigeben",
      ],
      handyVisual: {
        kopf: "Dateien · Auftrag",
        titel: "Grundriss Bad, Obergeschoss",
        sub: "Badsanierung Krüger · Plan",
        tags: [
          { text: "PDF", ton: "sky" },
          { text: "intern", ton: "sand" },
        ],
        felder: [
          { label: "Hochgeladen", wert: "von Jana, gestern" },
          { label: "Für Kunden", wert: "nicht sichtbar" },
          { label: "Auftrag", wert: "A-2026-0412" },
        ],
        aktion: { icon: "download", text: "Plan öffnen" },
      },
    },
    gewerke: [
      { slug: "shk", text: "Lieferschein für Heizung und Speicher – der Kunde quittiert den Empfang vor Ort." },
      { slug: "tischler", text: "Zeichnungen und Aufmaßskizzen liegen am Auftrag, nicht im Mailordner." },
      { slug: "elektro-energie", text: "Prüfprotokolle, Berichte und Rechnungen mit einem Briefkopf und sauberer Nummer." },
    ],
    kunde: {
      slug: "tischlerei-weber",
      text: "Beispiel: Wie eine Tischlerei Zeichnungen, Bestätigungen und Rechnungen an einem Ort am Auftrag hat.",
    },
    faq: [
      {
        frage: "Welche Dokumente kann ich mit Handwerk OS erstellen?",
        antwort:
          "Angebot, Auftragsbestätigung, Lieferschein, Rapport, Arbeitsbericht, Baustellenbericht, Prüfprotokoll, Abnahme, Rechnung mit Abschlags-, Teil- und Schlussrechnung, Gutschrift, Storno, Zahlungserinnerung und Mahnung.",
      },
      {
        frage: "Kann ich eigene Nummernkreise festlegen?",
        antwort:
          "Ja. Unter „Vorlagen“ legst du für jede Dokumentart ein eigenes Kürzel fest. Die Nummern laufen je Jahr fortlaufend und ohne Lücken. Standard: alle Rechnungen im Kreis „R“.",
      },
      {
        frage: "Wie groß dürfen Pläne und Dateien sein?",
        antwort:
          "Im Moment bis 1,5 MB je Datei. Fotos und Bilder verkleinert Lotte beim Hochladen automatisch. Ist eine Datei zu groß, sagt dir Lotte, woran es liegt.",
      },
      {
        frage: "Was passiert, wenn in einem Textbaustein eine Angabe fehlt?",
        antwort:
          "Die Vorschau zeigt es dir vor dem Senden. Platzhalter ohne Wert fallen weg – dein Kunde sieht keine Lücke mit geschweiften Klammern.",
      },
    ],
    verwandt: ["angebote", "rechnungen", "dokumentation"],
  },

  /* ───────────────────────── Mahnungen ───────────────────────── */

  mahnungen: {
    icon: "bell",
    kurz: "Lotte prüft jeden Tag, was überfällig ist, und legt dir das fertige Schreiben hin. Du gibst nur noch frei.",
    enthalten: ["Zahlungserinnerung", "1. und 2. Mahnung", "Gebühren & Verzugszinsen"],
    meta: {
      title: "Mahnungen schreiben im Handwerk – automatisch vorbereitet",
      description:
        "Lotte prüft täglich offene Rechnungen und bereitet Zahlungserinnerung, 1. und 2. Mahnung mit Gebühr und Verzugszinsen vor. Raus geht nur, was du freigibst.",
    },
    hero: {
      titel: "Mahnen, ohne dass du daran denken musst.",
      problem:
        "Überfällige Rechnungen fallen keinem auf. Und wenn doch, schiebt man das Mahnen vor sich her – es ist unangenehm.",
      loesung:
        "Lotte prüft jeden Tag die Fälligkeiten und bereitet Erinnerung und Mahnung fertig vor – mit Gebühr und Zinsen. Du entscheidest: senden, warten oder verwerfen.",
    },
    visual: {
      bereich: "Betrieb",
      titel: "Mahnungen",
      untertitel: "heute geprüft",
      kennzahlen: [
        ["2", "zur Freigabe"],
        ["3", "überfällig"],
        ["0", "verworfen"],
      ],
      liste: {
        ueberschrift: "Wartet auf deine Freigabe",
        zeilen: [
          { titel: "Zahlungserinnerung · Hr. Basler", sub: "R-2026-0207 · offen 1.840,00 €", tag: "senden?", ton: "sky" },
          { titel: "1. Mahnung · WEG Am Park", sub: "R-2026-0188 · offen 3.212,50 € + Gebühr/Zinsen", tag: "senden?", ton: "signal" },
          { titel: "Fr. Lindner · R-2026-0215", sub: "seit 4 Tagen überfällig", tag: "noch in der Frist", ton: "sand" },
        ],
      },
      hinweis: {
        icon: "spark",
        ton: "moss",
        titel: "Lotte hat vorbereitet:",
        text: "1. Mahnung an WEG Am Park – mit Gebühr und Verzugszinsen berechnet.",
      },
    },
    problemTitel: "Das Geld ist verdient. Es kommt nur nicht.",
    probleme: [
      {
        titel: "Keiner merkt es",
        text: "Die Rechnung ist seit sechs Wochen fällig. Aufgefallen ist es erst, als das Konto knapp wurde.",
      },
      {
        titel: "Mahnen ist unangenehm",
        text: "Der Kunde war doch so nett. Also wartet man noch eine Woche. Und noch eine.",
      },
      {
        titel: "Gemahnt, obwohl bezahlt",
        text: "Die Zahlung kam gestern, die Mahnung geht heute raus. Jetzt ruft ein verärgerter Kunde an.",
      },
      {
        titel: "Zinsen? Gebühr? Pauschale?",
        text: "Wie viel Verzugszins darf ich nehmen, ab wann, und gilt die 40-Euro-Pauschale auch bei Privatkunden? Keiner rechnet es nach.",
      },
    ],
    loesung: {
      titel: "Fertig vorbereitet. Du gibst frei.",
      text: "Lotte schaut jeden Tag auf deine offenen Rechnungen. Ist eine lange genug überfällig, liegt das passende Schreiben bereit: erst die freundliche Zahlungserinnerung, dann die 1. und 2. Mahnung. Gebühr und Verzugszinsen sind schon berechnet. Ohne deine Freigabe geht nichts raus.",
      punkte: [
        "Zahlungserinnerung, 1. und 2. Mahnung als fertiges Schreiben",
        "Verzugszinsen für Privat- und Firmenkunden richtig berechnet",
        "Senden, noch warten oder verwerfen – du entscheidest",
        "Für Stammkunden: ohne Gebühr und Zinsen",
      ],
    },
    detail: {
      kopf: "1. Mahnung · wartet auf Freigabe",
      titel: "WEG Am Park · R-2026-0188",
      sub: "Fassade streichen · fällig seit 23 Tagen",
      status: { text: "zur Freigabe", ton: "signal" },
      zeilen: [
        { label: "Offen", wert: "3.212,50 €" },
        { label: "Mahngebühr", wert: "5,00 €" },
        { label: "Verzugszinsen", wert: "9 Prozentpunkte über Basiszins" },
        { label: "Neue Frist", wert: "10 Tage" },
        { label: "Entscheidung", wert: "Senden oder noch warten", hervor: true },
      ],
      fuss: { icon: "shield", text: "Geht vorher eine Zahlung ein, verwirft Lotte das Schreiben von selbst." },
    },
    schritte: [
      {
        titel: "Lotte prüft täglich",
        text: "Jeden Tag schaut Lotte, welche Rechnungen überfällig sind und welche Stufe dran ist.",
      },
      {
        titel: "Schreiben liegt bereit",
        text: "Mit deinem Text, offenem Betrag, Gebühr, Zinsen und neuer Frist.",
      },
      {
        titel: "Du entscheidest",
        text: "Senden, sieben Tage warten oder verwerfen. Für Stammkunden schaltest du Gebühr und Zinsen ab.",
      },
      {
        titel: "Raus per Mail oder Post",
        text: "Hat der Kunde eine E-Mail, öffnet sich dein Mailprogramm. Sonst druckst du das Schreiben aus.",
      },
    ],
    automatisch: [
      "prüft jeden Tag alle offenen Rechnungen",
      "bereitet Zahlungserinnerung, 1. und 2. Mahnung vor",
      "rechnet Gebühr und Verzugszinsen aus",
      "verwirft das Schreiben, wenn die Rechnung bezahlt ist",
      "zeigt beim Kunden, dass noch Rechnungen offen sind",
      "fragt dich nach erfolgloser 2. Mahnung, wie es weitergeht",
    ],
    geraete: {
      handy: [
        "Mahnung zwischen zwei Baustellen freigeben",
        "Noch warten, wenn der Kunde um Aufschub bittet",
        "Offene Posten beim Kunden sehen, bevor du hinfährst",
      ],
      computer: [
        "Alle Schreiben zur Freigabe in einer Liste",
        "Fristen, Gebühren und Basiszins einstellen",
        "Mahnung drucken oder als PDF speichern",
      ],
      handyVisual: {
        kopf: "Zur Freigabe · Zahlungserinnerung",
        titel: "Hr. Basler · R-2026-0207",
        sub: "Carport-Dach · 9 Tage überfällig",
        tags: [
          { text: "ohne Gebühr", ton: "moss" },
          { text: "E-Mail", ton: "sky" },
        ],
        felder: [
          { label: "Offen", wert: "1.840,00 €" },
          { label: "Neue Frist", wert: "10 Tage" },
          { label: "Kunde", wert: "Privat" },
        ],
        aktion: { icon: "check", text: "Senden" },
      },
    },
    gewerke: [
      { slug: "maler", text: "Viele Privatkunden, viele kleine Rechnungen: Lotte behält jede im Blick." },
      { slug: "shk", text: "Kundendienst-Rechnungen gehen schnell unter. Die Zahlungserinnerung kommt trotzdem." },
      { slug: "bau", text: "Bei Firmenkunden rechnet Lotte Zinsen mit 9 Prozentpunkten über Basiszins und auf Wunsch die 40-Euro-Pauschale." },
    ],
    kunde: {
      slug: "malerei-koch",
      text: "Beispiel: Wie ein Malerbetrieb nicht mehr selbst an offene Rechnungen denken muss.",
    },
    faq: [
      {
        frage: "Verschickt Lotte Mahnungen ohne mich?",
        antwort:
          "Nein. Lotte bereitet das Schreiben vor. Raus geht es erst, wenn du auf „Senden“ tippst.",
      },
      {
        frage: "Wie werden die Verzugszinsen berechnet?",
        antwort:
          "Bei Privatkunden mit 5, bei Firmenkunden mit 9 Prozentpunkten über dem Basiszinssatz. Den Basiszinssatz trägst du in den Regeln ein, wenn er sich ändert.",
      },
      {
        frage: "Kann ich Fristen und Gebühren ändern?",
        antwort:
          "Ja. In den Regeln legst du fest, wie viele Tage bis zur Erinnerung und zu jeder Mahnung vergehen, wie hoch die Gebühren sind und welche neue Frist im Schreiben steht.",
      },
      {
        frage: "Was passiert bei einer Teilzahlung?",
        antwort:
          "Lotte rechnet mit dem Betrag, der noch offen ist. Ein schon vorbereitetes Schreiben bringt Lotte bei der täglichen Prüfung auf den neuen Stand.",
      },
    ],
    verwandt: ["rechnungen", "zahlungen", "kunden"],
  },

  /* ───────────────────────── Kundenbereich ───────────────────────── */

  kundenbereich: {
    icon: "link",
    kurz: "Deine Kunden sehen Termine, Angebote, Rechnungen und Unterlagen – und nehmen Angebote online an.",
    enthalten: ["Angebot online annehmen", "Termine & Rechnungen", "Nachricht an den Betrieb"],
    meta: {
      title: "Kundenportal für Handwerker – Angebote online annehmen",
      description:
        "Ein persönlicher Link für deine Kunden: Termine, Angebote, Rechnungen und Unterlagen an einem Ort. Angebote nimmt der Kunde direkt online an – ohne Passwort.",
    },
    hero: {
      titel: "Dein Kunde nimmt das Angebot an, während du auf der Baustelle bist.",
      problem:
        "Der Kunde sucht das Angebot in seinen Mails, ruft wegen des Termins an und fragt, ob die Rechnung schon da ist.",
      loesung:
        "Mit einem Link sieht dein Kunde alles an einem Ort: Termine, Angebote, Rechnungen und Unterlagen. Das Angebot nimmt er mit einem Klick verbindlich an.",
    },
    visual: {
      bereich: "Aufträge",
      titel: "Kundenbereich",
      untertitel: "aktive Links",
      kennzahlen: [
        ["12", "Kunden mit Link"],
        ["2", "Angebote angenommen"],
        ["1", "neue Nachricht"],
      ],
      liste: {
        ueberschrift: "Zuletzt",
        zeilen: [
          { titel: "Fam. Schulte", sub: "Angebot AN-2026-0102 angenommen · heute 07:15", tag: "angenommen", ton: "moss" },
          { titel: "Hr. Basler", sub: "Nachricht: „Passt auch 8 Uhr?“ · gestern", tag: "Nachricht", ton: "sky" },
          { titel: "Fr. Lindner", sub: "Link läuft in 5 Tagen ab", tag: "verlängern", ton: "sand" },
        ],
      },
      hinweis: {
        icon: "spark",
        ton: "moss",
        titel: "Lotte hat erledigt:",
        text: "Link zum Kundenbereich für Fam. Schulte angelegt – mit dem Angebot verschickt.",
      },
    },
    problemTitel: "Dein Kunde will Bescheid wissen. Und du willst arbeiten.",
    probleme: [
      {
        titel: "„Wann kommen Sie denn?“",
        text: "Der dritte Anruf diese Woche zum selben Termin. Jedes Mal unterbrichst du die Arbeit.",
      },
      {
        titel: "Angebot liegt im Postfach",
        text: "Der Kunde will annehmen, findet aber die Mail nicht mehr. Ausdrucken, unterschreiben, einscannen – das macht er heute nicht.",
      },
      {
        titel: "„Haben Sie mir die Rechnung geschickt?“",
        text: "Der Kunde fragt nach der Rechnung, das Büro sucht. Dabei ist sie seit einer Woche raus.",
      },
      {
        titel: "Unterlagen per Mail hinterher",
        text: "Fotos, Pläne, Protokolle: Alles wird einzeln geschickt. Ein halbes Jahr später fragt der Kunde wieder danach.",
      },
    ],
    loesung: {
      titel: "Ein Link. Alles drin.",
      text: "Jeder Kunde bekommt seinen eigenen Link. Er öffnet ihn auf dem Handy oder am Computer – ohne Passwort, ohne App. Dort sieht er seine Termine, Angebote, Rechnungen mit Stand und die Unterlagen, die du freigibst. Angebote nimmt er an, indem er seinen Namen bestätigt. Fragen schreibt er dir direkt.",
      punkte: [
        "Angebot online annehmen oder ablehnen",
        "Termine mit Stand: geplant, unterwegs, vor Ort",
        "Rechnungen und freigegebene Unterlagen",
        "Nachricht an deinen Betrieb, direkt am Auftrag",
      ],
    },
    detail: {
      kopf: "Kundenbereich · Fam. Schulte",
      titel: "Link aktiv",
      sub: "gültig noch 84 Tage",
      status: { text: "Aktiv", ton: "moss" },
      zeilen: [
        { label: "Zuletzt geöffnet", wert: "heute, 07:12 Uhr" },
        { label: "Angebot", wert: "AN-2026-0102 angenommen" },
        { label: "Bestätigt von", wert: "Petra Schulte" },
        { label: "Unterlagen", wert: "3 freigegeben" },
        { label: "Nächster Schritt", wert: "Termin vereinbaren", hervor: true },
      ],
      fuss: { icon: "bell", text: "Die Annahme steht am Auftrag und beim Kunden. Du hast eine Nachricht bekommen." },
    },
    schritte: [
      {
        titel: "Link entsteht",
        text: "Beim Versand eines Angebots legt Lotte den Link an. Oder du erzeugst ihn selbst beim Kunden.",
      },
      {
        titel: "Kunde öffnet",
        text: "Auf dem Handy oder am Computer. Kein Konto, kein Passwort, keine App.",
      },
      {
        titel: "Kunde handelt",
        text: "Angebot annehmen, Termin ansehen, Rechnung prüfen, Frage stellen.",
      },
      {
        titel: "Du bekommst Bescheid",
        text: "Annahme und Nachrichten landen am Auftrag. Du musst nichts abtippen.",
      },
    ],
    automatisch: [
      "legt beim Versand eines Angebots den Link an",
      "hält den Kundenbereich immer auf dem aktuellen Stand",
      "trägt die Angebotsannahme am Auftrag und beim Kunden ein",
      "übernimmt Nachrichten des Kunden in den Verlauf",
      "lässt Links nach 90 Tagen ablaufen",
    ],
    geraete: {
      handy: [
        "Link beim Kunden kopieren und per Mail oder Messenger schicken",
        "Sehen, ob der Kunde das Angebot angenommen hat",
        "Nachrichten aus dem Kundenbereich lesen",
      ],
      computer: [
        "Alle Links mit letztem Zugriff im Blick",
        "Link sperren oder um 90 Tage verlängern",
        "Unterlagen für den Kunden freigeben",
      ],
      handyVisual: {
        kopf: "Ihr Kundenbereich",
        titel: "Guten Tag, Fam. Schulte",
        sub: "Ein Angebot wartet auf Ihre Antwort",
        tags: [
          { text: "1 Termin", ton: "sky" },
          { text: "1 Angebot", ton: "signal" },
        ],
        felder: [
          { label: "Termin", wert: "Di, 8:00–12:00 Uhr" },
          { label: "Angebot", wert: "Bad modernisieren" },
          { label: "Gesamt inkl. MwSt.", wert: "14.380,00 €" },
        ],
        aktion: { icon: "check", text: "Verbindlich annehmen" },
      },
    },
    gewerke: [
      { slug: "shk", text: "Der Kunde sieht, wann der Monteur kommt – und ob er schon unterwegs ist." },
      { slug: "maler", text: "Angebot nach der Besichtigung raus, der Kunde nimmt es noch am Abend an." },
      { slug: "fliesenleger", text: "Fotos und Unterlagen zum fertigen Bad bleiben für den Kunden abrufbar." },
    ],
    kunde: {
      slug: "malerei-koch",
      text: "Beispiel: Wie ein Malerbetrieb Angebote am Tag der Besichtigung verschickt – und der Kunde sie online annimmt.",
    },
    faq: [
      {
        frage: "Braucht mein Kunde ein Konto oder eine App?",
        antwort:
          "Nein. Er bekommt einen persönlichen Link und öffnet ihn im Browser – auf dem Handy oder am Computer.",
      },
      {
        frage: "Wie sicher ist der Link?",
        antwort:
          "Jeder Kunde hat seinen eigenen, geheimen Link. Er gilt 90 Tage. Du kannst ihn jederzeit sperren oder verlängern und siehst, wann er zuletzt geöffnet wurde.",
      },
      {
        frage: "Was sieht der Kunde – und was nicht?",
        antwort:
          "Er sieht seine Termine, verschickte Angebote, Rechnungen und die Unterlagen, die du für ihn freigibst. Entwürfe, interne Termine und interne Notizen sieht er nicht.",
      },
      {
        frage: "Kann der Kunde ein abgelaufenes Angebot annehmen?",
        antwort:
          "Nein. Abgelaufene Angebote zeigt der Kundenbereich, sie lassen sich aber nicht mehr annehmen.",
      },
    ],
    verwandt: ["angebote", "nachrichten", "kalender"],
  },
} satisfies Partial<Record<StandardSlug, FunktionInhalt>>;
