import { Icon, type IconName } from "@/components/ui";

type Bereich = "Heute" | "Aufträge" | "Planen" | "Betrieb";

const bereiche: { label: Bereich; icon: IconName }[] = [
  { label: "Heute", icon: "home" },
  { label: "Aufträge", icon: "clipboard" },
  { label: "Planen", icon: "calendar" },
  { label: "Betrieb", icon: "layers" },
];

/** Termine aus dem Beispielbetrieb der Software (Spielwiese) – gleiche Texte wie im Produkt. */
const termine: [string, string, string, string?][] = [
  ["07:00–12:00", "Sanierung Wohnanlage, Haus 24", "Hausverwaltung Nord GmbH · Jonas, Lukas", "Bestätigt"],
  ["13:00–14:30", "Jährliche Wartung", "Familie Hoffmann · Jonas"],
  ["15:30–16:30", "Besichtigung Neubau", "Thomas Richter · Max"],
];

/**
 * Stilisierte Produktansicht (kein Screenshot) mit Beispieldaten. Sie zeigt die echte Gliederung von Macher OS:
 * dieselben vier Bereiche, dieselben Beschriftungen („Braucht deine Entscheidung“, „So einplanen“, „Heute im Betrieb“)
 * und dieselbe Farbwelt wie die Software. Keine erfundenen Kennzahlen, keine als erledigt dargestellten Vorgänge.
 */
export function ProductMock({ active = "Heute" }: { active?: Bereich }) {
  return (
    <div
      role="img"
      aria-label="Beispielansicht von Macher OS: Bereich Heute mit einer Entscheidung und den Terminen des Tages (Beispieldaten)"
      className="relative overflow-hidden rounded-xl border border-line bg-white shadow-popover"
    >
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <span className="text-xs font-semibold text-muted">Macher OS</span>
        <span className="rounded-sm border border-dashed border-line-dark px-1.5 text-[0.7rem] font-semibold text-muted">Beispieldaten</span>
      </div>
      <div className="grid grid-cols-[auto_1fr]">
        <nav className="flex flex-col gap-1 border-r border-line bg-white p-2 sm:w-40 sm:p-3">
          {bereiche.map((b) => (
            <span
              key={b.label}
              className={`flex items-center gap-2 rounded-md px-2 py-2 text-xs sm:px-3 sm:text-sm ${
                b.label === active ? "bg-signal-soft font-semibold text-signal-dark" : "font-medium text-muted"
              }`}
            >
              <Icon name={b.icon} className="size-4" />
              <span className="hidden sm:inline">{b.label}</span>
            </span>
          ))}
        </nav>
        <div className="min-w-0 space-y-4 bg-paper p-3 sm:p-5">
          <p className="font-display text-base font-bold sm:text-lg">
            Guten Morgen, Max. <span className="font-medium text-muted">Dienstag, 14. Oktober</span>
          </p>

          <div className="space-y-2">
            <p className="text-sm font-semibold sm:text-base">Braucht deine Entscheidung</p>
            <div className="rounded-xl border border-line bg-white p-3 shadow-[inset_4px_0_0_var(--color-warning)]">
              <div className="flex items-start justify-between gap-2">
                <span className="min-w-0">
                  <span className="block text-xs font-semibold sm:text-sm">Dringend einplanen: Störung, Sicherung fliegt raus</span>
                  <span className="block text-[0.7rem] text-muted sm:text-xs">Vorschlag: Jonas Becker, Mo., 12:00–13:30 Uhr</span>
                </span>
                <span className="flex shrink-0 items-center gap-1 rounded-sm bg-warning-soft px-1.5 py-0.5 text-[0.7rem] font-semibold text-warning">
                  <Icon name="achtung" className="size-3" /> Problem
                </span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <span className="rounded-md border border-line-dark px-2 py-1 text-[0.7rem] font-semibold text-signal-dark sm:text-xs">So einplanen</span>
                <span className="text-[0.7rem] font-semibold text-signal-dark sm:text-xs">Öffnen</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold sm:text-base">Heute im Betrieb</p>
            <div className="rounded-xl border border-line bg-white">
              {termine.map(([zeit, titel, unter, status]) => (
                <div key={zeit} className="flex items-center gap-3 border-b border-line px-3 py-2.5 last:border-0">
                  <span className="w-[4.5rem] shrink-0 text-[0.7rem] font-semibold tabular-nums sm:w-20 sm:text-xs">{zeit}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold sm:text-sm">{titel}</span>
                    <span className="block text-[0.7rem] text-muted sm:text-xs">{unter}</span>
                  </span>
                  {status && (
                    <span className="hidden shrink-0 rounded-sm bg-sand px-1.5 py-0.5 text-[0.7rem] font-semibold text-muted sm:inline">{status}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
