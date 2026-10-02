/** Eine funktionale Icon-Familie: 20 px, 1,75 px Strich (Playbook Abschnitt 7). */
import type { SVGProps } from 'react';

const pfade: Record<string, string> = {
  heute: 'M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  auftraege: 'M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1zM6 6h12a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM9 12h6M9 16h4',
  plan: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  betrieb: 'M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  suche: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
  macher: 'M12 3l1.8 4.6L18 9.5l-4.2 1.9L12 16l-1.8-4.6L6 9.5l4.2-1.9zM18 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z',
  glocke: 'M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0',
  pfeilRechts: 'M5 12h14M13 6l6 6-6 6',
  pfeilLinks: 'M19 12H5M11 6l-6 6 6 6',
  zurueck: 'M15 6l-6 6 6 6',
  weiter: 'M9 6l6 6-6 6',
  runter: 'M6 9l6 6 6-6',
  hoch: 'M6 15l6-6 6 6',
  auswahl: 'M8 9l4-4 4 4M8 15l4 4 4-4',
  pfeil: 'M5 12h14M13 6l6 6-6 6',
  check: 'M5 12l5 5L20 7',
  x: 'M6 6l12 12M18 6L6 18',
  achtung: 'M12 3l10 18H2zM12 10v5M12 18v.5',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v6M12 7.5v.5',
  telefon: 'M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 6a2 2 0 0 1 2-2z',
  mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
  ort: 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 7.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  kamera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 10a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z',
  mikro: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3',
  uhr: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  paket: 'M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10',
  notiz: 'M5 3h10l4 4v14H5zM15 3v4h4M8 12h8M8 16h6',
  person: 'M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21a8 8 0 0 1 16 0',
  team: 'M9 5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM2 20a7 7 0 0 1 14 0M16 5.5a3 3 0 0 1 0 6M18 14a6 6 0 0 1 4 6',
  euro: 'M17 6.5A6.5 6.5 0 0 0 7 11.5v1a6.5 6.5 0 0 0 10 5M4 10h9M4 14h9',
  werkzeug: 'M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3zM14.5 6.5L17 4l3 3-2.5 2.5',
  auto: 'M3 16V11l2-5h14l2 5v5zM3 16v2h3v-2M18 16v2h3v-2M6.5 13h.5M17 13h.5',
  dokument: 'M6 3h9l4 4v14H6zM14 3v5h5',
  ordner: 'M3 6h6l2 2h10v11H3z',
  unterschrift: 'M3 17c3 0 4-8 6-8s0 8 3 8 3-4 5-4 2 2 4 2M3 21h18',
  stern: 'M12 3l2.8 5.8 6.2.9-4.5 4.4 1 6.2L12 17.4l-5.5 2.9 1-6.2L3 9.7l6.2-.9z',
  schild: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  einstellungen: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19 12l2-1-1-3-2 .2-1.3-1.3L17 5l-3-1-1 2h-2l-1-2-3 1 .3 2-1.3 1.3L4 8 3 11l2 1v0l-2 1 1 3 2-.2 1.3 1.3L7 19l3 1 1-2h2l1 2 3-1-.3-2 1.3-1.3 2 .3 1-3z',
  stift: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  muell: 'M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14',
  liste: 'M8 6h12M8 12h12M8 18h12M4 6h.5M4 12h.5M4 18h.5',
  chat: 'M4 5h16v11H9l-5 4z',
  download: 'M12 4v12M6 11l6 6 6-6M4 20h16',
  upload: 'M12 20V8M6 13l6-6 6 6M4 4h16',
  menue: 'M4 6h16M4 12h16M4 18h16',
  mehr: 'M5 12h.5M12 12h.5M19 12h.5',
  start: 'M7 4l12 8-12 8z',
  stop: 'M6 6h12v12H6z',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  filter: 'M4 5h16l-6 8v6l-4-2v-4z',
  lager: 'M3 9l9-5 9 5v11H3zM7 20v-7h10v7M7 16h10',
  route: 'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM6 15V9a3 3 0 0 1 3-3h4M18 9v6a3 3 0 0 1-3 3h-4',
  wissen: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M8 7h7',
  diagramm: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  wiederholen: 'M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5',
  schloss: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4',
  stecker: 'M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4',
  kalender: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M8 14h2M12 14h2M16 14h.5',
  leiste: 'M4 5h16v14H4zM9 5v14',
};

export type IconName = keyof typeof pfade | string;

export function Icon({ name, size = 20, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  const d = pfade[name] ?? pfade.info;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={d} />
    </svg>
  );
}

export const ICON_NAMEN = Object.keys(pfade);
