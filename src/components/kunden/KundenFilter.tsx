"use client";

import { useId, useMemo, useState } from "react";
import { KundenCard } from "@/components/sections/KundenCard";
import { Icon } from "@/components/ui";
import type { FunktionSlug, KundeSlug, TopGewerkSlug } from "@/content/registry";
import type { Groesse } from "@/content/kunden";

type Eintrag = { slug: KundeSlug; gewerk: TopGewerkSlug; groesse: Groesse; funktionen: FunktionSlug[] };
type Option<T extends string> = { value: T; label: string };

/** Filterbare Liste der Kundenstories nach Gewerk, Betriebsgröße und Funktion. */
export function KundenFilter({
  eintraege,
  gewerke,
  groessen,
  funktionen,
}: {
  eintraege: Eintrag[];
  gewerke: Option<TopGewerkSlug>[];
  groessen: Option<Groesse>[];
  funktionen: Option<FunktionSlug>[];
}) {
  const [gewerk, setGewerk] = useState<TopGewerkSlug | "">("");
  const [groesse, setGroesse] = useState<Groesse | "">("");
  const [funktion, setFunktion] = useState<FunktionSlug | "">("");

  const treffer = useMemo(
    () =>
      eintraege.filter(
        (e) =>
          (!gewerk || e.gewerk === gewerk) &&
          (!groesse || e.groesse === groesse) &&
          (!funktion || e.funktionen.includes(funktion)),
      ),
    [eintraege, gewerk, groesse, funktion],
  );

  const aktiv = Boolean(gewerk || groesse || funktion);
  const zuruecksetzen = () => {
    setGewerk("");
    setGroesse("");
    setFunktion("");
  };

  return (
    <div>
      <div className="grid gap-3 rounded-xl border border-line bg-white p-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end sm:p-5">
        <FilterSelect label="Gewerk" value={gewerk} onChange={setGewerk} options={gewerke} alle="Alle Gewerke" />
        <FilterSelect
          label="Betriebsgröße"
          value={groesse}
          onChange={setGroesse}
          options={groessen}
          alle="Alle Größen"
        />
        <FilterSelect
          label="Genutzte Funktion"
          value={funktion}
          onChange={setFunktion}
          options={funktionen}
          alle="Alle Funktionen"
        />
        <button
          type="button"
          onClick={zuruecksetzen}
          disabled={!aktiv}
          className="h-11 rounded-lg px-4 text-sm font-semibold text-ink ring-1 ring-inset ring-line transition hover:ring-ink/40 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Zurücksetzen
        </button>
      </div>

      <p aria-live="polite" className="mt-5 text-sm font-semibold text-muted">
        {treffer.length === 1 ? "1 Beispielgeschichte" : `${treffer.length} Beispielgeschichten`}
      </p>

      {treffer.length > 0 ? (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {treffer.map((e) => (
            <li key={e.slug} className="flex [&>a]:w-full">
              <KundenCard slug={e.slug} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 flex flex-col items-start gap-4 rounded-xl border border-dashed border-line bg-white p-8">
          <Icon name="search" className="size-6 text-muted" />
          <p className="max-w-lg text-muted">
            Zu dieser Auswahl gibt es noch keine Geschichte. Probier eine andere Kombination – oder schau dir alle an.
          </p>
          <button
            type="button"
            onClick={zuruecksetzen}
            className="rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-soft"
          >
            Alle Geschichten zeigen
          </button>
        </div>
      )}
    </div>
  );
}

function FilterSelect<T extends string>({
  label,
  value,
  onChange,
  options,
  alle,
}: {
  label: string;
  value: T | "";
  onChange: (v: T | "") => void;
  options: Option<T>[];
  alle: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold font-tagline uppercase tracking-wider text-muted">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as T | "")}
          className="h-11 w-full appearance-none rounded-lg bg-paper pl-3 pr-9 text-[0.95rem] font-semibold ring-1 ring-inset ring-line hover:ring-ink/40"
        >
          <option value="">{alle}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Icon
          name="chevron-down"
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
        />
      </div>
    </div>
  );
}
