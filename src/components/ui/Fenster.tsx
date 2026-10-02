import { FensterSkizze } from "@/os/ui/fenster";
import { glasName, type IconName } from "./Icon";

/**
 * Fenster-Skizze für Website-Karten: Drahtgitter eines App-Fensters (oder Handys) mit Glas-Icon in der Mitte.
 * Für Einstiegs- und Teaserkarten (Hilfe, Schnittstellen, „Kommt bald“). Hell auf der ruhigen Fläche,
 * dunkel direkt auf dunklen Karten. Regeln: docs/design/festlegungen.md („Fenster-Skizze“).
 */
export function Fenster({
  icon,
  ton = "hell",
  flaeche = "sand",
  rahmen = "fenster",
  className = "",
}: {
  icon: IconName;
  ton?: "hell" | "dunkel";
  /** Grund der hellen Variante: `sand` auf weißen Karten, `weiss` auf getönten Karten (paper, beige) */
  flaeche?: "sand" | "weiss";
  rahmen?: "fenster" | "handy";
  className?: string;
}) {
  const grund =
    ton === "dunkel"
      ? "bg-white/[0.03] text-white ring-1 ring-inset ring-white/10"
      : flaeche === "weiss"
        ? "bg-white text-ink ring-1 ring-inset ring-line"
        : "bg-sand text-ink";
  return (
    <span aria-hidden className={`block overflow-hidden rounded-xl [&>svg]:mx-auto [&>svg]:max-w-[26rem] ${grund} ${className}`}>
      <FensterSkizze icon={glasName(icon) ?? "info"} rahmen={rahmen} />
    </span>
  );
}
