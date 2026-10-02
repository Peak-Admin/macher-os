"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/ui";
import { formatPreis, planFuerTeam, plaene, preiseVorlaeufig } from "@/content/preise";

type Zahlweise = "monatlich" | "jaehrlich";

/**
 * Preise nach Teamgröße: Leute eingeben → der passende Plan ist markiert. Alle Pläne enthalten alles –
 * sie unterscheiden sich nur in der Zahl der Leute. Dieselbe Regel nutzt die App („Dein Plan“).
 */
export function PreisRechner() {
  const [leute, setLeute] = useState(4);
  const [zahlweise, setZahlweise] = useState<Zahlweise>("monatlich");
  const passend = planFuerTeam(leute);
  const ersparnis = Math.max(
    ...plaene.filter((p) => p.monatlich && p.jaehrlich).map((p) => Math.round((1 - p.jaehrlich! / p.monatlich!) * 100)),
  );

  return (
    <div>
      <div className="grid gap-6 rounded-lg border border-line bg-white p-6 sm:grid-cols-2 sm:items-end">
        <div>
          <label htmlFor="leute" className="mb-2 block font-display text-lg font-bold">
            Wie viele Leute arbeiten bei euch?
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLeute((n) => Math.max(1, n - 1))}
              className="flex size-11 items-center justify-center rounded border border-line text-xl font-bold hover:border-ink focus-visible:outline-2 focus-visible:outline-signal"
              aria-label="Eine Person weniger"
            >
              −
            </button>
            <input
              id="leute"
              type="number"
              inputMode="numeric"
              min={1}
              max={500}
              value={leute}
              onChange={(e) => setLeute(Math.min(500, Math.max(1, Number(e.target.value) || 1)))}
              className="h-11 w-24 rounded border border-line px-3 text-center font-display text-xl font-bold focus-visible:outline-2 focus-visible:outline-signal"
            />
            <button
              type="button"
              onClick={() => setLeute((n) => Math.min(500, n + 1))}
              className="flex size-11 items-center justify-center rounded border border-line text-xl font-bold hover:border-ink focus-visible:outline-2 focus-visible:outline-signal"
              aria-label="Eine Person mehr"
            >
              +
            </button>
          </div>
          <p className="mt-2 text-sm text-muted">Chef, Büro, Monteure und Azubis – alle, die mit Macher OS arbeiten.</p>
        </div>
        <fieldset className="flex flex-col gap-2 sm:items-end">
          <legend className="mb-2 block font-display text-lg font-bold sm:text-right">Zahlweise</legend>
          <div className="inline-flex gap-1 rounded-xl bg-sand p-1">
            {(["monatlich", "jaehrlich"] as const).map((z) => (
              <label
                key={z}
                className={`flex min-h-11 cursor-pointer items-center rounded-md border px-5 py-2 text-base transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary ${
                  zahlweise === z ? "border-line-dark bg-white font-semibold text-signal-dark" : "border-transparent font-medium text-muted hover:bg-white"
                }`}
              >
                <input type="radio" name="zahlweise" value={z} checked={zahlweise === z} onChange={() => setZahlweise(z)} className="sr-only" />
                {z === "monatlich" ? "Monatlich" : `Jährlich (−${ersparnis} %)`}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <p className="mt-6 text-center font-display text-xl font-bold" aria-live="polite">
        Für {leute} {leute === 1 ? "Person" : "Leute"} passt <span className="text-signal-dark">{passend.name}</span>
        {passend.monatlich !== null && (
          <>
            {" "}
            – {formatPreis((zahlweise === "jaehrlich" ? passend.jaehrlich : passend.monatlich) ?? 0)} im Monat
          </>
        )}
        .
      </p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {plaene.map((p) => {
          const aktiv = p.id === passend.id;
          const preis = zahlweise === "jaehrlich" ? p.jaehrlich : p.monatlich;
          return (
            <li
              key={p.id}
              className={`flex flex-col rounded-lg p-6 transition-shadow ${aktiv ? "bg-white ring-2 ring-brand shadow-sm" : "border border-line bg-white"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-xl font-extrabold">{p.name}</p>
                {aktiv && <span className="rounded bg-signal px-2 py-0.5 text-xs font-bold text-white">Passt zu euch</span>}
              </div>
              <p className="mt-1 text-sm text-muted">{p.fuer}</p>
              <p className="mt-5 flex items-baseline gap-1.5">
                {preis === null ? (
                  <span className="font-display text-3xl font-extrabold">Auf Anfrage</span>
                ) : (
                  <>
                    <span className="font-display text-4xl font-extrabold">{formatPreis(preis)}</span>
                    <span className="text-sm text-muted">/ Monat</span>
                  </>
                )}
              </p>
              <p className="mt-1 text-xs text-muted">
                {preis === null ? "Persönliches Angebot" : zahlweise === "jaehrlich" ? "netto, jährlich im Voraus" : "netto, monatlich kündbar"}
                {preiseVorlaeufig && preis !== null ? " · vorläufig" : ""}
              </p>
              <p className="mt-4 text-sm font-semibold">{p.nutzer}</p>
              <ul className="mt-3 flex-1 space-y-2 text-sm">
                {p.vorteile.map((v) => (
                  <li key={v} className="flex gap-2">
                    <Icon name="check" className="mt-0.5 size-4 shrink-0 text-signal-dark" />
                    {v}
                  </li>
                ))}
              </ul>
              <Link
                href={p.cta.href}
                className={`mt-6 rounded py-3 text-center font-bold transition-colors ${aktiv ? "btn-primaer" : "border border-ink text-ink hover:bg-paper"}`}
              >
                {p.cta.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-center text-sm text-muted">
        Alle Preise netto pro Monat, zzgl. MwSt. Bezahlen per SEPA-Lastschrift oder Karte.
        {preiseVorlaeufig && " Die Preise sind vorläufig, bis wir sie freigeben."}
      </p>
    </div>
  );
}
