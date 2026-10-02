"use client";

import { useId, useState } from "react";
import { Icon, type IconName } from "@/components/ui";
import type { DemoGewerk, Farbe } from "@/content/demo";
import { tabKeyHandler } from "./tabs";

export const farbKlassen: Record<Farbe, string> = {
  sky: "bg-sky text-white",
  signal: "bg-signal text-white",
  moss: "bg-moss text-white",
  sand: "bg-sand text-muted",
  "sky-soft": "bg-sky-soft text-sky",
  "moss-soft": "bg-moss-soft text-moss",
};

const balkenKlassen: Record<Farbe, string> = {
  sky: "bg-sky",
  signal: "bg-signal",
  moss: "bg-moss",
  sand: "bg-line",
  "sky-soft": "bg-sky-soft",
  "moss-soft": "bg-moss-soft",
};

type Ansicht = "heute" | "auftrag" | "plan" | "betrieb" | "automatisch";
const ansichten: { id: Ansicht; label: string; icon: IconName }[] = [
  { id: "heute", label: "Heute", icon: "home" },
  { id: "auftrag", label: "Auftrag", icon: "clipboard" },
  { id: "plan", label: "Plan", icon: "calendar" },
  { id: "betrieb", label: "Betrieb", icon: "layers" },
  { id: "automatisch", label: "Automatisch", icon: "spark" },
];

/**
 * Klickbare, stilisierte Produktansicht (kein echtes Produkt) mit den Bereichen
 * Heute, Auftrag, Plan, Betrieb und automatische Arbeit.
 */
export function DemoApp({ daten }: { daten: DemoGewerk }) {
  const [ansicht, setAnsicht] = useState<Ansicht>("heute");
  const [erledigt, setErledigt] = useState<boolean[]>(() => daten.auftrag.schritte.map((_, i) => i < 1));
  const [uebernommen, setUebernommen] = useState<boolean[]>(() => daten.automatisch.vorschlaege.map(() => false));
  const id = useId();
  const index = ansichten.findIndex((a) => a.id === ansicht);
  const waehle = (i: number) => setAnsicht(ansichten[i].id);

  return (
    <div className="overflow-hidden rounded-xl border border-ink/10 bg-white shadow-2xl shadow-ink/10">
      <div className="flex items-center gap-1.5 border-b border-line px-4 py-3">
        <span className="size-2.5 rounded-full bg-line" />
        <span className="size-2.5 rounded-full bg-line" />
        <span className="size-2.5 rounded-full bg-line" />
        <span className="ml-3 text-xs font-semibold text-muted">Macher OS · Beispieldaten</span>
      </div>
      <div className="grid grid-cols-[auto_1fr]">
        <div
          role="tablist"
          aria-label="Bereiche der Demo"
          aria-orientation="vertical"
          className="flex flex-col gap-1 border-r border-line p-2 sm:w-44 sm:p-3"
        >
          {ansichten.map((a, i) => {
            const aktiv = a.id === ansicht;
            return (
              <button
                key={a.id}
                type="button"
                role="tab"
                id={`${id}-tab-${a.id}`}
                aria-selected={aktiv}
                aria-controls={`${id}-panel`}
                tabIndex={aktiv ? 0 : -1}
                onClick={() => setAnsicht(a.id)}
                onKeyDown={tabKeyHandler(i, ansichten.length, waehle)}
                className={`flex items-center gap-2 rounded-md px-2.5 py-2.5 text-left text-sm font-semibold transition-colors sm:px-3 ${
                  aktiv ? "bg-ink text-white" : "text-muted hover:bg-sand hover:text-ink"
                }`}
              >
                <Icon name={a.icon} className="size-4.5 shrink-0" />
                <span className="sr-only sm:not-sr-only">{a.label}</span>
              </button>
            );
          })}
        </div>
        <div
          role="tabpanel"
          id={`${id}-panel`}
          aria-labelledby={`${id}-tab-${ansicht}`}
          tabIndex={0}
          className="min-h-[26rem] min-w-0 bg-paper/60 p-3 sm:p-5"
        >
          {ansicht === "heute" && <Heute daten={daten} oeffneAuftrag={() => setAnsicht("auftrag")} />}
          {ansicht === "auftrag" && (
            <Auftrag
              daten={daten}
              erledigt={erledigt}
              umschalten={(i) => setErledigt((e) => e.map((v, j) => (j === i ? !v : v)))}
            />
          )}
          {ansicht === "plan" && <Plan daten={daten} />}
          {ansicht === "betrieb" && <Betrieb daten={daten} />}
          {ansicht === "automatisch" && (
            <Automatisch
              daten={daten}
              uebernommen={uebernommen}
              uebernehmen={(i) => setUebernommen((u) => u.map((v, j) => (j === i ? true : v)))}
            />
          )}
          <p className="sr-only" aria-live="polite">
            Bereich {ansichten[index].label} geöffnet
          </p>
        </div>
      </div>
    </div>
  );
}

function Kopf({ titel, rechts }: { titel: string; rechts?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-2">
      <p className="font-display text-base font-bold sm:text-lg">{titel}</p>
      {rechts && <p className="hidden text-xs text-muted sm:block">{rechts}</p>}
    </div>
  );
}

function Heute({ daten, oeffneAuftrag }: { daten: DemoGewerk; oeffneAuftrag: () => void }) {
  const h = daten.heute;
  return (
    <div className="space-y-3">
      <Kopf titel={`Guten Morgen, ${daten.chef}`} rechts={h.datum} />
      <div className="grid grid-cols-3 gap-2">
        {[
          [String(h.einsaetze.length), "Einsätze heute"],
          [String(h.anfragen), "neue Anfragen"],
          [h.offen, "offen"],
        ].map(([n, l]) => (
          <div key={l} className="rounded-lg border border-line bg-white p-2.5 sm:p-3">
            <div className="font-display text-sm font-extrabold sm:text-lg">{n}</div>
            <div className="text-[0.65rem] text-muted sm:text-xs">{l}</div>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-line bg-white">
        {h.einsaetze.map((e) => (
          <button
            key={e.zeit}
            type="button"
            onClick={oeffneAuftrag}
            className="flex w-full items-center gap-3 border-b border-line px-3 py-2.5 text-left last:border-0 hover:bg-sand/60"
          >
            <span className={`h-8 w-1 shrink-0 rounded-full ${balkenKlassen[e.farbe]}`} />
            <span className="w-10 shrink-0 text-xs font-semibold text-muted">{e.zeit}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold sm:text-sm">{e.titel}</span>
              <span className="block truncate text-[0.7rem] text-muted sm:text-xs">
                {e.wer} · {e.ort}
              </span>
            </span>
            <Icon name="arrow-right" className="size-4 shrink-0 text-muted" />
          </button>
        ))}
      </div>
      <div className="rounded-lg border border-moss/30 bg-moss-soft p-3">
        <p className="flex items-center gap-1.5 text-xs font-bold text-moss">
          <Icon name="spark" className="size-3.5" /> Macher hat erledigt
        </p>
        <ul className="mt-1.5 space-y-1 text-xs text-ink-soft sm:text-sm">
          {daten.automatisch.erledigt.map((x) => (
            <li key={x}>✓ {x}</li>
          ))}
        </ul>
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-signal/40 bg-signal-soft p-3 text-xs sm:text-sm">
        <Icon name="box" className="size-4 shrink-0 text-signal-dark" />
        <span>
          <b>Achtung:</b> {h.hinweis}
        </span>
      </div>
    </div>
  );
}

const materialStatus = {
  da: { label: "da", klasse: "bg-moss-soft text-moss" },
  bestellt: { label: "bestellt", klasse: "bg-sky-soft text-sky" },
  fehlt: { label: "fehlt", klasse: "bg-signal-soft text-signal-dark" },
};

function Auftrag({
  daten,
  erledigt,
  umschalten,
}: {
  daten: DemoGewerk;
  erledigt: boolean[];
  umschalten: (i: number) => void;
}) {
  const a = daten.auftrag;
  const anzahl = erledigt.filter(Boolean).length;
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-line bg-white p-3 sm:p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-display text-base font-bold leading-tight sm:text-lg">{a.titel}</p>
            <p className="mt-0.5 text-xs text-muted sm:text-sm">
              {a.kunde} · {a.adresse}
            </p>
          </div>
          <span className="rounded-md bg-sky-soft px-2 py-0.5 text-xs font-semibold text-sky">{a.status}</span>
        </div>
        <p className="mt-2 text-xs text-ink-soft sm:text-sm">{a.notiz}</p>
      </div>
      <fieldset className="rounded-lg border border-line bg-white p-3 sm:p-4">
        <legend className="sr-only">Arbeitsschritte</legend>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Arbeitsschritte</p>
          <p className="text-xs font-semibold text-moss">
            {anzahl} von {a.schritte.length} erledigt
          </p>
        </div>
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-sand">
          <div className="h-full bg-moss transition-all" style={{ width: `${(anzahl / a.schritte.length) * 100}%` }} />
        </div>
        <ul className="space-y-1">
          {a.schritte.map((s, i) => (
            <li key={s}>
              <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1 text-xs hover:bg-sand/60 sm:text-sm">
                <input
                  type="checkbox"
                  checked={erledigt[i]}
                  onChange={() => umschalten(i)}
                  className="size-4 accent-[var(--color-moss)]"
                />
                <span className={erledigt[i] ? "text-muted line-through" : ""}>{s}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
      <div className="rounded-lg border border-line bg-white p-3 sm:p-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Material</p>
        <ul className="space-y-1.5">
          {a.material.map((m) => (
            <li key={m.name} className="flex items-center justify-between gap-2 text-xs sm:text-sm">
              <span className="min-w-0 truncate">{m.name}</span>
              <span className={`shrink-0 rounded-md px-2 py-0.5 text-[0.7rem] font-semibold ${materialStatus[m.status].klasse}`}>
                {materialStatus[m.status].label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const tage = ["Mo", "Di", "Mi", "Do", "Fr"];

function Plan({ daten }: { daten: DemoGewerk }) {
  const p = daten.plan;
  return (
    <div>
      <Kopf titel={`Plan · ${p.woche}`} rechts="Woche" />
      <div className="overflow-hidden rounded-lg border border-line bg-white">
        <div className="grid grid-cols-[4.5rem_repeat(5,minmax(0,1fr))] text-xs sm:grid-cols-[6rem_repeat(5,minmax(0,1fr))]">
          <div />
          {tage.map((d) => (
            <div key={d} className="border-l border-line px-1 py-2 text-center font-semibold text-muted">
              {d}
            </div>
          ))}
          {p.zeilen.map((z) => (
            <div key={z.name} className="contents">
              <div className="border-t border-line px-2 py-3 sm:px-3">
                <div className="truncate font-semibold">{z.name}</div>
                <div className="truncate text-[0.65rem] text-muted">{z.rolle}</div>
              </div>
              <div className="col-span-5 grid grid-cols-5 gap-1 border-t border-line p-1.5">
                {z.bloecke.map((b) => (
                  <div
                    key={b.label + b.start}
                    style={{ gridColumn: `${b.start + 1} / span ${b.len}` }}
                    className={`flex items-center truncate rounded-md px-1.5 py-2 text-[0.65rem] font-semibold sm:px-2 sm:text-[0.7rem] ${farbKlassen[b.farbe]}`}
                    title={b.label}
                  >
                    {b.label}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 rounded-lg border border-signal/40 bg-signal-soft p-3 text-xs sm:text-sm">
        <p className="flex items-center gap-1.5 font-bold text-signal-dark">
          <Icon name="spark" className="size-3.5" /> Macher-Vorschlag
        </p>
        <p className="mt-1">{p.vorschlag}</p>
      </div>
    </div>
  );
}

function Betrieb({ daten }: { daten: DemoGewerk }) {
  const b = daten.betrieb;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-lg border border-line bg-white p-3 sm:p-4">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
          <Icon name="users" className="size-3.5" /> Mitarbeiter
        </p>
        <ul className="space-y-2">
          {b.mitarbeiter.map((m) => (
            <li key={m.name} className="flex items-center gap-2.5">
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-sand text-xs font-bold">
                {m.name.slice(0, 2)}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">
                  {m.name} <span className="font-normal text-muted">· {m.rolle}</span>
                </span>
                <span className="block truncate text-xs text-muted">{m.info}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-lg border border-line bg-white p-3 sm:p-4">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
          <Icon name="warehouse" className="size-3.5" /> Lager
        </p>
        <ul className="space-y-2">
          {b.lager.map((l) => (
            <li key={l.artikel} className="flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 truncate">{l.artikel}</span>
              <span
                className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${
                  l.warnung ? "bg-signal-soft text-signal-dark" : "bg-sand text-ink-soft"
                }`}
              >
                {l.bestand}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex items-center gap-2.5 rounded-lg border border-line bg-white p-3 text-sm sm:col-span-2 sm:p-4">
        <Icon name="truck" className="size-5 shrink-0 text-sky" />
        <span>
          <b>Fahrzeug:</b> {b.fahrzeug}
        </span>
      </div>
    </div>
  );
}

function Automatisch({
  daten,
  uebernommen,
  uebernehmen,
}: {
  daten: DemoGewerk;
  uebernommen: boolean[];
  uebernehmen: (i: number) => void;
}) {
  const a = daten.automatisch;
  return (
    <div className="space-y-3">
      <Kopf titel="Macher erledigt" rechts="automatische Arbeit" />
      <div className="rounded-lg border border-moss/30 bg-moss-soft p-3 sm:p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-moss">Schon erledigt</p>
        <ul className="mt-2 space-y-1.5 text-sm">
          {a.erledigt.map((x) => (
            <li key={x} className="flex gap-2">
              <Icon name="check" className="mt-0.5 size-4 shrink-0 text-moss" /> {x}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-lg border border-line bg-white p-3 sm:p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Wartet auf dich</p>
        <ul className="mt-2 space-y-2">
          {a.vorschlaege.map((v, i) => (
            <li key={v.text} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-paper p-2.5 text-sm">
              <span className="min-w-0 flex-1">{v.text}</span>
              {uebernommen[i] ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-moss px-2.5 py-1 text-xs font-bold text-white">
                  <Icon name="check" className="size-3.5" /> Erledigt
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => uebernehmen(i)}
                  className="rounded-md bg-signal px-2.5 py-1 text-xs font-bold text-white hover:bg-signal-dark"
                >
                  {v.aktion}
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-muted">Du entscheidest: Macher bereitet vor, du bestätigst.</p>
    </div>
  );
}
