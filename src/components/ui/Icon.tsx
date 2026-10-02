import { GlasIcon, type GlasIconName } from "@/os/ui/glas";

/**
 * Schlichtes Strich-Icon-Set (24×24, 1.75px). Bewusst klein gehalten –
 * neue Icons hier ergänzen, nicht in Seiten inline zeichnen.
 */
const paths = {
  "arrow-right": <path d="M5 12h14M13 6l6 6-6 6" />,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  "chevron-right": <path d="m9 6 6 6-6 6" />,
  "chevron-left": <path d="m15 6-6 6 6 6" />,
  "arrow-up-right": <path d="M7 17 17 7M8 7h9v9" />,
  frage: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7M12 17h.01" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  achtung: <path d="M12 4 2.5 20h19ZM12 10v4.5M12 17.5h.01" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  plus: <path d="M12 5v14M5 12h14" />,
  phone: (
    <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
  ),
  inbox: (
    <>
      <path d="M3 13h5l1.5 3h5L16 13h5" />
      <path d="M5.5 5h13L21 13v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Z" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6" />
    </>
  ),
  clipboard: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3" />
    </>
  ),
  ruler: (
    <>
      <path d="M3 17 17 3l4 4L7 21Z" />
      <path d="m7 13 2 2M10 10l2 2M13 7l2 2" />
    </>
  ),
  calculator: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15v3M8 18h.01M12 18h.01" />
    </>
  ),
  file: (
    <>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" />
      <path d="M14 3v6h6M8 13h8M8 17h5" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </>
  ),
  pen: <path d="M4 20h4L19 9l-4-4L4 16Zm9-13 4 4" />,
  euro: <path d="M18 6.5A7 7 0 1 0 18 17.5M4 10h10M4 14h10" />,
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <path d="M8.5 18H16a3 3 0 0 0 0-6H8a3 3 0 0 1 0-6h7.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  award: (
    <>
      <circle cx="12" cy="9" r="5.5" />
      <path d="m8.5 13.5-1.5 7 5-2.5 5 2.5-1.5-7" />
    </>
  ),
  book: (
    <>
      <path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2Z" />
      <path d="M4 20a2 2 0 0 0 2 1h13v-3" />
    </>
  ),
  box: (
    <>
      <path d="m3.5 7.5 8.5-4.5 8.5 4.5v9L12 21l-8.5-4.5Z" />
      <path d="m3.5 7.5 8.5 4.5 8.5-4.5M12 12v9" />
    </>
  ),
  warehouse: (
    <>
      <path d="M3 9.5 12 4l9 5.5V20H3Z" />
      <path d="M7 20v-7h10v7M7 16h10" />
    </>
  ),
  cart: (
    <>
      <path d="M3 4h2.5l2 11h11l2-8H7" />
      <circle cx="9.5" cy="19" r="1.5" />
      <circle cx="17" cy="19" r="1.5" />
    </>
  ),
  wrench: (
    <path d="M14.5 6.5a4 4 0 0 0 5 5L21 13l-1.5 1.5-1.5-1.5-8.5 8.5a2.1 2.1 0 0 1-3-3L15 10l-1.5-1.5L15 7Zm0 0a4 4 0 0 1 5-3.5l-2.5 2.5 1 2 2 1 2.5-2.5" />
  ),
  truck: (
    <>
      <path d="M3 6h11v10H3ZM14 9h4l3 3.5V16h-7" />
      <circle cx="7" cy="17.5" r="2" />
      <circle cx="17" cy="17.5" r="2" />
    </>
  ),
  chart: <path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6M20 16V6" />,
  spark: (
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
    </>
  ),
  map: (
    <>
      <path d="M12 21s-6.5-5.5-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.5 12 21 12 21Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  home: <path d="M4 10.5 12 4l8 6.5V20h-5v-6H9v6H4Z" />,
  shield: <path d="M12 3 4.5 6v6c0 4.5 3.2 7.7 7.5 9 4.3-1.3 7.5-4.5 7.5-9V6Z" />,
  bell: <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15ZM10 21h4" />,
  smartphone: (
    <>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
      <path d="M11 18.5h2" />
    </>
  ),
  monitor: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M9 20h6M12 16v4" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  play: <path d="M7 4.5v15l12.5-7.5Z" />,
  download: <path d="M12 4v11M7 10.5l5 5 5-5M4.5 20h15" />,
  chat: <path d="M4 5h16v11H9l-5 4Z" />,
  layers: <path d="m12 3 9 5-9 5-9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5" />,
  bolt: <path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12Z" />,
  heart: <path d="M12 20s-7.5-4.5-7.5-10A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7.5 3c0 5.5-7.5 10-7.5 10Z" />,
  signature: <path d="M3 17c3-1 4-9 6-9s-1 9 2 9 3-5 5-5 1 4 3 4 2-1 2-1M3 21h18" />,
  link: (
    <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7L11.5 7M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5" />
  ),
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {paths[name]}
    </svg>
  );
}

/** Nur die Pfade eines Icons (Raster 24 × 24) – zum Einsetzen in eigene SVG-Zeichnungen wie `Skizze`. */
export function IconPfade({ name }: { name: IconName }) {
  return paths[name];
}

/**
 * Strich-Icon → Glas-Icon (`@/os/ui/glas`). Themen-Icons ab ca. 32 px erscheinen überall als Glas-Icon;
 * Bedien-Icons (Pfeile, Schließen, Menü, Plus) haben bewusst keins.
 */
const glas: Partial<Record<IconName, GlasIconName>> = {
  inbox: "anfragen",
  phone: "telefon",
  user: "person",
  users: "mitarbeiter",
  clipboard: "auftrag",
  ruler: "lineal",
  calculator: "rechner",
  file: "dokument",
  camera: "kamera",
  pen: "stift",
  euro: "rechnung",
  calendar: "kalender",
  route: "route",
  clock: "zeit",
  award: "auszeichnung",
  book: "buch",
  box: "material",
  warehouse: "lager",
  cart: "einkauf",
  wrench: "werkzeug",
  truck: "fahrzeug",
  chart: "auswertung",
  spark: "macher",
  mic: "mikro",
  map: "einsatz",
  home: "haus",
  shield: "schild",
  bell: "glocke",
  smartphone: "handy",
  monitor: "bildschirm",
  search: "suche",
  play: "webinar",
  download: "import",
  chat: "kontakt",
  layers: "ebenen",
  bolt: "start",
  heart: "herz",
  signature: "unterschrift",
  link: "link",
  frage: "hilfe",
  check: "erledigt",
  achtung: "achtung",
};

/** Glas-Motiv zum Strich-Icon (oder `undefined`, wenn es keins gibt). */
export function glasName(name: IconName): GlasIconName | undefined {
  return glas[name];
}

/**
 * Themen-Icon für Karten und Abschnitte: das Glas-Icon zum Strich-Icon (Standard 44 px, mit `size-*` änderbar).
 * Gibt es kein Glas-Icon, erscheint das Strich-Icon in einer hellen Kachel.
 */
export function IconTile({
  name,
  tone = "signal",
  className = "",
}: {
  name: IconName;
  /** Nur für die Kachel-Ausweichform ohne Glas-Icon */
  tone?: "signal" | "moss" | "sky" | "ink";
  className?: string;
}) {
  const glasName = glas[name];
  if (glasName) {
    return <GlasIcon name={glasName} className={`shrink-0 ${/(^|\s)size-/.test(className) ? "" : "size-11"} ${className}`} />;
  }
  const tones = {
    signal: "bg-signal-soft text-signal-dark",
    moss: "bg-moss-soft text-moss",
    sky: "bg-sky-soft text-sky",
    ink: "bg-ink text-white",
  };
  return (
    <span className={`inline-flex size-11 shrink-0 items-center justify-center rounded-xl ${tones[tone]} ${className}`}>
      <Icon name={name} className="size-5.5" />
    </span>
  );
}
