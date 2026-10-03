import { Icon } from "@/components/ui";
import type { HandyVisual } from "@/content/funktionen";
import { HandyRahmen, VorschauStatus } from "@/components/mocks/AppFenster";
import { tonStatus } from "./ton";

/** Stilisierte Handy-Ansicht einer Funktion – wie die Mitarbeiter-App. Rein dekorativ. */
export function FunktionsHandy({ handy, label }: { handy: HandyVisual; label: string }) {
  return (
    <HandyRahmen role="img" aria-label={label} kopf={handy.kopf}>
      <div className="app-lift rounded-2xl border border-app-linie bg-white p-4">
        <p className="font-display text-base font-bold leading-tight text-ink">{handy.titel}</p>
        <p className="mt-1 text-xs text-muted">{handy.sub}</p>
        {handy.tags && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {handy.tags.map((t) => (
              <VorschauStatus key={t.text} ton={tonStatus[t.ton]}>
                {t.text}
              </VorschauStatus>
            ))}
          </div>
        )}
      </div>
      <div className="app-lift divide-y divide-app-linie overflow-hidden rounded-2xl border border-app-linie bg-white">
        {handy.felder.map((f) => (
          <div key={f.label} className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs">
            <span className="text-muted">{f.label}</span>
            <span className="text-right font-semibold text-ink">{f.wert}</span>
          </div>
        ))}
      </div>
      <span className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white">
        <Icon name={handy.aktion.icon} className="size-4" /> {handy.aktion.text}
      </span>
    </HandyRahmen>
  );
}
