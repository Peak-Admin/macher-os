import { Icon } from "@/components/ui";
import type { FunktionsVisual } from "@/content/funktionen";
import { AppFenster, AppSeitenleiste, Blatt, VorschauStatus, bereichAusLabel } from "@/components/mocks/AppFenster";
import { tonHinweis, tonStatus } from "./ton";

/**
 * Stilisierte Produktansicht für eine Funktion (kein Screenshot) – im selben Rahmen wie die Software
 * (`AppFenster`: Seitenleiste mit Glas-Icons, beiger Canvas, aufgelegte Blätter).
 * Wird pro Funktion über `FunktionsVisual` aus `src/content/funktionen.ts` befüllt.
 */
export function FunktionsMock({ visual, label }: { visual: FunktionsVisual; label: string }) {
  return (
    <AppFenster role="img" aria-label={label} seitenleiste={<AppSeitenleiste aktiv={bereichAusLabel(visual.bereich)} favoriten={[]} />}>
      <div className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate font-display text-lg font-bold text-ink">{visual.titel}</p>
          {visual.untertitel && <p className="hidden shrink-0 text-[11px] text-muted sm:block">{visual.untertitel}</p>}
        </div>

        {visual.kennzahlen && (
          <div className="grid grid-cols-3 gap-2">
            {visual.kennzahlen.map(([wert, beschriftung]) => (
              <Blatt key={beschriftung} className="p-2.5">
                <div className="truncate font-display text-base font-bold text-ink sm:text-lg">{wert}</div>
                <div className="text-[11px] leading-tight text-muted">{beschriftung}</div>
              </Blatt>
            ))}
          </div>
        )}

        <div>
          {visual.liste.ueberschrift && (
            <p className="mb-1.5 text-[13px] font-semibold text-ink">{visual.liste.ueberschrift}</p>
          )}
          <Blatt className="divide-y divide-app-linie">
            {visual.liste.zeilen.map((z) => (
              <div key={z.titel} className="flex items-center gap-3 px-3 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-ink">{z.titel}</span>
                  {z.sub && <span className="block truncate text-[11px] text-muted">{z.sub}</span>}
                </span>
                {z.wert && <span className="shrink-0 text-[13px] font-semibold tabular-nums">{z.wert}</span>}
                {z.tag && (
                  <span className="hidden sm:inline-flex">
                    <VorschauStatus ton={tonStatus[z.ton ?? "sand"]}>{z.tag}</VorschauStatus>
                  </span>
                )}
              </div>
            ))}
          </Blatt>
        </div>

        {visual.hinweis && (
          <div className={`flex items-start gap-2 rounded-xl p-3 text-[12px] leading-snug ${tonHinweis[visual.hinweis.ton].box}`}>
            <Icon name={visual.hinweis.icon} className={`mt-0.5 size-4 shrink-0 ${tonHinweis[visual.hinweis.ton].titel}`} />
            <span className="text-ink">
              <b className={tonHinweis[visual.hinweis.ton].titel}>{visual.hinweis.titel}</b> {visual.hinweis.text}
            </span>
          </div>
        )}
      </div>
    </AppFenster>
  );
}
