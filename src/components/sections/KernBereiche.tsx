"use client";

import {
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { AppVorschau, VorschauRahmen } from "@/components/mocks";
import { Icon, type IconName } from "@/components/ui/Icon";

type Start = "heute" | "auftraege" | "planen" | "rechnungen" | "betrieb";

/** Die fünf Kernelemente – jedes öffnet die klickbare Vorschau an der passenden Stelle. */
const elemente: { id: Start; label: string; icon: IconName; text: string }[] = [
  {
    id: "heute",
    label: "Heute",
    icon: "spark",
    text: "Was jetzt wichtig ist – und was deine Entscheidung braucht.",
  },
  {
    id: "auftraege",
    label: "Aufträge",
    icon: "clipboard",
    text: "Anfragen, Angebote und Aufträge an einem Ort.",
  },
  {
    id: "planen",
    label: "Planen",
    icon: "calendar",
    text: "Kalender und Plantafel – Macher schlägt den Einsatz vor.",
  },
  {
    id: "rechnungen",
    label: "Rechnungen",
    icon: "euro",
    text: "Rechnungen vorbereitet, offene Zahlungen im Blick.",
  },
  {
    id: "betrieb",
    label: "Betrieb",
    icon: "home",
    text: "Team, Material und Unternehmen – alles beisammen.",
  },
];

/** Wünscht das System reduzierte Bewegung? Dann wechselt nichts von allein. */
const RUHIG = "(prefers-reduced-motion: reduce)";
function ruhigAbo(melden: () => void) {
  const m = window.matchMedia(RUHIG);
  m.addEventListener("change", melden);
  return () => m.removeEventListener("change", melden);
}
const ruhigJetzt = () => window.matchMedia(RUHIG).matches;

/**
 * Wie weit das Fenster unten aus dem Hero in die nächste Box ragt. Die nächste Box braucht oben passend Platz
 * (`Alltag` mit `nachUeberhang`).
 */
export const UEBERHANG = "-mb-32 sm:-mb-48 lg:-mb-80";

/** So lange bleibt ein Kernelement stehen, bevor das nächste kommt (Dauer der Füllung in der Pille). */
const DAUER_MS = 7000;

/**
 * Fünf Kernelemente als runde Pillen (bewusst `rounded-full` hinter `px-5`, damit `playbook-sweep` sie nicht eckig zieht), darunter die Oberfläche (Aufbau nach dem Vorbild von Personio).
 * Wie Stories wechseln die Pillen von selbst: Die aktive Pille füllt sich, dann kommt die nächste. Damit das kein
 * Auto-Carousel wird, das einem davonläuft: Hover und Tastaturfokus halten an,
 * jeder Klick (Pille oder Vorschau) beendet den Wechsel ganz, und bei `prefers-reduced-motion` startet er gar nicht.
 * Tabs nach WAI-ARIA (Pfeiltasten, Pos1/Ende), die Vorschau startet beim Wechsel neu in der gewählten Ansicht.
 * `kopf` steht über den Pillen (im Hero: Text und Porträt) im selben Bezugsrahmen, damit ein absolut gesetztes
 * Porträt bis hinter das Fenster reichen kann. `dunkel` = auf dunkler Markenfläche (Hero).
 */
export function KernBereiche({
  kopf,
  dunkel = false,
  ueberhang = false,
}: {
  kopf?: ReactNode;
  dunkel?: boolean;
  /** Fenster ragt unten aus der Box in die nächste (siehe `UEBERHANG`) */
  ueberhang?: boolean;
}) {
  const [aktiv, setAktiv] = useState<Start>("heute");
  const [selbst, setSelbst] = useState(false);
  const ruhig = useSyncExternalStore(ruhigAbo, ruhigJetzt, () => false);
  const auto = !selbst && !ruhig;
  const setAuto = (an: boolean) => setSelbst(!an);
  const [darauf, setDarauf] = useState(false);
  const knoepfe = useRef<(HTMLButtonElement | null)[]>([]);
  const index = elemente.findIndex((e) => e.id === aktiv);
  const element = elemente[index];
  const laeuft = auto && !darauf;

  const weiter = () => setAktiv(elemente[(index + 1) % elemente.length].id);

  /** Wer selbst wählt, übernimmt – ab dann wechselt nichts mehr von allein. */
  const waehlen = (id: Start) => {
    setAuto(false);
    setAktiv(id);
  };

  const taste = (e: KeyboardEvent) => {
    const ziel =
      e.key === "ArrowRight"
        ? (index + 1) % elemente.length
        : e.key === "ArrowLeft"
          ? (index - 1 + elemente.length) % elemente.length
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? elemente.length - 1
              : -1;
    if (ziel < 0) return;
    e.preventDefault();
    waehlen(elemente[ziel].id);
    knoepfe.current[ziel]?.focus();
  };

  return (
    <div>
      <div className="relative">
        {kopf}
        <div
          className="relative z-10 flex flex-wrap items-center justify-center gap-2"
          onMouseEnter={() => setDarauf(true)}
          onMouseLeave={() => setDarauf(false)}
          onFocus={() => setDarauf(true)}
          onBlur={() => setDarauf(false)}
        >
          <div
            role="tablist"
            aria-label="Kernelemente von Macher OS"
            onKeyDown={taste}
            className="flex flex-wrap justify-center gap-2"
          >
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
                  onClick={() => waehlen(e.id)}
                  className={`relative isolate inline-flex min-h-12 items-center gap-2 overflow-hidden px-5 rounded-full text-base font-semibold transition-colors duration-150 ease-out ${
                    dunkel
                      ? an
                        ? "bg-white text-signal-dark"
                        : "bg-white/10 text-white ring-1 ring-inset ring-white/25 hover:bg-white/20"
                      : an
                        ? "bg-white text-signal-dark ring-1 ring-inset ring-primary"
                        : "bg-white text-ink ring-1 ring-inset ring-line hover:bg-signal-soft"
                  }`}
                >
                  {an && (
                    // Füllung wie bei Stories: läuft von links nach rechts, danach kommt die nächste Pille.
                    <span
                      aria-hidden
                      key={`${e.id}-${auto}`}
                      className={`absolute inset-0 -z-10 origin-left bg-primary/15 ${auto ? "kern-fuellung" : ""}`}
                      style={{
                        animationDuration: `${DAUER_MS}ms`,
                        animationPlayState: laeuft ? "running" : "paused",
                      }}
                      onAnimationEnd={weiter}
                    />
                  )}
                  <Icon name={e.icon} className="size-5" />
                  {e.label}
                </button>
              );
            })}
          </div>
        </div>
        <p
          className={`relative z-10 mx-auto mt-4 max-w-xl text-center ${dunkel ? "text-on-dark" : "text-lg text-muted"}`}
          aria-live={auto ? "off" : "polite"}
        >
          {element.text}
        </p>
      </div>
      <div
        role="tabpanel"
        id="kern-panel"
        aria-labelledby={`kern-tab-${aktiv}`}
        className={`relative z-10 mx-auto mt-6 max-w-6xl ${ueberhang ? UEBERHANG : ""}`}
        onPointerDown={() => setAuto(false)}
        onKeyDown={() => setAuto(false)}
      >
        {dunkel ? (
          // Liegt halb auf Grün, halb auf Beige: deshalb ein deckender weißer Rahmen (wirkt auf beiden), kein Glas.
          // Der Hinweis steht darunter auf der hellen Box.
          <figure>
            <div className="rounded-[24px] bg-white p-2 shadow-[0_40px_80px_-36px_rgb(6_26_18/0.55)] ring-1 ring-inset ring-line sm:p-3">
              <AppVorschau key={aktiv} start={aktiv} className="lg:h-[40rem]" />
            </div>
            <figcaption className="mt-3 text-center text-sm text-muted">
              Klick dich durch – alles Beispieldaten.
            </figcaption>
          </figure>
        ) : (
          <VorschauRahmen
            hinweis="Klick dich durch – alles Beispieldaten."
            className="mt-2"
          >
            <AppVorschau key={aktiv} start={aktiv} className="lg:h-[40rem]" />
          </VorschauRahmen>
        )}
      </div>
    </div>
  );
}
