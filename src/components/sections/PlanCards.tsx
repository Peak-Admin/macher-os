import Link from "next/link";
import { CheckList } from "@/components/ui";
import { formatPreis, plaene } from "@/content/preise";

/** Preiskarten aller Pläne. `billing` steuert, welcher Monatspreis gezeigt wird. */
export function PlanCards({ billing = "monatlich" }: { billing?: "monatlich" | "jaehrlich" }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {plaene.map((p) => {
        const preis = billing === "jaehrlich" ? p.jaehrlich : p.monatlich;
        return (
          <div
            key={p.id}
            className={`relative flex flex-col rounded-2xl p-6 ${
              p.hervorgehoben ? "bg-ink text-white ring-2 ring-signal" : "border border-line bg-white"
            }`}
          >
            {p.hervorgehoben && (
              <span className="absolute -top-3 left-6 rounded-full bg-signal px-3 py-0.5 text-xs font-bold text-ink">
                Am beliebtesten
              </span>
            )}
            <p className="font-display text-xl font-extrabold">{p.name}</p>
            <p className={`mt-1 text-sm ${p.hervorgehoben ? "text-white/70" : "text-muted"}`}>{p.fuer}</p>
            <p className="mt-5 flex items-baseline gap-1.5">
              {preis === null ? (
                <span className="font-display text-3xl font-extrabold">Auf Anfrage</span>
              ) : (
                <>
                  <span className="font-display text-4xl font-extrabold">{formatPreis(preis)}</span>
                  <span className={`text-sm ${p.hervorgehoben ? "text-white/70" : "text-muted"}`}>/ Monat</span>
                </>
              )}
            </p>
            <p className={`mt-1 text-xs ${p.hervorgehoben ? "text-white/60" : "text-muted"}`}>
              {preis === null ? "Individuelles Angebot" : billing === "jaehrlich" ? "netto, bei jährlicher Zahlung" : "netto, monatlich kündbar"}
            </p>
            <p className="mt-4 text-sm font-semibold">{p.nutzer}</p>
            <CheckList items={p.vorteile} className="mt-4 flex-1 text-sm" />
            <Link
              href={p.cta.href}
              className={`mt-6 rounded-lg py-3 text-center font-bold transition-colors ${
                p.hervorgehoben ? "bg-signal text-ink hover:bg-signal-dark" : "bg-ink text-white hover:bg-ink-soft"
              }`}
            >
              {p.cta.label}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
