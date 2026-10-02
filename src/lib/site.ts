import type { GlasIconName } from "@/os/ui/glas";

export const site = {
  name: "Macher OS",
  claim: "Dein Betrieb. Einfach im Griff.",
  description:
    "Macher OS ist das Betriebssystem für Handwerksbetriebe von Mission Mittelstand: Aufträge, Mitarbeiter, Planung und Büroarbeit in einer einfachen Software – für Büro und Baustelle.",
  url: "https://macher-os.de",
};

/**
 * Herausgeber: Macher OS ist ein Joint-Venture-Projekt von Mission Mittelstand.
 *
 * Bilder liegen unter `public/` und erscheinen automatisch, sobald die Datei
 * existiert (siehe `Foto`). Nur freigegebene Originalbilder von Mission
 * Mittelstand verwenden – keine Stockfotos, keine nachbearbeiteten Personen.
 */
export const herausgeber = {
  name: "Mission Mittelstand",
  url: "https://www.mission-mittelstand.de",
  kurz: "Ein Joint Venture von Mission Mittelstand",
  beschreibung: "Beratung für Handwerk und Mittelstand",
  logo: {
    hell: "/bilder/mission-mittelstand/logo-hell.webp",
    /** Weiße Fassung des Original-Logos (Schwarz → Weiß, Grün bleibt) für dunkle Flächen */
    dunkel: "/bilder/mission-mittelstand/logo-dunkel.webp",
  },
  /** Echtes Foto von Team, Bühne oder Veranstaltung (Querformat, ca. 3:2). */
  teamFoto: "/bilder/mission-mittelstand/team.webp",
  person: {
    name: "Matthias Aumann",
    rolle: "Gründer von Mission Mittelstand",
    /** Freigestelltes Porträt (Hochformat, ca. 4:5, transparenter oder heller Hintergrund). */
    foto: "/bilder/mission-mittelstand/matthias-aumann.webp",
  },
};

/** Die Software selbst – gleiche Domain, Pfad `/os` (Code in `src/os/`). Ohne Login: Daten bleiben im Browser. */
export const app = {
  url: "/os",
  /** Einrichtung, optional mit vorausgewähltem Gewerk der Software (`elektro`, `shk`, …) */
  einrichten: (gewerk?: string) => `/os/willkommen${gewerk ? `?gewerk=${encodeURIComponent(gewerk)}` : ""}`,
};

/** „Kostenlos testen“ führt direkt in die Einrichtung von Macher OS – ohne Konto, ohne Login. */
export const cta = {
  primary: { label: "Kostenlos testen", href: app.einrichten() },
  secondary: { label: "Demo ansehen", href: "/demo" },
  /** Wer schon eingerichtet hat, kommt direkt zu „Heute“ (ohne Einrichtung leitet die App zur Einrichtung) */
  login: { label: "App öffnen", href: `${app.url}/heute` },
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
/** Eintrag im Mega-Menü: jeder Punkt trägt ein Glas-Icon (`GlasIcon`) vor dem Text. */
export type MegaLink = NavLink & { icon: GlasIconName };
/** Gruppe im Mega-Menü: höchstens vier Hauptlinks, Titel in normaler Schreibweise. */
/** Gruppe im Mega-Menü: höchstens vier Hauptlinks, Titel in normaler Schreibweise (ohne Icon – die Einträge tragen es). */
export type MegaGruppe = { titel: string; links: MegaLink[] };
/** Eine einzige, vollständig klickbare Vorschau rechts im Menü – nur mit echtem Bild einer vorhandenen Seite. */
export type MegaVorschau = {
  href: string;
  bild: { src: string; alt: string; breite: number; hoehe: number };
  titel: string;
  text: string;
  aktion: string;
};
/** Gewerk als Bildzeile: kleines echtes Foto + ausgeschriebener Name. */
export type MegaGewerk = NavLink & { bild: string };
export type Mega =
  | { art: "funktionen" | "wissen"; gruppen: MegaGruppe[]; vorschau?: MegaVorschau; abschluss: NavLink[] }
  | { art: "gewerke"; gewerke: MegaGewerk[]; abschluss: NavLink[] };
export type NavItem = { label: string; href: string; mega?: Mega };

const f = (slug: string) => `/funktionen/${slug}`;
const g = (slug: string) => `/gewerke/${slug}`;

/**
 * Hauptnavigation der Website. Das Menü erklärt das Produkt und erleichtert die Auswahl – es ist keine Sitemap.
 * Jeder Link führt auf eine bestehende Seite, deren Inhalt die Beschriftung abdeckt. Was hier fehlt, bleibt über
 * „Alle Funktionen“, „Alle Gewerke“ und „Wissen“ erreichbar (siehe `docs/design/festlegungen.md`, Website-Navigation).
 */
export const mainNav: NavItem[] = [
  {
    label: "Funktionen",
    href: "/funktionen",
    mega: {
      art: "funktionen",
      gruppen: [
        {
          titel: "Aufträge",
          links: [
            { label: "Anfragen", href: f("anfragen"), icon: "anfragen" },
            { label: "Angebote schreiben", href: f("angebote"), icon: "dokument" },
            { label: "Aufträge bearbeiten", href: f("auftraege"), icon: "auftrag" },
            { label: "Rechnungen schreiben", href: f("rechnungen"), icon: "rechnung" },
          ],
        },
        {
          titel: "Planen",
          links: [
            { label: "Kalender & Termine", href: f("kalender"), icon: "kalender" },
            { label: "Einsätze & Mitarbeiter", href: f("einsatzplanung"), icon: "einsatz" },
            { label: "Material planen", href: f("material"), icon: "material" },
            { label: "Fahrzeuge planen", href: f("fahrzeuge"), icon: "fahrzeug" },
          ],
        },
        {
          titel: "Betrieb",
          links: [
            { label: "Mitarbeiter", href: f("mitarbeiter"), icon: "mitarbeiter" },
            { label: "Arbeitszeiten", href: f("zeiterfassung"), icon: "zeit" },
            { label: "Material & Lager", href: f("lager"), icon: "lager" },
            { label: "Kosten & Auswertung", href: f("auswertung"), icon: "auswertung" },
          ],
        },
      ],
      vorschau: {
        href: "/demo",
        bild: {
          src: "/bilder/vorschau/einsatz.webp",
          alt: "Ausschnitt aus Macher OS: ein Einsatz mit Uhrzeit, Kunde, Aufgabe und Adresse (Beispieldaten)",
          breite: 720,
          hoehe: 450,
        },
        titel: "Ein Einsatz. Alles dabei.",
        text: "Kunde, Termin und Aufgabe an einem Ort.",
        aktion: "Beispiel ansehen",
      },
      abschluss: [
        { label: "Alle Funktionen ansehen", href: "/funktionen" },
        { label: "So arbeitet Macher automatisch", href: f("automatisch-erledigen") },
      ],
    },
  },
  {
    label: "Gewerke",
    href: "/gewerke",
    mega: {
      art: "gewerke",
      gewerke: [
        { label: "Elektriker", href: g("elektriker"), bild: "/bilder/gewerke/elektriker.jpg" },
        { label: "Sanitär, Heizung & Klima", href: g("shk"), bild: "/bilder/gewerke/shk.jpg" },
        { label: "Maler & Lackierer", href: g("maler"), bild: "/bilder/gewerke/maler.jpg" },
        { label: "Fliesenleger", href: g("fliesenleger"), bild: "/bilder/gewerke/fliesenleger.jpg" },
        { label: "Tischler & Schreiner", href: g("tischler"), bild: "/bilder/gewerke/tischler.jpg" },
        { label: "Dachdecker", href: g("dachdecker"), bild: "/bilder/gewerke/dachdecker.jpg" },
        { label: "Maurer & Bau", href: g("bau"), bild: "/bilder/gewerke/bau.jpg" },
        { label: "Garten- & Landschaftsbau", href: g("galabau"), bild: "/bilder/gewerke/galabau.jpg" },
      ],
      abschluss: [
        { label: "Alle Gewerke ansehen", href: "/gewerke" },
        { label: "Dein Gewerk fehlt? Weitere Gewerke", href: g("weitere-gewerke") },
      ],
    },
  },
  {
    label: "Wissen",
    href: "/wissen",
    mega: {
      art: "wissen",
      gruppen: [
        {
          titel: "Praxistipps",
          links: [
            { label: "Blog", href: "/wissen/blog", icon: "blog" },
            { label: "Webinare", href: "/wissen/webinare", icon: "webinar" },
            { label: "Macher Akademie", href: "/wissen/akademie", icon: "akademie" },
            { label: "Video-Anleitungen", href: "/wissen/videos", icon: "bildschirm" },
          ],
        },
        {
          titel: "Vorlagen & Rechner",
          links: [
            { label: "Vorlagen & Checklisten", href: "/wissen/vorlagen", icon: "vorlagen" },
            { label: "Stundensatz berechnen", href: "/werkzeuge/stundensatz-rechner", icon: "stundensatz" },
            { label: "Angebot berechnen", href: "/werkzeuge/angebots-rechner", icon: "preis" },
            { label: "Alle Rechner", href: "/werkzeuge", icon: "rechner" },
          ],
        },
        {
          titel: "Hilfe beim Start",
          links: [
            { label: "Schnellstart", href: "/hilfe/schnellstart", icon: "start" },
            { label: "Daten übernehmen", href: "/hilfe/daten-uebernehmen", icon: "import" },
            { label: "Hilfe-Center", href: "/hilfe-center", icon: "hilfe" },
            { label: "Kontakt & Support", href: "/hilfe/kontakt", icon: "kontakt" },
          ],
        },
      ],
      vorschau: {
        href: "/wissen/vorlagen/checkliste-baustellenabnahme",
        bild: {
          src: "/bilder/vorschau/vorlage-baustellenabnahme.webp",
          alt: "Vorschau der Vorlage „Checkliste Baustellenabnahme“",
          breite: 720,
          hoehe: 450,
        },
        titel: "Checkliste Baustellenabnahme",
        text: "Vorlage zum Drucken oder als PDF speichern.",
        aktion: "Vorlage ansehen",
      },
      abschluss: [{ label: "Alles aus Wissen ansehen", href: "/wissen" }],
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
      { label: "Was ist neu?", href: "/neu" },
      { label: "Kostenlos testen", href: app.einrichten() },
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
    titel: "Vergleich & Wechsel",
    links: [
      { label: "Software-Vergleich", href: "/vergleich" },
      { label: "Macher OS vs. Word & Excel", href: "/vergleich/word-excel" },
      { label: "Macher OS vs. HERO", href: "/vergleich/hero" },
      { label: "Macher OS vs. ToolTime", href: "/vergleich/tooltime" },
      { label: "Macher OS vs. klassische Software", href: "/vergleich/klassische-handwerkersoftware" },
      { label: "Wechseln zu Macher OS", href: "/wechseln" },
      { label: "Wechselbonus", href: "/wechselbonus" },
    ],
  },
  {
    titel: "Für dich",
    links: [
      { label: "Für Neugründer", href: "/fuer/neugruender" },
      { label: "Für Meisterschüler", href: "/fuer/meisterschueler" },
      { label: "Für Meisterschulen", href: "/fuer/meisterschulen" },
      { label: "Handwerker-App", href: "/handwerker-app" },
      { label: "Bürosoftware fürs Handwerk", href: "/buerosoftware-handwerk" },
      { label: "Cloud-Handwerkersoftware", href: "/cloud-handwerkersoftware" },
      { label: "Schnittstellen", href: "/schnittstellen" },
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
      { label: "Mission Mittelstand", href: "/ueber-uns#mission-mittelstand" },
      { label: "Was ist neu?", href: "/neuigkeiten" },
      { label: "Kunden", href: "/kunden" },
      { label: "Partner & Kooperationen", href: "/partner" },
      { label: "Partnerbetriebe", href: "/partnerbetriebe" },
      { label: "Empfehlungsprogramm", href: "/empfehlen" },
      { label: "Creator & Botschafter", href: "/botschafter" },
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
  { label: "Bildnachweise", href: "/bildnachweise" },
  { label: "Cookie-Einstellungen", href: "/datenschutz#cookies" },
];
