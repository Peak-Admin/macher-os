"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/ui";
import { formatPreis, plaene } from "@/content/preise";
import { wegweiser } from "@/content/preise-vergleich";

/** „Welcher Plan passt zu mir?“ – einfache Auswahl nach Teamgröße. */
export function PlanWegweiser() {
  const [auswahl, setAuswahl] = useState<string | null>(null);
  const treffer = wegweiser.find((w) => w.id === auswahl);
  const plan = treffer ? plaene.find((p) => p.id === treffer.plan) : undefined;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <fieldset>
        <legend className="mb-4 font-display text-lg font-bold">Wie viele Leute arbeiten bei euch?</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {wegweiser.map((w) => {
            const aktiv = auswahl === w.id;
            return (
              <label
                key={w.id}
                className={`flex cursor-pointer items-start gap-3 rounded-lg bg-white p-4 ring-1 transition has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-signal ${
                  aktiv ? "ring-2 ring-ink" : "ring-line hover:ring-ink/40"
                }`}
              >
                <input
                  type="radio"
                  name="teamgroesse"
                  value={w.id}
                  checked={aktiv}
                  onChange={() => setAuswahl(w.id)}
                  className="mt-1 size-4 accent-[var(--color-ink)]"
                />
                <span>
                  <span className="block font-semibold">{w.label}</span>
                  <span className="mt-0.5 block text-sm text-muted">{w.hinweis}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div aria-live="polite" className="flex">
        {plan ? (
          <div className="flex w-full flex-col rounded-xl bg-ink p-6 text-white">
            <p className="text-sm font-semibold font-tagline uppercase tracking-wider text-accent">Unsere Empfehlung</p>
            <p className="mt-2 font-display text-3xl font-extrabold">{plan.name}</p>
            <p className="mt-1 text-white/70">{plan.fuer}</p>
            <p className="mt-4 text-lg font-semibold">
              {plan.monatlich === null ? "Preis auf Anfrage" : `ab ${formatPreis(plan.jaehrlich ?? plan.monatlich)} / Monat`}
            </p>
            <p className="text-sm text-white/60">{plan.nutzer}</p>
            <Link
              href={plan.cta.href}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-signal py-3 font-bold text-white transition-colors hover:bg-signal-dark"
            >
              {plan.cta.label} <Icon name="arrow-right" className="size-4" />
            </Link>
          </div>
        ) : (
          <div className="flex w-full flex-col items-start justify-center rounded-xl border border-dashed border-line bg-white p-6 text-muted">
            <Icon name="users" className="size-6" />
            <p className="mt-3">Wähle eure Teamgröße – wir zeigen dir den passenden Plan.</p>
          </div>
        )}
      </div>
    </div>
  );
}
