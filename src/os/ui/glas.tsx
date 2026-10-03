/**
 * Glas-Icons: die Themen-Icons von Handwerk OS – gemeinsam für Website und Software (48 × 48).
 *
 * Hinten eine deckende Form mit Verlauf (hell → dunkel), davor eine Milchglasform: oben links fast deckend hell,
 * nach unten rechts getönt und durchscheinend, mit feiner heller Kante. Die hintere Form leuchtet weich verschwommen
 * hindurch. Details stehen dunkel auf dem Glas, weiß auf der hinteren Form.
 *
 * Einsatz: Themen ab ca. 32 px – Kacheln, Karten, Leerzustände, Menüeinträge. Für Bedienelemente (Pfeile, Schließen,
 * Menü, Haken im Button) und alles Kleinere bleiben die Strich-Icons. Rein dekorativ (`aria-hidden`): Text daneben
 * trägt die Bedeutung.
 *
 * Farben kommen nur aus CSS-Variablen, die jede Oberfläche aus ihren Tokens setzt:
 * `--glas-hell`, `--glas-dunkel`, `--glas-milch`, `--glas-licht`
 * (Website: `src/app/globals.css`, Software: `src/os/ui/tokens.css`). Neue Motive hier ergänzen, nicht inline zeichnen.
 */
import { useId, type ReactNode } from 'react';
import { Icon } from './icons';

type GlasForm = {
  /** Deckende Form hinten */
  hinten: ReactNode;
  /** Glasform vorne – nur der Umriss, er dient als Clip-Pfad */
  vorne: ReactNode;
  /** Striche auf dem Glas (Pfaddaten) */
  linien?: string;
  /** Flächen auf dem Glas */
  flaechen?: ReactNode;
  /** Weiße Striche auf der hinteren Form (Pfaddaten) */
  linienHinten?: string;
};

const formen = {
  // Ablage mit Brief
  anfragen: {
    hinten: <rect x="14" y="5" width="22" height="22" rx="4" transform="rotate(8 25 16)" />,
    vorne: <path d="M5 25a4 4 0 0 1 4-4h30a4 4 0 0 1 4 4v12a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5Z" />,
    linien: 'M12 29h6l2.5 4h7l2.5-4h6',
  },
  // Blatt mit Stift
  dokument: {
    hinten: <rect x="30" y="3" width="9" height="30" rx="4.5" transform="rotate(30 34.5 18)" />,
    vorne: <rect x="7" y="7" width="27" height="35" rx="6" />,
    linien: 'M14 17h13M14 24h13M14 31h8',
  },
  // Blatt mit Haken
  auftrag: {
    hinten: <rect x="19" y="5" width="24" height="31" rx="6" />,
    vorne: <rect x="5" y="11" width="28" height="32" rx="6" />,
    linien: 'M11.5 24.5l3.5 3.5 7-7M12 35h14',
  },
  // Rechnung mit Münze
  rechnung: {
    hinten: <circle cx="34" cy="14" r="9.5" />,
    vorne: <rect x="5" y="13" width="32" height="28" rx="7" />,
    linien: 'M25.5 21.6a6.5 6.5 0 1 0 0 10.8M14 25.5h8M14 28.5h8',
  },
  // Kalenderblatt
  kalender: {
    hinten: (
      <>
        <rect x="13" y="4" width="5" height="11" rx="2.5" />
        <rect x="30" y="4" width="5" height="11" rx="2.5" />
      </>
    ),
    vorne: <rect x="7" y="9" width="34" height="32" rx="8" />,
    flaechen: (
      <text x="24" y="34.5" textAnchor="middle" fontSize="16" fontWeight="700">
        31
      </text>
    ),
  },
  // Ortsmarke auf Karte
  einsatz: {
    hinten: <rect x="19" y="17" width="25" height="25" rx="7" />,
    vorne: <path d="M18 4C10.8 4 5.5 9.4 5.5 16.2c0 8 8.6 15.8 11 18.2a2.1 2.1 0 0 0 3 0c2.4-2.4 11-10.2 11-18.2C30.5 9.4 25.2 4 18 4Z" />,
    flaechen: <circle cx="18" cy="16" r="4.5" />,
  },
  // Kisten
  material: {
    hinten: <rect x="21" y="5" width="21" height="19" rx="5" />,
    vorne: <rect x="5" y="15" width="31" height="27" rx="6" />,
    linien: 'M9 23.5h23M16 31h9',
  },
  // Transporter
  fahrzeug: {
    hinten: (
      <>
        <circle cx="14" cy="36" r="6" />
        <circle cx="34" cy="36" r="6" />
      </>
    ),
    vorne: <path d="M4 17a6 6 0 0 1 6-6h21.5a5 5 0 0 1 4.2 2.3l5.6 8.7a5 5 0 0 1 .7 2.6V30a5 5 0 0 1-5 5H10a6 6 0 0 1-6-6Z" />,
    flaechen: <path d="M30.2 15.5h2.6a1 1 0 0 1 .8.5l3 4.5a.6.6 0 0 1-.5 1h-5.9a.6.6 0 0 1-.6-.6v-4.8a.6.6 0 0 1 .6-.6Z" />,
  },
  // Zwei Personen
  mitarbeiter: {
    hinten: (
      <>
        <circle cx="33" cy="13" r="6.5" />
        <path d="M23.5 33.5c0-6.2 4.2-10.5 9.5-10.5s9.5 4.3 9.5 10.5a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2Z" />
      </>
    ),
    vorne: (
      <>
        <circle cx="18" cy="17" r="8" />
        <path d="M5 39.5C5 31.8 10.8 27 18 27s13 4.8 13 12.5a2.5 2.5 0 0 1-2.5 2.5h-21A2.5 2.5 0 0 1 5 39.5Z" />
      </>
    ),
  },
  // Uhr
  zeit: {
    hinten: <circle cx="32" cy="16" r="11" />,
    vorne: <circle cx="21" cy="27" r="16" />,
    linien: 'M21 19v8.5l5.5 3.2',
  },
  // Lagerhalle mit Kiste
  lager: {
    hinten: <rect x="26" y="24" width="18" height="17" rx="4" />,
    vorne: <path d="M4 21.2a3 3 0 0 1 1.3-2.5l11.9-8.3a5 5 0 0 1 5.6 0l11.9 8.3a3 3 0 0 1 1.3 2.5V38a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Z" />,
    linien: 'M14 29.5h12M14 34.5h12',
  },
  // Balken mit Kreis
  auswertung: {
    hinten: <circle cx="34" cy="14" r="10" />,
    vorne: <rect x="5" y="13" width="31" height="29" rx="7" />,
    linien: 'M13 35v-6M20.5 35V22M28 35v-9',
  },
  // Artikelseiten
  blog: {
    hinten: <rect x="19" y="4" width="24" height="29" rx="6" />,
    vorne: <rect x="5" y="10" width="30" height="33" rx="6" />,
    linien: 'M24 17.5h5M24 22.5h5M12 31h17M12 36.5h11',
    flaechen: <rect x="11" y="16" width="9" height="8" rx="2" />,
  },
  // Bildschirm mit Wiedergabe
  webinar: {
    hinten: <circle cx="36" cy="12" r="8" />,
    vorne: (
      <>
        <rect x="4" y="11" width="34" height="24" rx="6" />
        <rect x="15" y="37" width="12" height="5" rx="2.5" />
      </>
    ),
    flaechen: <path d="M18 18.4a1.2 1.2 0 0 1 1.8-1l7.4 4.4a1.2 1.2 0 0 1 0 2.1l-7.4 4.4a1.2 1.2 0 0 1-1.8-1Z" />,
  },
  // Doktorhut
  akademie: {
    hinten: (
      <>
        <path d="M11 21h26v9.5c0 4-5.8 7.5-13 7.5s-13-3.5-13-7.5Z" />
        <rect x="38.5" y="17" width="3" height="13" rx="1.5" />
        <circle cx="40" cy="31.5" r="2.8" />
      </>
    ),
    vorne: <path d="M21.8 7.5a5 5 0 0 1 4.4 0l16.5 8.2a1.9 1.9 0 0 1 0 3.4l-16.5 8.2a5 5 0 0 1-4.4 0L5.3 19.1a1.9 1.9 0 0 1 0-3.4Z" />,
  },
  // Checkliste auf Stapel
  vorlagen: {
    hinten: <rect x="17" y="4" width="26" height="30" rx="6" />,
    vorne: <rect x="5" y="10" width="29" height="33" rx="6" />,
    linien: 'M11 20l2.5 2.5 4.5-4.5M22 20.5h6M11 32l2.5 2.5 4.5-4.5M22 32.5h6',
  },
  // Euro-Münze mit Uhr
  stundensatz: {
    hinten: <circle cx="33" cy="14" r="11" />,
    vorne: <circle cx="19" cy="28" r="15" />,
    linien: 'M23.6 22.6a6.5 6.5 0 1 0 0 10.8M12.5 26.5h8M12.5 29.5h8',
    linienHinten: 'M33 8.5V14l3.5 2',
  },
  // Preisschild
  preis: {
    hinten: <rect x="22" y="9" width="20" height="26" rx="5" transform="rotate(15 32 22)" />,
    vorne: <path d="M8 17.5a4 4 0 0 1 1.2-2.8l7-7a4 4 0 0 1 5.6 0l7 7a4 4 0 0 1 1.2 2.8V39a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4Z" />,
    linien: 'M15.5 34l7-9',
    flaechen: (
      <>
        <circle cx="19" cy="15" r="2.5" />
        <circle cx="15.5" cy="26" r="2" />
        <circle cx="22.5" cy="32.5" r="2" />
      </>
    ),
  },
  // Rechner
  rechner: {
    hinten: <rect x="23" y="13" width="20" height="22" rx="6" />,
    vorne: <rect x="5" y="9" width="30" height="30" rx="8" />,
    linien: 'M11.5 15.5l4 4M15.5 15.5l-4 4M25 15v5M22.5 17.5h5M11 30.5h5M22.5 29h5M22.5 32h5',
  },
  // Blitz
  start: {
    hinten: <circle cx="34" cy="14" r="10" />,
    vorne: (
      <path d="M26.6 4.9a1 1 0 0 1 1.8.7L26.5 19.5h10.3a1.2 1.2 0 0 1 .9 2L21.4 43.1a1 1 0 0 1-1.8-.7l1.9-13.9H11.2a1.2 1.2 0 0 1-.9-2Z" />
    ),
  },
  // Ordner mit Pfeil
  import: {
    hinten: <rect x="17" y="4" width="22" height="22" rx="4" />,
    vorne: <path d="M5 16a4 4 0 0 1 4-4h8.3a4 4 0 0 1 2.9 1.2l2.6 2.8H39a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4Z" />,
    linien: 'M24 23v10M19.5 28.5l4.5 4.5 4.5-4.5',
  },
  // Fragezeichen
  hilfe: {
    hinten: <rect x="24" y="5" width="20" height="16" rx="6" />,
    vorne: <circle cx="20" cy="26" r="16" />,
    linien: 'M15.5 22a4.5 4.5 0 1 1 6.6 4c-1.2.7-2.1 1.6-2.1 3v.5',
    flaechen: <circle cx="20" cy="34" r="1.9" />,
  },
  // Sprechblasen
  kontakt: {
    hinten: <rect x="17" y="5" width="27" height="20" rx="8" />,
    vorne: <path d="M12 15h16a8 8 0 0 1 8 8v6a8 8 0 0 1-8 8H16l-6.3 4.7A1.1 1.1 0 0 1 8 40.8v-4.6A8 8 0 0 1 4 29.3V23a8 8 0 0 1 8-8Z" />,
    flaechen: (
      <>
        <circle cx="13" cy="26" r="2.1" />
        <circle cx="20" cy="26" r="2.1" />
        <circle cx="27" cy="26" r="2.1" />
      </>
    ),
  },
  // Hörer
  telefon: {
    hinten: <circle cx="35" cy="13" r="9" />,
    vorne: (
      <path d="M10.5 8h5.2a2 2 0 0 1 1.9 1.3l3 7.9a2 2 0 0 1-.8 2.4l-3.6 2.3a21 21 0 0 0 10 10l2.3-3.6a2 2 0 0 1 2.4-.8l7.9 3a2 2 0 0 1 1.3 1.9v5.2a4.5 4.5 0 0 1-4.9 4.5C18.9 40.7 7.3 29.1 6 13a4.5 4.5 0 0 1 4.5-5Z" />
    ),
    linienHinten: 'M32.5 9.5a5 5 0 0 1 6 6',
  },
  // Person
  person: {
    hinten: <circle cx="30" cy="19" r="14" />,
    vorne: (
      <>
        <circle cx="20" cy="16" r="8" />
        <path d="M6 39.5C6 31.5 12.3 26 20 26s14 5.5 14 13.5a2.5 2.5 0 0 1-2.5 2.5h-23A2.5 2.5 0 0 1 6 39.5Z" />
      </>
    ),
  },
  // Lineal (Aufmaß)
  lineal: {
    hinten: <rect x="25" y="5" width="18" height="18" rx="5" />,
    vorne: <rect x="2" y="17.5" width="44" height="13" rx="3.5" transform="rotate(-45 24 24)" />,
    linien: 'M8.8 30L12.7 33.9M13 25.8L15.5 28.2M17.3 21.5L21.2 25.4M21.5 17.3L24 19.8M25.8 13L29.7 16.9M30 8.8L32.5 11.3',
  },
  // Kamera
  kamera: {
    hinten: <circle cx="36" cy="13" r="8" />,
    vorne: (
      <path d="M4 21a7 7 0 0 1 7-7h2.5l2.2-3.3a3 3 0 0 1 2.5-1.3h7.6a3 3 0 0 1 2.5 1.3l2.2 3.3H33a7 7 0 0 1 7 7v14a7 7 0 0 1-7 7H11a7 7 0 0 1-7-7Z" />
    ),
    linien: 'M28.5 28a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z',
  },
  // Stift auf Blatt
  stift: {
    hinten: <rect x="5" y="5" width="25" height="31" rx="6" />,
    vorne: <path d="M22 3h4a4 4 0 0 1 4 4v26l-6 10-6-10V7a4 4 0 0 1 4-4Z" transform="rotate(40 28 26)" />,
    linienHinten: 'M10.5 12.5h11M10.5 18.5h7',
  },
  // Weg auf Karte
  route: {
    hinten: <path d="M35 3c-5 0-8.5 3.8-8.5 8.3 0 5.6 6.4 11 7.6 12.3a1.2 1.2 0 0 0 1.8 0c1.2-1.3 7.6-6.7 7.6-12.3C43.5 6.8 40 3 35 3Z" />,
    vorne: <rect x="4" y="12" width="32" height="31" rx="7" />,
    linien: 'M11 35c3-5 7-5 10-7.5s4.5-6.5 8.5-7.5',
    flaechen: <circle cx="11" cy="35" r="2.6" />,
    linienHinten: 'M35 11.3h.01',
  },
  // Einkaufswagen
  einkauf: {
    hinten: (
      <>
        <rect x="19" y="4" width="15" height="14" rx="3" />
        <circle cx="17" cy="39" r="4" />
        <circle cx="34" cy="39" r="4" />
        <rect x="3" y="8" width="9" height="4" rx="2" />
      </>
    ),
    vorne: <path d="M9 13h31.5a2 2 0 0 1 1.9 2.5l-3.1 12.6a4 4 0 0 1-3.9 3H15.2a4 4 0 0 1-3.9-3.2Z" />,
    linien: 'M20 18.5v7M26.5 18.5v7M33 18.5v7',
  },
  // Werkzeugkoffer
  werkzeug: {
    hinten: <path d="M16.5 18v-6a4 4 0 0 1 4-4h7a4 4 0 0 1 4 4v6h-4.5v-5.5h-6V18Z" />,
    vorne: <rect x="4" y="16" width="40" height="26" rx="6" />,
    linien: 'M8 26h9M31 26h9',
    flaechen: <rect x="19" y="22.5" width="10" height="7" rx="2" />,
  },
  // Funken (Lotte, KI)
  macher: {
    hinten: (
      <>
        <path d="M34 3c.9 6.2 4 9.4 10 10.3-6 .9-9.1 4-10 10.2-.9-6.2-4-9.3-10-10.2 6-.9 9.1-4.1 10-10.3Z" />
        <circle cx="38" cy="38" r="4" />
      </>
    ),
    vorne: <path d="M20 8c1.3 9.4 5.6 13.7 15 15-9.4 1.3-13.7 5.6-15 15-1.3-9.4-5.6-13.7-15-15 9.4-1.3 13.7-5.6 15-15Z" />,
  },
  // Mikrofon
  mikro: {
    hinten: (
      <>
        <path d="M8.5 20a1.5 1.5 0 0 1 3 0 11.5 11.5 0 0 0 23 0 1.5 1.5 0 0 1 3 0 14.5 14.5 0 0 1-29 0Z" />
        <rect x="21.5" y="33" width="3" height="8" rx="1.5" />
        <rect x="15" y="40" width="16" height="4" rx="2" />
      </>
    ),
    vorne: <rect x="15" y="4" width="16" height="26" rx="8" />,
    linien: 'M19.5 12h7M19.5 17h7',
  },
  // Haus
  haus: {
    hinten: <circle cx="37" cy="12" r="7" />,
    vorne: <path d="M6 22.5a3 3 0 0 1 1.1-2.3l14.4-12a4 4 0 0 1 5 0l14.4 12a3 3 0 0 1 1.1 2.3V39a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4Z" />,
    flaechen: <rect x="20" y="29" width="8" height="11" rx="2" />,
  },
  // Schutzschild
  schild: {
    hinten: <path d="M20 4 34 9.3v10.4c0 9.2-6 16.3-14 20.3C12 36 6 28.9 6 19.7V9.3Z" transform="translate(8 3)" />,
    vorne: <path d="M20 4 34 9.3v10.4c0 9.2-6 16.3-14 20.3C12 36 6 28.9 6 19.7V9.3Z" />,
    linien: 'M14.5 21.5l4 4 7.5-8',
  },
  // Glocke
  glocke: {
    hinten: (
      <>
        <circle cx="24" cy="38" r="5" />
        <circle cx="37" cy="10" r="6" />
      </>
    ),
    vorne: <path d="M24 6a11 11 0 0 1 11 11v8.5l3.4 5A2 2 0 0 1 36.7 34H11.3a2 2 0 0 1-1.7-3.5l3.4-5V17A11 11 0 0 1 24 6Z" />,
  },
  // Handy
  handy: {
    hinten: <rect x="24" y="9" width="20" height="20" rx="6" />,
    vorne: <rect x="9" y="4" width="22" height="40" rx="6" />,
    linien: 'M17 9.5h6M17 38.5h6',
  },
  // Bildschirm mit Tablet
  bildschirm: {
    hinten: <rect x="30" y="16" width="15" height="24" rx="4" />,
    vorne: (
      <>
        <rect x="3" y="8" width="35" height="26" rx="6" />
        <rect x="14" y="37" width="13" height="5" rx="2.5" />
      </>
    ),
    linien: 'M10 16h12M10 21.5h8',
  },
  // Lupe
  suche: {
    hinten: <rect x="29" y="25" width="7" height="19" rx="3.5" transform="rotate(-45 32.5 34.5)" />,
    vorne: <circle cx="20" cy="20" r="14" />,
    linien: 'M13 18.5a7.5 7.5 0 0 1 6-6',
  },
  // Ebenen
  ebenen: {
    hinten: (
      <path
        d="M21.8 5.6a5 5 0 0 1 4.4 0l15.3 7.6a1.9 1.9 0 0 1 0 3.4l-15.3 7.6a5 5 0 0 1-4.4 0L6.5 16.6a1.9 1.9 0 0 1 0-3.4Z"
        transform="translate(0 15)"
      />
    ),
    vorne: <path d="M21.8 5.6a5 5 0 0 1 4.4 0l15.3 7.6a1.9 1.9 0 0 1 0 3.4l-15.3 7.6a5 5 0 0 1-4.4 0L6.5 16.6a1.9 1.9 0 0 1 0-3.4Z" />,
  },
  // Herz
  herz: {
    hinten: <circle cx="36" cy="12" r="8" />,
    vorne: <path d="M22 42C12 36 4 29.5 4 20.5A9.5 9.5 0 0 1 22 16a9.5 9.5 0 0 1 18 4.5C40 29.5 32 36 22 42Z" />,
  },
  // Unterschrift
  unterschrift: {
    hinten: <rect x="31" y="2" width="8" height="28" rx="4" transform="rotate(35 35 16)" />,
    vorne: <rect x="4" y="12" width="34" height="30" rx="6" />,
    linien: 'M10 30c3-1 4-8 6-8s-1 8 2 8 3-4.5 5-4.5 1 3.5 3 3.5 2.5-1 2.5-1M10 36h22',
  },
  // Kettenglieder
  link: {
    hinten: (
      <path
        d="M25 16h12a8 8 0 0 1 8 8v0a8 8 0 0 1 -8 8h-12a8 8 0 0 1 -8 -8v-0a8 8 0 0 1 8 -8ZM25 22h12a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-0a2 2 0 0 1 2 -2Z"
        fillRule="evenodd"
        transform="rotate(-45 31 24)"
      />
    ),
    vorne: (
      <path
        d="M11 16h12a8 8 0 0 1 8 8v0a8 8 0 0 1 -8 8h-12a8 8 0 0 1 -8 -8v-0a8 8 0 0 1 8 -8ZM11 22h12a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-0a2 2 0 0 1 2 -2Z"
        clipRule="evenodd"
        fillRule="evenodd"
        transform="rotate(-45 17 24)"
      />
    ),
  },
  // Haken
  erledigt: {
    hinten: <rect x="26" y="5" width="18" height="18" rx="6" />,
    vorne: <circle cx="21" cy="26" r="16" />,
    linien: 'M13.5 26.5l5 5 9.5-10',
  },
  // Warndreieck
  achtung: {
    hinten: <circle cx="37" cy="12" r="8" />,
    vorne: <path d="M21.4 7.5a3 3 0 0 1 5.2 0l15.6 27a3 3 0 0 1-2.6 4.5H8.4a3 3 0 0 1-2.6-4.5Z" />,
    linien: 'M24 18v8',
    flaechen: <circle cx="24" cy="32" r="1.9" />,
  },
  // Medaille
  auszeichnung: {
    hinten: (
      <>
        <rect x="14" y="26" width="8" height="18" rx="2" transform="rotate(20 18 35)" />
        <rect x="26" y="26" width="8" height="18" rx="2" transform="rotate(-20 30 35)" />
      </>
    ),
    vorne: <circle cx="24" cy="19" r="14" />,
    flaechen: <path d="M24 12 25.9 16.8 31.1 17.2 27.1 20.5 28.4 25.6 24 22.8 19.6 25.6 20.9 20.5 16.9 17.2 22.1 16.8Z" />,
  },
  // Bücher
  buch: {
    hinten: <rect x="22" y="7" width="18" height="34" rx="4" transform="rotate(12 31 24)" />,
    vorne: <rect x="7" y="5" width="26" height="38" rx="5" />,
    linien: 'M13 5v38M18 14h9M18 19.5h6',
  },
  // Sonne mit Wolke (Heute)
  sonne: {
    hinten: <circle cx="32" cy="15" r="10" />,
    vorne: <path d="M13 41a8 8 0 0 1-.9-16A11 11 0 0 1 33.5 23a9 9 0 0 1 1.5 18Z" />,
  },
  // Plus
  neu: {
    hinten: <rect x="18" y="5" width="25" height="25" rx="7" />,
    vorne: <rect x="5" y="12" width="30" height="30" rx="9" />,
    linien: 'M20 20v14M13 27h14',
  },
  // Info
  info: {
    hinten: <rect x="26" y="5" width="18" height="14" rx="5" />,
    vorne: <circle cx="21" cy="27" r="16" />,
    linien: 'M21 25v9',
    flaechen: <circle cx="21" cy="19.5" r="2.1" />,
  },
  // Brief
  mail: {
    hinten: <rect x="11" y="5" width="22" height="22" rx="3" />,
    vorne: <rect x="4" y="15" width="36" height="27" rx="6" />,
    linien: 'M10 21l12 8.5L34 21',
  },
  // Notizzettel
  notiz: {
    hinten: <rect x="15" y="4" width="29" height="29" rx="5" />,
    vorne: <path d="M5 14a4 4 0 0 1 4-4h22a4 4 0 0 1 4 4v18L26 42H9a4 4 0 0 1-4-4Z" />,
    linien: 'M11 19h17M11 25h17M11 31h9',
  },
  // Ordner
  ordner: {
    hinten: <rect x="14" y="4" width="23" height="20" rx="3" transform="rotate(-6 25 14)" />,
    vorne: <path d="M5 16a4 4 0 0 1 4-4h8.3a4 4 0 0 1 2.9 1.2l2.6 2.8H39a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4Z" />,
    flaechen: <rect x="16" y="28" width="16" height="5" rx="2.5" />,
  },
  // Stern
  stern: {
    hinten: <circle cx="34" cy="14" r="9" />,
    vorne: <path d="M21 10 25.4 20.9 37.2 21.7 28.1 29.3 31 40.8 21 34.5 11 40.8 13.9 29.3 4.8 21.7 16.6 20.9Z" />,
  },
  // Zahnräder
  einstellungen: {
    hinten: (
      <path d="M41.7 10.1 44.4 10.6 44.4 13.4 41.7 13.9 40.5 16 41.4 18.5 39 20 37.2 17.9 34.8 17.9 33 20 30.6 18.5 31.5 16 30.3 13.9 27.6 13.4 27.6 10.6 30.3 10.1 31.5 8 30.6 5.5 33 4 34.8 6.1 37.2 6.1 39 4 41.4 5.5 40.5 8Z" />
    ),
    vorne: (
      <path d="M33.6 24 37.9 24.9 37.9 29.1 33.6 30 32.1 33.8 34.4 37.4 31.4 40.4 27.8 38.1 24 39.6 23.1 43.9 18.9 43.9 18 39.6 14.2 38.1 10.6 40.4 7.6 37.4 9.9 33.8 8.4 30 4.1 29.1 4.1 24.9 8.4 24 9.9 20.2 7.6 16.6 10.6 13.6 14.2 15.9 18 14.4 18.9 10.1 23.1 10.1 24 14.4 27.8 15.9 31.4 13.6 34.4 16.6 32.1 20.2Z" />
    ),
    linien: 'M26.5 27a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0Z',
  },
  // Mülleimer
  muell: {
    hinten: (
      <>
        <rect x="6" y="9" width="36" height="5" rx="2.5" />
        <rect x="18" y="4" width="12" height="7" rx="2.5" />
      </>
    ),
    vorne: <path d="M10 15h28l-2.2 23.2A4 4 0 0 1 31.8 42H16.2a4 4 0 0 1-4-3.8Z" />,
    linien: 'M19 22v13M24 22v13M29 22v13',
  },
  // Liste
  liste: {
    hinten: <rect x="16" y="4" width="28" height="28" rx="6" />,
    vorne: <rect x="5" y="10" width="32" height="33" rx="6" />,
    linien: 'M17.5 18.5h13M17.5 26h13M17.5 33.5h9',
    flaechen: (
      <>
        <circle cx="12" cy="18.5" r="1.9" />
        <circle cx="12" cy="26" r="1.9" />
        <circle cx="12" cy="33.5" r="1.9" />
      </>
    ),
  },
  // Trichter
  filter: {
    hinten: <circle cx="37" cy="34" r="7" />,
    vorne: (
      <path d="M6 9.5A2.5 2.5 0 0 1 8.5 7h29a2.5 2.5 0 0 1 1.9 4.1L28 24.5V36a2 2 0 0 1-1.1 1.8l-6 3A2 2 0 0 1 18 39V24.5L6.6 11.1A2.5 2.5 0 0 1 6 9.5Z" />
    ),
  },
  // Kreis mit Pfeil
  wiederholen: {
    hinten: <path d="M5.7 17.3A19.5 19.5 0 0 1 40.9 14.2L44.4 12.2L40.8 21.6L33.1 18.7L36.6 16.7A14.5 14.5 0 0 0 10.4 19Z" />,
    vorne: <circle cx="22" cy="27" r="13" />,
  },
  // Schloss
  schloss: {
    hinten: <path d="M13.5 22v-6a10.5 10.5 0 0 1 21 0v6h-5v-6a5.5 5.5 0 0 0-11 0v6Z" />,
    vorne: <rect x="7" y="20" width="34" height="23" rx="6" />,
    linien: 'M24 31v4.5',
    flaechen: <circle cx="24" cy="30" r="2.8" />,
  },
  // Stecker
  stecker: {
    hinten: (
      <>
        <rect x="16" y="3" width="4" height="15" rx="2" />
        <rect x="28" y="3" width="4" height="15" rx="2" />
        <rect x="22" y="33" width="4" height="12" rx="2" />
      </>
    ),
    vorne: <path d="M12 15h24v8a12 12 0 0 1-24 0Z" />,
    linien: 'M20 23h8',
  },
} satisfies Record<string, GlasForm>;

export type GlasIconName = keyof typeof formen;

const strich = { fill: 'none', strokeWidth: 2.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export function GlasIcon({ name, size = 40, className }: { name: GlasIconName; size?: number; className?: string }) {
  const id = useId().replace(/[^\w-]/g, '');
  const { hinten, vorne, linien, flaechen, linienHinten }: GlasForm = formen[name];
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" focusable="false" data-glas="" className={className}>
      <defs>
        <clipPath id={`${id}-glas`}>{vorne}</clipPath>
        <filter id={`${id}-weich`} filterUnits="userSpaceOnUse" x="0" y="0" width="48" height="48">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        {/* Hintere Form: kräftiger Verlauf je Form */}
        <linearGradient id={`${id}-tief`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--glas-hell)' }} />
          <stop offset="1" style={{ stopColor: 'var(--glas-dunkel)' }} />
        </linearGradient>
        {/* Milchglas: oben links hell fast deckend, unten rechts kräftiger getönt und durchscheinend */}
        <linearGradient id={`${id}-milch`} gradientUnits="userSpaceOnUse" x1="6" y1="6" x2="42" y2="42">
          <stop offset="0" style={{ stopColor: 'var(--glas-milch)', stopOpacity: 0.92 }} />
          <stop offset="1" style={{ stopColor: 'var(--glas-hell)', stopOpacity: 0.5 }} />
        </linearGradient>
      </defs>
      <g fill={`url(#${id}-tief)`}>{hinten}</g>
      {linienHinten && <path d={linienHinten} style={{ stroke: 'var(--glas-licht)' }} {...strich} />}
      <g clipPath={`url(#${id}-glas)`}>
        <g fill={`url(#${id}-tief)`} filter={`url(#${id}-weich)`}>
          {hinten}
        </g>
        <rect width="48" height="48" fill={`url(#${id}-milch)`} />
        {/* feine helle Kante: nur die innere Hälfte des Strichs bleibt im Glas sichtbar */}
        <g fill="none" strokeWidth={1.2} strokeOpacity={0.8} style={{ stroke: 'var(--glas-licht)' }}>
          {vorne}
        </g>
      </g>
      <g style={{ fill: 'var(--glas-dunkel)' }}>
        {linien && <path d={linien} style={{ stroke: 'var(--glas-dunkel)' }} {...strich} />}
        {flaechen}
      </g>
    </svg>
  );
}

/** Strich-Icon der Software (`icons.tsx`) → Glas-Icon. Bedien-Icons (Pfeile, x, mehr …) fehlen bewusst. */
export const glasFuer: Partial<Record<string, GlasIconName>> = {
  heute: 'sonne',
  auftraege: 'auftrag',
  plan: 'kalender',
  kalender: 'kalender',
  betrieb: 'haus',
  plus: 'neu',
  suche: 'suche',
  macher: 'macher',
  start: 'start',
  glocke: 'glocke',
  check: 'erledigt',
  achtung: 'achtung',
  info: 'info',
  telefon: 'telefon',
  mail: 'mail',
  ort: 'einsatz',
  kamera: 'kamera',
  mikro: 'mikro',
  uhr: 'zeit',
  paket: 'material',
  notiz: 'notiz',
  person: 'person',
  team: 'mitarbeiter',
  euro: 'rechnung',
  werkzeug: 'werkzeug',
  auto: 'fahrzeug',
  dokument: 'dokument',
  ordner: 'ordner',
  unterschrift: 'unterschrift',
  stern: 'stern',
  schild: 'schild',
  einstellungen: 'einstellungen',
  stift: 'stift',
  muell: 'muell',
  liste: 'liste',
  chat: 'kontakt',
  download: 'import',
  upload: 'import',
  link: 'link',
  filter: 'filter',
  lager: 'lager',
  route: 'route',
  wissen: 'buch',
  diagramm: 'auswertung',
  wiederholen: 'wiederholen',
  schloss: 'schloss',
  stecker: 'stecker',
};

/**
 * Themen-Icon in der Software: Glas-Icon, wenn es eins gibt – sonst das Strich-Icon (dann bleibt die Kachel des
 * umgebenden Elements sichtbar). Die Kachel-Klassen blenden ihre Fläche aus, sobald ein Glas-Icon darin steht.
 */
export function ThemenIcon({ name, size = 40, strichGroesse = 20 }: { name: string; size?: number; strichGroesse?: number }) {
  const glas = glasFuer[name];
  return glas ? <GlasIcon name={glas} size={size} /> : <Icon name={name} size={strichGroesse} />;
}
