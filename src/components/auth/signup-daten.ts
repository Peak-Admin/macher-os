import type { GewerkSlug } from "@/content/registry";

/** Vorschläge für „Welche Arbeiten bietet ihr an?“ – abhängig vom gewählten Gewerk. */
export const leistungenNachGewerk: Record<GewerkSlug, string[]> = {
  elektriker: ["Hausinstallation", "Zählerschrank & Verteilung", "E-Check / Prüfungen", "Wallbox", "Photovoltaik", "Smart Home", "Beleuchtung", "Störungsdienst"],
  shk: ["Heizung", "Bad & Sanitär", "Wärmepumpe", "Wartung", "Notdienst", "Lüftung & Klima", "Rohrreinigung", "Solarthermie"],
  maler: ["Innenanstrich", "Fassade", "Tapezieren", "Lackierarbeiten", "Bodenbeläge", "Wärmedämmung", "Spachteltechnik", "Schimmelsanierung"],
  fliesenleger: ["Bad komplett", "Bodenfliesen", "Wandfliesen", "Naturstein", "Abdichtung", "Großformat", "Balkon & Terrasse", "Reparaturen"],
  tischler: ["Möbel nach Maß", "Küchen", "Innenausbau", "Fenster", "Türen", "Treppen", "Montage", "Reparaturen"],
  dachdecker: ["Steildach", "Flachdach", "Dachfenster", "Dachrinnen & Klempnerei", "Dämmung", "Photovoltaik", "Sturmschäden", "Wartung"],
  bau: ["Rohbau", "Umbau & Sanierung", "Mauerarbeiten", "Betonarbeiten", "Putz & Estrich", "Abbruch", "Trockenbau", "Pflasterarbeiten"],
  galabau: ["Gartenanlage", "Pflaster & Wege", "Pflege", "Baumarbeiten", "Zäune", "Bewässerung", "Teichbau", "Winterdienst"],
  "elektro-energie": ["Installation", "Prüfungen", "Photovoltaik", "Speicher", "Wallbox", "Störungsdienst"],
  "shk-gebaeudetechnik": ["Heizung", "Sanitär", "Lüftung", "Klima", "Wartung", "Notdienst"],
  "maler-boden-oberflaechen": ["Anstrich", "Bodenbeläge", "Parkett", "Estrich", "Lackierarbeiten", "Sanierung"],
  "holz-innenausbau": ["Möbel", "Innenausbau", "Trockenbau", "Türen", "Treppen", "Montage"],
  "dach-gebaeudehuelle": ["Dach", "Fassade", "Klempnerei", "Abdichtung", "Dämmung", "Reparaturen"],
  "bau-rohbau": ["Rohbau", "Sanierung", "Beton", "Mauerwerk", "Abbruch", "Erdarbeiten"],
  "metall-maschinen": ["Metallbau", "Schweißarbeiten", "Geländer & Treppen", "Tore", "Maschinenbau", "Reparaturen"],
  "fahrzeug-werkstatt": ["Inspektion", "Reparatur", "Reifenservice", "HU-Vorbereitung", "Karosserie", "Diagnose"],
  "garten-aussenanlagen": ["Gartenbau", "Pflege", "Pflaster", "Zäune", "Baumarbeiten", "Winterdienst"],
  "gebaeude-service": ["Reinigung", "Hausmeisterdienst", "Wartung", "Winterdienst", "Kleinreparaturen", "Objektbetreuung"],
  "glas-fenster-sonnenschutz": ["Fenster", "Verglasung", "Rollläden", "Markisen", "Insektenschutz", "Reparaturen"],
  "friseur-dienstleistungen": ["Termine im Salon", "Behandlungen", "Produktverkauf", "Hausbesuche", "Gutscheine", "Kurse"],
  lebensmittelhandwerk: ["Produktion", "Verkauf", "Catering", "Lieferung", "Vorbestellungen", "Filialen"],
  gesundheitshandwerk: ["Versorgung", "Anpassung", "Reparatur", "Beratung", "Hausbesuche", "Werkstatt"],
  "textil-gestaltung-werbetechnik": ["Beschriftung", "Druck", "Montage", "Gestaltung", "Fahrzeugfolierung", "Schilder"],
  "weitere-gewerke": ["Montage", "Reparatur", "Wartung", "Beratung", "Fertigung", "Kundendienst"],
};

export const arbeitsweisen = [
  { id: "kundendienst", label: "Kundendienst", text: "Viele kurze Einsätze bei Kunden" },
  { id: "baustellen", label: "Baustellen", text: "Projekte über Tage oder Wochen" },
  { id: "wartung", label: "Wartung", text: "Wiederkehrende Termine und Verträge" },
  { id: "werkstatt", label: "Werkstatt", text: "Arbeit im eigenen Betrieb" },
  { id: "fertigung", label: "Fertigung", text: "Herstellung nach Auftrag" },
  { id: "mischung", label: "Mischung", text: "Von allem etwas" },
] as const;

export const teamgroessen = [
  { id: "1", label: "Nur ich" },
  { id: "2-5", label: "2 bis 5" },
  { id: "6-10", label: "6 bis 10" },
  { id: "11-30", label: "11 bis 30" },
  { id: "31-50", label: "31 bis 50" },
  { id: "50+", label: "Mehr als 50" },
] as const;
