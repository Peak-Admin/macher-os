import type { ReactNode } from "react";

/**
 * UI-Ebene: ein kleiner Ausschnitt aus Macher OS auf der ruhigen Grüngrau-Fläche – die Alternative zur `Skizze`.
 * Zeigt echte Beschriftungen mit Beispieldaten, wo ein konkreter Stand mehr erklärt als eine Zeichnung
 * (z. B. „Stundenzettel kommen vom Handy“). Rein dekorativ – die Aussage steht immer im Text daneben.
 * Regeln: docs/design/festlegungen.md („Skizzen und UI-Ebenen“).
 */
export function UiEbene({
  ort,
  children,
  className = "",
}: {
  /** Kopfzeile des Ausschnitts, z. B. „Zeiten · Heute“ */
  ort: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span aria-hidden className={`relative block overflow-hidden rounded-xl bg-sand px-[7%] pt-9 ${className}`}>
      {/* Ebene dahinter: deutet an, dass der Ausschnitt aus der App stammt */}
      <span className="absolute inset-x-[14%] top-5 block h-12 rounded-xl border border-line bg-white/70" />
      <span className="relative mx-auto -mb-3 block max-w-md rounded-xl border border-line bg-white px-3.5 pb-6 pt-3 text-left text-sm text-ink shadow-[0_18px_36px_-22px_color-mix(in_srgb,var(--color-ink)_45%,transparent)] transition-[translate] duration-150 ease-out motion-safe:group-hover:-translate-y-1">
        <span className="mb-2 flex items-center gap-2 text-xs text-muted">
          <span className="inline-flex size-5 shrink-0 items-center justify-center rounded bg-primary font-display text-[11px] font-black text-white">
            M
          </span>
          <span className="truncate font-semibold">{ort}</span>
          <span className="ml-auto shrink-0 rounded-sm border border-dashed border-line-dark px-1 text-[10px] font-semibold">Beispiel</span>
        </span>
        {children}
      </span>
    </span>
  );
}

/** Zeile in der UI-Ebene: links Text, rechts optional Wert oder Status. */
export function UiZeile({ links, rechts }: { links: ReactNode; rechts?: ReactNode }) {
  return (
    <span className="flex items-center justify-between gap-2 border-b border-line py-1.5 last:border-0">
      <span className="min-w-0 truncate">{links}</span>
      {rechts}
    </span>
  );
}

/** Status in der UI-Ebene – immer mit Text, nie nur Farbe. */
export function UiStatus({ children, ton = "neutral" }: { children: ReactNode; ton?: "neutral" | "gut" | "warnung" }) {
  const t = { neutral: "bg-sand text-muted", gut: "bg-signal-soft text-moss", warnung: "bg-warning-soft text-warning" }[ton];
  return <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold ${t}`}>{children}</span>;
}
