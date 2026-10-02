"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { AppVorschau, VorschauRahmen } from "@/components/mocks";
import { Icon, type IconName } from "@/components/ui/Icon";

type Start = "heute" | "auftraege" | "planen" | "rechnungen" | "betrieb";

/** Die fünf Kernelemente – jedes öffnet die klickbare Vorschau an der passenden Stelle. */
const elemente: { id: Start; label: string; icon: IconName; text: string }[] = [
  { id: "heute", label: "Heute", icon: "spark", text: "Was jetzt wichtig ist – und was deine Entscheidung braucht." },
  { id: "auftraege", label: "Aufträge", icon: "clipboard", text: "Anfragen, Angebote und Aufträge an einem Ort." },
  { id: "planen", label: "Planen", icon: "calendar", text: "Kalender und Plantafel – Macher schlägt den Einsatz vor." },
  { id: "rechnungen", label: "Rechnungen", icon: "euro", text: "Rechnungen vorbereitet, offene Zahlungen im Blick." },
  { id: "betrieb", label: "Betrieb", icon: "home", text: "Team, Material und Unternehmen – alles beisammen." },
];

/**
 * Fünf Kernelemente als heller Umschalter, darunter die Oberfläche (nach dem Vorbild von Personio):
 * Tabs nach WAI-ARIA (Pfeiltasten, Pos1/Ende), die Vorschau startet beim Wechsel neu in der gewählten Ansicht.
 */
export function KernBereiche() {
  const [aktiv, setAktiv] = useState<Start>("heute");
  const knoepfe = useRef<(HTMLButtonElement | null)[]>([]);
  const index = elemente.findIndex((e) => e.id === aktiv);
  const element = elemente[index];

  const taste = (e: KeyboardEvent) => {
    const ziel =
      e.key === "ArrowRight" ? (index + 1) % elemente.length
      : e.key === "ArrowLeft" ? (index - 1 + elemente.length) % elemente.length
      : e.key === "Home" ? 0
      : e.key === "End" ? elemente.length - 1
      : -1;
    if (ziel < 0) return;
    e.preventDefault();
    setAktiv(elemente[ziel].id);
    knoepfe.current[ziel]?.focus();
  };

  return (
    <div>
      <div role="tablist" aria-label="Kernelemente von Macher OS" onKeyDown={taste} className="flex flex-wrap justify-center gap-2">
        {elemente.map((e, n) => {
          const an = e.id === aktiv;
          return (
            <button
              key={e.id}
              ref={(el) => {
                knoepfe.current[n] = el;
              }}
              type="button"
              role="tab"
              id={`kern-tab-${e.id}`}
              aria-selected={an}
              aria-controls="kern-panel"
              tabIndex={an ? 0 : -1}
              onClick={() => setAktiv(e.id)}
              className={`inline-flex min-h-12 items-center gap-2 rounded px-5 text-base font-semibold transition-colors duration-150 ease-out ${
                an ? "bg-signal-soft text-signal-dark ring-2 ring-inset ring-primary" : "bg-white text-ink ring-1 ring-inset ring-line hover:bg-signal-soft"
              }`}
            >
              <Icon name={e.icon} className="size-5" />
              {e.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id="kern-panel" aria-labelledby={`kern-tab-${aktiv}`} className="mt-6">
        <p className="mx-auto max-w-xl text-center text-lg text-muted" aria-live="polite">
          {element.text}
        </p>
        <VorschauRahmen hinweis="Klick dich durch – alles Beispieldaten." className="mx-auto mt-8 max-w-6xl">
          <AppVorschau key={aktiv} start={aktiv} className="lg:h-[40rem]" />
        </VorschauRahmen>
      </div>
    </div>
  );
}
