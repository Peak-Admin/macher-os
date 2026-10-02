import type { ReactNode } from "react";
import type { FunktionSlug } from "@/content/registry";
import { IconPfade, type IconName } from "./Icon";

/**
 * Abstrakte Skizze einer Funktion – nach den kleinen Prozess-Illustrationen von Mission Mittelstand:
 * ruhige Grüngrau-Fläche, drei aufgefächerte Blätter mit Platzhalterlinien, vorne ein Blatt, das die Funktion
 * andeutet (Angebot mit Unterschrift, Kalender, Plantafel …), unten eine grüne Plakette mit dem Themen-Icon.
 *
 * Für Karten, die eine Funktion kurz erklären. Rein dekorativ – die Bedeutung trägt immer der Text daneben.
 * Echte Beispieldaten zeigt stattdessen die `UiEbene`. Regeln: docs/design/festlegungen.md („Skizzen und UI-Ebenen“).
 */

export type SkizzenMotiv = FunktionSlug;

// Gezeichnet auf 320 × 200, sichtbar ist der Ausschnitt 280 × 210 (4:3). Das vordere Blatt liegt bei x 100–220, y 22–170; Inhalt von x 110 bis 210.
const L = 110;
const R = 210;

function Balken({ x, y, b, ton = "hell" }: { x: number; y: number; b: number; ton?: "hell" | "dunkel" | "weiss" | "gruen" | "gruen-hell" }) {
  const fill = {
    hell: "fill-line",
    dunkel: "fill-muted/30",
    weiss: "fill-white",
    gruen: "fill-primary",
    "gruen-hell": "fill-primary/30",
  }[ton];
  return <rect x={x} y={y} width={b} height={5} rx={2.5} className={fill} />;
}

/** Abstrakte Person im Kreis. */
function Person({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} className="fill-sand" />
      <circle cx={cx} cy={cy - r * 0.18} r={r * 0.36} className="fill-muted/40" />
      <path
        d={`M${cx - r * 0.62} ${cy + r * 0.72} a${r * 0.62} ${r * 0.5} 0 0 1 ${r * 1.24} 0`}
        className="fill-muted/40"
      />
    </g>
  );
}

function Haken({ x, y, gross = 9 }: { x: number; y: number; gross?: number }) {
  const s = gross / 9;
  return (
    <path
      d={`M${x + 2.2 * s} ${y + 4.8 * s} l${1.9 * s} ${1.9 * s} l${3.4 * s} ${-3.8 * s}`}
      fill="none"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="stroke-white"
    />
  );
}

function Kaestchen({ x, y, an }: { x: number; y: number; an: boolean }) {
  return an ? (
    <g>
      <rect x={x} y={y} width={9} height={9} rx={2.5} className="fill-primary" />
      <Haken x={x} y={y} />
    </g>
  ) : (
    <rect x={x + 0.5} y={y + 0.5} width={8} height={8} rx={2.5} strokeWidth={1} className="fill-white stroke-line-dark/60" />
  );
}

function Unterschrift({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path
        d={`M${x} ${y} c4 -1 5 -9 8 -9 s-1 10 3 10 s4 -7 7 -7 s1 6 4 6 s4 -3 6 -3`}
        fill="none"
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-ink/70"
      />
      <line x1={x - 2} y1={y + 5} x2={x + 46} y2={y + 5} strokeWidth={1} className="stroke-line" />
    </g>
  );
}

function Pille({ x, y, b, text, ton = "gruen" }: { x: number; y: number; b: number; text?: string; ton?: "gruen" | "neutral" | "warnung" }) {
  const flaeche = { gruen: "fill-signal-soft", neutral: "fill-sand", warnung: "fill-warning-soft" }[ton];
  const schrift = { gruen: "fill-signal", neutral: "fill-muted", warnung: "fill-warning" }[ton];
  return (
    <g>
      <rect x={x} y={y} width={b} height={12} rx={6} className={flaeche} />
      {text && (
        <text x={x + b / 2} y={y + 8.6} textAnchor="middle" fontSize={7.5} fontWeight={700} className={`font-display ${schrift}`}>
          {text}
        </text>
      )}
    </g>
  );
}

/** Kopfzeile des vorderen Blatts: optional Person, Titel, rechts eine kurze Nummer. */
function Kopf({ titel, nr, person = false }: { titel: string; nr?: string; person?: boolean }) {
  return (
    <g>
      {person && <Person cx={L + 7} cy={41} r={7} />}
      <text x={person ? L + 19 : L} y={45} fontSize={10.5} fontWeight={600} className="font-display fill-ink">
        {titel}
      </text>
      {nr && (
        <text x={R} y={45} textAnchor="end" fontSize={10.5} fontWeight={700} className="font-display fill-ink">
          {nr}
        </text>
      )}
    </g>
  );
}

/** Kleines Foto: Fläche mit Berg und Sonne. */
function Foto({ x, y, b, h }: { x: number; y: number; b: number; h: number }) {
  return (
    <g>
      <rect x={x} y={y} width={b} height={h} rx={4} className="fill-sand" />
      <path d={`M${x + 4} ${y + h - 4} l${b * 0.28} ${-h * 0.42} l${b * 0.16} ${h * 0.24} l${b * 0.12} ${-h * 0.14} l${b * 0.36} ${h * 0.32} Z`} className="fill-muted/30" />
      <circle cx={x + b - 9} cy={y + 9} r={3.5} className="fill-muted/30" />
    </g>
  );
}

type Motiv = { icon: IconName; vorne: ReactNode };

const qr = [
  "1110111",
  "1010101",
  "1110111",
  "0001000",
  "1101011",
  "0110110",
  "1011101",
];

const motive: Record<SkizzenMotiv, Motiv> = {
  anfragen: {
    icon: "inbox",
    vorne: (
      <>
        <Kopf titel="Anfrage" person />
        <Pille x={R - 24} y={36} b={24} text="Neu" />
        <rect x={L} y={58} width={100} height={32} rx={8} className="fill-sand" />
        <path d={`M${L + 10} 89 v9 l10 -9 Z`} className="fill-sand" />
        <Balken x={L + 8} y={66} b={78} ton="weiss" />
        <Balken x={L + 8} y={77} b={58} ton="weiss" />
        <Balken x={L} y={108} b={86} />
        <Balken x={L} y={118} b={64} />
        <Pille x={L} y={130} b={30} ton="neutral" />
        <Pille x={L + 34} y={130} b={38} ton="neutral" />
      </>
    ),
  },
  telefon: {
    icon: "phone",
    vorne: (
      <>
        <Kopf titel="Anruf" nr="08:12" person />
        {[6, 12, 20, 14, 26, 18, 10, 22, 30, 16, 8, 18, 12, 6, 10, 16].map((h, i) => (
          <rect key={i} x={L + 2 + i * 6.2} y={76 - h / 2} width={3} height={h} rx={1.5} className={i < 10 ? "fill-primary" : "fill-line"} />
        ))}
        <Balken x={L} y={102} b={96} />
        <Balken x={L} y={112} b={78} />
        <Balken x={L} y={122} b={88} />
        <Pille x={L} y={133} b={40} text="Notiz" />
      </>
    ),
  },
  kunden: {
    icon: "user",
    vorne: (
      <>
        <Kopf titel="Kunde" />
        <Person cx={L + 14} cy={72} r={14} />
        <Balken x={L + 36} y={64} b={56} ton="dunkel" />
        <Balken x={L + 36} y={75} b={40} />
        {[80, 62, 72].map((b, i) => (
          <g key={i}>
            <circle cx={L + 3} cy={102.5 + i * 13} r={3} className="fill-primary" />
            <Balken x={L + 12} y={100 + i * 13} b={b} />
          </g>
        ))}
      </>
    ),
  },
  auftraege: {
    icon: "clipboard",
    vorne: (
      <>
        <Kopf titel="Auftrag" nr="01" />
        {[70, 58, 76, 64, 50].map((b, i) => (
          <g key={i}>
            <Kaestchen x={L} y={57 + i * 16} an={i < 3} />
            <Balken x={L + 15} y={59 + i * 16} b={b} ton={i < 3 ? "hell" : "dunkel"} />
          </g>
        ))}
      </>
    ),
  },
  aufmass: {
    icon: "ruler",
    vorne: (
      <>
        <Kopf titel="Aufmaß" />
        <path d={`M${L + 6} 66 H${R - 4} V104 H${L + 62} V136 H${L + 6} Z`} strokeWidth={2} strokeLinejoin="round" className="fill-sand stroke-ink/60" />
        <path d={`M${L + 30} 136 A14 14 0 0 0 ${L + 16} 122`} fill="none" strokeWidth={1} className="stroke-muted/60" />
        <line x1={L + 16} y1={122} x2={L + 16} y2={136} strokeWidth={1} className="stroke-muted/60" />
        <g strokeWidth={1} className="stroke-primary">
          <line x1={L + 6} y1={58} x2={R - 4} y2={58} />
          <line x1={L + 6} y1={55} x2={L + 6} y2={61} />
          <line x1={R - 4} y1={55} x2={R - 4} y2={61} />
          <line x1={L - 2} y1={66} x2={L - 2} y2={136} />
          <line x1={L - 5} y1={66} x2={L + 1} y2={66} />
          <line x1={L - 5} y1={136} x2={L + 1} y2={136} />
        </g>
        <rect x={146} y={52} width={30} height={12} rx={3} strokeWidth={1} className="fill-white stroke-primary" />
        <text x={161} y={60.6} textAnchor="middle" fontSize={7.5} fontWeight={700} className="font-display fill-signal">
          4,20 m
        </text>
      </>
    ),
  },
  kalkulation: {
    icon: "calculator",
    vorne: (
      <>
        <Kopf titel="Kalkulation" />
        {[54, 62, 48].map((b, i) => (
          <g key={i}>
            <Balken x={L} y={60 + i * 14} b={b} />
            <Balken x={R - 24} y={60 + i * 14} b={24} ton="dunkel" />
          </g>
        ))}
        <line x1={L} y1={103} x2={R} y2={103} strokeWidth={1} className="stroke-line" />
        <rect x={L - 4} y={109} width={108} height={18} rx={5} className="fill-signal-soft" />
        <Balken x={L + 2} y={115.5} b={40} ton="gruen-hell" />
        <Balken x={R - 28} y={115.5} b={26} ton="gruen" />
        <rect x={L} y={135} width={100} height={6} rx={3} className="fill-sand" />
        <rect x={L} y={135} width={68} height={6} rx={3} className="fill-primary" />
      </>
    ),
  },
  angebote: {
    icon: "file",
    vorne: (
      <>
        <Kopf titel="Angebot" nr="01" person />
        <Balken x={L} y={58} b={96} ton="dunkel" />
        <Balken x={L} y={68} b={84} />
        <Balken x={L} y={78} b={90} />
        {[56, 48, 60].map((b, i) => (
          <g key={i}>
            <Balken x={L} y={94 + i * 10} b={b} />
            <Balken x={R - 20} y={94 + i * 10} b={20} ton="dunkel" />
          </g>
        ))}
        <Unterschrift x={L + 2} y={139} />
      </>
    ),
  },
  dokumentation: {
    icon: "camera",
    vorne: (
      <>
        <Kopf titel="Fotos" nr="4" />
        <Foto x={L} y={56} b={47} h={34} />
        <Foto x={L + 53} y={56} b={47} h={34} />
        <Foto x={L} y={95} b={47} h={34} />
        <Foto x={L + 53} y={95} b={47} h={34} />
        <circle cx={L + 47} cy={58} r={6} className="fill-primary" />
        <Haken x={L + 42.5} y={53.5} />
        <Balken x={L} y={137} b={64} />
      </>
    ),
  },
  rechnungen: {
    icon: "euro",
    vorne: (
      <>
        <Kopf titel="Rechnung" nr="01" person />
        <Balken x={L} y={58} b={62} ton="dunkel" />
        <Balken x={L} y={68} b={44} />
        {[58, 46, 54].map((b, i) => (
          <g key={i}>
            <Balken x={L} y={84 + i * 11} b={b} />
            <Balken x={R - 22} y={84 + i * 11} b={22} ton="dunkel" />
          </g>
        ))}
        <rect x={L - 4} y={119} width={108} height={18} rx={5} className="fill-signal-soft" />
        <Balken x={L + 2} y={125.5} b={34} ton="gruen-hell" />
        <Balken x={R - 30} y={125.5} b={28} ton="gruen" />
      </>
    ),
  },
  zahlungen: {
    icon: "chart",
    vorne: (
      <>
        <Kopf titel="Zahlungen" />
        {[true, true, false].map((bezahlt, i) => (
          <g key={i}>
            <Balken x={L} y={60 + i * 22} b={[52, 60, 46][i]} ton="dunkel" />
            <Balken x={L} y={70 + i * 22} b={[34, 40, 30][i]} />
            {bezahlt ? (
              <g>
                <circle cx={R - 6} cy={67 + i * 22} r={6} className="fill-primary" />
                <Haken x={R - 10.5} y={62.5 + i * 22} />
              </g>
            ) : (
              <circle cx={R - 6} cy={67 + i * 22} r={5.5} fill="none" strokeWidth={1.3} strokeDasharray="2.4 2" className="stroke-muted" />
            )}
          </g>
        ))}
        <rect x={L} y={134} width={100} height={6} rx={3} className="fill-sand" />
        <rect x={L} y={134} width={70} height={6} rx={3} className="fill-primary" />
      </>
    ),
  },
  kalender: {
    icon: "calendar",
    vorne: (
      <>
        <Kopf titel="Kalender" />
        {[0, 1, 2, 3, 4].map((s) => (
          <rect key={s} x={L + s * 21} y={55} width={17} height={4} rx={2} className="fill-muted/30" />
        ))}
        {[0, 1, 2, 3].flatMap((z) =>
          [0, 1, 2, 3, 4].map((s) => {
            const ton =
              z === 1 && s === 1 ? "fill-primary" : (z === 0 && s === 3) || (z === 2 && s === 3) || (z === 3 && s === 0) ? "fill-signal-soft" : "fill-sand";
            return <rect key={`${z}-${s}`} x={L + s * 21} y={65 + z * 17} width={17} height={13} rx={3} className={ton} />;
          }),
        )}
        <Haken x={L + 25} y={84} />
      </>
    ),
  },
  einsatzplanung: {
    icon: "route",
    vorne: (
      <>
        <Kopf titel="Plantafel" />
        {[
          [[128, 40, "fill-primary"], [172, 32, "fill-signal-soft"]],
          [[140, 58, "fill-primary"]],
          [[128, 26, "fill-signal-soft"], [158, 46, "fill-primary"]],
          [[150, 38, "fill-primary"]],
        ].map((zeile, z) => (
          <g key={z}>
            <Person cx={L + 5} cy={64 + z * 19} r={5.5} />
            {(zeile as [number, number, string][]).map(([x, b, ton]) => (
              <rect key={x} x={x} y={60 + z * 19} width={b} height={8} rx={3} className={ton} />
            ))}
          </g>
        ))}
        <line x1={166} y1={53} x2={166} y2={136} strokeWidth={1} strokeDasharray="2 2" className="stroke-primary/70" />
        <circle cx={166} cy={53} r={2} className="fill-primary" />
      </>
    ),
  },
  mitarbeiter: {
    icon: "users",
    vorne: (
      <>
        <Kopf titel="Mitarbeiter" nr="01" person />
        <Balken x={L} y={58} b={92} ton="dunkel" />
        <Balken x={L} y={68} b={70} />
        <Balken x={L} y={78} b={84} />
        <Pille x={L} y={93} b={30} ton="gruen" />
        <Pille x={L + 34} y={93} b={40} ton="neutral" />
        <Pille x={L + 78} y={93} b={22} ton="neutral" />
        <Balken x={L} y={116} b={80} />
        <Balken x={L} y={126} b={60} />
      </>
    ),
  },
  zeiterfassung: {
    icon: "clock",
    vorne: (
      <>
        <Kopf titel="Zeiten" nr="8:15" />
        <circle cx={L + 18} cy={78} r={16} className="fill-sand" />
        <path d={`M${L + 18} 62 A16 16 0 1 1 ${L + 4.14} 86`} fill="none" strokeWidth={3} strokeLinecap="round" className="stroke-primary" />
        <path d={`M${L + 18} 70 V78 L${L + 24} 82`} fill="none" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="stroke-ink/70" />
        <Balken x={L + 44} y={70} b={50} ton="dunkel" />
        <Balken x={L + 44} y={80} b={36} />
        {[44, 52, 38].map((b, i) => (
          <g key={i}>
            <Balken x={L} y={106 + i * 12} b={b} />
            <Balken x={R - 18} y={106 + i * 12} b={18} ton={i === 0 ? "gruen" : "dunkel"} />
          </g>
        ))}
      </>
    ),
  },
  qualifikationen: {
    icon: "award",
    vorne: (
      <>
        <Kopf titel="Nachweis" />
        <Balken x={130} y={57} b={60} ton="dunkel" />
        <Balken x={138} y={67} b={44} />
        <path d="M153 104 l-5 17 l6 -3 l3 5 l3 -15 Z" className="fill-primary" />
        <path d="M167 104 l5 17 l-6 -3 l-3 5 l-3 -15 Z" className="fill-primary" />
        <circle cx={160} cy={94} r={14} strokeWidth={1.5} className="fill-signal-soft stroke-primary" />
        <circle cx={160} cy={94} r={9.5} fill="none" strokeWidth={0.8} strokeDasharray="1.6 1.6" className="stroke-primary" />
        <path d="M155 94 l3.5 3.5 l6.5 -7" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="stroke-primary" />
        <line x1={L} y1={136} x2={L + 32} y2={136} strokeWidth={1} className="stroke-line-dark/50" />
        <line x1={R - 32} y1={136} x2={R} y2={136} strokeWidth={1} className="stroke-line-dark/50" />
      </>
    ),
  },
  schulungen: {
    icon: "book",
    vorne: (
      <>
        <Kopf titel="Schulung" />
        <rect x={L} y={55} width={100} height={48} rx={6} className="fill-sand" />
        <circle cx={160} cy={79} r={11} className="fill-primary" />
        <path d="M156.5 73.5 L166 79 L156.5 84.5 Z" className="fill-white" />
        <rect x={L} y={110} width={100} height={5} rx={2.5} className="fill-sand" />
        <rect x={L} y={110} width={64} height={5} rx={2.5} className="fill-primary" />
        <Balken x={L} y={124} b={80} />
        <Balken x={L} y={134} b={56} />
      </>
    ),
  },
  material: {
    icon: "box",
    vorne: (
      <>
        <Kopf titel="Material" />
        {[46, 56, 40, 50].map((b, i) => (
          <g key={i}>
            <rect x={L + 0.5} y={57.5 + i * 18} width={12} height={12} rx={2} strokeWidth={0.8} className="fill-signal-soft stroke-primary" />
            <line x1={L + 0.5} y1={62 + i * 18} x2={L + 12.5} y2={62 + i * 18} strokeWidth={0.8} className="stroke-primary" />
            <Balken x={L + 19} y={61 + i * 18} b={b} />
            <Pille x={R - 20} y={57.5 + i * 18} b={20} ton={i === 2 ? "warnung" : "neutral"} />
          </g>
        ))}
      </>
    ),
  },
  lager: {
    icon: "warehouse",
    vorne: (
      <>
        <Kopf titel="Lager" />
        {(
          [
            [80, [[L + 2, 26], [L + 32, 20], [L + 56, 28], [L + 88, 10]]],
            [106, [[L + 2, 20], [L + 26, 32], [L + 62, 24]]],
            [132, [[L + 2, 30], [L + 36, 22], [L + 62, 34]]],
          ] as [number, [number, number][]][]
        ).map(([boden, kisten], z) => (
          <g key={z}>
            {kisten.map(([x, b], k) => {
              const hervor = z === 1 && k === 1;
              return (
                <g key={x}>
                  <rect
                    x={x}
                    y={boden - 17}
                    width={b}
                    height={17}
                    rx={2.5}
                    strokeWidth={hervor ? 1 : 0}
                    className={hervor ? "fill-signal-soft stroke-primary" : "fill-line"}
                  />
                  <rect x={x + 4} y={boden - 12} width={Math.max(b - 8, 3)} height={3} rx={1.5} className="fill-white" />
                </g>
              );
            })}
            <rect x={L - 2} y={boden} width={104} height={3} rx={1.5} className="fill-muted/40" />
          </g>
        ))}
      </>
    ),
  },
  einkauf: {
    icon: "cart",
    vorne: (
      <>
        <Kopf titel="Bestellung" nr="01" />
        {[60, 48, 54].map((b, i) => (
          <g key={i}>
            <Kaestchen x={L} y={57 + i * 14} an={i < 2} />
            <Balken x={L + 15} y={59 + i * 14} b={b} />
            <Balken x={R - 18} y={59 + i * 14} b={18} ton="dunkel" />
          </g>
        ))}
        <line x1={L} y1={103} x2={R} y2={103} strokeWidth={1} className="stroke-line" />
        <rect x={L} y={112} width={20} height={14} rx={2} className="fill-line" />
        <path d={`M${L + 21} 116 h7 l5 5 v5 h-12 Z`} className="fill-line" />
        <circle cx={L + 6} cy={128} r={3} className="fill-muted/50" />
        <circle cx={L + 26} cy={128} r={3} className="fill-muted/50" />
        <Balken x={L + 42} y={113} b={56} ton="dunkel" />
        <Balken x={L + 42} y={123} b={40} />
      </>
    ),
  },
  werkzeuge: {
    icon: "wrench",
    vorne: (
      <>
        <Kopf titel="Werkzeug" />
        {qr.flatMap((zeile, z) =>
          zeile.split("").map((an, s) =>
            an === "1" ? <rect key={`${z}-${s}`} x={L + s * 5} y={56 + z * 5} width={5} height={5} className="fill-ink/80" /> : null,
          ),
        )}
        <Balken x={L + 44} y={58} b={56} ton="dunkel" />
        <Balken x={L + 44} y={68} b={40} />
        <Balken x={L + 44} y={80} b={48} />
        {[54, 42].map((b, i) => (
          <g key={i}>
            <circle cx={L + 3} cy={106.5 + i * 15} r={3} className="fill-primary" />
            <Balken x={L + 12} y={104 + i * 15} b={b} />
            <Pille x={R - 30} y={100.5 + i * 15} b={30} ton={i === 0 ? "gruen" : "neutral"} />
          </g>
        ))}
      </>
    ),
  },
  fahrzeuge: {
    icon: "truck",
    vorne: (
      <>
        <Kopf titel="Fahrzeug" />
        <path d={`M${L + 2} 92 V64 Q${L + 2} 58 ${L + 8} 58 H170 L185 72 H${R - 8} Q${R - 2} 72 ${R - 2} 78 V92 Z`} className="fill-line" />
        <path d="M172 62 H175 L185 72 H172 Z" className="fill-white" />
        <rect x={L + 8} y={76} width={48} height={4} rx={2} className="fill-primary" />
        {[L + 20, R - 22].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy={93} r={7} className="fill-ink/70" />
            <circle cx={cx} cy={93} r={2.8} className="fill-white" />
          </g>
        ))}
        <rect x={L + 0.5} y={110.5} width={40} height={12} rx={2} strokeWidth={1} className="fill-white stroke-ink/40" />
        <rect x={L + 5} y={114.5} width={31} height={4} rx={2} className="fill-muted/40" />
        <Balken x={L + 50} y={111} b={50} ton="dunkel" />
        <Balken x={L + 50} y={121} b={36} />
        <Balken x={L} y={134} b={70} />
      </>
    ),
  },
  auswertung: {
    icon: "chart",
    vorne: (
      <>
        <Kopf titel="Auswertung" />
        {[24, 38, 30, 52, 44, 62].map((h, i) => (
          <rect key={i} x={L + 3 + i * 16.5} y={130 - h} width={11} height={h} rx={2.5} className={i === 5 ? "fill-primary" : "fill-signal-soft"} />
        ))}
        <line x1={L} y1={130.5} x2={R} y2={130.5} strokeWidth={1} className="stroke-line-dark/50" />
        <Balken x={L} y={138} b={44} />
      </>
    ),
  },
  "automatisch-erledigen": {
    icon: "spark",
    vorne: (
      <>
        <Kopf titel="Heute erledigt" />
        {[70, 56, 64, 48].map((b, i) => (
          <g key={i}>
            <circle cx={L + 5} cy={61 + i * 18} r={5.5} className="fill-primary" />
            <Haken x={L + 0.5} y={56.5 + i * 18} />
            <Balken x={L + 16} y={58.5 + i * 18} b={b} />
          </g>
        ))}
        <circle cx={L + 5} cy={133} r={5} fill="none" strokeWidth={1.3} strokeDasharray="2.4 2" className="stroke-primary" />
        <Balken x={L + 16} y={130.5} b={40} ton="dunkel" />
      </>
    ),
  },
};

/** Hinteres Blatt: Platzhalterlinien, links mit Person, rechts mit Nummer. */
function HinteresBlatt({ seite }: { seite: "links" | "rechts" }) {
  const x = seite === "links" ? 74 : 134;
  return (
    <g transform={`rotate(${seite === "links" ? -7 : 7} ${x + 56} 100)`}>
      <rect x={x} y={34} width={112} height={132} rx={9} strokeWidth={1} className="fill-white stroke-line" />
      {seite === "links" ? (
        <Person cx={x + 14} cy={50} r={7} />
      ) : (
        <text x={x + 100} y={54} textAnchor="end" fontSize={10.5} fontWeight={700} className="font-display fill-ink">
          03
        </text>
      )}
      <Balken x={x + 10} y={70} b={86} />
      <Balken x={x + 10} y={80} b={70} />
      <Balken x={x + 10} y={90} b={80} />
      <Balken x={x + 10} y={108} b={64} />
      <Balken x={x + 10} y={118} b={76} />
      {seite === "links" && <Unterschrift x={x + 12} y={146} />}
    </g>
  );
}

export function Skizze({
  motiv,
  className = "",
  seitenverhaeltnis = "aspect-[4/3]",
}: {
  motiv: SkizzenMotiv;
  className?: string;
  seitenverhaeltnis?: string;
}) {
  const m = motive[motiv];
  const sanft = "transition-[translate] duration-150 ease-out";
  return (
    <span aria-hidden className={`relative block overflow-hidden rounded-xl bg-sand ${seitenverhaeltnis} ${className}`}>
      <svg
        viewBox="20 -1 280 210"
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 size-full [filter:drop-shadow(0_10px_14px_color-mix(in_srgb,var(--color-ink)_13%,transparent))]"
      >
        <g className={`${sanft} motion-safe:group-hover:-translate-x-1.5`}>
          <HinteresBlatt seite="links" />
        </g>
        <g className={`${sanft} motion-safe:group-hover:translate-x-1.5`}>
          <HinteresBlatt seite="rechts" />
        </g>
        <g className={`${sanft} motion-safe:group-hover:-translate-y-1`}>
          <rect x={100} y={22} width={120} height={148} rx={9} strokeWidth={1} className="fill-white stroke-line" />
          {m.vorne}
        </g>
        <g>
          <circle cx={160} cy={168} r={19} className="fill-white" />
          <circle cx={160} cy={168} r={16} className="fill-primary" />
          <g
            transform="translate(151 159) scale(0.75)"
            fill="none"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="stroke-white"
          >
            <IconPfade name={m.icon} />
          </g>
        </g>
      </svg>
    </span>
  );
}
