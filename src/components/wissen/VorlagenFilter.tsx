"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Auswahl } from "@/components/ui";
import type { WissenEintrag } from "@/content/wissen";
import { WissenKarte } from "./WissenKarte";

type Option = { slug: string; titel: string };

const gruppen = [
  { typ: "Vorlage", titel: "Vorlagen", text: "Zum Ausfüllen auf der Baustelle und im Büro." },
  { typ: "Checkliste", titel: "Checklisten", text: "Damit nichts vergessen wird." },
  { typ: "Formular", titel: "Formulare", text: "Zum Unterschreiben und Ablegen." },
] as const;

/** Vorlagen-Übersicht mit Filter nach Thema und Gewerk, gruppiert nach Art. */
export function VorlagenFilter({
  eintraege,
  themen,
  gewerke,
  startThema = null,
  startGewerk = null,
}: {
  eintraege: WissenEintrag[];
  themen: Option[];
  gewerke: Option[];
  startThema?: string | null;
  startGewerk?: string | null;
}) {
  const [thema, setThema] = useState(themen.find((t) => t.slug === startThema)?.slug ?? "");
  const [gewerk, setGewerk] = useState(gewerke.find((g) => g.slug === startGewerk)?.slug ?? "");

  const gefiltert = useMemo(
    () =>
      eintraege.filter(
        (e) =>
          (!thema || (e.themen as readonly string[]).includes(thema)) &&
          // Allgemeine Vorlagen (ohne Gewerk) passen zu jedem Gewerk.
          (!gewerk || e.gewerke.length === 0 || (e.gewerke as readonly string[]).includes(gewerk)),
      ),
    [eintraege, thema, gewerk],
  );

  return (
    <div>
      <div className="grid gap-4 rounded-lg border border-line bg-white p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Auswahl
          label="Thema"
          wert={thema}
          onChange={setThema}
          knopfKlasse="font-medium"
          optionen={[{ wert: "", label: "Alle Themen" }, ...themen.map((t) => ({ wert: t.slug, label: t.titel }))]}
        />
        <Auswahl
          label="Gewerk"
          wert={gewerk}
          onChange={setGewerk}
          knopfKlasse="font-medium"
          optionen={[{ wert: "", label: "Alle Gewerke" }, ...gewerke.map((g) => ({ wert: g.slug, label: g.titel }))]}
        />
        <button
          type="button"
          onClick={() => {
            setThema("");
            setGewerk("");
          }}
          disabled={!thema && !gewerk}
          className="btn-zweit"
        >
          Zurücksetzen
        </button>
      </div>

      <p className="mt-4 text-sm font-medium text-muted" aria-live="polite">
        {gefiltert.length} {gefiltert.length === 1 ? "Ergebnis" : "Ergebnisse"}
      </p>

      {gefiltert.length === 0 && (
        <p className="mt-4 rounded-lg border border-dashed border-line bg-white p-8 text-center text-muted">
          Für diese Auswahl gibt es noch keine Vorlage. Wähl ein anderes Thema oder setz den Filter zurück.
        </p>
      )}

      {gruppen.map((g) => {
        const liste = gefiltert.filter((e) => e.typ === g.typ);
        if (liste.length === 0) return null;
        return (
          <section key={g.typ} className="mt-10" aria-labelledby={`gruppe-${g.typ}`}>
            <h2 id={`gruppe-${g.typ}`} className="font-display text-2xl font-extrabold tracking-tight">
              {g.titel} <span className="text-base font-semibold text-muted">({liste.length})</span>
            </h2>
            <p className="mt-1 text-muted">{g.text}</p>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {liste.map((e) => (
                <li key={e.href}>
                  <WissenKarte eintrag={e} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

/** Variante, die `?thema=` und `?gewerk=` übernimmt. Muss in `<Suspense>` stehen. */
export function VorlagenFilterMitParams(props: { eintraege: WissenEintrag[]; themen: Option[]; gewerke: Option[] }) {
  const params = useSearchParams();
  return <VorlagenFilter {...props} startThema={params.get("thema")} startGewerk={params.get("gewerk")} />;
}
