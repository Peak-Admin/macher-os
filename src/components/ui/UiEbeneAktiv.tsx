"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "./Icon";

export type UiAktivZeile = {
  links: ReactNode;
  rechts?: ReactNode;
  /** Knopf rechts; ein Klick ersetzt `rechts` durch `danach` und zeigt `meldung` */
  aktion?: { label: string; danach: ReactNode; meldung: string };
};

/**
 * UI-Ebene zum Ausprobieren: wie `UiEbene` (Ausschnitt aus Handwerk OS auf ruhiger Fläche), aber eine Zeile hat einen
 * Knopf, der etwas tut (freigeben, senden …). Beispieldaten, nichts wird gespeichert; „Von vorn“ setzt zurück.
 */
export function UiEbeneAktiv({ ort, zeilen, className = "" }: { ort: string; zeilen: UiAktivZeile[]; className?: string }) {
  const [erledigt, setErledigt] = useState<Record<number, boolean>>({});
  const meldung = zeilen.find((z, i) => erledigt[i] && z.aktion)?.aktion?.meldung;
  return (
    <div role="group" aria-label={`${ort} zum Ausprobieren (Beispiel)`} className={`relative block overflow-hidden rounded-xl bg-app-ruhig px-[7%] pt-9 ${className}`}>
      <span aria-hidden className="absolute inset-x-[14%] top-5 block h-12 rounded-xl border border-app-linie bg-white/70" />
      <div className="app-lift relative mx-auto -mb-3 block max-w-md rounded-xl border border-app-linie bg-white px-3.5 pb-6 pt-3 text-left text-sm text-ink transition-[translate] duration-150 ease-out motion-safe:group-hover:-translate-y-1">
        <p className="mb-2 flex items-center gap-2 text-xs text-muted">
          <span className="inline-flex size-5 shrink-0 items-center justify-center rounded bg-primary font-display text-[11px] font-black text-white">M</span>
          <span className="truncate font-semibold">{ort}</span>
          <span className="ml-auto shrink-0 rounded-sm border border-dashed border-line-dark px-1 text-[10px] font-semibold">Beispiel</span>
        </p>
        {zeilen.map((z, i) => (
          <div key={i} className="flex min-h-9 items-center justify-between gap-2 border-b border-app-linie py-1.5 last:border-0">
            <span className="min-w-0 truncate">{z.links}</span>
            {z.aktion && !erledigt[i] ? (
              <button
                type="button"
                onClick={() => setErledigt((e) => ({ ...e, [i]: true }))}
                className="shrink-0 rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-white transition-colors duration-150 hover:bg-primary-hover"
              >
                {z.aktion.label}
              </button>
            ) : (
              <span key={erledigt[i] ? "danach" : "vorher"} className={erledigt[i] ? "mini-ein" : undefined}>
                {erledigt[i] && z.aktion ? z.aktion.danach : z.rechts}
              </span>
            )}
          </div>
        ))}
        <p role="status" className="min-h-6 pt-1.5 text-xs font-semibold text-moss">
          {meldung && (
            <span className="mini-ein flex items-center gap-1.5">
              <Icon name="check" className="size-3.5" /> {meldung}
              <button type="button" onClick={() => setErledigt({})} className="ml-auto font-semibold text-signal-dark underline underline-offset-2">
                Von vorn
              </button>
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
