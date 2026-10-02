"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { Icon } from "@/components/ui";
import { treffer } from "./suche";

export type BlogListenEintrag = {
  slug: string;
  href: string;
  titel: string;
  beschreibung: string;
  datum: string;
  datumText: string;
  lesezeit: number;
  themen: string[];
  themenText: string[];
  stichworte: string;
};

type Thema = { slug: string; titel: string };

/** Artikelliste mit Suche und Themenfilter. */
export function BlogFilter({
  artikel,
  themen,
  startThema = null,
}: {
  artikel: BlogListenEintrag[];
  themen: Thema[];
  startThema?: string | null;
}) {
  const [query, setQuery] = useState("");
  const [thema, setThema] = useState<string | null>(
    startThema && themen.some((t) => t.slug === startThema) ? startThema : null,
  );
  const id = useId();

  const liste = useMemo(() => {
    let l = artikel;
    if (thema) l = l.filter((a) => a.themen.includes(thema));
    if (query.trim().length >= 2) {
      l = l
        .map((a) => ({ a, s: treffer(query, a.titel, `${a.beschreibung} ${a.stichworte}`) }))
        .filter((x) => x.s > 0)
        .sort((x, y) => y.s - x.s)
        .map((x) => x.a);
    }
    return l;
  }, [artikel, thema, query]);

  const chip = (aktiv: boolean) =>
    `inline-flex min-h-11 items-center rounded-md px-3 py-1.5 text-base font-semibold transition ${
      aktiv ? "bg-signal-soft text-signal-dark ring-1 ring-inset ring-primary" : "bg-white text-ink ring-1 ring-inset ring-line-dark hover:bg-signal-soft"
    }`;

  return (
    <div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-start">
        <div role="search" className="relative">
          <label htmlFor={id} className="sr-only">
            Artikel durchsuchen
          </label>
          <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted" />
          <input
            id={id}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Artikel durchsuchen"
            autoComplete="off"
            className="h-11 w-full rounded-lg border border-line bg-white pl-11 pr-3 outline-none placeholder:text-muted focus:border-ink/40 focus:ring-2 focus:ring-signal/40"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Nach Thema filtern">
          <button type="button" className={chip(thema === null)} aria-pressed={thema === null} onClick={() => setThema(null)}>
            Alle Themen
          </button>
          {themen.map((t) => (
            <button
              key={t.slug}
              type="button"
              className={chip(thema === t.slug)}
              aria-pressed={thema === t.slug}
              onClick={() => setThema(thema === t.slug ? null : t.slug)}
            >
              {t.titel}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 text-sm font-medium text-muted" aria-live="polite">
        {liste.length} Artikel
      </p>

      {liste.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-line bg-white p-8 text-center text-muted">
          Zu dieser Auswahl gibt es noch keinen Artikel.{" "}
          <button
            type="button"
            className="font-semibold text-ink underline decoration-signal decoration-2 underline-offset-4"
            onClick={() => {
              setThema(null);
              setQuery("");
            }}
          >
            Filter zurücksetzen
          </button>
        </div>
      ) : (
        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          {liste.map((a) => (
            <li key={a.slug}>
              <Link
                href={a.href}
                className="group flex h-full flex-col rounded-lg border border-line bg-white p-6 transition hover:-translate-y-0.5 hover:border-ink/30 hover:shadow-lg hover:shadow-ink/5"
              >
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold font-tagline uppercase tracking-wider text-muted">
                  <span>{a.themenText.join(" · ")}</span>
                </div>
                <h3 className="mt-2 font-display text-xl font-bold leading-snug text-balance group-hover:text-signal-dark">
                  {a.titel}
                </h3>
                <p className="mt-2 leading-relaxed text-muted">{a.beschreibung}</p>
                <p className="mt-auto flex items-center gap-3 pt-4 text-sm text-muted">
                  <time dateTime={a.datum}>{a.datumText}</time>
                  <span aria-hidden>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Icon name="clock" className="size-4" /> {a.lesezeit} Min. Lesezeit
                  </span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Variante, die das Thema aus `?thema=` übernimmt. Muss in `<Suspense>` stehen. */
export function BlogFilterMitParams(props: { artikel: BlogListenEintrag[]; themen: Thema[] }) {
  const params = useSearchParams();
  return <BlogFilter {...props} startThema={params.get("thema")} />;
}
