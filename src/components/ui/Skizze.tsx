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
 *
 * Motive: eins je Funktion (Slug aus der Registry), dazu Handy-Motive für die App (vorne ein Handy statt Blatt),
 * Grundsätze von „Macher erledigt“ und Quellen beim Daten übernehmen.
 */

/** Motive, die keine eigene Funktion sind. Neue Motive hier und in `motive` eintragen. */
type ZusatzMotiv =
  | "handy-einsaetze"
  | "handy-unterwegs"
  | "handy-vor-ort"
  | "handy-abschluss"
  | "handy-kamera"
  | "handy-sprache"
  | "handy-navigation"
  | "handy-kontakte"
  | "freigabe"
  | "stufen"
  | "verlauf"
  | "ehrlich"
  | "tabelle"
  | "software-export";

export type SkizzenMotiv = FunktionSlug | ZusatzMotiv;

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

/** Strich-Icon in einer Skizze, z. B. auf einem Knopf. `groesse` in Zeichenpunkten. */
function Glyphe({ name, x, y, groesse = 12, ton = "gruen" }: { name: IconName; x: number; y: number; groesse?: number; ton?: "gruen" | "weiss" | "dunkel" }) {
  const s = groesse / 24;
  const stroke = { gruen: "stroke-primary", weiss: "stroke-white", dunkel: "stroke-ink/70" }[ton];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="none" strokeWidth={1.3 / s} strokeLinecap="round" strokeLinejoin="round" className={stroke}>
      <IconPfade name={name} />
    </g>
  );
}

/** Knopf mit Beschriftung: gefüllt (Hauptaktion) oder hell mit Rahmen. */
function Knopf({ x, y, b, text, gefuellt = true }: { x: number; y: number; b: number; text: string; gefuellt?: boolean }) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={b}
        height={16}
        rx={5}
        strokeWidth={gefuellt ? 0 : 1}
        className={gefuellt ? "fill-primary" : "fill-white stroke-line-dark/60"}
      />
      <text x={x + b / 2} y={y + 11} textAnchor="middle" fontSize={7.5} fontWeight={700} className={`font-display ${gefuellt ? "fill-white" : "fill-ink"}`}>
        {text}
      </text>
    </g>
  );
}

// Handy vorne: Rahmen x 116–204, y 14–178; Bildschirm-Inhalt von x 124 bis 196, ab y 30.
const HL = 124;
const HR = 196;

function HandyKopf({ titel, nr }: { titel: string; nr?: string }) {
  return (
    <g>
      <text x={HL} y={39} fontSize={9.5} fontWeight={600} className="font-display fill-ink">
        {titel}
      </text>
      {nr && (
        <text x={HR} y={39} textAnchor="end" fontSize={9.5} fontWeight={700} className="font-display fill-ink">
          {nr}
        </text>
      )}
    </g>
  );
}

/** Pfad eines fünfzackigen Sterns um (cx, cy). */
function stern(cx: number, cy: number, r: number) {
  const punkte = Array.from({ length: 10 }, (_, i) => {
    const w = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.45;
    return `${(cx + rr * Math.cos(w)).toFixed(2)} ${(cy + rr * Math.sin(w)).toFixed(2)}`;
  });
  return `M${punkte.join(" L")} Z`;
}

type Kopfdaten = { titel: string; nr?: string; person?: boolean };
type Motiv = { icon: IconName; kopf?: Kopfdaten; vorne: ReactNode; form?: "blatt" | "handy" };

const qr = [
  "1110111",
  "1010101",
  "1110111",
  "0001000",
  "1101011",
  "0110110",
  "1011101",
];

const motive = {
  anfragen: {
    icon: "inbox",
    kopf: { titel: "Anfrage", person: true },
    vorne: (
      <>
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
    kopf: { titel: "Anruf", nr: "08:12", person: true },
    vorne: (
      <>
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
    kopf: { titel: "Kunde" },
    vorne: (
      <>
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
    kopf: { titel: "Auftrag", nr: "01" },
    vorne: (
      <>
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
    kopf: { titel: "Aufmaß" },
    vorne: (
      <>
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
    kopf: { titel: "Kalkulation" },
    vorne: (
      <>
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
    kopf: { titel: "Angebot", nr: "01", person: true },
    vorne: (
      <>
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
    kopf: { titel: "Fotos", nr: "4" },
    vorne: (
      <>
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
    kopf: { titel: "Rechnung", nr: "01", person: true },
    vorne: (
      <>
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
    kopf: { titel: "Zahlungen" },
    vorne: (
      <>
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
    kopf: { titel: "Kalender" },
    vorne: (
      <>
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
    kopf: { titel: "Plantafel" },
    vorne: (
      <>
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
    kopf: { titel: "Mitarbeiter", nr: "01", person: true },
    vorne: (
      <>
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
    kopf: { titel: "Zeiten", nr: "8:15" },
    vorne: (
      <>
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
    kopf: { titel: "Nachweis" },
    vorne: (
      <>
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
    kopf: { titel: "Schulung" },
    vorne: (
      <>
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
    kopf: { titel: "Material" },
    vorne: (
      <>
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
    kopf: { titel: "Lager" },
    vorne: (
      <>
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
    kopf: { titel: "Bestellung", nr: "01" },
    vorne: (
      <>
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
    kopf: { titel: "Werkzeug" },
    vorne: (
      <>
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
    kopf: { titel: "Fahrzeug" },
    vorne: (
      <>
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
    kopf: { titel: "Auswertung" },
    vorne: (
      <>
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
    kopf: { titel: "Heute erledigt" },
    vorne: (
      <>
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

  // ---------- App: vorne ein Handy
  "handy-einsaetze": {
    icon: "calendar",
    kopf: { titel: "Heute" },
    form: "handy",
    vorne: (
      <>
        {["07:00", "11:30", "14:00"].map((zeit, i) => {
          const y = 46 + i * 32;
          return (
            <g key={zeit}>
              <rect x={HL} y={y} width={72} height={27} rx={5} strokeWidth={i === 0 ? 1 : 0} className={i === 0 ? "fill-signal-soft stroke-primary" : "fill-sand"} />
              <text x={HL + 5} y={y + 10.5} fontSize={8} fontWeight={700} className="font-display fill-ink">
                {zeit}
              </text>
              <rect x={HL + 5} y={y + 16} width={46 - i * 6} height={4} rx={2} className="fill-white" />
              <circle cx={HR - 7} cy={y + 8} r={3} className={i < 2 ? "fill-primary" : "fill-muted/40"} />
            </g>
          );
        })}
      </>
    ),
  },
  "handy-unterwegs": {
    icon: "route",
    kopf: { titel: "Einsatz", nr: "07:00" },
    form: "handy",
    vorne: (
      <>
        <rect x={HL} y={46} width={72} height={44} rx={6} className="fill-sand" />
        <path d={`M${HL} 72 H${HR} M150 46 V90`} fill="none" strokeWidth={4} className="stroke-white" />
        <path d="M132 84 L150 72 V58 H182" fill="none" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="stroke-primary" />
        <circle cx={132} cy={84} r={3} strokeWidth={1.5} className="fill-white stroke-primary" />
        <path d="M182 60 c-4 -4 -6 -6.5 -6 -9 a6 6 0 0 1 12 0 c0 2.5 -2 5 -6 9 Z" className="fill-primary" />
        <circle cx={182} cy={51} r={2.2} className="fill-white" />
        <Balken x={HL} y={98} b={60} ton="dunkel" />
        <Balken x={HL} y={108} b={44} />
        <rect x={HL} y={121} width={34} height={17} rx={5} className="fill-primary" />
        <Glyphe name="route" x={HL + 11} y={123.5} ton="weiss" />
        <rect x={HL + 38.5} y={121.5} width={33} height={16} rx={5} strokeWidth={1} className="fill-white stroke-line-dark/60" />
        <Glyphe name="phone" x={HL + 49} y={123.5} ton="dunkel" />
      </>
    ),
  },
  "handy-vor-ort": {
    icon: "camera",
    kopf: { titel: "Auftrag" },
    form: "handy",
    vorne: (
      <>
        <Balken x={HL} y={46} b={64} ton="dunkel" />
        <Balken x={HL} y={56} b={48} />
        <Kaestchen x={HL} y={68} an />
        <Balken x={HL + 14} y={70} b={50} />
        <Kaestchen x={HL} y={82} an={false} />
        <Balken x={HL + 14} y={84} b={40} />
        {(["camera", "mic", "box"] as IconName[]).map((name, i) => (
          <g key={name}>
            <rect x={HL + i * 25} y={98} width={22} height={22} rx={5} className="fill-signal-soft" />
            <Glyphe name={name} x={HL + i * 25 + 4.5} y={102.5} groesse={13} />
          </g>
        ))}
        <Knopf x={HL} y={127} b={72} text="Starten" />
      </>
    ),
  },
  "handy-abschluss": {
    icon: "signature",
    kopf: { titel: "Abnahme" },
    form: "handy",
    vorne: (
      <>
        <rect x={HL} y={46} width={72} height={56} rx={6} className="fill-sand" />
        <path
          d="M134 86 c5 -2 6 -16 10 -16 s-2 18 4 18 s6 -12 10 -12 s1 10 5 10 s6 -5 9 -5"
          fill="none"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-ink/80"
        />
        <line x1={HL + 6} y1={94} x2={HR - 6} y2={94} strokeWidth={1} strokeDasharray="2 2" className="stroke-muted/50" />
        <Balken x={HL} y={110} b={56} ton="dunkel" />
        <Balken x={HL} y={119} b={40} />
        <Knopf x={HL} y={129} b={72} text="Abschließen" />
      </>
    ),
  },
  "handy-kamera": {
    icon: "camera",
    form: "handy",
    vorne: (
      <>
        <rect x={HL} y={30} width={72} height={96} rx={5} className="fill-sand" />
        <path d="M128 122 l20 -28 l12 14 l10 -10 l22 24 Z" className="fill-muted/30" />
        <circle cx={182} cy={50} r={5} className="fill-muted/30" />
        <path
          d="M142 64 V56 H150 M170 56 H178 V64 M178 88 V96 H170 M150 96 H142 V88"
          fill="none"
          strokeWidth={1.6}
          strokeLinecap="round"
          className="stroke-primary"
        />
        <rect x={HL + 4} y={34} width={36} height={11} rx={5.5} className="fill-white" />
        <text x={HL + 22} y={41.8} textAnchor="middle" fontSize={7} fontWeight={700} className="font-display fill-ink">
          Haus 24
        </text>
        {[0, 1, 2].map((i) => (
          <rect key={i} x={HL + i * 25} y={132} width={22} height={14} rx={3} strokeWidth={i === 0 ? 1 : 0} className={i === 0 ? "fill-signal-soft stroke-primary" : "fill-sand"} />
        ))}
      </>
    ),
  },
  "handy-sprache": {
    icon: "mic",
    kopf: { titel: "Notiz" },
    form: "handy",
    vorne: (
      <>
        <rect x={HL} y={46} width={72} height={16} rx={8} className="fill-signal-soft" />
        <circle cx={HL + 9} cy={54} r={3} className="fill-primary" />
        <text x={HL + 17} y={57} fontSize={7.5} fontWeight={700} className="font-display fill-signal">
          Aufnahme 0:12
        </text>
        {[4, 10, 18, 12, 24, 16, 20, 10, 16, 8, 4].map((h, i) => (
          <rect key={i} x={HL + 3 + i * 6.3} y={84 - h / 2} width={3} height={h} rx={1.5} className={i < 7 ? "fill-primary" : "fill-line"} />
        ))}
        <rect x={HL} y={104} width={72} height={36} rx={6} className="fill-sand" />
        <Balken x={HL + 6} y={111} b={58} ton="weiss" />
        <Balken x={HL + 6} y={120} b={46} ton="weiss" />
        <Balken x={HL + 6} y={129} b={52} ton="weiss" />
      </>
    ),
  },
  "handy-navigation": {
    icon: "map",
    form: "handy",
    vorne: (
      <>
        <rect x={HL} y={30} width={72} height={116} rx={5} className="fill-sand" />
        <path d={`M${HL} 62 H${HR} M${HL} 104 H${HR} M146 30 V146 M180 30 V146 M${HL} 140 L160 104`} fill="none" strokeWidth={5} className="stroke-white" />
        <path d="M131 135 L160 104 H180 V64" fill="none" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="stroke-primary" />
        <circle cx={131} cy={135} r={3.5} strokeWidth={2} className="fill-white stroke-primary" />
        <path d="M180 66 c-5 -5 -7.5 -8 -7.5 -11 a7.5 7.5 0 0 1 15 0 c0 3 -2.5 6 -7.5 11 Z" className="fill-primary" />
        <circle cx={180} cy={55} r={2.8} className="fill-white" />
        <rect x={HL + 4} y={34} width={40} height={12} rx={6} className="fill-white" />
        <text x={HL + 24} y={42.5} textAnchor="middle" fontSize={7.5} fontWeight={700} className="font-display fill-ink">
          12 Min.
        </text>
      </>
    ),
  },
  "handy-kontakte": {
    icon: "smartphone",
    kopf: { titel: "Kontakte" },
    form: "handy",
    vorne: (
      <>
        {[40, 32, 44, 28].map((b, i) => {
          const y = 48 + i * 23;
          return (
            <g key={i}>
              <Person cx={HL + 7} cy={y + 8} r={7} />
              <Balken x={HL + 19} y={y + 2} b={b} ton="dunkel" />
              <Balken x={HL + 19} y={y + 10} b={b - 10} />
              {i < 3 && (
                <g>
                  <circle cx={HR - 5} cy={y + 8} r={4.5} className="fill-primary" />
                  <Haken x={HR - 9.5} y={y + 3.5} />
                </g>
              )}
            </g>
          );
        })}
      </>
    ),
  },

  // ---------- Grundsätze von „Macher erledigt“
  freigabe: {
    icon: "check",
    kopf: { titel: "Vorschlag" },
    vorne: (
      <>
        <rect x={L - 4} y={56} width={108} height={36} rx={6} className="fill-signal-soft" />
        <Glyphe name="spark" x={L + 1} y={59} groesse={11} />
        <Balken x={L + 16} y={62} b={70} ton="gruen-hell" />
        <Balken x={L + 1} y={73} b={84} ton="gruen-hell" />
        <Balken x={L + 1} y={82} b={56} ton="gruen-hell" />
        <Knopf x={L} y={102} b={48} text="Freigeben" />
        <Knopf x={L + 52} y={102} b={48} text="Ändern" gefuellt={false} />
        <Balken x={L} y={130} b={70} />
        <Balken x={L} y={140} b={48} />
      </>
    ),
  },
  stufen: {
    icon: "layers",
    kopf: { titel: "Einstellungen" },
    vorne: (
      <>
        {[2, 1, 0, 2].map((stufe, i) => {
          const y = 57 + i * 22;
          const an = ["fill-white stroke-line-dark/60", "fill-signal-soft stroke-primary", "fill-primary stroke-primary"][stufe];
          return (
            <g key={i}>
              <Balken x={L} y={y + 4} b={[36, 30, 40, 26][i]} ton="dunkel" />
              <rect x={R - 60} y={y} width={60} height={13} rx={6.5} className="fill-sand" />
              <rect x={R - 60 + stufe * 20 + 1.5} y={y + 1.5} width={17} height={10} rx={5} strokeWidth={1} className={an} />
            </g>
          );
        })}
      </>
    ),
  },
  verlauf: {
    icon: "clipboard",
    kopf: { titel: "Verlauf" },
    vorne: (
      <>
        <line x1={L + 4} y1={60} x2={L + 4} y2={136} strokeWidth={1.5} className="stroke-line" />
        {["17:00", "15:46", "12:05", "09:30"].map((zeit, i) => {
          const y = 60 + i * 22;
          return (
            <g key={zeit}>
              <circle cx={L + 4} cy={y} r={4} strokeWidth={1.2} className={i === 0 ? "fill-primary stroke-primary" : "fill-white stroke-primary"} />
              <text x={L + 14} y={y + 3} fontSize={7.5} fontWeight={700} className="font-display fill-muted">
                {zeit}
              </text>
              <Balken x={L + 40} y={y - 2} b={[56, 48, 52, 40][i]} ton="dunkel" />
              <Balken x={L + 14} y={y + 8} b={[70, 60, 76, 50][i]} />
            </g>
          );
        })}
      </>
    ),
  },
  ehrlich: {
    icon: "shield",
    kopf: { titel: "Nachricht" },
    vorne: (
      <>
        <rect x={L} y={56} width={72} height={28} rx={8} className="fill-sand" />
        <path d={`M${L + 8} 83 l-2 8 l10 -8 Z`} className="fill-sand" />
        <Balken x={L + 8} y={63} b={52} ton="weiss" />
        <Balken x={L + 8} y={73} b={38} ton="weiss" />
        <rect x={L + 22} y={96} width={78} height={30} rx={8} className="fill-signal-soft" />
        <path d={`M${R - 10} 125 l4 8 l-12 -8 Z`} className="fill-signal-soft" />
        <Balken x={L + 30} y={103} b={58} ton="gruen-hell" />
        <Balken x={L + 30} y={113} b={44} ton="gruen-hell" />
        <rect x={L} y={112} width={14} height={14} rx={4} className="fill-primary" />
        <text x={L + 7} y={122.5} textAnchor="middle" fontSize={8.5} fontWeight={900} className="font-display fill-white">
          M
        </text>
        <Pille x={L + 22} y={133} b={78} text="Digitaler Assistent" />
      </>
    ),
  },

  // ---------- Daten übernehmen
  dokumente: {
    icon: "file",
    kopf: { titel: "Dokumente" },
    vorne: (
      <>
        {["PDF", "PDF", "JPG", "DWG"].map((art, i) => {
          const y = 56 + i * 20;
          return (
            <g key={i}>
              <path d={`M${L} ${y} h8 l4 4 v11 h-12 Z`} strokeWidth={0.9} strokeLinejoin="round" className="fill-white stroke-primary" />
              <path d={`M${L + 8} ${y} v4 h4`} fill="none" strokeWidth={0.9} strokeLinejoin="round" className="stroke-primary" />
              <Balken x={L + 18} y={y + 5} b={[52, 44, 58, 40][i]} ton="dunkel" />
              <Pille x={R - 24} y={y + 1.5} b={24} text={art} ton="neutral" />
            </g>
          );
        })}
      </>
    ),
  },
  tabelle: {
    icon: "layers",
    kopf: { titel: "Tabelle", nr: "CSV" },
    vorne: (
      <>
        {[0, 1, 2, 3, 4, 5].flatMap((z) =>
          [0, 1, 2, 3].map((sp) => {
            const x = L + sp * 25.5;
            const y = 55 + z * 14;
            return z === 0 ? (
              <g key={`${z}-${sp}`}>
                <rect x={x} y={y} width={23} height={11} rx={2.5} strokeWidth={0.8} className="fill-signal-soft stroke-primary" />
                <rect x={x + 4} y={y + 4} width={15} height={3} rx={1.5} className="fill-primary/50" />
              </g>
            ) : (
              <rect key={`${z}-${sp}`} x={x} y={y} width={23} height={11} rx={2.5} className="fill-sand" />
            );
          }),
        )}
      </>
    ),
  },
  "software-export": {
    icon: "monitor",
    kopf: { titel: "Export" },
    vorne: (
      <>
        <rect x={L + 0.5} y={54.5} width={99} height={46} rx={5} strokeWidth={1} className="fill-white stroke-ink/30" />
        <path d={`M${L + 1} 66 V59 a4 4 0 0 1 4 -4 H${R - 5} a4 4 0 0 1 4 4 V66 Z`} className="fill-muted/25" />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={L + 7 + i * 6} cy={60.5} r={1.8} className="fill-white" />
        ))}
        <rect x={L + 4} y={77} width={92} height={10} rx={2} className="fill-sand" />
        <Balken x={L + 7} y={70.5} b={60} />
        <Balken x={L + 7} y={79.5} b={74} ton="dunkel" />
        <Balken x={L + 7} y={89.5} b={50} />
        <path d="M160 105 V118 M155 113.5 l5 5 l5 -5" fill="none" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="stroke-primary" />
        {[0, 1].flatMap((z) =>
          [0, 1, 2, 3].map((sp) => (
            <rect
              key={`${z}-${sp}`}
              x={L + 9 + sp * 21}
              y={123 + z * 11}
              width={19}
              height={9}
              rx={2}
              strokeWidth={z === 0 ? 0.7 : 0}
              className={z === 0 ? "fill-signal-soft stroke-primary" : "fill-sand"}
            />
          )),
        )}
      </>
    ),
  },
  datanorm: {
    icon: "warehouse",
    kopf: { titel: "Preisliste" },
    vorne: (
      <>
        <rect x={L - 4} y={80} width={108} height={13} rx={3} className="fill-signal-soft" />
        {[44, 36, 50, 40, 46].map((b, i) => {
          const y = 56 + i * 13;
          return (
            <g key={i}>
              <Balken x={L} y={y} b={16} ton="dunkel" />
              <Balken x={L + 21} y={y} b={b} ton={i === 2 ? "gruen-hell" : "hell"} />
              <Balken x={R - 20} y={y} b={20} ton={i === 2 ? "gruen" : "dunkel"} />
            </g>
          );
        })}
        <Glyphe name="truck" x={L} y={121} groesse={16} />
        <Balken x={L + 22} y={127} b={50} ton="dunkel" />
      </>
    ),
  },

  // ---------- Weitere Funktionen mit eigenem Motiv
  orte: {
    icon: "map",
    kopf: { titel: "Baustelle" },
    vorne: (
      <>
        <rect x={L} y={55} width={100} height={46} rx={6} className="fill-sand" />
        <path d={`M${L} 80 H${R} M150 55 V101 M${L + 18} 55 L${L + 64} 101`} fill="none" strokeWidth={4} className="stroke-white" />
        <path d="M182 78 c-4.5 -4.5 -7 -7.5 -7 -10 a7 7 0 0 1 14 0 c0 2.5 -2.5 5.5 -7 10 Z" className="fill-primary" />
        <circle cx={182} cy={68} r={2.5} className="fill-white" />
        <Glyphe name="home" x={L} y={109} groesse={11} />
        <Balken x={L + 16} y={112} b={62} ton="dunkel" />
        <Glyphe name="user" x={L} y={124} groesse={11} />
        <Balken x={L + 16} y={127} b={48} />
      </>
    ),
  },
  nachrichten: {
    icon: "chat",
    kopf: { titel: "Nachrichten", person: true },
    vorne: (
      <>
        <rect x={L} y={56} width={64} height={22} rx={8} className="fill-sand" />
        <Balken x={L + 7} y={62.5} b={44} ton="weiss" />
        <Balken x={L + 7} y={70} b={30} ton="weiss" />
        <rect x={L + 30} y={84} width={70} height={22} rx={8} className="fill-primary" />
        <Balken x={L + 37} y={90.5} b={48} ton="weiss" />
        <Balken x={L + 37} y={98} b={34} ton="weiss" />
        <rect x={L} y={112} width={52} height={16} rx={8} className="fill-sand" />
        <Balken x={L + 7} y={117.5} b={36} ton="weiss" />
        <rect x={L + 0.5} y={134.5} width={99} height={12} rx={6} strokeWidth={1} className="fill-white stroke-line" />
        <Balken x={L + 6} y={138} b={40} />
      </>
    ),
  },
  kundenbereich: {
    icon: "link",
    form: "handy",
    kopf: { titel: "Dein Auftrag" },
    vorne: (
      <>
        <line x1={HL + 6} y1={54} x2={HL + 66} y2={54} strokeWidth={1.5} className="stroke-line" />
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <circle
              cx={HL + 6 + i * 20}
              cy={54}
              r={5}
              strokeWidth={1.2}
              className={i < 2 ? "fill-primary stroke-primary" : i === 2 ? "fill-white stroke-primary" : "fill-white stroke-line-dark/60"}
            />
            {i < 2 && <Haken x={HL + 1.5 + i * 20} y={49.5} />}
          </g>
        ))}
        {[44, 36, 40].map((b, i) => {
          const y = 68 + i * 18;
          return (
            <g key={i}>
              <path d={`M${HL} ${y} h7 l3 3 v10 h-10 Z`} strokeWidth={0.9} strokeLinejoin="round" className="fill-white stroke-primary" />
              <Balken x={HL + 15} y={y + 4} b={b} ton="dunkel" />
            </g>
          );
        })}
        <Knopf x={HL} y={126} b={72} text="Unterschreiben" />
      </>
    ),
  },
  bewertungen: {
    icon: "award",
    kopf: { titel: "Bewertung", person: true },
    vorne: (
      <>
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i} d={stern(L + 7 + i * 17, 64, 7)} className={i < 4 ? "fill-primary" : "fill-primary/25"} />
        ))}
        <rect x={L} y={80} width={100} height={42} rx={8} className="fill-sand" />
        <Balken x={L + 8} y={88} b={80} ton="weiss" />
        <Balken x={L + 8} y={98} b={70} ton="weiss" />
        <Balken x={L + 8} y={108} b={48} ton="weiss" />
        <Pille x={L} y={130} b={56} text="Empfehlung" />
      </>
    ),
  },
  schnittstellen: {
    icon: "link",
    kopf: { titel: "Schnittstellen" },
    vorne: (
      <>
        <g fill="none" strokeWidth={1.2} strokeDasharray="2.5 2" className="stroke-primary/70">
          <path d={`M160 96 L${L + 36} 65 M160 96 L${R - 36} 65 M160 96 L${L + 36} 133 M160 96 L${R - 36} 133`} />
        </g>
        {(
          [
            [L, 58, "DATEV"],
            [R - 36, 58, "GAEB"],
            [L, 126, "IDS"],
            [R - 36, 126, "API"],
          ] as [number, number, string][]
        ).map(([x, y, text]) => (
          <g key={text}>
            <rect x={x} y={y} width={36} height={14} rx={4} className="fill-sand" />
            <text x={x + 18} y={y + 9.8} textAnchor="middle" fontSize={7} fontWeight={700} className="font-display fill-ink">
              {text}
            </text>
          </g>
        ))}
        <rect x={148} y={84} width={24} height={24} rx={6} className="fill-primary" />
        <text x={160} y={100.5} textAnchor="middle" fontSize={12} fontWeight={900} className="font-display fill-white">
          M
        </text>
      </>
    ),
  },
  cloud: {
    icon: "layers",
    kopf: { titel: "Cloud" },
    vorne: (
      <>
        <path
          d="M140 90 a10 10 0 0 1 1 -19.9 a14 14 0 0 1 26.5 -3.6 a11 11 0 0 1 15.5 10.5 a8.6 8.6 0 0 1 -1.5 13 Z"
          strokeWidth={1.2}
          className="fill-signal-soft stroke-primary"
        />
        <path d="M153 79 l4.5 4.5 l9 -9" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="stroke-primary" />
        <path d={`M150 94 L${L + 22} 106 M170 94 L${R - 16} 104`} fill="none" strokeWidth={1.1} strokeDasharray="2 2" className="stroke-primary/60" />
        <rect x={L + 2.5} y={108.5} width={40} height={24} rx={3} strokeWidth={1.2} className="fill-white stroke-ink/50" />
        <line x1={L - 2} y1={134} x2={L + 47} y2={134} strokeWidth={2} strokeLinecap="round" className="stroke-ink/50" />
        <Balken x={L + 8} y={114} b={26} />
        <Balken x={L + 8} y={122} b={18} />
        <rect x={R - 26.5} y={104.5} width={20} height={32} rx={4} strokeWidth={1.2} className="fill-white stroke-ink/50" />
        <rect x={R - 22} y={111} width={11} height={4} rx={2} className="fill-line" />
        <rect x={R - 22} y={118} width={8} height={4} rx={2} className="fill-line" />
      </>
    ),
  },
  terminbuchung: {
    icon: "link",
    form: "handy",
    kopf: { titel: "Termin buchen" },
    vorne: (
      <>
        {["12", "13", "14", "15"].map((tag, i) => (
          <g key={tag}>
            <rect x={HL + i * 18.7} y={47} width={16} height={20} rx={4} className={i === 1 ? "fill-primary" : "fill-sand"} />
            <text x={HL + i * 18.7 + 8} y={60} textAnchor="middle" fontSize={7.5} fontWeight={700} className={`font-display ${i === 1 ? "fill-white" : "fill-ink"}`}>
              {tag}
            </text>
          </g>
        ))}
        {["08:00", "09:30", "11:00", "13:00", "14:30", "16:00"].map((zeit, i) => {
          const x = HL + (i % 2) * 37;
          const y = 75 + Math.floor(i / 2) * 17;
          const an = i === 2;
          return (
            <g key={zeit}>
              <rect x={x + 0.5} y={y + 0.5} width={34} height={13} rx={4} strokeWidth={1} className={an ? "fill-signal-soft stroke-primary" : "fill-white stroke-line-dark/40"} />
              <text x={x + 17.5} y={y + 9.6} textAnchor="middle" fontSize={7} fontWeight={700} className={`font-display ${an ? "fill-signal" : "fill-ink"}`}>
                {zeit}
              </text>
            </g>
          );
        })}
        <Knopf x={HL} y={129} b={72} text="Buchen" />
      </>
    ),
  },
} satisfies Record<string, Motiv>;

type BasisMotiv = keyof typeof motive;

/** Funktion ohne eigenes Motiv: zeigt ein verwandtes Motiv mit eigenem Titel und Icon. */
type Ableitung = { basis: BasisMotiv; titel?: string; nr?: string | null; icon: IconName };

const ableitungen: Record<Exclude<SkizzenMotiv, BasisMotiv>, Ableitung> = {
  anlagen: { basis: "werkzeuge", titel: "Anlage", icon: "wrench" },
  besichtigungen: { basis: "aufmass", titel: "Besichtigung", icon: "camera" },
  aufgaben: { basis: "automatisch-erledigen", titel: "Aufgaben", icon: "check" },
  checklisten: { basis: "auftraege", titel: "Checkliste", nr: null, icon: "clipboard" },
  arbeitsanweisungen: { basis: "schulungen", titel: "Anleitung", icon: "book" },
  "schnell-erfassen": { basis: "handy-sprache", titel: "Erfassen", icon: "bolt" },
  berichte: { basis: "angebote", titel: "Bericht", icon: "clipboard" },
  zusatzleistungen: { basis: "kalkulation", titel: "Zusatzarbeit", icon: "plus" },
  abnahme: { basis: "handy-abschluss", icon: "signature" },
  mahnungen: { basis: "zahlungen", titel: "Mahnung", icon: "bell" },
  finanzen: { basis: "auswertung", titel: "Finanzen", icon: "euro" },
  wartung: { basis: "kalender", titel: "Wartung", icon: "wrench" },
  servicevertraege: { basis: "angebote", titel: "Vertrag", icon: "signature" },
  reklamationen: { basis: "dokumentation", titel: "Mangel", nr: "2", icon: "shield" },
  "wiederkehrende-termine": { basis: "kalender", titel: "Turnus", icon: "clock" },
  "automatische-planung": { basis: "einsatzplanung", titel: "Vorschlag", icon: "spark" },
  auslastung: { basis: "auswertung", titel: "Auslastung", icon: "chart" },
  "fahrt-route": { basis: "handy-navigation", icon: "map" },
  "mein-tag": { basis: "handy-einsaetze", titel: "Mein Tag", icon: "smartphone" },
  "baustellen-app": { basis: "handy-vor-ort", icon: "smartphone" },
  "urlaub-krankheit": { basis: "kalender", titel: "Urlaub", icon: "calendar" },
  "rollen-rechte": { basis: "stufen", titel: "Rechte", icon: "shield" },
  unterweisungen: { basis: "qualifikationen", titel: "Unterweisung", icon: "signature" },
  einarbeitung: { basis: "auftraege", titel: "Einarbeitung", nr: null, icon: "clipboard" },
  bewerber: { basis: "mitarbeiter", titel: "Bewerber", icon: "user" },
  subunternehmer: { basis: "kunden", titel: "Partner", icon: "users" },
  materialbedarf: { basis: "material", titel: "Bedarf", icon: "cart" },
  belege: { basis: "rechnungen", titel: "Beleg", icon: "file" },
  buchhaltung: { basis: "software-export", titel: "Buchhaltung", icon: "book" },
  maschinen: { basis: "werkzeuge", titel: "Maschine", icon: "bolt" },
  pruefungen: { basis: "werkzeuge", titel: "Prüfung", icon: "shield" },
  nachkalkulation: { basis: "kalkulation", titel: "Nachkalkulation", icon: "chart" },
  auftragsablaeufe: { basis: "verlauf", titel: "Ablauf", icon: "route" },
  firmenwissen: { basis: "schulungen", titel: "Wissen", icon: "book" },
  dokumentenmanagement: { basis: "dokumente", titel: "Ablage", icon: "layers" },
  "digitale-unterschrift": { basis: "angebote", titel: "Unterschrift", icon: "signature" },
  datev: { basis: "software-export", titel: "DATEV", icon: "download" },
  "daten-uebernehmen": { basis: "tabelle", icon: "layers" },
  gaeb: { basis: "tabelle", titel: "LV", nr: "GAEB", icon: "layers" },
  "ids-connect": { basis: "einkauf", titel: "Bestellung", nr: "IDS", icon: "cart" },
  "macher-fragen": { basis: "ehrlich", titel: "Frage", icon: "spark" },
  "ki-buerokraft": { basis: "automatisch-erledigen", titel: "KI-Bürokraft", icon: "spark" },
  "telefon-ki": { basis: "telefon", titel: "KI-Anruf", icon: "phone" },
};

function motivFuer(name: SkizzenMotiv): Motiv {
  if (name in motive) return motive[name as BasisMotiv];
  const a = ableitungen[name as Exclude<SkizzenMotiv, BasisMotiv>];
  const basis: Motiv = motive[a.basis];
  const kopf = basis.kopf ?? (a.titel ? { titel: a.titel } : undefined);
  return {
    ...basis,
    icon: a.icon,
    kopf: kopf && { ...kopf, titel: a.titel ?? kopf.titel, nr: a.nr === null ? undefined : (a.nr ?? kopf.nr) },
  };
}

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
  const m = motivFuer(motiv);
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
          {m.form === "handy" ? (
            <>
              <rect x={116} y={14} width={88} height={164} rx={15} strokeWidth={3} className="fill-white stroke-ink/70" />
              <rect x={150} y={20} width={20} height={4} rx={2} className="fill-ink/70" />
            </>
          ) : (
            <rect x={100} y={22} width={120} height={148} rx={9} strokeWidth={1} className="fill-white stroke-line" />
          )}
          {m.kopf && (m.form === "handy" ? <HandyKopf {...m.kopf} /> : <Kopf {...m.kopf} />)}
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
