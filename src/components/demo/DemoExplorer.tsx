"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Container, Icon, zone, type IconName } from "@/components/ui";
import { demoGewerke } from "@/content/demo";
import { DemoApp } from "./DemoApp";
import { DemoTour } from "./DemoTour";
import { tabKeyHandler } from "./tabs";

/** Demo nach Gewerk: Auswahl steuert die Beispielinhalte der Produktansicht und der Tour. */
export function DemoExplorer() {
  const [index, setIndex] = useState(0);
  const daten = demoGewerke[index];
  const id = useId();

  return (
    <>
      <section id="demo" {...zone("weiss", "py-14 sm:py-20")} aria-labelledby={`${id}-titel`}>
        <Container>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-3 text-sm font-semibold font-tagline uppercase tracking-[0.06em] text-signal-dark">Demo auswählen</p>
              <h2
                id={`${id}-titel`}
                className="font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-balance sm:text-4xl"
              >
                Wähle dein Gewerk.
              </h2>
              <p className="mt-3 text-lg text-muted">
                Die Demo zeigt Aufträge, Material und Abläufe aus deinem Alltag. Klick dich durch die Bereiche.
              </p>
            </div>
          </div>

          <div
            role="tablist"
            aria-label="Gewerk für die Demo"
            className="mt-8 flex gap-2 overflow-x-auto pb-1"
          >
            {demoGewerke.map((g, i) => {
              const aktiv = i === index;
              return (
                <button
                  key={g.id}
                  type="button"
                  role="tab"
                  id={`${id}-g-${g.id}`}
                  aria-selected={aktiv}
                  aria-controls={`${id}-g-panel`}
                  tabIndex={aktiv ? 0 : -1}
                  onClick={() => setIndex(i)}
                  onKeyDown={tabKeyHandler(i, demoGewerke.length, setIndex)}
                  className={`shrink-0 rounded-md px-4 py-2.5 text-sm font-bold whitespace-nowrap transition-colors ${
                    aktiv ? "bg-signal-soft text-signal-dark ring-1 ring-inset ring-primary" : "bg-white text-ink ring-1 ring-inset ring-line-dark hover:bg-signal-soft"
                  }`}
                >
                  {g.label}
                </button>
              );
            })}
          </div>

          <div
            role="tabpanel"
            id={`${id}-g-panel`}
            aria-labelledby={`${id}-g-${daten.id}`}
            className="mt-6 grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start"
          >
            <DemoApp key={daten.id} daten={daten} />
            <div className="rounded-xl bg-paper p-6 ring-1 ring-line">
              <p className="font-display text-lg font-bold">So probierst du die Demo aus</p>
              <ul className="mt-4 space-y-3 text-[0.95rem] leading-relaxed">
                {(
                  [
                  ["home", "Heute: Was jetzt wichtig ist. Klick auf einen Einsatz, um den Auftrag zu öffnen."],
                  ["clipboard", "Auftrag: Arbeitsschritte abhaken und sehen, welches Material fehlt."],
                  ["calendar", "Plan: Wer ist wann wo – mit Vorschlag von Macher."],
                  ["layers", "Betrieb: Mitarbeiter, Lager und Fahrzeuge."],
                  ["spark", "Automatisch: Was Macher erledigt hat und was auf dich wartet."],
                  ] as [IconName, string][]
                ).map(([icon, text]) => (
                  <li key={icon} className="flex gap-3">
                    <Icon name={icon} className="mt-0.5 size-5 shrink-0 text-signal-dark" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 border-t border-line pt-4 text-sm text-muted">
                Alle Namen und Zahlen sind Beispieldaten.
              </p>
              {daten.gewerk ? (
                <Link
                  href={`/gewerke/${daten.gewerk}`}
                  className="mt-4 inline-flex items-center gap-1.5 font-semibold underline decoration-signal decoration-2 underline-offset-4 hover:decoration-ink"
                >
                  Macher OS für {daten.label} <Icon name="arrow-right" className="size-4" />
                </Link>
              ) : (
                <Link
                  href="/gewerke"
                  className="mt-4 inline-flex items-center gap-1.5 font-semibold underline decoration-signal decoration-2 underline-offset-4 hover:decoration-ink"
                >
                  Alle Gewerke ansehen <Icon name="arrow-right" className="size-4" />
                </Link>
              )}
            </div>
          </div>
        </Container>
      </section>

      <section id="tour" {...zone("beige", "py-14 sm:py-20")} aria-labelledby={`${id}-tour`}>
        <Container>
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-semibold font-tagline uppercase tracking-[0.06em] text-signal-dark">
              5-Minuten-Tour · {daten.label}
            </p>
            <h2
              id={`${id}-tour`}
              className="font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-balance sm:text-4xl"
            >
              Vom Anruf bis zur Rechnung.
            </h2>
            <p className="mt-3 text-lg text-muted">
              Fünf Schritte, ein Auftrag. So läuft es mit Macher OS – Schritt für Schritt.
            </p>
          </div>
          <div className="mt-10">
            <DemoTour key={daten.id} daten={daten} />
          </div>
        </Container>
      </section>
    </>
  );
}
