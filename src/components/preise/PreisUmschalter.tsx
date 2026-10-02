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
        <fieldset className="inline-flex rounded-lg bg-white p-1 ring-1 ring-line">
          <legend className="sr-only">Zahlweise</legend>
          {optionen.map((o) => (
            <label
              key={o.value}
              className={`relative cursor-pointer rounded-md px-5 py-2 text-sm font-bold transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-signal ${
                billing === o.value ? "bg-ink text-white" : "text-muted hover:text-ink"
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
