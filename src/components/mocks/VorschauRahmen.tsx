import type { ReactNode } from "react";

/**
 * Grüner Rahmen für Produktansichten der Website: tiefes Waldgrün wie gespannter Stoff, darin die Oberfläche
 * als deckendes, helles Fenster (Stile `.vorschau-rahmen` in src/app/globals.css). Der Rahmen ist reine Bühne –
 * Daten und Bedienung liegen immer auf der hellen Fläche, nie auf dem Grün.
 */
export function VorschauRahmen({
  children,
  hinweis,
  className = "",
}: {
  children: ReactNode;
  /** Kurzer Satz unter dem Fenster, z. B. „Klick dich durch – alles Beispieldaten.“ */
  hinweis?: string;
  className?: string;
}) {
  return (
    <figure className={`vorschau-rahmen ${className}`}>
      {children}
      {hinweis && <figcaption className="mt-3 text-center text-sm text-on-dark/80">{hinweis}</figcaption>}
    </figure>
  );
}
