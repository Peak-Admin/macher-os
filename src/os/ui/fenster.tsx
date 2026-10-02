/**
 * Fenster-Skizze: ein feines Drahtgitter eines App-Fensters (Titelleiste, Seitenspalte) oder eines Handys,
 * in der Mitte eine App-Kachel mit Glas-Icon – gemeinsam für Website und Software.
 *
 * Für Einstiegs- und Teaserkarten („Erste Schritte“, „Schnittstelle verbinden“, „Kommt bald“), nie hinter Daten,
 * Listen oder Formularen. Rein dekorativ (`aria-hidden`): Titel und Text der Karte tragen die Bedeutung.
 *
 * Linien und Kachel nehmen `currentColor` – die Fläche setzt die Farbe (hell: Textfarbe, dunkel: Weiß).
 * Ohne Farbe: Auch das Glas-Icon ist grau (aus `currentColor` gemischt), damit sich die Zeichnung klar von den grünen
 * Themen- und Navigations-Icons unterscheidet. Regeln: docs/design/festlegungen.md („Fenster-Skizze“).
 */
import { useId, type CSSProperties } from 'react';
import { GlasIcon, glasFuer, type GlasIconName } from './glas';

/** Graue Glas-Farben für die Zeichnung – überschreiben die grünen `--glas-*` nur innerhalb der Skizze. */
const GRAU = {
  '--glas-hell': 'color-mix(in srgb, currentColor 30%, transparent)',
  '--glas-dunkel': 'color-mix(in srgb, currentColor 68%, transparent)',
  '--glas-milch': 'color-mix(in srgb, currentColor 8%, transparent)',
} as CSSProperties;

export function FensterSkizze({
  icon,
  rahmen = 'fenster',
  ausschnitt = 'voll',
  className,
  style,
}: {
  icon: GlasIconName;
  /** Desktop-Fenster mit Seitenspalte oder Handy-Umriss */
  rahmen?: 'fenster' | 'handy';
  /** `nah`: enger Ausschnitt (4:3) um die Kachel – für kleine Kacheln, in denen sonst das Icon zu klein würde */
  ausschnitt?: 'voll' | 'nah';
  className?: string;
  style?: CSSProperties;
}) {
  const id = useId().replace(/[^\w-]/g, '');
  const nah = ausschnitt === 'nah';
  // Im Nah-Ausschnitt (kleine Kacheln) kräftigere Linien und eine größere Kachel genau in der Mitte des Ausschnitts
  const k = nah ? 1.6 : 1;
  const linie = { stroke: 'currentColor', fill: 'none' } as const;
  const balken = (x: number, y: number, b: number, deckkraft = 0.1) => (
    <rect x={x} y={y} width={b} height={4} rx={2} fill="currentColor" fillOpacity={deckkraft} />
  );
  return (
    <svg
      viewBox={nah ? '80 26 160 120' : '0 0 320 180'}
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ display: 'block', width: '100%', height: 'auto', ...GRAU, ...style }}
    >
      <defs>
        {/* Rahmen läuft nach unten weich aus */}
        <linearGradient id={`${id}-aus`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.45" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${id}-maske`} maskUnits="userSpaceOnUse" x="0" y="0" width="320" height="180">
          <rect width="320" height="180" fill={`url(#${id}-aus)`} />
        </mask>
        <radialGradient id={`${id}-schein`}>
          <stop offset="0" style={{ stopColor: 'var(--glas-hell)', stopOpacity: 0.3 }} />
          <stop offset="1" style={{ stopColor: 'var(--glas-hell)', stopOpacity: 0 }} />
        </radialGradient>
        <linearGradient id={`${id}-kachel`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.12" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.03" />
        </linearGradient>
      </defs>

      <g mask={`url(#${id}-maske)`}>
        {rahmen === 'fenster' ? (
          <>
            <rect x="36.5" y="14.5" width="247" height="200" rx="10" {...linie} strokeOpacity={0.22 * k} fill="currentColor" fillOpacity={0.025} />
            <line x1="37" y1="30.5" x2="283" y2="30.5" {...linie} strokeOpacity={0.14 * k} />
            <line x1="96.5" y1="31" x2="96.5" y2="180" {...linie} strokeOpacity={0.14 * k} />
            {balken(46, 20.5, 22, 0.24)}
            {balken(46, 42, 38)}
            {balken(46, 54, 30)}
            {balken(46, 66, 34)}
            {balken(108, 42, 52)}
          </>
        ) : (
          <>
            <rect x="118.5" y="8.5" width="83" height="200" rx="16" {...linie} strokeOpacity={0.24} fill="currentColor" fillOpacity={0.025} />
            <rect x="148" y="16" width="24" height="4" rx="2" fill="currentColor" fillOpacity={0.24} />
            {balken(128, 30, 34, 0.14)}
          </>
        )}
      </g>

      <g transform={nah ? 'translate(160 86) scale(1.25) translate(-160 -98)' : undefined}>
        <circle cx="160" cy="98" r="68" fill={`url(#${id}-schein)`} />
        <rect x="128" y="66" width="64" height="64" rx="17" fill={`url(#${id}-kachel)`} stroke="currentColor" strokeOpacity={0.32 * k} strokeWidth={1.2} />
        <rect x="133.5" y="71.5" width="53" height="53" rx="13" {...linie} strokeOpacity={0.14 * k} />
        <g transform="translate(140 78)">
          <GlasIcon name={icon} size={40} />
        </g>
      </g>
    </svg>
  );
}

const KACHEL = { klein: [56, 42], mittel: [96, 72], gross: [192, 144] } as const;

/**
 * Kleine Fenster-Skizze in fester Größe (wie früher das Objektfoto `MacherAsset`): für Türen, Widget-Köpfe und Kacheln.
 * `icon` ist ein Icon-Name der Software; das passende Glas-Icon kommt aus `glasFuer`.
 */
export function SkizzenKachel({ icon, groesse = 'mittel', className }: { icon: string; groesse?: keyof typeof KACHEL; className?: string }) {
  const [b, h] = KACHEL[groesse];
  return (
    <span className={`mm-fenster mm-fenster--kachel${className ? ` ${className}` : ''}`} style={{ width: b, height: h }} aria-hidden>
      <FensterSkizze icon={glasFuer[icon] ?? 'info'} ausschnitt="nah" />
    </span>
  );
}
