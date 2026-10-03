import type { FunktionInhalt, StandardSlug } from "../funktionen";

export const teil6 = {
  /* ───────────────────────── Nachkalkulation & Ertrag ───────────────────────── */

  nachkalkulation: {
    icon: "chart",
    kurz: "Geplant gegen tatsächlich – je Auftrag, in ganzen Sätzen und mit dem, was du daraus für die nächste Kalkulation lernst.",
    enthalten: ["Soll und Ist je Auftrag", "Kosten am Auftrag", "Ertrag je Kunde und Leistung", "Kalkulationszeiten anpassen"],
    meta: {
      title: "Nachkalkulation für Handwerker – was hat der Auftrag wirklich gebracht?",
      description:
        "Stunden, Material und Belege gegen Angebot und Kalkulation – für jeden Auftrag, ohne Excel. Handwerk OS zeigt Abweichungen in klaren Sätzen und schlägt bessere Kalkulationszeiten vor.",
    },
    hero: {
      titel: "Du weißt bei jedem Auftrag, ob er sich gelohnt hat.",
      problem:
        "Die Nachkalkulation kostet einen Abend mit Stundenzetteln und Lieferscheinen. Also macht sie keiner – und dieselbe Leistung wird immer wieder zu knapp kalkuliert.",
      loesung:
        "Handwerk OS legt Stunden, Material und Belege neben dein Angebot. Du liest in zwei Sätzen, was passiert ist, und passt deine Zeiten mit einem Klick an.",
    },
    visual: {
      bereich: "Betrieb",
      titel: "Nachkalkulation",
      untertitel: "Abgeschlossene Aufträge",
      kennzahlen: [
        ["9", "im Plan"],
        ["3", "über Plan"],
        ["2", "unter Plan"],
      ],
      liste: {
        ueberschrift: "Zuletzt abgeschlossen",
        zeilen: [
          { titel: "A-2026-118 · Einbauschrank Flur", sub: "61 h statt 48 h geplant", wert: "+27 %", tag: "über Plan", ton: "signal" },
          { titel: "A-2026-114 · Haustür tauschen", sub: "11 h statt 12 h geplant", wert: "−8 %", tag: "im Plan", ton: "moss" },
          { titel: "A-2026-109 · Küchenfronten erneuern", sub: "22 h statt 26 h geplant", wert: "−15 %", tag: "unter Plan", ton: "sky" },
        ],
      },
      hinweis: {
        icon: "spark",
        ton: "moss",
        titel: "Daraus lernen:",
        text: "„Schrank einbauen“ dauert im Schnitt 25 % länger als kalkuliert. Auf 150 min je Stück anpassen?",
      },
    },
    problemTitel: "Ob ein Auftrag Geld gebracht hat, merkst du zu spät – oder nie.",
    probleme: [
      {
        titel: "Die BWA kommt nach Wochen",
        text: "Erst Monate später siehst du, dass das Quartal schwach war. Welcher Auftrag schuld war, steht da nicht drin.",
      },
      {
        titel: "Zahlen an drei Stellen",
        text: "Die geplanten Stunden stehen im Angebot, die echten auf Stundenzetteln, das Material auf Lieferscheinen. Keiner rechnet das zusammen.",
      },
      {
        titel: "Immer wieder zu knapp",
        text: "Der Einbau dauert jedes Mal länger als gedacht. Trotzdem steht im nächsten Angebot wieder dieselbe Zeit.",
      },
      {
        titel: "Mitten in der Baustelle ist das Budget weg",
        text: "Die Stunden laufen davon, aber keiner sagt Bescheid. Für Zusatzleistungen oder ein Gespräch mit dem Kunden ist es dann zu spät.",
      },
    ],
    loesung: {
      titel: "Soll und Ist an einer Stelle – ohne Zusammensuchen.",
      text: "Das Soll kommt aus deiner Kalkulation, dem angenommenen Angebot oder den geplanten Stunden am Auftrag. Das Ist kommt aus der Zeiterfassung, dem verbrauchten Material und den Belegen am Auftrag. Macher rechnet beides gegeneinander und sagt dir in Worten, wo es gehakt hat.",
      punkte: [
        "Stunden, Material und Gesamtkosten im Vergleich",
        "Erklärung in ganzen Sätzen statt nur Prozentzahlen",
        "Hinweis, wenn ein laufender Auftrag über Plan ist",
        "Kalkulationszeiten aus echten Aufträgen anpassen",
      ],
    },
    detail: {
      kopf: "Nachkalkulation · A-2026-118",
      titel: "Einbauschrank Flur",
      sub: "Fam. Berger · abgeschlossen am 24. September",
      status: { text: "Über Plan (+27 %)", ton: "signal" },
      zeilen: [
        { label: "Stunden", wert: "61 h statt 48 h" },
        { label: "davon Fahrtzeit", wert: "4 h" },
        { label: "Material & Belege", wert: "2.140 € statt 2.050 €" },
        { label: "Abgerechnet", wert: "7.900 € netto" },
        { label: "Deckungsbeitrag", wert: "2.310 € (29 %)", hervor: true },
      ],
      fuss: { icon: "chart", text: "Soll aus dem angenommenen Angebot. Zeiten ohne Ende wurden nicht mitgezählt." },
    },
    schritte: [
      {
        titel: "Soll steht schon da",
        text: "Aus der Kalkulation, dem angenommenen Angebot oder den geplanten Stunden. Du musst nichts extra eintragen.",
      },
      {
        titel: "Ist kommt von selbst",
        text: "Dein Team bucht Zeiten und Material am Auftrag, das Büro ordnet Belege zu. Die Kosten rechnen sich laufend neu.",
      },
      {
        titel: "Auftrag fertig – Ergebnis da",
        text: "Ist der Auftrag erledigt, liegt die Nachkalkulation in „Braucht dich“: im Plan, über Plan oder unter Plan.",
      },
      {
        titel: "Nächstes Angebot stimmt besser",
        text: "Weicht eine Leistung bei mehreren Aufträgen deutlich ab, schlägt Macher eine neue Zeit vor. Ein Klick, und sie gilt.",
      },
    ],
    automatisch: [
      "rechnet Lohn, Material und Belege je Auftrag laufend zusammen",
      "legt dir nach jedem erledigten Auftrag die Nachkalkulation vor",
      "meldet, wenn ein laufender Auftrag mehr Stunden hat als geplant",
      "schlägt neue Minuten je Leistung vor, wenn mehrere Aufträge deutlich abweichen",
      "weist darauf hin, wenn bei einem Mitarbeiter der Kostensatz fehlt",
      "zählt Abschläge, Gutschriften und Stornos beim Ertrag richtig mit",
    ],
    geraete: {
      handy: [
        "Ergebnis eines Auftrags unterwegs lesen",
        "Hinweis bei Auftrag über Plan",
        "Kalkulationszeit mit einem Tipp anpassen",
      ],
      computer: [
        "Alle laufenden und abgeschlossenen Aufträge mit Soll und Ist",
        "Ertrag je Auftrag, Kunde, Leistung und Auftragsart",
        "Kosten am Auftrag aufgeschlüsselt nach Lohn, Material und Belegen",
      ],
      handyVisual: {
        kopf: "Braucht dich · Nachkalkulation",
        titel: "A-2026-118 · Einbauschrank Flur",
        sub: "Über Plan (+27 %)",
        tags: [
          { text: "61 h statt 48 h", ton: "signal" },
          { text: "Material im Plan", ton: "moss" },
        ],
        felder: [
          { label: "Abgerechnet", wert: "7.900 € netto" },
          { label: "Deckungsbeitrag", wert: "2.310 €" },
          { label: "Soll aus", wert: "angenommenem Angebot" },
        ],
        aktion: { icon: "chart", text: "Nachkalkulation ansehen" },
      },
    },
    gewerke: [
      { slug: "tischler", text: "Einbaumöbel und Treppen: Du siehst, welche Arbeiten in der Werkstatt länger dauern als gedacht." },
      { slug: "bau", text: "Große Aufträge laufen über Wochen. Der Hinweis „über Plan“ kommt, solange du noch gegensteuern kannst." },
      { slug: "fliesenleger", text: "Quadratmeter-Leistungen werden aus echten Aufträgen nachgeschärft – das nächste Bad ist besser kalkuliert." },
    ],
    kunde: {
      slug: "tischlerei-weber",
      text: "Beispiel: Wie eine Tischlerei jeden Auftrag nachkalkuliert, ohne abends Stundenzettel in Excel zu übertragen.",
    },
    werkzeug: "deckungsbeitrags-rechner",
    faq: [
      {
        frage: "Woher kommen die geplanten Werte?",
        antwort:
          "Aus deiner Kalkulation, wenn es eine gibt. Sonst aus den geplanten Stunden am Auftrag oder aus dem angenommenen Angebot. Macher zeigt dir immer, welche Quelle gilt.",
      },
      {
        frage: "Ist der Deckungsbeitrag mein Gewinn?",
        antwort:
          "Nein. Der Deckungsbeitrag ist Umsatz minus Lohn, Material und Belege des Auftrags. Miete, Fahrzeuge und Büro sind darin nicht verteilt. Er zeigt dir aber, welche Aufträge und Kunden sich lohnen.",
      },
      {
        frage: "Sehen meine Monteure die Zahlen?",
        antwort:
          "Nein. Kosten, Ertrag und Nachkalkulation sieht nur, wer das Recht für Preise und Geld hat. Löhne der Kollegen bleiben verborgen.",
      },
      {
        frage: "Was passiert, wenn Zeiten fehlen?",
        antwort:
          "Macher sagt es dir dazu – zum Beispiel, wenn eine Zeit kein Ende hat oder bei einem Mitarbeiter der Kostensatz fehlt. So weißt du, ob du der Zahl trauen kannst.",
      },
    ],
    verwandt: ["kalkulation", "zeiterfassung", "auswertung"],
  },

  /* ───────────────────────── Auftragsabläufe ───────────────────────── */

  auftragsablaeufe: {
    icon: "route",
    kurz: "Jeder Auftrag hat einen klaren nächsten Schritt, einen Zuständigen und eine Frist – von der Anfrage bis zur Zahlung.",
    enthalten: ["Schritte je Auftragsart", "Zuständige und Fristen", "Schritt wechselt von selbst"],
    meta: {
      title: "Auftragsabläufe im Handwerk – jeder weiß, was als Nächstes dran ist",
      description:
        "Von der Anfrage bis zur Zahlung: Handwerk OS führt jeden Auftrag durch feste Schritte, erinnert den Zuständigen an Fristen und geht von selbst weiter, wenn ein Schritt erledigt ist.",
    },
    hero: {
      titel: "Kein Auftrag bleibt mehr irgendwo hängen.",
      problem:
        "Nach der Zusage passiert tagelang nichts. Das Material ist zu spät bestellt, die Rechnung wird nach der Abnahme vergessen. Wo was steht, weiß nur der Chef.",
      loesung:
        "Handwerk OS führt jeden Auftrag Schritt für Schritt. Jeder Schritt hat einen Zuständigen und eine Frist. Ist etwas erledigt, geht es von selbst weiter.",
    },
    visual: {
      bereich: "Betrieb",
      titel: "Wo stehen die Aufträge?",
      untertitel: "laufende Aufträge",
      kennzahlen: [
        ["4", "in Vorbereitung"],
        ["2", "Frist überschritten"],
        ["3", "warten auf Zahlung"],
      ],
      liste: {
        ueberschrift: "Als Nächstes",
        zeilen: [
          { titel: "Dachsanierung Kröger", sub: "Gerüst bestellen · Büro · seit 4 Tagen", tag: "überfällig", ton: "signal" },
          { titel: "Bad Familie Demir", sub: "Material bestellen · Büro · bis Freitag", tag: "Vorbereitung", ton: "sky" },
          { titel: "Heizung Wartung Lenz", sub: "Rechnung · Büro · bis morgen", tag: "Rechnung", ton: "moss" },
        ],
      },
      hinweis: {
        icon: "spark",
        ton: "moss",
        titel: "Macher hat weitergeschaltet:",
        text: "2 Aufträge auf „Warten auf Kunde“, weil die Angebote verschickt sind.",
      },
    },
    problemTitel: "Der Ablauf steht im Kopf – und der Kopf ist auf der Baustelle.",
    probleme: [
      {
        titel: "Nach der Zusage passiert nichts",
        text: "Der Kunde hat unterschrieben. Das Büro denkt, der Chef bestellt. Der Chef denkt, das Büro macht es. Eine Woche später fehlt das Material.",
      },
      {
        titel: "„Beauftragt“ sagt zu wenig",
        text: "Ist das Gerüst bestellt? Ist die Anlage beim Netzbetreiber angemeldet? Der Status in der Liste verrät es nicht.",
      },
      {
        titel: "Die Rechnung nach der Abnahme",
        text: "Die Arbeit ist fertig und abgenommen. Die Rechnung wird trotzdem erst Wochen später geschrieben – weil keiner daran erinnert.",
      },
      {
        titel: "Status von Hand gepflegt",
        text: "Wer muss wann was umstellen? Im Alltag vergisst man es. Die Liste stimmt nicht mehr, und keiner verlässt sich darauf.",
      },
    ],
    loesung: {
      titel: "Feste Schritte, klare Zuständige, Erinnerung zur rechten Zeit.",
      text: "Du startest mit Abläufen aus der Vorlage für dein Gewerk: für Projekte mit Angebot, für Kundendienst, Wartung und Reklamation. Jeder Schritt sagt, wer sich kümmert und bis wann. Macher erkennt an den Daten, wann ein Schritt erledigt ist – zum Beispiel, wenn das Angebot verschickt oder der Termin eingeplant ist.",
      punkte: [
        "Abläufe je Auftragsart, passend zu deinem Gewerk",
        "Zuständiger und Frist für jeden Schritt",
        "Schritt wechselt von selbst, wenn die Daten es zeigen",
        "Schritte anpassen und jederzeit auf die Vorlage zurücksetzen",
      ],
    },
    detail: {
      kopf: "Auftrag · Wo steht der Auftrag?",
      titel: "Dachsanierung Kröger",
      sub: "Ablauf: Projekt mit Angebot",
      status: { text: "Frist überschritten", ton: "signal" },
      zeilen: [
        { label: "Aktueller Schritt", wert: "Gerüst bestellen" },
        { label: "Seit", wert: "4 Tagen" },
        { label: "Zuständig", wert: "Jana (Büro)" },
        { label: "Danach", wert: "Material bestellen" },
        { label: "Als Nächstes", wert: "Gerüst beim Gerüstbauer bestellen", hervor: true },
      ],
      fuss: { icon: "bell", text: "Jana hat die Erinnerung in „Braucht dich“. Weiter geht es mit „Erledigt“." },
    },
    schritte: [
      {
        titel: "Ablauf aus der Vorlage",
        text: "Du wählst beim Start dein Gewerk. Die passenden Abläufe sind sofort da – ohne Einrichten.",
      },
      {
        titel: "Auftrag kommt rein",
        text: "Je nach Auftragsart gilt der passende Ablauf. Am Auftrag siehst du, wo er steht und was als Nächstes kommt.",
      },
      {
        titel: "Macher geht mit",
        text: "Angebot verschickt, Termin eingeplant, Rechnung raus: Der Schritt wechselt von selbst. Den Rest hakst du mit „Erledigt“ ab.",
      },
      {
        titel: "Frist verpasst? Erinnerung",
        text: "Liegt ein Schritt zu lange, bekommt der Zuständige einen Hinweis – nicht das ganze Team.",
      },
    ],
    automatisch: [
      "stellt nach der Zusage auf „Vorbereitung“ und fragt nach dem Materialbedarf",
      "schaltet weiter, wenn Angebot verschickt, Material da oder Termin eingeplant ist",
      "stellt nach der unterschriebenen Abnahme auf „Rechnung“",
      "schließt den Auftrag ab, wenn alles bezahlt ist",
      "erinnert den Zuständigen, wenn eine Frist überschritten ist",
      "schreibt jeden Schrittwechsel in den Verlauf des Auftrags",
    ],
    geraete: {
      handy: [
        "Sehen, wo ein Auftrag gerade steht",
        "Schritt mit „Erledigt“ abhaken",
        "Erinnerung, wenn dein Schritt fällig ist",
      ],
      computer: [
        "Abläufe je Auftragsart ansehen und anpassen",
        "Zuständige und Fristen für jeden Schritt festlegen",
        "Auf die Vorlage deines Gewerks zurücksetzen",
      ],
      handyVisual: {
        kopf: "Braucht dich · Frist überschritten",
        titel: "Dachsanierung Kröger",
        sub: "Gerüst bestellen",
        tags: [
          { text: "seit 4 Tagen", ton: "signal" },
          { text: "Büro", ton: "sky" },
        ],
        felder: [
          { label: "Kunde", wert: "Hr. Kröger" },
          { label: "Fällig war", wert: "Montag" },
          { label: "Danach", wert: "Material bestellen" },
        ],
        aktion: { icon: "check", text: "Erledigt" },
      },
    },
    gewerke: [
      { slug: "dachdecker", text: "Gerüst bestellen ist ein eigener Schritt mit Frist – bevor der erste Tag auf dem Dach geplant ist." },
      { slug: "shk", text: "„Material bestellen“ und „Material da“ stehen vor der Einplanung. Kein Einsatz ohne Ware." },
      { slug: "elektro-energie", text: "Bei Solar steht die Anmeldung beim Netzbetreiber als Schritt im Ablauf – mit Zuständigem und Frist." },
    ],
    kunde: {
      slug: "dach-hansen",
      text: "Beispiel: Wie ein Dachdecker dafür sorgt, dass Gerüst und Material stehen, bevor die Kolonne anrückt.",
    },
    faq: [
      {
        frage: "Muss ich die Abläufe selbst einrichten?",
        antwort:
          "Nein. Du startest mit den Abläufen aus der Vorlage für dein Gewerk. Wenn du willst, änderst du Schritte, Zuständige und Fristen später.",
      },
      {
        frage: "Kann ich eigene Schritte hinzufügen?",
        antwort:
          "Ja. Unter Betrieb › Einstellungen › Auftragsabläufe fügst du Schritte hinzu, benennst sie um oder löschst sie. Mit „Auf Vorlage zurücksetzen“ kommst du jederzeit zurück zum Standard.",
      },
      {
        frage: "Laufen Kundendienst und Baustelle gleich ab?",
        antwort:
          "Nein. Ein Kundendienst kommt ohne Besichtigung und Angebot aus, eine Wartung startet mit „Wartung fällig“. Jede Auftragsart hat ihren eigenen Ablauf.",
      },
      {
        frage: "Wer bekommt die Erinnerungen?",
        antwort:
          "Der Zuständige des Schritts – zum Beispiel das Büro, der Verantwortliche des Auftrags oder der eingeplante Monteur. Nicht alle auf einmal.",
      },
    ],
    verwandt: ["auftraege", "aufgaben", "automatisch-erledigen"],
  },

  /* ───────────────────────── Wissen & Anleitungen ───────────────────────── */

  firmenwissen: {
    icon: "book",
    kurz: "Was im Kopf des Meisters steckt, steht als Anleitung bereit – und taucht am passenden Auftrag von selbst auf.",
    enthalten: ["Anleitungen mit Fotos", "Herstellerlinks", "Anleitungen am Auftrag", "Vorlagen je Gewerk"],
    meta: {
      title: "Firmenwissen & Anleitungen für Handwerksbetriebe – griffbereit auf der Baustelle",
      description:
        "Wartungsabläufe, Sicherheitsregeln und Herstellerinfos an einem Ort. Handwerk OS zeigt die passende Anleitung am Auftrag und an der Anlage – auch auf dem Handy.",
    },
    hero: {
      titel: "Das Wissen deines Betriebs – für alle griffbereit.",
      problem:
        "Wie die Wartung richtig läuft, weiß der Meister. Neue Leute fragen immer dasselbe, und die Herstellerunterlagen liegen irgendwo im Büro.",
      loesung:
        "Schreib es einmal auf. Handwerk OS zeigt die passende Anleitung am Auftrag und an der Anlage – auf dem Handy, direkt vor Ort.",
    },
    visual: {
      bereich: "Betrieb",
      titel: "Wissen & Anleitungen",
      untertitel: "14 Anleitungen",
      kennzahlen: [
        ["5", "Wartung"],
        ["3", "Sicherheit"],
        ["4", "Störung"],
      ],
      liste: {
        ueberschrift: "Anleitungen",
        zeilen: [
          { titel: "Ablauf Wartung Gas-Brennwert", sub: "Wartung · Gasheizung", tag: "mit Fotos", ton: "sky" },
          { titel: "Notdienst: Heizung geht nicht – Fragen am Telefon", sub: "Störung", tag: "Büro", ton: "moss" },
          { titel: "Arbeitsunfall – was jetzt zu tun ist", sub: "Sicherheit · alle Gewerke", tag: "Pflicht", ton: "signal" },
        ],
      },
      hinweis: {
        icon: "spark",
        ton: "moss",
        titel: "Macher hat erledigt:",
        text: "Anleitung „Ablauf Wartung Gas-Brennwert“ bei 3 Wartungsaufträgen vermerkt.",
      },
    },
    problemTitel: "Wissen, das nur im Kopf steckt, fehlt genau dann, wenn man es braucht.",
    probleme: [
      {
        titel: "Alles hängt am Meister",
        text: "Wie man die Anlage richtig entlüftet oder was bei der Abnahme dazugehört, weiß einer. Ist er im Urlaub, wird es schwierig.",
      },
      {
        titel: "Neue fragen immer dasselbe",
        text: "Jeder neue Monteur stellt dieselben Fragen. Du erklärst es zum zehnten Mal – am Telefon, zwischen zwei Baustellen.",
      },
      {
        titel: "Anleitung im Ordner, Monteur im Keller",
        text: "Die Herstellerunterlagen liegen im Büro. Vor Ort sucht man im Netz und hofft, das Richtige zu finden.",
      },
      {
        titel: "Jeder macht es ein bisschen anders",
        text: "Wartung, Abnahme, Mängel aufnehmen: Ohne festen Ablauf ist die Qualität vom Tag und vom Mitarbeiter abhängig.",
      },
    ],
    loesung: {
      titel: "Einmal aufschreiben, überall finden.",
      text: "Du schreibst Anleitungen mit Überschriften, Listen und Fotos, ordnest sie einer Kategorie zu und verknüpfst sie mit Gewerk, Anlagentyp oder Leistung. Dann taucht die Anleitung von selbst am passenden Auftrag und an der Anlage auf. Zum Start gibt es Anleitungen für dein Gewerk, die du anpassen kannst.",
      punkte: [
        "Anleitungen mit Text, Fotos und Herstellerlinks",
        "Kategorien wie Wartung, Störung, Sicherheit und Abläufe im Betrieb",
        "Passende Anleitung am Auftrag und an der Anlage",
        "Suche auch im Text und nach Anlagentyp",
      ],
    },
    detail: {
      kopf: "Anleitung · Wartung",
      titel: "Ablauf Wartung Gas-Brennwert",
      sub: "Gilt für: SHK · Anlagentyp Gasheizung",
      status: { text: "am Auftrag sichtbar", ton: "moss" },
      zeilen: [
        { label: "Kategorie", wert: "Wartung" },
        { label: "Verknüpft mit", wert: "Leistung „Wartung Gastherme“" },
        { label: "Fotos", wert: "3" },
        { label: "Herstellerlinks", wert: "3" },
        { label: "Erscheint bei", wert: "Wartungsaufträgen mit Gasheizung", hervor: true },
      ],
      fuss: { icon: "book", text: "Herstellervorgaben gehen immer vor – der Link zum Hersteller ist direkt dabei." },
    },
    schritte: [
      {
        titel: "Mit Vorlagen starten",
        text: "Für dein Gewerk sind schon Anleitungen da – etwa zur Abnahme, zu Sicherheitsregeln oder zur Wartung. Du passt sie an.",
      },
      {
        titel: "Eigenes Wissen aufschreiben",
        text: "Titel, Text, Fotos, Herstellerlink. Listen und Überschriften reichen – kein Handbuch nötig.",
      },
      {
        titel: "Verknüpfen",
        text: "Gewerk, Anlagentyp oder Leistung auswählen. Daran erkennt Macher, wann die Anleitung gebraucht wird.",
      },
      {
        titel: "Vor Ort griffbereit",
        text: "Am Auftrag und an der Anlage erscheint der Reiter „Anleitungen“ – nur, wenn wirklich etwas passt.",
      },
    ],
    automatisch: [
      "vermerkt passende Anleitungen im Verlauf des Auftrags",
      "zeigt Anleitungen am Auftrag und an der Anlage, wenn Anlagentyp oder Leistung passt",
      "berücksichtigt auch Leistungen aus dem Angebot",
      "legt zum Start Anleitungen für dein Gewerk an",
      "verkleinert Fotos beim Hochladen",
    ],
    geraete: {
      handy: [
        "Anleitung am Auftrag öffnen – direkt vor Ort",
        "Fotos und Herstellerlinks ansehen",
        "Nach Stichwort oder Anlagentyp suchen",
      ],
      computer: [
        "Anleitungen schreiben und bearbeiten",
        "Fotos hochladen und Herstellerlinks hinterlegen",
        "Mit Gewerk, Anlagentyp und Leistung verknüpfen",
      ],
      handyVisual: {
        kopf: "Auftrag · Anleitungen",
        titel: "Ablauf Wartung Gas-Brennwert",
        sub: "Passt zu: Anlage Gasheizung",
        tags: [
          { text: "Wartung", ton: "sky" },
          { text: "3 Fotos", ton: "moss" },
        ],
        felder: [
          { label: "Schritt 1", wert: "Gas absperren, Gerät stromlos" },
          { label: "Schritt 2", wert: "Brenner und Wärmetauscher prüfen" },
          { label: "Hersteller", wert: "Link zum Fachpartner" },
        ],
        aktion: { icon: "book", text: "Ganze Anleitung lesen" },
      },
    },
    gewerke: [
      { slug: "shk", text: "Wartungsabläufe für Gas-Brennwert und Wärmepumpe – am Wartungsauftrag sofort zur Hand." },
      { slug: "elektriker", text: "Die fünf Sicherheitsregeln und typische Störungen wie ein auslösender FI liegen für alle bereit." },
      { slug: "dachdecker", text: "Absturzsicherung vor jedem Einsatz und die Prüfung der Dachrinne – als feste Anleitung für die Kolonne." },
    ],
    kunde: {
      slug: "haustechnik-yilmaz",
      text: "Beispiel: Wie ein SHK-Betrieb Wartungswissen festhält, damit neue Monteure nicht bei jeder Therme anrufen müssen.",
    },
    faq: [
      {
        frage: "Muss ich alles selbst schreiben?",
        antwort:
          "Nein. Zum Start legt Handwerk OS Anleitungen für dein Gewerk an, zum Beispiel zur Abnahme beim Kunden oder zum Verhalten bei einem Arbeitsunfall. Du passt sie an deinen Betrieb an.",
      },
      {
        frage: "Können meine Monteure die Anleitungen auf dem Handy lesen?",
        antwort:
          "Ja. Am Auftrag und an der Anlage gibt es den Reiter „Anleitungen“, sobald etwas passt. Text und Fotos sind fürs Handy gemacht.",
      },
      {
        frage: "Kann ich Herstellerunterlagen einbinden?",
        antwort:
          "Du hinterlegst Links zum Hersteller direkt in der Anleitung. PDF-Handbücher werden nicht eingelesen – der Link führt zur aktuellen Fassung beim Hersteller.",
      },
      {
        frage: "Ist das dasselbe wie Unterweisungen?",
        antwort:
          "Nein. Anleitungen sind Nachschlagewissen. Pflicht-Unterweisungen mit Bestätigung laufen über den Bereich Unterweisungen.",
      },
    ],
    verwandt: ["arbeitsanweisungen", "einarbeitung", "checklisten"],
  },

  /* ───────────────────────── Steuerberater & DATEV ───────────────────────── */

  datev: {
    icon: "download",
    kurz: "Rechnungen und Belege gehen im DATEV-Format an deinen Steuerberater – mit Checkliste für den Monatsabschluss.",
    enthalten: ["DATEV-Export", "Monatsabschluss", "Steuerberater-Kontakt"],
    meta: {
      title: "DATEV-Export für Handwerker – Belege sauber an den Steuerberater",
      description:
        "Ausgangsrechnungen und Belege als DATEV-Buchungsstapel exportieren, SKR03 oder SKR04. Mit Checkliste für den Monatsabschluss und Erinnerung vor der Umsatzsteuer-Voranmeldung.",
    },
    hero: {
      titel: "Schluss mit dem Schuhkarton für den Steuerberater.",
      problem:
        "Am Monatsende suchst du Belege zusammen und bringst sie in die Kanzlei. Wochen später fragt der Steuerberater nach, was fehlt.",
      loesung:
        "Handwerk OS erstellt aus Rechnungen und Belegen einen DATEV-Buchungsstapel. Eine Checkliste zeigt, ob der Monat vollständig ist.",
    },
    visual: {
      bereich: "Betrieb",
      titel: "Steuerberater & DATEV",
      untertitel: "September",
      kennzahlen: [
        ["38", "Rechnungen"],
        ["61", "Belege"],
        ["4 von 6", "Abschluss erledigt"],
      ],
      liste: {
        ueberschrift: "Monatsabschluss September",
        zeilen: [
          { titel: "Belege geprüft", sub: "Alle Belege des Monats sind geprüft.", tag: "erledigt", ton: "moss" },
          { titel: "Keine Rechnungsentwürfe offen", sub: "2 Rechnungsentwürfe liegen noch im Monat.", tag: "offen", ton: "signal" },
          { titel: "An den Steuerberater übergeben", sub: "99 Buchungen sind noch nicht exportiert.", tag: "offen", ton: "sky" },
        ],
      },
      hinweis: {
        icon: "bell",
        ton: "sky",
        titel: "Erinnerung:",
        text: "September an den Steuerberater übergeben. Die Umsatzsteuer-Voranmeldung ist meist am 10. fällig.",
      },
    },
    problemTitel: "Die Buchhaltung kostet jeden Monat Nerven – und Zeit, die keiner hat.",
    probleme: [
      {
        titel: "Belege im Handschuhfach",
        text: "Tankquittungen, Baumarkt-Bons, Rechnungen aus dem Postfach: Am Monatsende fehlt immer etwas.",
      },
      {
        titel: "Der 10. kommt schneller als gedacht",
        text: "Die Umsatzsteuer-Voranmeldung ist fällig, aber die Unterlagen sind noch nicht beim Steuerberater.",
      },
      {
        titel: "Was ist schon übergeben?",
        text: "Hast du die Rechnungen vom August schon geschickt? Oder doppelt? Das weiß im Büro keiner sicher.",
      },
      {
        titel: "Konten versteht keiner",
        text: "SKR03, Debitoren, Kreditoren: Für die Kontenzuordnung braucht es den Steuerberater – und der berechnet die Belegerfassung.",
      },
    ],
    loesung: {
      titel: "Ein Export, eine Checkliste, ein fester Ablauf.",
      text: "Du wählst den Monat, Handwerk OS zeigt Rechnungen und Belege mit Buchungen. Konten, Debitoren- und Kreditorennummern vergibt Macher selbst. Du lädst den Buchungsstapel herunter und schickst ihn deinem Steuerberater oder lädst ihn in DATEV hoch.",
      punkte: [
        "Buchungsstapel im DATEV-Format, SKR03 oder SKR04",
        "Schon exportierte Belege werden erkannt und nicht doppelt übergeben",
        "Checkliste für den Monatsabschluss",
        "Kontakt zum Steuerberater mit Anrufen und E-Mail",
      ],
    },
    detail: {
      kopf: "Export · September",
      titel: "EXTF_Buchungsstapel_20260901_20260930.csv",
      sub: "SKR03 · Berater 12345 · Mandant 678",
      status: { text: "bereit", ton: "moss" },
      zeilen: [
        { label: "Rechnungen", wert: "38" },
        { label: "Belege", wert: "61" },
        { label: "Schon exportiert", wert: "keine" },
        { label: "Neue Debitoren", wert: "4 (ab 10000)" },
        { label: "Nächster Schritt", wert: "Buchungsstapel herunterladen", hervor: true },
      ],
      fuss: { icon: "check", text: "Nach dem Export sind die Belege markiert. Ein zweiter Export ist nur bewusst möglich." },
    },
    schritte: [
      {
        titel: "Einmal einrichten",
        text: "Kontenrahmen wählen, Berater- und Mandantennummer eintragen. Die bekommst du von deinem Steuerberater.",
      },
      {
        titel: "Monat prüfen",
        text: "Die Checkliste zeigt, ob Belege geprüft, Rechnungen raus und Zeiten freigegeben sind.",
      },
      {
        titel: "Export erstellen",
        text: "Monat wählen, Vorschau ansehen, Buchungsstapel herunterladen. Fertig in wenigen Klicks.",
      },
      {
        titel: "An den Steuerberater",
        text: "Datei per E-Mail schicken oder in DATEV hochladen. Macher merkt sich, was übergeben ist.",
      },
    ],
    automatisch: [
      "vergibt Debitoren- und Kreditorennummern dauerhaft",
      "bestimmt Konten aus Belegkategorie und Steuersatz",
      "markiert exportierte Belege und Rechnungen",
      "warnt, bevor etwas doppelt übergeben wird",
      "prüft beim Monatsabschluss Belege, Rechnungsentwürfe und Zeiten",
      "erinnert ab dem 3. des Monats an den Vormonat",
    ],
    geraete: {
      handy: [
        "Erinnerung, wenn der Vormonat noch offen ist",
        "Steuerberater direkt anrufen",
        "Stand der Checkliste ansehen",
      ],
      computer: [
        "Buchungsstapel für Monat oder Zeitraum erstellen",
        "Vorschau aller Buchungen vor dem Export",
        "Liste aller bisherigen Exporte",
      ],
      handyVisual: {
        kopf: "Braucht dich · Buchhaltung",
        titel: "September an den Steuerberater übergeben",
        sub: "99 Rechnungen und Belege noch nicht exportiert",
        tags: [
          { text: "bis 10. Oktober", ton: "signal" },
          { text: "SKR03", ton: "sky" },
        ],
        felder: [
          { label: "Rechnungen", wert: "38" },
          { label: "Belege", wert: "61" },
          { label: "Checkliste", wert: "4 von 6 erledigt" },
        ],
        aktion: { icon: "download", text: "Export vorbereiten" },
      },
    },
    gewerke: [
      { slug: "bau", text: "Viele Eingangsrechnungen von Lieferanten und Subunternehmern – mit Kreditorennummern, die Macher selbst vergibt." },
      { slug: "galabau", text: "Baumarkt-Bons und Tankquittungen aus der Saison landen vollständig beim Steuerberater." },
      { slug: "maler", text: "Kleiner Betrieb, kein eigenes Büro: Die Checkliste sagt dir, was am Monatsende noch fehlt." },
    ],
    kunde: {
      slug: "gruen-werk",
      text: "Beispiel: Wie ein Gartenbaubetrieb den Monat in einem Rutsch an den Steuerberater übergibt – statt mit einer Tüte voller Belege.",
    },
    faq: [
      {
        frage: "Kann mein Steuerberater die Datei einlesen?",
        antwort:
          "Ja. Handwerk OS erstellt einen Buchungsstapel im DATEV-Format (EXTF) für den Kontenrahmen SKR03 oder SKR04. Den kann dein Steuerberater in DATEV einlesen.",
      },
      {
        frage: "Gibt es eine direkte Verbindung zu DATEV Unternehmen online?",
        antwort:
          "Noch nicht. Die direkte Übertragung ist geplant. Bis dahin lädst du den Buchungsstapel herunter und schickst ihn deinem Steuerberater oder lädst ihn in DATEV hoch.",
      },
      {
        frage: "Werden auch die Belegbilder übergeben?",
        antwort:
          "Nein. Der Export enthält die Buchungen. Belegbilder im DATEV-Format und ein Lohn-Export sind heute nicht dabei.",
      },
      {
        frage: "Was, wenn die Datei verloren geht?",
        antwort:
          "Du erstellst den Export einfach noch einmal. Macher warnt, dass die Belege schon exportiert sind, und lässt dich den Export bewusst wiederholen.",
      },
    ],
    verwandt: ["belege", "rechnungen", "schnittstellen"],
  },

  /* ───────────────────────── Schnittstellen ───────────────────────── */

  schnittstellen: {
    icon: "link",
    kurz: "Bank, DATEV, Großhandel, Ausschreibungen, Kalender und E-Mail – ehrlich angezeigt: was heute geht und was noch kommt.",
    enthalten: ["Kontoauszug einlesen", "DATANORM und GAEB", "Kalender und E-Mail", "Datenexport und Webhooks"],
    meta: {
      title: "Schnittstellen für Handwerker – DATANORM, GAEB, DATEV, Bank und Kalender",
      description:
        "Großhandelspreise per DATANORM, Leistungsverzeichnisse per GAEB, Kontoauszüge als CAMT oder CSV, DATEV-Export und Termine als Kalenderdatei. Handwerk OS zeigt offen, was heute geht und was geplant ist.",
    },
    hero: {
      titel: "Handwerk OS spricht mit deinen anderen Programmen.",
      problem:
        "Preise vom Großhändler tippst du ab, Zahlungen gleichst du von Hand ab, Termine stehen nicht im Handykalender. Und welche Schnittstelle wirklich geht, weiß keiner.",
      loesung:
        "Handwerk OS liest Großhandelsdaten, Leistungsverzeichnisse und Kontoauszüge ein und gibt Termine und Buchungen weiter. Bei jeder Verbindung steht dabei, ob sie heute geht oder geplant ist.",
    },
    visual: {
      bereich: "Betrieb",
      titel: "Schnittstellen",
      untertitel: "Verbinden",
      kennzahlen: [
        ["4", "in Gebrauch"],
        ["0", "Fehler"],
        ["10", "geplant"],
      ],
      liste: {
        ueberschrift: "In Gebrauch",
        zeilen: [
          { titel: "DATANORM", sub: "Zuletzt am 29.09.: 1.204 Artikel eingelesen", tag: "Verbunden", ton: "moss" },
          { titel: "Kontoauszug", sub: "Zuletzt eingelesen am 01.10.", tag: "Verbunden", ton: "moss" },
          { titel: "IDS Connect", sub: "Bis dahin Bestellungen in Macher anlegen", tag: "Geplant", ton: "ink" },
        ],
      },
      hinweis: {
        icon: "link",
        ton: "sky",
        titel: "Ehrlich angezeigt:",
        text: "Jede Verbindung zeigt ihren Stand als Text – verbunden, nicht verbunden, Fehler oder geplant.",
      },
    },
    problemTitel: "Ohne Schnittstellen tippst du alles zweimal.",
    probleme: [
      {
        titel: "Preislisten abtippen",
        text: "Der Großhändler schickt neue Preise. Du überträgst sie Artikel für Artikel – oder rechnest weiter mit alten.",
      },
      {
        titel: "Zahlungen von Hand abgleichen",
        text: "Kontoauszug neben der Rechnungsliste, Zeile für Zeile. Und trotzdem geht eine Mahnung an einen Kunden, der längst bezahlt hat.",
      },
      {
        titel: "Ausschreibung abschreiben",
        text: "Das Leistungsverzeichnis kommt als GAEB-Datei. Du tippst hundert Positionen ins Angebot, bevor du einen Preis einträgst.",
      },
      {
        titel: "Versprochen, aber nicht da",
        text: "Viele Programme werben mit Schnittstellen. Wenn du sie brauchst, heißt es: kommt noch.",
      },
    ],
    loesung: {
      titel: "Was heute geht – und was noch kommt.",
      text: "Heute nutzbar: Kontoauszüge als CAMT oder CSV einlesen, DATEV-Buchungsstapel exportieren, Artikel und Preise per DATANORM 4 und 5 einlesen, Leistungsverzeichnisse im Format GAEB DA XML ins Angebot übernehmen, Termine als Kalenderdatei herunterladen, Anfragen per E-Mail empfangen, alle Daten als Datei exportieren und Webhooks einrichten. Geplant und auch so gekennzeichnet: direkte Bankverbindung, Lexware Office, IDS Connect, OCI, UGL, SHK Connect, Google- und Outlook-Kalender, Telefonanlage und eine Programmierschnittstelle.",
      punkte: [
        "DATANORM: Artikel anlegen und Preise aktualisieren – ohne Doppel",
        "GAEB: Leistungsverzeichnis landet als Positionen im Angebot",
        "Kontoauszug: Zahlungen werden den Rechnungen zugeordnet",
        "Kalenderdatei: Termine mit Adresse, Kunde und Team",
      ],
    },
    detail: {
      kopf: "Schnittstelle · Großhandel",
      titel: "DATANORM",
      sub: "Artikel und Preise deines Großhändlers",
      status: { text: "Verbunden", ton: "moss" },
      zeilen: [
        { label: "Verbindungsart", wert: "Datei – keine Zugangsdaten nötig" },
        { label: "Formate", wert: "DATANORM 4 und 5" },
        { label: "Zuletzt", wert: "29.09.: 1.204 Artikel eingelesen" },
        { label: "Vorhandene Artikel", wert: "aktualisiert, nicht verdoppelt" },
        { label: "Nächster Schritt", wert: "Neue Preisdatei einlesen", hervor: true },
      ],
      fuss: { icon: "shield", text: "Bei Verbindungen über Anbieter siehst und speicherst du in Handwerk OS kein fremdes Passwort." },
    },
    schritte: [
      {
        titel: "Übersicht öffnen",
        text: "Unter Betrieb › Schnittstellen siehst du alle Verbindungen nach Bereich: Bank, Buchhaltung, Großhandel, Ausschreibungen, Kalender, E-Mail.",
      },
      {
        titel: "Datei einlesen",
        text: "DATANORM-Datei vom Großhändler, GAEB-Datei aus der Ausschreibung oder Kontoauszug aus dem Online-Banking hochladen.",
      },
      {
        titel: "Prüfen und übernehmen",
        text: "Macher zeigt, was neu ist und was sich ändert. Vorhandenes wird aktualisiert, nicht verdoppelt.",
      },
      {
        titel: "Weitergeben",
        text: "Termine als Kalenderdatei, Buchungen an DATEV, alle Daten als Datei – oder per Webhook an ein anderes Programm.",
      },
    ],
    automatisch: [
      "ordnet eingelesene Zahlungen den offenen Rechnungen zu",
      "erkennt doppelte Kontoumsätze an der Bankreferenz",
      "aktualisiert vorhandene Artikel beim DATANORM-Import, statt sie doppelt anzulegen",
      "übernimmt Mengen, Einheiten sowie Bedarfs- und Wahlpositionen aus GAEB",
      "vergibt feste Termin-IDs, damit ein neuer Kalenderimport nichts verdoppelt",
      "zeigt bei jeder Verbindung, wann sie zuletzt genutzt wurde oder was schiefging",
    ],
    geraete: {
      handy: [
        "Termine im eigenen Handykalender",
        "Stand jeder Verbindung ansehen",
        "Anfragen per E-Mail landen im Eingang",
      ],
      computer: [
        "DATANORM-, GAEB- und Kontoauszugsdateien einlesen",
        "Kalenderdatei und Datenexport herunterladen",
        "Webhooks für andere Programme einrichten",
      ],
      handyVisual: {
        kopf: "Schnittstellen · Kalender",
        titel: "Kalenderdatei",
        sub: "Termine für Outlook, Google Kalender oder iPhone",
        tags: [
          { text: "Verbunden", ton: "moss" },
          { text: "nur meine Termine", ton: "sky" },
        ],
        felder: [
          { label: "Zeitraum", wert: "ab heute" },
          { label: "Im Termin", wert: "Adresse, Kunde, Telefon, Team" },
          { label: "Zuletzt", wert: "am 30.09." },
        ],
        aktion: { icon: "download", text: "Termine exportieren" },
      },
    },
    gewerke: [
      { slug: "shk", text: "Artikel und Preise vom Großhändler per DATANORM – Rohr, Fittings und Armaturen ohne Abtippen." },
      { slug: "bau", text: "Ausschreibungen als GAEB-Datei einlesen: Die Positionen stehen im Angebot, du trägst nur noch Preise ein." },
      { slug: "elektriker", text: "Großhandelspreise aktuell halten und Termine im Handykalender der Monteure." },
    ],
    kunde: {
      slug: "elektro-brandt",
      text: "Beispiel: Wie ein Elektrobetrieb neue Großhandelspreise in Minuten einliest, statt sie Artikel für Artikel zu ändern.",
    },
    faq: [
      {
        frage: "Gibt es IDS Connect?",
        antwort:
          "Noch nicht. IDS Connect ist geplant und in der Übersicht so gekennzeichnet. Bis dahin legst du Bestellungen in Handwerk OS an und schickst sie per E-Mail. Preise holst du heute per DATANORM.",
      },
      {
        frage: "Kann ich GAEB-Dateien auch wieder ausgeben?",
        antwort:
          "Heute liest Handwerk OS GAEB DA XML ein, zum Beispiel X83 und X84, und übernimmt die Positionen ins Angebot. Die Ausgabe als X84-Datei ist geplant.",
      },
      {
        frage: "Verbindet sich Handwerk OS direkt mit meiner Bank?",
        antwort:
          "Noch nicht. Die direkte Bankverbindung ist geplant. Heute lädst du den Kontoauszug als CAMT- oder CSV-Datei aus dem Online-Banking herunter und liest ihn ein.",
      },
      {
        frage: "Komme ich an meine Daten, wenn ich wechseln will?",
        antwort:
          "Ja. Wer das Recht dazu hat, exportiert alle Daten jederzeit als Datei – lesbar für ein anderes Programm oder deinen IT-Dienstleister.",
      },
    ],
    verwandt: ["datev", "einkauf", "zahlungen"],
  },

  /* ───────────────────────── Daten übernehmen ───────────────────────── */

  "daten-uebernehmen": {
    icon: "layers",
    kurz: "Kunden, Artikel, Preise und offene Rechnungen aus Excel oder dem alten Programm übernehmen – mit Vorschau und Rückgängig.",
    enthalten: ["Kunden und Ansprechpartner", "Artikel, Leistungen und Preise", "Offene Angebote, Aufträge und Rechnungen", "Import rückgängig machen"],
    meta: {
      title: "Daten übernehmen – Wechsel zu Handwerk OS ohne Abtippen",
      description:
        "Kunden, Artikel, Preise und offene Rechnungen aus Excel oder CSV übernehmen. Handwerk OS erkennt die Spalten, findet doppelte Einträge und macht jeden Import auf Wunsch rückgängig.",
    },
    hero: {
      titel: "Wechseln, ohne alles abzutippen.",
      problem:
        "Deine Kunden, Preise und offenen Rechnungen stecken im alten Programm. Alles neu eintippen? Dafür hat keiner Zeit – also bleibt alles beim Alten.",
      loesung:
        "Du lädst eine Excel- oder CSV-Datei hoch. Handwerk OS erkennt, was drinsteht, zeigt dir eine Vorschau und übernimmt die Daten. Passt etwas nicht, machst du den Import rückgängig.",
    },
    visual: {
      bereich: "Betrieb",
      titel: "Daten übernehmen",
      untertitel: "kunden-export.csv",
      kennzahlen: [
        ["412", "neu"],
        ["17", "doppelt"],
        ["3", "mit Fehler"],
      ],
      liste: {
        ueberschrift: "Vorschau",
        zeilen: [
          { titel: "Bäckerei Hoffmann GmbH", sub: "Kd-Nr. 10233 · 79098 Freiburg", tag: "neu", ton: "moss" },
          { titel: "Sabine Krüger", sub: "steht schon in Handwerk OS", tag: "doppelt", ton: "sky" },
          { titel: "Zeile 14", sub: "E-Mail fehlt das @", tag: "Fehler", ton: "signal" },
        ],
      },
      hinweis: {
        icon: "spark",
        ton: "moss",
        titel: "Macher hat erkannt:",
        text: "Die Datei enthält Kunden. 9 Spalten sind zugeordnet – „Kd-Nr.“ als Kundennummer.",
      },
    },
    problemTitel: "Am Umzug der Daten scheitert jeder Wechsel.",
    probleme: [
      {
        titel: "Alles steckt im alten Programm",
        text: "Hunderte Kunden, eine Preisliste, offene Rechnungen. Neu eintippen dauert Wochen – also wechselt man nie.",
      },
      {
        titel: "Jedes Programm nennt es anders",
        text: "„Kd-Nr.“, „Debitor“, „Kundennummer“: Beim Import passt keine Spalte, und die Postleitzahl 01067 wird zu 1067.",
      },
      {
        titel: "Plötzlich alles doppelt",
        text: "Ein Teil der Kunden steht schon drin. Nach dem Import gibt es Frau Krüger dreimal – und keiner weiß, welche stimmt.",
      },
      {
        titel: "Falscher Import, viel Ärger",
        text: "Die falsche Datei erwischt. Jetzt heißt es: jeden Eintrag einzeln löschen.",
      },
    ],
    loesung: {
      titel: "Datei hochladen, prüfen, übernehmen.",
      text: "Handwerk OS liest Excel-Dateien (.xlsx) und CSV. Es erkennt am Inhalt, ob die Datei Kunden, Artikel, Preise oder Rechnungen enthält, und ordnet die Spalten zu. In der Vorschau siehst du jede Zeile: neu, wird aktualisiert, doppelt oder mit Fehler. Erst dann übernimmst du.",
      punkte: [
        "Kunden, Ansprechpartner, Mitarbeiter, Artikel, Leistungen und Preise",
        "Offene Angebote, Aufträge und Rechnungen mit Verweis auf den Kunden",
        "Doppelte Einträge werden erkannt und weggelassen",
        "Ganzen Import mit einem Klick rückgängig machen",
      ],
    },
    detail: {
      kopf: "Import · Offene Rechnungen",
      titel: "offene-posten.xlsx",
      sub: "Macher hat „Offene Rechnungen“ erkannt",
      status: { text: "Vorschau", ton: "sky" },
      zeilen: [
        { label: "Neu", wert: "23 Rechnungen" },
        { label: "Kunden", wert: "alle gefunden" },
        { label: "Mit Fehler", wert: "1 · Zeile 9: Betrag fehlt" },
        { label: "Fälligkeit", wert: "aus der Datei übernommen" },
        { label: "Nächster Schritt", wert: "23 Rechnungen übernehmen", hervor: true },
      ],
      fuss: { icon: "check", text: "Übernommene Rechnungen sind ab sofort im Mahnwesen. Rückgängig geht jederzeit." },
    },
    schritte: [
      {
        titel: "Datei wählen",
        text: "Excel oder CSV aus deinem alten Programm. Die erste Zeile braucht Überschriften – mehr nicht.",
      },
      {
        titel: "Macher erkennt den Inhalt",
        text: "Kunden, Artikel oder Rechnungen? Macher schaut auf Spaltennamen und Werte und schlägt die Zuordnung vor.",
      },
      {
        titel: "Vorschau prüfen",
        text: "Du siehst, was neu ist, was doppelt ist und welche Zeile einen Fehler hat – in klaren Sätzen.",
      },
      {
        titel: "Übernehmen",
        text: "Ein Klick, und die Daten sind da. Gefällt dir das Ergebnis nicht, machst du den ganzen Import rückgängig.",
      },
    ],
    automatisch: [
      "erkennt, ob die Datei Kunden, Artikel, Preise oder Rechnungen enthält",
      "ordnet Spalten zu, auch wenn sie anders heißen",
      "findet doppelte Einträge im Bestand und in der Datei",
      "repariert Excel-Eigenheiten wie Postleitzahlen ohne führende Null und Datum als Zahl",
      "verknüpft offene Rechnungen und Angebote mit dem passenden Kunden",
      "merkt sich jeden Import, damit du ihn rückgängig machen kannst",
    ],
    geraete: {
      handy: [
        "Kunden aus den Handy-Kontakten übernehmen (Android mit Chrome)",
        "Übernommene Kunden sofort unterwegs finden",
        "Kunden später nach und nach ergänzen",
      ],
      computer: [
        "Excel- oder CSV-Datei hochladen",
        "Zuordnung der Spalten prüfen und ändern",
        "Vorschau ansehen und Import rückgängig machen",
      ],
      handyVisual: {
        kopf: "Einrichten · Kunden übernehmen",
        titel: "Aus deinen Kontakten",
        sub: "Wähl die Kontakte, die Kunden sind",
        tags: [
          { text: "38 ausgewählt", ton: "moss" },
          { text: "2 schon da", ton: "sky" },
        ],
        felder: [
          { label: "Name", wert: "übernommen" },
          { label: "Telefon und E-Mail", wert: "übernommen" },
          { label: "Doppelte", wert: "werden zusammengeführt" },
        ],
        aktion: { icon: "users", text: "Kunden übernehmen" },
      },
    },
    gewerke: [
      { slug: "shk", text: "Kundenliste und offene Rechnungen aus dem alten Programm – die Wartungskunden sind sofort da." },
      { slug: "maler", text: "Die Preisliste aus Excel wird zu Leistungen. Das erste Angebot schreibst du am selben Tag." },
      { slug: "weitere-gewerke", text: "Egal, welches Programm du bisher hattest: Was als Excel oder CSV rauskommt, kommt auch rein." },
    ],
    kunde: {
      slug: "malerei-koch",
      text: "Beispiel: Wie ein Malerbetrieb Kunden und Preisliste aus Excel übernimmt und noch am selben Tag das erste Angebot verschickt.",
    },
    faq: [
      {
        frage: "Aus welchen Programmen kann ich Daten übernehmen?",
        antwort:
          "Aus jedem Programm, das Excel (.xlsx) oder CSV ausgeben kann. Kundenlisten aus Lexware und sevDesk erkennt Handwerk OS direkt an den Spaltennamen. Alte .xls-Dateien speicherst du vorher als .xlsx oder CSV.",
      },
      {
        frage: "Was passiert mit Kunden, die schon drin sind?",
        antwort:
          "Macher erkennt doppelte Einträge – im Bestand und in der Datei – und lässt sie weg. In der Vorschau siehst du genau, welche Zeilen das sind.",
      },
      {
        frage: "Kann ich einen Import zurücknehmen?",
        antwort:
          "Ja. Alles, was der Import angelegt hat, kommt in den Papierkorb. Geänderte Preise und Ansprechpartner bekommen ihren alten Stand zurück.",
      },
      {
        frage: "Muss ich alles auf einmal übernehmen?",
        antwort:
          "Nein. Fang mit dem nächsten Auftrag an und hol Kunden und Preise später. Den Import findest du jederzeit unter Betrieb › Einstellungen › Daten & Sicherung.",
      },
    ],
    verwandt: ["kunden", "material", "schnittstellen"],
  },
} satisfies Partial<Record<StandardSlug, FunktionInhalt>>;
