"use client";

import { useId, useMemo, useState } from "react";
import { Icon } from "@/components/ui";
import type { WissenEintrag } from "@/content/wissen";
import { treffer } from "./suche";
import { WissenKarte } from "./WissenKarte";

const vorschlaege = ["Stundensatz", "E-Rechnung", "Abnahme", "Einsatzplanung", "Mitarbeiter", "Stundenzettel"];

/** Suche über alle Wissensinhalte (Blog, Webinare, Vorlagen, Kurse). */
export function WissenSuche({ eintraege }: { eintraege: WissenEintrag[] }) {
  const [query, setQuery] = useState("");
  const id = useId();

  const ergebnisse = useMemo(() => {
    if (query.trim().length < 2) return [];
    return eintraege
      .map((e) => ({ e, score: treffer(query, e.titel, `${e.text} ${e.typ} ${e.stichworte}`) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 9)
      .map((x) => x.e);
  }, [query, eintraege]);

  const aktiv = query.trim().length >= 2;

  return (
    <div className="mt-8" role="search">
      <label htmlFor={id} className="sr-only">
        Wonach suchst du?
      </label>
      <div className="relative max-w-3xl">
        <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
        <input
          id={id}
          type="search"
          value={query}
          onChange={(ev) => setQuery(ev.target.value)}
          placeholder="Wonach suchst du?"
          autoComplete="off"
          className="feld h-14 pl-12 text-lg"
        />
      </div>
      {!aktiv && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted">Oft gesucht:</span>
          {vorschlaege.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setQuery(v)}
              className="inline-flex min-h-11 items-center rounded-lg bg-white px-3 font-medium ring-1 ring-inset ring-line-dark hover:bg-signal-soft"
            >
              {v}
            </button>
          ))}
        </div>
      )}
      <div aria-live="polite" className="mt-6">
        {aktiv && (
          <>
            <p className="mb-4 text-sm font-medium text-muted">
              {ergebnisse.length === 0
                ? `Keine Treffer für „${query.trim()}“. Versuch es mit einem anderen Wort oder schau in die Bereiche unten.`
                : `${ergebnisse.length} Treffer für „${query.trim()}“`}
            </p>
            {ergebnisse.length > 0 && (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {ergebnisse.map((e) => (
                  <li key={e.href}>
                    <WissenKarte eintrag={e} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
