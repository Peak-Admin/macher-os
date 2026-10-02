import { PARTNER_EMAIL } from "@/content/unternehmen";
import { testTage } from "@/content/preise";
import { cta } from "@/lib/site";
import type { Landing } from "./typ";

/**
 * Zielgruppenseiten unter `/fuer/…`: Neugründer, Meisterschüler, Meisterschulen.
 * Sonderkonditionen (z. B. für Gründer oder Schulen) gibt es noch nicht fest – nur „auf Anfrage“ nennen.
 */

export const zielgruppenSeiten = {
  neugruender: {
    pfad: "/fuer/neugruender",
    meta: {
      title: "Handwerkersoftware für Neugründer – von Anfang an richtig organisiert",
      description:
        "Betrieb gegründet? Mit Macher OS schreibst du ab dem ersten Tag saubere Angebote und Rechnungen, planst Termine und bist bereit für die ersten Mitarbeiter.",
    },
    breadcrumbs: [{ label: "Für Neugründer" }],
    hero: {
      eyebrow: "Für Neugründer",
      title: "Gleich richtig anfangen.",
      intro:
        "Du hast dich selbstständig gemacht – jetzt willst du arbeiten, nicht verwalten. Macher OS ist ab dem ersten Auftrag dein Büro: Angebote, Termine, Rechnungen. Und es wächst mit, wenn die ersten Leute dazukommen.",
      bild: "alltag/handy",
    },
    schmerz: {
      eyebrow: "Die ersten Monate",
      titel: "Viel Arbeit, wenig Zeit – und das Büro bleibt liegen.",
      punkte: [
        "Angebote abends am Küchentisch in einer Word-Vorlage",
        "Rechnungsnummern, Pflichtangaben, E-Rechnung – was muss eigentlich drauf?",
        "Kunden warten auf Rückruf, weil die Anfrage im Handy untergeht",
        "Später umziehen kostet doppelt Zeit",
      ],
      antwort: "Mit Macher OS hast du vom ersten Tag an ein ordentliches Büro – ohne Büro.",
    },
    vorteile: {
      eyebrow: "Was du sofort hast",
      titel: "Alles, was ein junger Betrieb braucht.",
      karten: [
        { titel: "Angebote vom Handy", text: "Mit deinem Logo, sauber gerechnet, als PDF verschickt.", icon: "file" },
        { titel: "Rechnungen richtig", text: "Fortlaufende Nummern, Pflichtangaben und XRechnung eingebaut.", icon: "euro" },
        { titel: "Kalender & Termine", text: "Termine am Auftrag, Kunden buchen auf Wunsch online.", icon: "calendar" },
        { titel: "Bereit fürs Team", text: "Der erste Mitarbeiter bekommt die App – du planst seine Einsätze.", icon: "users" },
      ],
    },
    ablauf: {
      titel: "Vom ersten Auftrag bis zum ersten Mitarbeiter.",
      schritte: [
        { titel: "Gewerk wählen", text: "Macher OS richtet Vorlagen für dein Gewerk ein." },
        { titel: "Betrieb eintragen", text: "Logo, Anschrift, Bankverbindung – einmal, für immer." },
        { titel: "Erstes Angebot", text: "Positionen aus den Vorlagen, Preise anpassen, verschicken." },
        { titel: "Wachsen", text: "Mitarbeiter, Plantafel und Lager nutzt du, wenn du sie brauchst." },
      ],
    },
    checkliste: {
      eyebrow: "Fair für Gründer",
      titel: "Klein anfangen, ohne Risiko.",
      punkte: [
        "Solo-Plan für 1–2 Leute – alles drin",
        `${testTage} Tage kostenlos, ohne Kreditkarte`,
        "Monatlich kündbar, keine Mindestlaufzeit",
        "Export im DATEV-Format für deinen Steuerberater",
      ],
      link: { label: "Preise ansehen", href: "/preise" },
    },
    faq: [
      {
        frage: "Lohnt sich Software, wenn ich allein bin?",
        antwort:
          "Gerade dann: Du hast niemanden, der dir das Büro abnimmt. Macher OS hilft dir, Angebote und Rechnungen schnell und richtig zu schreiben.",
      },
      {
        frage: "Gibt es einen Gründerrabatt?",
        antwort: "Einen festen Gründerrabatt gibt es derzeit nicht. Schreib uns, wenn du gerade gründest – wir sprechen gern über deine Lage.",
      },
      {
        frage: "Brauche ich einen Steuerberater-Zugang?",
        antwort: "Nein. Du gibst deinem Steuerberater die Daten als Export im DATEV-Format.",
      },
      {
        frage: "Was, wenn ich schnell wachse?",
        antwort: "Dann wechselst du in den nächsten Plan. Deine Daten und Einstellungen bleiben, alle Funktionen sind von Anfang an drin.",
      },
    ],
    weiter: {
      links: [
        { label: "Stundensatz berechnen", href: "/werkzeuge/stundensatz-rechner", text: "Was muss deine Stunde kosten?" },
        { label: "Macher OS vs. Word & Excel", href: "/vergleich/word-excel", text: "Warum Vorlagen dich später bremsen." },
        { label: "Vorlagen & Checklisten", href: "/wissen/vorlagen", text: "Praktische Hilfen für den Alltag." },
      ],
    },
    cta: { title: "Dein Betrieb. Von Anfang an ordentlich.", intro: "Starte kostenlos und schreib dein erstes Angebot noch heute." },
  },

  meisterschueler: {
    pfad: "/fuer/meisterschueler",
    meta: {
      title: "Für Meisterschüler – Betriebsführung mit echter Software üben",
      description:
        "Du machst deinen Meister? Lerne mit Macher OS, wie ein Betrieb organisiert ist: Kalkulation, Angebot, Einsatzplanung, Rechnung – mit Beispieldaten oder deinem eigenen Projekt.",
    },
    breadcrumbs: [{ label: "Für Meisterschüler" }],
    hero: {
      eyebrow: "Für Meisterschüler",
      title: "Den Betrieb führen lernen – bevor es ernst wird.",
      intro:
        "In der Meisterschule lernst du Kalkulation, Angebot und Betriebsführung. Mit Macher OS übst du es an einer echten Software – und hast sie schon parat, wenn du dich selbstständig machst oder Verantwortung übernimmst.",
      bild: "alltag/team",
      aktionen: { primaer: { label: "Demo mit Beispieldaten", href: "/demo" }, sekundaer: { label: "Kostenlos testen", href: cta.primary.href } },
    },
    vorteile: {
      eyebrow: "Was du lernst",
      titel: "Vom Stundensatz bis zur bezahlten Rechnung.",
      karten: [
        { titel: "Kalkulieren", text: "Stundensatz, Materialaufschlag und Positionen durchrechnen.", icon: "calculator" },
        { titel: "Angebote schreiben", text: "Ein vollständiges Angebot mit allen Pflichtangaben.", icon: "file" },
        { titel: "Einsätze planen", text: "Wer ist wann wo? Plantafel mit Leuten, Fahrzeugen und Material.", icon: "calendar" },
        { titel: "Nachkalkulation", text: "Hat sich der Auftrag gerechnet? Die Auswertung zeigt es.", icon: "chart" },
      ],
    },
    ablauf: {
      titel: "So nutzt du Macher OS in der Meisterschule.",
      schritte: [
        { titel: "Demo öffnen", text: "Ein Beispielbetrieb mit Aufträgen, Team und Rechnungen – zum Ausprobieren." },
        { titel: "Eigenes Projekt", text: "Dein Meisterprojekt oder einen Übungsauftrag selbst durchspielen." },
        { titel: "Mitnehmen", text: "Beim Start in die Selbstständigkeit richtest du Macher OS für deinen Betrieb ein." },
      ],
    },
    faq: [
      {
        frage: "Was kostet Macher OS für Meisterschüler?",
        antwort: `Die Demo mit Beispieldaten ist kostenlos. Für deinen eigenen Betrieb testest du ${testTage} Tage kostenlos. Eigene Schülerpreise gibt es derzeit nicht.`,
      },
      {
        frage: "Ersetzt das den Unterricht?",
        antwort: "Nein. Macher OS hilft dir, das Gelernte an einer echten Software anzuwenden.",
      },
      {
        frage: "Kann meine Meisterschule Macher OS im Unterricht nutzen?",
        antwort: "Ja, sprich deine Schule an oder schick sie auf unsere Seite für Meisterschulen.",
      },
    ],
    weiter: {
      links: [
        { label: "Stundensatz-Rechner", href: "/werkzeuge/stundensatz-rechner", text: "Den eigenen Stundensatz ausrechnen." },
        { label: "Für Neugründer", href: "/fuer/neugruender", text: "Nach dem Meister in die Selbstständigkeit." },
        { label: "Für Meisterschulen", href: "/fuer/meisterschulen", text: "Macher OS im Unterricht." },
      ],
    },
    cta: { title: "Üben mit echter Software.", intro: "Probier die Demo aus oder richte Macher OS für dein eigenes Projekt ein." },
  },

  meisterschulen: {
    pfad: "/fuer/meisterschulen",
    meta: {
      title: "Für Meisterschulen – Betriebsführung praxisnah unterrichten",
      description:
        "Macher OS für Meisterschulen und Bildungszentren: Kalkulation, Angebot, Einsatzplanung und Rechnung an einer echten Handwerkersoftware zeigen. Jetzt Kooperation anfragen.",
    },
    breadcrumbs: [{ label: "Für Meisterschulen" }],
    hero: {
      eyebrow: "Für Meisterschulen",
      title: "Betriebsführung zum Anfassen.",
      intro:
        "Eure Meisterschüler führen bald selbst einen Betrieb. Mit Macher OS zeigt ihr an einer echten Software, wie Kalkulation, Angebot, Planung und Rechnung zusammenhängen.",
      bild: "seite/partner",
      aktionen: { primaer: { label: "Kooperation anfragen", href: "#anfrage" }, sekundaer: { label: "Demo ansehen", href: "/demo" } },
    },
    vorteile: {
      eyebrow: "Im Unterricht",
      titel: "Ein Auftrag, einmal komplett durchgespielt.",
      karten: [
        { titel: "Praxisnah", text: "Vom Kundenanruf bis zur bezahlten Rechnung – an einem Beispielbetrieb.", icon: "clipboard" },
        { titel: "Sofort startklar", text: "Im Browser, ohne Installation, auf Schulrechnern und Handys.", icon: "monitor" },
        { titel: "Verständlich", text: "Handwerkersprache statt Fachchinesisch. Eine Frage zum Start.", icon: "chat" },
      ],
    },
    ablauf: {
      titel: "So kommt Macher OS in euren Unterricht.",
      schritte: [
        { titel: "Anfrage schicken", text: "Kurz beschreiben, welche Kurse und wie viele Teilnehmer ihr habt." },
        { titel: "Gespräch", text: "Wir klären, was ihr braucht und was wir beitragen können." },
        { titel: "Loslegen", text: "Zugänge und Beispieldaten für euren Unterricht." },
      ],
    },
    anfrage: {
      titel: "Kooperation anfragen",
      intro: "Wie eine Zusammenarbeit genau aussieht, besprechen wir mit jeder Schule einzeln.",
      frage: "Wer seid ihr?",
      betreff: "Meisterschule",
      email: PARTNER_EMAIL,
      anliegen: [
        {
          id: "meisterschule",
          label: "Meisterschule",
          beschreibung: "Meistervorbereitung in einem oder mehreren Gewerken.",
          icon: "award",
          email: PARTNER_EMAIL,
          platzhalter: "Welche Gewerke und Kurse bietet ihr an, wie viele Teilnehmer habt ihr ungefähr?",
        },
        {
          id: "bildungszentrum",
          label: "Bildungszentrum oder Kammer",
          beschreibung: "Weiterbildung für mehrere Gewerke.",
          icon: "book",
          email: PARTNER_EMAIL,
          platzhalter: "Welche Kurse habt ihr und wie stellt ihr euch die Zusammenarbeit vor?",
        },
      ],
    },
    faq: [
      {
        frage: "Was kostet Macher OS für Schulen?",
        antwort: "Das besprechen wir mit jeder Schule einzeln. Die Demo mit Beispieldaten könnt ihr jederzeit kostenlos nutzen.",
      },
      {
        frage: "Brauchen die Teilnehmer ein eigenes Konto?",
        antwort: "Für die Demo nicht. Wer Macher OS für einen eigenen Betrieb einrichtet, braucht kein Konto, solange die Daten im Browser bleiben.",
      },
      {
        frage: "Gibt es Unterrichtsmaterial?",
        antwort: "Im Wissensbereich gibt es Vorlagen, Checklisten und Rechner. Material für euren Unterricht stimmen wir gern gemeinsam ab.",
      },
    ],
    weiter: {
      links: [
        { label: "Für Meisterschüler", href: "/fuer/meisterschueler", text: "Was eure Teilnehmer davon haben." },
        { label: "Macher Akademie", href: "/wissen/akademie", text: "Lernen im eigenen Tempo." },
        { label: "Partner", href: "/partner", text: "Alle Partnerschaften mit Macher OS." },
      ],
    },
    cta: { title: "Den Meistern von morgen zeigen, wie's geht.", intro: "Schaut euch die Demo an oder startet selbst kostenlos." },
  },
} satisfies Record<string, Landing>;

export type ZielgruppeSlug = keyof typeof zielgruppenSeiten;

