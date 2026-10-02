import { Icon } from "@/components/ui";
import type { HandyVisual } from "@/content/funktionen";
import { tonEtikett } from "./ton";

/** Stilisierte Handy-Ansicht einer Funktion. Rein dekorativ. */
export function FunktionsHandy({ handy, label }: { handy: HandyVisual; label: string }) {
  return (
    <div
      role="img"
      aria-label={label}
      className="mx-auto w-[270px] rounded-[2.5rem] border-[10px] border-ink bg-ink shadow-2xl shadow-ink/30"
    >
      <div className="overflow-hidden rounded-[1.8rem] bg-paper">
        <div className="flex items-center justify-between bg-ink px-5 pb-3 pt-2 text-[0.65rem] text-white/80">
          <span>9:41</span>
          <span className="h-4 w-16 rounded-full bg-ink-soft" />
          <span>100%</span>
        </div>
        <div className="space-y-3 p-4">
          <p className="text-[0.7rem] font-semibold font-tagline uppercase tracking-wider text-muted">{handy.kopf}</p>
          <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-line">
            <p className="font-display text-base font-bold leading-tight">{handy.titel}</p>
            <p className="mt-1 text-xs text-muted">{handy.sub}</p>
            {handy.tags && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {handy.tags.map((t) => (
                  <span key={t.text} className={`rounded-md px-2 py-0.5 text-[0.65rem] font-semibold ${tonEtikett[t.ton]}`}>
                    {t.text}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="divide-y divide-line rounded-lg bg-white ring-1 ring-line">
            {handy.felder.map((f) => (
              <div key={f.label} className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs">
                <span className="text-muted">{f.label}</span>
                <span className="text-right font-semibold">{f.wert}</span>
              </div>
            ))}
          </div>
          <span className="flex items-center justify-center gap-2 rounded-xl bg-signal py-3 text-sm font-bold text-white">
            <Icon name={handy.aktion.icon} className="size-4" /> {handy.aktion.text}
          </span>
        </div>
      </div>
    </div>
  );
}
