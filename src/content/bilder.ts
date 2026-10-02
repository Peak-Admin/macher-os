import type { GewerkClusterSlug, TopGewerkSlug } from "./registry";

/**
 * Bildnachweise für alle Fotos der Website.
 *
 * Regeln (Playbook Abschnitt 7): nur echte Arbeitssituationen, keine Stockfotos
 * als Ansprechpartner oder „Kunden“. Gewerke-Fotos nur mit Lizenz, die
 * kommerzielle Nutzung erlaubt (z. B. Pexels-, Unsplash-Lizenz, CC0).
 * Jedes Bild hier eintragen – daraus entsteht die Seite `/bildnachweise`.
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
    src: "/bilder/mission-mittelstand/logo-dunkel.webp",
    alt: "Logo Mission Mittelstand",
    fotograf: "Mission Mittelstand",
    quelle: "mission-mittelstand.de",
    quelleUrl: "https://www.mission-mittelstand.de",
    lizenz: "© Mission Mittelstand GmbH",
  },
];

/**
 * Ein Foto pro Gewerk (Querformat, mind. 1600 px breit), abgelegt unter
 * `public/bilder/gewerke/<slug>.webp`. Fehlt ein Eintrag, zeigt die Seite kein Foto.
 */
export const gewerkBilder: Partial<Record<TopGewerkSlug | GewerkClusterSlug, Bildnachweis>> = {};
