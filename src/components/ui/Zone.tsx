import type { ReactNode } from "react";

export type ZonenTon = "dunkel" | "beige" | "weiss";

/**
 * Schwebende Box für einen Abschnitt der Website (nach Peak One „mk-zone“): Rand zum Fenster, große Rundung,
 * Töne im Wechsel dunkelgrün · beige · weiß. `data-header-theme` steuert das Glas des Kopfs darüber.
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
  const klasse = `zone zone-${ton} ${ton === "dunkel" ? "markenflaeche" : ""} scroll-mt-24 ${className}`;
  const thema = ton === "dunkel" ? "dunkel" : "hell";
  return label ? (
    <section id={id} aria-labelledby={label} data-header-theme={thema} className={klasse}>
      {children}
    </section>
  ) : (
    <div id={id} data-header-theme={thema} className={klasse}>
      {children}
    </div>
  );
}
