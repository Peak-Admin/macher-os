"use client";

import { useState } from "react";
import { Icon, type IconName } from "@/components/ui";
import { tourSchritte, type DemoGewerk } from "@/content/demo";

const icons: IconName[] = ["inbox", "calendar", "smartphone", "camera", "euro"];

/** 5-Minuten-Tour: Schritt für Schritt vom Anruf bis zur Rechnung. */
export function DemoTour({ daten }: { daten: DemoGewerk }) {
  const [schritt, setSchritt] = useState(0);
  const letzter = schritt === tourSchritte.length - 1;
  const gehe = (i: number) => setSchritt(i);

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
      <ol className="grid gap-2 sm:grid-cols-5 lg:grid-cols-1">
        {tourSchritte.map((s, i) => {
          const aktiv = i === schritt;
          const fertig = i < schritt;
          return (
            <li key={s.titel}>
              <button
                type="button"
                onClick={() => gehe(i)}
                aria-current={aktiv ? "step" : undefined}
                className={`flex w-full items-center gap-3 rounded-lg p-3 text-left text-sm font-semibold transition-colors ${
                  aktiv ? "bg-signal-soft text-signal-dark ring-1 ring-inset ring-primary" : "bg-white text-ink ring-1 ring-inset ring-line-dark hover:bg-signal-soft"
                }`}
              >
                <span
                  className={`inline-flex size-7 shrink-0 items-center justify-center rounded-md font-display text-xs font-extrabold ${
                    aktiv ? "bg-signal text-white" : fertig ? "bg-moss text-white" : "bg-sand text-ink-soft"
                  }`}
                >
                  {fertig ? <Icon name="check" className="size-4" /> : i + 1}
                </span>
                <span className="leading-tight">{s.titel}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-col rounded-xl border border-line bg-white p-6 sm:p-8">
        <div aria-live="polite" className="flex-1">
          <p className="text-sm font-semibold text-muted">
            Schritt {schritt + 1} von {tourSchritte.length} · Bereich „{tourSchritte[schritt].bereich}“
          </p>
          <div className="mt-4 flex items-start gap-4">
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-lg icon-kachel">
              <Icon name={icons[schritt]} className="size-6" />
            </span>
            <div>
              <h3 className="font-display text-2xl font-extrabold leading-tight sm:text-3xl">
                {tourSchritte[schritt].titel}
              </h3>
              <p className="mt-3 max-w-xl text-lg leading-relaxed text-ink-soft">{daten.tour[schritt]}</p>
            </div>
          </div>
          <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-sand" aria-hidden>
            <div
              className="h-full bg-signal transition-all duration-300"
              style={{ width: `${((schritt + 1) / tourSchritte.length) * 100}%` }}
            />
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => gehe(schritt - 1)}
            disabled={schritt === 0}
            className="inline-flex h-11 items-center gap-2 rounded-lg px-4 font-semibold ring-1 ring-inset ring-line transition hover:ring-ink/40 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon name="arrow-right" className="size-4 rotate-180" /> Zurück
          </button>
          <button
            type="button"
            onClick={() => gehe(letzter ? 0 : schritt + 1)}
            className={`inline-flex h-11 items-center gap-2 rounded-lg px-5 text-white ${
              letzter ? "bg-ink font-semibold hover:bg-ink-soft" : "btn-primaer"
            }`}
          >
            {letzter ? "Tour neu starten" : "Weiter"}
            {!letzter && <Icon name="arrow-right" className="size-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
