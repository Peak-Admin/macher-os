import { Icon, type IconName } from "@/components/ui";
import type { FunktionsVisual } from "@/content/funktionen";
import { tonBalken, tonEtikett, tonHinweis } from "./ton";

const tabs: { label: FunktionsVisual["bereich"]; icon: IconName }[] = [
  { label: "Heute", icon: "home" },
  { label: "Aufträge", icon: "clipboard" },
  { label: "Plan", icon: "calendar" },
  { label: "Betrieb", icon: "layers" },
];

/**
 * Stilisierte Produktansicht für eine Funktion (kein Screenshot).
 * Wird pro Funktion über `FunktionsVisual` aus `src/content/funktionen.ts` befüllt.
 */
export function FunktionsMock({ visual, label }: { visual: FunktionsVisual; label: string }) {
  return (
    <div
      role="img"
      aria-label={label}
      className="relative rounded-lg border border-ink/10 bg-white shadow-2xl shadow-ink/15"
    >
      <div className="flex items-center gap-1.5 border-b border-line px-4 py-3">
        <span className="size-2.5 rounded-full bg-line" />
        <span className="size-2.5 rounded-full bg-line" />
        <span className="size-2.5 rounded-full bg-line" />
        <span className="ml-3 truncate text-xs font-semibold text-muted">Macher OS · {visual.bereich}</span>
      </div>
      <div className="grid grid-cols-[auto_1fr]">
        <nav aria-hidden className="flex flex-col gap-1 border-r border-line p-2 sm:w-32 sm:p-3">
          {tabs.map((t) => (
            <span
              key={t.label}
              className={`flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold sm:px-3 sm:text-sm ${
                t.label === visual.bereich ? "bg-ink text-white" : "text-muted"
              }`}
            >
              <Icon name={t.icon} className="size-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </span>
          ))}
        </nav>
        <div className="min-w-0 space-y-3 bg-paper/60 p-3 sm:p-5">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate font-display text-base font-bold sm:text-lg">{visual.titel}</p>
            {visual.untertitel && <p className="hidden shrink-0 text-xs text-muted sm:block">{visual.untertitel}</p>}
          </div>

          {visual.kennzahlen && (
            <div className="grid grid-cols-3 gap-2">
              {visual.kennzahlen.map(([wert, beschriftung]) => (
                <div key={beschriftung} className="rounded-xl border border-line bg-white p-2.5 sm:p-3">
                  <div className="truncate font-display text-sm font-extrabold sm:text-lg">{wert}</div>
                  <div className="text-[0.65rem] leading-tight text-muted sm:text-xs">{beschriftung}</div>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-xl border border-line bg-white">
            {visual.liste.ueberschrift && (
              <p className="border-b border-line px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-wider text-muted">
                {visual.liste.ueberschrift}
              </p>
            )}
            {visual.liste.zeilen.map((z) => (
              <div key={z.titel} className="flex items-center gap-3 border-b border-line px-3 py-2.5 last:border-0">
                <span className={`h-8 w-1 shrink-0 rounded-full ${tonBalken[z.ton ?? "sand"]}`} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold sm:text-sm">{z.titel}</span>
                  {z.sub && <span className="block truncate text-[0.7rem] text-muted sm:text-xs">{z.sub}</span>}
                </span>
                {z.wert && <span className="shrink-0 text-xs font-semibold tabular-nums sm:text-sm">{z.wert}</span>}
                {z.tag && (
                  <span
                    className={`hidden shrink-0 rounded-md px-2 py-0.5 text-[0.65rem] font-semibold sm:inline ${tonEtikett[z.ton ?? "sand"]}`}
                  >
                    {z.tag}
                  </span>
                )}
              </div>
            ))}
          </div>

          {visual.hinweis && (
            <div className={`flex items-start gap-2 rounded-xl border p-3 text-xs sm:text-sm ${tonHinweis[visual.hinweis.ton].box}`}>
              <Icon name={visual.hinweis.icon} className={`mt-0.5 size-4 shrink-0 ${tonHinweis[visual.hinweis.ton].titel}`} />
              <span>
                <b className={tonHinweis[visual.hinweis.ton].titel}>{visual.hinweis.titel}</b> {visual.hinweis.text}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
