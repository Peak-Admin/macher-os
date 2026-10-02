export const site = {
  name: "Macher OS",
  claim: "Dein Betrieb. Eine Software.",
  description:
    "Macher OS ist das Betriebssystem für Handwerksbetriebe: Aufträge, Mitarbeiter, Planung und Büroarbeit in einer einfachen Software – für Büro und Baustelle.",
  url: "https://macher-os.de",
};

export const cta = {
  primary: { label: "Kostenlos testen", href: "/signup" },
  secondary: { label: "Demo ansehen", href: "/demo" },
  login: { label: "Anmelden", href: "/login" },
};

/** Die Software selbst (aus `os/`, läuft im selben Projekt unter `/os`) */
export const app = {
  url: "/os",
  /** Einrichtung, optional mit vorausgewähltem Gewerk der Software (`elektro`, `shk`, …) */
  einrichten: (gewerk?: string) =>
    `/os/willkommen${gewerk ? `?gewerk=${encodeURIComponent(gewerk)}` : ""}`,
};

/** Gewerk-Slugs der Website → Gewerk der Software */
export const appGewerk: Record<string, string> = {
  elektriker: "elektro",
  "elektro-energie": "elektro",
  shk: "shk",
  "shk-gebaeudetechnik": "shk",
  maler: "maler",
  "maler-boden-oberflaechen": "maler",
  fliesenleger: "fliesen",
  tischler: "tischler",
  "holz-innenausbau": "tischler",
  dachdecker: "dach",
  "dach-gebaeudehuelle": "dach",
  bau: "bau",
  "bau-rohbau": "bau",
  galabau: "garten",
  "metall-maschinen": "metall",
};

export type NavLink = { label: string; href: string };
export type MegaColumn = {
  titel: string;
  beschreibung?: string;
  links: (NavLink & { beschreibung?: string })[];
  cta?: NavLink;
};
export type NavItem =
  | { label: string; href: string; mega?: undefined }
  | { label: string; href: string; mega: { columns: MegaColumn[]; footer?: NavLink[]; cta?: NavLink } };

const f = (slug: string) => `/funktionen/${slug}`;
const g = (slug: string) => `/gewerke/${slug}`;

export const mainNav: NavItem[] = [
  {
    label: "Funktionen",
    href: "/funktionen",
    mega: {
      columns: [
        {
          titel: "Aufträge",
          beschreibung: "Vom ersten Kundenkontakt bis zur bezahlten Rechnung.",
          links: [
            { label: "Anfragen", href: f("anfragen") },
            { label: "Telefon & Empfang", href: f("telefon") },
            { label: "Kunden", href: f("kunden") },
            { label: "Aufträge", href: f("auftraege") },
            { label: "Aufmaß", href: f("aufmass") },
            { label: "Kalkulation", href: f("kalkulation") },
            { label: "Angebote", href: f("angebote") },
            { label: "Fotos & Dokumentation", href: f("dokumentation") },
            { label: "Rechnungen & Zahlungen", href: f("rechnungen") },
          ],
        },
        {
          titel: "Planen",
          beschreibung: "Alles richtig einplanen, bevor es zum Problem wird.",
          links: [
            { label: "Kalender", href: f("kalender") },
            { label: "Terminbuchung", href: f("kalender") },
            { label: "Einsatzplanung", href: f("einsatzplanung") },
            { label: "Mitarbeiterplanung", href: f("einsatzplanung") },
            { label: "Material bereit?", href: f("material") },
            { label: "Werkzeug & Fahrzeug bereit?", href: f("fahrzeuge") },
            { label: "Automatische Planung", href: f("einsatzplanung") },
          ],
        },
        {
          titel: "Betrieb",
          beschreibung: "Alles, was der Betrieb dauerhaft braucht.",
          links: [
            { label: "Mitarbeiter", href: f("mitarbeiter") },
            { label: "Arbeitszeiten", href: f("zeiterfassung") },
            { label: "Qualifikationen", href: f("qualifikationen") },
            { label: "Schulungen", href: f("schulungen") },
            { label: "Material & Lager", href: f("lager") },
            { label: "Einkauf & Lieferanten", href: f("einkauf") },
            { label: "Werkzeuge", href: f("werkzeuge") },
            { label: "Fahrzeuge", href: f("fahrzeuge") },
            { label: "Kosten & Auswertungen", href: f("auswertung") },
          ],
        },
        {
          titel: "Macher erledigt",
          beschreibung: "Büroarbeit, die Macher OS möglichst automatisch übernimmt.",
          links: [
            { label: "Anrufe aufnehmen", href: f("telefon") },
            { label: "Anfragen erfassen", href: f("anfragen") },
            { label: "Termine abstimmen", href: f("kalender") },
            { label: "Angebote vorbereiten", href: f("angebote") },
            { label: "Aufträge einplanen", href: f("einsatzplanung") },
            { label: "Rechnungen vorbereiten", href: f("rechnungen") },
            { label: "Zahlungen verfolgen", href: f("zahlungen") },
          ],
          cta: { label: "Was Macher automatisch erledigt", href: f("automatisch-erledigen") },
        },
      ],
      cta: { label: "Alle Funktionen ansehen", href: "/funktionen" },
    },
  },
  {
    label: "Gewerke",
    href: "/gewerke",
    mega: {
      columns: [
        {
          titel: "Beliebte Gewerke",
          links: [
            { label: "Elektriker", href: g("elektriker") },
            { label: "SHK / Sanitär & Heizung", href: g("shk") },
            { label: "Maler & Lackierer", href: g("maler") },
            { label: "Fliesenleger", href: g("fliesenleger") },
            { label: "Tischler & Schreiner", href: g("tischler") },
            { label: "Dachdecker", href: g("dachdecker") },
            { label: "Maurer & Bau", href: g("bau") },
            { label: "Garten- & Landschaftsbau", href: g("galabau") },
          ],
        },
        {
          titel: "Weitere Bereiche",
          links: [
            { label: "Metall & Maschinen", href: g("metall-maschinen") },
            { label: "Fahrzeug & Werkstatt", href: g("fahrzeug-werkstatt") },
            { label: "Gebäude & Service", href: g("gebaeude-service") },
            { label: "Glas & Fenster", href: g("glas-fenster-sonnenschutz") },
            { label: "Lebensmittel", href: g("lebensmittelhandwerk") },
            { label: "Gesundheit", href: g("gesundheitshandwerk") },
            { label: "Gestaltung", href: g("textil-gestaltung-werbetechnik") },
            { label: "Weitere Gewerke", href: g("weitere-gewerke") },
          ],
        },
      ],
      cta: { label: "Alle Gewerke ansehen", href: "/gewerke" },
    },
  },
  {
    label: "Wissen",
    href: "/wissen",
    mega: {
      columns: [
        {
          titel: "Wissen",
          links: [
            { label: "Blog", href: "/wissen/blog", beschreibung: "Praxistipps, Neuigkeiten und Ideen fürs Handwerk." },
            { label: "Webinare", href: "/wissen/webinare", beschreibung: "Live-Sessions und Aufzeichnungen." },
            { label: "Vorlagen & Checklisten", href: "/wissen/vorlagen", beschreibung: "Direkt nutzbar im Betriebsalltag." },
            { label: "Macher Akademie", href: "/wissen/akademie", beschreibung: "Kurse für Unternehmer und Mitarbeiter." },
            { label: "Kundenwissen", href: "/kunden", beschreibung: "Arbeitsweisen aus anderen Betrieben." },
          ],
        },
        {
          titel: "Hilfe",
          links: [
            { label: "Schnellstart", href: "/hilfe/schnellstart", beschreibung: "In wenigen Minuten loslegen." },
            { label: "Hilfe-Center", href: "/hilfe-center", beschreibung: "Antworten und Anleitungen." },
            { label: "Kontakt & Support", href: "/hilfe/kontakt", beschreibung: "Persönliche Hilfe." },
            { label: "Daten übernehmen", href: "/hilfe/daten-uebernehmen", beschreibung: "Kunden, Mitarbeiter, Artikel übernehmen." },
            { label: "Macher OS einrichten", href: "/hilfe/schnellstart", beschreibung: "Gewerk, Leistungen, Rollen." },
          ],
        },
        {
          titel: "Werkzeuge",
          links: [
            { label: "Stundensatz-Rechner", href: "/werkzeuge/stundensatz-rechner" },
            { label: "Stundenverrechnungssatz-Rechner", href: "/werkzeuge/stundenverrechnungssatz-rechner" },
            { label: "Angebots-Rechner", href: "/werkzeuge/angebots-rechner" },
            { label: "Materialaufschlag-Rechner", href: "/werkzeuge/materialaufschlag-rechner" },
            { label: "Fahrtkosten-Rechner", href: "/werkzeuge/fahrtkosten-rechner" },
            { label: "Deckungsbeitrags-Rechner", href: "/werkzeuge/deckungsbeitrags-rechner" },
          ],
          cta: { label: "Alle Werkzeuge ansehen", href: "/werkzeuge" },
        },
      ],
      footer: [
        { label: "Demo ansehen", href: "/demo" },
        { label: "App herunterladen", href: "/app" },
        { label: "Kunden ansehen", href: "/kunden" },
        { label: "Hilfe-Center", href: "/hilfe-center" },
      ],
    },
  },
  { label: "Kunden", href: "/kunden" },
  { label: "Preise", href: "/preise" },
];

export const footerNav: { titel: string; links: NavLink[] }[] = [
  {
    titel: "Produkt",
    links: [
      { label: "Funktionen", href: "/funktionen" },
      { label: "Gewerke", href: "/gewerke" },
      { label: "Preise", href: "/preise" },
      { label: "Demo", href: "/demo" },
      { label: "App", href: "/app" },
      { label: "Kostenlos testen", href: "/signup" },
    ],
  },
  {
    titel: "Funktionen",
    links: [
      { label: "Aufträge", href: f("auftraege") },
      { label: "Planung", href: f("einsatzplanung") },
      { label: "Mitarbeiter", href: f("mitarbeiter") },
      { label: "Material", href: f("material") },
      { label: "Rechnungen", href: f("rechnungen") },
      { label: "Automatisch erledigen", href: f("automatisch-erledigen") },
    ],
  },
  {
    titel: "Gewerke",
    links: [
      { label: "Elektriker", href: g("elektriker") },
      { label: "SHK", href: g("shk") },
      { label: "Maler", href: g("maler") },
      { label: "Fliesenleger", href: g("fliesenleger") },
      { label: "Tischler", href: g("tischler") },
      { label: "Dachdecker", href: g("dachdecker") },
      { label: "Bau", href: g("bau") },
      { label: "GaLaBau", href: g("galabau") },
      { label: "Alle Gewerke", href: "/gewerke" },
    ],
  },
  {
    titel: "Wissen",
    links: [
      { label: "Blog", href: "/wissen/blog" },
      { label: "Webinare", href: "/wissen/webinare" },
      { label: "Macher Akademie", href: "/wissen/akademie" },
      { label: "Vorlagen & Checklisten", href: "/wissen/vorlagen" },
    ],
  },
  {
    titel: "Hilfe",
    links: [
      { label: "Schnellstart", href: "/hilfe/schnellstart" },
      { label: "Hilfe-Center", href: "/hilfe-center" },
      { label: "Daten übernehmen", href: "/hilfe/daten-uebernehmen" },
      { label: "Kontakt & Support", href: "/hilfe/kontakt" },
    ],
  },
  {
    titel: "Werkzeuge",
    links: [
      { label: "Stundensatz-Rechner", href: "/werkzeuge/stundensatz-rechner" },
      { label: "Angebots-Rechner", href: "/werkzeuge/angebots-rechner" },
      { label: "Materialaufschlag-Rechner", href: "/werkzeuge/materialaufschlag-rechner" },
      { label: "Weitere Werkzeuge", href: "/werkzeuge" },
    ],
  },
  {
    titel: "Unternehmen",
    links: [
      { label: "Über uns", href: "/ueber-uns" },
      { label: "Kunden", href: "/kunden" },
      { label: "Partner", href: "/partner" },
      { label: "Kontakt", href: "/kontakt" },
      { label: "Karriere", href: "/karriere" },
    ],
  },
];

export const legalNav: NavLink[] = [
  { label: "Impressum", href: "/impressum" },
  { label: "Datenschutz", href: "/datenschutz" },
  { label: "AGB", href: "/agb" },
  { label: "Auftragsverarbeitung", href: "/auftragsverarbeitung" },
  { label: "Cookie-Einstellungen", href: "/datenschutz#cookies" },
];
