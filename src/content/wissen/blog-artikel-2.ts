import type { BlogArtikel } from "./blog-typen";

export const artikelTeil2: BlogArtikel[] = [
  {
    slug: "mitarbeiter-handwerk-finden-und-halten",
    titel: "Mitarbeiter im Handwerk finden und halten",
    beschreibung:
      "Gute Leute sind knapp. So findest du neue Mitarbeiter fürs Handwerk, arbeitest sie richtig ein und sorgst dafür, dass sie bleiben – praxisnah und ohne Agentur-Sprech.",
    kurzantwort:
      "Die besten Bewerber kommen meist über Empfehlungen, ein ehrliches Bild vom Betrieb und eine schnelle Antwort. Halten tust du Leute vor allem mit verlässlicher Planung, guter Einarbeitung, fairer Bezahlung und einem Chef, der zuhört. Das ist kein Hexenwerk, braucht aber feste Abläufe.",
    datum: "2026-05-12",
    themen: ["mitarbeiter", "fuehrung"],
    gewerke: [],
    beliebt: true,
    werkzeuge: [],
    vorlagen: ["checkliste-unterweisung-neue-mitarbeiter", "stundenzettel"],
    funktionen: ["mitarbeiter", "schulungen", "qualifikationen", "einsatzplanung"],
    inhalt: [
      { typ: "h2", id: "ausgangslage", text: "Die Ausgangslage" },
      {
        typ: "p",
        text: "In vielen Gewerken suchen Betriebe länger nach Gesellen, Meistern und Azubis, als ihnen lieb ist. Gleichzeitig wechseln gute Leute, wenn sie woanders mehr Ruhe, bessere Planung oder mehr Wertschätzung finden. Beides kannst du beeinflussen – auch als kleiner Betrieb ohne Personalabteilung.",
      },
      { typ: "h2", id: "finden", text: "Neue Mitarbeiter finden" },
      { typ: "h3", text: "Zeig, wie es bei dir wirklich ist" },
      {
        typ: "p",
        text: "Stellenanzeigen mit „dynamisches Team“ und „leistungsgerechte Bezahlung“ liest niemand mehr. Schreib konkret: Welche Arbeiten, welches Einsatzgebiet, welche Arbeitszeiten, welches Fahrzeug, wann ist Feierabend? Fotos von echten Baustellen und vom echten Team wirken mehr als Bilder aus der Fotodatenbank.",
      },
      { typ: "h3", text: "Empfehlungen nutzen" },
      {
        typ: "p",
        text: "Deine Mitarbeiter kennen andere Handwerker. Sag ihnen, dass du suchst, und belohne erfolgreiche Empfehlungen, zum Beispiel mit einer Prämie nach der Probezeit. Wer selbst gern bei dir arbeitet, empfiehlt dich auch.",
      },
      { typ: "h3", text: "Schnell und einfach bewerben lassen" },
      {
        typ: "liste",
        punkte: [
          "Bewerbung per Telefon, WhatsApp oder kurzem Formular erlauben – kein Anschreiben verlangen.",
          "Innerhalb von ein bis zwei Tagen antworten. Wer wartet, ist oft schon woanders.",
          "Probearbeiten anbieten: Beide Seiten sehen schnell, ob es passt.",
          "Fahrzeug, Werkzeug und Arbeitskleidung klar nennen.",
        ],
      },
      { typ: "h3", text: "Azubis früh ansprechen" },
      {
        typ: "p",
        text: "Praktika, Schulkooperationen und Ausbildungsmessen bringen junge Leute in den Betrieb. Wichtig ist, dass Praktikanten wirklich mitarbeiten dürfen und nicht nur fegen. Wer eine gute Woche hatte, erzählt es weiter.",
      },
      { typ: "h2", id: "einarbeiten", text: "Gut einarbeiten" },
      {
        typ: "p",
        text: "Die ersten Wochen entscheiden, ob jemand bleibt. Ein fester Plan hilft: Wer ist Ansprechpartner, welche Arbeiten kommen zuerst, wann gibt es ein Gespräch? Vergiss die Pflichtthemen nicht: Neue Mitarbeiter müssen vor dem ersten Einsatz zu Arbeitsschutz und Gefahren am Arbeitsplatz unterwiesen werden – und die Unterweisung sollte dokumentiert sein.",
      },
      {
        typ: "liste",
        nummeriert: true,
        punkte: [
          "Erster Tag: Begrüßung, Rundgang, Arbeitskleidung, Fahrzeug, App-Zugang, Sicherheitsunterweisung.",
          "Erste Woche: Mit einem erfahrenen Kollegen mitlaufen, typische Aufträge kennenlernen.",
          "Nach vier Wochen: Gespräch – was läuft gut, was fehlt?",
          "Vor Ende der Probezeit: ehrliche Rückmeldung in beide Richtungen.",
        ],
      },
      { typ: "h2", id: "halten", text: "Gute Leute halten" },
      { typ: "h3", text: "Verlässliche Planung" },
      {
        typ: "p",
        text: "Nichts nervt mehr, als morgens nicht zu wissen, wo es hingeht, oder auf der Baustelle zu stehen, ohne dass das Material da ist. Wer seinen Einsatz am Vorabend auf dem Handy sieht, inklusive Adresse, Ansprechpartner und Material, fängt entspannter an. Planbare Feierabende und Urlaube sind für viele wichtiger als ein paar Euro mehr.",
      },
      { typ: "h3", text: "Faire Bezahlung und Perspektive" },
      {
        typ: "p",
        text: "Geld ist nicht alles, aber unfaire Bezahlung treibt Leute weg. Zeig außerdem Entwicklung: Weiterbildung, Meisterschule, mehr Verantwortung als Vorarbeiter, Spezialisierung. Wer sieht, dass er im Betrieb weiterkommt, sucht seltener woanders.",
      },
      { typ: "h3", text: "Wertschätzung im Alltag" },
      {
        typ: "liste",
        punkte: [
          "Gute Arbeit konkret loben – nicht nur Fehler ansprechen.",
          "Mitarbeiter fragen, bevor neue Abläufe oder Software eingeführt werden.",
          "Werkzeug und Fahrzeuge in gutem Zustand halten.",
          "Regelmäßige, kurze Einzelgespräche führen – mindestens einmal im Jahr, besser öfter.",
          "Weniger Zettelkram: Stundenzettel und Berichte digital, damit der Feierabend Feierabend ist.",
        ],
      },
      { typ: "h2", id: "kuendigung", text: "Wenn doch jemand geht" },
      {
        typ: "p",
        text: "Nicht jede Kündigung lässt sich verhindern. Führ trotzdem ein ruhiges Abschlussgespräch und frag ehrlich nach den Gründen. Oft hörst du dort Dinge, die im Alltag niemand sagt: dauernde Umplanungen, unklare Zuständigkeiten, ein schlechtes Fahrzeug, zu wenig Rückmeldung. Diese Hinweise sind wertvoll für alle, die bleiben.",
      },
      {
        typ: "p",
        text: "Sorg außerdem dafür, dass Wissen nicht mit dem Mitarbeiter geht. Wenn Kundenbesonderheiten, Anlagendaten und Baustellenfotos am Auftrag gespeichert sind und nicht im Kopf oder auf dem privaten Handy, kann ein Kollege nahtlos übernehmen. Und manche ehemaligen Mitarbeiter kommen nach ein paar Jahren gern zurück, wenn der Abschied fair war.",
      },
      { typ: "h2", id: "beispiel", text: "Beispiel" },
      {
        typ: "beispiel",
        titel: "Beispiel: Elektrobetrieb mit acht Mitarbeitern",
        text: "Der Betrieb sucht einen Gesellen. Statt einer Anzeige im Jobportal fragt der Chef zuerst sein Team. Ein Monteur kennt jemanden aus der Berufsschule, der unzufrieden mit ständig wechselnden Baustellen ist. Nach einem Telefonat folgt ein Probetag. Der Bewerber sieht, dass jeder morgens seinen Einsatz in der App hat und abends keine Stundenzettel mehr ausfüllt.",
        fazit:
          "Nicht das höchste Gehalt hat überzeugt, sondern der ruhigere Arbeitsalltag. Das ist ein frei erfundenes, typisches Beispiel – aber genau so laufen viele Wechsel ab.",
      },
    ],
    checkliste: {
      titel: "Checkliste Mitarbeiter finden und halten",
      punkte: [
        "Stellenanzeige konkret und ehrlich formuliert",
        "Team nach Empfehlungen gefragt",
        "Bewerbung ohne Anschreiben möglich",
        "Antwort innerhalb von zwei Tagen",
        "Einarbeitungsplan für die ersten vier Wochen",
        "Sicherheitsunterweisung vor dem ersten Einsatz dokumentiert",
        "Einsätze am Vortag sichtbar",
        "Regelmäßige Mitarbeitergespräche eingeplant",
      ],
    },
  },
  {
    slug: "digitalisierung-handwerk-wo-anfangen",
    titel: "Digitalisierung im Handwerk: Wo anfangen?",
    beschreibung:
      "Digitalisierung im Handwerksbetrieb ohne Überforderung: Wo du anfängst, welche Reihenfolge sinnvoll ist und wie du dein Team mitnimmst.",
    kurzantwort:
      "Fang dort an, wo heute am meisten Zeit verloren geht – meist bei Zetteln, doppeltem Abtippen und Suchen. Digitalisiere einen Ablauf nach dem anderen, statt alles auf einmal umzustellen, und nimm dein Team von Anfang an mit.",
    datum: "2026-06-09",
    themen: ["digital-arbeiten", "betrieb-fuehren"],
    gewerke: [],
    werkzeuge: [],
    vorlagen: ["stundenzettel", "checkliste-e-rechnung"],
    funktionen: ["auftraege", "zeiterfassung", "dokumentation", "rechnungen"],
    inhalt: [
      { typ: "h2", id: "warum", text: "Worum es eigentlich geht" },
      {
        typ: "p",
        text: "Digitalisierung ist kein Selbstzweck. Es geht nicht darum, ein Tablet auf die Baustelle zu legen, sondern darum, dass Informationen nur einmal erfasst werden und dann überall dort ankommen, wo sie gebraucht werden. Ein Stundenzettel, der abends abgetippt wird, ist doppelte Arbeit. Ein Foto, das in einer WhatsApp-Gruppe verschwindet, hilft bei der Rechnung nicht.",
      },
      { typ: "h2", id: "bestandsaufnahme", text: "Schritt 1: Ehrliche Bestandsaufnahme" },
      {
        typ: "p",
        text: "Schreib eine Woche lang auf, wo im Betrieb Zeit verloren geht. Frag auch dein Team und das Büro. Typische Antworten:",
      },
      {
        typ: "liste",
        punkte: [
          "Stundenzettel sammeln, entziffern und abtippen",
          "Telefonieren, weil niemand weiß, wo wer gerade ist",
          "Fotos und Notizen zu einem Auftrag suchen",
          "Angebote aus alten Word-Dateien zusammenkopieren",
          "Rechnungen schreiben, weil Leistungen erst zusammengesucht werden müssen",
          "Offenen Zahlungen hinterhertelefonieren",
        ],
      },
      { typ: "h2", id: "reihenfolge", text: "Schritt 2: Die richtige Reihenfolge" },
      {
        typ: "p",
        text: "Bewährt hat sich, entlang des Auftrags vorzugehen – von der Anfrage bis zur Rechnung. Wer gleich alles umstellt, überfordert Team und Büro. Wer zu klein anfängt, hat am Ende viele einzelne Programme, die nicht miteinander reden.",
      },
      {
        typ: "liste",
        nummeriert: true,
        punkte: [
          "Kunden und Aufträge an einem Ort: Jede Anfrage wird zum Auftrag, alle Infos hängen daran.",
          "Zeiten und Fotos vom Handy: Mitarbeiter erfassen direkt beim Auftrag, was sie gemacht haben.",
          "Planung sichtbar machen: Jeder sieht seine Einsätze, das Büro sieht alle.",
          "Angebote und Rechnungen aus den vorhandenen Daten erstellen – ohne Abtippen.",
          "Erst danach: Material, Lager, Auswertungen und Automatisierung.",
        ],
      },
      {
        typ: "hinweis",
        titel: "E-Rechnung mitdenken",
        text: "Seit 2025 müssen alle Betriebe E-Rechnungen von Geschäftskunden empfangen können, ab 2027 bzw. 2028 kommt die Pflicht zum Verschicken. Achte bei der Wahl der Software darauf, dass sie das kann.",
      },
      { typ: "h2", id: "software", text: "Schritt 3: Software auswählen" },
      {
        typ: "p",
        text: "Achte weniger auf die Zahl der Funktionen und mehr darauf, ob die Software im Alltag funktioniert. Kann ein Monteur sie ohne Schulung auf dem Handy bedienen? Funktioniert sie auch ohne Netz im Keller? Kannst du deine bestehenden Kunden und Artikel übernehmen? Gibt es einen Ansprechpartner, wenn etwas hakt?",
      },
      {
        typ: "liste",
        punkte: [
          "Kostenlos testen – mit echten Aufträgen, nicht nur mit Beispieldaten.",
          "Einen Mitarbeiter aus der Baustelle mittesten lassen.",
          "Datenübernahme und Export klären: Kommst du an deine Daten, wenn du wechseln willst?",
          "Datenschutz prüfen: Wo liegen die Daten, gibt es einen Vertrag zur Auftragsverarbeitung?",
        ],
      },
      { typ: "h2", id: "team", text: "Schritt 4: Das Team mitnehmen" },
      {
        typ: "p",
        text: "Die beste Software bringt nichts, wenn sie keiner nutzt. Erklär, warum ihr umstellt – zum Beispiel: keine Stundenzettel mehr am Freitagabend. Such dir ein oder zwei Leute, die Lust darauf haben, und lass sie zuerst starten. Plane eine kurze Einweisung und gib allen ein paar Wochen Zeit. Wenn es am Anfang holpert, ist das normal.",
      },
      { typ: "h2", id: "beispiel", text: "Beispiel" },
      {
        typ: "beispiel",
        titel: "Beispiel: Malerbetrieb mit fünf Leuten",
        text: "Der Chef beginnt mit der digitalen Zeiterfassung, weil das Abtippen der Stundenzettel jede Woche einen halben Tag kostet. Nach vier Wochen kommen Fotos dazu, nach drei Monaten Angebote und Rechnungen aus derselben Software.",
        fazit:
          "Statt alles auf einmal umzustellen, hat der Betrieb einen Ablauf nach dem anderen digitalisiert. Jeder Schritt hat sofort Zeit gespart – das hat das Team überzeugt.",
      },
      { typ: "h2", id: "messen", text: "Schritt 5: Ergebnis prüfen" },
      {
        typ: "p",
        text: "Schau nach einigen Monaten zurück: Wie lange dauert es jetzt vom Abschluss bis zur Rechnung? Wie viel Zeit verbringt das Büro mit Abtippen und Suchen? Wo hakt es noch? Digitalisierung ist kein Projekt mit Enddatum, sondern eine Reihe kleiner Verbesserungen.",
      },
      { typ: "h2", id: "foerderung", text: "Kosten und Förderung" },
      {
        typ: "p",
        text: "Rechne nicht nur mit dem Preis der Software, sondern auch mit der Zeit für die Einführung: Daten übernehmen, Vorlagen anlegen, Team einweisen. Dem steht die Zeit gegenüber, die jede Woche im Büro und auf der Baustelle frei wird. Wenn ein Ablauf eine Stunde pro Woche spart, sind das übers Jahr über 50 Stunden.",
      },
      {
        typ: "p",
        text: "Für Digitalisierungsprojekte gibt es je nach Bundesland und Zeitpunkt Förder- und Beratungsangebote. Die Programme ändern sich häufig. Frag bei deiner Handwerkskammer nach – die Beraterinnen und Berater dort kennen die aktuellen Möglichkeiten und helfen oft kostenlos bei der Einordnung.",
      },
    ],
    checkliste: {
      titel: "Checkliste Digitalisierung starten",
      punkte: [
        "Zeitfresser eine Woche lang aufgeschrieben",
        "Ersten Ablauf ausgewählt (z. B. Zeiterfassung)",
        "Software mit echten Aufträgen getestet",
        "Datenübernahme und Export geklärt",
        "E-Rechnung berücksichtigt",
        "Team informiert und Testpersonen ausgewählt",
        "Einweisung geplant",
        "Termin für Rückblick nach drei Monaten",
      ],
    },
  },
  {
    slug: "ki-im-handwerk",
    titel: "KI im Handwerk – was heute schon hilft",
    beschreibung:
      "Was künstliche Intelligenz im Handwerksbetrieb heute wirklich kann: Telefon, Texte, Angebote, Planung und Dokumentation. Mit ehrlichen Grenzen und Hinweisen zu Datenschutz.",
    kurzantwort:
      "KI nimmt dir heute vor allem Büroarbeit ab: Anrufe annehmen und zusammenfassen, Texte formulieren, Angebote vorbereiten, Fotos zuordnen und Planungsvorschläge machen. Die Entscheidung und die Verantwortung bleiben bei dir. Prüf, was die KI vorschlägt, und achte auf Datenschutz.",
    datum: "2026-07-14",
    themen: ["digital-arbeiten", "betrieb-fuehren"],
    gewerke: [],
    beliebt: true,
    werkzeuge: [],
    vorlagen: [],
    funktionen: ["automatisch-erledigen", "telefon", "angebote", "einsatzplanung"],
    rechtshinweis: true,
    inhalt: [
      { typ: "h2", id: "was-ist", text: "Was KI im Betrieb bedeutet" },
      {
        typ: "p",
        text: "Wenn heute von KI die Rede ist, sind meist Sprachmodelle gemeint: Programme, die Sprache verstehen, Texte schreiben und Informationen zusammenfassen können. Sie ersetzen keinen Handwerker. Aber sie können viele Aufgaben übernehmen, die abends am Schreibtisch liegen bleiben.",
      },
      { typ: "h2", id: "einsatz", text: "Wo KI heute schon hilft" },
      { typ: "h3", text: "Telefon und Anfragen" },
      {
        typ: "p",
        text: "Wer auf der Baustelle steht, kann nicht ans Telefon gehen. Ein KI-Telefonassistent nimmt Anrufe an, fragt nach Name, Adresse und Anliegen und legt daraus eine Anfrage an. Du rufst gezielt zurück, statt eine Mailbox abzuhören. Auch E-Mails und Formularanfragen lassen sich automatisch sortieren und zusammenfassen.",
      },
      { typ: "h3", text: "Texte schreiben" },
      {
        typ: "p",
        text: "Leistungsbeschreibungen, Antworten an Kunden, Stellenanzeigen oder Erinnerungen an offene Zahlungen: KI formuliert einen Entwurf, du passt ihn an. Das spart vor allem dann Zeit, wenn Schreiben nicht deine Lieblingsarbeit ist.",
      },
      { typ: "h3", text: "Angebote vorbereiten" },
      {
        typ: "p",
        text: "Aus einer Anfrage, Fotos und dem Aufmaß kann KI einen Angebotsentwurf mit passenden Positionen vorschlagen. Die Preise und Zeiten sollten aus deinen eigenen Daten kommen – nicht aus dem Internet. Kontrollieren musst du das Angebot immer selbst.",
      },
      { typ: "h3", text: "Planung" },
      {
        typ: "p",
        text: "Wer hat Zeit, wer hat die passende Qualifikation, wie weit ist die Fahrt, ist das Material da? Software kann solche Fragen gleichzeitig prüfen und dir einen Einsatzvorschlag machen. Du bestätigst oder änderst.",
      },
      { typ: "h3", text: "Dokumentation" },
      {
        typ: "p",
        text: "Aus Sprachnotizen werden Berichte, Fotos werden dem richtigen Auftrag zugeordnet, aus Zeiten und Material entsteht ein Rechnungsentwurf. So wird aus „mach ich später“ ein „ist schon erledigt“.",
      },
      { typ: "h2", id: "grenzen", text: "Die Grenzen" },
      {
        typ: "liste",
        punkte: [
          "KI kann sich irren und klingt dabei trotzdem überzeugend. Prüf Zahlen, Maße und Preise.",
          "Fachliche Entscheidungen – etwa zur Sicherheit einer Anlage – trifft der Fachmann, nicht das Programm.",
          "Rechtliche und steuerliche Fragen beantwortet KI nicht verbindlich.",
          "Ohne gute eigene Daten (Preise, Zeiten, Vorlagen) bleiben die Vorschläge allgemein.",
        ],
      },
      { typ: "h2", id: "datenschutz", text: "Datenschutz und Pflichten" },
      {
        typ: "p",
        text: "Kundendaten gehören nicht in beliebige kostenlose Chat-Programme. Achte darauf, dass der Anbieter die Daten nach europäischem Datenschutzrecht verarbeitet und ihr einen Vertrag zur Auftragsverarbeitung habt. Informiere Anrufer, wenn ein KI-Assistent das Gespräch annimmt.",
      },
      {
        typ: "p",
        text: "Seit Februar 2025 verlangt die europäische KI-Verordnung außerdem von Betrieben, die KI-Systeme einsetzen, dass ihre Leute ausreichend über den Umgang damit Bescheid wissen. Für einen Handwerksbetrieb heißt das in der Praxis vor allem: kurz einweisen, Regeln festlegen und dokumentieren, wer was nutzen darf.",
      },
      { typ: "h2", id: "beispiel", text: "Beispiel" },
      {
        typ: "beispiel",
        titel: "Beispiel: ein typischer Vormittag",
        text: "Während der Chef auf dem Dach steht, gehen drei Anrufe ein. Der Telefonassistent nimmt sie an und legt drei Anfragen mit Rückrufwunsch an. In der Mittagspause sieht der Chef die Zusammenfassungen, ruft den dringendsten Kunden zurück und lässt für die anderen beiden Besichtigungstermine vorschlagen.",
        fazit: "Keine verpassten Aufträge, keine Mailbox – und die Entscheidung trifft trotzdem der Chef.",
      },
      { typ: "h2", id: "start", text: "So fängst du an" },
      {
        typ: "liste",
        nummeriert: true,
        punkte: [
          "Eine konkrete Aufgabe wählen, die dich heute nervt – zum Beispiel verpasste Anrufe.",
          "Eine Lösung testen, die mit deinen Kunden- und Auftragsdaten arbeitet.",
          "Ergebnisse ein paar Wochen lang kontrollieren.",
          "Regeln fürs Team festlegen: Was darf die KI vorbereiten, was muss ein Mensch freigeben?",
        ],
      },
      { typ: "h2", id: "erwartungen", text: "Realistische Erwartungen" },
      {
        typ: "p",
        text: "KI ist kein Zauberknopf, der den Betrieb von allein führt. Am meisten bringt sie dort, wo Aufgaben häufig vorkommen, ähnlich ablaufen und heute viel Tipparbeit verursachen. Je besser deine Daten gepflegt sind – Kunden, Leistungen, Preise, Vorlagen –, desto brauchbarer werden die Vorschläge. Wer seine Abläufe vorher schon geordnet hat, profitiert am schnellsten.",
      },
      {
        typ: "p",
        text: "Wichtig ist auch, wie dein Team KI erlebt. Erklär, dass sie lästige Arbeit abnimmt und niemanden ersetzt. Der Monteur, der abends keinen Bericht mehr tippen muss, wird schnell zum Fürsprecher. Und wenn ein Vorschlag mal danebenliegt, ist das kein Drama – solange ein Mensch drüberschaut, bevor etwas beim Kunden landet.",
      },
      {
        typ: "p",
        text: "Ein guter Maßstab: Nach ein paar Wochen sollte spürbar weniger Büroarbeit liegen bleiben. Rückrufe passieren schneller, Angebote gehen früher raus, Berichte sind vollständig. Wenn das nicht der Fall ist, liegt es meist nicht an der KI, sondern daran, dass die Abläufe drumherum noch nicht passen.",
      },
    ],
    checkliste: {
      titel: "Checkliste KI im Betrieb",
      punkte: [
        "Konkrete Aufgabe für den Start ausgewählt",
        "Anbieter verarbeitet Daten nach DSGVO, AV-Vertrag liegt vor",
        "Anrufer werden über den KI-Assistenten informiert",
        "Freigaberegeln festgelegt (wer prüft was?)",
        "Team kurz eingewiesen und Einweisung dokumentiert",
        "Ergebnisse nach einigen Wochen überprüft",
      ],
    },
  },
  {
    slug: "einsatzplanung-handwerk",
    titel: "Einsatzplanung im Handwerk: Weniger Chaos, mehr Arbeitszeit",
    beschreibung:
      "So planst du Mitarbeiter, Termine, Fahrzeuge und Material im Handwerksbetrieb – mit Wochenplan, Puffern und klarer Kommunikation. Mit Beispiel und Checkliste.",
    kurzantwort:
      "Gute Einsatzplanung schaut nicht nur auf freie Termine, sondern auch auf Qualifikation, Fahrwege, Material, Fahrzeuge und Puffer. Plane die Woche grob voraus, den nächsten Tag genau, und sorg dafür, dass jeder Mitarbeiter seinen Einsatz rechtzeitig mit allen Infos sieht.",
    datum: "2026-09-08",
    themen: ["planung", "mitarbeiter", "fuehrung"],
    gewerke: ["elektriker", "shk", "galabau"],
    werkzeuge: ["fahrtkosten-rechner"],
    vorlagen: ["stundenzettel", "wartungsprotokoll-heizung"],
    funktionen: ["einsatzplanung", "kalender", "qualifikationen", "material", "fahrzeuge"],
    inhalt: [
      { typ: "h2", id: "problem", text: "Warum Planung so viel Zeit kostet" },
      {
        typ: "p",
        text: "In vielen Betrieben steckt die Planung im Kopf des Chefs oder auf einer Magnettafel im Büro. Das funktioniert, solange nichts dazwischenkommt. Aber ein krankgemeldeter Monteur, ein Notdienst oder fehlendes Material bringen den ganzen Tag durcheinander. Dann wird telefoniert, umgeplant und improvisiert.",
      },
      { typ: "h2", id: "was", text: "Was zu einer guten Planung gehört" },
      {
        typ: "liste",
        punkte: [
          "Termin: Wann soll oder muss die Arbeit erledigt sein?",
          "Dauer: Wie lange dauert der Einsatz realistisch – inklusive Rüst- und Aufräumzeit?",
          "Mitarbeiter: Wer hat Zeit und die nötige Qualifikation?",
          "Fahrweg: Wo liegen die Einsätze, wie lassen sie sich sinnvoll bündeln?",
          "Material: Ist alles bestellt, geliefert und im Fahrzeug?",
          "Fahrzeug und Werkzeug: Ist der Transporter frei, ist das Spezialwerkzeug da?",
          "Kunde: Ist der Termin bestätigt, ist jemand vor Ort?",
        ],
      },
      { typ: "h2", id: "rhythmus", text: "Ein fester Planungsrhythmus" },
      {
        typ: "liste",
        nummeriert: true,
        punkte: [
          "Langfristig: Größere Baustellen und Urlaube für die nächsten Wochen grob eintragen.",
          "Wöchentlich: Am Donnerstag oder Freitag die nächste Woche planen, Material prüfen, Termine bestätigen.",
          "Täglich: Am Nachmittag den nächsten Tag festzurren und an alle verschicken.",
          "Laufend: Notfälle und Ausfälle einplanen, ohne den ganzen Plan umzuwerfen.",
        ],
      },
      {
        typ: "hinweis",
        titel: "Puffer einplanen",
        text: "Wer jeden Tag zu 100 % verplant, hat bei jedem Notfall ein Problem. Ein fester Puffer – etwa ein freier Block pro Tag oder ein Springer – macht den Plan stabiler.",
      },
      { typ: "h2", id: "qualifikation", text: "Qualifikationen beachten" },
      {
        typ: "p",
        text: "Nicht jeder darf alles. Elektrofachkraft, Schweißschein, Höhenarbeit, Gasgeräte, Staplerschein: Die Planung muss wissen, wer was darf. Achte auch auf Ablaufdaten von Nachweisen und Unterweisungen. Wer das im Kopf behält, macht irgendwann einen Fehler – deshalb gehören Qualifikationen zum Mitarbeiter in die Planung.",
      },
      { typ: "h2", id: "kommunikation", text: "Klare Kommunikation" },
      {
        typ: "p",
        text: "Der beste Plan hilft nicht, wenn er nicht ankommt. Jeder Mitarbeiter sollte seine Einsätze für den nächsten Tag am Vorabend sehen können: Adresse, Ansprechpartner, Aufgabe, Material, Hinweise zum Zugang, Fotos von der Besichtigung. Änderungen gehen direkt aufs Handy, statt über drei Telefonate.",
      },
      {
        typ: "p",
        text: "Auch der Kunde profitiert: Eine Terminbestätigung und eine kurze Nachricht, wenn der Monteur losfährt, ersparen Rückfragen und verschlossene Türen.",
      },
      { typ: "h2", id: "beispiel", text: "Beispiel" },
      {
        typ: "beispiel",
        titel: "Beispiel: SHK-Betrieb in der Heizsaison",
        text: "Montagmorgen: Ein Monteur ist krank, gleichzeitig kommt ein Notruf wegen einer ausgefallenen Heizung. Die Planung zeigt, dass ein Kollege mit Gas-Qualifikation zwei Wartungen in der Nähe hat. Eine Wartung wird auf den Pufferblock am Mittwoch verschoben, der Kunde bekommt automatisch einen neuen Terminvorschlag. Der Kollege übernimmt den Notdienst.",
        fazit: "Statt einer Stunde Telefonieren dauert die Umplanung wenige Minuten – und keiner fährt umsonst.",
      },
      { typ: "h2", id: "fahrwege", text: "Fahrwege und Kosten im Blick" },
      {
        typ: "p",
        text: "Fahrzeiten sind Arbeitszeit, die oft niemand bezahlt. Bündle Einsätze nach Gebiet und plane Touren so, dass möglichst wenig Kreuz und Quer gefahren wird. Rechne außerdem aus, was eine Anfahrt wirklich kostet – so siehst du, ob deine Anfahrtspauschale passt.",
      },
      { typ: "h2", id: "werkzeug", text: "Tafel, Tabelle oder Software?" },
      {
        typ: "p",
        text: "Bei zwei, drei Mitarbeitern reicht oft eine Tafel oder ein gemeinsamer Kalender. Je mehr Leute, Fahrzeuge und Baustellen dazukommen, desto mehr lohnt sich eine Planung, die Qualifikationen, Material und Fahrwege mitdenkt und die Einsätze direkt aufs Handy schickt.",
      },
      { typ: "h2", id: "rueckmeldung", text: "Rückmeldung von der Baustelle" },
      {
        typ: "p",
        text: "Planung ist keine Einbahnstraße. Damit der Plan für morgen stimmt, braucht das Büro heute die Rückmeldung von der Baustelle: Ist der Einsatz fertig? Fehlt Material? Muss jemand noch einmal hin? Wenn Mitarbeiter ihren Auftrag direkt auf dem Handy abschließen und Restarbeiten notieren, kann die Planung sofort reagieren – statt erst am nächsten Morgen davon zu erfahren.",
      },
      {
        typ: "p",
        text: "Werte außerdem regelmäßig aus, wie gut die Schätzungen waren. Dauern bestimmte Einsätze immer länger als geplant, passe die Zeiten an. So wird die Planung von Woche zu Woche genauer und der Puffer muss seltener herhalten.",
      },
      {
        typ: "p",
        text: "Und ein letzter Punkt, der oft untergeht: Sprich mit deinem Team über die Planung. Wer regelmäßig umsonst fährt, auf Material wartet oder zu knapp eingeplant wird, weiß meist genau, woran es liegt. Ein kurzes Gespräch alle paar Wochen bringt oft mehr als jedes neue Programm.",
      },
    ],
    checkliste: {
      titel: "Checkliste Einsatzplanung",
      punkte: [
        "Urlaube und Großbaustellen langfristig eingetragen",
        "Wochenplanung zu festem Zeitpunkt",
        "Einsatzdauer inkl. Rüst- und Fahrzeit realistisch geschätzt",
        "Qualifikationen und Nachweise geprüft",
        "Material und Fahrzeug für jeden Einsatz bestätigt",
        "Puffer für Notfälle eingeplant",
        "Termine mit Kunden bestätigt",
        "Einsätze am Vorabend an alle verschickt",
      ],
    },
  },
];
