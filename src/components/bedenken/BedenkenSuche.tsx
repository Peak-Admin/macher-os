"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { Faq, Icon, SucheLeeren, type FaqItem } from "@/components/ui";

function normalisieren(s: string) {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss");
}

/** Suche über alle Bedenken. Läuft komplett im Browser; ohne Eingabe stehen alle da. */
export function BedenkenSuche({ eintraege, vorschlaege = [] }: { eintraege: FaqItem[]; vorschlaege?: string[] }) {
  const id = useId();
  const [suche, setSuche] = useState("");

  const index = useMemo(
    () => eintraege.map((e) => ({ item: e, text: normalisieren(`${e.frage} ${e.antwort}`) })),
    [eintraege],
  );

  const woerter = normalisieren(suche).split(/\s+/).filter((w) => w.length > 1);
  const treffer = woerter.length === 0 ? eintraege : index.filter((e) => woerter.every((w) => e.text.includes(w))).map((e) => e.item);

  return (
    <div>
      <label htmlFor={id} className="mb-2 block font-semibold">
        Bedenken durchsuchen
      </label>
      <div className="relative">
        <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
        <input
          id={id}
          type="search"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          placeholder="z. B. Daten, Kosten, Mitarbeiter"
          autoComplete="off"
          className="feld h-14 pl-12 pr-14"
        />
        {suche && <SucheLeeren feldId={id} onLeeren={() => setSuche("")} />}
      </div>

      {vorschlaege.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
          <span>Oft gesucht:</span>
          {vorschlaege.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setSuche(v)}
              aria-pressed={suche === v}
              className="min-h-11 rounded-lg bg-white px-3 font-semibold text-ink ring-1 ring-inset ring-line-dark transition hover:bg-signal-soft aria-pressed:bg-signal-soft aria-pressed:ring-signal-dark"
            >
              {v}
            </button>
          ))}
        </div>
      )}

      <p aria-live="polite" className="mt-8 text-sm text-muted">
        {woerter.length === 0
          ? `${eintraege.length} Bedenken`
          : treffer.length === 1
            ? "1 Treffer"
            : `${treffer.length} Treffer`}
      </p>

      <div className="mt-3">
        {treffer.length > 0 ? (
          <Faq items={treffer} />
        ) : (
          <div className="rounded-xl border border-line bg-white p-6">
            <p className="font-semibold">Dazu haben wir noch keine Antwort.</p>
            <p className="mt-1 text-muted">
              Versuch ein anderes Wort oder{" "}
              <Link href="/hilfe/kontakt" className="font-semibold text-signal-dark underline underline-offset-2">
                frag uns direkt
              </Link>
              .
            </p>
            <button
              type="button"
              onClick={() => setSuche("")}
              className="btn-zweit mt-4"
            >
              Alle Bedenken zeigen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
