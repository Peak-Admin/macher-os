import type { Ton } from "@/content/funktionen";

/** Farbiger Balken / Punkt pro Ton. */
export const tonBalken: Record<Ton, string> = {
  signal: "bg-signal",
  moss: "bg-moss",
  sky: "bg-sky",
  ink: "bg-ink",
  sand: "bg-line",
};

/** Kleines Etikett pro Ton. */
export const tonEtikett: Record<Ton, string> = {
  signal: "bg-signal-soft text-signal-dark",
  moss: "bg-moss-soft text-moss",
  sky: "bg-sky-soft text-sky",
  ink: "bg-ink text-white",
  sand: "bg-sand text-muted",
};

/** Hinweisbox pro Ton. */
export const tonHinweis: Record<"signal" | "moss" | "sky", { box: string; titel: string }> = {
  signal: { box: "border-signal/40 bg-signal-soft", titel: "text-signal-dark" },
  moss: { box: "border-moss/30 bg-moss-soft", titel: "text-moss" },
  sky: { box: "border-sky/30 bg-sky-soft", titel: "text-sky" },
};
