"use client";

import { useState } from "react";
import { PlanCards } from "@/components/sections/PlanCards";
import { plaene } from "@/content/preise";

type Billing = "monatlich" | "jaehrlich";

/** Größte Ersparnis bei jährlicher Zahlung in Prozent (aus den Plänen berechnet). */
const ersparnis = Math.floor(
  Math.max(
    ...plaene
      .filter((p) => p.monatlich && p.jaehrlich)
      .map((p) => ((p.monatlich! - p.jaehrlich!) / p.monatlich!) * 100),
  ),
);

/** Umschalter Monatlich/Jährlich + Preiskarten. */
export function PreisUmschalter() {
  const [billing, setBilling] = useState<Billing>("monatlich");
  const optionen: { value: Billing; label: string }[] = [
    { value: "monatlich", label: "Monatlich" },
    { value: "jaehrlich", label: "Jährlich" },
  ];
  return (
    <div>
      <div className="flex flex-col items-center gap-3">
        <fieldset className="inline-flex gap-1 rounded-xl bg-sand p-1">
          <legend className="sr-only">Zahlweise</legend>
          {optionen.map((o) => (
            <label
              key={o.value}
              className={`relative flex min-h-11 cursor-pointer items-center rounded-md border px-5 py-2 text-base transition-colors duration-150 ease-out has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary ${
                billing === o.value ? "border-line-dark bg-white font-semibold text-signal-dark" : "border-transparent font-medium text-muted hover:bg-white"
              }`}
            >
              <input
                type="radio"
                name="billing"
                value={o.value}
                checked={billing === o.value}
                onChange={() => setBilling(o.value)}
                className="sr-only"
              />
              {o.label}
            </label>
          ))}
        </fieldset>
        <p className="text-sm text-muted" aria-live="polite">
          {billing === "jaehrlich"
            ? `Jährliche Zahlung: bis zu ${ersparnis} % günstiger pro Monat.`
            : `Tipp: Bei jährlicher Zahlung sparst du bis zu ${ersparnis} %.`}
        </p>
      </div>
      <div className="mt-10">
        <PlanCards billing={billing} />
      </div>
      <p className="mt-6 text-center text-sm text-muted">Alle Preise netto pro Monat, zzgl. MwSt.</p>
    </div>
  );
}
