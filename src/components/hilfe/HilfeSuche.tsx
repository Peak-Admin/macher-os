"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { Icon } from "@/components/ui";
import type { HilfeSuchEintrag } from "@/content/hilfe/artikel";

function normalisieren(s: string) {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss");
}

/** Suche über alle Hilfe-Center-Artikel. Läuft komplett im Browser. */
export function HilfeSuche({
  eintraege,
  vorschlaege = [],
  dunkel = false,
}: {
  eintraege: HilfeSuchEintrag[];
  vorschlaege?: string[];
  dunkel?: boolean;
}) {
  const id = useId();
  const [suche, setSuche] = useState("");

  const index = useMemo(
    () => eintraege.map((e) => ({ ...e, titelN: normalisieren(e.titel), textN: normalisieren(e.text) })),
    [eintraege],
  );

  const woerter = normalisieren(suche).split(/\s+/).filter((w) => w.length > 1);
  const treffer =
    woerter.length === 0
      ? []
      : index
          .filter((e) => woerter.every((w) => e.textN.includes(w)))
          .sort((a, b) => {
            const pa = woerter.filter((w) => a.titelN.includes(w)).length;
            const pb = woerter.filter((w) => b.titelN.includes(w)).length;
            return pb - pa;
          })
          .slice(0, 6);

  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        Hilfe durchsuchen
      </label>
      <div className="relative">
        <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
        <input
          id={id}
          type="search"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          placeholder="Wobei brauchst du Hilfe? z. B. Rechnung, Urlaub, App"
          autoComplete="off"
          className="h-14 w-full rounded-xl border border-line bg-white pl-12 pr-4 text-base text-ink shadow-sm outline-none transition focus:border-ink"
        />
      </div>

      {vorschlaege.length > 0 && suche === "" && (
        <div className={`mt-3 flex flex-wrap items-center gap-2 text-sm ${dunkel ? "text-white/70" : "text-muted"}`}>
          <span>Oft gesucht:</span>
          {vorschlaege.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setSuche(v)}
              className={`rounded-md px-3 py-1 font-semibold ring-1 transition ${
                dunkel ? "ring-white/25 hover:bg-white/10" : "bg-white ring-line hover:ring-ink/40"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      )}

      <div aria-live="polite">
        {woerter.length > 0 && (
          <div className="mt-3 overflow-hidden rounded-xl border border-line bg-white text-ink shadow-lg shadow-ink/5">
            {treffer.length > 0 ? (
              <ul className="divide-y divide-line">
                {treffer.map((t) => (
                  <li key={t.slug}>
                    <Link href={`/hilfe-center/${t.slug}`} className="group flex items-start gap-3 px-4 py-3.5 hover:bg-paper">
                      <Icon name="file" className="mt-0.5 size-5 shrink-0 text-signal-dark" />
                      <span className="min-w-0">
                        <span className="block font-semibold">{t.titel}</span>
                        <span className="block text-sm text-muted">
                          {t.kategorie} · {t.kurz}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-4 text-sm">
                Nichts gefunden. Versuch ein anderes Wort oder{" "}
                <Link href="/hilfe/kontakt" className="font-semibold underline underline-offset-2">
                  frag uns direkt
                </Link>
                .
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
