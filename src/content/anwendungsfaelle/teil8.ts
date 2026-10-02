import type { FunktionInhalt, StandardSlug } from "../funktionen";

export const teil8 = {
  /* ───────────────────────── KI-Bürokraft ───────────────────────── */

  "ki-buerokraft": {
    icon: "spark",
    kurz: "Macher arbeitet im Programm mit wie eine Bürokraft: erledigt Wiederkehrendes und fragt dich nur, wenn du entscheiden musst.",
    enthalten: ["Braucht dich", "Erledigt", "Freigaben", "Rückgängig"],
    meta: {
      title: "KI-Bürokraft im Handwerk – Macher arbeitet mit, du entscheidest",
      description:
        "Macher arbeitet in Macher OS mit wie eine Bürokraft: erledigt Wiederkehrendes, legt Entscheidungen vorbereitet hin und fragt bei Geld, Versand an Kunden und Löschen immer nach. Gekennzeichnet und mit Rückgängig.",
    },
    hero: {
      titel: "Deine Bürokraft sitzt schon im Programm.",
      problem:
        "Belege zuordnen, an Angebote denken, Zahlungen abhaken: Das Büro bleibt bis abends liegen. Für eine eigene Bürokraft reicht die Arbeit aber noch nicht.",
      loesung:
        "Macher arbeitet in Macher OS mit. Wiederkehrendes erledigt er selbst, Entscheidungen legt er dir fertig vorbereitet hin. Geld, Versand an Kunden und Löschen gibt es nur mit deinem Okay.",
    },
    visual: {
      bereich: "Heute",
      titel: "Heute",
      untertitel: "Mittwoch, 15. Oktober",
      kennzahlen: [
        ["3", "brauchen dich"],
        ["9", "von Macher erledigt"],
        ["1", "rückgängig gemacht"],
      ],
      liste: {
        ueberschrift: "Braucht dich",
        zeilen: [
          { titel: "Rechnung Fam. Wendt senden", sub: "Entwurf fertig · senden nur mit dir", tag: "Freigabe", ton: "signal" },
          { titel: "Urlaub Jonas, 20.–24.10.", sub: "Antrag von heute · keine Einsätze", tag: "Entscheidung", ton: "sky" },
          { titel: "Angebot Bad Krüger ohne Antwort", sub: "seit 8 Tagen · Nachfassen angelegt", tag: "erledigt", ton: "moss" },
        ],
      },
      hinweis: {
        icon: "spark",
        ton: "moss",
        titel: "Macher hat erledigt:",
        text: "Zahlung von Hr. Öztürk erkannt und die Rechnung auf „bezahlt“ gesetzt. Rückgängig geht mit einem Tipp.",
      },
    },
    problemTitel: "Das Büro läuft nebenher – und bleibt an dir hängen.",
    probleme: [
      {
        titel: "Büro nach Feierabend",
        text: "Tagsüber auf der Baustelle, abends am Küchentisch: Belege sortieren, Zahlungen abhaken, Angebote nachhalten.",
      },
      {
        titel: "Alles landet beim Chef",
        text: "Jede Kleinigkeit wartet auf dich. Und zwischen dem Kleinkram geht die eine wichtige Entscheidung unter.",
      },
      {
        titel: "Zu klein für eine Bürokraft",
        text: "Für eine eigene Stelle reicht die Arbeit nicht. Für dich allein ist sie zu viel.",
      },
      {
        titel: "Angst vor der Blackbox",
        text: "Eine KI, die einfach Rechnungen verschickt oder Daten löscht, will im Betrieb keiner haben. Zu Recht.",
      },
    ],
    loesung: {
      titel: "Macher arbeitet mit. Du behältst das Sagen.",
      text: "Macher prüft beim Öffnen und alle 30 Minuten, solange Macher OS offen ist, was ansteht. Kleinkram erledigt er nach festen Regeln, die du an- und abschaltest. Was eine Entscheidung braucht, landet unter „Braucht dich“ – mit fertigem Vorschlag und dem passenden Knopf. Alles, was Macher tut, steht im Verlauf mit dem Vermerk „durch Macher“.",
      punkte: [
        "Wiederkehrendes erledigt Macher selbst: zuordnen, erinnern, Status setzen",
        "Entscheidungen gesammelt unter „Braucht dich“, das Wichtigste zuerst",
        "Geld, Versand an Kunden und Löschen nur nach deiner Freigabe",
        "Gekennzeichnet im Verlauf – und vieles lässt sich zurücknehmen",
      ],
    },
    detail: {
      kopf: "Braucht dich · Freigabe",
      titel: "Rechnung an Fam. Wendt senden",
      sub: "Badsanierung · nach der Abnahme vorbereitet",
      status: { text: "wartet auf dich", ton: "signal" },
      zeilen: [
        { label: "Vorbereitet von", wert: "Macher" },
        { label: "Summe", wert: "4.870,00 €" },
        { label: "Pflichtangaben", wert: "geprüft" },
        { label: "Versand", wert: "per E-Mail an den Kunden" },
        { label: "Nächster Schritt", wert: "Prüfen und senden", hervor: true },
      ],
      fuss: {
        icon: "shield",
        text: "Ohne deinen Klick geht nichts raus. Eine gesendete Rechnung lässt sich nicht zurückholen – darum fragt Macher vorher.",
      },
    },
    schritte: [
      {
        titel: "Macher schaut nach",
        text: "Beim Öffnen und alle 30 Minuten prüft er Fristen, Zahlungen, Angebote und Einsätze.",
      },
      {
        titel: "Kleinkram erledigt er",
        text: "Anfrage zuweisen, Beleg zum Auftrag legen, Nachfassen anlegen. Du siehst es unter „Erledigt“.",
      },
      {
        titel: "Entscheidungen legt er hin",
        text: "Unter „Braucht dich“, das Wichtigste oben. Mit fertigem Vorschlag – oder auf morgen schieben.",
      },
      {
        titel: "Du gibst frei",
        text: "Kritisches nur mit deinem Klick. Was noch nicht beim Kunden ist, nimmst du bei Bedarf zurück.",
      },
    ],
    automatisch: [
      "ordnet Belege dem passenden Auftrag zu",
      "weist neue Anfragen einer Person im Büro zu",
      "legt eine Aufgabe zum Nachfassen an, wenn ein Angebot ohne Antwort bleibt",
      "setzt Rechnungen nach Zahlungseingang auf „bezahlt“",
      "sagt Termine ab, wenn ein Auftrag nicht zustande kommt",
      "räumt Hinweise weg, sobald die Ursache erledigt ist",
    ],
    geraete: {
      handy: [
        "„Braucht dich“ mit einem Tipp abarbeiten",
        "Urlaub oder Rechnung unterwegs freigeben",
        "Hinweis auf morgen schieben",
      ],
      computer: [
        "Alle Regeln mit Schalter an einer Stelle",
        "Erledigt von heute, dieser Woche und 30 Tagen",
        "Im Verlauf sehen, was Macher wann getan hat",
      ],
      handyVisual: {
        kopf: "Braucht dich · 3 offen",
        titel: "Urlaub Jonas, 20.–24.10.",
        sub: "Antrag von heute früh",
        tags: [
          { text: "keine Einsätze", ton: "moss" },
          { text: "Entscheidung", ton: "sky" },
        ],
        felder: [
          { label: "Tage", wert: "5 Arbeitstage" },
          { label: "Resturlaub danach", wert: "9 Tage" },
          { label: "Im Team frei", wert: "Lukas, Kai" },
        ],
        aktion: { icon: "check", text: "Genehmigen" },
      },
    },
    gewerke: [
      { slug: "maler", text: "Viele kleine Aufträge, viele Belege: Macher legt sie zum richtigen Auftrag und denkt ans Nachfassen." },
      { slug: "shk", text: "Wartung, Notdienst, Rechnungen: Was entschieden werden muss, steht oben – der Rest läuft mit." },
      { slug: "gebaeude-service", text: "Viele Objekte, viele Zahlungen: Macher hakt Eingänge ab und meldet nur, was hängt." },
    ],
    kunde: {
      slug: "malerei-koch",
      text: "Beispiel: Wie ein Malerbetrieb mit acht Leuten das Büro nebenbei schafft.",
    },
    faq: [
      {
        frage: "Was ist der Unterschied zu „Macher fragen“ und „Macher erledigt automatisch“?",
        antwort:
          "Bei „Macher fragen“ stellst du eine Frage und Macher antwortet. „Macher erledigt automatisch“ zeigt, welche Aufgaben er übernimmt. Die KI-Bürokraft ist das Zusammenspiel im Alltag: Macher arbeitet mit, sammelt deine Entscheidungen unter „Braucht dich“ und zeigt unter „Erledigt“, was er getan hat.",
      },
      {
        frage: "Kann Macher ohne mich Geld bewegen oder etwas an Kunden schicken?",
        antwort:
          "Nein. Rechnung senden, Mahnung, Nachricht an Kunden, Termin beim Kunden verschieben, bestellen und löschen brauchen immer deinen Klick. Auch einfache Einträge wie eine Aufgabe zeigt Macher dir standardmäßig erst als Vorschlag.",
      },
      {
        frage: "Sieht Macher mehr als meine Leute?",
        antwort:
          "Nein. Macher hat dieselben Rechte wie die Person, die ihn gerade nutzt. Fragt ein Monteur, sieht Macher keine Preise und keine Rechnungen – genau wie der Monteur selbst.",
      },
      {
        frage: "Wohin gehen meine Daten, wenn KI im Spiel ist?",
        antwort:
          "Vieles erledigt Macher mit festen Regeln, ganz ohne KI-Modell. Hilft ein Sprachmodell – etwa beim Verstehen eines Satzes oder beim Formulieren einer Nachricht –, bekommt es nur die Angaben, die es dafür braucht. Welcher Anbieter dahintersteht, steht in der Datenschutzerklärung. Vorschläge von Macher sind gekennzeichnet.",
      },
    ],
    verwandt: ["automatisch-erledigen", "macher-fragen", "rollen-rechte"],
  },

  /* ───────────────────────── Telefonassistent mit KI ───────────────────────── */

  "telefon-ki": {
    icon: "phone",
    kurz: "Macher nimmt Anrufe an, fragt das Wichtige ab und trägt sie als Anfrage oder Rückruf ein. Auf Anfrage für deinen Betrieb eingerichtet.",
    enthalten: ["Anrufe annehmen", "Anliegen abfragen", "Notfälle weitergeben"],
    meta: {
      title: "Telefonassistent mit KI für Handwerker – Anrufe annehmen lassen",
      description:
        "Macher nimmt Anrufe an, wenn du auf der Baustelle bist: Er fragt Anliegen, Adresse und Dringlichkeit ab und legt eine Anfrage oder einen Rückruf an. Wir richten den Telefonassistenten auf Anfrage für deinen Betrieb ein.",
    },
    aufAnfrage: {
      aktion: "Telefonassistent anfragen",
      text: "Den Telefonassistenten richten wir für deinen Betrieb ein: deine Nummer, deine Begrüßung, deine Regeln für Notfälle. Schreib uns, wir melden uns mit den nächsten Schritten.",
      heute: [
        "Anrufe in Sekunden notieren: Nummer, Anliegen, Dringlichkeit",
        "Bekannte Anrufer an der Nummer erkennen – auch über das Telefon vor Ort",
        "Aus dem Anruf direkt eine Anfrage oder einen Rückruf mit Zuständigem machen",
        "Erinnerung, wenn ein Rückruf überfällig oder ein dringender heute fällig ist",
      ],
    },
    hero: {
      titel: "Du bist auf dem Dach. Macher geht ans Telefon.",
      problem:
        "Während du arbeitest, klingelt das Handy ins Leere. Viele Anrufer legen auf, ohne etwas zu sagen – und rufen den nächsten Betrieb an.",
      loesung:
        "Der Telefonassistent nimmt den Anruf an, fragt das Wichtige ab und schreibt es als Anfrage oder Rückruf in Macher OS. Notfälle gibt er an deine Bereitschaft weiter.",
    },
    visual: {
      bereich: "Aufträge",
      titel: "Telefon & Empfang",
      untertitel: "Dienstag, 14. Oktober",
      kennzahlen: [
        ["3", "von Macher angenommen"],
        ["1", "Notfall weitergegeben"],
        ["2", "Rückrufe offen"],
      ],
      liste: {
        ueberschrift: "Von Macher angenommen",
        zeilen: [
          { titel: "Rohrbruch im Keller", sub: "Fr. Sommer · 07:58 · an Bereitschaft", tag: "Notfall", ton: "signal" },
          { titel: "Dachfenster undicht", sub: "Hr. Kaya · 12:14 · Neukunde", tag: "Anfrage angelegt", ton: "moss" },
          { titel: "Frage zur Rechnung", sub: "Hausverwaltung Nord · 16:30", tag: "Rückruf", ton: "sky" },
        ],
      },
      hinweis: {
        icon: "phone",
        ton: "sky",
        titel: "Rückruf vorbereitet:",
        text: "Hausverwaltung Nord, Frage zur Rechnung R-2026-097. Erreichbar bis 17 Uhr.",
      },
    },
    problemTitel: "Wer arbeitet, kann nicht telefonieren.",
    probleme: [
      {
        titel: "Aufgelegt statt aufgesprochen",
        text: "Viele Anrufer sprechen nicht auf die Mailbox. Du siehst nur eine Nummer – und weißt nicht, ob da ein Auftrag dran war.",
      },
      {
        titel: "Zurückrufen ins Blaue",
        text: "Du rufst zurück und weißt nicht, worum es geht. Erst Adresse und Anliegen klären, dann noch mal melden.",
      },
      {
        titel: "Das Notdienst-Handy schläft nie",
        text: "Wer Bereitschaft hat, bekommt jeden Anruf. Auch die Frage nach dem Angebot von letzter Woche.",
      },
      {
        titel: "Abtippen nach Feierabend",
        text: "Was am Telefon besprochen wurde, steht nirgends. Abends tippst du es aus dem Gedächtnis ab.",
      },
    ],
    loesung: {
      titel: "Ein Assistent am Telefon, der direkt ins Programm schreibt.",
      text: "Geht keiner ran, nimmt Macher den Anruf an. Er sagt gleich, dass er ein digitaler Assistent ist, und fragt Anliegen, Adresse, Dringlichkeit und Rückrufnummer ab. Das Ergebnis landet in Telefon & Empfang – als Anfrage, Rückruf oder Notiz. Genau so, wie wenn du den Anruf heute von Hand notierst. Nur ohne Abtippen.",
      punkte: [
        "Anrufe annehmen, wenn du nicht rangehen kannst",
        "Sagt offen, dass er ein digitaler Assistent ist",
        "Anfrage oder Rückruf direkt im Programm – mit Kunde und Auftrag",
        "Notfälle an deine Bereitschaft, alles andere in den Eingang",
      ],
    },
    detail: {
      kopf: "Anruf · von Macher angenommen",
      titel: "Rohrbruch im Keller",
      sub: "Eva Sommer · Ahornweg 5",
      status: { text: "Notfall", ton: "signal" },
      zeilen: [
        { label: "Anliegen", wert: "Wasser tritt aus, Haupthahn zu" },
        { label: "Adresse", wert: "Ahornweg 5" },
        { label: "Dringlichkeit", wert: "Notfall" },
        { label: "Erreichbar", wert: "jederzeit" },
        { label: "Weitergegeben", wert: "an Bereitschaft (Kai)", hervor: true },
      ],
      fuss: { icon: "phone", text: "Eingetragen in Telefon & Empfang – wie ein Anruf, den du von Hand notierst." },
    },
    schritte: [
      {
        titel: "Du legst die Regeln fest",
        text: "Wann Macher rangeht und was bei dir als Notfall gilt, bestimmst du.",
      },
      {
        titel: "Macher fragt nach",
        text: "Anliegen, Adresse, Dringlichkeit, Rückrufnummer. Bekannte Anrufer erkennt er an der Nummer.",
      },
      {
        titel: "Eintrag statt Mailbox",
        text: "Anfrage, Rückruf oder Notiz in Telefon & Empfang. Notfälle gehen sofort an die Bereitschaft.",
      },
      {
        titel: "Vorbereitet zurückrufen",
        text: "Du weißt, wer anruft und worum es geht. Ein Tipp, und du hast den Kunden dran.",
      },
    ],
    automatisch: [
      "nimmt Anrufe an, wenn keiner rangeht",
      "fragt Anliegen, Adresse und Dringlichkeit ab",
      "erkennt bekannte Kunden an der Nummer",
      "hängt den Anruf an den offenen Auftrag des Anrufers",
      "legt Anfrage oder Rückruf mit Zuständigem an",
      "gibt Notfälle an die Bereitschaft weiter",
    ],
    geraete: {
      handy: [
        "Notiz zum Anruf als Nachricht aufs Handy",
        "Zurückrufen mit einem Tipp",
        "Notfälle direkt bei der Bereitschaft",
      ],
      computer: [
        "Alle Anrufe in Telefon & Empfang",
        "Bürozeiten und Notfälle festlegen",
        "Jeden Anruf am Kunden und Auftrag nachlesen",
      ],
      handyVisual: {
        kopf: "Von Macher angenommen · 12:14",
        titel: "Dachfenster undicht",
        sub: "Hr. Kaya · Lindenstr. 12",
        tags: [
          { text: "Anfrage angelegt", ton: "moss" },
          { text: "Neukunde", ton: "sky" },
        ],
        felder: [
          { label: "Anliegen", wert: "tropft bei Regen" },
          { label: "Dringlichkeit", wert: "diese Woche" },
          { label: "Rückruf", wert: "ab 17 Uhr" },
        ],
        aktion: { icon: "phone", text: "Zurückrufen" },
      },
    },
    gewerke: [
      { slug: "shk", text: "Rohrbruch und Heizungsausfall gehen an die Bereitschaft, die Frage zur Wartung in den Eingang." },
      { slug: "dachdecker", text: "Wer auf dem Dach steht, telefoniert nicht. Sturmschäden landen trotzdem vollständig im Eingang." },
      { slug: "elektro-energie", text: "Störungen von Hausverwaltungen kommen mit Adresse und Dringlichkeit an." },
    ],
    kunde: {
      slug: "haustechnik-yilmaz",
      text: "Beispiel: Wie ein SHK-Betrieb Wartung und Notdienst im Griff behält.",
    },
    faq: [
      {
        frage: "Wie bekomme ich den Telefonassistenten?",
        antwort:
          "Über „Telefonassistent anfragen“. Wir richten ihn für deinen Betrieb ein und melden uns mit den nächsten Schritten. Bis er läuft, notierst du Anrufe in Sekunden in Telefon & Empfang: Nummer eintippen, Anliegen, Dringlichkeit – daraus wird direkt eine Anfrage oder ein Rückruf.",
      },
      {
        frage: "Was ist der Unterschied zu Telefon & Empfang?",
        antwort:
          "Telefon & Empfang ist der Ort, an dem alle Anrufe landen. Ohne Assistent trägst du sie dort selbst ein. Der Telefonassistent übernimmt das, wenn keiner rangehen kann. Die Einträge sehen gleich aus.",
      },
      {
        frage: "Was darf Macher am Telefon – und was nicht?",
        antwort:
          "Er sagt zu Beginn, dass er ein digitaler Assistent ist, fragt nach und schreibt auf. Preise und feste Termine sagt er nicht zu. Das entscheidest du beim Rückruf.",
      },
      {
        frage: "Brauche ich dafür eine neue Telefonanlage?",
        antwort:
          "Das klären wir bei der Einrichtung mit dir – je nachdem, welche Nummer und welches Telefon du heute nutzt.",
      },
    ],
    verwandt: ["telefon", "anfragen", "ki-buerokraft"],
  },

  /* ───────────────────────── Baustellen-App ───────────────────────── */

  "baustellen-app": {
    icon: "smartphone",
    kurz: "Der ganze Baustellentag auf dem Handy: losfahren, Zeiten, Fotos, Material, Zusatzarbeiten, Bericht und Unterschrift – auch ohne Netz.",
    enthalten: ["Einsatz", "Zeiten", "Fotos & Material", "Zusatzarbeiten", "Unterschrift"],
    meta: {
      title: "Baustellen-App für Handwerker – Zeiten, Fotos, Material, Unterschrift",
      description:
        "Die Baustellen-App von Macher OS: Zeiten laufen über den Einsatz, Fotos landen am Auftrag, Material und Zusatzarbeiten sind vor Ort erfasst, der Kunde unterschreibt auf dem Handy. Auch ohne Netz.",
    },
    hero: {
      titel: "Was auf der Baustelle passiert, ist abends schon im Büro.",
      problem:
        "Stundenzettel im Handschuhfach, Fotos auf dem privaten Handy, die Zusatzarbeit nur mündlich abgesprochen. Bei der Rechnung fehlt dann einiges.",
      loesung:
        "Mit der Baustellen-App hält dein Team alles fest, während es passiert: Zeiten laufen über den Einsatz, Fotos landen am Auftrag, Material und Zusatzarbeiten sind sofort erfasst. Der Kunde unterschreibt auf dem Handy.",
    },
    visual: {
      bereich: "Heute",
      titel: "Einsatz läuft",
      untertitel: "Dachrinne erneuern · Fam. Albers",
      kennzahlen: [
        ["2:45 h", "gearbeitet"],
        ["6", "Fotos"],
        ["12", "Teile Material"],
      ],
      liste: {
        ueberschrift: "Heute erfasst",
        zeilen: [
          { titel: "07:40 Unterwegs · 08:05 Vor Ort", sub: "Fahrtzeit und Arbeitszeit getrennt", tag: "Zeit läuft", ton: "moss" },
          { titel: "4 Fotos Dachrinne", sub: "automatisch am Auftrag", tag: "Fotos", ton: "sky" },
          { titel: "Fallrohr zusätzlich getauscht", sub: "Zusatzarbeit · Kunde ist vor Ort", tag: "Freigabe holen", ton: "signal" },
        ],
      },
      hinweis: {
        icon: "signature",
        ton: "moss",
        titel: "Zum Schluss:",
        text: "Kunde unterschreibt Bericht und Zusatzarbeit auf dem Handy. Sobald Netz da ist, sieht es das Büro.",
      },
    },
    problemTitel: "Auf der Baustelle passiert viel. Im Büro kommt wenig an.",
    probleme: [
      {
        titel: "Stundenzettel am Freitag",
        text: "Wann bin ich am Dienstag losgefahren? Die Woche wird aus dem Gedächtnis nachgetragen.",
      },
      {
        titel: "Fotos im privaten Handy",
        text: "Zwischen Urlaubsbildern liegt das Foto vom Zählerschrank. Im Büro kommt es nie an.",
      },
      {
        titel: "Zusatzarbeit per Handschlag",
        text: "„Machen Sie das gleich mit.“ Auf der Rechnung fehlt es – oder der Kunde weiß später nichts mehr davon.",
      },
      {
        titel: "Kein Netz im Keller",
        text: "Die App lädt nicht, also wird es „später“ eingetragen. Später kommt nie.",
      },
    ],
    loesung: {
      titel: "Ein Tipp pro Schritt. Den Rest macht Macher.",
      text: "Am Einsatz tippst du auf „Unterwegs“, „Vor Ort“, „Erledigt“ – die Zeit läuft mit. Fotos und Notizen landen beim Auftrag, an dem du gerade eingeplant bist. Material und Zusatzarbeiten erfasst du mit einem Tipp, der Kunde gibt sie per Unterschrift frei. Zum Schluss sprichst du deinen Bericht ein. Macher verteilt ihn auf Zeit, Material, Zusatzarbeit und Bericht – du bestätigst.",
      punkte: [
        "Zeiten über den Einsatz: Unterwegs, Vor Ort, Erledigt",
        "Fotos, Sprachnotizen und Notizen automatisch am richtigen Auftrag",
        "Material und Zusatzarbeiten direkt vor Ort erfassen",
        "Bericht einsprechen, Kunde unterschreibt auf dem Handy",
      ],
    },
    detail: {
      kopf: "Einsatz abschließen · Passt das so?",
      titel: "Dachrinne erneuern",
      sub: "Fam. Albers · Lindenweg 4",
      status: { text: "zum Prüfen", ton: "sand" },
      zeilen: [
        { label: "Ausgeführt", wert: "Rinne und Halter erneuert" },
        { label: "Zeit", wert: "1 Std. länger als geplant" },
        { label: "Material", wert: "12 Rinnenhalter" },
        { label: "Zusatzarbeit", wert: "Fallrohr getauscht" },
        { label: "Nächster Schritt", wert: "Übernehmen", hervor: true },
      ],
      fuss: {
        icon: "mic",
        text: "Aus einem gesprochenen Bericht. Macher hat ihn ohne Netz in Zeit, Material und Zusatzarbeit zerlegt.",
      },
    },
    schritte: [
      {
        titel: "Losfahren",
        text: "Einsatz öffnen, „Unterwegs“ tippen. Die Fahrtzeit läuft, der Kunde kann eine kurze Nachricht bekommen.",
      },
      {
        titel: "Vor Ort arbeiten",
        text: "Die Zeit wechselt auf Arbeit. Fotos, Material und Notizen erfasst du mit einem Tipp.",
      },
      {
        titel: "Zusatzarbeit festhalten",
        text: "Kurz beschreiben, der Kunde unterschreibt die Freigabe. Später landet sie in der Rechnung.",
      },
      {
        titel: "Abschließen",
        text: "Bericht einsprechen oder tippen, prüfen, übernehmen. Der Kunde unterschreibt Bericht oder Abnahme.",
      },
    ],
    automatisch: [
      "wechselt bei „Vor Ort“ von Fahrtzeit auf Arbeitszeit",
      "hängt Fotos und Notizen an den Auftrag, an dem du eingeplant bist",
      "beendet vergessene Zeiten zum Terminende und markiert sie zur Prüfung",
      "legt nach dem Einsatz den Bericht mit Zeiten, Material und Fotos an",
      "übernimmt freigegebene Zusatzarbeiten in die Rechnung",
      "überträgt alles, sobald wieder Netz da ist",
    ],
    geraete: {
      handy: [
        "Einsatz, Zeit, Fotos und Material mit großen Knöpfen",
        "Bericht einsprechen statt tippen",
        "Unterschrift des Kunden mit dem Finger",
      ],
      computer: [
        "Zeiten, Fotos und Material je Auftrag",
        "Zusatzarbeiten, die auf Freigabe warten",
        "Berichte drucken oder als PDF speichern",
      ],
      handyVisual: {
        kopf: "Einsatz · Vor Ort seit 08:05",
        titel: "Dachrinne erneuern",
        sub: "Fam. Albers · Lindenweg 4",
        tags: [
          { text: "Zeit läuft", ton: "moss" },
          { text: "4 Fotos", ton: "sky" },
        ],
        felder: [
          { label: "Arbeitszeit", wert: "2:45 h" },
          { label: "Material", wert: "12 Rinnenhalter" },
          { label: "Zusatzarbeit", wert: "1 wartet auf Freigabe" },
        ],
        aktion: { icon: "check", text: "Einsatz beenden" },
      },
    },
    gewerke: [
      { slug: "dachdecker", text: "Fotos vom Dach, Material vom Wagen, Unterschrift unten an der Haustür." },
      { slug: "elektriker", text: "Regiestunden und Material vor Ort festhalten – der Kunde zeichnet den Arbeitsbericht ab." },
      { slug: "galabau", text: "Draußen oft ohne Empfang: Zeiten und Fotos gehen raus, sobald wieder Netz da ist." },
    ],
    kunde: {
      slug: "dach-hansen",
      text: "Beispiel: Wie ein Dachdeckerbetrieb die Baustellendoku komplett vom Handy macht.",
    },
    faq: [
      {
        frage: "Muss ich eine App aus dem Store laden?",
        antwort:
          "Nein. Die Baustellen-App ist Macher OS im Browser deines Handys. Leg es einmal auf den Startbildschirm, dann startet es wie eine App. Was zur App für iPhone und Android geplant ist, steht auf der Seite „App“.",
      },
      {
        frage: "Funktioniert das ohne Netz?",
        antwort:
          "Ja. Einsätze ansehen, Zeiten, Fotos, Material und Unterschrift gehen auch ohne Empfang. Mit Konto wird alles übertragen, sobald wieder Netz da ist.",
      },
      {
        frage: "Wie melden sich meine Leute an?",
        antwort:
          "Mit ihrer Handynummer. Sie bekommen einen Code per SMS – ein Passwort gibt es nicht. Danach sehen sie ihre Einsätze und Aufträge.",
      },
      {
        frage: "Was ist der Unterschied zu „Mein Tag“?",
        antwort:
          "„Mein Tag“ zeigt morgens, was heute ansteht. Die Baustellen-App ist alles, was danach vor Ort passiert: Zeiten, Fotos, Material, Zusatzarbeiten, Bericht und Unterschrift.",
      },
    ],
    verwandt: ["mein-tag", "zusatzleistungen", "zeiterfassung"],
  },

  /* ───────────────────────── Cloud ───────────────────────── */

  cloud: {
    icon: "layers",
    kurz: "Deine Daten auf Servern in Frankfurt: Büro, Chef-Handy und Team arbeiten mit demselben Stand – und ohne Netz einfach weiter.",
    enthalten: ["Daten sichern", "Mehrere Geräte", "Team einladen", "Ohne Netz weiterarbeiten"],
    meta: {
      title: "Handwerkersoftware in der Cloud – überall arbeiten, Daten in Frankfurt",
      description:
        "Macher OS speichert deine Daten auf Servern in Frankfurt, DSGVO-konform mit Vertrag zur Auftragsverarbeitung. Büro, Handy und Tablet arbeiten mit demselben Stand, ohne Netz geht es weiter. Anmeldung ohne Passwort.",
    },
    hero: {
      titel: "Ein Stand. Auf jedem Gerät.",
      problem:
        "Die Kundendaten liegen auf dem Bürorechner, die Fotos auf drei Handys, die Stundenzettel im Wagen. Geht ein Gerät kaputt, ist ein Teil davon weg.",
      loesung:
        "Mit deinem Konto liegen die Daten von Macher OS auf Servern in Frankfurt. Büro, Chef-Handy und Monteure arbeiten mit demselben Stand – und ohne Netz einfach weiter.",
    },
    visual: {
      bereich: "Betrieb",
      titel: "Konto & Geräte",
      untertitel: "Alles gesichert",
      kennzahlen: [
        ["3", "Geräte"],
        ["0", "Änderungen warten"],
        ["Frankfurt", "Serverstandort"],
      ],
      liste: {
        ueberschrift: "Geräte im Betrieb",
        zeilen: [
          { titel: "Bürorechner", sub: "Jana · Büro", tag: "verbunden", ton: "moss" },
          { titel: "Handy Jonas", sub: "Monteur · nur eigene Einsätze", tag: "verbunden", ton: "moss" },
          { titel: "Tablet Wagen 2", sub: "Lukas · zuletzt vor 2 Std.", tag: "offline", ton: "sand" },
        ],
      },
      hinweis: {
        icon: "shield",
        ton: "sky",
        titel: "Gesichert:",
        text: "Alle Änderungen sind auf dem Server. Zuletzt abgeglichen um 14:32 Uhr.",
      },
    },
    problemTitel: "Daten an fünf Orten sind nirgends richtig.",
    probleme: [
      {
        titel: "Alles auf einem Rechner",
        text: "Die Kundendaten gibt es nur im Büro. Auf der Baustelle rufst du an und lässt nachschauen.",
      },
      {
        titel: "Fotos auf privaten Handys",
        text: "Jeder hat seine eigenen Bilder. Wechselt einer den Betrieb, gehen die Fotos mit.",
      },
      {
        titel: "Kein Netz, kein Programm",
        text: "Viele Online-Programme hängen, sobald der Empfang weg ist. Im Keller wird dann wieder Papier genommen.",
      },
      {
        titel: "Wo liegen meine Daten?",
        text: "Irgendwo im Internet ist keine Antwort. Du willst wissen, wo deine Kundendaten liegen und wer sie sieht.",
      },
    ],
    loesung: {
      titel: "Gesichert in Frankfurt. Dabei auf jedem Gerät.",
      text: "Leg ein Konto an – ohne Passwort, mit E-Mail oder Handynummer. Was du bisher im Browser angelegt hast, wird einmal übernommen und auf Servern in Frankfurt gespeichert. Jede Änderung kommt auf den anderen Geräten an. Ohne Netz arbeitest du weiter, abgeglichen wird, sobald wieder Empfang da ist.",
      punkte: [
        "Server in Frankfurt, mit Vertrag zur Auftragsverarbeitung nach DSGVO",
        "Büro, Chef und Team arbeiten mit demselben Stand",
        "Ohne Netz weiterarbeiten – Abgleich, sobald Empfang da ist",
        "Anmeldung ohne Passwort: Link oder Code per E-Mail oder SMS",
      ],
    },
    detail: {
      kopf: "Konto & Geräte",
      titel: "Malerbetrieb Sommer",
      sub: "Angemeldet als Chef",
      status: { text: "gesichert", ton: "moss" },
      zeilen: [
        { label: "Speicherort", wert: "Server in Frankfurt", hervor: true },
        { label: "Zuletzt abgeglichen", wert: "heute, 14:32 Uhr" },
        { label: "Wartende Änderungen", wert: "keine" },
        { label: "Im Team", wert: "6 Personen" },
        { label: "Export", wert: "jederzeit als Datei" },
      ],
      fuss: {
        icon: "shield",
        text: "Nur dein Betrieb sieht diese Daten. Rechnungen, Zahlungen und Kostensätze kommen auf den Handys der Monteure gar nicht erst an.",
      },
    },
    schritte: [
      {
        titel: "Konto anlegen",
        text: "Mit E-Mail oder Handynummer. Du bekommst einen Link oder Code – ein Passwort gibt es nicht.",
      },
      {
        titel: "Daten werden übernommen",
        text: "Was du schon im Browser angelegt hast, wird einmal hochgeladen. Du siehst den Fortschritt.",
      },
      {
        titel: "Team einladen",
        text: "Deine Leute melden sich per Einladung mit ihrer Handynummer an und sehen ihre Einsätze.",
      },
      {
        titel: "Überall weiterarbeiten",
        text: "Büro, Handy, Tablet: derselbe Stand. Und ohne Netz geht es einfach weiter.",
      },
    ],
    automatisch: [
      "gleicht jede Änderung mit allen Geräten ab",
      "merkt sich Änderungen ohne Netz und lädt sie später hoch",
      "führt Änderungen an verschiedenen Feldern zusammen",
      "zeigt im Verlauf beide Werte, wenn zwei dasselbe Feld geändert haben",
      "hält Rechnungen und Kostensätze von Monteur-Handys fern",
      "versucht es selbst weiter, wenn die Sicherung mal klemmt",
    ],
    geraete: {
      handy: [
        "Anmelden mit Handynummer und SMS-Code",
        "Ohne Netz erfassen, später abgleichen",
        "Benachrichtigungen je Gerät einschalten",
      ],
      computer: [
        "Stand der Sicherung auf einen Blick",
        "Team einladen und Rollen vergeben",
        "Daten jederzeit exportieren",
      ],
      handyVisual: {
        kopf: "Konto",
        titel: "Deine Daten sind gesichert",
        sub: "Server in Frankfurt",
        tags: [
          { text: "gesichert", ton: "moss" },
          { text: "Chef", ton: "sky" },
        ],
        felder: [
          { label: "Angemeldet mit", wert: "0171 2345678" },
          { label: "Abgleich", wert: "vor 2 Minuten" },
          { label: "Wartet", wert: "nichts" },
        ],
        aktion: { icon: "users", text: "Team einladen" },
      },
    },
    gewerke: [
      { slug: "tischler", text: "Werkstatt, Montage und Büro arbeiten mit denselben Maßen, Fotos und Terminen." },
      { slug: "bau-rohbau", text: "Im Keller kein Empfang? Zeiten und Fotos werden übertragen, sobald wieder Netz da ist." },
      { slug: "gebaeude-service", text: "Viele Leute an vielen Objekten – und alle sehen denselben Stand." },
    ],
    kunde: {
      slug: "tischlerei-weber",
      text: "Beispiel: Wie eine Tischlerei Werkstatt, Montage und Büro auf einen Stand bringt.",
    },
    faq: [
      {
        frage: "Wo liegen meine Daten?",
        antwort:
          "Auf Servern in Frankfurt, mit Vertrag zur Auftragsverarbeitung nach DSGVO. Nur dein Betrieb sieht sie. Nutzt du KI-Funktionen, geht nur der nötige Ausschnitt an den KI-Anbieter – das steht in der Datenschutzerklärung.",
      },
      {
        frage: "Muss ich etwas installieren?",
        antwort:
          "Nein. Macher OS läuft im Browser – am Rechner, auf dem Tablet und auf dem Handy. Kein Server im Keller. Auf dem Handy legst du es einmal auf den Startbildschirm, dann startet es wie eine App.",
      },
      {
        frage: "Was passiert ohne Konto?",
        antwort:
          "Du kannst Macher OS ohne Konto ausprobieren. Dann liegen die Daten nur in diesem Browser, auf anderen Geräten siehst du sie nicht. Legst du ein Konto an, werden sie einmal übernommen und gesichert.",
      },
      {
        frage: "Komme ich an meine Daten, wenn ich aufhöre?",
        antwort: "Ja. Der Export deiner Daten ist immer kostenlos – auch nach der Kündigung.",
      },
    ],
    verwandt: ["rollen-rechte", "daten-uebernehmen", "baustellen-app"],
  },

  /* ───────────────────────── Digitale Unterschrift ───────────────────────── */

  "digitale-unterschrift": {
    icon: "signature",
    kurz: "Kunden unterschreiben Abnahme, Arbeitsbericht, Zusatzarbeit und Lieferschein mit dem Finger auf dem Handy – mit Name, Ort und Uhrzeit.",
    enthalten: ["Unterschrift vor Ort", "Berichte & Nachträge", "Lieferschein quittieren", "Angebot online annehmen"],
    meta: {
      title: "Digitale Unterschrift für Handwerker – auf dem Handy unterschreiben lassen",
      description:
        "Abnahme, Arbeitsbericht, Rapport, Zusatzarbeit und Lieferschein: Der Kunde unterschreibt mit dem Finger auf dem Handy. Name, Ort und Uhrzeit stehen dabei, die Unterschrift hängt am Auftrag. Auch ohne Netz.",
    },
    hero: {
      titel: "Unterschreiben lassen, ohne Papier.",
      problem:
        "Der Arbeitsbericht klemmt am Brett, der Kuli schreibt nicht, der Durchschlag verschwindet im Auto. Und bei Streit fehlt genau das eine Blatt.",
      loesung:
        "In Macher OS unterschreibt der Kunde mit dem Finger auf dem Handy. Name, Ort und Uhrzeit stehen dabei, die Unterschrift hängt am Auftrag und steht im Ausdruck.",
    },
    visual: {
      bereich: "Aufträge",
      titel: "Dokumente am Auftrag",
      untertitel: "Küche erweitern · Fam. Neumann",
      kennzahlen: [
        ["4", "Dokumente"],
        ["3", "unterschrieben"],
        ["1", "wartet"],
      ],
      liste: {
        ueberschrift: "Zum Unterschreiben",
        zeilen: [
          { titel: "Arbeitsbericht 14.10.", sub: "6,5 Std. · Material", tag: "unterschrieben", ton: "moss" },
          { titel: "Nachtrag: zusätzliche Steckdose", sub: "Freigabe durch den Kunden", tag: "wartet", ton: "signal" },
          { titel: "Lieferschein LS-2026-031", sub: "Material geliefert", tag: "unterschrieben", ton: "moss" },
        ],
      },
      hinweis: {
        icon: "signature",
        ton: "moss",
        titel: "Unterschrieben:",
        text: "Arbeitsbericht von Petra Neumann, 15:42 Uhr. Die Unterschrift hängt am Auftrag.",
      },
    },
    problemTitel: "Papier-Unterschriften gehen genau dann verloren, wenn du sie brauchst.",
    probleme: [
      {
        titel: "Zettel, die verschwinden",
        text: "Durchschlag im Handschuhfach, Kaffeefleck drauf, irgendwann weg. Und dann fragt der Kunde nach den Stunden.",
      },
      {
        titel: "Unterschrift – aber von wem?",
        text: "Ein Kringel ohne Namen und ohne Datum. Später weiß keiner mehr, wer da unterschrieben hat.",
      },
      {
        titel: "Zusatzarbeit nur mündlich",
        text: "Vor Ort war alles klar. Bei der Rechnung wird diskutiert, weil nichts schriftlich da ist.",
      },
      {
        titel: "Abtippen im Büro",
        text: "Die unterschriebenen Zettel werden abends eingescannt, abgelegt und für die Rechnung abgetippt.",
      },
    ],
    loesung: {
      titel: "Eine Unterschrift für alles, was vor Ort bestätigt wird.",
      text: "Überall, wo der Kunde etwas bestätigen soll, gibt es dasselbe Unterschriftsfeld: bei der Abnahme, bei Arbeitsberichten, Rapporten und Prüfprotokollen, bei der Freigabe von Zusatzarbeiten und auf dem Lieferschein. Was der Kunde bestätigt, steht direkt darüber. Er unterschreibt mit dem Finger und schreibt seinen Namen dazu. Macher hält Ort und Uhrzeit fest und hängt die Unterschrift an den Auftrag.",
      punkte: [
        "Abnahme, Bericht, Nachtrag und Lieferschein unterschreiben",
        "Name in Druckbuchstaben, Ort und Uhrzeit dabei",
        "Unterschrift hängt am Auftrag und steht im Ausdruck",
        "Angebote nimmt der Kunde im Kundenbereich mit seinem Namen an",
      ],
    },
    detail: {
      kopf: "Arbeitsbericht · Unterschrift Kunde",
      titel: "Küche: Steckdosen erweitern",
      sub: "Fam. Neumann · Gartenstr. 9",
      status: { text: "unterschrieben", ton: "moss" },
      zeilen: [
        { label: "Arbeiten", wert: "3 Steckdosen, 1 Leitung" },
        { label: "Stunden", wert: "6,5 Std." },
        { label: "Bestätigt", wert: "Arbeiten und Stunden" },
        { label: "Unterschrift", wert: "Petra Neumann, 15:42 Uhr", hervor: true },
      ],
      fuss: { icon: "file", text: "Die Unterschrift ist am Auftrag gespeichert und steht im Ausdruck des Berichts." },
    },
    schritte: [
      {
        titel: "Dokument öffnen",
        text: "Bericht, Abnahme, Nachtrag oder Lieferschein – direkt am Auftrag.",
      },
      {
        titel: "Kunde liest",
        text: "Was er mit der Unterschrift bestätigt, steht direkt über dem Feld.",
      },
      {
        titel: "Unterschreiben",
        text: "Mit dem Finger auf dem Display, dazu der Name in Druckbuchstaben. Der Ort ist schon vorgeschlagen.",
      },
      {
        titel: "Weiter geht's",
        text: "Die Abnahme rückt in die Abrechnung, ein freigegebener Nachtrag in die Rechnung.",
      },
    ],
    automatisch: [
      "hält Name, Ort und Uhrzeit jeder Unterschrift fest",
      "legt die Unterschrift als Dokument am Auftrag ab",
      "setzt den Lieferschein auf „unterschrieben“",
      "übernimmt freigegebene Zusatzarbeiten in die Rechnung",
      "vermerkt am Auftrag, wenn der Kunde ein Angebot online annimmt",
      "funktioniert auch ohne Netz auf der Baustelle",
    ],
    geraete: {
      handy: [
        "Unterschrift mit dem Finger auf dem Display",
        "Was bestätigt wird, steht direkt darüber",
        "Geht auch ohne Netz",
      ],
      computer: [
        "Unterschriebene Dokumente am Auftrag",
        "Ausdruck mit Unterschrift, Name und Uhrzeit",
        "Zustimmung per E-Mail beim Nachtrag festhalten",
      ],
      handyVisual: {
        kopf: "Nachtrag · Freigabe",
        titel: "Zusätzliche Steckdose Bad",
        sub: "Fam. Neumann · heute",
        tags: [{ text: "wartet auf Freigabe", ton: "signal" }],
        felder: [
          { label: "Leistung", wert: "1 Steckdose, 3 m Leitung" },
          { label: "Name", wert: "Petra Neumann" },
          { label: "Ort", wert: "Hannover" },
        ],
        aktion: { icon: "signature", text: "Unterschreiben" },
      },
    },
    gewerke: [
      { slug: "elektriker", text: "Regieberichte und Prüfprotokolle vor Ort abzeichnen lassen." },
      { slug: "shk", text: "Rapport nach dem Kundendienst: Der Kunde unterschreibt gleich an der Haustür." },
      { slug: "maler", text: "Die zusätzliche Wand vor Ort freigeben lassen – schriftlich, bevor du anfängst." },
    ],
    kunde: {
      slug: "elektro-brandt",
      text: "Beispiel: Wie ein Elektrobetrieb Stunden und Material direkt auf dem Handy abzeichnen lässt.",
    },
    faq: [
      {
        frage: "Ist die digitale Unterschrift rechtsgültig?",
        antwort:
          "Es ist eine einfache elektronische Unterschrift: das Bild der Unterschrift mit Name, Ort und Uhrzeit, gespeichert am Auftrag. Für Abnahmen, Berichte und Nachträge ist das ein guter Nachweis. Eine qualifizierte elektronische Signatur ist es nicht. Ob du für einen Vertrag eine strengere Form brauchst, klärst du mit deinem Anwalt oder deiner Kammer.",
      },
      {
        frage: "Kann der Kunde auch aus der Ferne unterschreiben?",
        antwort:
          "Ein Angebot nimmt er im Kundenbereich an – mit seinem vollen Namen, ohne Unterschriftsfeld. Berichte, Nachträge, Abnahmen und Lieferscheine unterschreibt er vor Ort auf deinem Gerät. Hat er anders zugestimmt, etwa per E-Mail, hältst du das beim Nachtrag fest.",
      },
      {
        frage: "Was, wenn der Kunde nicht unterschreiben will?",
        antwort:
          "Einen Bericht kannst du auch ohne Unterschrift abschließen. Verweigert der Kunde die Abnahme oder lehnt er einen Nachtrag ab, hältst du das mit Grund fest.",
      },
      {
        frage: "Wo finde ich die Unterschrift später?",
        antwort: "Am Auftrag, im jeweiligen Bericht, Protokoll oder Lieferschein – und in dessen Ausdruck.",
      },
    ],
    verwandt: ["abnahme", "berichte", "zusatzleistungen"],
  },
} satisfies Partial<Record<StandardSlug, FunktionInhalt>>;
