import Link from "next/link";
import { Icon, type IconName } from "@/components/ui";
import { funktionHref, type FunktionSlug } from "@/content/registry";

const knoten: { label: string; beispiel: string; icon: IconName; slug: FunktionSlug }[] = [
  { label: "Kunde", beispiel: "Fam. Krüger", icon: "user", slug: "kunden" },
  { label: "Termin", beispiel: "Mo, 7:30 Uhr", icon: "calendar", slug: "kalender" },
  { label: "Mitarbeiter", beispiel: "Lukas + Mia", icon: "users", slug: "einsatzplanung" },
  { label: "Material", beispiel: "WC-Element, Fliesen", icon: "box", slug: "material" },
  { label: "Fotos", beispiel: "12 Fotos, 2 Notizen", icon: "camera", slug: "dokumentation" },
  { label: "Zeiten", beispiel: "18,5 Std.", icon: "clock", slug: "zeiterfassung" },
  { label: "Rechnung", beispiel: "vorbereitet", icon: "euro", slug: "rechnungen" },
];

/** Position auf einer Ellipse um die Mitte, in Prozent. */
function position(i: number) {
  const winkel = ((-90 + (i * 360) / knoten.length) * Math.PI) / 180;
  return {
    x: Math.round((50 + 38 * Math.cos(winkel)) * 100) / 100,
    y: Math.round((50 + 39 * Math.sin(winkel)) * 100) / 100,
  };
}

/** „Ein Auftrag verbindet …“ – kleines Diagramm in HTML/CSS. */
export function VerbindungsDiagramm() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[34rem] sm:aspect-[5/4]">
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full text-line"
      >
        <ellipse cx="50" cy="50" rx="38" ry="39" fill="none" stroke="currentColor" strokeWidth={1.5} strokeDasharray="4 6" vectorEffect="non-scaling-stroke" />
        {knoten.map((k, i) => {
          const p = position(i);
          return (
            <line
              key={k.label}
              x1="50"
              y1="50"
              x2={p.x}
              y2={p.y}
              stroke="var(--color-signal)"
              strokeWidth={2}
              strokeOpacity={0.55}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>

      <div className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-lg bg-ink px-4 py-3 text-center text-white shadow-xl shadow-ink/20 sm:px-6 sm:py-4">
        <Icon name="clipboard" className="size-5 text-accent sm:size-6" />
        <span className="mt-1 font-display text-base font-extrabold sm:text-xl">Auftrag</span>
        <span className="text-[0.65rem] text-white/70 sm:text-xs">Bad sanieren</span>
      </div>

      <ul>
        {knoten.map((k, i) => {
          const p = position(i);
          return (
            <li
              key={k.label}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              <Link
                href={funktionHref(k.slug)}
                className="flex w-[5.5rem] flex-col items-center rounded-xl bg-white px-2 py-2 text-center ring-1 ring-line transition hover:ring-ink/40 sm:w-32 sm:py-2.5"
              >
                <Icon name={k.icon} className="size-4 text-signal-dark sm:size-5" />
                <span className="mt-0.5 text-xs font-bold sm:text-sm">{k.label}</span>
                <span className="hidden text-[0.7rem] leading-tight text-muted sm:block">{k.beispiel}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
