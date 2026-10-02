import { Icon, type IconName } from "@/components/ui";

/**
 * Stilisierte Produktansicht (kein Screenshot) – zeigt die vier Bereiche
 * Heute · Aufträge · Plan · Betrieb. Rein dekorativ.
 */
export function ProductMock({ active = "Heute" }: { active?: "Heute" | "Aufträge" | "Plan" | "Betrieb" }) {
  const tabs: { label: typeof active; icon: IconName }[] = [
    { label: "Heute", icon: "home" },
    { label: "Aufträge", icon: "clipboard" },
    { label: "Plan", icon: "calendar" },
    { label: "Betrieb", icon: "layers" },
  ];
  return (
    <div
      role="img"
      aria-label="Produktansicht von Macher OS mit den Bereichen Heute, Aufträge, Plan und Betrieb"
      className="relative rounded-2xl border border-ink/10 bg-white shadow-2xl shadow-ink/15"
    >
      <div className="flex items-center gap-1.5 border-b border-line px-4 py-3">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 text-xs font-semibold text-muted">Macher OS</span>
      </div>
      <div className="grid grid-cols-[auto_1fr]">
        <nav className="flex flex-col gap-1 border-r border-line p-2 sm:w-36 sm:p-3">
          {tabs.map((t) => (
            <span
              key={t.label}
              className={`flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold sm:px-3 sm:text-sm ${
                t.label === active ? "bg-ink text-white" : "text-muted"
              }`}
            >
              <Icon name={t.icon} className="size-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </span>
          ))}
        </nav>
        <div className="min-w-0 space-y-3 bg-paper/60 p-3 sm:p-5">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-display text-base font-bold sm:text-lg">Guten Morgen, Jana</p>
            <p className="hidden text-xs text-muted sm:block">Dienstag, 14. Oktober</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              ["3", "Einsätze heute"],
              ["2", "neue Anfragen"],
              ["4.180 €", "offen"],
            ].map(([n, l]) => (
              <div key={l} className="rounded-xl border border-line bg-white p-2.5 sm:p-3">
                <div className="font-display text-sm font-extrabold sm:text-lg">{n}</div>
                <div className="text-[0.65rem] text-muted sm:text-xs">{l}</div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-moss/30 bg-moss-soft p-3">
            <p className="flex items-center gap-1.5 text-xs font-bold text-moss">
              <Icon name="spark" className="size-3.5" /> Macher hat erledigt
            </p>
            <ul className="mt-1.5 space-y-1 text-xs text-ink-soft sm:text-sm">
              <li>✓ Anruf von Fam. Krüger aufgenommen</li>
              <li>✓ Angebot „Bad sanieren“ vorbereitet</li>
              <li>✓ Termin mit Hr. Petersen bestätigt</li>
            </ul>
          </div>
          <div className="rounded-xl border border-line bg-white">
            {[
              ["08:00", "Zählerschrank tauschen", "Lukas · Musterweg 4", "bg-sky"],
              ["11:30", "Wallbox montieren", "Ali · Lindenstr. 12", "bg-brand"],
              ["14:00", "Besichtigung Altbau", "Jana · Am Hang 7", "bg-moss"],
            ].map(([time, title, sub, color]) => (
              <div key={time} className="flex items-center gap-3 border-b border-line px-3 py-2.5 last:border-0">
                <span className={`h-8 w-1 rounded-full ${color}`} />
                <span className="w-10 text-xs font-semibold text-muted">{time}</span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold sm:text-sm">{title}</span>
                  <span className="block truncate text-[0.7rem] text-muted sm:text-xs">{sub}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning-soft p-3 text-xs sm:text-sm">
            <Icon name="box" className="size-4 shrink-0 text-warning" />
            <span>
              <b>Material fehlt:</b> 2× Fehlerstromschutzschalter für Mittwoch
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
