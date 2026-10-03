import type { InputHTMLAttributes } from "react";

/**
 * Eigene Checkbox bzw. eigener Radioknopf statt der Browser-Darstellung.
 * Das echte <input> liegt unsichtbar über der gezeichneten Box: Klick, Tastatur, Fokus und Formular bleiben nativ.
 * Stile: `.wahl*` in src/app/globals.css. Größen: `klein` (14 px, Produktansichten), `mittel` (16 px), `gross` (20 px).
 */
export function Wahl({
  typ = "checkbox",
  groesse = "gross",
  className = "",
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> & {
  typ?: "checkbox" | "radio";
  groesse?: "klein" | "mittel" | "gross";
}) {
  return (
    <span className={`wahl wahl--${groesse} ${typ === "radio" ? "wahl--rund" : ""} ${className}`}>
      <input type={typ} className="wahl-input" {...rest} />
      <span className="wahl-box" aria-hidden="true">
        {typ === "checkbox" && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
        )}
      </span>
    </span>
  );
}
