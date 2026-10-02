import type { FunktionInhalt, StandardSlug } from "../funktionen";

export const teil3 = {
  /* ───────────────────────── Wartung & Service ───────────────────────── */

  wartung: {
    icon: "wrench",
    kurz: "Fällige Wartungen im Blick. Macher legt die Aufträge rechtzeitig an – mit Prüfpunkten und Nachricht an den Kunden.",
    enthalten: ["Fällige Wartungen", "Wartungsaufträge", "Prüfpunkte je Anlage", "Nächste Wartung eintragen"],
    meta: {
      title: "Wartungsplanung für Handwerker – keine Wartung mehr vergessen",
      description:
        "Macher OS zeigt, welche Wartungen überfällig und fällig sind, legt Wartungsaufträge rechtzeitig an, bündelt Anlagen am selben Ort und trägt danach die nächste Wartung ein.",
    },
    hero: {
      titel: "Die Wartung meldet sich, bevor der Kunde anruft.",
      problem:
        "Wann welche Heizung, welcher Zählerschrank oder welches Flachdach dran ist, steht in einer Tabelle, am Wandkalender oder nur im Kopf. Oft merkst du es erst, wenn die Anlage steht.",
      loesung:
        "Macher OS kennt die Fälligkeit jeder Anlage. Wochen vorher liegt der Wartungsauftrag bereit – mit Prüfpunkten, Terminvorschlag und Nachricht an den Kunden.",
    },
    visual: {
      bereich: "Aufträge",
      titel: "Wartung & Service",
      untertitel: "Was fällig ist",
      kennzahlen: [
        ["2", "überfällig"],
        ["5", "diese Woche"],
        ["11", "diesen Monat"],
      ],
      liste: {
        ueberschrift: "Fällig",
        zeilen: [
          { titel: "Gasheizung · K. Wendt", sub: "Birkenweg 8 · fällig seit 3 Tagen", tag: "überfällig", ton: "signal" },
          { titel: "Wärmepumpe + Speicher · WEG Lindenhof", sub: "2 Anlagen · ein Auftrag", tag: "gebündelt", ton: "moss" },
          { titel: "Enthärtungsanlage · Bäckerei Ahrens", sub: "fällig 24.10. · Servicevertrag", tag: "Termin steht", ton: "sky" },
        ],
      },
      hinweis: {
        icon: "spark",
        ton: "moss",
        titel: "Macher hat erledigt:",
        text: "4 Wartungsaufträge angelegt, Prüfpunkte als Aufgaben gesetzt.",
      },
    },
    problemTitel: "Wartungen hängen am Gedächtnis – und das hat viel zu tun.",
    probleme: [
      {
        titel: "Der Kunde ruft zuerst an",
        text: "Die Heizung war im Herbst dran. Keiner hat dran gedacht. Im Januar ruft der Kunde an, weil es kalt ist – und ist zu Recht sauer.",
      },
      {
        titel: "Zweimal hinfahren, obwohl einmal reicht",
        text: "Im selben Keller stehen Heizung und Speicher. Beide werden einzeln gewartet, an zwei Tagen. Das kostet Fahrt und Zeit.",
      },
      {
        titel: "Nach der Wartung reißt die Kette",
        text: "Die Wartung ist gemacht. Aber keiner trägt das nächste Datum ein. Ein Jahr später fällt die Anlage durchs Raster.",
      },
      {
        titel: "Vor Ort fehlt der Plan",
        text: "Der Monteur steht vor einer Anlage, die er selten sieht. Was war noch alles zu prüfen? Der Zettel liegt im Büro.",
      },
    ],
    loesung: {
      titel: "Jede Anlage weiß, wann sie dran ist.",
      text: "An jeder Anlage steht, wann die letzte Wartung war und wann die nächste fällig ist. Macher legt rechtzeitig vorher den Wartungsauftrag an, fasst Anlagen am selben Ort zusammen und setzt die passenden Prüfpunkte als Aufgaben. Ist die Wartung fertig, rechnet Macher die nächste aus.",
      punkte: [
        "Übersicht: überfällig, diese Woche, diesen Monat",
        "Wartungsauftrag Wochen vorher – den Vorlauf stellst du ein",
        "Prüfpunkte je Anlagentyp zum Abhaken am Handy",
        "Nach dem Abschluss steht die nächste Wartung automatisch drin",
      ],
    },
    detail: {
      kopf: "Wartungsauftrag · A-2026-214",
      titel: "Wartung Gasheizung und Warmwasserspeicher",
      sub: "Familie Wendt · Birkenweg 8, Dortmund",
      status: { text: "Termin steht", ton: "moss" },
      zeilen: [
        { label: "Fällig", wert: "28. Oktober" },
        { label: "Anlagen", wert: "2 am selben Ort" },
        { label: "Prüfpunkte", wert: "9 Aufgaben, 0 erledigt" },
        { label: "Termin", wert: "Mo, 27.10. · 8:00 Uhr · Mehmet" },
        { label: "Nächster Schritt", wert: "Kunde informieren", hervor: true },
      ],
      fuss: { icon: "spark", text: "Macher hat die Nachricht an Familie Wendt vorbereitet. Du gibst sie nur noch frei." },
    },
    schritte: [
      {
        titel: "Anlage mit Intervall erfassen",
        text: "Typ, Ort und Wartungsintervall eintragen. Dazu, wann zuletzt gewartet wurde. Mehr braucht es nicht.",
      },
      {
        titel: "Macher legt den Auftrag an",
        text: "Ein paar Wochen vor dem Termin steht der Wartungsauftrag bereit. Anlagen am selben Ort landen im selben Auftrag.",
      },
      {
        titel: "Termin und Kunde",
        text: "Du holst dir einen Terminvorschlag aus der Planung. Die Nachricht an den Kunden ist vorbereitet – du gibst sie frei.",
      },
      {
        titel: "Abhaken und abschließen",
        text: "Der Monteur hakt die Prüfpunkte am Handy ab. Ist der Auftrag fertig, trägt Macher die nächste Wartung ein.",
      },
    ],
    automatisch: [
      "legt Wartungsaufträge rechtzeitig vor der Fälligkeit an",
      "bündelt Anlagen am selben Ort in einem Auftrag",
      "setzt Prüfpunkte je Anlagentyp als Aufgaben",
      "bereitet die Nachricht an den Kunden zur Freigabe vor",
      "trägt nach dem Abschluss letzte und nächste Wartung ein",
      "schließt Wartungen aus einem Servicevertrag ohne Rechnung ab",
    ],
    geraete: {
      handy: [
        "Prüfpunkte direkt an der Anlage abhaken",
        "Daten der Anlage vor Ort nachsehen",
        "Auftrag fertig melden – der Rest läuft von selbst",
      ],
      computer: [
        "Übersicht aller fälligen und überfälligen Wartungen",
        "Vorlauf in Wochen einstellen",
        "Termin vorschlagen lassen und Kundennachricht freigeben",
      ],
      handyVisual: {
        kopf: "Wartung · heute 8:00",
        titel: "Gasheizung Familie Wendt",
        sub: "Birkenweg 8 · Keller",
        tags: [
          { text: "2 Anlagen", ton: "sky" },
          { text: "Servicevertrag", ton: "moss" },
        ],
        felder: [
          { label: "Abgasmessung", wert: "erledigt" },
          { label: "Gasdichtheit prüfen", wert: "offen" },
          { label: "Sicherheitsventil", wert: "offen" },
        ],
        aktion: { icon: "check", text: "Prüfpunkt abhaken" },
      },
    },
    gewerke: [
      { slug: "shk", text: "Heizung, Wärmepumpe, Speicher: Die Herbstwartungen stehen rechtzeitig als Aufträge bereit." },
      { slug: "elektriker", text: "Zählerschrank, Wallbox, PV-Anlage – mit eigenen Prüfpunkten für jeden Anlagentyp." },
      { slug: "dachdecker", text: "Flachdach, Dachrinne, Blitzschutz: Die jährliche Kontrolle meldet sich von selbst." },
    ],
    kunde: {
      slug: "haustechnik-yilmaz",
      text: "Beispiel: Wie ein SHK-Betrieb seine Herbstwartungen nicht mehr aus der Tabelle zusammensucht.",
    },
    werkzeug: "fahrtkosten-rechner",
    faq: [
      {
        frage: "Wie weit im Voraus legt Macher den Wartungsauftrag an?",
        antwort:
          "Das stellst du ein – in Wochen vor der Fälligkeit. Am Anfang sind es vier Wochen. Wer im Herbst viel zu tun hat, stellt den Vorlauf länger.",
      },
      {
        frage: "Was passiert, wenn bei einer Anlage kein Datum eingetragen ist?",
        antwort:
          "Ohne Fälligkeit kann Macher nichts anlegen. Trag Intervall und letzte Wartung an der Anlage nach – dann rechnet Macher die nächste aus.",
      },
      {
        frage: "Bekommt der Kunde automatisch eine Nachricht?",
        antwort:
          "Nein, nicht ohne dich. Macher bereitet die Nachricht mit dem Termin vor. Du prüfst sie und gibst sie frei. Dann geht sie per Mail oder SMS raus.",
      },
      {
        frage: "Muss ich für die Prüfpunkte eigene Listen anlegen?",
        antwort:
          "Für viele Anlagentypen sind kurze Prüfpunkte schon da, etwa für Gasheizung, Wärmepumpe oder Zählerschrank. Ein ausführliches Prüfprotokoll legst du über Checklisten und Berichte an.",
      },
    ],
    verwandt: ["anlagen", "servicevertraege", "wiederkehrende-termine"],
  },

  /* ───────────────────────── Serviceverträge ───────────────────────── */

  servicevertraege: {
    icon: "signature",
    kurz: "Wartungsverträge mit Laufzeit, Preis und Kündigungsfrist – die Abrechnung bereitet Macher von selbst vor.",
    enthalten: ["Verträge mit Laufzeit", "Automatische Abrechnung", "Kündigungsfristen", "Verlängern"],
    meta: {
      title: "Wartungsverträge verwalten – Abrechnung und Fristen im Griff",
      description:
        "Serviceverträge mit Leistungen, Preis pro Jahr und Laufzeit. Macher OS erstellt zu Beginn jeder Abrechnungsperiode den Rechnungsentwurf und erinnert an Kündigungsfristen.",
    },
    hero: {
      titel: "Wartungsverträge, die sich selbst abrechnen.",
      problem:
        "Die Verträge liegen im Ordner. Wann was abgerechnet wird und wann die Kündigungsfrist endet, weiß keiner genau. Mal fehlt eine Rechnung, mal wird eine Wartung doppelt berechnet.",
      loesung:
        "In Macher OS hat jeder Vertrag Laufzeit, Preis und Rhythmus. Zu Beginn jeder Periode liegt der Rechnungsentwurf bereit. Vor der Kündigungsfrist bekommst du Bescheid.",
    },
    visual: {
      bereich: "Aufträge",
      titel: "Serviceverträge",
      untertitel: "laufende Verträge",
      kennzahlen: [
        ["18", "laufend"],
        ["2", "Frist bald"],
        ["1", "abzurechnen"],
      ],
      liste: {
        ueberschrift: "Braucht dich",
        zeilen: [
          { titel: "SV-0007 · Hausverwaltung Petersen", sub: "Kündigungsfrist bis 30.11.", tag: "Preis prüfen", ton: "signal" },
          { titel: "SV-0012 · Bäckerei Ahrens", sub: "Oktober · monatlich", tag: "Entwurf bereit", ton: "moss" },
          { titel: "SV-0004 · Praxis Dr. Lenz", sub: "läuft am 31.12. aus", tag: "verlängern?", ton: "sky" },
        ],
      },
      hinweis: {
        icon: "spark",
        ton: "moss",
        titel: "Macher hat erledigt:",
        text: "Rechnungsentwurf für SV-0012 erstellt. Bitte prüfen und versenden.",
      },
    },
    problemTitel: "Wartungsverträge bringen gutes Geld – wenn keiner etwas vergisst.",
    probleme: [
      {
        titel: "Die Rechnung bleibt liegen",
        text: "Der Vertrag läuft seit Januar. Die Jahresrechnung schreibt aber keiner, weil der Termin in keinem Kalender steht. Im Sommer fällt es auf.",
      },
      {
        titel: "Wartung doppelt berechnet",
        text: "Der Monteur war zur Wartung da. Das Büro schreibt eine Rechnung – obwohl die Wartung im Vertrag schon bezahlt ist. Der Kunde ruft verärgert an.",
      },
      {
        titel: "Die Frist ist schon vorbei",
        text: "Du wolltest den Preis anpassen. Aber die Kündigungsfrist ist letzte Woche abgelaufen. Jetzt läuft der Vertrag ein weiteres Jahr zum alten Preis.",
      },
      {
        titel: "Viele Häuser, ein Vertrag",
        text: "Die Hausverwaltung hat einen Vertrag für vier Objekte. Welche Anlage wo steht und was drin ist, muss jedes Mal zusammengesucht werden.",
      },
    ],
    loesung: {
      titel: "Ein Vertrag, alle Bezüge.",
      text: "Du legst den Vertrag einmal an: Kunde, Orte, Anlagen, Leistungen, Preis pro Jahr, Abrechnungsrhythmus, Laufzeit und Kündigungsfrist. Macher kümmert sich um die Abrechnung, weist auf Fristen hin und sorgt dafür, dass Vertragswartungen nicht noch einmal berechnet werden.",
      punkte: [
        "Abrechnung monatlich, vierteljährlich, halbjährlich oder jährlich",
        "Mehrere Orte und Anlagen in einem Vertrag",
        "Hinweis vor Kündigungsfrist und Vertragsende",
        "Wartungen aus dem Vertrag laufen ohne Rechnung durch",
      ],
    },
    detail: {
      kopf: "Servicevertrag · SV-0012",
      titel: "Servicevertrag Heizungsanlage",
      sub: "Bäckerei Ahrens · Backstube, Lindenstr. 4",
      status: { text: "läuft", ton: "moss" },
      zeilen: [
        { label: "Leistungen", wert: "Halbjährliche Wartung, Anfahrt" },
        { label: "Preis", wert: "480 € pro Jahr · monatlich" },
        { label: "Laufzeit", wert: "24 Monate, verlängert sich um 12" },
        { label: "Kündigungsfrist", wert: "3 Monate" },
        { label: "Nächste Abrechnung", wert: "Oktober · 40 € netto", hervor: true },
      ],
      fuss: { icon: "spark", text: "Macher hat den Rechnungsentwurf mit Leistungszeitraum angelegt. Du prüfst und versendest." },
    },
    schritte: [
      {
        titel: "Vertrag anlegen",
        text: "Kunde wählen, Orte und Anlagen dazu. Leistungen, Preis, Laufzeit und Kündigungsfrist eintragen.",
      },
      {
        titel: "Anlagen übernehmen das Intervall",
        text: "Fehlt an einer Anlage das Wartungsintervall, übernimmt sie das aus dem Vertrag. So weiß Wartung & Service, wann sie dran ist.",
      },
      {
        titel: "Abrechnung kommt von selbst",
        text: "Zu Beginn jeder Periode liegt ein Rechnungsentwurf bereit. Du schaust drüber und schickst ihn ab.",
      },
      {
        titel: "Fristen im Blick",
        text: "Vor der Kündigungsfrist fragt Macher: Preis anpassen oder weiterlaufen lassen? Läuft ein Vertrag aus, kannst du ihn mit einem Klick verlängern.",
      },
    ],
    automatisch: [
      "erstellt zu Beginn jeder Abrechnungsperiode einen Rechnungsentwurf",
      "holt verpasste Abrechnungen nach",
      "erinnert 30 Tage vor der Kündigungsfrist",
      "meldet Verträge, die in 60 Tagen auslaufen",
      "überträgt das Wartungsintervall auf die Anlagen",
      "schließt Vertragswartungen ohne Rechnung ab",
    ],
    geraete: {
      handy: [
        "Am Kunden sehen, ob ein Vertrag läuft",
        "An der Anlage sehen, was der Vertrag abdeckt",
        "Hinweis zur Kündigungsfrist unterwegs bestätigen",
      ],
      computer: [
        "Alle Verträge mit Stand in einer Liste",
        "Konditionen, Wartungsaufträge und Abrechnungen je Vertrag",
        "Termine als Serie planen",
      ],
      handyVisual: {
        kopf: "Servicevertrag · SV-0007",
        titel: "Hausverwaltung Petersen",
        sub: "4 Objekte · 6 Anlagen",
        tags: [
          { text: "jährlich", ton: "sky" },
          { text: "Frist bald", ton: "signal" },
        ],
        felder: [
          { label: "Kündigungsfrist", wert: "bis 30.11." },
          { label: "Verlängert sich um", wert: "12 Monate" },
          { label: "Nächste Wartung", wert: "März" },
        ],
        aktion: { icon: "check", text: "Weiterlaufen lassen" },
      },
    },
    gewerke: [
      { slug: "shk", text: "Heizungs- und Wärmepumpenverträge mit fester Jahrespauschale – die Rechnung kommt pünktlich." },
      { slug: "elektriker", text: "Prüfverträge für Gewerbekunden: mehrere Standorte und Anlagen in einem Vertrag." },
      { slug: "gebaeude-service", text: "Hausverwaltungen mit vielen Objekten – Laufzeit und Fristen bleiben im Blick." },
    ],
    kunde: {
      slug: "haustechnik-yilmaz",
      text: "Beispiel: Wie ein SHK-Betrieb seine Wartungsverträge pünktlich abrechnet, ohne Ordner zu wälzen.",
    },
    faq: [
      {
        frage: "Wird die Rechnung automatisch an den Kunden geschickt?",
        antwort:
          "Nein. Macher erstellt einen Rechnungsentwurf mit Leistungszeitraum. Du prüfst ihn und schickst ihn selbst ab.",
      },
      {
        frage: "Kann ich mehrere Gebäude in einen Vertrag packen?",
        antwort:
          "Ja. Ein Vertrag kann mehrere Orte und Anlagen umfassen – praktisch bei Hausverwaltungen oder Filialen.",
      },
      {
        frage: "Was passiert, wenn der Vertrag sich nicht automatisch verlängert?",
        antwort:
          "Dann meldet Macher 60 Tage vor dem Ende, dass er ausläuft. Du kannst ihn mit einem Klick verlängern oder auslaufen lassen.",
      },
      {
        frage: "Sehen meine Monteure die Vertragspreise?",
        antwort:
          "Nur wer das Recht für Geld hat, sieht Preise. Monteure sehen, welche Leistungen drin sind – nicht, was der Kunde zahlt.",
      },
    ],
    verwandt: ["wartung", "rechnungen", "wiederkehrende-termine"],
  },

  /* ───────────────────────── Gewährleistung & Reklamationen ───────────────────────── */

  reklamationen: {
    icon: "shield",
    kurz: "Mangel aufnehmen, Gewährleistung prüfen lassen, Nacharbeit fristgerecht erledigen.",
    enthalten: ["Mangel melden", "Gewährleistung prüfen", "Nacharbeit mit Frist", "Kulanz und Ablehnung"],
    meta: {
      title: "Reklamationen und Gewährleistung im Handwerk – Mängel sauber abarbeiten",
      description:
        "Mängel per Handy mit Foto aufnehmen. Macher OS prüft anhand des Abnahmedatums, ob noch Gewährleistung besteht, legt die Nacharbeit mit Frist an und erinnert, bevor die Frist abläuft.",
    },
    hero: {
      titel: "Ein Mangel ist ärgerlich. Ein vergessener ist teuer.",
      problem:
        "Der Kunde meldet einen Mangel am Telefon. Ist das noch Gewährleistung? Wann war die Abnahme? Bis das geklärt ist, liegt die Reklamation – und die Frist läuft.",
      loesung:
        "Macher OS nimmt den Mangel mit Foto auf, rechnet die Gewährleistung aus dem Abnahmedatum aus und legt die Nacharbeit mit Frist an. Du entscheidest nur noch.",
    },
    visual: {
      bereich: "Aufträge",
      titel: "Reklamationen",
      untertitel: "offen",
      kennzahlen: [
        ["3", "offen"],
        ["1", "Frist in 2 Tagen"],
        ["1", "zu klären"],
      ],
      liste: {
        ueberschrift: "Offen",
        zeilen: [
          { titel: "Abdeckung lose, Fuge gerissen", sub: "Familie Berger · Küche · Telefon", tag: "Frist Do", ton: "signal" },
          { titel: "Tür schleift am Boden", sub: "Hr. Albrecht · Haustür · Mail", tag: "Gewährleistung", ton: "moss" },
          { titel: "Störung kommt immer wieder", sub: "WEG Lindenhof · Heizung", tag: "kostenpflichtig", ton: "sky" },
        ],
      },
      hinweis: {
        icon: "achtung",
        ton: "signal",
        titel: "Frist läuft ab:",
        text: "Abdeckung bei Familie Berger bis Donnerstag beseitigen. Termin steht am Mittwoch.",
      },
    },
    problemTitel: "Reklamationen kommen ungelegen – und brauchen trotzdem Ordnung.",
    probleme: [
      {
        titel: "Am Telefon angenommen, nirgends notiert",
        text: "„Ich kümmere mich drum.“ Dann kommt der nächste Anruf. Zwei Wochen später ruft der Kunde wieder an – diesmal deutlich lauter.",
      },
      {
        titel: "Gewährleistung oder nicht?",
        text: "Wann war die Abnahme? War das ein Bauwerk oder eine Reparatur? Das Suchen im Ordner kostet eine halbe Stunde.",
      },
      {
        titel: "Falsch abgerechnet",
        text: "Die Nacharbeit war auf Gewährleistung, die Rechnung geht trotzdem raus. Oder umgekehrt: Bezahlte Arbeit wird aus Unsicherheit verschenkt.",
      },
      {
        titel: "Kein Foto, kein Nachweis",
        text: "Später gibt es Streit, wie der Mangel aussah. Fotos gibt es keine, weil vor Ort keiner daran gedacht hat.",
      },
    ],
    loesung: {
      titel: "Vom Anruf bis zur erledigten Nacharbeit.",
      text: "Jeder Mangel bekommt einen Eintrag – mit Kunde, ursprünglichem Auftrag, Anlage und Fotos. Macher prüft die Gewährleistung, schlägt eine Frist vor und legt die Nacharbeit als Auftrag an. Der Stand der Reklamation folgt der Nacharbeit von selbst.",
      punkte: [
        "Mangel melden am Handy, mit Foto",
        "Gewährleistung nach BGB oder VOB/B ausgerechnet",
        "Nacharbeit als eigener Auftrag mit Frist",
        "Gewährleistung, kostenpflichtig, Kulanz oder ablehnen mit Grund",
      ],
    },
    detail: {
      kopf: "Reklamation · R-2026-008 · Telefon",
      titel: "Abdeckung lose, Fuge gerissen",
      sub: "Familie Berger · Küchenzeile, Auftrag A-2026-131",
      status: { text: "Auf Gewährleistung", ton: "moss" },
      zeilen: [
        { label: "Abnahme", wert: "12. März 2026" },
        { label: "Grundlage", wert: "BGB – Bauwerk, 5 Jahre" },
        { label: "Gewährleistung bis", wert: "12. März 2031" },
        { label: "Fotos", wert: "2 vom Monteur" },
        { label: "Frist zur Beseitigung", wert: "Do, 16.10.", hervor: true },
      ],
      fuss: { icon: "spark", text: "Macher hat den Nacharbeitsauftrag angelegt. Er wird ohne Rechnung abgeschlossen." },
    },
    schritte: [
      {
        titel: "Mangel aufnehmen",
        text: "Im Büro oder direkt vor Ort am Handy. Kurz beschreiben, Foto machen, Kunde und Auftrag wählen.",
      },
      {
        titel: "Macher prüft die Gewährleistung",
        text: "Aus Abnahme- oder Abschlussdatum und Grundlage rechnet Macher aus, ob noch Gewährleistung besteht.",
      },
      {
        titel: "Du entscheidest",
        text: "Gewährleistung, kostenpflichtig oder Kulanz – oder ablehnen, mit Grund. Die Frist ist schon vorgeschlagen.",
      },
      {
        titel: "Nacharbeit erledigen",
        text: "Die Nacharbeit ist ein normaler Auftrag. Ist sie fertig, steht die Reklamation auf „Erledigt“.",
      },
    ],
    automatisch: [
      "rechnet die Gewährleistung aus Abnahme und Grundlage aus",
      "legt den Nacharbeitsauftrag mit Frist an",
      "führt den Stand der Reklamation aus der Nacharbeit nach",
      "schließt Nacharbeit auf Gewährleistung ohne Rechnung ab",
      "warnt drei Tage vor Ablauf der Frist",
      "meldet kostenpflichtige Nacharbeit, für die noch kein Angebot da ist",
    ],
    geraete: {
      handy: [
        "Mangel vor Ort melden – mit Foto",
        "Fotos später zur Reklamation ergänzen",
        "Nacharbeit wie jeden Auftrag abarbeiten",
      ],
      computer: [
        "Alle offenen Reklamationen mit Frist",
        "Gewährleistung prüfen und entscheiden",
        "Reklamationen am Kunden, Auftrag und an der Anlage",
      ],
      handyVisual: {
        kopf: "Mangel melden",
        titel: "Tür schleift am Boden",
        sub: "Hr. Albrecht · Haustür",
        tags: [
          { text: "1 Foto", ton: "sky" },
          { text: "Gewährleistung", ton: "moss" },
        ],
        felder: [
          { label: "Auftrag", wert: "A-2026-098" },
          { label: "Gemeldet", wert: "heute, Telefon" },
          { label: "Frist", wert: "14 Tage" },
        ],
        aktion: { icon: "camera", text: "Foto aufnehmen" },
      },
    },
    gewerke: [
      { slug: "tischler", text: "Klemmende Tür, lose Blende: Mit Foto aufgenommen, die Nacharbeit steht im Plan." },
      { slug: "fliesenleger", text: "Gerissene Fuge nach dem Einzug – Macher weiß sofort, wann abgenommen wurde." },
      { slug: "shk", text: "Wiederkehrende Störung an einer alten Anlage? Ist die Gewährleistung vorbei, geht ein Angebot raus." },
    ],
    kunde: {
      slug: "tischlerei-weber",
      text: "Beispiel: Wie eine Tischlerei Reklamationen ohne Ordnersuche klärt und keine Frist mehr verpasst.",
    },
    faq: [
      {
        frage: "Woher weiß Macher, ob noch Gewährleistung besteht?",
        antwort:
          "Aus dem Abnahme- oder Abschlussdatum des Auftrags und der Grundlage: BGB oder VOB/B, Bauwerk oder sonstige Arbeiten. Steht an der Anlage ein eigenes Gewährleistungsdatum, zählt das. Fehlt ein Datum, sagt dir Macher, was du nachtragen musst.",
      },
      {
        frage: "Ist das eine Rechtsberatung?",
        antwort:
          "Nein. Macher rechnet die üblichen Fristen aus und zeigt dir, worauf er sich stützt. Die Entscheidung triffst du. Bei Streit hilft dir ein Anwalt oder deine Innung.",
      },
      {
        frage: "Was passiert bei einer kostenpflichtigen Nacharbeit?",
        antwort:
          "Macher legt den Auftrag an und erinnert dich, dem Kunden ein Angebot zu schicken. Du kannst dich auch für Kulanz entscheiden – dann gibt es keine Rechnung.",
      },
      {
        frage: "Können Monteure einen Mangel melden?",
        antwort:
          "Ja. Über „Mangel melden“ am Handy, mit Foto. Die Entscheidung über Gewährleistung oder Kosten bleibt bei Chef und Büro.",
      },
    ],
    verwandt: ["abnahme", "dokumentation", "anlagen"],
  },

  /* ───────────────────────── Bewertungen & Empfehlungen ───────────────────────── */

  bewertungen: {
    icon: "award",
    kurz: "Nach erledigter Arbeit nach einer Bewertung fragen – zur richtigen Zeit, bei den richtigen Kunden.",
    enthalten: ["Bewertung anfragen", "Kundenzufriedenheit", "Empfehlungen nachverfolgen"],
    meta: {
      title: "Mehr Google-Bewertungen für deinen Handwerksbetrieb",
      description:
        "Macher OS bereitet nach jedem erledigten Auftrag eine Bewertungsanfrage mit deinem Google-Link vor. Unzufriedene Kunden und Reklamationen lässt er aus. Du gibst nur frei.",
    },
    hero: {
      titel: "Zufriedene Kunden fragen – ohne es zu vergessen.",
      problem:
        "Die Arbeit war gut, der Kunde war zufrieden. Nach einer Bewertung fragt trotzdem keiner. Im Netz findet man deshalb eher die Konkurrenz.",
      loesung:
        "Ist ein Auftrag erledigt, bereitet Macher die Bewertungsanfrage vor – mit deinem Google-Link. Kunden mit Reklamation oder schlechter Rückmeldung lässt er aus. Du gibst nur frei.",
    },
    visual: {
      bereich: "Aufträge",
      titel: "Bewertungen & Empfehlungen",
      untertitel: "Anfragen",
      kennzahlen: [
        ["3", "zur Freigabe"],
        ["12", "gesendet"],
        ["2", "Empfehler offen"],
      ],
      liste: {
        ueberschrift: "Zur Freigabe",
        zeilen: [
          { titel: "Familie Krüger · Badsanierung", sub: "erledigt gestern · per Mail", tag: "bereit", ton: "moss" },
          { titel: "Hr. Öztürk · Steckdosen Küche", sub: "erledigt Montag · per SMS", tag: "bereit", ton: "moss" },
          { titel: "Praxis Dr. Lenz · Beleuchtung", sub: "zuletzt gefragt vor 2 Monaten", tag: "ausgelassen", ton: "sand" },
        ],
      },
      hinweis: {
        icon: "users",
        ton: "sky",
        titel: "Wer hat empfohlen?",
        text: "Familie Brandes kam über eine Empfehlung. Trag ein, von wem – dann kannst du dich bedanken.",
      },
    },
    problemTitel: "Gute Arbeit allein bringt noch keine Bewertung.",
    probleme: [
      {
        titel: "Fragen vergisst jeder",
        text: "Nach der Abnahme geht es zur nächsten Baustelle. Die Bitte um eine Bewertung kommt nie. Oder erst Monate später, wenn der Kunde sich kaum erinnert.",
      },
      {
        titel: "Den falschen Kunden gefragt",
        text: "Ausgerechnet der Kunde mit der offenen Reklamation bekommt die Bitte um eine Bewertung. Die Antwort steht dann öffentlich im Netz.",
      },
      {
        titel: "Stammkunden genervt",
        text: "Nach jedem kleinen Auftrag dieselbe Anfrage. Beim dritten Mal wird der treueste Kunde unwirsch.",
      },
      {
        titel: "Keiner weiß, wer empfohlen hat",
        text: "„Wir kommen auf Empfehlung.“ Von wem, fragt keiner nach. Der Dank an den Empfehler bleibt aus.",
      },
    ],
    loesung: {
      titel: "Die Anfrage kommt zur richtigen Zeit.",
      text: "Geht ein Auftrag auf „erledigt“, bereitet Macher die Anfrage vor. Er hält sich an klare Regeln: keine Reklamationen, keine doppelten Anfragen, jeder Kunde höchstens alle 180 Tage, niemand, der zuletzt unzufrieden war. Gesendet wird erst, wenn du freigibst.",
      punkte: [
        "Dein Google-Bewertungslink einmal hinterlegt",
        "Anfrage per Mail, sonst per SMS",
        "Zufriedenheit festhalten – nur was der Kunde selbst gesagt hat",
        "Empfehlungen nachverfolgen und Danke sagen",
      ],
    },
    detail: {
      kopf: "Bewertungsanfrage · zur Freigabe",
      titel: "Familie Krüger",
      sub: "Badsanierung · erledigt am 13. Oktober",
      status: { text: "bereit", ton: "moss" },
      zeilen: [
        { label: "Kanal", wert: "E-Mail" },
        { label: "Link", wert: "Google-Bewertung" },
        { label: "Zuletzt gefragt", wert: "noch nie" },
        { label: "Reklamation", wert: "keine" },
        { label: "Nächster Schritt", wert: "Anfrage senden", hervor: true },
      ],
      fuss: { icon: "spark", text: "Macher hat die Anfrage vorbereitet. Wer nicht gefragt werden soll, lässt du mit einem Klick aus." },
    },
    schritte: [
      {
        titel: "Link hinterlegen",
        text: "Einmal deinen Google-Bewertungslink eintragen. Macher setzt ihn in jede Anfrage ein.",
      },
      {
        titel: "Auftrag ist erledigt",
        text: "Macher prüft die Regeln und bereitet die Anfrage vor. Du siehst sie in deiner Liste zur Freigabe.",
      },
      {
        titel: "Freigeben oder auslassen",
        text: "Ein Klick schickt die Anfrage per Mail oder SMS. Ein anderer Klick lässt den Kunden diesmal aus.",
      },
      {
        titel: "Rückmeldung festhalten",
        text: "Sagt der Kunde, wie zufrieden er war, trägst du das ein. Wer zuletzt unzufrieden war, wird nicht gefragt.",
      },
    ],
    automatisch: [
      "bereitet nach jedem erledigten Auftrag eine Anfrage vor",
      "lässt Nacharbeiten aus Reklamationen aus",
      "fragt jeden Kunden höchstens alle 180 Tage",
      "fragt nicht, wenn der Kunde zuletzt unzufrieden war",
      "sucht den passenden Kanal: Mail, sonst SMS",
      "fragt nach, wer einen neuen Kunden empfohlen hat",
    ],
    geraete: {
      handy: [
        "Anfrage nach der Abnahme freigeben",
        "Rückmeldung des Kunden gleich eintragen",
        "Am Kunden sehen, wer ihn empfohlen hat",
      ],
      computer: [
        "Alle vorbereiteten und gesendeten Anfragen",
        "Liste der Empfehler mit Rangfolge",
        "Bewertungslink und Text der Anfrage prüfen",
      ],
      handyVisual: {
        kopf: "Bewertung anfragen",
        titel: "Familie Krüger",
        sub: "Badsanierung · erledigt",
        tags: [
          { text: "per Mail", ton: "sky" },
          { text: "keine Reklamation", ton: "moss" },
        ],
        felder: [
          { label: "Zuletzt gefragt", wert: "noch nie" },
          { label: "Zufriedenheit", wert: "sehr zufrieden" },
          { label: "Empfohlen von", wert: "Fam. Schulte" },
        ],
        aktion: { icon: "check", text: "Anfrage senden" },
      },
    },
    gewerke: [
      { slug: "maler", text: "Nach dem frisch gestrichenen Wohnzimmer ist der Kunde stolz – genau dann kommt die Anfrage." },
      { slug: "galabau", text: "Viele Aufträge kommen über die Nachbarn. Du siehst, wer dich empfohlen hat." },
      { slug: "elektriker", text: "Kleine Aufträge, viele Stammkunden: Keiner wird öfter als alle 180 Tage gefragt." },
    ],
    kunde: {
      slug: "malerei-koch",
      text: "Beispiel: Wie ein Malerbetrieb nach jeder Abnahme um eine Bewertung bittet, ohne daran denken zu müssen.",
    },
    faq: [
      {
        frage: "Schickt Macher die Anfragen ohne mich ab?",
        antwort:
          "Nein. Macher bereitet nur vor. Gesendet wird erst, wenn du freigibst – eine gesendete Anfrage lässt sich nicht zurückholen.",
      },
      {
        frage: "Liest Macher meine Google-Bewertungen aus?",
        antwort:
          "Nein. Macher merkt sich nur, wen du gefragt hast und was der Kunde dir selbst gesagt hat. Bewertungen werden weder abgerufen noch erzeugt.",
      },
      {
        frage: "Was ist, wenn ein Kunde keine Mail-Adresse hat?",
        antwort:
          "Dann geht die Anfrage per SMS. Fehlt beides, sagt dir Macher Bescheid und bringt dich zum Kunden, um die Nummer nachzutragen.",
      },
      {
        frage: "Wie siehst du, wer dich empfohlen hat?",
        antwort:
          "Beim Anlegen eines Kunden mit Quelle „Empfehlung“ trägst du den Empfehler ein. Fehlt er, fragt Macher nach. Danach siehst du, wer dich am häufigsten empfiehlt, und hakst ab, wenn du dich bedankt hast.",
      },
    ],
    verwandt: ["kunden", "abnahme", "reklamationen"],
  },

  /* ───────────────────────── Online-Terminbuchung ───────────────────────── */

  terminbuchung: {
    icon: "link",
    kurz: "Kunden buchen freie Termine über deinen Link – du bestätigst nur noch.",
    enthalten: ["Buchungslink", "Terminarten", "Bestätigen", "Persönlicher Link je Kunde"],
    meta: {
      title: "Online-Terminbuchung für Handwerker – Kunden buchen selbst",
      description:
        "Kunden buchen Besichtigung oder Reparatur über deinen Link – nur echte freie Zeiten. Macher OS legt Kunde, Anfrage und Termin an. Du bestätigst mit einem Klick.",
    },
    hero: {
      titel: "Der Kunde bucht. Das Telefon bleibt ruhig.",
      problem:
        "Jede Terminabsprache sind zwei, drei Anrufe. Der Chef steht auf der Baustelle, das Büro ist halbtags besetzt. Wer niemanden erreicht, ruft den nächsten Betrieb an.",
      loesung:
        "Du schickst deinen Buchungslink. Der Kunde sieht nur Zeiten, die wirklich frei sind, und bucht selbst. Kunde, Anfrage und Termin legt Macher an.",
    },
    visual: {
      bereich: "Planen",
      titel: "Terminbuchung",
      untertitel: "2 Terminarten buchbar",
      kennzahlen: [
        ["4", "online gebucht"],
        ["2", "bitte bestätigen"],
        ["1", "neuer Kunde"],
      ],
      liste: {
        ueberschrift: "Bitte bestätigen",
        zeilen: [
          { titel: "Besichtigung vor Ort · S. Krüger", sub: "Do, 16.10. · 10:00 Uhr · Jana", tag: "neu", ton: "signal" },
          { titel: "Kundendienst / Reparatur · Hr. Basler", sub: "Fr, 17.10. · 8:00 Uhr · Mehmet", tag: "Stammkunde", ton: "moss" },
          { titel: "Besichtigung vor Ort · WEG Am Park", sub: "Di, 21.10. · 13:30 Uhr", tag: "bestätigt", ton: "sky" },
        ],
      },
      hinweis: {
        icon: "calendar",
        ton: "sky",
        titel: "Online gebucht:",
        text: "Sabine Krüger hat eine Besichtigung gebucht. Kunde und Anfrage sind angelegt.",
      },
    },
    problemTitel: "Termine machen kostet mehr Zeit als der Termin selbst.",
    probleme: [
      {
        titel: "Telefon-Pingpong",
        text: "„Passt Dienstag?“ – „Nein.“ – „Ich rufe zurück.“ Drei Anrufe für einen Termin. Und beim dritten bist du gerade auf dem Dach.",
      },
      {
        titel: "Online gebucht, doppelt belegt",
        text: "Ein Buchungstool ohne Verbindung zum Plan. Der Kunde bucht Dienstag zehn Uhr – da ist der Monteur längst woanders.",
      },
      {
        titel: "Buchung im Postfach",
        text: "Die Buchung kommt als Mail. Jemand muss sie lesen, den Kunden anlegen und den Termin von Hand eintragen.",
      },
      {
        titel: "Morgen früh, ohne Vorbereitung",
        text: "Der Kunde bucht für morgen sieben Uhr. Material, Fahrt, Unterlagen – nichts ist vorbereitet.",
      },
    ],
    loesung: {
      titel: "Freie Zeiten direkt aus deinem Plan.",
      text: "Du legst fest, welche Terminarten buchbar sind: wie lang, an welchen Tagen, zu welchen Uhrzeiten, mit wie viel Vorlauf und Puffer. Der Kunde sieht nur Zeiten, an denen jemand frei ist. Bucht er, landet alles da, wo es hingehört.",
      punkte: [
        "Terminarten wie Besichtigung oder Reparatur mit eigener Dauer",
        "Nur echte freie Zeiten – mit Vorlauf und Puffer für die Fahrt",
        "Kunde, Anfrage und Termin in einem Schritt angelegt",
        "Bestehende Kunden werden über Telefon oder Mail erkannt",
      ],
    },
    detail: {
      kopf: "Online gebucht · heute 21:14",
      titel: "Besichtigung vor Ort",
      sub: "Sabine Krüger · Gartenstr. 3, Hannover",
      status: { text: "bitte bestätigen", ton: "signal" },
      zeilen: [
        { label: "Termin", wert: "Do, 16.10. · 10:00–11:00 Uhr" },
        { label: "Übernimmt", wert: "Jana" },
        { label: "Anliegen", wert: "Bad neu, ca. 8 m²" },
        { label: "Kunde", wert: "neu angelegt" },
        { label: "Nächster Schritt", wert: "Termin bestätigen", hervor: true },
      ],
      fuss: { icon: "spark", text: "Macher hat Jana eingeteilt – sie ist diese Woche am wenigsten verplant." },
    },
    schritte: [
      {
        titel: "Terminarten festlegen",
        text: "Zum Beispiel Besichtigung 60 Minuten und Reparatur 90 Minuten. Tage, Uhrzeiten, Vorlauf und wer die Termine übernimmt.",
      },
      {
        titel: "Link teilen",
        text: "Den allgemeinen Link auf deine Webseite oder in die Mail-Signatur. Stammkunden bekommen einen eigenen Link, ihre Daten sind schon ausgefüllt.",
      },
      {
        titel: "Kunde bucht",
        text: "Terminart, Tag, Uhrzeit, Kontakt – am Handy in wenigen Schritten. Danach kann er den Termin in seinen Kalender übernehmen.",
      },
      {
        titel: "Du bestätigst",
        text: "Die Buchung steht im Kalender und wartet auf deine Bestätigung. Ein Klick, fertig.",
      },
    ],
    automatisch: [
      "zeigt nur Zeiten, die im Plan wirklich frei sind",
      "prüft vor dem Speichern noch einmal, ob die Zeit frei ist",
      "legt Kunde, Ort, Anfrage und Termin an",
      "erkennt bestehende Kunden an Telefon oder Mail",
      "teilt den Mitarbeiter ein, der in der Woche am wenigsten verplant ist",
      "macht aus einer vergebenen Zeit eine Anfrage mit Wunschtermin",
    ],
    geraete: {
      handy: [
        "Kunden buchen bequem am eigenen Handy",
        "Nachricht bei neuer Online-Buchung",
        "Buchung unterwegs bestätigen",
      ],
      computer: [
        "Terminarten mit Dauer, Zeiten und Puffer einrichten",
        "Liste „Bitte bestätigen“ – einzeln oder alle",
        "Persönlichen Link am Kunden kopieren",
      ],
      handyVisual: {
        kopf: "Termin buchen · Malerei Koch",
        titel: "Besichtigung vor Ort",
        sub: "60 Minuten · bei Ihnen zu Hause",
        tags: [
          { text: "Do, 16.10.", ton: "sky" },
          { text: "noch 3 Zeiten frei", ton: "moss" },
        ],
        felder: [
          { label: "Uhrzeit", wert: "10:00 Uhr" },
          { label: "Name", wert: "Sabine Krüger" },
          { label: "Telefon", wert: "0511 …" },
        ],
        aktion: { icon: "calendar", text: "Termin buchen" },
      },
    },
    gewerke: [
      { slug: "maler", text: "Besichtigungen bucht der Kunde selbst – du kommst mit Zollstock und Farbfächer." },
      { slug: "shk", text: "Kundendienst und kleine Reparaturen: feste Zeitfenster, keine Anrufe zwischen zwei Einsätzen." },
      { slug: "fliesenleger", text: "Aufmaß-Termine ohne Rückrufe – mit Puffer für die Fahrt dazwischen." },
    ],
    kunde: {
      slug: "malerei-koch",
      text: "Beispiel: Wie ein Malerbetrieb Besichtigungen buchen lässt, statt abends zurückzurufen.",
    },
    faq: [
      {
        frage: "Kann ein Kunde einen Termin buchen, an dem schon etwas geplant ist?",
        antwort:
          "Nein. Der Kunde sieht nur Zeiten, an denen jemand frei ist – Termine, Abwesenheiten und Puffer sind schon abgezogen. Ist die Zeit kurz vor dem Buchen doch weg, legt Macher eine Anfrage mit dem Wunschtermin an und meldet sich bei dir.",
      },
      {
        frage: "Muss ich jede Buchung bestätigen?",
        antwort:
          "Am Anfang ja. Wenn du willst, schaltest du die automatische Bestätigung ein: Passt alles ohne Konflikt, bestätigt Macher sofort. Das kannst du jederzeit zurücknehmen.",
      },
      {
        frage: "Kann ich festlegen, wer die gebuchten Termine übernimmt?",
        antwort:
          "Ja. Je Terminart wählst du die Mitarbeiter. Lässt du das offen, kommen alle Monteure und der Chef infrage. Macher teilt den ein, der in der Woche am wenigsten verplant ist.",
      },
      {
        frage: "Kann der Kunde den Termin selbst verschieben oder absagen?",
        antwort:
          "Noch nicht. Dafür ruft er an oder schreibt dir. Gebuchte Termine kann er aber direkt in seinen Kalender übernehmen.",
      },
    ],
    verwandt: ["kalender", "anfragen", "besichtigungen"],
  },

  /* ───────────────────────── Wiederkehrende Termine ───────────────────────── */

  "wiederkehrende-termine": {
    icon: "clock",
    kurz: "Regelmäßige Einsätze einmal als Serie anlegen – die Termine trägt Macher immer drei Monate im Voraus ein.",
    enthalten: ["Serien anlegen", "Einzelne Termine verschieben", "Auslassen", "Serie beenden"],
    meta: {
      title: "Wiederkehrende Termine planen – Wartung und Pflege als Serie",
      description:
        "Wöchentlich, monatlich, alle sechs Monate oder jährlich: Macher OS trägt Serientermine drei Monate im Voraus ein, schiebt Wochenenden auf Montag und warnt, wenn ein Mitarbeiter im Urlaub ist.",
    },
    hero: {
      titel: "Einmal anlegen. Die Termine kommen von selbst.",
      problem:
        "Die Grünpflege jeden Dienstag, die Sichtprüfung jeden Monat, die Wartung alle sechs Monate. Alles wird von Hand eingetragen – oder steht nur im Kopf.",
      loesung:
        "Du legst eine Serie an. Macher trägt die Termine immer drei Monate im Voraus in den Kalender ein und meldet sich, wenn ein eingeteilter Mitarbeiter fehlt.",
    },
    visual: {
      bereich: "Planen",
      titel: "Wiederkehrende Termine",
      untertitel: "laufende Serien",
      kennzahlen: [
        ["9", "laufende Serien"],
        ["14", "Termine diesen Monat"],
        ["1", "Konflikt"],
      ],
      liste: {
        ueberschrift: "Serien",
        zeilen: [
          { titel: "Rasen und Hecke · WEG Lindenhof", sub: "wöchentlich · dienstags 7:30 Uhr", tag: "Ali, Tom", ton: "moss" },
          { titel: "Sichtprüfung Backofenlüftung", sub: "monatlich · ab 13:30 Uhr", tag: "Mehmet", ton: "sky" },
          { titel: "Wartung Wärmepumpe · Praxis Lenz", sub: "alle 6 Monate · aus Servicevertrag", tag: "niemand", ton: "signal" },
        ],
      },
      hinweis: {
        icon: "achtung",
        ton: "signal",
        titel: "Mitarbeiter fehlt:",
        text: "Serientermin am 28.10.: Mehmet hat Urlaub. Verschieb den Termin oder teile jemand anderen ein.",
      },
    },
    problemTitel: "Regelmäßige Arbeit braucht keine unregelmäßige Planung.",
    probleme: [
      {
        titel: "Jede Woche dasselbe eintippen",
        text: "Der Pflegeauftrag läuft das ganze Jahr. Trotzdem trägt das Büro jeden Termin einzeln ein. Fällt eine Woche aus, merkt es keiner.",
      },
      {
        titel: "Ein Termin verschoben, alle verschoben",
        text: "Wegen eines Feiertags soll ein Termin auf Mittwoch. Im normalen Kalender rutscht gleich die ganze Serie mit.",
      },
      {
        titel: "Der Monteur ist im Urlaub",
        text: "Der Serientermin steht seit Monaten. Dass der eingeteilte Kollege genau dann Urlaub hat, fällt erst am Morgen auf.",
      },
      {
        titel: "Vertrag gekündigt, Termine laufen weiter",
        text: "Der Kunde hat gekündigt. Im Kalender stehen trotzdem noch Termine bis Jahresende – und jemand fährt hin.",
      },
    ],
    loesung: {
      titel: "Serien mit Verstand.",
      text: "Eine Serie merkt sich die Regel, die Uhrzeit, die Dauer und wer hinfährt. Daraus entstehen echte Termine im Kalender – wie jeder andere Termin auch. Einzelne Termine kannst du verschieben oder auslassen, ohne die Serie zu ändern.",
      punkte: [
        "Wöchentlich, monatlich, alle N Monate oder jährlich",
        "Vorschau der nächsten Termine schon beim Anlegen",
        "Einzelnen Termin verschieben, auslassen oder wieder aufnehmen",
        "Mit Kunde, Ort, Anlage und Servicevertrag verbunden",
      ],
    },
    detail: {
      kopf: "Serie · monatlich",
      titel: "Sichtprüfung Backofenlüftung",
      sub: "Bäckerei Ahrens · Backstube, Lindenstr. 4",
      status: { text: "läuft", ton: "moss" },
      zeilen: [
        { label: "Regel", wert: "monatlich, nur werktags" },
        { label: "Uhrzeit", wert: "13:30 Uhr · 60 Minuten" },
        { label: "Mitarbeiter", wert: "Mehmet" },
        { label: "Notiz", wert: "Erst ab 13 Uhr – vorher läuft der Ofen" },
        { label: "Nächster Termin", wert: "Mo, 3. November", hervor: true },
      ],
      fuss: { icon: "spark", text: "Macher hat drei Termine bis Januar eingetragen. Der 1. November fiel auf einen Samstag – er liegt jetzt am Montag." },
    },
    schritte: [
      {
        titel: "Serie anlegen",
        text: "Titel, Regel, erster Termin, Uhrzeit und Dauer. Dazu Kunde, Ort und wer hinfährt. Die Vorschau zeigt die nächsten Termine.",
      },
      {
        titel: "Termine stehen im Kalender",
        text: "Macher trägt die Termine drei Monate im Voraus ein und füllt laufend nach. Jeder Termin nur einmal.",
      },
      {
        titel: "Ausnahmen regeln",
        text: "Einen Termin verschieben oder auslassen – die Serie bleibt, wie sie ist. Ausgelassene Termine holst du mit einem Klick zurück.",
      },
      {
        titel: "Serie beenden",
        text: "Ist der Vertrag zu Ende, beendest du die Serie. Künftige Termine werden abgesagt, es kommen keine neuen.",
      },
    ],
    automatisch: [
      "trägt Serientermine drei Monate im Voraus ein",
      "legt jedes Vorkommen nur einmal an – auch nach dem Löschen",
      "rechnet das Monatsende richtig, auch im Februar",
      "schiebt Termine vom Wochenende auf Montag, wenn du willst",
      "warnt, wenn ein eingeteilter Mitarbeiter abwesend ist",
      "meldet Serientermine, für die niemand eingeteilt ist",
    ],
    geraete: {
      handy: [
        "Serientermine im eigenen Tagesplan sehen",
        "Notiz zur Serie vor Ort lesen",
        "Am Termin sehen, zu welcher Serie er gehört",
      ],
      computer: [
        "Alle laufenden Serien in einer Liste",
        "Termine verschieben, auslassen, wieder aufnehmen",
        "Serie an Anlage oder Servicevertrag hängen",
      ],
      handyVisual: {
        kopf: "Serientermin · Di 7:30",
        titel: "Rasen und Hecke",
        sub: "WEG Lindenhof · Lindenhof 2–6",
        tags: [
          { text: "wöchentlich", ton: "sky" },
          { text: "Ali, Tom", ton: "moss" },
        ],
        felder: [
          { label: "Dauer", wert: "3 Stunden" },
          { label: "Notiz", wert: "Schlüssel beim Hausmeister" },
          { label: "Nächster", wert: "Di, 21.10." },
        ],
        aktion: { icon: "route", text: "Route starten" },
      },
    },
    gewerke: [
      { slug: "galabau", text: "Pflegeverträge, Winterdienst, Rasenschnitt: wöchentlich als Serie, jeder Termin im Plan." },
      { slug: "shk", text: "Wartung alle sechs oder zwölf Monate – passend zum Servicevertrag." },
      { slug: "gebaeude-service", text: "Hausmeisterdienste und Reinigung im festen Rhythmus, mit Notizen für jedes Objekt." },
    ],
    kunde: {
      slug: "gruen-werk",
      text: "Beispiel: Wie ein Gartenbaubetrieb seine Pflegeverträge als Serien plant, statt jede Woche neu einzutragen.",
    },
    faq: [
      {
        frage: "Warum trägt Macher nur drei Monate im Voraus ein?",
        antwort:
          "Damit der Kalender übersichtlich bleibt. Macher füllt laufend nach. So stehen nie Jahre an Terminen im Plan, und Änderungen an der Serie greifen schnell.",
      },
      {
        frage: "Was passiert, wenn ich einen Serientermin lösche?",
        antwort:
          "Er kommt nicht wieder. Macher merkt sich, welche Termine schon angelegt wurden. Willst du ihn doch, nimmst du ihn in der Serie wieder auf.",
      },
      {
        frage: "Geht auch „jeder zweite Dienstag im Monat“?",
        antwort:
          "Nein. Es gibt wöchentlich, alle paar Wochen, monatlich, alle N Monate und jährlich. Feiertage regelst du, indem du einzelne Termine verschiebst oder auslässt.",
      },
      {
        frage: "Wie hängen Serie und Wartung zusammen?",
        antwort:
          "Hängst du die Serie an eine Anlage, verbindet Wartung & Service den passenden Serientermin mit dem Wartungsauftrag. Aus einem Servicevertrag kannst du die Termine direkt als Serie planen.",
      },
    ],
    verwandt: ["kalender", "wartung", "servicevertraege"],
  },

  /* ───────────────────────── Macher fragen ───────────────────────── */

  "macher-fragen": {
    icon: "spark",
    kurz: "Frag Macher wie deine Bürokraft – er antwortet aus deinen Daten und bereitet Aufgaben vor.",
    enthalten: ["Fragen stellen", "Infos finden", "Aktionen vorbereiten", "Erst nach deinem Okay"],
    meta: {
      title: "KI-Bürokraft für Handwerker – Macher beantwortet Fragen aus deinen Daten",
      description:
        "„Was steht morgen an?“ – „Welche Rechnungen sind offen?“ Macher antwortet aus deinen Daten in Macher OS, mit Quelle. Aufgaben und Nachrichten bereitet er vor. Ausgeführt wird erst, wenn du bestätigst.",
    },
    hero: {
      titel: "Frag einfach. Wie deine beste Bürokraft.",
      problem:
        "Was steht morgen an? Wer hat nächste Woche Zeit? Welche Rechnungen sind offen? Für jede Antwort klickst du dich durch drei Listen – oder rufst im Büro an.",
      loesung:
        "Du stellst die Frage in deinen Worten. Macher antwortet kurz aus deinen Daten, mit Links zu den Quellen. Aufgaben und Nachrichten bereitet er vor – ausgeführt wird erst, wenn du bestätigst.",
    },
    visual: {
      bereich: "Heute",
      titel: "Macher fragen",
      untertitel: "„Welche Rechnungen sind offen?“",
      kennzahlen: [
        ["4", "offene Rechnungen"],
        ["7.840 €", "offen gesamt"],
        ["1", "überfällig"],
      ],
      liste: {
        ueberschrift: "Antwort aus deinen Daten",
        zeilen: [
          { titel: "R-2026-091 · Familie Wendt", sub: "fällig seit 9 Tagen", wert: "2.310 €", tag: "überfällig", ton: "signal" },
          { titel: "R-2026-097 · WEG Lindenhof", sub: "fällig am 24.10.", wert: "3.980 €", ton: "sky" },
          { titel: "R-2026-099 · Hr. Öztürk", sub: "fällig am 29.10.", wert: "1.550 €", ton: "sky" },
        ],
      },
      hinweis: {
        icon: "shield",
        ton: "moss",
        titel: "Du entscheidest:",
        text: "Soll Macher Familie Wendt erinnern? Die Erinnerung ist vorbereitet – gesendet wird erst nach deinem Okay.",
      },
    },
    problemTitel: "Die Info ist da. Nur nicht da, wo du gerade bist.",
    probleme: [
      {
        titel: "Fünf Listen für eine Antwort",
        text: "„Was steht morgen an?“ Dafür schaust du in den Kalender, in die Aufträge und in die Aufgaben. Dreimal klicken pro Bereich.",
      },
      {
        titel: "Die Adresse am Handy suchen",
        text: "Der Monteur steht im Auto und braucht die Adresse von Familie Hoffmann. Mit Handschuhen tippt er sich durch drei Menüs.",
      },
      {
        titel: "Zwischen Tür und Angel vergeben",
        text: "„Jonas, prüf bis Freitag die Leiter.“ Gesagt im Vorbeigehen, aufgeschrieben nirgends. Am Freitag weiß keiner mehr davon.",
      },
      {
        titel: "KI, der man nicht traut",
        text: "Eine Antwort ohne Quelle hilft nicht. Und eine KI, die einfach etwas verschickt, will im Betrieb keiner haben.",
      },
    ],
    loesung: {
      titel: "Antworten mit Quelle. Aktionen erst nach deinem Okay.",
      text: "Macher kennt deinen Betrieb: Termine, Aufträge, Kunden, Rechnungen, dein Team. Er antwortet kurz und zeigt, worauf die Antwort beruht. Soll etwas passieren, legt er einen Vorschlag an, den du ändern kannst. Erst wenn du bestätigst, wird er ausgeführt – und lässt sich bei Bedarf zurücknehmen.",
      punkte: [
        "Fragen in deinen Worten: Termine, Rechnungen, Angebote, Anfragen, Team",
        "Jede Antwort mit Links zu den Quellen und Stand der Daten",
        "Aufgaben, Erinnerungen und Nachrichten als Entwurf zum Prüfen",
        "Gleiche Rechte wie du – Macher sieht nicht mehr als du",
      ],
    },
    detail: {
      kopf: "Macher fragen · Vorschlag",
      titel: "Aufgabe für Jonas: Leiter prüfen",
      sub: "aus „Leg eine Aufgabe für Jonas an: Leiter prüfen bis Freitag“",
      status: { text: "Entwurf", ton: "sand" },
      zeilen: [
        { label: "Für", wert: "Jonas" },
        { label: "Fällig", wert: "Fr, 17. Oktober" },
        { label: "Aufgabe", wert: "Leiter prüfen" },
        { label: "Ausgeführt", wert: "noch nicht" },
        { label: "Nächster Schritt", wert: "Aufgabe anlegen", hervor: true },
      ],
      fuss: { icon: "shield", text: "Macher hat „bis Freitag“ als Datum eingetragen. Angelegt wird erst, wenn du bestätigst." },
    },
    schritte: [
      {
        titel: "Frage stellen",
        text: "Über „Suchen oder fragen“ oben in Macher OS. Zum Beispiel: „Wer hat nächste Woche Zeit?“",
      },
      {
        titel: "Macher antwortet",
        text: "Kurz und klar, mit einer Liste und Links zu Kunde, Auftrag oder Rechnung. Darunter steht, worauf die Antwort beruht.",
      },
      {
        titel: "Vorschlag prüfen",
        text: "Soll etwas passieren – Aufgabe, Erinnerung, Nachricht –, legt Macher einen Entwurf an. Du kannst ihn ändern.",
      },
      {
        titel: "Du bestätigst",
        text: "Erst mit deinem Klick wird ausgeführt. Was noch nicht beim Kunden ist, kannst du rückgängig machen.",
      },
    ],
    automatisch: [
      "versteht Zeitangaben wie „bis Freitag“ oder „nächste Woche“",
      "findet Kunden auch bei ähnlicher Schreibweise, etwa Müller und Mueller",
      "schätzt freie Zeit im Team aus Wochenstunden, Terminen und Urlaub",
      "gibt eine Frage ohne Treffer in der Suche direkt an Macher weiter",
      "fragt vor jeder kritischen Aktion nach deiner Bestätigung",
      "schreibt jede ausgeführte Aktion in den Verlauf des Auftrags oder Kunden",
    ],
    geraete: {
      handy: [
        "Adresse und Hinweise zur Baustelle erfragen",
        "„Meine Aufgaben“ über alle Aufträge hinweg",
        "Aufgabe für Kollegen in einem Satz anlegen",
      ],
      computer: [
        "Offene Rechnungen, Angebote und Anfragen auf einen Blick",
        "Freie Zeit im Team für nächste Woche",
        "Pläne mit mehreren Schritten prüfen und bestätigen",
      ],
      handyVisual: {
        kopf: "Macher fragen",
        titel: "„Wo ist Familie Hoffmann?“",
        sub: "Antwort aus deinen Daten · Stand 7:42 Uhr",
        tags: [
          { text: "Kunde", ton: "sky" },
          { text: "Auftrag läuft", ton: "moss" },
        ],
        felder: [
          { label: "Adresse", wert: "Ahornweg 12, Hannover" },
          { label: "Auftrag", wert: "Bad Erdgeschoss" },
          { label: "Hinweis", wert: "Schlüssel bei Nachbarin" },
        ],
        aktion: { icon: "route", text: "Route starten" },
      },
    },
    gewerke: [
      { slug: "elektriker", text: "„Was fehlt noch für die Baustelle Wagner?“ – Material, Aufgaben und Checklisten in einer Antwort." },
      { slug: "bau", text: "„Wer hat nächste Woche Zeit?“ – freie Stunden im Team, Urlaub schon abgezogen." },
      { slug: "dachdecker", text: "Vom Dach aus fragen, statt im Büro anzurufen: Adresse, Termin, Ansprechpartner." },
    ],
    kunde: {
      slug: "elektro-brandt",
      text: "Beispiel: Wie ein Elektrobetrieb Fragen zum Tag an Macher stellt, statt das Büro anzurufen.",
    },
    faq: [
      {
        frage: "Macht Macher Dinge, ohne zu fragen?",
        antwort:
          "Nein. Fragen beantwortet er sofort. Alles, was etwas ändert, legt er als Vorschlag an. Was nach außen geht – Nachricht, Rechnung, Angebot – oder Geld und Personal betrifft, braucht immer deine Bestätigung.",
      },
      {
        frage: "Sieht Macher mehr als ich?",
        antwort:
          "Nein. Macher hat dieselben Rechte wie die Person, die fragt. Ein Monteur ohne Recht für Geld bekommt auch von Macher keine Preise oder offenen Beträge.",
      },
      {
        frage: "Woher kommen die Antworten?",
        antwort:
          "Aus deinen Daten in Macher OS. Jede Antwort zeigt Links zu den Quellen und den Stand der Daten. Findet Macher nichts, sagt er das – und erfindet keine Antwort.",
      },
      {
        frage: "Was passiert mit meinen Daten, wenn ein KI-Modell hilft?",
        antwort:
          "Die meisten Fragen beantwortet Macher mit festen Regeln, ganz ohne Modell. Hilft ein Modell, bekommt es nur das, was für die eine Aufgabe nötig ist. Jede Frage und jede Aktion wird protokolliert.",
      },
    ],
    verwandt: ["automatisch-erledigen", "mein-tag", "aufgaben"],
  },
} satisfies Partial<Record<StandardSlug, FunktionInhalt>>;
