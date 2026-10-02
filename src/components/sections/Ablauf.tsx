"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";

type Schritt = {
  titel: string;
  icon: IconName;
  satz: string;
  macher: string[];
  vorschau: ReactNode;
};

function Beispiel() {
  return <span className="rounded-sm border border-dashed border-line-dark px-1 text-[10px] font-semibold text-muted">Beispiel</span>;
}

/** Kleine App-Karte: so sieht der Schritt in Macher OS aus (Beispieldaten). */
function AppKarte({ ort, children }: { ort: string; children: ReactNode }) {
  return (
    <div className="rounded-xl bg-white p-4 text-left text-ink shadow-[0_24px_48px_-28px_rgb(0_0_0/0.6)]">
      <div className="mb-3 flex items-center gap-2 text-[12px] text-muted">
        <span className="inline-flex size-5 items-center justify-center rounded bg-primary font-display text-[11px] font-black text-white">M</span>
        <span className="font-semibold">{ort}</span>
        <span className="ml-auto">
          <Beispiel />
        </span>
      </div>
      {children}
    </div>
  );
}

const schritte: Schritt[] = [
  {
    titel: "Anfrage",
    icon: "phone",
    satz: "Der Kunde ruft an oder schreibt.",
    macher: ["legt die Anfrage an", "ordnet den Kunden zu", "schlägt einen Termin vor"],
    vorschau: (
      <AppKarte ort="Aufträge · Eingang">
        <p className="font-semibold">Anfrage: Steckdosen im Keller</p>
        <p className="text-sm text-muted">Anruf · Petra Schulz · heute, 08:12</p>
        <p className="mt-3 rounded-lg bg-signal-soft px-3 py-2 text-sm text-moss">
          Vorschlag: Besichtigung Di., 10:00 Uhr mit Max
        </p>
      </AppKarte>
    ),
  },
  {
    titel: "Angebot",
    icon: "file",
    satz: "Aus der Besichtigung wird ein Angebot.",
    macher: ["nimmt Leistungen aus deinem Gewerk", "rechnet Material und Stunden ein", "verschickt es per E-Mail"],
    vorschau: (
      <AppKarte ort="Angebot A-2026-0014">
        <ul className="divide-y divide-line text-sm">
          {[
            ["Steckdose setzen inkl. Dose", "4 Stk."],
            ["Arbeitsstunde Geselle", "3 Std."],
            ["Anfahrtspauschale", "1×"],
          ].map(([l, m]) => (
            <li key={l} className="flex justify-between gap-3 py-1.5">
              <span>{l}</span>
              <span className="tabular-nums text-muted">{m}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm font-semibold text-signal-dark">Bereit zum Verschicken</p>
      </AppKarte>
    ),
  },
  {
    titel: "Arbeit",
    icon: "wrench",
    satz: "Dein Team weiß, wo es hinfährt und was es braucht.",
    macher: ["plant den Einsatz", "sammelt Fotos, Zeiten und Material vom Handy", "holt die Unterschrift vor Ort"],
    vorschau: (
      <AppKarte ort="Dein nächster Einsatz">
        <p className="font-semibold">Steckdosen im Keller · Petra Schulz</p>
        <p className="text-sm text-muted">Di., 08:00–11:00 · Jonas · Material im Wagen</p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[12px] font-semibold">
          {(["camera", "clock", "signature"] as IconName[]).map((i, n) => (
            <span key={i} className="flex flex-col items-center gap-1 rounded-lg border border-line py-2">
              <Icon name={i} className="size-4 text-signal-dark" />
              {["Foto", "Zeit", "Unterschrift"][n]}
            </span>
          ))}
        </div>
      </AppKarte>
    ),
  },
  {
    titel: "Rechnung bezahlt",
    icon: "euro",
    satz: "Die Rechnung ist fertig, bevor du wieder im Auto sitzt.",
    macher: ["schreibt die Rechnung aus dem Auftrag", "erinnert an offene Zahlungen", "gleicht Zahlungen mit dem Kontoauszug ab"],
    vorschau: (
      <AppKarte ort="Rechnung R-2026-0005">
        <p className="font-semibold">Steckdosen im Keller · Petra Schulz</p>
        <p className="text-sm text-muted">aus Auftrag A-2026-0015 erstellt</p>
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-signal-soft px-2 py-1 text-sm font-semibold text-moss">
          <Icon name="check" className="size-4" /> Bezahlt
        </p>
      </AppKarte>
    ),
  },
];

/**
 * Banner „Vom ersten Anruf bis zur bezahlten Rechnung“: dunkelgrüne Fläche, Schrift in Hellgrün, vier klickbare Schritte.
 * Beim ersten Sichtbarwerden laufen die Schritte einmal nacheinander an (kein Dauer-Karussell);
 * danach wählt man selbst. Bei reduzierter Bewegung steht sofort der erste Schritt.
 */
export function Ablauf() {
  const [aktiv, setAktiv] = useState(0);
  const [gesehen, setGesehen] = useState(false);
  const bereich = useRef<HTMLElement>(null);
  const timer = useRef<number[]>([]);

  useEffect(() => {
    const el = bereich.current;
    if (!el || gesehen) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const beob = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        beob.disconnect();
        setGesehen(true);
        // Einmal durchlaufen: Anfrage → Angebot → Arbeit → Rechnung bezahlt, dann zurück auf den Anfang.
        [1, 2, 3].forEach((n) => timer.current.push(window.setTimeout(() => setAktiv(n), n * 1100)));
        timer.current.push(window.setTimeout(() => setAktiv(0), 4 * 1100 + 600));
      },
      { threshold: 0.5 },
    );
    beob.observe(el);
    return () => beob.disconnect();
  }, [gesehen]);

  useEffect(() => () => timer.current.forEach(clearTimeout), []);

  const waehlen = (n: number) => {
    timer.current.forEach(clearTimeout);
    timer.current = [];
    setAktiv(n);
  };

  const s = schritte[aktiv];

  return (
    <section ref={bereich} aria-labelledby="ablauf-titel" data-header-theme="dunkel" className="zone zone-dunkel markenflaeche">
      <div>
        <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <p className="text-sm font-semibold font-tagline uppercase tracking-[0.06em] text-white/70">Ein Ablauf</p>
          <h2 id="ablauf-titel" className="mt-4 font-display text-3xl font-bold leading-[1.1] tracking-tight text-balance sm:text-5xl">
            Vom ersten Anruf <span className="text-accent">bis zur bezahlten Rechnung.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-on-dark">
            Macher OS hält alles zusammen und übernimmt möglichst viel Organisation dazwischen.
          </p>

          <div className="relative mt-12">
          {/* Fortschrittslinie hinter den Kästen (ab 640 px) */}
          <div aria-hidden className="pointer-events-none absolute inset-x-[12.5%] top-1/2 hidden h-0.5 -translate-y-1/2 bg-white/15 sm:block">
            <span className="ablauf-linie block h-full bg-accent" style={{ transform: `scaleX(${aktiv / 3})` }} />
          </div>
          <ol className="relative grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {schritte.map((x, n) => {
              const an = n === aktiv;
              const erledigt = n < aktiv;
              return (
                <li key={x.titel} className="relative z-10">
                  <button
                    type="button"
                    onClick={() => waehlen(n)}
                    aria-pressed={an}
                    className={`ablauf-schritt flex h-full min-h-32 w-full flex-col items-center justify-center gap-3 rounded-2xl px-3 py-5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                      an
                        ? "-translate-y-1 bg-white text-ink shadow-[0_20px_40px_-20px_rgb(0_0_0/0.6)]"
                        : "bg-ink-soft text-white ring-1 ring-white/12 hover:bg-white/10"
                    }`}
                  >
                    <span
                      className={`inline-flex size-12 items-center justify-center rounded-xl ${
                        an ? "bg-primary text-white" : erledigt ? "bg-accent text-ink" : "bg-white/10 text-accent"
                      }`}
                    >
                      <Icon name={erledigt ? "check" : x.icon} className="size-6" />
                    </span>
                    <span className={`text-xs font-semibold tabular-nums ${an ? "text-muted" : "text-white/60"}`}>
                      Schritt {n + 1}
                    </span>
                    <span className="font-display text-lg font-bold leading-tight">{x.titel}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          </div>

          <div key={aktiv} className="ablauf-detail mx-auto mt-10 grid max-w-4xl items-center gap-8 text-left md:grid-cols-2" aria-live="polite">
            <div>
              <p className="font-display text-2xl font-bold text-accent">{s.titel}</p>
              <p className="mt-2 text-lg text-white">{s.satz}</p>
              <p className="mt-5 text-sm font-semibold text-white/70">Macher OS …</p>
              <ul className="mt-2 space-y-2">
                {s.macher.map((m) => (
                  <li key={m} className="flex items-start gap-2.5">
                    <Icon name="check" className="mt-1 size-4 shrink-0 text-accent" />
                    <span className="text-on-dark">{m}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>{s.vorschau}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
