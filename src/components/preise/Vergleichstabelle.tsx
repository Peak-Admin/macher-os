import Link from "next/link";
import { Fragment } from "react";
import { Icon } from "@/components/ui";
import { formatPreis, plaene } from "@/content/preise";
import { planReihenfolge, vergleich, type Zelle } from "@/content/preise-vergleich";
import { funktionHref } from "@/content/registry";

function ZellenInhalt({ wert }: { wert: Zelle }) {
  if (wert === true)
    return (
      <span className="inline-flex size-6 items-center justify-center rounded-md bg-moss text-white">
        <Icon name="check" className="size-4" />
        <span className="sr-only">enthalten</span>
      </span>
    );
  if (wert === false)
    return (
      <span className="text-muted">
        <span aria-hidden>–</span>
        <span className="sr-only">nicht enthalten</span>
      </span>
    );
  return <span className="text-sm font-semibold">{wert}</span>;
}

/** Vergleich der Pläne – nur Punkte, in denen sie sich unterscheiden. */
export function Vergleichstabelle() {
  const spalten = planReihenfolge.map((id) => plaene.find((p) => p.id === id)!);
  return (
    <div className="relative overflow-x-auto rounded-xl border border-line bg-white">
      <table className="w-full min-w-[44rem] border-collapse text-left">
        <caption className="sr-only">Vergleich der Pläne Solo, Team, Betrieb und Unternehmen</caption>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="w-[30%] p-4 text-sm font-semibold text-muted">
              Plan
            </th>
            {spalten.map((p) => (
              <th
                key={p.id}
                scope="col"
                className={`p-4 text-center align-bottom ${p.hervorgehoben ? "bg-signal-soft" : ""}`}
              >
                <span className="block font-display text-lg font-extrabold">{p.name}</span>
                <span className="block text-sm font-normal text-muted">
                  {p.monatlich === null ? "auf Anfrage" : `${formatPreis(p.monatlich)} / Monat`}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {vergleich.map((g) => (
            <Fragment key={g.gruppe}>
              <tr className="bg-sand">
                <th colSpan={spalten.length + 1} scope="colgroup" className="px-4 py-2 text-sm font-bold font-tagline uppercase tracking-wider text-ink-soft">
                  {g.gruppe}
                </th>
              </tr>
              {g.zeilen.map((z) => (
                <tr key={z.merkmal} className="border-t border-line">
                  <th scope="row" className="p-4 text-[0.95rem] font-semibold">
                    {z.funktion ? (
                      <Link href={funktionHref(z.funktion)} className="underline decoration-line decoration-2 underline-offset-4 hover:decoration-signal">
                        {z.merkmal}
                      </Link>
                    ) : (
                      z.merkmal
                    )}
                  </th>
                  {spalten.map((p) => (
                    <td key={p.id} className={`p-4 text-center ${p.hervorgehoben ? "bg-signal-soft/50" : ""}`}>
                      <ZellenInhalt wert={z.werte[p.id as keyof typeof z.werte]} />
                    </td>
                  ))}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
