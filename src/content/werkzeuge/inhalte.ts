import type { FaqItem, IconName } from "@/components/ui";
import type { FunktionSlug, TopGewerkSlug, WerkzeugSlug } from "@/content/registry";

export type WerkzeugInhalt = {
  /** SEO-Titel (ohne „| Handwerk OS“, das ergänzt das Layout). */
  seoTitel: string;
  /** Meta-Beschreibung. */
  beschreibung: string;
  h1: string;
  intro: string;
  icon: IconName;
  /** Kennzeichnung im Hub. */
  label?: "Neu" | "Beliebt";
  erklaerung: {
    absaetze: string[];
    /** Formel Schritt für Schritt – eine Zeile pro Schritt. */
    formel: string[];
  };
  /** Text über dem Beispiel; die Zahlen kommen aus `beispiele.ts`. */
  beispielIntro: string;
  /** Hinweis unter dem Ergebnis. */
  hinweis: string;
  funktionen: { slug: FunktionSlug; text: string }[];
  /** Themen, die im Blog vertieft werden (Link auf /wissen/blog). */
  blogThemen: string[];
  faq: FaqItem[];
  verwandt: WerkzeugSlug[];
};

const orientierung = "Das Ergebnis ist eine Orientierung, keine Steuerberatung.";

export const werkzeugInhalte: Record<WerkzeugSlug, WerkzeugInhalt> = {
  "stundensatz-rechner": {
    seoTitel: "Stundensatz berechnen – kostenloser Rechner für Handwerker",
    beschreibung:
      "Berechne deinen Stundensatz aus Jahreskosten, produktiven Stunden und Gewinn. Kostenlos, ohne Anmeldung, mit Beispiel und Formel.",
    h1: "Stundensatz berechnen",
    intro: "Trag deine Kosten und Arbeitszeit ein. Der Rechner zeigt dir sofort, was eine Stunde mindestens kosten muss.",
    icon: "clock",
    label: "Beliebt",
    erklaerung: {
      absaetze: [
        "Dein Stundensatz muss alle Kosten des Jahres tragen: Löhne, dein eigenes Gehalt, Miete, Fahrzeuge, Versicherungen und alles andere.",
        "Diese Kosten verteilst du auf die Stunden, die du wirklich beim Kunden abrechnen kannst. Das sind deutlich weniger als die Stunden im Arbeitsvertrag. Urlaub, Krankheit, Feiertage, Fahrten, Material holen und Büro fallen weg.",
        "Auf die Kosten pro Stunde kommt dein Gewinn. Erst dann hast du einen Stundensatz, mit dem dein Betrieb wachsen kann.",
      ],
      formel: [
        "Jahreskosten = Lohnkosten + Unternehmerlohn + Gemeinkosten",
        "Anwesenheitstage = Arbeitstage − Feiertage − Urlaub − Krankheit − Weiterbildung",
        "Produktive Stunden = Anwesenheitstage × Stunden pro Tag × produktiver Anteil × Mitarbeiter",
        "Kosten pro Stunde = Jahreskosten ÷ produktive Stunden",
        "Stundensatz netto = Kosten pro Stunde × (1 + Gewinnaufschlag)",
      ],
    },
    beispielIntro:
      "Ein Betrieb mit drei produktiven Leuten: zwei Gesellen und der Chef, der selbst mitarbeitet. So sehen die Zahlen aus.",
    hinweis: `Rechne mit den Zahlen aus deiner letzten Jahresabrechnung oder BWA. ${orientierung}`,
    funktionen: [
      { slug: "kalkulation", text: "Stundensatz einmal hinterlegen und in jeder Kalkulation nutzen." },
      { slug: "zeiterfassung", text: "Sehen, wie viele Stunden wirklich produktiv waren." },
      { slug: "auswertung", text: "Kosten und Umsatz im Blick – ohne Excel." },
    ],
    blogThemen: [
      "Stundensatz im Handwerk richtig berechnen",
      "Unternehmerlohn: Was du dir selbst zahlen solltest",
      "Produktive Stunden erhöhen: weniger Leerlauf im Alltag",
    ],
    faq: [
      {
        frage: "Was ist der Unterschied zwischen Stundensatz und Stundenlohn?",
        antwort:
          "Der Stundenlohn ist das, was dein Mitarbeiter brutto bekommt. Der Stundensatz ist das, was du dem Kunden berechnest. Er muss Lohn, Lohnnebenkosten, alle Gemeinkosten und deinen Gewinn abdecken – deshalb ist er oft drei- bis viermal so hoch wie der Stundenlohn.",
      },
      {
        frage: "Wie viele produktive Stunden hat ein Mitarbeiter im Jahr?",
        antwort:
          "Das hängt von deinem Betrieb ab. Von rund 260 Arbeitstagen gehen Feiertage, Urlaub, Krankheit und Weiterbildung ab. Von der Anwesenheit ist nur ein Teil abrechenbar, weil Fahrten, Rüstzeiten und Büroarbeit dazukommen. Schau in deine Zeiterfassung, um deinen echten Anteil zu kennen.",
      },
      {
        frage: "Muss ich meinen eigenen Lohn einrechnen?",
        antwort:
          "Ja. Auch wenn du als Inhaber kein Gehalt überwiesen bekommst, kostet deine Arbeitszeit Geld. Dieser Unternehmerlohn gehört in die Kosten. Sonst arbeitest du am Ende für den Gewinn, den du eigentlich für schlechte Zeiten bräuchtest.",
      },
      {
        frage: "Netto oder brutto – welchen Stundensatz nenne ich dem Kunden?",
        antwort:
          "Gewerbekunden nennst du den Nettopreis. Privatkunden musst du den Endpreis inklusive Mehrwertsteuer nennen. Der Rechner zeigt dir beides.",
      },
      {
        frage: "Werden meine Eingaben gespeichert?",
        antwort:
          "Nein. Der Rechner läuft komplett in deinem Browser. Deine Zahlen werden nicht an uns geschickt. Wenn du das Ergebnis behalten willst, kopiere es, drucke es oder schick es dir per E-Mail.",
      },
    ],
    verwandt: ["stundenverrechnungssatz-rechner", "deckungsbeitrags-rechner", "angebots-rechner"],
  },

  "stundenverrechnungssatz-rechner": {
    seoTitel: "Stundenverrechnungssatz berechnen – Zuschlagskalkulation für Handwerker",
    beschreibung:
      "Vom Bruttostundenlohn zum Verrechnungssatz: Lohnnebenkosten, Gemeinkosten, Wagnis und Gewinn. Kostenloser Rechner mit Aufschlüsselung.",
    h1: "Stundenverrechnungssatz berechnen",
    intro: "Vom Stundenlohn deines Gesellen zum Preis, den du dem Kunden berechnest – Zuschlag für Zuschlag.",
    icon: "layers",
    erklaerung: {
      absaetze: [
        "Die Zuschlagskalkulation ist der klassische Weg im Handwerk. Du startest beim Bruttostundenlohn und schlägst nacheinander alle Kosten auf.",
        "Lohnnebenkosten sind zum Beispiel Sozialversicherung, Urlaubs- und Feiertagslohn, Lohnfortzahlung bei Krankheit und Berufsgenossenschaft. Gemeinkosten sind alles, was der Betrieb sonst kostet: Miete, Fahrzeuge, Büro, Versicherungen.",
        "Zum Schluss kommt der Zuschlag für Wagnis und Gewinn. Das Ergebnis ist dein Netto-Verrechnungssatz.",
      ],
      formel: [
        "Lohnkosten = Bruttostundenlohn × (1 + Lohnnebenkosten %)",
        "Gemeinkosten = Lohnkosten × Gemeinkostenzuschlag %",
        "Selbstkosten = Lohnkosten + Gemeinkosten",
        "Verrechnungssatz netto = Selbstkosten × (1 + Wagnis und Gewinn %)",
        "Verrechnungssatz brutto = netto × 1,19",
      ],
    },
    beispielIntro: "Ein Geselle verdient 22 € brutto pro Stunde. So wird daraus der Verrechnungssatz.",
    hinweis: `Deine Zuschlagssätze findest du in der Nachkalkulation oder fragst sie bei deinem Steuerbüro an. ${orientierung}`,
    funktionen: [
      { slug: "kalkulation", text: "Verrechnungssätze je Mitarbeiter oder Leistung hinterlegen." },
      { slug: "auswertung", text: "Prüfen, ob deine Zuschläge zur Wirklichkeit passen." },
      { slug: "mitarbeiter", text: "Löhne und Qualifikationen an einem Ort." },
    ],
    blogThemen: [
      "Zuschlagskalkulation im Handwerk einfach erklärt",
      "Lohnnebenkosten: Was ein Mitarbeiter wirklich kostet",
      "Gemeinkosten senken, ohne an der Qualität zu sparen",
    ],
    faq: [
      {
        frage: "Wie hoch sind Lohnnebenkosten im Handwerk?",
        antwort:
          "Das ist von Betrieb zu Betrieb verschieden. Neben den Arbeitgeberanteilen zur Sozialversicherung zählen bezahlte Ausfallzeiten wie Urlaub, Feiertage und Krankheit dazu. Viele Betriebe kommen so auf deutlich mehr als die Hälfte des Bruttolohns. Rechne mit deinen eigenen Zahlen aus der Lohnabrechnung.",
      },
      {
        frage: "Worauf beziehe ich den Gemeinkostenzuschlag?",
        antwort:
          "Meist auf die Lohnkosten, also Lohn plus Lohnnebenkosten. Manche Betriebe rechnen ihn nur auf den Bruttolohn. Wichtig ist, dass du immer gleich rechnest. Im Rechner kannst du beides auswählen.",
      },
      {
        frage: "Was ist der Unterschied zum Stundensatz-Rechner?",
        antwort:
          "Der Stundensatz-Rechner geht von deinen Jahreskosten aus. Der Stundenverrechnungssatz-Rechner geht vom Stundenlohn aus und arbeitet mit Zuschlägen. Beide Wege sollten ungefähr beim selben Ergebnis landen – wenn nicht, lohnt sich ein genauer Blick auf deine Zahlen.",
      },
      {
        frage: "Was ist der Kalkulationsfaktor?",
        antwort:
          "Der Kalkulationsfaktor ist der Verrechnungssatz geteilt durch den Bruttostundenlohn. Er zeigt auf einen Blick, wie viel Aufschlag auf den Lohn nötig ist.",
      },
    ],
    verwandt: ["stundensatz-rechner", "angebots-rechner", "deckungsbeitrags-rechner"],
  },

  "angebots-rechner": {
    seoTitel: "Angebot kalkulieren – kostenloser Angebots-Rechner für Handwerker",
    beschreibung:
      "Lohn, Material, Fremdleistungen und Anfahrt zusammenrechnen, Rabatt abziehen, Mehrwertsteuer drauf. Kostenloser Angebots-Rechner fürs Handwerk.",
    h1: "Angebot schnell kalkulieren",
    intro: "Positionen eintragen, Rabatt wählen – der Rechner zeigt dir Netto, Mehrwertsteuer und Endpreis.",
    icon: "file",
    label: "Beliebt",
    erklaerung: {
      absaetze: [
        "Ein Angebot besteht meist aus vier Bausteinen: Arbeitszeit, Material, Fremdleistungen und Anfahrt.",
        "Auf Material und Fremdleistungen kommt ein Aufschlag. Damit deckst du Einkauf, Lager, Transport und das Risiko bei Gewährleistung.",
        "Ein Rabatt wird von der Summe abgezogen. Danach kommt die Mehrwertsteuer.",
      ],
      formel: [
        "Lohn = Stunden × Stundensatz",
        "Material = Menge × Einkaufspreis × (1 + Aufschlag %)",
        "Fremdleistung = Einkaufspreis × (1 + Aufschlag %)",
        "Netto = Summe aller Positionen − Rabatt",
        "Brutto = Netto + Mehrwertsteuer",
      ],
    },
    beispielIntro: "Ein kleiner Auftrag mit Arbeitszeit, Material, Entsorgung und drei Anfahrten.",
    hinweis: `Der Rechner ersetzt kein vollständiges Angebot mit Leistungsbeschreibung. ${orientierung}`,
    funktionen: [
      { slug: "angebote", text: "Aus der Kalkulation direkt ein fertiges Angebot machen." },
      { slug: "kalkulation", text: "Positionen, Stundensätze und Aufschläge als Vorlage speichern." },
      { slug: "rechnungen", text: "Aus dem angenommenen Angebot die Rechnung erzeugen." },
    ],
    blogThemen: [
      "Angebot richtig kalkulieren: die häufigsten Fehler",
      "Rabatt geben, ohne draufzuzahlen",
      "Angebote schneller schreiben im Handwerk",
    ],
    faq: [
      {
        frage: "Muss ich im Angebot Netto- oder Bruttopreise angeben?",
        antwort:
          "Bei Privatkunden musst du den Endpreis inklusive Mehrwertsteuer angeben. Bei Gewerbekunden reichen Nettopreise mit ausgewiesener Mehrwertsteuer. Der Rechner zeigt dir beides.",
      },
      {
        frage: "Wie hoch sollte der Materialaufschlag sein?",
        antwort:
          "Das hängt von deinem Gewerk und deinem Einkauf ab. Der Aufschlag muss Bestellung, Lager, Transport, Verschnitt und Gewährleistung abdecken. Mit dem Materialaufschlag-Rechner kannst du das genau durchrechnen.",
      },
      {
        frage: "Wie wirkt sich ein Rabatt aus?",
        antwort:
          "Ein Rabatt geht direkt von deinem Gewinn ab, nicht von deinen Kosten. 3 % Rabatt können bei knapper Kalkulation einen großen Teil des Gewinns kosten. Prüf es mit dem Deckungsbeitrags-Rechner.",
      },
      {
        frage: "Welcher Mehrwertsteuersatz gilt?",
        antwort:
          "Für die meisten Handwerksleistungen gilt der Regelsatz von 19 %. Als Kleinunternehmer weist du keine Mehrwertsteuer aus. Im Zweifel frag dein Steuerbüro.",
      },
    ],
    verwandt: ["materialaufschlag-rechner", "stundensatz-rechner", "fahrtkosten-rechner"],
  },

  "materialaufschlag-rechner": {
    seoTitel: "Materialaufschlag berechnen – Aufschlag und Marge im Handwerk",
    beschreibung:
      "Vom Einkaufspreis zum Verkaufspreis und zurück. Aufschlag und Handelsspanne sauber unterscheiden – kostenloser Rechner mit Mengen.",
    h1: "Materialaufschlag berechnen",
    intro: "Einkaufspreis eintragen, Aufschlag oder Verkaufspreis wählen – fertig. Mit Marge und Menge.",
    icon: "box",
    erklaerung: {
      absaetze: [
        "Aufschlag und Marge werden oft verwechselt. Der Aufschlag bezieht sich auf den Einkaufspreis. Die Marge, auch Handelsspanne genannt, bezieht sich auf den Verkaufspreis.",
        "Ein Beispiel: 25 % Aufschlag auf 40 € ergibt 50 €. Von diesen 50 € bleiben dir 10 € – das sind 20 % Marge, nicht 25 %.",
        "Wer mit 25 % Marge rechnen will, braucht also 33,3 % Aufschlag.",
      ],
      formel: [
        "Verkaufspreis = Einkaufspreis × (1 + Aufschlag %)",
        "Aufschlag % = (Verkaufspreis − Einkaufspreis) ÷ Einkaufspreis",
        "Marge % = (Verkaufspreis − Einkaufspreis) ÷ Verkaufspreis",
        "Aufschlag % = Marge % ÷ (1 − Marge %)",
      ],
    },
    beispielIntro: "Du kaufst 12 Stück für je 40 € netto ein und rechnest 25 % Aufschlag.",
    hinweis: `Rechne Einkaufspreise immer netto, also ohne Mehrwertsteuer. ${orientierung}`,
    funktionen: [
      { slug: "material", text: "Artikel mit Einkaufspreis und Aufschlag hinterlegen." },
      { slug: "einkauf", text: "Preise deiner Lieferanten vergleichen und bestellen." },
      { slug: "kalkulation", text: "Material mit richtigem Aufschlag ins Angebot übernehmen." },
    ],
    blogThemen: [
      "Aufschlag oder Marge? Der Unterschied mit Beispielen",
      "Materialkosten im Griff: Einkauf im Handwerk",
      "Verschnitt und Kleinmaterial richtig einrechnen",
    ],
    faq: [
      {
        frage: "Was ist der Unterschied zwischen Aufschlag und Marge?",
        antwort:
          "Der Aufschlag ist der Prozentsatz auf den Einkaufspreis. Die Marge ist der Anteil am Verkaufspreis, der dir bleibt. 25 % Aufschlag entsprechen 20 % Marge. 50 % Aufschlag entsprechen 33,3 % Marge.",
      },
      {
        frage: "Darf ich auf Material einen Aufschlag nehmen?",
        antwort:
          "Ja. Material zu besorgen kostet Zeit und Geld: Bestellung, Abholung, Lager, Verschnitt und Gewährleistung. Der Aufschlag deckt diese Kosten. Wie hoch er ist, entscheidest du.",
      },
      {
        frage: "Warum kann die Marge nie 100 % erreichen?",
        antwort:
          "Weil die Marge ein Anteil am Verkaufspreis ist. Bei 100 % Marge wäre der Einkaufspreis null. Deshalb lässt der Rechner nur Margen unter 100 % zu.",
      },
      {
        frage: "Rechne ich mit Netto- oder Bruttopreisen?",
        antwort:
          "Mit Nettopreisen. Die Mehrwertsteuer ist kein Teil deines Ertrags. Der Rechner zeigt dir den Bruttopreis zusätzlich, wenn du ihn für Privatkunden brauchst.",
      },
    ],
    verwandt: ["angebots-rechner", "deckungsbeitrags-rechner", "stundensatz-rechner"],
  },

  "fahrtkosten-rechner": {
    seoTitel: "Fahrtkosten berechnen – Anfahrtspauschale für Handwerker prüfen",
    beschreibung:
      "Was kostet dich eine Anfahrt wirklich? Kilometer, Fahrzeugkosten und Fahrzeit berechnen und mit deiner Pauschale vergleichen. Kostenloser Rechner.",
    h1: "Fahrtkosten berechnen",
    intro: "Prüf in einer Minute, ob deine Anfahrtspauschale die echten Kosten deckt – pro Einsatz und im Monat.",
    icon: "truck",
    label: "Neu",
    erklaerung: {
      absaetze: [
        "Eine Anfahrt kostet doppelt: Das Fahrzeug verbraucht Sprit und verschleißt. Und deine Leute sitzen im Auto statt beim Kunden zu arbeiten.",
        "Die Fahrzeugkosten rechnest du am einfachsten mit einem Satz pro Kilometer. Oder du rechnest ihn aus Verbrauch, Spritpreis und einer Pauschale für Verschleiß und Wartung.",
        "Die Fahrzeit bewertest du mit dem Stundensatz – für jede Person im Fahrzeug.",
      ],
      formel: [
        "Kilometer = Entfernung × 2 (Hin- und Rückweg)",
        "Fahrzeugkosten = Kilometer × Kosten pro km",
        "Kosten pro km = Verbrauch ÷ 100 × Spritpreis + Verschleiß pro km",
        "Zeitkosten = Fahrzeit in Stunden × Personen × Stundensatz",
        "Differenz = Pauschale − (Fahrzeugkosten + Zeitkosten)",
      ],
    },
    beispielIntro: "Ein Kunde wohnt 18 km entfernt. Die Fahrt dauert 25 Minuten. Du berechnest 59 € Anfahrt.",
    hinweis: `Ein fester Kilometersatz enthält oft schon Versicherung, Steuer und Wertverlust. Der Verbrauch allein ist zu wenig. ${orientierung}`,
    funktionen: [
      { slug: "fahrzeuge", text: "Fahrzeuge, Kosten und Termine wie TÜV an einem Ort." },
      { slug: "einsatzplanung", text: "Touren so planen, dass weniger gefahren wird." },
      { slug: "zeiterfassung", text: "Fahrzeiten automatisch mit erfassen." },
    ],
    blogThemen: [
      "Anfahrtspauschale im Handwerk: so rechnest du richtig",
      "Fahrzeiten senken mit besserer Tourenplanung",
      "Was ein Firmenwagen pro Kilometer wirklich kostet",
    ],
    faq: [
      {
        frage: "Was kostet ein Transporter pro Kilometer?",
        antwort:
          "Das hängt vom Fahrzeug ab. Neben Sprit zählen Wertverlust, Versicherung, Steuer, Wartung und Reifen dazu. Teile deine gesamten Fahrzeugkosten eines Jahres durch die gefahrenen Kilometer – dann hast du deinen eigenen Satz.",
      },
      {
        frage: "Darf ich Fahrzeit berechnen?",
        antwort:
          "Ja, wenn es so vereinbart ist. Viele Betriebe berechnen eine Pauschale, andere die tatsächliche Fahrzeit. Wichtig ist, dass es im Angebot klar steht.",
      },
      {
        frage: "Pauschale oder nach Aufwand – was ist besser?",
        antwort:
          "Eine Pauschale ist für Kunden leicht zu verstehen. Sie muss aber im Schnitt deine echten Kosten decken. Viele Betriebe staffeln die Pauschale nach Entfernungszonen. Der Rechner zeigt dir, wo deine Pauschale heute liegt.",
      },
      {
        frage: "Warum zähle ich die Personen im Fahrzeug?",
        antwort:
          "Weil jede Person während der Fahrt bezahlt wird, aber nichts beim Kunden schafft. Zwei Monteure im Auto kosten doppelt so viel Fahrzeit wie einer.",
      },
    ],
    verwandt: ["stundensatz-rechner", "angebots-rechner", "deckungsbeitrags-rechner"],
  },

  "deckungsbeitrags-rechner": {
    seoTitel: "Deckungsbeitrag berechnen – lohnt sich der Auftrag? Rechner fürs Handwerk",
    beschreibung:
      "Umsatz minus Material, Fremdleistung und Lohn: Berechne den Deckungsbeitrag eines Auftrags und sieh sofort, ob er seine Kosten deckt.",
    h1: "Deckungsbeitrag berechnen",
    intro: "Prüf vor oder nach dem Auftrag, was wirklich übrig bleibt – mit klarer Ampel.",
    icon: "chart",
    label: "Neu",
    erklaerung: {
      absaetze: [
        "Der Deckungsbeitrag zeigt, was ein Auftrag übrig lässt, nachdem die Kosten abgezogen sind, die nur wegen dieses Auftrags entstehen: Material, Fremdleistungen und die Lohnkosten der Stunden auf der Baustelle.",
        "Von diesem Betrag muss der Auftrag seinen Teil der festen Kosten bezahlen: Miete, Fahrzeuge, Büro. Was danach bleibt, ist Gewinn.",
        "Ein Auftrag mit positivem Deckungsbeitrag kann sinnvoll sein, auch wenn er nicht alle Fixkosten deckt – etwa in einer ruhigen Woche. Dauerhaft muss jeder Auftrag aber seinen Anteil tragen.",
      ],
      formel: [
        "Variable Kosten = Material + Fremdleistung + Lohnstunden × Lohnkosten pro Stunde",
        "Deckungsbeitrag = Umsatz netto − variable Kosten",
        "Deckungsbeitrag % = Deckungsbeitrag ÷ Umsatz netto",
        "Anteilige Fixkosten = Lohnstunden × Gemeinkosten pro Stunde",
        "Ergebnis = Deckungsbeitrag − anteilige Fixkosten",
      ],
    },
    beispielIntro: "Ein Auftrag über 8.500 € netto mit 64 Stunden auf der Baustelle.",
    hinweis: `Lohnkosten pro Stunde heißt hier: Lohn plus Lohnnebenkosten – nicht dein Verrechnungssatz. ${orientierung}`,
    funktionen: [
      { slug: "auswertung", text: "Deckungsbeitrag jedes Auftrags automatisch sehen." },
      { slug: "kalkulation", text: "Vor- und Nachkalkulation am selben Auftrag." },
      { slug: "auftraege", text: "Stunden, Material und Kosten direkt am Auftrag erfassen." },
    ],
    blogThemen: [
      "Nachkalkulation im Handwerk: so geht es einfach",
      "Deckungsbeitrag verstehen: welche Aufträge sich lohnen",
      "Fixkosten und variable Kosten im Handwerksbetrieb",
    ],
    faq: [
      {
        frage: "Was ist ein guter Deckungsbeitrag?",
        antwort:
          "Das hängt davon ab, wie hoch deine Fixkosten sind. Der Deckungsbeitrag aller Aufträge zusammen muss die Fixkosten des Jahres decken – erst danach verdienst du Geld. Der Rechner vergleicht deshalb mit dem Anteil der Fixkosten für diesen Auftrag.",
      },
      {
        frage: "Was gehört zu den variablen Kosten?",
        antwort:
          "Alles, was nur wegen dieses Auftrags entsteht: Material, Fremdleistungen und die Lohnkosten der Stunden, die für den Auftrag gearbeitet werden. Miete, Büro oder Versicherungen gehören nicht dazu.",
      },
      {
        frage: "Woher bekomme ich die Gemeinkosten pro Stunde?",
        antwort:
          "Teile deine jährlichen Gemeinkosten durch die produktiven Stunden aller Mitarbeiter. Der Stundensatz-Rechner hilft dir dabei.",
      },
      {
        frage: "Sollte ich Aufträge mit gelber Ampel ablehnen?",
        antwort:
          "Nicht unbedingt. Gelb heißt: Der Auftrag deckt seine direkten Kosten und einen Teil der Fixkosten. Wenn sonst nichts zu tun wäre, hilft er trotzdem. Er sollte aber nicht die Regel sein.",
      },
    ],
    verwandt: ["stundensatz-rechner", "angebots-rechner", "stundenverrechnungssatz-rechner"],
  },
};

/** Welche Rechner für welches Gewerk besonders nützlich sind. */
export const werkzeugeNachGewerk: Record<TopGewerkSlug, { text: string; werkzeuge: WerkzeugSlug[] }> = {
  elektriker: {
    text: "Viele kleine Einsätze: Stundensatz und Anfahrt müssen stimmen.",
    werkzeuge: ["stundensatz-rechner", "fahrtkosten-rechner", "angebots-rechner"],
  },
  shk: {
    text: "Viel Material und Kundendienst: Aufschlag und Verrechnungssatz im Blick.",
    werkzeuge: ["materialaufschlag-rechner", "stundenverrechnungssatz-rechner", "fahrtkosten-rechner"],
  },
  maler: {
    text: "Lohnstarke Aufträge: Stundensatz und Deckungsbeitrag entscheiden.",
    werkzeuge: ["stundensatz-rechner", "angebots-rechner", "deckungsbeitrags-rechner"],
  },
  fliesenleger: {
    text: "Material und Verschnitt richtig einpreisen.",
    werkzeuge: ["materialaufschlag-rechner", "angebots-rechner", "deckungsbeitrags-rechner"],
  },
  tischler: {
    text: "Einzelstücke kalkulieren und nachrechnen.",
    werkzeuge: ["deckungsbeitrags-rechner", "materialaufschlag-rechner", "stundenverrechnungssatz-rechner"],
  },
  dachdecker: {
    text: "Große Aufträge mit Gerüst, Kolonne und weiten Wegen.",
    werkzeuge: ["angebots-rechner", "deckungsbeitrags-rechner", "fahrtkosten-rechner"],
  },
  bau: {
    text: "Kolonnen, Fremdleistungen und knappe Preise.",
    werkzeuge: ["stundenverrechnungssatz-rechner", "deckungsbeitrags-rechner", "angebots-rechner"],
  },
  galabau: {
    text: "Viel unterwegs, viel Material: Fahrten und Aufschläge prüfen.",
    werkzeuge: ["fahrtkosten-rechner", "materialaufschlag-rechner", "angebots-rechner"],
  },
};
