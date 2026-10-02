/**
 * Bildregister der Marketing-Website.
 *
 * Jedes Foto liegt unter `public/bilder/…` und wird nur über seinen Schlüssel
 * eingebunden (`<Foto bild="gewerk/elektriker" />`). Fehlt die Datei, zeigt
 * `Foto` eine gestaltete Markenfläche mit Icon – die Seite bleibt vollständig.
 *
 * Regeln für Fotos (Playbook Abschnitt 2/9, festlegungen.md):
 * - echte Arbeitssituationen im Handwerk, keine gestellten Büro-Stockfotos
 * - keine Stockfotos als Ansprechpartner oder als „Kunde“ ausgeben
 * - Querformat, mind. 2000 px breit, als .jpg (ca. 80 % Qualität)
 * - `motiv` beschreibt, was auf dem Foto zu sehen sein soll
 */
import type { IconName } from "@/components/ui/Icon";
import {
  gewerkCluster,
  kunden,
  topGewerke,
  type GewerkClusterSlug,
  type GewerkSlug,
  type KundeSlug,
  type TopGewerkSlug,
} from "./registry";

export type Bild = {
  /** Pfad unter `public/`. */
  src: string;
  alt: string;
  /** Was auf dem Foto zu sehen sein soll – Briefing für Fotograf oder Bildauswahl. */
  motiv: string;
  /** Icon für die Ersatzfläche, solange das Foto fehlt. */
  icon: IconName;
  /** CSS `object-position`, z. B. "center 30%". */
  position?: string;
};

const allgemein = {
  "start/hero": {
    src: "/bilder/start/hero.jpg",
    alt: "Handwerker auf der Baustelle schaut auf sein Handy",
    motiv: "Handwerker in Arbeitskleidung auf einer Baustelle, Handy in der Hand, Blick aufs Display. Platz für Text links.",
    icon: "smartphone",
    position: "70% center",
  },
  "alltag/anfrage": {
    src: "/bilder/alltag/anfrage.jpg",
    alt: "Meister telefoniert im Transporter mit einem Kunden",
    motiv: "Meister sitzt im Transporter oder in der Werkstatt und telefoniert, Notizblock daneben.",
    icon: "phone",
  },
  "alltag/planung": {
    src: "/bilder/alltag/planung.jpg",
    alt: "Team bespricht morgens die Einsätze am Transporter",
    motiv: "Morgendliche Besprechung: drei, vier Leute am offenen Transporter, einer zeigt auf Tablet oder Plan.",
    icon: "calendar",
  },
  "alltag/baustelle": {
    src: "/bilder/alltag/baustelle.jpg",
    alt: "Monteur dokumentiert die Arbeit mit dem Handy",
    motiv: "Monteur fotografiert eine fertige Installation mit dem Handy.",
    icon: "camera",
  },
  "alltag/abnahme": {
    src: "/bilder/alltag/abnahme.jpg",
    alt: "Kundin unterschreibt die Abnahme auf dem Tablet",
    motiv: "Übergabe beim Kunden: Kundin unterschreibt auf einem Tablet, Handwerker daneben.",
    icon: "signature",
  },
  "alltag/buero": {
    src: "/bilder/alltag/buero.jpg",
    alt: "Büro eines Handwerksbetriebs mit Laptop und Ordnern",
    motiv: "Kleines Büro im Betrieb, Laptop, ein paar Ordner, Blick in die Werkstatt.",
    icon: "monitor",
  },
  "alltag/werkstatt": {
    src: "/bilder/alltag/werkstatt.jpg",
    alt: "Aufgeräumte Werkstatt mit Werkzeugwand",
    motiv: "Werkstatt mit Werkzeugwand und Werkbank, warmes Licht.",
    icon: "wrench",
  },
  "alltag/handy": {
    src: "/bilder/alltag/handy.jpg",
    alt: "Hand im Arbeitshandschuh hält ein Handy",
    motiv: "Nahaufnahme: Hand im Arbeitshandschuh hält ein Handy, Baustelle unscharf im Hintergrund.",
    icon: "smartphone",
  },
  "alltag/team": {
    src: "/bilder/alltag/team.jpg",
    alt: "Handwerksteam vor dem Firmenwagen",
    motiv: "Kleines Team (4–6 Leute) vor Firmenwagen oder Halle, natürlich, nicht gestellt.",
    icon: "users",
  },
  "seite/funktionen": {
    src: "/bilder/seite/funktionen.jpg",
    alt: "Handwerker plant am Laptop die Woche",
    motiv: "Chef am Laptop in der Werkstatt, plant die Woche.",
    icon: "layers",
  },
  "seite/kunden": {
    src: "/bilder/seite/kunden.jpg",
    alt: "Handwerksbetrieb bei der Arbeit",
    motiv: "Betrieb bei der Arbeit, mehrere Leute, echte Baustelle.",
    icon: "users",
  },
  "seite/ueber-uns": {
    src: "/bilder/seite/ueber-uns.jpg",
    alt: "Gespräch zwischen Handwerker und Software-Team in der Werkstatt",
    motiv: "Gespräch in einer Werkstatt: Handwerker zeigt etwas auf dem Laptop.",
    icon: "chat",
  },
  "seite/karriere": {
    src: "/bilder/seite/karriere.jpg",
    alt: "Team arbeitet gemeinsam an einem Tisch",
    motiv: "Team am Tisch, Laptops, Skizzen, entspannte Stimmung.",
    icon: "users",
  },
  "seite/partner": {
    src: "/bilder/seite/partner.jpg",
    alt: "Handschlag zwischen zwei Handwerkern",
    motiv: "Handschlag auf der Baustelle oder in der Werkstatt.",
    icon: "link",
  },
  "seite/gewerke": {
    src: "/bilder/seite/gewerke.jpg",
    alt: "Verschiedene Handwerker auf einer gemeinsamen Baustelle",
    motiv: "Baustelle mit mehreren Gewerken gleichzeitig: Elektro, Trockenbau, Maler.",
    icon: "warehouse",
  },
  "seite/cta": {
    src: "/bilder/seite/cta.jpg",
    alt: "Handwerker schließt am Abend den Transporter",
    motiv: "Feierabend: Handwerker schließt den Transporter, Abendlicht.",
    icon: "truck",
    position: "center 40%",
  },
} satisfies Record<string, Bild>;

/** Motiv je Top-Gewerk: Hero, Alltag, Detail. */
const topMotive: Record<TopGewerkSlug, { hero: string; alltag: string; detail: string }> = {
  elektriker: {
    hero: "Elektriker verdrahtet einen Verteilerschrank",
    alltag: "Elektriker prüft eine Anlage mit dem Messgerät",
    detail: "Nahaufnahme: Hände klemmen Leitungen im Verteiler",
  },
  shk: {
    hero: "Anlagenmechaniker arbeitet an einer Heizungsanlage",
    alltag: "Installateur montiert ein Waschbecken im Bad",
    detail: "Nahaufnahme: Rohrverbindung mit Zange",
  },
  maler: {
    hero: "Maler streicht eine Wand mit der Rolle",
    alltag: "Malerteam klebt einen Raum ab",
    detail: "Nahaufnahme: Pinsel an einer Kante",
  },
  fliesenleger: {
    hero: "Fliesenleger verlegt große Bodenfliesen",
    alltag: "Fliesenleger verfugt eine Wand im Bad",
    detail: "Nahaufnahme: Fliese wird mit Kelle ausgerichtet",
  },
  tischler: {
    hero: "Tischler arbeitet an der Hobelbank in der Werkstatt",
    alltag: "Tischler montiert eine Einbauküche beim Kunden",
    detail: "Nahaufnahme: Holzverbindung und Werkzeug",
  },
  dachdecker: {
    hero: "Dachdecker deckt ein Steildach mit Ziegeln",
    alltag: "Dachdecker sichert sich auf dem Dach",
    detail: "Nahaufnahme: Ziegelreihe und Lattung",
  },
  bau: {
    hero: "Maurer setzt Steine auf der Rohbaustelle",
    alltag: "Bauteam bespricht den Plan auf der Baustelle",
    detail: "Nahaufnahme: Kelle und Mörtel",
  },
  galabau: {
    hero: "Landschaftsgärtner pflastert einen Weg",
    alltag: "GaLaBau-Team legt einen Garten an",
    detail: "Nahaufnahme: Pflastersteine und Gummihammer",
  },
};

/** Motiv je Gewerk-Cluster. */
const clusterMotive: Record<(typeof gewerkCluster)[number]["slug"], { motiv: string; icon: IconName }> = {
  "elektro-energie": { motiv: "Monteur installiert Solarmodule auf einem Dach", icon: "bolt" },
  "shk-gebaeudetechnik": { motiv: "Techniker an einer Wärmepumpe im Garten", icon: "wrench" },
  "maler-boden-oberflaechen": { motiv: "Bodenleger verlegt Parkett", icon: "pen" },
  "holz-innenausbau": { motiv: "Trockenbauer montiert Gipskartonplatten", icon: "ruler" },
  "dach-gebaeudehuelle": { motiv: "Zimmerer auf einem Dachstuhl", icon: "home" },
  "bau-rohbau": { motiv: "Betonbauer an der Schalung", icon: "warehouse" },
  "metall-maschinen": { motiv: "Metallbauer schweißt ein Geländer", icon: "wrench" },
  "fahrzeug-werkstatt": { motiv: "Kfz-Mechaniker unter einem Fahrzeug auf der Hebebühne", icon: "truck" },
  "garten-aussenanlagen": { motiv: "Gärtner schneidet eine Hecke", icon: "map" },
  "gebaeude-service": { motiv: "Gebäudereiniger reinigt eine Glasfassade", icon: "shield" },
  "glas-fenster-sonnenschutz": { motiv: "Glaser setzt eine Fensterscheibe ein", icon: "monitor" },
  "friseur-dienstleistungen": { motiv: "Friseurin schneidet Haare im Salon", icon: "user" },
  lebensmittelhandwerk: { motiv: "Bäcker formt Brote in der Backstube", icon: "heart" },
  gesundheitshandwerk: { motiv: "Orthopädietechniker in der Werkstatt", icon: "heart" },
  "textil-gestaltung-werbetechnik": { motiv: "Werbetechniker klebt Folie auf ein Fahrzeug", icon: "spark" },
  "weitere-gewerke": { motiv: "Werkbank mit verschiedenem Werkzeug", icon: "layers" },
};

const topIcons: Record<TopGewerkSlug, IconName> = {
  elektriker: "bolt",
  shk: "wrench",
  maler: "pen",
  fliesenleger: "layers",
  tischler: "ruler",
  dachdecker: "home",
  bau: "warehouse",
  galabau: "map",
};

type GewerkBildKey = `gewerk/${GewerkSlug}` | `gewerk/${TopGewerkSlug}-alltag` | `gewerk/${TopGewerkSlug}-detail`;

const gewerkBilder = Object.fromEntries([
  ...topGewerke.flatMap((g) => {
    const m = topMotive[g.slug];
    const icon = topIcons[g.slug];
    return [
      [`gewerk/${g.slug}`, { src: `/bilder/gewerke/${g.slug}.jpg`, alt: m.hero, motiv: m.hero, icon }],
      [`gewerk/${g.slug}-alltag`, { src: `/bilder/gewerke/${g.slug}-alltag.jpg`, alt: m.alltag, motiv: m.alltag, icon }],
      [`gewerk/${g.slug}-detail`, { src: `/bilder/gewerke/${g.slug}-detail.jpg`, alt: m.detail, motiv: m.detail, icon }],
    ] as const;
  }),
  ...gewerkCluster.map((c) => {
    const m = clusterMotive[c.slug];
    return [`gewerk/${c.slug}`, { src: `/bilder/gewerke/${c.slug}.jpg`, alt: m.motiv, motiv: m.motiv, icon: m.icon }] as const;
  }),
]) as Record<GewerkBildKey, Bild>;

export const bilder: Record<keyof typeof allgemein | GewerkBildKey, Bild> = { ...allgemein, ...gewerkBilder };

export type BildKey = keyof typeof bilder;

/** Gewerk-Foto zu einem Slug (Top-Gewerk oder Cluster). */
export function gewerkBild(slug: GewerkSlug): BildKey {
  return `gewerk/${slug}`;
}

/**
 * Kundenstories sind Beispiele – deshalb zeigen sie ein Symbolbild aus ihrem
 * Gewerk und nie ein Foto, das als echter Betrieb gelesen werden könnte.
 */
export function kundenBild(slug: KundeSlug): BildKey {
  const k = kunden.find((x) => x.slug === slug)!;
  return `gewerk/${k.gewerk}-alltag`;
}

/**
 * Bildnachweise für Fotos mit Fremdrechten. Gewerke-Fotos nur mit Lizenz, die
 * kommerzielle Nutzung erlaubt (z. B. Pexels-, Unsplash-Lizenz, CC0).
 * Jedes solche Bild hier eintragen – daraus entsteht die Seite `/bildnachweise`.
 */
export type Bildnachweis = {
  /** Pfad unter `public/` */
  src: string;
  alt: string;
  fotograf: string;
  quelle: string;
  quelleUrl?: string;
  lizenz: string;
  lizenzUrl?: string;
};

/** Fotos von Mission Mittelstand (Herausgeber von Macher OS). */
export const missionMittelstandBilder: Bildnachweis[] = [
  {
    src: "/bilder/mission-mittelstand/matthias-aumann.webp",
    alt: "Matthias Aumann",
    fotograf: "Mission Mittelstand",
    quelle: "mission-mittelstand.de",
    quelleUrl: "https://www.mission-mittelstand.de",
    lizenz: "© Mission Mittelstand GmbH",
  },
  {
    src: "/bilder/mission-mittelstand/team.webp",
    alt: "Besprechung im Team von Mission Mittelstand",
    fotograf: "Mission Mittelstand",
    quelle: "mission-mittelstand.de",
    quelleUrl: "https://www.mission-mittelstand.de",
    lizenz: "© Mission Mittelstand GmbH",
  },
  {
    src: "/bilder/mission-mittelstand/logo-hell.webp",
    alt: "Logo Mission Mittelstand",
    fotograf: "Mission Mittelstand",
    quelle: "mission-mittelstand.de",
    quelleUrl: "https://www.mission-mittelstand.de",
    lizenz: "© Mission Mittelstand GmbH",
  },
  {
    src: "/bilder/mission-mittelstand/logo-dunkel.webp",
    alt: "Logo Mission Mittelstand (weiß, für dunkle Flächen)",
    fotograf: "Mission Mittelstand",
    quelle: "mission-mittelstand.de",
    quelleUrl: "https://www.mission-mittelstand.de",
    lizenz: "© Mission Mittelstand GmbH",
  },
];

/**
 * Ein Foto pro Gewerk (Querformat, mind. 1600 px breit), abgelegt unter
 * `public/bilder/gewerke/…` (siehe Bildregister oben), mit Nachweis.
 */
export const gewerkBildnachweise: Partial<Record<TopGewerkSlug | GewerkClusterSlug, Bildnachweis>> = {
  elektriker: {
    src: "/bilder/gewerke/elektriker.jpg",
    alt: "Elektriker arbeitet an einem Verteilerschrank",
    fotograf: "ranjeet .",
    quelle: "Pexels",
    quelleUrl: "https://www.pexels.com/photo/a-man-is-working-on-an-electrical-panel-27928761/",
    lizenz: "Pexels-Lizenz",
    lizenzUrl: "https://www.pexels.com/license/",
  },
  shk: {
    src: "/bilder/gewerke/shk.jpg",
    alt: "Anlagenmechaniker arbeitet an einer Heizungsanlage",
    fotograf: "МОБО Модульные Котельные",
    quelle: "Pexels",
    quelleUrl: "https://www.pexels.com/photo/technician-repairing-heating-system-in-workshop-34938439/",
    lizenz: "Pexels-Lizenz",
    lizenzUrl: "https://www.pexels.com/license/",
  },
  maler: {
    src: "/bilder/gewerke/maler.jpg",
    alt: "Maler streicht eine Außenwand vom Gerüst aus",
    fotograf: "Ebubekir TOĞACI",
    quelle: "Pexels",
    quelleUrl: "https://www.pexels.com/photo/senior-man-painting-exterior-wall-on-scaffolding-31544574/",
    lizenz: "Pexels-Lizenz",
    lizenzUrl: "https://www.pexels.com/license/",
  },
  dachdecker: {
    src: "/bilder/gewerke/dachdecker.jpg",
    alt: "Dachdecker verlegt Bahnen auf einem Flachdach",
    fotograf: "Bulat843",
    quelle: "Pexels",
    quelleUrl: "https://www.pexels.com/photo/young-construction-worker-laying-roof-tiles-39238326/",
    lizenz: "Pexels-Lizenz",
    lizenzUrl: "https://www.pexels.com/license/",
  },
  tischler: {
    src: "/bilder/gewerke/tischler.jpg",
    alt: "Tischler arbeitet an einer Maschine in der Werkstatt",
    fotograf: "cottonbro studio",
    quelle: "Pexels",
    quelleUrl: "https://www.pexels.com/photo/carpenter-using-a-machine-in-a-factory-7480448/",
    lizenz: "Pexels-Lizenz",
    lizenzUrl: "https://www.pexels.com/license/",
  },
  fliesenleger: {
    src: "/bilder/gewerke/fliesenleger.jpg",
    alt: "Fliesenleger bringt Mörtel auf dem Boden auf",
    fotograf: "Sergei Starostin",
    quelle: "Pexels",
    quelleUrl: "https://www.pexels.com/photo/construction-worker-laying-tile-in-renovation-project-29181494/",
    lizenz: "Pexels-Lizenz",
    lizenzUrl: "https://www.pexels.com/license/",
  },
  galabau: {
    src: "/bilder/gewerke/galabau.jpg",
    alt: "Gärtner pflegt Pflanzen mit der Gartenschere",
    fotograf: "Anna Shvets",
    quelle: "Pexels",
    quelleUrl: "https://www.pexels.com/photo/side-view-of-a-man-gardening-5028005/",
    lizenz: "Pexels-Lizenz",
    lizenzUrl: "https://www.pexels.com/license/",
  },
  "metall-maschinen": {
    src: "/bilder/gewerke/metall-maschinen.jpg",
    alt: "Metallhandwerker bearbeitet eine Schale vor der Esse",
    fotograf: "Emrah Yazıcıoğlu",
    quelle: "Pexels",
    quelleUrl: "https://www.pexels.com/photo/a-man-in-blue-long-sleeves-engaged-in-metalcraft-12917473/",
    lizenz: "Pexels-Lizenz",
    lizenzUrl: "https://www.pexels.com/license/",
  },
  bau: {
    src: "/bilder/gewerke/bau.jpg",
    alt: "Trockenbauer mit Helm richtet eine Wandplatte aus",
    fotograf: "Antoni Shkraba",
    quelle: "Pexels",
    quelleUrl: "https://www.pexels.com/photo/a-man-fixing-the-wall-4981812/",
    lizenz: "Pexels-Lizenz",
    lizenzUrl: "https://www.pexels.com/license/",
  },
  "weitere-gewerke": {
    src: "/bilder/gewerke/weitere-gewerke.jpg",
    alt: "Handwerker schlägt einen Nagel in die Wand",
    fotograf: "Anete Lusina",
    quelle: "Pexels",
    quelleUrl: "https://www.pexels.com/photo/man-hammering-nail-into-wall-during-housework-4792525/",
    lizenz: "Pexels-Lizenz",
    lizenzUrl: "https://www.pexels.com/license/",
  },
};

/** Bilder des Markenauftakts (Preloader beim ersten Besuch, `src/components/auftakt/`). */
export const auftaktBilder: Bildnachweis[] = [
  {
    src: "/auftakt/wald.webp",
    alt: "Nebliger Nadelwald (Hintergrund des Markenauftakts)",
    fotograf: "Daniel Rauber",
    quelle: "Unsplash",
    quelleUrl: "https://unsplash.com/photos/forest-with-thick-fog-wOWEyyoFEyU",
    lizenz: "Unsplash License",
    lizenzUrl: "https://unsplash.com/license",
  },
  {
    src: "/auftakt/unterschrift.webp",
    alt: "Unterschrift von Matthias Aumann",
    fotograf: "Matthias Aumann",
    quelle: "matthias-aumann.de",
    quelleUrl: "https://www.matthias-aumann.de",
    lizenz: "© Matthias Aumann",
  },
  {
    src: "/auftakt/logo-mm-ma.webp",
    alt: "Logo Mission Mittelstand und Matthias Aumann",
    fotograf: "Mission Mittelstand",
    quelle: "mission-mittelstand.de",
    quelleUrl: "https://www.mission-mittelstand.de",
    lizenz: "© Mission Mittelstand GmbH",
  },
];
