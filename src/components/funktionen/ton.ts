import type { Ton } from "@/content/funktionen";
import type { StatusTon } from "@/components/mocks/AppFenster";

/**
 * Ton aus den Inhalten → Status wie in der Software: Neutral als Standard, Grün für Erledigtes,
 * Gelb für „kümmer dich drum“, Rot nur für echte Gefahr (z. B. „dringend“, „überfällig“).
 */
export const tonStatus: Record<Ton, StatusTon> = {
  signal: "warnung",
  moss: "erfolg",
  sky: "neutral",
  ink: "neutral",
  sand: "neutral",
  gefahr: "gefahr",
};

/** Hinweisbox pro Ton – ruhige Fläche wie in der Software, kein Rahmen in Akzentfarbe. */
export const tonHinweis: Record<"signal" | "moss" | "sky", { box: string; titel: string }> = {
  signal: { box: "bg-signal-soft", titel: "text-signal-dark" },
  moss: { box: "bg-signal-soft", titel: "text-moss" },
  sky: { box: "bg-app-ruhig", titel: "text-ink" },
};
