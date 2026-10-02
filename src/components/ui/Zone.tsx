import type { ReactNode } from "react";

export type ZonenTon = "dunkel" | "beige" | "weiss";

/**
 * Klassen und Kopf-Thema einer Box. Für Bausteine, die selbst ein `<section>` rendern (Section, PageHero, FinalCta …),
 * damit jede Seite dieselbe Box-Logik wie die Startseite nutzt.
 */
export function zone(ton: ZonenTon, className = "") {
  return {
    className: `zone zone-${ton} ${ton === "dunkel" ? "markenflaeche" : ""} scroll-mt-24 ${className}`,
    "data-header-theme": ton === "dunkel" ? "dunkel" : "hell",
  } as const;
}

/**
 * Schwebende Box für einen Abschnitt der Website (nach Peak One „mk-zone“): Rand zum Fenster, große Rundung,
 * Töne im Wechsel dunkelgrün · beige · weiß. `data-header-theme` steuert das Glas des Kopfs darüber.
 * Folgen zwei helle Boxen gleichen Tons aufeinander, wechselt die zweite automatisch (globals.css).
 */
export function Zone({
  ton,
  children,
  id,
  className = "",
  label,
}: {
  ton: ZonenTon;
  children: ReactNode;
  id?: string;
  className?: string;
  /** id der Überschrift, wenn die Box selbst ein Abschnitt ist */
  label?: string;
}) {
  return label ? (
    <section id={id} aria-labelledby={label} {...zone(ton, className)}>
      {children}
    </section>
  ) : (
    <div id={id} {...zone(ton, className)}>
      {children}
    </div>
  );
}
