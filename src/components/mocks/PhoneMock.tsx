import { Icon } from "@/components/ui";

/** Stilisierte Mitarbeiter-App: nächster Einsatz auf der Baustelle. */
export function PhoneMock({ className = "" }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label="Macher OS App auf dem Handy: nächster Einsatz mit Navigation, Fotos und Unterschrift"
      className={`mx-auto w-[280px] rounded-[2.5rem] border-[10px] border-ink bg-ink shadow-2xl shadow-ink/30 ${className}`}
    >
      <div className="overflow-hidden rounded-[1.8rem] bg-paper">
        <div className="flex items-center justify-between bg-ink px-5 pb-3 pt-2 text-[0.65rem] text-white/80">
          <span>9:41</span>
          <span className="h-4 w-16 rounded-full bg-black" />
          <span>100%</span>
        </div>
        <div className="space-y-3 p-4">
          <p className="text-[0.7rem] font-semibold font-tagline uppercase tracking-wider text-muted">Nächster Einsatz · 11:30</p>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-line">
            <p className="font-display text-base font-bold leading-tight">Wallbox montieren</p>
            <p className="mt-1 text-xs text-muted">Fam. Petersen · Lindenstr. 12</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="rounded bg-moss-soft px-2 py-0.5 text-[0.65rem] font-semibold text-moss">
                Material im Wagen
              </span>
              <span className="rounded bg-sky-soft px-2 py-0.5 text-[0.65rem] font-semibold text-sky">
                18 Min. Fahrt
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["map", "Navigation"],
                ["camera", "Foto"],
                ["mic", "Sprechen"],
                ["box", "Material"],
              ] as const
            ).map(([icon, label]) => (
              <span
                key={label}
                className="flex flex-col items-center gap-1 rounded-xl bg-white py-3 text-[0.7rem] font-semibold ring-1 ring-line"
              >
                <Icon name={icon} className="size-5 text-signal-dark" />
                {label}
              </span>
            ))}
          </div>
          <span className="flex items-center justify-center gap-2 rounded-xl bg-signal py-3 text-sm font-bold text-white">
            <Icon name="play" className="size-4" /> Auftrag starten
          </span>
          <span className="flex items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-xs font-semibold ring-1 ring-line">
            <Icon name="signature" className="size-4" /> Unterschrift & abschließen
          </span>
        </div>
      </div>
    </div>
  );
}
