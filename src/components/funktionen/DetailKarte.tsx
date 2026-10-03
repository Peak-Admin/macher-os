import { Icon } from "@/components/ui";
import type { DetailVisual } from "@/content/funktionen";
import { VorschauStatus } from "@/components/mocks/AppFenster";
import { tonStatus } from "./ton";

/** Stilisierte Detailansicht eines Datensatzes (z. B. ein Raum im Aufmaß). Rein dekorativ. */
export function DetailKarte({ detail, label }: { detail: DetailVisual; label: string }) {
  return (
    <div role="img" aria-label={label} className="relative">
      <div aria-hidden className="absolute -inset-3 -z-10 rotate-2 rounded-2xl bg-app-ruhig" />
      <div className="app-lift overflow-hidden rounded-xl border border-app-linie bg-white shadow-xl shadow-ink/10">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-app-linie bg-app-ruhig px-5 py-3">
          <span className="min-w-0 text-[13px] font-semibold text-muted">{detail.kopf}</span>
          {detail.status && (
            <VorschauStatus ton={tonStatus[detail.status.ton]}>{detail.status.text}</VorschauStatus>
          )}
        </div>
        <div className="px-5 pb-2 pt-4">
          <p className="font-display text-xl font-bold leading-tight [overflow-wrap:anywhere]">{detail.titel}</p>
          {detail.sub && <p className="mt-1 text-sm text-muted">{detail.sub}</p>}
        </div>
        <dl className="px-5 pb-4">
          {detail.zeilen.map((z) => (
            <div key={z.label} className="flex items-baseline justify-between gap-4 border-b border-app-linie py-2.5 last:border-0">
              <dt className="text-sm text-muted">{z.label}</dt>
              <dd className={`min-w-0 text-right text-sm [overflow-wrap:anywhere] font-semibold tabular-nums ${z.hervor ? "text-signal-dark" : ""}`}>{z.wert}</dd>
            </div>
          ))}
        </dl>
        {detail.fuss && (
          <div className="flex items-start gap-2 border-t border-app-linie bg-signal-soft px-5 py-3 text-sm text-ink-soft">
            <Icon name={detail.fuss.icon} className="mt-0.5 size-4 shrink-0 text-moss" />
            <span>{detail.fuss.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}
