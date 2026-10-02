import type { BlogArtikel } from "./blog-typen";

export const artikelTeil1: BlogArtikel[] = [
  {
    slug: "stundensatz-handwerker-berechnen",
    titel: "Stundensatz als Handwerker berechnen – Schritt für Schritt",
    beschreibung:
      "So berechnest du einen Stundensatz, der alle Kosten deckt und Gewinn bringt: produktive Stunden, Lohnkosten, Gemeinkosten, Wagnis und Gewinn – mit Beispielrechnung.",
    kurzantwort:
      "Dein Stundensatz muss alle Kosten des Betriebs auf die Stunden verteilen, die du wirklich beim Kunden abrechnen kannst – nicht auf die bezahlten Stunden. Rechne: (Lohnkosten + Gemeinkosten) ÷ verrechenbare Stunden, dann Wagnis und Gewinn drauf. Wer nur Lohn plus „etwas Aufschlag“ nimmt, liegt fast immer zu niedrig.",
    datum: "2026-01-20",
    themen: ["kalkulation", "betrieb-fuehren"],
    gewerke: [],
    beliebt: true,
    werkzeuge: ["stundensatz-rechner", "stundenverrechnungssatz-rechner"],
    vorlagen: ["stundenzettel", "checkliste-angebotserstellung"],
    funktionen: ["kalkulation", "zeiterfassung", "auswertung"],
    rechtshinweis: true,
    inhalt: [
      { typ: "h2", id: "warum", text: "Warum der Stundensatz so oft zu niedrig ist" },
      {
        typ: "p",
        text: "Viele Betriebe setzen ihren Stundensatz nach Gefühl oder nach dem, was der Nachbarbetrieb nimmt. Das Problem: Ein Geselle wird für rund 2.080 Stunden im Jahr bezahlt, aber beim Kunden abrechnen kannst du davon deutlich weniger. Urlaub, Feiertage, Krankheit, Fahrzeiten, Materialholen, Aufräumen und Besprechungen kosten Lohn, bringen aber keinen Umsatz.",
      },
      {
        typ: "p",
        text: "Dazu kommen die Kosten, die man nicht jeden Tag sieht: Fahrzeuge, Werkzeug, Versicherungen, Miete, Software, Steuerberater, Büro. Diese Gemeinkosten müssen über die verrechenbaren Stunden mit reinkommen. Sonst arbeitest du viel und am Jahresende bleibt trotzdem wenig übrig.",
      },
      { typ: "h2", id: "begriffe", text: "Stundensatz oder Stundenverrechnungssatz?" },
      {
        typ: "p",
        text: "Im Alltag werden die Begriffe oft gleich benutzt. Genau genommen ist der Stundenverrechnungssatz der Satz, den du dem Kunden pro Stunde in Rechnung stellst. Er enthält Lohnkosten, Lohnnebenkosten, anteilige Gemeinkosten sowie Wagnis und Gewinn. Mit „Stundensatz“ ist manchmal nur der Lohn pro Stunde gemeint. In diesem Artikel geht es um den Satz, den du verlangen musst.",
      },
      { typ: "h2", id: "stunden", text: "Schritt 1: Verrechenbare Stunden ermitteln" },
      {
        typ: "p",
        text: "Starte nicht mit dem Geld, sondern mit der Zeit. Rechne für einen typischen Mitarbeiter aus, wie viele Stunden im Jahr wirklich beim Kunden abrechenbar sind.",
      },
      {
        typ: "liste",
        nummeriert: true,
        punkte: [
          "Bezahlte Stunden im Jahr: 52 Wochen × Wochenarbeitszeit (z. B. 40 h = 2.080 h).",
          "Abziehen: Urlaubstage, Feiertage und durchschnittliche Krankheitstage (jeweils × Stunden pro Tag).",
          "Ergebnis: Anwesenheitsstunden.",
          "Davon nur der Anteil, der beim Kunden abgerechnet wird. Fahrzeiten, Lager, Werkstatt und Besprechungen sind nicht verrechenbar, wenn du sie nicht separat berechnest.",
        ],
      },
      {
        typ: "hinweis",
        titel: "Tipp",
        text: "Schätz den produktiven Anteil nicht, sondern schau in deine Zeiterfassung oder Stundenzettel der letzten Monate. Viele Betriebe sind überrascht, wie hoch der nicht verrechenbare Anteil ist.",
      },
      { typ: "h2", id: "kosten", text: "Schritt 2: Kosten pro Jahr zusammenrechnen" },
      { typ: "h3", text: "Lohn und Lohnnebenkosten" },
      {
        typ: "p",
        text: "Nimm den Bruttolohn im Jahr und rechne die Arbeitgeberanteile zur Sozialversicherung, Beiträge zur Berufsgenossenschaft und gegebenenfalls Umlagen, Zuschläge oder Sonderzahlungen dazu. Die genaue Höhe hängt von Gewerk, Tarif und Betrieb ab. Dein Steuerberater oder die Lohnabrechnung liefert dir die echten Zahlen.",
      },
      { typ: "h3", text: "Gemeinkosten" },
      {
        typ: "p",
        text: "Gemeinkosten sind alle Kosten, die nicht direkt einem Auftrag zugeordnet werden: Fahrzeuge inklusive Sprit und Leasing, Werkzeug und Maschinen, Miete für Werkstatt und Lager, Versicherungen, Telefon, Software, Werbung, Steuerberatung und das Gehalt fürs Büro. Teil die Summe durch die Zahl der produktiven Mitarbeiter, um den Anteil pro Kopf zu bekommen.",
      },
      { typ: "h2", id: "formel", text: "Schritt 3: Die Formel" },
      {
        typ: "p",
        text: "Selbstkosten pro Stunde = (Lohnkosten inkl. Nebenkosten + anteilige Gemeinkosten) ÷ verrechenbare Stunden. Auf die Selbstkosten kommt ein Zuschlag für Wagnis und Gewinn. Wagnis deckt Risiken wie Gewährleistung, Forderungsausfälle oder schlechte Monate ab. Gewinn ist das, was der Betrieb verdienen soll – für Investitionen, Rücklagen und dich als Unternehmer.",
      },
      { typ: "h2", id: "beispiel", text: "Beispielrechnung" },
      {
        typ: "beispiel",
        titel: "Beispiel: ein Geselle in einem kleinen Betrieb",
        text: "Alle Zahlen sind gerundete Beispielwerte, keine Branchenwerte. Setze deine eigenen Zahlen ein.",
        zeilen: [
          { label: "Bezahlte Stunden (52 × 40 h)", wert: "2.080 h" },
          { label: "– Urlaub 30 Tage, Feiertage 10 Tage, Krankheit 10 Tage (× 8 h)", wert: "– 400 h" },
          { label: "Anwesenheitsstunden", wert: "1.680 h" },
          { label: "davon verrechenbar (75 %)", wert: "1.260 h", summe: true },
          { label: "Bruttolohn (20 € × 2.080 h)", wert: "41.600 €" },
          { label: "+ Lohnnebenkosten (Annahme 21 %)", wert: "8.736 €" },
          { label: "+ anteilige Gemeinkosten", wert: "30.000 €" },
          { label: "Kosten pro Jahr", wert: "80.336 €", summe: true },
          { label: "Selbstkosten pro verrechenbarer Stunde (80.336 € ÷ 1.260 h)", wert: "63,76 €" },
          { label: "+ Wagnis und Gewinn (12 %)", wert: "7,65 €" },
          { label: "Stundenverrechnungssatz netto", wert: "71,41 €", summe: true },
        ],
        fazit:
          "Hätte der Betrieb nur mit 1.680 Anwesenheitsstunden gerechnet, kämen 47,82 € Selbstkosten heraus – über 15 € zu wenig pro Stunde.",
      },
      { typ: "h2", id: "fehler", text: "Typische Fehler" },
      {
        typ: "liste",
        punkte: [
          "Mit bezahlten statt verrechenbaren Stunden rechnen.",
          "Den eigenen Unternehmerlohn vergessen, wenn der Chef selbst mitarbeitet.",
          "Gemeinkosten vom letzten Jahr nehmen, obwohl Fahrzeug, Miete oder Versicherung teurer geworden sind.",
          "Fahrzeiten weder im Stundensatz noch über Anfahrtspauschalen abdecken.",
          "Den Satz einmal festlegen und dann jahrelang nicht mehr anschauen.",
        ],
      },
      { typ: "h2", id: "pruefen", text: "Regelmäßig nachprüfen" },
      {
        typ: "p",
        text: "Ein Stundensatz ist keine Zahl für die Ewigkeit. Prüfe ihn mindestens einmal im Jahr und immer dann, wenn sich etwas ändert: Tariferhöhung, neues Fahrzeug, neuer Mitarbeiter im Büro, höhere Miete. Noch besser ist eine Nachkalkulation pro Auftrag: Wie viele Stunden waren geplant, wie viele wurden gebraucht? So siehst du, ob dein Satz in der Praxis reicht.",
      },
      {
        typ: "p",
        text: "Und keine Sorge vor dem Ergebnis: Ein sauber berechneter Satz ist leichter zu vertreten als eine Zahl aus dem Bauch. Wenn ein Kunde fragt, weißt du genau, wofür er bezahlt.",
      },
    ],
    checkliste: {
      titel: "Checkliste Stundensatz",
      punkte: [
        "Bezahlte Jahresstunden pro Mitarbeiter ermittelt",
        "Urlaub, Feiertage und Krankheit abgezogen",
        "Produktiven Anteil aus echten Zeiten bestimmt",
        "Bruttolohn und Lohnnebenkosten aus der Lohnabrechnung übernommen",
        "Alle Gemeinkosten des letzten Jahres aufgelistet und aktualisiert",
        "Unternehmerlohn berücksichtigt",
        "Zuschlag für Wagnis und Gewinn festgelegt",
        "Termin für die nächste Überprüfung eingetragen",
      ],
    },
  },
  {
    slug: "angebot-richtig-kalkulieren",
    titel: "Angebot richtig kalkulieren: So wird jeder Auftrag ein guter Auftrag",
    beschreibung:
      "Material, Lohn, Fremdleistungen, Fahrten, Wagnis und Gewinn: So kalkulierst du Angebote im Handwerk sauber – mit Beispiel und Checkliste.",
    kurzantwort:
      "Ein gutes Angebot rechnet jede Position aus Zeit × Stundenverrechnungssatz plus Material mit Aufschlag, dazu Fremdleistungen, Fahrten und Nebenarbeiten. Die meisten Verluste entstehen nicht durch falsche Preise, sondern durch vergessene Leistungen. Arbeite mit einer festen Reihenfolge und vergleiche nach dem Auftrag Plan und Ist.",
    datum: "2026-02-17",
    themen: ["kalkulation", "auftraege-geld"],
    gewerke: [],
    beliebt: true,
    werkzeuge: ["angebots-rechner", "materialaufschlag-rechner", "fahrtkosten-rechner", "deckungsbeitrags-rechner"],
    vorlagen: ["checkliste-angebotserstellung", "aufmassblatt"],
    funktionen: ["kalkulation", "angebote", "aufmass"],
    rechtshinweis: true,
    inhalt: [
      { typ: "h2", id: "grundlage", text: "Die Grundlage: Aufmaß und Leistungsumfang" },
      {
        typ: "p",
        text: "Jede Kalkulation ist nur so gut wie die Aufnahme vor Ort. Bevor du rechnest, muss klar sein, was genau gemacht wird: Flächen, Längen, Stückzahlen, Zustand des Untergrunds, Zugang, Stellplatz, Entsorgung. Ein sauberes Aufmaß und Fotos von der Besichtigung sparen später Diskussionen.",
      },
      {
        typ: "p",
        text: "Schreib auf, was nicht im Angebot enthalten ist. „Bauseits“ oder „nicht enthalten“ ist ehrlich und schützt dich, wenn der Kunde später mehr erwartet.",
      },
      { typ: "h2", id: "bestandteile", text: "Die Bestandteile einer Position" },
      {
        typ: "liste",
        punkte: [
          "Lohn: geschätzte Arbeitszeit × Stundenverrechnungssatz. Rechne Vorbereitung, Abdecken, Aufräumen und Nacharbeiten mit ein.",
          "Material: Einkaufspreis plus Materialaufschlag. Der Aufschlag deckt Bestellung, Lagerung, Transport, Verschnitt und Gewährleistung.",
          "Fremdleistungen: Subunternehmer, Gerüst, Container, Kran – ebenfalls mit Zuschlag für Koordination.",
          "Fahrten: Anfahrt pro Tag oder als Pauschale, falls nicht im Stundensatz enthalten.",
          "Geräte und Maschinen: Miete oder interne Sätze für eigene Maschinen.",
        ],
      },
      {
        typ: "hinweis",
        titel: "Wichtig",
        text: "Wagnis und Gewinn gehören in den Stundensatz oder als Zuschlag auf die Selbstkosten – nicht als „Luft“, die du beim ersten Nachfragen wieder streichst.",
      },
      { typ: "h2", id: "reihenfolge", text: "Eine feste Reihenfolge spart Fehler" },
      {
        typ: "liste",
        nummeriert: true,
        punkte: [
          "Leistungen nach Ablauf auf der Baustelle sortieren – vom Einrichten bis zur Endreinigung.",
          "Für jede Leistung Menge und Einheit aus dem Aufmaß übernehmen.",
          "Zeitwerte pro Einheit ansetzen, am besten aus eigenen Nachkalkulationen.",
          "Material pro Einheit inklusive Verschnitt ansetzen.",
          "Nebenleistungen prüfen: Baustelleneinrichtung, Schutz, Entsorgung, Dokumentation.",
          "Summe prüfen: Passt der Gesamtpreis zum Gefühl für die Arbeit? Wenn nicht – woran liegt es?",
        ],
      },
      { typ: "h2", id: "beispiel", text: "Beispiel: Wohnzimmer streichen" },
      {
        typ: "beispiel",
        titel: "Beispiel: 60 m² Wandfläche, zweimal streichen",
        text: "Vereinfachtes Beispiel mit angenommenen Werten. Dein Stundensatz und deine Einkaufspreise sind anders.",
        zeilen: [
          { label: "Material (Farbe, Abdeckmaterial) EK", wert: "180,00 €" },
          { label: "+ Materialaufschlag 20 %", wert: "36,00 €" },
          { label: "Lohn: 10 h × 62 €", wert: "620,00 €" },
          { label: "Anfahrt: 2 Tage × 25 €", wert: "50,00 €" },
          { label: "Summe netto", wert: "886,00 €", summe: true },
          { label: "+ 19 % Umsatzsteuer", wert: "168,34 €" },
          { label: "Angebotspreis brutto", wert: "1.054,34 €", summe: true },
        ],
        fazit:
          "Vergisst man das Abkleben und die Endreinigung (geschätzt 2 Stunden), fehlen 124 € – bei einem Auftrag dieser Größe ist das ein großer Teil von Wagnis und Gewinn.",
      },
      { typ: "h2", id: "angebot-kva", text: "Angebot oder Kostenvoranschlag?" },
      {
        typ: "p",
        text: "Ein Angebot mit Festpreis bindet dich an den Preis. Ein Kostenvoranschlag ist eine Schätzung. Wird absehbar, dass er wesentlich überschritten wird, musst du den Kunden unverzüglich informieren – er kann den Vertrag dann kündigen. Was „wesentlich“ ist, steht nicht als feste Zahl im Gesetz; häufig werden Abweichungen um 10 bis 20 Prozent genannt. Schreib deshalb klar aufs Dokument, was es ist, und lass dich bei Unsicherheit beraten.",
      },
      { typ: "h2", id: "nachkalkulation", text: "Nachkalkulation: Aus jedem Auftrag lernen" },
      {
        typ: "p",
        text: "Die beste Datenbasis für die nächste Kalkulation sind deine eigenen Aufträge. Vergleiche nach dem Abschluss geplante und tatsächliche Stunden und Materialkosten. Wenn du bei bestimmten Leistungen immer drüber liegst, passt du die Zeitwerte an. Mit der Zeit werden deine Angebote genauer – und du traust dich auch, den richtigen Preis zu nennen.",
      },
      {
        typ: "p",
        text: "Schau dir außerdem den Deckungsbeitrag an: Was bleibt nach Material und Fremdleistungen übrig, um Lohn, Gemeinkosten und Gewinn zu decken? Ein großer Umsatz mit kleinem Deckungsbeitrag kann schlechter sein als ein kleiner, sauberer Auftrag.",
      },
      { typ: "h2", id: "schnell", text: "Schnell, aber nicht hektisch" },
      {
        typ: "p",
        text: "Kunden entscheiden sich oft für den Betrieb, der zuerst ein verständliches Angebot schickt. Mit Textbausteinen, festen Positionen und Vorlagen für typische Leistungen schaffst du beides: schnell und genau. Kalkuliere aber nie unter Zeitdruck am Telefon einen Festpreis – sag lieber, wann das Angebot kommt, und halte den Termin.",
      },
      { typ: "h2", id: "zahlung", text: "Zahlungsbedingungen gehören ins Angebot" },
      {
        typ: "p",
        text: "Ein Angebot ist nicht nur ein Preis. Leg fest, wann du welches Geld bekommst. Bei größeren Aufträgen sind Abschlagszahlungen nach Baufortschritt üblich, zum Beispiel nach Lieferung des Materials und nach Fertigstellung eines Abschnitts. So musst du nicht wochenlang Material und Lohn vorfinanzieren. Nenn außerdem ein Zahlungsziel, etwa 14 Tage nach Rechnungsstellung, und wie lange das Angebot gültig ist.",
      },
      {
        typ: "p",
        text: "Gerade bei Material mit stark schwankenden Preisen hilft eine kurze Gültigkeit. Wer ein Angebot sechs Monate offenlässt, trägt das Preisrisiko allein. Schreib auch hinein, wie Zusatzarbeiten abgerechnet werden – zum Beispiel nach Aufwand mit deinem Stundensatz und Regiebericht. Dann gibt es später keine Überraschungen, weder für dich noch für den Kunden.",
      },
    ],
    checkliste: {
      titel: "Checkliste Angebot",
      punkte: [
        "Aufmaß vollständig und mit Fotos dokumentiert",
        "Leistungsumfang und Ausschlüsse klar beschrieben",
        "Zeitwerte aus eigener Nachkalkulation verwendet",
        "Material inklusive Verschnitt und Aufschlag angesetzt",
        "Fremdleistungen, Geräte und Entsorgung berücksichtigt",
        "Anfahrt und Baustelleneinrichtung eingerechnet",
        "Angebot oder Kostenvoranschlag klar benannt",
        "Gültigkeit, Zahlungsbedingungen und Ausführungszeitraum angegeben",
      ],
    },
  },
  {
    slug: "e-rechnung-handwerk",
    titel: "E-Rechnung im Handwerk: Was ab 2025, 2027 und 2028 gilt",
    beschreibung:
      "E-Rechnungspflicht in Deutschland verständlich erklärt: Empfangspflicht seit 1.1.2025, Übergangsfristen bis Ende 2026 und 2027, Formate XRechnung und ZUGFeRD – und was das für Handwerksbetriebe bedeutet.",
    kurzantwort:
      "Seit dem 1. Januar 2025 muss jeder Betrieb E-Rechnungen von anderen Unternehmen empfangen können. Für das Verschicken gibt es Übergangsfristen: Bis Ende 2026 dürfen alle noch Papier- oder PDF-Rechnungen an Geschäftskunden schicken, bis Ende 2027 nur noch Betriebe mit höchstens 800.000 € Vorjahresumsatz. Ab 2028 gilt die Pflicht für alle. Rechnungen an Privatkunden sind nicht betroffen.",
    datum: "2026-03-10",
    themen: ["auftraege-geld", "digital-arbeiten"],
    gewerke: [],
    beliebt: true,
    werkzeuge: [],
    vorlagen: ["checkliste-e-rechnung"],
    funktionen: ["rechnungen", "zahlungen"],
    rechtshinweis: true,
    inhalt: [
      { typ: "h2", id: "was-ist", text: "Was ist eine E-Rechnung?" },
      {
        typ: "p",
        text: "Eine E-Rechnung ist eine Rechnung in einem strukturierten elektronischen Format, das ein Computerprogramm automatisch lesen kann. Sie muss der europäischen Norm EN 16931 entsprechen. Wichtig: Eine normale PDF-Datei ist keine E-Rechnung, auch wenn sie per E-Mail verschickt wird. Sie gilt rechtlich als „sonstige elektronische Rechnung“.",
      },
      { typ: "h3", text: "Die gängigen Formate" },
      {
        typ: "liste",
        punkte: [
          "XRechnung: reine XML-Datei. Für Menschen ohne Programm schwer lesbar, aber Standard bei öffentlichen Auftraggebern.",
          "ZUGFeRD (ab Version 2.0.1): eine PDF-Datei mit eingebetteter XML-Datei. Der Kunde kann sie wie gewohnt ansehen, die Buchhaltung liest die Daten automatisch. Die Profile MINIMUM und BASIC-WL reichen dafür nicht aus.",
          "Andere Formate, etwa per EDI, sind möglich, wenn beide Seiten das vereinbaren und die nötigen Angaben enthalten sind.",
        ],
      },
      { typ: "h2", id: "wer", text: "Wen betrifft die Pflicht?" },
      {
        typ: "p",
        text: "Die Pflicht gilt für Rechnungen zwischen inländischen Unternehmen (B2B), also zum Beispiel, wenn du für eine Hausverwaltung, einen Bauträger, einen Generalunternehmer oder einen anderen Handwerksbetrieb arbeitest. Bei öffentlichen Auftraggebern ist die E-Rechnung schon länger Standard – an den Bund etwa seit 2020.",
      },
      {
        typ: "p",
        text: "Rechnungen an Privatkunden (B2C) sind von der E-Rechnungspflicht nicht betroffen. Hier darfst du weiter Papier oder PDF verwenden. Für viele Handwerksbetriebe mit vielen Privatkunden ist das eine gute Nachricht – trotzdem lohnt es sich, den Ablauf für Geschäftskunden rechtzeitig umzustellen.",
      },
      {
        typ: "p",
        text: "Ausnahmen gibt es außerdem für Kleinbetragsrechnungen bis 250 € brutto und für Fahrausweise. Diese dürfen auch an Unternehmen weiterhin als Papier- oder PDF-Rechnung gehen.",
      },
      { typ: "h2", id: "fristen", text: "Die Fristen im Überblick" },
      {
        typ: "tabelle",
        kopf: ["Zeitraum", "Empfangen", "Verschicken an Geschäftskunden"],
        zeilen: [
          [
            "1.1.2025 – 31.12.2026",
            "Pflicht für alle: E-Rechnungen müssen empfangen werden können.",
            "Papier und PDF weiter erlaubt (PDF nur mit Zustimmung des Empfängers).",
          ],
          [
            "1.1.2027 – 31.12.2027",
            "Pflicht für alle.",
            "Papier und PDF nur noch, wenn der Gesamtumsatz im Vorjahr höchstens 800.000 € betrug. Alle anderen müssen E-Rechnungen schicken.",
          ],
          ["ab 1.1.2028", "Pflicht für alle.", "E-Rechnung ist Pflicht für alle Betriebe."],
        ],
      },
      {
        typ: "hinweis",
        titel: "Bis Ende 2027 auch per EDI",
        text: "Bis Ende 2027 dürfen Rechnungen außerdem in einem vereinbarten EDI-Verfahren verschickt werden, auch wenn das Format nicht der EN 16931 entspricht. Für die meisten kleinen Betriebe spielt das keine Rolle.",
      },
      { typ: "h2", id: "empfangen", text: "Empfangen: Was du schon heute brauchst" },
      {
        typ: "p",
        text: "Für den Empfang reicht grundsätzlich ein E-Mail-Postfach. Entscheidend ist, dass du die Rechnung lesen, prüfen und richtig aufbewahren kannst. Eine XRechnung ist ohne passendes Programm kaum lesbar. Du brauchst also eine Software oder ein Werkzeug, das die Datei anzeigt – oder du gibst sie direkt an deine Buchhaltung oder deinen Steuerberater weiter.",
      },
      {
        typ: "p",
        text: "Aufbewahrt werden muss die E-Rechnung in ihrem ursprünglichen Format, also die XML-Datei bzw. die ZUGFeRD-Datei mit den eingebetteten Daten. Ausdrucken und das Original löschen ist nicht erlaubt. Kläre mit deinem Steuerberater, wie lange und wo du aufbewahrst.",
      },
      { typ: "h2", id: "verschicken", text: "Verschicken: So bereitest du dich vor" },
      {
        typ: "liste",
        nummeriert: true,
        punkte: [
          "Prüfen, wie viel Umsatz du mit Geschäftskunden machst und ob du unter oder über 800.000 € Gesamtumsatz liegst.",
          "Klären, ob deine Rechnungssoftware XRechnung und ZUGFeRD erzeugen kann.",
          "Stammdaten pflegen: Bei Geschäftskunden werden Angaben wie Anschrift, Umsatzsteuer-ID oder eine Leitweg-ID (bei öffentlichen Auftraggebern) wichtiger.",
          "Mit Stammkunden absprechen, an welche Adresse und in welchem Format sie Rechnungen haben möchten.",
          "Ablauf mit dem Steuerberater abstimmen: Wie kommen ausgehende und eingehende E-Rechnungen in die Buchhaltung?",
          "Rechtzeitig umstellen, nicht erst kurz vor Fristende.",
        ],
      },
      { typ: "h2", id: "praxis", text: "Was ändert sich im Alltag?" },
      {
        typ: "p",
        text: "Wenn die Software mitspielt, ändert sich für dich wenig: Du erstellst die Rechnung wie bisher, das Programm erzeugt die richtige Datei. Weil die Daten maschinenlesbar sind, fallen Fehler schneller auf – etwa eine fehlende Umsatzsteuer-ID oder eine falsche Bestellnummer. Rechnungen kommen dadurch im besten Fall schneller durch die Prüfung beim Kunden und werden früher bezahlt.",
      },
      {
        typ: "p",
        text: "Bei eingehenden Rechnungen, etwa vom Großhandel, entfällt das Abtippen. Belege lassen sich automatisch dem Auftrag zuordnen. Das spart Zeit im Büro – vorausgesetzt, die Rechnungen landen an einer Stelle und nicht in fünf verschiedenen Postfächern.",
      },
    ],
    checkliste: {
      titel: "Checkliste E-Rechnung",
      punkte: [
        "Postfach für eingehende E-Rechnungen festgelegt",
        "Programm zum Anzeigen von XRechnung und ZUGFeRD vorhanden",
        "Aufbewahrung im Originalformat mit dem Steuerberater geklärt",
        "Gesamtumsatz des Vorjahres geprüft (800.000-€-Grenze)",
        "Rechnungssoftware kann E-Rechnungen erzeugen",
        "Stammdaten von Geschäftskunden vollständig",
        "Stammkunden über die Umstellung informiert",
      ],
    },
  },
  {
    slug: "baustellendokumentation",
    titel: "Baustellendokumentation: So geht's richtig",
    beschreibung:
      "Warum Baustellendokumentation dich vor Ärger schützt, was du festhalten solltest und wie es ohne viel Aufwand klappt – mit Checkliste für Fotos, Berichte und Abnahme.",
    kurzantwort:
      "Gute Baustellendokumentation hält fest, wie es vorher aussah, was gemacht wurde, was verdeckt verbaut ist und was der Kunde bestätigt hat. Am einfachsten geht das mit Fotos und kurzen Notizen direkt am Auftrag – jeden Tag, nicht erst am Ende.",
    datum: "2026-04-14",
    themen: ["auftraege-geld", "digital-arbeiten"],
    gewerke: ["elektriker", "shk", "dachdecker", "bau", "fliesenleger"],
    beliebt: true,
    werkzeuge: [],
    vorlagen: ["checkliste-baustellenabnahme", "abnahmeprotokoll", "regiebericht"],
    funktionen: ["dokumentation", "auftraege", "zeiterfassung"],
    rechtshinweis: true,
    inhalt: [
      { typ: "h2", id: "warum", text: "Warum dokumentieren?" },
      {
        typ: "p",
        text: "Dokumentation fühlt sich oft wie Zusatzarbeit an. Dabei ist sie dein bester Schutz. Wenn ein Kunde nach Monaten sagt, der Riss in der Wand war vorher nicht da, hilft dir nur ein Foto vom ersten Tag. Wenn eine Leitung hinter der Fliese liegt, weiß später nur das Foto, wo genau.",
      },
      {
        typ: "liste",
        punkte: [
          "Nachweis: Was war vorher, was hast du gemacht, was hat der Kunde abgenommen?",
          "Nachträge: Zusätzliche Arbeiten sind mit Fotos und Regiebericht leichter durchzusetzen.",
          "Gewährleistung: Mängelansprüche bei Bauwerken verjähren in der Regel erst nach fünf Jahren ab Abnahme. So lange solltest du belegen können, was du gemacht hast.",
          "Rechnung: Wer dokumentiert, vergisst keine Leistung beim Abrechnen.",
          "Team: Der Kollege, der morgen weitermacht, sieht sofort den Stand.",
        ],
      },
      { typ: "h2", id: "was", text: "Was gehört in die Dokumentation?" },
      { typ: "h3", text: "Vor Arbeitsbeginn" },
      {
        typ: "liste",
        punkte: [
          "Fotos vom Ausgangszustand, inklusive vorhandener Schäden",
          "Zugang, Stellplatz, Schutzmaßnahmen",
          "Besonderheiten und Absprachen mit dem Kunden",
        ],
      },
      { typ: "h3", text: "Während der Arbeit" },
      {
        typ: "liste",
        punkte: [
          "Fotos von allem, was später verdeckt ist: Leitungen, Abdichtungen, Dämmung, Befestigungen",
          "Maße und Lage wichtiger Bauteile, am besten mit Zollstock im Bild",
          "Arbeitszeiten und eingesetztes Material",
          "Behinderungen: Andere Gewerke nicht fertig, Material fehlt, Zugang versperrt",
          "Zusatzarbeiten auf Wunsch des Kunden – mit Unterschrift",
        ],
      },
      { typ: "h3", text: "Bei Fertigstellung" },
      {
        typ: "liste",
        punkte: [
          "Fotos vom fertigen Zustand",
          "Mess- und Prüfprotokolle, wo vorgeschrieben",
          "Abnahmeprotokoll mit festgestellten Mängeln und Unterschrift",
          "Übergabe von Unterlagen, Bedienungsanleitungen und Wartungshinweisen",
        ],
      },
      { typ: "h2", id: "fotos", text: "Fotos, die später wirklich helfen" },
      {
        typ: "p",
        text: "Ein Foto ohne Zusammenhang hilft wenig. Mach immer ein Übersichtsfoto und dann Detailfotos. Achte auf gutes Licht und darauf, dass man erkennt, wo im Gebäude das Bild entstanden ist. Ein Zollstock oder Maßband im Bild zeigt Abstände. Datum und Uhrzeit speichert das Handy automatisch – wichtig ist, dass die Fotos beim richtigen Auftrag landen und nicht in der privaten Galerie.",
      },
      {
        typ: "hinweis",
        titel: "Datenschutz",
        text: "Fotografier keine Personen und keine privaten Gegenstände, die nichts mit der Arbeit zu tun haben. Wenn Fotos in Kundenwohnungen entstehen, informiere den Kunden kurz, wofür du sie brauchst.",
      },
      { typ: "h2", id: "beispiel", text: "Beispiel aus dem Alltag" },
      {
        typ: "beispiel",
        titel: "Beispiel: Badsanierung",
        text: "Am ersten Tag fotografiert der Monteur das alte Bad und einen feuchten Fleck an der Außenwand. Während der Arbeit dokumentiert er die neuen Leitungen vor dem Verfliesen und die Abdichtung in der Dusche. Der Kunde wünscht zusätzlich eine Steckdose neben dem Spiegel – der Monteur schreibt einen Regiebericht und lässt ihn direkt auf dem Handy unterschreiben.",
        fazit:
          "Bei der Abnahme fragt der Kunde nach dem Fleck an der Außenwand. Das Foto vom ersten Tag zeigt: Er war schon vorher da. Die Steckdose steht ohne Diskussion auf der Rechnung.",
      },
      { typ: "h2", id: "routine", text: "So wird Dokumentation zur Routine" },
      {
        typ: "liste",
        nummeriert: true,
        punkte: [
          "Feste Momente festlegen: bei Ankunft, vor dem Verschließen, bei Feierabend, bei Abschluss.",
          "Alles am Auftrag speichern – nicht in WhatsApp-Gruppen oder privaten Handys.",
          "Kurze Sprachnotizen statt langer Texte erlauben.",
          "Checklisten für wiederkehrende Arbeiten nutzen, damit nichts vergessen wird.",
          "Regelmäßig nachfragen und loben, wenn die Doku gut ist. Was der Chef anschaut, wird gemacht.",
        ],
      },
      {
        typ: "p",
        text: "Der Aufwand liegt bei wenigen Minuten pro Tag. Der Nutzen zeigt sich spätestens beim ersten Streitfall – oder schon beim Schreiben der Rechnung, wenn alles an einem Ort liegt.",
      },
      { typ: "h2", id: "bautagebuch", text: "Bautagebuch und Regiebericht" },
      {
        typ: "p",
        text: "Bei größeren Baustellen lohnt sich ein Bautagebuch: Wer war da, wie war das Wetter, was wurde gemacht, welche Lieferungen kamen, welche Probleme gab es? Gerade bei Bauzeitverzögerungen kannst du so belegen, dass du zum Beispiel wegen eines anderen Gewerks nicht weiterarbeiten konntest. Ein paar Zeilen pro Tag reichen.",
      },
      {
        typ: "p",
        text: "Für Arbeiten, die nicht im Angebot stehen, ist der Regiebericht das wichtigste Dokument. Er hält fest, wer wie lange was gemacht hat und welches Material verbraucht wurde. Lass ihn möglichst noch am selben Tag vom Kunden oder der Bauleitung unterschreiben. Eine Unterschrift Wochen später zu bekommen, ist deutlich schwieriger.",
      },
      {
        typ: "p",
        text: "Wichtig ist, dass alle Dokumente zusammenbleiben: Fotos, Berichte, Prüfprotokolle, Lieferscheine und das Abnahmeprotokoll gehören zum Auftrag. Dann findest du sie auch in drei Jahren noch, wenn sich der Kunde wegen einer Gewährleistungsfrage meldet – und musst nicht in alten Handys und Ordnern suchen.",
      },
    ],
    checkliste: {
      titel: "Checkliste Baustellendokumentation",
      punkte: [
        "Ausgangszustand mit Übersicht und Details fotografiert",
        "Vorschäden notiert und dem Kunden gezeigt",
        "Verdeckte Leitungen und Bauteile vor dem Schließen fotografiert",
        "Behinderungen und Wartezeiten festgehalten",
        "Zusatzarbeiten per Regiebericht unterschreiben lassen",
        "Mess- und Prüfprotokolle erstellt",
        "Abnahmeprotokoll mit Unterschrift",
        "Alles am Auftrag gespeichert",
      ],
    },
  },
];
