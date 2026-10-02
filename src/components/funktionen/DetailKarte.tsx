import { Icon } from "@/components/ui";
import type { DetailVisual } from "@/content/funktionen";
import { tonEtikett } from "./ton";

/** Stilisierte Detailansicht eines Datensatzes (z. B. ein Raum im Aufmaß). Rein dekorativ. */
export function DetailKarte({ detail, label }: { detail: DetailVisual; label: string }) {
  return (
    <div role="img" aria-label={label} className="relative">
      <div aria-hidden className="absolute -inset-3 -z-10 rotate-2 rounded-xl bg-sand" />
      <div className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-xl shadow-ink/10">
        <div className="flex items-center justify-between gap-3 border-b border-line bg-paper px-5 py-3">
          <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted">{detail.kopf}</span>
          {detail.status && (
            <span className={`rounded-md px-2.5 py-0.5 text-xs font-semibold ${tonEtikett[detail.status.ton]}`}>
              {detail.status.text}
            </span>
          )}
        </div>
        <div className="px-5 pb-2 pt-4">
          <p className="font-display text-xl font-bold leading-tight">{detail.titel}</p>
          {detail.sub && <p className="mt-1 text-sm text-muted">{detail.sub}</p>}
        </div>
        <dl className="px-5 pb-4">
          {detail.zeilen.map((z) => (
            <div key={z.label} className="flex items-baseline justify-between gap-4 border-b border-dashed border-line py-2.5 last:border-0">
              <dt className="text-sm text-muted">{z.label}</dt>
              <dd className={`text-right text-sm font-semibold tabular-nums ${z.hervor ? "text-signal-dark" : ""}`}>{z.wert}</dd>
            </div>
          ))}
        </dl>
        {detail.fuss && (
          <div className="flex items-start gap-2 border-t border-line bg-moss-soft px-5 py-3 text-sm text-ink-soft">
            <Icon name={detail.fuss.icon} className="mt-0.5 size-4 shrink-0 text-moss" />
            <span>{detail.fuss.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}
