"use client";

import { useState } from "react";
import { Icon } from "@/components/ui";
import type { DemoGewerk, Farbe } from "@/content/demo";
import { AppFenster, AppSeitenleiste, Blatt, VorschauStatus, type NavEintrag, type StatusTon, type VorschauBereich } from "@/components/mocks/AppFenster";

/** Plantafel-Blöcke wie in der Software: ein Grün für Einsätze, hell für Begleitung, ruhig für Abwesenheit */
export const farbKlassen: Record<Farbe, string> = {
  sky: "bg-primary text-white",
  signal: "bg-primary text-white",
  moss: "bg-primary text-white",
  sand: "bg-app-ruhig text-muted",
  "sky-soft": "bg-signal-soft text-signal-dark ring-1 ring-inset ring-primary/20",
  "moss-soft": "bg-signal-soft text-signal-dark ring-1 ring-inset ring-primary/20",
};

/** Kleiner Punkt statt Streifen an der Kante */
const punktKlassen: Record<Farbe, string> = {
  sky: "bg-line-dark",
  signal: "bg-primary",
  moss: "bg-moss",
  sand: "bg-line",
  "sky-soft": "bg-line-dark",
  "moss-soft": "bg-moss",
};

type Ansicht = "heute" | "auftrag" | "plan" | "betrieb" | "automatisch";
const ansichtFuer: Record<VorschauBereich, Ansicht> = { heute: "heute", auftraege: "auftrag", planen: "plan", betrieb: "betrieb" };
const bereichFuer: Partial<Record<Ansicht, VorschauBereich>> = { heute: "heute", auftrag: "auftraege", plan: "planen", betrieb: "betrieb" };
const labels: Record<Ansicht, string> = { heute: "Heute", auftrag: "Aufträge", plan: "Planen", betrieb: "Betrieb", automatisch: "Automatisch" };
const favoriten: NavEintrag<"automatisch">[] = [{ id: "automatisch", label: "Automatisch", glas: "macher" }];

/**
 * Klickbare, stilisierte Produktansicht (kein echtes Produkt) im Rahmen der Software (`AppFenster`):
 * Heute, Aufträge, Planen, Betrieb und als Favorit „Automatisch“.
 */
export function DemoApp({ daten }: { daten: DemoGewerk }) {
  const [ansicht, setAnsicht] = useState<Ansicht>("heute");
  const [erledigt, setErledigt] = useState<boolean[]>(() => daten.auftrag.schritte.map((_, i) => i < 1));
  const [uebernommen, setUebernommen] = useState<boolean[]>(() => daten.automatisch.vorschlaege.map(() => false));

  return (
    <AppFenster
      aria-label="Klickbare Vorschau mit Beispieldaten"
      className="h-full"
      seitenleiste={
        <AppSeitenleiste
          aktiv={bereichFuer[ansicht]}
          aktivFavorit={ansicht === "automatisch" ? "automatisch" : undefined}
          favoriten={favoriten}
          waehle={(b) => setAnsicht(ansichtFuer[b])}
          waehleFavorit={() => setAnsicht("automatisch")}
          navLabel="Bereiche der Demo"
        />
      }
    >
      <div key={ansicht} className="vorschau-ein min-h-[26rem]">
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
      </div>
      <p className="sr-only" aria-live="polite">
        Bereich {labels[ansicht]} geöffnet
      </p>
    </AppFenster>
  );
}

function Kopf({ titel, rechts }: { titel: string; rechts?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-2">
      <p className="font-display text-lg font-bold text-ink">{titel}</p>
      {rechts && <p className="hidden text-[11px] text-muted sm:block">{rechts}</p>}
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
          <Blatt key={l} className="p-2.5">
            <div className="font-display text-base font-bold sm:text-lg">{n}</div>
            <div className="text-[11px] text-muted">{l}</div>
          </Blatt>
        ))}
      </div>
      <p className="text-[13px] font-semibold text-ink">Heute im Betrieb</p>
      <Blatt className="divide-y divide-app-linie">
        {h.einsaetze.map((e) => (
          <button
            key={e.zeit}
            type="button"
            onClick={oeffneAuftrag}
            className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors duration-150 hover:bg-hover"
          >
            <span className="w-11 shrink-0 font-display text-sm font-bold tabular-nums">{e.zeit}</span>
            <span aria-hidden className={`size-2 shrink-0 rounded-full ${punktKlassen[e.farbe]}`} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold">{e.titel}</span>
              <span className="block truncate text-[11px] text-muted">
                {e.wer} · {e.ort}
              </span>
            </span>
            <Icon name="chevron-right" className="size-4 shrink-0 text-muted" />
          </button>
        ))}
      </Blatt>
      <div className="flex items-start gap-2 rounded-xl bg-warning-soft p-3 text-[13px] text-ink">
        <Icon name="achtung" className="mt-0.5 size-4 shrink-0 text-warning" />
        <span>
          <b className="text-warning">Achtung:</b> {h.hinweis}
        </span>
      </div>
      <div className="rounded-xl bg-signal-soft p-3">
        <p className="flex items-center gap-1.5 text-xs font-bold text-signal-dark">
          <Icon name="spark" className="size-3.5" /> Macher hat erledigt
        </p>
        <ul className="mt-1.5 space-y-1 text-[13px] text-ink">
          {daten.automatisch.erledigt.map((x) => (
            <li key={x} className="flex gap-1.5">
              <Icon name="check" className="mt-0.5 size-3.5 shrink-0 text-moss" /> {x}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const materialStatus: Record<"da" | "bestellt" | "fehlt", { label: string; ton: StatusTon }> = {
  da: { label: "da", ton: "erfolg" },
  bestellt: { label: "bestellt", ton: "neutral" },
  fehlt: { label: "fehlt", ton: "warnung" },
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
      <Blatt className="p-3 sm:p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-display text-lg font-bold leading-tight">{a.titel}</p>
            <p className="mt-0.5 text-[12px] text-muted">
              {a.kunde} · {a.adresse}
            </p>
          </div>
          <VorschauStatus ton="neutral">{a.status}</VorschauStatus>
        </div>
        <p className="mt-2 text-[13px] text-ink">{a.notiz}</p>
      </Blatt>
      <fieldset className="app-lift rounded-xl border border-app-linie bg-white p-3 sm:p-4">
        <legend className="sr-only">Arbeitsschritte</legend>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[13px] font-semibold text-ink">Arbeitsschritte</p>
          <p className="text-xs font-semibold text-moss">
            {anzahl} von {a.schritte.length} erledigt
          </p>
        </div>
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-app-ruhig">
          <div className="h-full bg-primary transition-all" style={{ width: `${(anzahl / a.schritte.length) * 100}%` }} />
        </div>
        <ul className="space-y-1">
          {a.schritte.map((s, i) => (
            <li key={s}>
              <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1 text-[13px] hover:bg-hover">
                <input
                  type="checkbox"
                  checked={erledigt[i]}
                  onChange={() => umschalten(i)}
                  className="size-4 accent-[var(--color-primary)]"
                />
                <span className={erledigt[i] ? "text-muted line-through" : ""}>{s}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
      <Blatt className="p-3 sm:p-4">
        <p className="mb-2 text-[13px] font-semibold text-ink">Material</p>
        <ul className="space-y-1.5">
          {a.material.map((m) => (
            <li key={m.name} className="flex items-center justify-between gap-2 text-[13px]">
              <span className="min-w-0 truncate">{m.name}</span>
              <VorschauStatus ton={materialStatus[m.status].ton}>{materialStatus[m.status].label}</VorschauStatus>
            </li>
          ))}
        </ul>
      </Blatt>
    </div>
  );
}

const tage = ["Mo", "Di", "Mi", "Do", "Fr"];

function Plan({ daten }: { daten: DemoGewerk }) {
  const p = daten.plan;
  return (
    <div>
      <Kopf titel={`Plan · ${p.woche}`} rechts="Woche" />
      <Blatt>
        <div className="grid grid-cols-[4.5rem_repeat(5,minmax(0,1fr))] text-xs sm:grid-cols-[6rem_repeat(5,minmax(0,1fr))]">
          <div />
          {tage.map((d) => (
            <div key={d} className="border-l border-app-linie px-1 py-2 text-center font-semibold text-muted">
              {d}
            </div>
          ))}
          {p.zeilen.map((z) => (
            <div key={z.name} className="contents">
              <div className="border-t border-app-linie px-2 py-3 sm:px-3">
                <div className="truncate font-semibold">{z.name}</div>
                <div className="truncate text-[0.65rem] text-muted">{z.rolle}</div>
              </div>
              <div className="col-span-5 grid grid-cols-5 gap-1 border-t border-app-linie p-1.5">
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
      </Blatt>
      <div className="mt-3 rounded-xl bg-signal-soft p-3 text-[13px]">
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
    <div className="space-y-3">
      <Kopf titel="Betrieb" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Blatt className="p-3 sm:p-4">
          <p className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-ink">
            <Icon name="users" className="size-4 text-muted" /> Mitarbeiter
          </p>
          <ul className="space-y-2">
            {b.mitarbeiter.map((m) => (
              <li key={m.name} className="flex items-center gap-2.5">
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-signal-dark text-[11px] font-bold text-white">
                  {m.name.slice(0, 2)}
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold">
                    {m.name} <span className="font-normal text-muted">· {m.rolle}</span>
                  </span>
                  <span className="block truncate text-[11px] text-muted">{m.info}</span>
                </span>
              </li>
            ))}
          </ul>
        </Blatt>
        <Blatt className="p-3 sm:p-4">
          <p className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-ink">
            <Icon name="warehouse" className="size-4 text-muted" /> Lager
          </p>
          <ul className="space-y-2">
            {b.lager.map((l) => (
              <li key={l.artikel} className="flex items-center justify-between gap-2 text-[13px]">
                <span className="min-w-0 truncate">{l.artikel}</span>
                {l.warnung ? (
                  <VorschauStatus ton="warnung">{l.bestand}</VorschauStatus>
                ) : (
                  <span className="shrink-0 text-[13px] font-semibold tabular-nums">{l.bestand}</span>
                )}
              </li>
            ))}
          </ul>
        </Blatt>
        <Blatt className="flex items-center gap-2.5 p-3 text-[13px] sm:col-span-2 sm:p-4">
          <Icon name="truck" className="size-5 shrink-0 text-muted" />
          <span>
            <b>Fahrzeug:</b> {b.fahrzeug}
          </span>
        </Blatt>
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
      <div>
        <p className="mb-1.5 text-[13px] font-semibold text-ink">Wartet auf dich</p>
        <Blatt className="divide-y divide-app-linie">
          {a.vorschlaege.map((v, i) => (
            <div key={v.text} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-[13px]">
              <span className="min-w-0 flex-1">{v.text}</span>
              {uebernommen[i] ? (
                <VorschauStatus ton="erfolg">Erledigt</VorschauStatus>
              ) : (
                <button
                  type="button"
                  onClick={() => uebernehmen(i)}
                  className="rounded-lg bg-primary px-2.5 py-1.5 text-[12px] font-semibold text-white transition-colors duration-150 hover:bg-primary-hover"
                >
                  {v.aktion}
                </button>
              )}
            </div>
          ))}
        </Blatt>
      </div>
      <div className="rounded-xl bg-signal-soft p-3 sm:p-4">
        <p className="text-[13px] font-semibold text-signal-dark">Schon erledigt</p>
        <ul className="mt-2 space-y-1.5 text-[13px] text-ink">
          {a.erledigt.map((x) => (
            <li key={x} className="flex gap-2">
              <Icon name="check" className="mt-0.5 size-4 shrink-0 text-moss" /> {x}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-muted">Du entscheidest: Macher bereitet vor, du bestätigst.</p>
    </div>
  );
}
