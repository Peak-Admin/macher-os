import type { FunktionInhalt, StandardSlug } from "../funktionen";

export const teil1 = {
  /* ───────────────────────── Orte & Baustellen ───────────────────────── */

  orte: {
    icon: "map",
    kurz: "Jede Adresse mit Zugang, Schlüssel, Parken und Ansprechpartner vor Ort – direkt am Termin.",
    enthalten: ["Einsatzorte", "Zugang & Schlüssel", "Ansprechpartner vor Ort"],
    meta: {
      title: "Orte & Baustellen verwalten – Zugang, Schlüssel und Parken für Handwerker",
      description:
        "Häuser, Wohnungen und Baustellen mit Zugang, Schlüssel, Parken und Ansprechpartner vor Ort. Dein Monteur sieht alles am Termin und startet die Navigation mit einem Tipp.",
    },
    hero: {
      titel: "Dein Monteur steht nicht mehr ratlos vor der Tür.",
      problem:
        "Wie kommt man rein? Wo liegt der Schlüssel? Wo darf man parken? Das weiß oft nur ein Kollege – und der ist gerade nicht erreichbar.",
      loesung:
        "Handwerk OS speichert zu jedem Ort, was man vor Ort wissen muss. Dein Monteur sieht es direkt am Termin und fährt mit einem Tipp los.",
    },
    visual: {
      bereich: "Aufträge",
      titel: "Orte & Baustellen",
      untertitel: "Wo ihr arbeitet",
      kennzahlen: [
        ["38", "Orte"],
        ["6", "mit laufendem Auftrag"],
        ["2", "ohne Zugangsinfos"],
      ],
      liste: {
        ueberschrift: "Mit laufendem Auftrag",
        zeilen: [
          { titel: "Lindenweg 12, Kiel", sub: "Baustelle Neubau · Bauträger Nordwerk", tag: "Laufender Auftrag", ton: "moss" },
          { titel: "Holstenstr. 40, Kiel", sub: "Bäckerei · Filiale · Fr. Clausen", tag: "Laufender Auftrag", ton: "moss" },
          { titel: "Am Hafen 3, Eckernförde", sub: "Wohnanlage · WEG Am Hafen", tag: "Ohne Zugangsinfos", ton: "sand" },
        ],
      },
      hinweis: {
        icon: "achtung",
        ton: "signal",
        titel: "Zugang klären:",
        text: "Einsatz Am Hafen 3 am Donnerstag. Es fehlt, wie das Team reinkommt und wen es anruft.",
      },
    },
    problemTitel: "Das Wissen über den Ort steckt in einzelnen Köpfen.",
    probleme: [
      {
        titel: "Der Anruf im Büro",
        text: "Der Monteur steht vor der Wohnanlage. Welche Klingel? Welcher Eingang? Er ruft im Büro an. Dort weiß es auch keiner.",
      },
      {
        titel: "Wo ist der Schlüssel?",
        text: "Beim Hausmeister, im Schlüsselsafe oder noch beim Kollegen im Auto? Bis das geklärt ist, steht die Arbeit.",
      },
      {
        titel: "Strafzettel statt Parkplatz",
        text: "Der Transporter steht in der Feuerwehrzufahrt, weil keiner wusste, dass man über den Hof fahren darf.",
      },
      {
        titel: "Rechnungsadresse statt Baustelle",
        text: "Am Auftrag steht nur die Adresse des Kunden. Gearbeitet wird aber im Ferienhaus an der Ostsee.",
      },
    ],
    loesung: {
      titel: "Ein Ort. Alles, was man vor Ort wissen muss.",
      text: "Jeder Ort gehört zu einem Kunden. Er hat eine Adresse und eine Karte „Vor Ort wichtig“: Zugang, Schlüssel, Parken, Ansprechpartner und was sonst noch zählt. Dieselbe Karte erscheint am Auftrag und am Termin.",
      punkte: [
        "Navigation starten und Ansprechpartner anrufen mit einem Tipp",
        "Zugang, Schlüssel, Parken und „Gut zu wissen“ in klaren Feldern",
        "Alle Aufträge und Anlagen am Ort auf einen Blick",
        "Ein Kunde, viele Orte – ideal für Hausverwaltungen",
      ],
    },
    detail: {
      kopf: "Ort · Baustelle",
      titel: "Lindenweg 12, Kiel",
      sub: "Baustelle Neubau · Bauträger Nordwerk",
      status: { text: "Laufender Auftrag", ton: "moss" },
      zeilen: [
        { label: "Ansprechpartner vor Ort", wert: "Polier Hr. Jensen" },
        { label: "Zugang", wert: "Bauzaun Tor 2, Code beim Polier" },
        { label: "Schlüssel", wert: "Container neben dem Kran" },
        { label: "Parken", wert: "Nur auf der Baustraße, nicht am Gehweg" },
        { label: "Gut zu wissen", wert: "Baustrom vorhanden, Toilette am Container", hervor: true },
      ],
      fuss: { icon: "map", text: "Macher hat den Ort dem neuen Auftrag automatisch zugeordnet." },
    },
    schritte: [
      {
        titel: "Ort anlegen",
        text: "Am Kunden oder in der Liste. Die Adresse des Kunden ist schon eingetragen, du änderst nur, was anders ist.",
      },
      {
        titel: "Vor-Ort-Infos eintragen",
        text: "Zugang, Schlüssel, Parken und Ansprechpartner. Kurze Sätze reichen.",
      },
      {
        titel: "Auftrag bekommt den Ort",
        text: "Hat der Kunde nur einen Ort, ordnet Macher ihn dem Auftrag zu. Die Termine übernehmen ihn.",
      },
      {
        titel: "Monteur fährt los",
        text: "Am Termin sieht er die Karte „Vor Ort wichtig“, startet die Navigation und ruft bei Bedarf vor Ort an.",
      },
    ],
    automatisch: [
      "ordnet neuen Aufträgen den einzigen Ort des Kunden zu",
      "legt den Ort aus der Kundenadresse an, wenn noch keiner da ist",
      "gibt Terminen den Ort ihres Auftrags",
      "meldet sich, wenn vor einem Einsatz an Baustelle oder Wohnanlage die Zugangsinfos fehlen",
      "meldet beauftragte Aufträge ohne Einsatzort",
      "warnt vor dem Löschen, wenn am Ort noch Aufträge laufen",
    ],
    geraete: {
      handy: [
        "Navigation mit einem Tipp starten",
        "Ansprechpartner vor Ort direkt anrufen",
        "Zugang und Schlüssel am Termin nachlesen",
      ],
      computer: [
        "Alle Orte mit Suche nach Straße, Ort und Kunde",
        "Filter: mit laufendem Auftrag oder ohne Zugangsinfos",
        "Frühere Aufträge und Anlagen am Ort ansehen",
      ],
      handyVisual: {
        kopf: "Einsatzort · heute 7:30",
        titel: "Lindenweg 12, Kiel",
        sub: "Baustelle Neubau",
        tags: [
          { text: "Baustelle", ton: "sand" },
          { text: "Baustrom", ton: "sky" },
        ],
        felder: [
          { label: "Zugang", wert: "Tor 2, Code beim Polier" },
          { label: "Parken", wert: "Baustraße" },
          { label: "Vor Ort", wert: "Polier Hr. Jensen" },
        ],
        aktion: { icon: "route", text: "Navigation starten" },
      },
    },
    gewerke: [
      { slug: "gebaeude-service", text: "Viele Objekte einer Hausverwaltung – jedes mit eigenem Zugang und Hausmeister." },
      { slug: "dachdecker", text: "Zufahrt für Kran und Container gleich beim Ort vermerkt." },
      { slug: "galabau", text: "Tor, Hund im Garten, Wasseranschluss: Was die Kolonne wissen muss, steht am Ort." },
    ],
    kunde: {
      slug: "dach-hansen",
      text: "Beispiel: Wie ein Dachdeckerbetrieb Zufahrt und Ansprechpartner jeder Baustelle festhält – statt sie morgens am Telefon zu erklären.",
    },
    faq: [
      {
        frage: "Was ist der Unterschied zwischen Kunde und Ort?",
        antwort:
          "Der Kunde bekommt die Rechnung. Am Ort wird gearbeitet. Eine Hausverwaltung ist ein Kunde mit vielen Orten. Beim Privatkunden ist der Ort meist sein Wohnhaus.",
      },
      {
        frage: "Muss ich für jeden Auftrag einen Ort auswählen?",
        antwort:
          "Nein. Hat der Kunde genau einen Ort, ordnet Macher ihn automatisch zu. Gibt es noch keinen, legt Macher ihn aus der Kundenadresse an. Nur bei mehreren Orten wählst du selbst.",
      },
      {
        frage: "Wo sieht mein Monteur die Infos?",
        antwort:
          "Am Termin und am Auftrag – in der Karte „Einsatzort“. Dort startet er auch die Navigation oder ruft den Ansprechpartner vor Ort an.",
      },
      {
        frage: "Was passiert, wenn ich einen Ort lösche?",
        antwort:
          "Er kommt in den Papierkorb und lässt sich wiederherstellen. Aufträge und Anlagen bleiben erhalten. Laufen dort noch Aufträge, weist Macher dich vorher darauf hin.",
      },
    ],
    verwandt: ["kunden", "anlagen", "fahrt-route"],
  },

  /* ───────────────────────── Anlagen ───────────────────────── */

  anlagen: {
    icon: "wrench",
    kurz: "Heizungen, Wallboxen und Maschinen mit Seriennummer, Wartung, Gewährleistung und allen Einsätzen.",
    enthalten: ["Anlagen beim Kunden", "Wartungsintervalle", "Gewährleistung"],
    meta: {
      title: "Anlagen verwalten – Seriennummer, Wartung und Gewährleistung im Blick",
      description:
        "Heizung, Wallbox oder Maschine: Typ, Seriennummer, Baujahr, Wartung und Gewährleistung an einer Stelle. Handwerk OS rechnet die nächste Wartung selbst aus und zeigt jeden früheren Einsatz.",
    },
    hero: {
      titel: "Du weißt, was beim Kunden verbaut ist – bevor du hinfährst.",
      problem:
        "Störungsanruf: Welche Therme, welches Baujahr, wann war die letzte Wartung? Keiner weiß es. Der Monteur fährt los – ohne das passende Ersatzteil.",
      loesung:
        "Handwerk OS führt jede Anlage mit Typ, Seriennummer, Wartung und Gewährleistung. Jeder Einsatz an der Anlage steht in ihrer Historie.",
    },
    visual: {
      bereich: "Aufträge",
      titel: "Anlagen",
      untertitel: "Was ihr eingebaut habt oder betreut",
      kennzahlen: [
        ["214", "Anlagen"],
        ["9", "Wartung fällig"],
        ["3", "Gewährleistung endet"],
      ],
      liste: {
        ueberschrift: "Wartung fällig",
        zeilen: [
          { titel: "Gas-Brennwerttherme", sub: "Fam. Becker · SN 7741-0932 · Baujahr 2016", tag: "überfällig", ton: "signal" },
          { titel: "Wärmepumpe Luft/Wasser", sub: "Hr. Polat · Baujahr 2021", tag: "bald fällig", ton: "sand" },
          { titel: "Wallbox 11 kW", sub: "Autohaus Kemper · Halle 2", tag: "im Plan", ton: "moss" },
        ],
      },
      hinweis: {
        icon: "shield",
        ton: "sky",
        titel: "Gewährleistung endet am 30.11.:",
        text: "Wärmepumpe bei Hr. Polat. Ein guter Zeitpunkt für einen Check oder einen Wartungsvertrag.",
      },
    },
    problemTitel: "Ohne Anlagendaten fährst du im Blindflug.",
    probleme: [
      {
        titel: "Falsches Teil im Wagen",
        text: "Der Kunde sagt „die Heizung im Keller“. Vor Ort ist es ein anderes Modell. Zweite Anfahrt, Kunde verärgert.",
      },
      {
        titel: "Seriennummer im Fotoalbum",
        text: "Irgendwer hat das Typenschild mal fotografiert. Das Foto liegt auf einem privaten Handy zwischen Urlaubsbildern.",
      },
      {
        titel: "Wartung vergessen",
        text: "Die Therme war vor 14 Monaten dran. Keiner hat es nachgetragen. Der Kunde ruft erst an, wenn sie ausfällt.",
      },
      {
        titel: "Noch Gewährleistung?",
        text: "Zahlt der Kunde die Reparatur oder geht sie auf dich? Ohne Einbaudatum ist das ein Streit mit offenem Ausgang.",
      },
    ],
    loesung: {
      titel: "Jede Anlage mit Steckbrief und Lebenslauf.",
      text: "Eine Anlage steht an einem Ort und gehört zu einem Kunden. Sie hat Hersteller, Modell, Seriennummer und Baujahr. Dazu das Wartungsintervall und das Ende der Gewährleistung. Jeder Auftrag, der mit ihr verknüpft ist, landet in ihrer Historie.",
      punkte: [
        "Typ, Hersteller, Modell, Seriennummer und Baujahr",
        "Nächste Wartung wird aus dem Intervall berechnet",
        "Gewährleistung mit Status: läuft, endet bald, abgelaufen",
        "Wartungsauftrag mit einem Klick – ohne doppelte Aufträge",
      ],
    },
    detail: {
      kopf: "Anlage · Heizungskeller",
      titel: "Gas-Brennwerttherme",
      sub: "Fam. Becker · Wohnhaus Am Brink 7",
      status: { text: "Wartung überfällig", ton: "signal" },
      zeilen: [
        { label: "Hersteller / Modell", wert: "Beispielwerk GB 24" },
        { label: "Seriennummer", wert: "7741-0932" },
        { label: "Wartung", wert: "alle 12 Monate" },
        { label: "Letzte Wartung", wert: "12.08. letzten Jahres" },
        { label: "Nächster Schritt", wert: "Wartungsauftrag anlegen", hervor: true },
      ],
      fuss: { icon: "clock", text: "Historie: 3 Einsätze – 2 Wartungen, 1 Störung." },
    },
    schritte: [
      {
        titel: "Anlage erfassen",
        text: "Am Kunden, am Ort oder direkt am Auftrag. Art wählen, Typenschild abschreiben, fertig.",
      },
      {
        titel: "Wartung festlegen",
        text: "Trag das Intervall in Monaten ein. Die nächste Wartung rechnet Handwerk OS selbst aus.",
      },
      {
        titel: "Mit dem Auftrag verknüpfen",
        text: "Am Auftrag siehst du die Anlagen am Ort und verknüpfst die richtige mit einem Tipp.",
      },
      {
        titel: "Wartung erledigt",
        text: "Ist der Wartungsauftrag fertig, trägt Macher die Wartung an der Anlage ein und plant die nächste.",
      },
    ],
    automatisch: [
      "berechnet die nächste Wartung aus Intervall und letzter Wartung",
      "trägt die Wartung nach einem erledigten Wartungsauftrag ein",
      "zeigt alle Aufträge an einer Anlage als Historie",
      "meldet sich 30 Tage, bevor die Gewährleistung endet",
      "verhindert doppelte Wartungsaufträge für dieselbe Anlage",
      "findet Anlagen auch über die Seriennummer",
    ],
    geraete: {
      handy: [
        "Neue Anlage vor Ort erfassen",
        "Seriennummer und letzte Wartung am Einsatz nachsehen",
        "Frühere Einsätze an der Anlage ansehen",
      ],
      computer: [
        "Liste mit Filter „Wartung fällig“ und „Gewährleistung endet“",
        "Wartungsauftrag mit einem Klick anlegen",
        "Anlagen am Kunden und am Ort auf einen Blick",
      ],
      handyVisual: {
        kopf: "Anlage · Am Brink 7",
        titel: "Gas-Brennwerttherme",
        sub: "Beispielwerk GB 24 · Baujahr 2016",
        tags: [
          { text: "Wartung überfällig", ton: "signal" },
          { text: "Gewährleistung abgelaufen", ton: "sand" },
        ],
        felder: [
          { label: "Seriennummer", wert: "7741-0932" },
          { label: "Letzte Wartung", wert: "vor 14 Monaten" },
          { label: "Steht in", wert: "Heizungskeller" },
        ],
        aktion: { icon: "wrench", text: "Wartungsauftrag anlegen" },
      },
    },
    gewerke: [
      { slug: "shk", text: "Therme, Wärmepumpe, Speicher: Baujahr und Wartung immer zur Hand." },
      { slug: "elektriker", text: "Wallbox, PV-Anlage und Zählerschrank mit Seriennummer und Einbaudatum." },
      { slug: "metall-maschinen", text: "Tore und Maschinen beim Kunden mit Wartungsintervall und Historie." },
    ],
    kunde: {
      slug: "haustechnik-yilmaz",
      text: "Beispiel: Wie ein SHK-Betrieb jede Heizung seiner Kunden mit Wartung und Seriennummer führt – und keine Wartung mehr vergisst.",
    },
    faq: [
      {
        frage: "Muss ich alle Anlagen auf einmal erfassen?",
        antwort:
          "Nein. Fang mit dem nächsten Einsatz an. Der Monteur erfasst die Anlage vor Ort, wenn er sowieso davor steht. So wächst die Liste nebenbei.",
      },
      {
        frage: "Wie rechnet Handwerk OS die nächste Wartung aus?",
        antwort:
          "Aus der letzten Wartung oder dem Einbaudatum plus dem Intervall in Monaten. Du kannst das Datum jederzeit von Hand ändern.",
      },
      {
        frage: "Hängt die Anlage am Kunden oder am Ort?",
        antwort:
          "An beidem. Sie steht an einem Ort und gehört zu einem Kunden. So findest du sie über den Kunden und der Monteur sieht sie am Einsatzort.",
      },
      {
        frage: "Was passiert, wenn eine Anlage ausgebaut wird?",
        antwort:
          "Du löschst sie. Sie kommt in den Papierkorb und lässt sich wiederherstellen. Die Aufträge, in denen sie vorkam, bleiben erhalten.",
      },
    ],
    verwandt: ["wartung", "orte", "servicevertraege"],
  },

  /* ───────────────────────── Besichtigungen ───────────────────────── */

  besichtigungen: {
    icon: "camera",
    kurz: "Vor-Ort-Termine planen, mit Fotos und Notizen festhalten und direkt weiter zu Aufmaß oder Angebot.",
    enthalten: ["Besichtigung planen", "Fotos & Notizen vor Ort", "Ergebnis festlegen"],
    meta: {
      title: "Besichtigungen planen und dokumentieren – Fotos, Notizen, Angebot",
      description:
        "Besichtigungstermine planen, vor Ort Fotos und Notizen am Auftrag speichern und danach mit einem Tipp zu Aufmaß oder Angebot. Handwerk OS erinnert an Besichtigungen ohne Ergebnis.",
    },
    hero: {
      titel: "Von der Besichtigung direkt zum Angebot.",
      problem:
        "Nach der Besichtigung liegen die Notizen im Auto und die Fotos auf dem privaten Handy. Das Angebot verzögert sich um Tage.",
      loesung:
        "Handwerk OS plant den Termin, speichert Fotos und Notizen gleich am Auftrag und fragt am Ende: Aufmaß, Angebot oder kein Auftrag?",
    },
    visual: {
      bereich: "Aufträge",
      titel: "Besichtigungen",
      untertitel: "Vor Ort ansehen, festhalten, Angebot vorbereiten",
      kennzahlen: [
        ["3", "ohne Termin"],
        ["4", "anstehend"],
        ["1", "Ergebnis fehlt"],
      ],
      liste: {
        ueberschrift: "Anstehend",
        zeilen: [
          { titel: "Wohnzimmer und Flur streichen", sub: "Fr. Albrecht · Do 9:00 · Tim", tag: "Geplant", ton: "sky" },
          { titel: "Fassade Mehrfamilienhaus", sub: "WEG Talstraße · Do 14:00 · Chef", tag: "Geplant", ton: "sky" },
          { titel: "Treppenhaus renovieren", sub: "Hausverwaltung Süd · gestern · 6 Fotos", tag: "Ergebnis fehlt", ton: "signal" },
        ],
      },
      hinweis: {
        icon: "calendar",
        ton: "moss",
        titel: "Besichtigung einplanen:",
        text: "Hr. Engel wartet auf einen Termin. Wunsch: nächste Woche vormittags.",
      },
    },
    problemTitel: "Die Besichtigung ist gemacht – aber das Angebot kommt nicht voran.",
    probleme: [
      {
        titel: "Zugesagt, nie eingeplant",
        text: "„Wir kommen mal vorbei.“ Dann rutscht der Termin durch. Der Kunde wartet und holt sich ein anderes Angebot.",
      },
      {
        titel: "Fotos auf dem privaten Handy",
        text: "Der Geselle hat alles fotografiert. Die Bilder liegen auf seinem Handy – und er ist ab morgen im Urlaub.",
      },
      {
        titel: "Maße auf dem Zettel",
        text: "Die Notizen stehen auf einem Block im Auto. Abends tippst du sie ab – wenn du sie noch lesen kannst.",
      },
      {
        titel: "Keiner weiß, wie es weitergeht",
        text: "War der Kunde interessiert? Gibt es ein Angebot oder nicht? Ohne festgehaltenes Ergebnis bleibt die Anfrage einfach liegen.",
      },
    ],
    loesung: {
      titel: "Planen, festhalten, weitermachen.",
      text: "Du planst die Besichtigung mit Datum, Uhrzeit, Dauer und dem, der hinfährt. Vor Ort hat er Kunde, Adresse und Telefon. Fotos und Notizen landen gleich am Auftrag. Am Ende wählt er das Ergebnis – und der nächste Schritt startet.",
      punkte: [
        "Warnung bei Überschneidung oder Abwesenheit",
        "Notiz für vor Ort: was angesehen werden soll",
        "Fotos und Notizen landen automatisch am Auftrag",
        "Ergebnis: Aufmaß erfassen, Angebot schreiben oder kein Auftrag mit Grund",
      ],
    },
    detail: {
      kopf: "Besichtigung · Do 9:00 · 1 Stunde",
      titel: "Wohnzimmer und Flur streichen",
      sub: "Fr. Albrecht · Wiesenweg 5, Freiburg",
      status: { text: "Geplant", ton: "sky" },
      zeilen: [
        { label: "Wer fährt hin?", wert: "Tim" },
        { label: "Notiz für vor Ort", wert: "Risse an der Flurdecke ansehen" },
        { label: "Fotos", wert: "noch keine" },
        { label: "Kunde", wert: "0761 / 123 45 67" },
        { label: "Danach", wert: "Ergebnis festlegen", hervor: true },
      ],
      fuss: { icon: "camera", text: "Fotos von Wänden und Decken landen automatisch am Auftrag." },
    },
    schritte: [
      {
        titel: "Besichtigung planen",
        text: "Aus der Anfrage oder in der Liste: Datum, Uhrzeit, Dauer und wer hinfährt. Überschneidungen siehst du sofort.",
      },
      {
        titel: "Vor Ort ansehen",
        text: "Adresse antippen und losfahren. Vor Ort Fotos machen und kurz notieren, was auffällt.",
      },
      {
        titel: "Ergebnis festlegen",
        text: "Aufmaß erfassen, Angebot schreiben oder kein Auftrag – mit Grund. Ein Tipp reicht.",
      },
      {
        titel: "Weiter im Auftrag",
        text: "Macher startet den nächsten Schritt. Fotos und Notizen sind schon am Auftrag.",
      },
    ],
    automatisch: [
      "setzt den Auftrag beim Planen von Anfrage auf Besichtigung",
      "warnt bei Überschneidung mit anderen Terminen und bei Abwesenheit",
      "verkleinert Fotos und speichert sie am Auftrag",
      "erinnert an Anfragen, die noch auf eine Besichtigung warten",
      "fragt nach dem Ergebnis, wenn die Besichtigung vorbei ist",
      "startet nach dem Ergebnis direkt Aufmaß oder Angebot",
    ],
    geraete: {
      handy: [
        "Fotos direkt am Termin machen",
        "Kunden anrufen und Navigation starten",
        "Ergebnis vor Ort festlegen",
      ],
      computer: [
        "Besichtigung mit Mitarbeiter, Dauer und Notiz planen",
        "Liste: ohne Termin, anstehend, Ergebnis fehlt",
        "Fotos und Notizen fürs Angebot ansehen",
      ],
      handyVisual: {
        kopf: "Besichtigung · heute 9:00",
        titel: "Wohnzimmer und Flur streichen",
        sub: "Fr. Albrecht · Wiesenweg 5",
        tags: [
          { text: "4 Fotos", ton: "sky" },
          { text: "Geplant", ton: "moss" },
        ],
        felder: [
          { label: "Worum geht's?", wert: "Risse an der Flurdecke" },
          { label: "Notiz", wert: "Decke ca. 2,80 m hoch" },
          { label: "Ergebnis", wert: "noch offen" },
        ],
        aktion: { icon: "file", text: "Angebot schreiben" },
      },
    },
    gewerke: [
      { slug: "maler", text: "Räume, Untergrund und Schäden fotografieren – das Angebot geht noch am selben Tag raus." },
      { slug: "fliesenleger", text: "Bestand und Gefälle festhalten, danach direkt ins Aufmaß." },
      { slug: "shk", text: "Heizungskeller und Leitungswege fotografieren, bevor das Angebot fürs neue Bad entsteht." },
    ],
    kunde: {
      slug: "malerei-koch",
      text: "Beispiel: Wie ein Malerbetrieb Fotos und Notizen gleich am Auftrag speichert – und das Angebot noch am Tag der Besichtigung schickt.",
    },
    werkzeug: "angebots-rechner",
    faq: [
      {
        frage: "Wo landen die Fotos von der Besichtigung?",
        antwort:
          "Am Auftrag. Sie werden beim Hochladen verkleinert, damit das Handy nicht volläuft. Im Büro siehst du sie sofort.",
      },
      {
        frage: "Kann auch ein Mitarbeiter die Besichtigung machen?",
        antwort:
          "Ja. Du wählst beim Planen, wer hinfährt. Handwerk OS warnt, wenn er zu der Zeit schon einen Termin hat oder abwesend ist.",
      },
      {
        frage: "Was passiert, wenn der Kunde doch nicht will?",
        antwort:
          "Du wählst „Kein Auftrag“ und einen Grund, zum Beispiel „Zu teuer für den Kunden“. Der Auftrag wird abgeschlossen und der Grund bleibt gespeichert.",
      },
      {
        frage: "Muss ich nach jeder Besichtigung ein Aufmaß machen?",
        antwort:
          "Nein. Hast du alles gesehen, gehst du direkt zum Angebot. Das Aufmaß ist nur ein Weg von dreien.",
      },
    ],
    verwandt: ["anfragen", "aufmass", "angebote"],
  },

  /* ───────────────────────── Aufgaben ───────────────────────── */

  aufgaben: {
    icon: "check",
    kurz: "Zurufe und Kleinkram festhalten, verteilen und abhaken – am Auftrag oder einfach so.",
    enthalten: ["Aufgaben verteilen", "Fälligkeit & Zuständigkeit", "Meine Aufgaben"],
    meta: {
      title: "Aufgaben im Handwerk verteilen und abhaken – nichts geht mehr unter",
      description:
        "Rückrufe, Bestellungen, Nacharbeiten: Aufgaben in Sekunden anlegen, einem Mitarbeiter geben und abhaken. Handwerk OS zeigt, was überfällig ist – am Auftrag und in deiner Liste.",
    },
    hero: {
      titel: "Kein „Kannst du mal …“ geht mehr verloren.",
      problem:
        "Aufgaben stehen auf Zetteln, in Chats oder nur im Kopf. Keiner weiß genau, wer sich kümmert – bis der Kunde nachfragt.",
      loesung:
        "In Handwerk OS hat jede Aufgabe einen Zuständigen und ein Datum. Wer sie hat, sieht sie in „Meine“. Überfälliges fällt sofort auf.",
    },
    visual: {
      bereich: "Aufträge",
      titel: "Aufgaben",
      untertitel: "Was zu tun ist",
      kennzahlen: [
        ["2", "überfällig"],
        ["5", "heute"],
        ["11", "nächste 7 Tage"],
      ],
      liste: {
        ueberschrift: "Heute",
        zeilen: [
          { titel: "Pflanzen für Garten Krause bestellen", sub: "A-2041 · Gartenanlage Krause · Mia", tag: "Wichtig", ton: "signal" },
          { titel: "Fr. Berger wegen Zaunfarbe zurückrufen", sub: "A-2038 · Zaun Berger · Chef", tag: "heute", ton: "sky" },
          { titel: "Rüttelplatte zur Reparatur bringen", sub: "ohne Auftrag · Paul", tag: "heute", ton: "sky" },
        ],
      },
      hinweis: {
        icon: "achtung",
        ton: "signal",
        titel: "Überfällig:",
        text: "Pflastersteine für Hof Neumann nachbestellen – bei Jonas, seit gestern.",
      },
    },
    problemTitel: "Kleine Aufgaben – großer Ärger, wenn sie liegen bleiben.",
    probleme: [
      {
        titel: "Der Zuruf auf dem Hof",
        text: "„Denk an den Rückruf bei Frau Berger.“ Zwei Baustellen später ist der Satz vergessen.",
      },
      {
        titel: "Überall ein bisschen",
        text: "Eine Aufgabe im Chat, eine auf dem Block, eine an der Pinnwand. Eine vollständige Liste gibt es nirgends.",
      },
      {
        titel: "Jeder denkt, der andere macht es",
        text: "Das Büro wartet auf den Chef, der Chef auf den Monteur. Die Bestellung geht nie raus.",
      },
      {
        titel: "Zu umständlich zum Aufschreiben",
        text: "Wenn das Notieren länger dauert als die Aufgabe selbst, lässt man es eben. Bis es teuer wird.",
      },
    ],
    loesung: {
      titel: "Eine Liste für alles, was zu tun ist.",
      text: "Eine Aufgabe ist ein Satz, ein Datum und ein Name. Sie hängt am Auftrag oder steht für sich. Jeder sieht seine eigenen Aufgaben, sortiert nach Fälligkeit. Abhaken geht mit einem großen Haken – und lässt sich rückgängig machen.",
      punkte: [
        "Anlegen in einem Feld, Fälligkeit mit „Heute“, „Morgen“ oder „In einer Woche“",
        "Zuständig und „Wichtig“ festlegen",
        "Gruppiert: überfällig, heute, nächste 7 Tage, später",
        "Am Auftrag zusammen mit den Checklisten",
      ],
    },
    detail: {
      kopf: "Aufgabe · A-2041",
      titel: "Pflanzen für Garten Krause bestellen",
      sub: "Gartenanlage Krause · Leipzig-Gohlis",
      status: { text: "Wichtig", ton: "signal" },
      zeilen: [
        { label: "Fällig am", wert: "heute" },
        { label: "Wer kümmert sich?", wert: "Mia (Büro)" },
        { label: "Notiz", wert: "Liste liegt im Auftrag bei den Fotos" },
        { label: "Angelegt von", wert: "Paul · gestern 16:40" },
        { label: "Nächster Schritt", wert: "Abhaken, wenn bestellt", hervor: true },
      ],
      fuss: { icon: "clock", text: "Im Verlauf steht, wer die Aufgabe wann angelegt, geändert und erledigt hat." },
    },
    schritte: [
      {
        titel: "Aufgabe festhalten",
        text: "Am Auftrag, in der Liste oder über „Schnell erfassen“ am Einsatz. Ein paar Worte reichen.",
      },
      {
        titel: "Verteilen",
        text: "Wähle, wer sich kümmert und bis wann. Wichtiges markierst du mit einem Haken.",
      },
      {
        titel: "Erledigen",
        text: "Jeder sieht seine Aufgaben unter „Meine“. Abhaken mit einem Tipp – aus Versehen? Rückgängig.",
      },
      {
        titel: "Nichts bleibt liegen",
        text: "Überfällige Aufgaben meldet Macher dem Zuständigen. Mit einem Knopf ist sie erledigt.",
      },
    ],
    automatisch: [
      "sortiert Aufgaben nach Wichtigkeit und Fälligkeit",
      "meldet überfällige Aufgaben dem Zuständigen",
      "zeigt auf einen Blick, wie viele Aufgaben überfällig sind",
      "schließt seine eigenen Aufgaben, wenn der Auftrag fertig ist – deine bleiben stehen",
      "hält fest, wer wann erledigt hat",
    ],
    geraete: {
      handy: [
        "Aufgabe am Einsatz in Sekunden anlegen",
        "Große Haken zum Abhaken",
        "Nur die eigenen Aufgaben unter „Meine“",
      ],
      computer: [
        "Alle offenen Aufgaben im Betrieb",
        "Zuständigkeit und Fälligkeit verteilen",
        "Suche auch in erledigten Aufgaben",
      ],
      handyVisual: {
        kopf: "Meine Aufgaben · heute",
        titel: "Fr. Berger zurückrufen",
        sub: "A-2038 · Zaun Berger",
        tags: [
          { text: "heute", ton: "sky" },
          { text: "Wichtig", ton: "signal" },
        ],
        felder: [
          { label: "Worum geht's?", wert: "Farbe für den Zaun klären" },
          { label: "Telefon", wert: "0341 / 987 65 43" },
          { label: "Angelegt von", wert: "Chef" },
        ],
        aktion: { icon: "check", text: "Erledigt" },
      },
    },
    gewerke: [
      { slug: "galabau", text: "Pflanzen bestellen, Geräte zur Reparatur, Rückrufe – alles an der richtigen Stelle." },
      { slug: "tischler", text: "Beschläge nachbestellen und Aufmaße prüfen, verteilt zwischen Werkstatt und Büro." },
      { slug: "bau", text: "Zurufe vom Bauleiter landen als Aufgabe beim richtigen Mann." },
    ],
    kunde: {
      slug: "gruen-werk",
      text: "Beispiel: Wie ein Gartenbaubetrieb Zurufe aus der Kolonne als Aufgaben festhält – und das Büro nicht mehr hinterhertelefoniert.",
    },
    faq: [
      {
        frage: "Was ist der Unterschied zwischen Aufgabe und Checkliste?",
        antwort:
          "Eine Aufgabe ist etwas Einzelnes: ein Rückruf, eine Bestellung. Eine Checkliste führt durch wiederkehrende Schritte, zum Beispiel bei jeder Wartung. Am Auftrag siehst du beides zusammen.",
      },
      {
        frage: "Muss jede Aufgabe an einem Auftrag hängen?",
        antwort: "Nein. Aufgaben ohne Auftrag gehen genauso, zum Beispiel „Transporter zum TÜV bringen“.",
      },
      {
        frage: "Was passiert mit Aufgaben, wenn der Auftrag fertig ist?",
        antwort:
          "Aufgaben, die Macher selbst angelegt hat, schließt er mit dem Auftrag. Deine eigenen bleiben stehen, bis du sie abhakst.",
      },
      {
        frage: "Kann ich eine Aufgabe wieder öffnen?",
        antwort:
          "Ja. Direkt nach dem Abhaken über „Rückgängig“ oder später auf der Aufgabe mit „Wieder öffnen“. Gelöschte Aufgaben liegen im Papierkorb.",
      },
    ],
    verwandt: ["checklisten", "schnell-erfassen", "mein-tag"],
  },

  /* ───────────────────────── Checklisten ───────────────────────── */

  checklisten: {
    icon: "clipboard",
    kurz: "Wiederkehrende Arbeits- und Prüfschritte abhaken – mit Pflichtpunkten und Fotos als Nachweis.",
    enthalten: ["Vorlagen je Gewerk", "Pflichtpunkte", "Fotos als Nachweis"],
    meta: {
      title: "Checklisten für Handwerker – Prüfschritte abhaken, Fotos als Nachweis",
      description:
        "Fertige Checklisten-Vorlagen fürs Gewerk, Pflichtpunkte und Foto-Nachweis direkt am Auftrag. Handwerk OS hängt die passende Checkliste an, sobald ein Auftrag beauftragt ist.",
    },
    hero: {
      titel: "Vor Ort wird nichts mehr vergessen.",
      problem:
        "Ein Schritt vergessen, und du fährst ein zweites Mal raus. Gibt es später Streit, fehlt das Foto als Nachweis.",
      loesung:
        "Handwerk OS hängt die passende Checkliste an den Auftrag. Der Monteur hakt am Handy ab und macht Fotos direkt am Punkt.",
    },
    visual: {
      bereich: "Aufträge",
      titel: "Checklisten",
      untertitel: "Offen an laufenden Aufträgen",
      kennzahlen: [
        ["7", "offen"],
        ["2", "Pflichtpunkte offen"],
        ["12", "Vorlagen"],
      ],
      liste: {
        ueberschrift: "Offen an laufenden Aufträgen",
        zeilen: [
          { titel: "Dacharbeiten: Sicherheit", sub: "A-1187 · Neueindeckung Schulz", tag: "4/5", ton: "sky" },
          { titel: "Baustelle: Abschluss und Übergabe", sub: "A-1172 · Gaube Petersen", tag: "1 Pflicht offen", ton: "signal" },
          { titel: "Dachwartung", sub: "A-1190 · WEG Förde", tag: "6/6", ton: "moss" },
        ],
      },
      hinweis: {
        icon: "achtung",
        ton: "signal",
        titel: "Gaube Petersen:",
        text: "1 Pflichtpunkt vor der Abnahme offen – Fotos vom fertigen Zustand fehlen.",
      },
    },
    problemTitel: "Jeder macht es ein bisschen anders. Und jeder vergisst mal was.",
    probleme: [
      {
        titel: "Die zweite Anfahrt",
        text: "Siphon nicht befüllt, Verteiler nicht beschriftet. Ein vergessener Handgriff kostet einen halben Tag.",
      },
      {
        titel: "Kein Nachweis",
        text: "Der Kunde behauptet, der Schaden war vorher nicht da. Ein Foto vom Ausgangszustand hat keiner gemacht.",
      },
      {
        titel: "Papier im Fußraum",
        text: "Die Prüfliste ist nass, zerknittert oder nie im Büro angekommen.",
      },
      {
        titel: "Der neue Kollege",
        text: "Er weiß nicht, was bei euch dazugehört. Bis er es gelernt hat, schwankt die Qualität.",
      },
    ],
    loesung: {
      titel: "Die richtige Checkliste – automatisch am Auftrag.",
      text: "Zum Start gibt es Vorlagen für dein Gewerk, zum Beispiel für Kundendienst, Baustellenstart oder Übergabe. Sobald ein Auftrag beauftragt ist, hängt Macher die passenden an. Der Monteur hakt ab, Pflichtpunkte und Foto-Punkte sind klar markiert.",
      punkte: [
        "Fertige Vorlagen je Gewerk und Auftragsart",
        "Pflichtpunkte vor der Abnahme",
        "Punkte, die erst mit Foto als erledigt gelten",
        "Wer wann abgehakt hat, steht am Punkt",
      ],
    },
    detail: {
      kopf: "Checkliste · A-1172",
      titel: "Baustelle: Abschluss und Übergabe",
      sub: "Gaube Petersen · Kiel-Holtenau",
      status: { text: "5 von 6 erledigt", ton: "sky" },
      zeilen: [
        { label: "Restarbeiten erledigt", wert: "Jannik · heute 10:12" },
        { label: "Baustelle geräumt", wert: "Jannik · heute 11:40" },
        { label: "Stunden und Material erfasst", wert: "Ole · heute 12:05" },
        { label: "Unterlagen übergeben", wert: "Ole · heute 12:10" },
        { label: "Fotos vom fertigen Zustand", wert: "Pflicht · Foto fehlt", hervor: true },
      ],
      fuss: { icon: "camera", text: "Fotos an Checklisten-Punkten landen automatisch am Auftrag." },
    },
    schritte: [
      {
        titel: "Vorlagen prüfen",
        text: "Zum Start sind Vorlagen für dein Gewerk da. Du passt Punkte an, markierst Pflicht und Foto oder legst eigene an.",
      },
      {
        titel: "Auftrag wird beauftragt",
        text: "Macher hängt die passenden Checklisten an – je nach Gewerk und Auftragsart.",
      },
      {
        titel: "Vor Ort abhaken",
        text: "Der Monteur öffnet die Checkliste am Termin, hakt ab und macht Fotos direkt am Punkt.",
      },
      {
        titel: "Vor der Abnahme",
        text: "Sind noch Pflichtpunkte offen, zeigt Macher sie dir – bevor der Kunde abnimmt.",
      },
    ],
    automatisch: [
      "hängt passende Checklisten an, sobald der Auftrag beauftragt ist",
      "hängt jede Vorlage höchstens einmal an",
      "speichert Fotos an Checklisten-Punkten am Auftrag",
      "notiert, wer wann abgehakt hat",
      "meldet offene Pflichtpunkte vor Abnahme und Abrechnung",
      "ändert laufende Checklisten nicht, wenn du eine Vorlage anpasst",
    ],
    geraete: {
      handy: [
        "Checkliste am Termin öffnen und abhaken",
        "Foto direkt am Punkt machen",
        "Fortschritt auf einen Blick",
      ],
      computer: [
        "Vorlagen anlegen und anpassen",
        "Alle offenen Checklisten an laufenden Aufträgen",
        "Sehen, wie weit die Baustelle ist",
      ],
      handyVisual: {
        kopf: "Checkliste · heute",
        titel: "Dacharbeiten: Sicherheit",
        sub: "A-1187 · Neueindeckung Schulz",
        tags: [
          { text: "4 von 5", ton: "sky" },
          { text: "1 Pflicht offen", ton: "signal" },
        ],
        felder: [
          { label: "Gerüst geprüft", wert: "erledigt · Jannik" },
          { label: "Absturzsicherung", wert: "erledigt · Ole" },
          { label: "Foto Anschlagpunkte", wert: "fehlt" },
        ],
        aktion: { icon: "camera", text: "Foto machen" },
      },
    },
    gewerke: [
      { slug: "elektriker", text: "Erstprüfung nach DIN VDE 0100-600 Schritt für Schritt – keine Messung wird vergessen." },
      { slug: "shk", text: "Wartung der Gas-Brennwertheizung und Druckprobe mit Foto vom Manometer." },
      { slug: "dachdecker", text: "Sicherheit auf dem Dach vor dem ersten Handgriff abhaken." },
    ],
    kunde: {
      slug: "dach-hansen",
      text: "Beispiel: Wie ein Dachdeckerbetrieb Sicherheit und Übergabe mit Checklisten und Fotos vom Handy dokumentiert.",
    },
    faq: [
      {
        frage: "Muss ich die Checklisten selbst schreiben?",
        antwort:
          "Nein. Zum Start gibt es Vorlagen für viele Gewerke, etwa Kundendienst-Einsatz, Baustellenstart und Übergabe. Du kannst sie ändern oder eigene anlegen.",
      },
      {
        frage: "Was passiert, wenn ein Pflichtpunkt nicht passt?",
        antwort:
          "Pflichtpunkte sperren nichts. Bleibt einer offen, bekommst du vor der Abnahme einen Hinweis und entscheidest selbst.",
      },
      {
        frage: "Ändert sich eine laufende Checkliste, wenn ich die Vorlage anpasse?",
        antwort:
          "Nein. Änderungen an der Vorlage gelten nur für neue Checklisten. Was der Monteur gerade abhakt, bleibt, wie es ist.",
      },
      {
        frage: "Kann ich eine weitere Checkliste von Hand dazunehmen?",
        antwort:
          "Ja. Am Auftrag oder am Termin wählst du eine Vorlage aus und startest sie. Das Büro sieht danach, wie weit sie abgehakt ist.",
      },
    ],
    verwandt: ["dokumentation", "abnahme", "arbeitsanweisungen"],
  },

  /* ───────────────────────── Arbeitsanweisungen ───────────────────────── */

  arbeitsanweisungen: {
    icon: "book",
    kurz: "Ziel, Sicherheit und Schritte mit Fotos – damit der Monteur vor Ort weiß, was zu tun ist.",
    enthalten: ["Schritte mit Fotos", "Sicherheitshinweise", "Gelesen und verstanden"],
    meta: {
      title: "Arbeitsanweisungen für Monteure – klar, kurz, mit Fotos",
      description:
        "Schreib in wenigen Schritten auf, was vor Ort zu tun ist: Ziel, Sicherheit, Schritte mit Fotos. Dein Monteur sieht die Anweisung am Termin und bestätigt, dass er sie gelesen hat.",
    },
    hero: {
      titel: "Dein Monteur weiß, was zu tun ist – ohne Anruf.",
      problem:
        "„Was soll ich hier eigentlich machen?“ Das Wissen steckt im Kopf vom Chef oder Bauleiter. Was bei der Besichtigung besprochen wurde, kommt vor Ort nicht an.",
      loesung:
        "In Handwerk OS schreibst du kurz das Ziel, die Sicherheitshinweise und die Schritte auf – mit Fotos. Der Monteur sieht alles am Termin.",
    },
    visual: {
      bereich: "Aufträge",
      titel: "Arbeitsanweisungen",
      untertitel: "Was vor Ort zu tun ist",
      kennzahlen: [
        ["5", "an laufenden Aufträgen"],
        ["4", "Vorlagen"],
        ["1", "fehlt vor Einsatz"],
      ],
      liste: {
        ueberschrift: "An laufenden Aufträgen",
        zeilen: [
          { titel: "So geht's: Einbauküche Familie Roth", sub: "A-3105 · 6 Schritte · 2 Sicherheitshinweise", tag: "gelesen", ton: "moss" },
          { titel: "So geht's: Haustür Austausch", sub: "A-3111 · 5 Schritte", tag: "nicht gelesen", ton: "sand" },
          { titel: "Baustelle: Tagesablauf", sub: "A-3098 · Innenausbau Praxis", tag: "gelesen", ton: "moss" },
        ],
      },
      hinweis: {
        icon: "book",
        ton: "sky",
        titel: "Einsatz morgen, keine Anweisung:",
        text: "Treppe Hofmann. Ein Klick legt sie aus der passenden Vorlage an.",
      },
    },
    problemTitel: "Was zu tun ist, weiß oft nur einer.",
    probleme: [
      {
        titel: "Der Anruf um sieben",
        text: "Der Monteur steht beim Kunden und ruft an: „Was genau soll hier rein?“ Der Chef steht selbst auf einer Baustelle.",
      },
      {
        titel: "Infos von der Besichtigung fehlen",
        text: "Der Kunde wollte die Küche drei Zentimeter höher. Gesagt wurde es nur bei der Besichtigung.",
      },
      {
        titel: "Gefahren nicht bekannt",
        text: "Feuchter Keller, alte Leitungen, Asbestverdacht. Wer es nicht weiß, geht ein Risiko ein.",
      },
      {
        titel: "Lange Texte liest keiner",
        text: "Eine Seite Fließtext auf dem Handy, mit dreckigen Händen? Die wird überflogen – oder gar nicht gelesen.",
      },
    ],
    loesung: {
      titel: "Ziel. Sicherheit. Schritte. Fertig.",
      text: "Eine Arbeitsanweisung ist kurz: Was soll am Ende fertig sein? Worauf muss man achten? Welche Schritte in welcher Reihenfolge? Zu jedem Schritt passt ein Foto. Der Monteur sieht die Anweisung am Termin und bestätigt mit „Gelesen und verstanden“.",
      punkte: [
        "Ziel aus der Auftragsbeschreibung vorbefüllt",
        "Sicherheitshinweise gut sichtbar oben",
        "Nummerierte Schritte mit Foto oder Skizze",
        "Vorlagen für Abläufe, die immer wiederkommen",
      ],
    },
    detail: {
      kopf: "Arbeitsanweisung · A-3105",
      titel: "So geht's: Einbauküche Familie Roth",
      sub: "Am Wertachufer 9, Augsburg",
      status: { text: "gelesen", ton: "moss" },
      zeilen: [
        { label: "Ziel", wert: "Küche montiert, Arbeitsplatte 3 cm höher als Standard" },
        { label: "Sicherheit", wert: "Wasser abdrehen vor Anschluss Spüle" },
        { label: "Schritte", wert: "6, davon 3 mit Foto" },
        { label: "Gelesen von", wert: "Max · heute 6:52" },
        { label: "Einsatz", wert: "heute 7:30 · Max, Lea", hervor: true },
      ],
      fuss: { icon: "camera", text: "Fotos zu den Schritten liegen auch am Auftrag." },
    },
    schritte: [
      {
        titel: "Anweisung anlegen",
        text: "Am Auftrag im Tab „Arbeitsanweisung“ – leer oder aus einer Vorlage. Das Ziel steht schon drin.",
      },
      {
        titel: "Schritte aufschreiben",
        text: "Ein Satz pro Schritt. Foto dazu, Reihenfolge verschieben, Sicherheitshinweise oben eintragen.",
      },
      {
        titel: "Monteur liest am Termin",
        text: "Die Anweisung erscheint am Termin. Große Schrift, klare Reihenfolge.",
      },
      {
        titel: "Gelesen und verstanden",
        text: "Der Monteur bestätigt mit einem Tipp. Du siehst, wer es wann gelesen hat.",
      },
    ],
    automatisch: [
      "meldet sich, wenn in den nächsten zwei Tagen ein Einsatz ansteht und keine Anweisung da ist",
      "legt die Anweisung mit einem Klick aus der passenden Vorlage an",
      "übernimmt das Ziel aus der Auftragsbeschreibung",
      "zeigt die Anweisung direkt am Termin",
      "speichert Fotos zu den Schritten am Auftrag",
      "hält fest, wer die Anweisung wann gelesen hat",
    ],
    geraete: {
      handy: [
        "Anweisung am Termin lesen",
        "Fotos zu jedem Schritt ansehen",
        "„Gelesen und verstanden“ bestätigen",
      ],
      computer: [
        "Anweisung schreiben und Schritte sortieren",
        "Vorlagen für wiederkehrende Abläufe pflegen",
        "Sehen, wer die Anweisung gelesen hat",
      ],
      handyVisual: {
        kopf: "Arbeitsanweisung · heute 7:30",
        titel: "Einbauküche Familie Roth",
        sub: "A-3105 · Am Wertachufer 9",
        tags: [
          { text: "6 Schritte", ton: "sky" },
          { text: "Sicherheit", ton: "signal" },
        ],
        felder: [
          { label: "Ziel", wert: "Küche montiert, Platte 3 cm höher" },
          { label: "Schritt 1", wert: "Altküche abbauen, Wände prüfen" },
          { label: "Schritt 2", wert: "Unterschränke ausrichten (Foto)" },
        ],
        aktion: { icon: "check", text: "Gelesen und verstanden" },
      },
    },
    gewerke: [
      { slug: "tischler", text: "Montage von Küchen, Treppen und Türen mit Fotos, wie es am Ende aussehen soll." },
      { slug: "elektriker", text: "„Spannungsfrei schalten und sichern“ steht ganz oben – vor dem ersten Schritt." },
      { slug: "bau", text: "Tagesablauf auf der Baustelle als Vorlage – für eigene Leute und Subunternehmer." },
    ],
    kunde: {
      slug: "tischlerei-weber",
      text: "Beispiel: Wie eine Tischlerei Montagen in wenigen Schritten mit Fotos beschreibt – und der Werkstattleiter morgens weniger Anrufe bekommt.",
    },
    faq: [
      {
        frage: "Wie lange dauert es, eine Anweisung zu schreiben?",
        antwort:
          "Ein paar Minuten. Das Ziel steht schon aus der Auftragsbeschreibung drin. Mit einer Vorlage sind die üblichen Schritte und Sicherheitshinweise auch schon da.",
      },
      {
        frage: "Wo sieht der Monteur die Anweisung?",
        antwort: "Am Termin auf dem Handy und am Auftrag im Tab „Arbeitsanweisung“.",
      },
      {
        frage: "Woher weiß ich, ob er sie gelesen hat?",
        antwort:
          "Der Monteur tippt auf „Gelesen und verstanden“. An der Anweisung siehst du Name und Uhrzeit.",
      },
      {
        frage: "Was ist der Unterschied zur Checkliste?",
        antwort:
          "Die Anweisung erklärt, was bei diesem Auftrag zu tun ist. Die Checkliste prüft, ob die üblichen Schritte erledigt sind. Beides zusammen passt gut.",
      },
    ],
    verwandt: ["checklisten", "firmenwissen", "einarbeitung"],
  },

  /* ───────────────────────── Schnell erfassen ───────────────────────── */

  "schnell-erfassen": {
    icon: "bolt",
    kurz: "Foto, Notiz, Zeit oder Material in Sekunden festhalten – direkt beim richtigen Auftrag.",
    enthalten: ["Fotos & Notizen", "Zeit & Material", "Mangel & Zusatzleistung"],
    meta: {
      title: "Schnell erfassen auf der Baustelle – Foto, Notiz, Zeit und Material",
      description:
        "Foto, Sprachnotiz, Zeit, Material oder Zusatzleistung in wenigen Sekunden erfassen. Handwerk OS wählt den Auftrag aus, an dem du gerade arbeitest – nichts landet mehr im privaten Handy.",
    },
    hero: {
      titel: "Festhalten, solange du noch dran denkst.",
      problem:
        "Fotos landen im privaten Handy, Material wird vergessen, Zeiten trägst du abends aus dem Kopf nach. Erfassen dauert zu lange – also schiebt man es auf.",
      loesung:
        "In Handwerk OS tippst du am Einsatz auf „Foto“, „Notiz“ oder „Material“. Der Auftrag ist schon gewählt. Nach wenigen Sekunden ist es gespeichert.",
    },
    visual: {
      bereich: "Heute",
      titel: "Erfassen",
      untertitel: "Dein Einsatz jetzt",
      kennzahlen: [
        ["7", "Fotos heute"],
        ["3", "Material gebucht"],
        ["5:40 h", "Zeit läuft"],
      ],
      liste: {
        ueberschrift: "Heute erfasst",
        zeilen: [
          { titel: "Foto: Zählerschrank vorher", sub: "A-4412 · Wallbox Meyer · 08:12", tag: "Foto", ton: "sky" },
          { titel: "NYM-J 5×6 mm², 18 m", sub: "A-4412 · 09:40", tag: "Material", ton: "moss" },
          { titel: "Zusätzliche Steckdose Garage", sub: "A-4412 · 11:05 · vom Kunden gewünscht", tag: "Zusatzleistung", ton: "signal" },
        ],
      },
      hinweis: {
        icon: "spark",
        ton: "moss",
        titel: "Auftrag vorausgewählt:",
        text: "A-4412 Wallbox Meyer – deine Zeit läuft dort seit 7:30 Uhr.",
      },
    },
    problemTitel: "Was nicht sofort notiert wird, ist weg.",
    probleme: [
      {
        titel: "Fotos im privaten Handy",
        text: "Zwischen Familienbildern liegen 40 Baustellenfotos. Welches gehört zu welchem Auftrag? Keiner weiß es mehr.",
      },
      {
        titel: "Material nie abgerechnet",
        text: "Die zwei Rollen Kabel aus dem Wagen hat keiner aufgeschrieben. Sie fehlen auf der Rechnung.",
      },
      {
        titel: "Zeiten aus dem Gedächtnis",
        text: "Abends am Küchentisch: Wann war ich bei Meyer? Halb neun oder neun? Geraten wird zu deinen Lasten.",
      },
      {
        titel: "Erst den Auftrag suchen",
        text: "Bevor man etwas eintragen kann, muss man durch drei Listen tippen. Mit Handschuhen lässt man es lieber.",
      },
    ],
    loesung: {
      titel: "Ein Tipp am Einsatz. Der Rest ist schon da.",
      text: "Die Knöpfe zum Erfassen sitzen dort, wo du arbeitest: am Einsatz und am Auftrag. Ein Tipp öffnet direkt das passende Feld. Läuft deine Zeit oder hast du heute einen Einsatz, ist der Auftrag schon gewählt.",
      punkte: [
        "Foto, Notiz schreiben oder sprechen",
        "Zeit starten und stoppen, Material buchen",
        "Zusatzleistung, Mangel oder Beleg festhalten",
        "Der Auftrag steht oben – du siehst, wohin es geht",
      ],
    },
    detail: {
      kopf: "Erfassen · 09:40",
      titel: "Material buchen",
      sub: "Zum Auftrag A-4412 · Wallbox Meyer",
      status: { text: "Auftrag gewählt", ton: "moss" },
      zeilen: [
        { label: "Material", wert: "NYM-J 5×6 mm²" },
        { label: "Menge", wert: "18 m" },
        { label: "Gebucht von", wert: "Lukas" },
        { label: "Uhrzeit", wert: "09:40" },
        { label: "Danach", wert: "steht am Auftrag für die Rechnung", hervor: true },
      ],
      fuss: { icon: "spark", text: "Macher hat den Auftrag gewählt, weil deine Zeit dort läuft." },
    },
    schritte: [
      {
        titel: "Tippen",
        text: "Am Einsatz oder Auftrag auf „Foto“, „Notiz“, „Material“ oder „Zeit“ tippen.",
      },
      {
        titel: "Auftrag ist gewählt",
        text: "Macher nimmt den Auftrag, an dem deine Zeit läuft, sonst deinen Einsatz von heute.",
      },
      {
        titel: "Kurz erfassen",
        text: "Foto machen, ein paar Worte schreiben oder sprechen, Menge eintragen. Mehr Felder gibt es nicht.",
      },
      {
        titel: "Gespeichert",
        text: "Alles landet am Auftrag – fürs Büro, für die Rechnung, für den Nachweis.",
      },
    ],
    automatisch: [
      "wählt den Auftrag, an dem deine Zeit gerade läuft",
      "nimmt sonst deinen Einsatz von heute",
      "zeigt den gewählten Auftrag sichtbar oben an",
      "öffnet direkt das passende Formular – ohne Umweg über ein Menü",
      "speichert Fotos, Notizen, Material und Zeiten am Auftrag",
    ],
    geraete: {
      handy: [
        "Große Knöpfe am Einsatz – auch mit Handschuhen",
        "Notiz sprechen statt tippen",
        "Beleg vom Tanken oder Baumarkt fotografieren",
      ],
      computer: [
        "Anruf notieren, während der Kunde spricht",
        "Notiz oder Foto direkt am Auftrag ablegen",
        "Aufgabe für Kollegen anlegen",
      ],
      handyVisual: {
        kopf: "Einsatz · läuft seit 7:30",
        titel: "Wallbox Meyer",
        sub: "A-4412 · Rosenstr. 8, Hannover",
        tags: [
          { text: "Zeit läuft", ton: "moss" },
          { text: "7 Fotos", ton: "sky" },
        ],
        felder: [
          { label: "Foto", wert: "Zählerschrank vorher" },
          { label: "Material", wert: "18 m NYM-J 5×6" },
          { label: "Notiz", wert: "Kunde will Steckdose in Garage" },
        ],
        aktion: { icon: "camera", text: "Foto hinzufügen" },
      },
    },
    gewerke: [
      { slug: "elektriker", text: "Kabel und Klemmen sofort buchen, bevor sie auf der Rechnung fehlen." },
      { slug: "shk", text: "Foto vom Typenschild und Notiz zur Störung direkt beim Kundendienst." },
      { slug: "maler", text: "Mehrfläche auf Zuruf als Zusatzleistung festhalten, solange der Kunde danebensteht." },
    ],
    kunde: {
      slug: "elektro-brandt",
      text: "Beispiel: Wie ein Elektrobetrieb Stunden, Material und Fotos direkt vom Handy erfasst – statt abends im Büro.",
    },
    faq: [
      {
        frage: "Was kann ich alles schnell erfassen?",
        antwort:
          "Fotos, Notizen (geschrieben oder gesprochen), Zeiten, Material, Aufgaben, Zusatzleistungen, Mängel, Belege und Anrufe. Dazu Urlaub oder Krankheit und defekte Werkzeuge.",
      },
      {
        frage: "Woher weiß Handwerk OS, zu welchem Auftrag es gehört?",
        antwort:
          "Tippst du am Auftrag, ist es dieser Auftrag. Sonst nimmt Macher den Auftrag, an dem deine Zeit gerade läuft, oder deinen Einsatz von heute. Der gewählte Auftrag steht immer sichtbar oben.",
      },
      {
        frage: "Geht das auch ohne Auftrag?",
        antwort:
          "Ja, für Dinge wie Belege oder Defekte an Werkzeugen. Gehört etwas zu einem Auftrag, fragt das Formular danach, wenn noch keiner gewählt ist.",
      },
      {
        frage: "Brauche ich dafür eine eigene App?",
        antwort: "Nein. Handwerk OS läuft im Browser auf dem Handy. Du musst nichts installieren.",
      },
    ],
    verwandt: ["dokumentation", "zeiterfassung", "zusatzleistungen"],
  },
} satisfies Partial<Record<StandardSlug, FunktionInhalt>>;
