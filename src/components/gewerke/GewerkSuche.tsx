"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState, type FormEvent } from "react";
import { Icon } from "@/components/ui";
import type { Suchbegriff } from "@/content/gewerke";

const FALLBACK = "/gewerke/weitere-gewerke";

function normalisieren(s: string) {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Grober Wortstamm: „Elektrikerin“, „Elektrikers“ → „elektriker“. */
function stamm(s: string) {
  return s.replace(/(innen|in|meisterin|meister|betrieb|betriebe|ei|s|e|n)$/g, "");
}

type Treffer = Suchbegriff & { punkte: number };

function suchen(liste: Suchbegriff[], eingabe: string): Treffer[] {
  const q = normalisieren(eingabe);
  if (q.length < 2) return [];
  const qStamm = stamm(q);
  const treffer: Treffer[] = [];
  for (const eintrag of liste) {
    const b = normalisieren(eintrag.begriff);
    let punkte = 0;
    if (b === q) punkte = 100;
    else if (stamm(b) === qStamm && qStamm.length >= 3) punkte = 90;
    else if (b.startsWith(q)) punkte = 70;
    else if (b.split(" ").some((w) => w.startsWith(q))) punkte = 60;
    else if (q.length >= 3 && b.includes(q)) punkte = 45;
    else if (qStamm.length >= 4 && b.length >= 4 && q.includes(b)) punkte = 40;
    if (punkte > 0) {
      // Kürzere Begriffe sind meist die passenderen.
      treffer.push({ ...eintrag, punkte: punkte - Math.min(b.length, 40) / 100 });
    }
  }
  treffer.sort((a, b) => b.punkte - a.punkte);
  // Pro Zielseite nur der beste Treffer.
  const proZiel = new Set<string>();
  const ergebnis: Treffer[] = [];
  for (const t of treffer) {
    if (proZiel.has(t.ziel)) continue;
    proZiel.add(t.ziel);
    ergebnis.push(t);
    if (ergebnis.length === 5) break;
  }
  return ergebnis;
}

/** Suche „Was macht dein Betrieb?“ – führt auf die passende Gewerk- oder Cluster-Seite. */
export function GewerkSuche({ begriffe, beispiele }: { begriffe: Suchbegriff[]; beispiele: string[] }) {
  const router = useRouter();
  const [eingabe, setEingabe] = useState("");
  const [abgeschickt, setAbgeschickt] = useState(false);
  const treffer = useMemo(() => suchen(begriffe, eingabe), [begriffe, eingabe]);
  const inputId = useId();
  const listId = useId();

  const ohneTreffer = abgeschickt && eingabe.trim().length >= 2 && treffer.length === 0;

  function absenden(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAbgeschickt(true);
    if (eingabe.trim().length < 2) return;
    router.push(treffer[0] ? `/gewerke/${treffer[0].ziel}` : FALLBACK);
  }

  return (
    <div>
      <form action={FALLBACK} method="get" onSubmit={absenden} role="search" className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor={inputId} className="sr-only">
          Was macht dein Betrieb?
        </label>
        <div className="relative flex-1">
          <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
          <input
            id={inputId}
            name="beruf"
            type="search"
            autoComplete="off"
            value={eingabe}
            onChange={(e) => {
              setEingabe(e.target.value);
              setAbgeschickt(false);
            }}
            placeholder="Was macht dein Betrieb? z. B. Kälteanlagenbauer"
            aria-describedby={listId}
            className="h-13 w-full rounded-lg border border-line bg-white pl-12 pr-4 text-base outline-none transition placeholder:text-muted focus:border-ink focus:ring-2 focus:ring-signal/40"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-13 items-center justify-center gap-2 rounded-lg btn-primaer px-7 whitespace-nowrap transition-colors"
        >
          Gewerk finden <Icon name="arrow-right" className="size-4" />
        </button>
      </form>

      <div id={listId} aria-live="polite" className="mt-4 min-h-24">
        {treffer.length > 0 && (
          <>
            <p className="text-sm font-semibold text-muted">Passende Seiten:</p>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {treffer.map((t) => (
                <li key={t.ziel}>
                  <Link
                    href={`/gewerke/${t.ziel}`}
                    className="group flex items-center justify-between gap-3 rounded-lg bg-white px-4 py-3 ring-1 ring-line transition hover:ring-ink/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{t.begriff}</span>
                      <span className="block truncate text-sm text-muted">→ {t.zielTitel}</span>
                    </span>
                    <Icon
                      name="arrow-right"
                      className="size-4 shrink-0 text-signal-dark transition-transform group-hover:translate-x-0.5"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
        {ohneTreffer && (
          <p className="rounded-lg bg-white p-4 ring-1 ring-line">
            Dafür haben wir noch keine eigene Seite. Kein Problem: Macher OS richtet sich nach deiner Arbeitsweise.{" "}
            <Link href={FALLBACK} className="font-semibold underline decoration-signal decoration-2 underline-offset-4">
              Weitere Gewerke ansehen
            </Link>
          </p>
        )}
        {eingabe.trim().length < 2 && (
          <p className="text-sm text-muted">
            Zum Beispiel:{" "}
            {beispiele.map((b, i) => (
              <span key={b}>
                <button
                  type="button"
                  onClick={() => setEingabe(b)}
                  className="font-semibold text-ink underline decoration-line decoration-2 underline-offset-4 hover:decoration-signal"
                >
                  {b}
                </button>
                {i < beispiele.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
        )}
      </div>
    </div>
  );
}
