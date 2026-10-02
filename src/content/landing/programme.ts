import { cta, herausgeber } from "@/lib/site";
import { KONTAKT_EMAIL, PARTNER_EMAIL } from "@/content/unternehmen";
import type { Landing } from "./typ";

/**
 * Programme: Empfehlungsprogramm, Creator & Botschafter, Partnerbetriebe.
 *
 * Stand Oktober 2026: Für keines der Programme sind Prämien oder Konditionen freigegeben. Die Seiten nehmen
 * Anfragen entgegen und sagen offen, dass wir Einzelheiten persönlich besprechen. Sobald es feste Regeln gibt,
 * hier eintragen – vorher keine Beträge, Freimonate oder Provisionen nennen.
 */

export const empfehlen: Landing = {
  pfad: "/empfehlen",
  meta: {
    title: "Empfehlungsprogramm – Macher OS weiterempfehlen",
    description:
      "Du nutzt Macher OS und kennst einen Betrieb, dem es hilft? Empfiehl uns weiter. So funktioniert das Empfehlungsprogramm von Macher OS.",
  },
  breadcrumbs: [{ label: "Empfehlungsprogramm" }],
  hero: {
    eyebrow: "Empfehlungsprogramm",
    title: "Gute Werkzeuge gibt man weiter.",
    intro:
      "Im Handwerk zählt die Empfehlung vom Kollegen mehr als jede Werbung. Du kennst einen Betrieb, dem Macher OS hilft? Sag es weiter – und sag uns Bescheid.",
    bild: "alltag/team",
    aktionen: { primaer: { label: "Betrieb empfehlen", href: "#anfrage" }, sekundaer: { label: "Erst selbst testen", href: cta.primary.href } },
  },
  ablauf: {
    titel: "So funktioniert's.",
    schritte: [
      { titel: "Erzählen", text: "Erzähl einem Kollegen, Kunden oder Lieferanten aus dem Handwerk von Macher OS." },
      { titel: "Bescheid sagen", text: "Schreib uns, wen du empfohlen hast – mit dessen Einverständnis." },
      { titel: "Dankeschön", text: "Wenn der Betrieb Macher OS nutzt, melden wir uns bei dir." },
    ],
  },
  vorteile: {
    eyebrow: "Warum empfehlen",
    titel: "Was du davon hast.",
    karten: [
      { titel: "Ein Dankeschön", text: "Für jede erfolgreiche Empfehlung bedanken wir uns. Wie, besprechen wir mit dir.", icon: "heart" },
      { titel: "Bessere Zusammenarbeit", text: "Wenn dein Subunternehmer oder Partnerbetrieb auch Macher OS nutzt, läuft die Abstimmung leichter.", icon: "users" },
      { titel: "Mitreden", text: "Wer empfiehlt, hat einen kurzen Draht zu uns – für Wünsche und Ideen.", icon: "chat" },
    ],
  },
  anfrage: {
    titel: "Betrieb empfehlen",
    intro: "Schreib uns, wen du empfohlen hast. Bitte nur mit Einverständnis des Betriebs.",
    frage: "Wer empfiehlt?",
    betreff: "Empfehlung",
    email: KONTAKT_EMAIL,
    anliegen: [
      {
        id: "kunde",
        label: "Ich nutze Macher OS",
        beschreibung: "Du bist selbst Kunde und empfiehlst einen Betrieb.",
        icon: "home",
        email: KONTAKT_EMAIL,
        platzhalter: "Dein Betrieb, und welchen Betrieb hast du empfohlen (Name, Ort, Ansprechpartner)?",
      },
      {
        id: "andere",
        label: "Ich kenne Macher OS",
        beschreibung: "Du bist kein Kunde, kennst aber einen passenden Betrieb.",
        icon: "user",
        email: KONTAKT_EMAIL,
        platzhalter: "Woher kennst du Macher OS, und welchen Betrieb hast du empfohlen?",
      },
    ],
  },
  faq: [
    {
      frage: "Was bekomme ich für eine Empfehlung?",
      antwort:
        "Das Empfehlungsprogramm startet gerade. Feste Prämien gibt es noch nicht – wir bedanken uns persönlich und sprechen das mit dir ab.",
    },
    {
      frage: "Muss ich selbst Kunde sein?",
      antwort: "Nein. Am meisten zählt aber die Empfehlung von jemandem, der Macher OS selbst nutzt.",
    },
    {
      frage: "Gebt ihr Daten weiter?",
      antwort: "Nein. Wir melden uns nur bei Betrieben, die damit einverstanden sind.",
    },
  ],
  weiter: {
    links: [
      { label: "Creator & Botschafter", href: "/botschafter", text: "Du erzählst gern online vom Handwerk?" },
      { label: "Partnerbetriebe", href: "/partnerbetriebe", text: "Zeig anderen, wie du mit Macher OS arbeitest." },
      { label: "Wechselbonus", href: "/wechselbonus", text: "Für Betriebe mit laufendem Vertrag." },
    ],
  },
  cta: { title: "Noch nicht dabei?", intro: "Teste Macher OS selbst – dann weißt du, was du empfiehlst." },
};

export const botschafter: Landing = {
  pfad: "/botschafter",
  meta: {
    title: "Creator & Botschafter – fürs Handwerk sichtbar werden",
    description:
      "Du zeigst dein Handwerk auf Instagram, TikTok oder YouTube? Werde Botschafter von Macher OS – dem Joint-Venture-Projekt von Mission Mittelstand.",
  },
  breadcrumbs: [{ label: "Creator & Botschafter" }],
  hero: {
    eyebrow: "Creator & Botschafter",
    title: "Du zeigst, wie modernes Handwerk geht.",
    intro: `Du erzählst online von deinem Betrieb, deinen Baustellen und deinem Alltag? Dann lass uns zusammen zeigen, dass Handwerk und gute Organisation zusammengehören – mit Macher OS und ${herausgeber.name}.`,
    bild: "seite/ueber-uns",
    aktionen: { primaer: { label: "Bewerben", href: "#anfrage" }, sekundaer: { label: "Über Macher OS", href: "/ueber-uns" } },
  },
  vorteile: {
    eyebrow: "Wen wir suchen",
    titel: "Echte Handwerker. Echter Alltag.",
    karten: [
      { titel: "Handwerker mit Kanal", text: "Du zeigst deine Arbeit auf Instagram, TikTok, YouTube oder LinkedIn.", icon: "camera" },
      { titel: "Meister & Ausbilder", text: "Du gibst Wissen weiter – an Azubis, Kollegen oder deine Community.", icon: "award" },
      { titel: "Unternehmer", text: "Du sprichst über Betriebsführung, Mitarbeiter und Digitalisierung.", icon: "chart" },
    ],
  },
  checkliste: {
    eyebrow: "Was dich erwartet",
    titel: "Zusammenarbeit auf Augenhöhe.",
    punkte: [
      "Ein direkter Draht zu unserem Team",
      `Gemeinsame Inhalte mit ${herausgeber.name}`,
      "Früh mitreden, wenn neue Funktionen entstehen",
      "Keine Skripte: Du erzählst, wie du wirklich arbeitest",
    ],
  },
  anfrage: {
    titel: "Bewirb dich",
    intro: "Schick uns deinen Kanal und ein paar Zeilen zu dir. Konditionen besprechen wir persönlich.",
    frage: "Was machst du?",
    betreff: "Botschafter",
    email: PARTNER_EMAIL,
    anliegen: [
      {
        id: "creator",
        label: "Creator",
        beschreibung: "Du zeigst dein Handwerk online.",
        icon: "camera",
        email: PARTNER_EMAIL,
        platzhalter: "Dein Kanal (Link), dein Gewerk und worüber du am liebsten erzählst.",
      },
      {
        id: "botschafter",
        label: "Botschafter",
        beschreibung: "Du empfiehlst Macher OS in deinem Netzwerk, Verband oder Kurs.",
        icon: "users",
        email: PARTNER_EMAIL,
        platzhalter: "Wer bist du, und in welchem Netzwerk bist du unterwegs?",
      },
    ],
  },
  faq: [
    {
      frage: "Wird die Zusammenarbeit bezahlt?",
      antwort: "Das besprechen wir mit jedem Creator einzeln. Bezahlte Beiträge kennzeichnest du als Werbung.",
    },
    {
      frage: "Muss ich Macher OS selbst nutzen?",
      antwort: "Ja. Wir wollen, dass du nur erzählst, was du selbst erlebt hast.",
    },
    {
      frage: "Wie viele Follower brauche ich?",
      antwort: "Es gibt keine Mindestzahl. Uns ist wichtiger, dass deine Community aus dem Handwerk kommt.",
    },
  ],
  weiter: {
    links: [
      { label: "Empfehlungsprogramm", href: "/empfehlen", text: "Macher OS im Kollegenkreis weitersagen." },
      { label: "Über Macher OS", href: "/ueber-uns", text: `Ein Joint Venture von ${herausgeber.name}.` },
      { label: "Partner", href: "/partner", text: "Für Verbände, Händler und Berater." },
    ],
  },
};

export const partnerbetriebe: Landing = {
  pfad: "/partnerbetriebe",
  meta: {
    title: "Partnerbetriebe – Handwerksbetriebe, die mit Macher OS vorangehen",
    description:
      "Werde Partnerbetrieb von Macher OS: Zeig anderen Betrieben, wie du arbeitest, rede bei neuen Funktionen mit und tausch dich mit anderen Machern aus.",
  },
  breadcrumbs: [{ label: "Partnerbetriebe" }],
  hero: {
    eyebrow: "Partnerbetriebe",
    title: "Betriebe, die vorangehen.",
    intro:
      "Partnerbetriebe nutzen Macher OS im Alltag und zeigen anderen, wie es läuft. Dafür reden sie früh mit, wenn neue Funktionen entstehen – und haben einen direkten Draht zu uns.",
    bild: "alltag/werkstatt",
    aktionen: { primaer: { label: "Partnerbetrieb werden", href: "#anfrage" }, sekundaer: { label: "Kunden ansehen", href: "/kunden" } },
  },
  vorteile: {
    eyebrow: "Was Partnerbetriebe tun",
    titel: "Zeigen, wie's geht.",
    karten: [
      { titel: "Erfahrungen teilen", text: "Bei Anfragen von Betrieben aus deinem Gewerk oder deiner Region kurz erzählen, wie du arbeitest.", icon: "chat" },
      { titel: "Mitreden", text: "Neue Funktionen als Erste ausprobieren und sagen, was fehlt.", icon: "spark" },
      { titel: "Sichtbar werden", text: "Wenn du willst: als Beispiel auf unserer Website, mit deinem Betrieb und deiner Geschichte.", icon: "award" },
    ],
  },
  ablauf: {
    titel: "So wirst du Partnerbetrieb.",
    schritte: [
      { titel: "Macher OS nutzen", text: "Du arbeitest im Alltag mit Macher OS." },
      { titel: "Anfrage schicken", text: "Schreib uns kurz, wer ihr seid und was ihr macht." },
      { titel: "Gespräch", text: "Wir lernen uns kennen und besprechen, was für beide Seiten passt." },
    ],
  },
  anfrage: {
    titel: "Partnerbetrieb werden",
    intro: "Wie eine Partnerschaft aussieht, besprechen wir mit jedem Betrieb einzeln.",
    frage: "Wie groß ist dein Betrieb?",
    betreff: "Partnerbetrieb",
    email: PARTNER_EMAIL,
    anliegen: [
      {
        id: "klein",
        label: "1 bis 10 Leute",
        beschreibung: "Solo oder kleines Team.",
        icon: "user",
        email: PARTNER_EMAIL,
        platzhalter: "Dein Betrieb, dein Gewerk und seit wann du mit Macher OS arbeitest.",
      },
      {
        id: "gross",
        label: "Mehr als 10 Leute",
        beschreibung: "Mehrere Teams oder Standorte.",
        icon: "users",
        email: PARTNER_EMAIL,
        platzhalter: "Dein Betrieb, dein Gewerk und seit wann du mit Macher OS arbeitest.",
      },
    ],
  },
  faq: [
    {
      frage: "Was bekomme ich als Partnerbetrieb?",
      antwort: "Einen direkten Draht zu unserem Team und frühen Zugang zu neuen Funktionen. Weitere Vorteile besprechen wir persönlich.",
    },
    {
      frage: "Muss ich öffentlich auftreten?",
      antwort: "Nein. Ob du auf unserer Website erscheinst, entscheidest du.",
    },
    {
      frage: "Wie viel Zeit kostet das?",
      antwort: "So viel, wie du geben willst. Meist sind es ein paar kurze Gespräche im Jahr.",
    },
  ],
  weiter: {
    links: [
      { label: "Kunden", href: "/kunden", text: "Wie Betriebe mit Macher OS arbeiten (Beispiele)." },
      { label: "Empfehlungsprogramm", href: "/empfehlen", text: "Macher OS weitersagen." },
      { label: "Partner", href: "/partner", text: "Für Verbände, Händler und Berater." },
    ],
  },
};
