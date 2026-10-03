"use client";

import { useEffect, useState } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";

/**
 * Mitarbeiter-App auf dem Handy – zum Ausprobieren: Auftrag starten (Zeit läuft), Foto, Sprechen, Material,
 * Unterschrift und Abschluss. Alles Beispieldaten, nichts wird gespeichert; jeder Tipp ändert nur diese Ansicht.
 */
export function PhoneMock({ className = "" }: { className?: string }) {
  const [laeuft, setLaeuft] = useState(false);
  const [sekunden, setSekunden] = useState(0);
  const [fotos, setFotos] = useState(0);
  const [meldung, setMeldung] = useState<string | null>(null);
  const [fertig, setFertig] = useState(false);

  useEffect(() => {
    if (!laeuft) return;
    const t = window.setInterval(() => setSekunden((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [laeuft]);

  const zeit = `${String(Math.floor(sekunden / 60)).padStart(2, "0")}:${String(sekunden % 60).padStart(2, "0")}`;
  const knoepfe: { icon: IconName; label: string; tun: () => void }[] = [
    { icon: "map", label: "Navigation", tun: () => setMeldung("Route zur Lindenstr. 12 · 18 Min.") },
    { icon: "camera", label: fotos ? `${fotos} ${fotos === 1 ? "Foto" : "Fotos"}` : "Foto", tun: () => (setFotos((f) => f + 1), setMeldung("Foto im Auftrag gespeichert")) },
    { icon: "mic", label: "Sprechen", tun: () => setMeldung("Notiz: „Kabelweg frei, Wallbox hängt.“") },
    { icon: "box", label: "Material", tun: () => setMeldung("Erfasst: Wallbox 11 kW, 10 m Kabel") },
  ];
  const vonVorn = () => {
    setLaeuft(false);
    setSekunden(0);
    setFotos(0);
    setMeldung(null);
    setFertig(false);
  };

  return (
    <div
      role="group"
      aria-label="Mitarbeiter-App zum Ausprobieren (Beispieldaten)"
      className={`mx-auto w-[280px] max-w-full rounded-[2.5rem] border-[10px] border-ink bg-ink shadow-2xl shadow-ink/30 ${className}`}
    >
      <div className="overflow-hidden rounded-[1.8rem] bg-app-canvas">
        <div className="flex items-center justify-between bg-ink px-5 pb-3 pt-2 text-[0.65rem] text-white/80">
          <span>9:41</span>
          <span className="h-4 w-16 rounded-full bg-black" />
          <span>100%</span>
        </div>
        <div className="space-y-3 p-4">
          <p className="flex items-center justify-between text-[0.7rem] font-semibold text-muted">
            <span>Nächster Einsatz · 11:30</span>
            <span className="rounded-sm border border-dashed border-line-dark px-1 text-[0.6rem]">Beispiel</span>
          </p>
          <div className="app-lift rounded-2xl border border-app-linie bg-white p-4">
            <p className="font-display text-base font-bold leading-tight text-ink">Wallbox montieren</p>
            <p className="mt-1 text-xs text-muted">Fam. Petersen · Lindenstr. 12</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="rounded bg-signal-soft px-2 py-0.5 text-[0.65rem] font-semibold text-moss">Material im Wagen</span>
              {laeuft || sekunden ? (
                <span className="rounded bg-signal-soft px-2 py-0.5 text-[0.65rem] font-semibold tabular-nums text-moss">
                  {laeuft ? "Läuft" : "Pause"} · {zeit}
                </span>
              ) : (
                <span className="rounded bg-app-ruhig px-2 py-0.5 text-[0.65rem] font-semibold text-muted">18 Min. Fahrt</span>
              )}
            </div>
          </div>

          {fertig ? (
            <div className="mini-ein app-lift rounded-2xl border border-app-linie bg-white p-4 text-center">
              <svg viewBox="0 0 120 30" aria-hidden className="mx-auto h-8 w-32 text-ink">
                <path d="M4 22c8-16 14-16 16-5s6 9 12-2 10-7 12 2 10 5 18-7 14-2 20 5 14 2 30-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <p className="mt-2 flex items-center justify-center gap-1.5 font-display text-sm font-bold text-ink">
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-white">
                  <Icon name="check" className="size-3" />
                </span>
                Abgeschlossen
              </p>
              <p className="mt-1 text-[0.7rem] text-muted">
                Zeit {zeit} · {fotos} {fotos === 1 ? "Foto" : "Fotos"} · Rechnung vorbereitet
              </p>
              <button type="button" onClick={vonVorn} className="mt-3 text-xs font-semibold text-signal-dark underline underline-offset-2">
                Nochmal ausprobieren
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                {knoepfe.map((k) => (
                  <button
                    key={k.icon}
                    type="button"
                    onClick={k.tun}
                    className="app-lift flex flex-col items-center gap-1 rounded-xl border border-app-linie bg-white py-3 text-[0.7rem] font-semibold text-ink transition-colors duration-150 hover:border-primary active:bg-signal-soft"
                  >
                    <Icon name={k.icon} className="size-5 text-signal-dark" />
                    {k.label}
                  </button>
                ))}
              </div>
              <p role="status" className="min-h-5 text-center text-[0.7rem] font-semibold text-moss">
                {meldung && (
                  <span key={meldung} className="mini-ein inline-flex items-center gap-1">
                    <Icon name="check" className="size-3" /> {meldung}
                  </span>
                )}
              </p>
              <button
                type="button"
                onClick={() => setLaeuft((l) => !l)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white transition-colors duration-150 hover:bg-primary-hover"
              >
                <Icon name={laeuft ? "clock" : "play"} className="size-4" /> {laeuft ? "Pause" : sekunden ? "Weiter" : "Auftrag starten"}
              </button>
              <button
                type="button"
                onClick={() => (setLaeuft(false), setFertig(true))}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-app-linie bg-white py-2.5 text-xs font-semibold text-ink transition-colors duration-150 hover:border-primary"
              >
                <Icon name="signature" className="size-4" /> Unterschrift & abschließen
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
