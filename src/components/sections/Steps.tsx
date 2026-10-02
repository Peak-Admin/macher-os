import type { ReactNode } from "react";

const lgCols: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
};

/** Nummerierte Schritte („So läuft es ab“). */
export function Steps({
  steps,
  className = "",
}: {
  steps: { titel: string; text?: ReactNode }[];
  className?: string;
}) {
  return (
    <ol className={`grid gap-4 sm:grid-cols-2 ${lgCols[Math.min(steps.length, 5)]} ${className}`}>
      {steps.map((s, i) => (
        <li key={s.titel} className="relative rounded-2xl border border-line bg-white p-6">
          <span className="font-display text-sm font-extrabold text-signal-dark">
            {String(i + 1).padStart(2, "0")}
          </span>
          <h3 className="mt-2 font-display text-lg font-bold leading-snug">{s.titel}</h3>
          {s.text && <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{s.text}</p>}
        </li>
      ))}
    </ol>
  );
}

/** Horizontale Prozesskette: Anfrage → Angebot → … */
export function Flow({ items, dark = false }: { items: string[]; dark?: boolean }) {
  return (
    <ol className="flex flex-wrap items-center gap-2 sm:gap-3">
      {items.map((item, i) => (
        <li key={item} className="flex items-center gap-2 sm:gap-3">
          <span
            className={`rounded px-4 py-2 text-sm font-semibold sm:text-base ${
              i === items.length - 1
                ? "bg-signal text-white"
                : dark
                  ? "bg-white/10 text-white ring-1 ring-white/20"
                  : "bg-white text-ink ring-1 ring-line"
            }`}
          >
            {item}
          </span>
          {i < items.length - 1 && (
            <span aria-hidden className={`text-lg ${dark ? "text-white/40" : "text-muted"}`}>
              →
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
