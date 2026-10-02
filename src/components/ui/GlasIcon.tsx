import { useId, type ReactNode } from "react";

/**
 * Glas-Icons für die Mega-Menüs der Website (48 × 48).
 * Hinten eine deckende Form mit Verlauf von Logogrün zu Aktionsgrün. Davor eine Milchglasform: oben links fast weiß,
 * nach unten rechts grün getönt, mit feiner heller Kante – die hintere Form leuchtet weich verschwommen hindurch.
 * Details in Aktionsgrün auf dem Glas, weiß auf der hinteren Form. Nur Grün aus den Tokens, keine weiteren Farben.
 * Rein dekorativ (`aria-hidden`): die Beschriftung daneben trägt die Bedeutung.
 * Neue Glas-Icons hier ergänzen, nicht in Seiten inline zeichnen. Für Bedienelemente bleibt `Icon` (Strich-Icons).
 */
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
    linien: "M12 29h6l2.5 4h7l2.5-4h6",
  },
  // Blatt mit Stift
  angebot: {
    hinten: <rect x="30" y="3" width="9" height="30" rx="4.5" transform="rotate(30 34.5 18)" />,
    vorne: <rect x="7" y="7" width="27" height="35" rx="6" />,
    linien: "M14 17h13M14 24h13M14 31h8",
  },
  // Blatt mit Haken
  auftrag: {
    hinten: <rect x="19" y="5" width="24" height="31" rx="6" />,
    vorne: <rect x="5" y="11" width="28" height="32" rx="6" />,
    linien: "M11.5 24.5l3.5 3.5 7-7M12 35h14",
  },
  // Rechnung mit Münze
  rechnung: {
    hinten: <circle cx="34" cy="14" r="9.5" />,
    vorne: <rect x="5" y="13" width="32" height="28" rx="7" />,
    linien: "M25.5 21.6a6.5 6.5 0 1 0 0 10.8M14 25.5h8M14 28.5h8",
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
    vorne: (
      <path d="M18 4C10.8 4 5.5 9.4 5.5 16.2c0 8 8.6 15.8 11 18.2a2.1 2.1 0 0 0 3 0c2.4-2.4 11-10.2 11-18.2C30.5 9.4 25.2 4 18 4Z" />
    ),
    flaechen: <circle cx="18" cy="16" r="4.5" />,
  },
  // Kisten
  material: {
    hinten: <rect x="21" y="5" width="21" height="19" rx="5" />,
    vorne: <rect x="5" y="15" width="31" height="27" rx="6" />,
    linien: "M9 23.5h23M16 31h9",
  },
  // Transporter
  fahrzeug: {
    hinten: (
      <>
        <circle cx="14" cy="36" r="6" />
        <circle cx="34" cy="36" r="6" />
      </>
    ),
    vorne: (
      <path d="M4 17a6 6 0 0 1 6-6h21.5a5 5 0 0 1 4.2 2.3l5.6 8.7a5 5 0 0 1 .7 2.6V30a5 5 0 0 1-5 5H10a6 6 0 0 1-6-6Z" />
    ),
    flaechen: (
      <path d="M30.2 15.5h2.6a1 1 0 0 1 .8.5l3 4.5a.6.6 0 0 1-.5 1h-5.9a.6.6 0 0 1-.6-.6v-4.8a.6.6 0 0 1 .6-.6Z" />
    ),
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
    linien: "M21 19v8.5l5.5 3.2",
  },
  // Lagerhalle mit Kiste
  lager: {
    hinten: <rect x="26" y="24" width="18" height="17" rx="4" />,
    vorne: (
      <path d="M4 21.2a3 3 0 0 1 1.3-2.5l11.9-8.3a5 5 0 0 1 5.6 0l11.9 8.3a3 3 0 0 1 1.3 2.5V38a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Z" />
    ),
    linien: "M14 29.5h12M14 34.5h12",
  },
  // Balken mit Kreis
  auswertung: {
    hinten: <circle cx="34" cy="14" r="10" />,
    vorne: <rect x="5" y="13" width="31" height="29" rx="7" />,
    linien: "M13 35v-6M20.5 35V22M28 35v-9",
  },
  // Artikelseiten
  blog: {
    hinten: <rect x="19" y="4" width="24" height="29" rx="6" />,
    vorne: <rect x="5" y="10" width="30" height="33" rx="6" />,
    linien: "M24 17.5h5M24 22.5h5M12 31h17M12 36.5h11",
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
    vorne: (
      <path d="M21.8 7.5a5 5 0 0 1 4.4 0l16.5 8.2a1.9 1.9 0 0 1 0 3.4l-16.5 8.2a5 5 0 0 1-4.4 0L5.3 19.1a1.9 1.9 0 0 1 0-3.4Z" />
    ),
  },
  // Checkliste auf Stapel
  vorlagen: {
    hinten: <rect x="17" y="4" width="26" height="30" rx="6" />,
    vorne: <rect x="5" y="10" width="29" height="33" rx="6" />,
    linien: "M11 20l2.5 2.5 4.5-4.5M22 20.5h6M11 32l2.5 2.5 4.5-4.5M22 32.5h6",
  },
  // Euro-Münze mit Uhr
  stundensatz: {
    hinten: <circle cx="33" cy="14" r="11" />,
    vorne: <circle cx="19" cy="28" r="15" />,
    linien: "M23.6 22.6a6.5 6.5 0 1 0 0 10.8M12.5 26.5h8M12.5 29.5h8",
    linienHinten: "M33 8.5V14l3.5 2",
  },
  // Preisschild
  preis: {
    hinten: <rect x="22" y="9" width="20" height="26" rx="5" transform="rotate(15 32 22)" />,
    vorne: (
      <path d="M8 17.5a4 4 0 0 1 1.2-2.8l7-7a4 4 0 0 1 5.6 0l7 7a4 4 0 0 1 1.2 2.8V39a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4Z" />
    ),
    linien: "M15.5 34l7-9",
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
    linien: "M11.5 15.5l4 4M15.5 15.5l-4 4M25 15v5M22.5 17.5h5M11 30.5h5M22.5 29h5M22.5 32h5",
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
    vorne: (
      <path d="M5 16a4 4 0 0 1 4-4h8.3a4 4 0 0 1 2.9 1.2l2.6 2.8H39a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4Z" />
    ),
    linien: "M24 23v10M19.5 28.5l4.5 4.5 4.5-4.5",
  },
  // Fragezeichen
  hilfe: {
    hinten: <rect x="24" y="5" width="20" height="16" rx="6" />,
    vorne: <circle cx="20" cy="26" r="16" />,
    linien: "M15.5 22a4.5 4.5 0 1 1 6.6 4c-1.2.7-2.1 1.6-2.1 3v.5",
    flaechen: <circle cx="20" cy="34" r="1.9" />,
  },
  // Sprechblasen
  kontakt: {
    hinten: <rect x="17" y="5" width="27" height="20" rx="8" />,
    vorne: (
      <path d="M12 15h16a8 8 0 0 1 8 8v6a8 8 0 0 1-8 8H16l-6.3 4.7A1.1 1.1 0 0 1 8 40.8v-4.6A8 8 0 0 1 4 29.3V23a8 8 0 0 1 8-8Z" />
    ),
    flaechen: (
      <>
        <circle cx="13" cy="26" r="2.1" />
        <circle cx="20" cy="26" r="2.1" />
        <circle cx="27" cy="26" r="2.1" />
      </>
    ),
  },
} satisfies Record<string, GlasForm>;

export type GlasIconName = keyof typeof formen;

const strich = { fill: "none", strokeWidth: 2.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function GlasIcon({ name, className = "size-8" }: { name: GlasIconName; className?: string }) {
  const id = useId().replace(/[^\w-]/g, "");
  const { hinten, vorne, linien, flaechen, linienHinten }: GlasForm = formen[name];
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={className}>
      <defs>
        <clipPath id={`${id}-glas`}>{vorne}</clipPath>
        <filter id={`${id}-weich`} filterUnits="userSpaceOnUse" x="0" y="0" width="48" height="48">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        {/* Hintere Form: kräftiger Verlauf je Form */}
        <linearGradient id={`${id}-tief`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: "var(--color-logo)" }} />
          <stop offset="1" style={{ stopColor: "var(--color-primary)" }} />
        </linearGradient>
        {/* Milchglas: oben links hellgrün fast deckend, unten rechts kräftiger getönt und durchscheinend */}
        <linearGradient id={`${id}-milch`} gradientUnits="userSpaceOnUse" x1="6" y1="6" x2="42" y2="42">
          <stop offset="0" style={{ stopColor: "var(--color-signal-soft)", stopOpacity: 0.92 }} />
          <stop offset="1" style={{ stopColor: "var(--color-logo)", stopOpacity: 0.5 }} />
        </linearGradient>
      </defs>
      <g fill={`url(#${id}-tief)`}>{hinten}</g>
      {linienHinten && <path d={linienHinten} className="stroke-white" {...strich} />}
      <g clipPath={`url(#${id}-glas)`}>
        <g fill={`url(#${id}-tief)`} filter={`url(#${id}-weich)`}>
          {hinten}
        </g>
        <rect width="48" height="48" fill={`url(#${id}-milch)`} />
        {/* feine helle Kante: nur die innere Hälfte des Strichs bleibt im Glas sichtbar */}
        <g fill="none" className="stroke-white" strokeWidth={1.2} strokeOpacity={0.8}>
          {vorne}
        </g>
      </g>
      <g className="fill-primary">
        {linien && <path d={linien} className="stroke-primary" {...strich} />}
        {flaechen}
      </g>
    </svg>
  );
}
