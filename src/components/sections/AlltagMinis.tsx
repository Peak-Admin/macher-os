"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";

/**
 * Kleine Ausschnitte aus Macher OS für „So läuft's“ – jeder reagiert auf einen Klick (Beispieldaten, nichts wird
 * gespeichert). Aussehen wie die Software: Status immer mit Text, Dringend rot, Warnungen gelb.
 */

function Zeile({ links, rechts }: { links: ReactNode; rechts?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-app-linie py-1.5 last:border-0">
      <span className="min-w-0 truncate">{links}</span>
      {rechts}
    </div>
  );
}

export function Pille({ children, ton = "neutral" }: { children: ReactNode; ton?: "neutral" | "gut" | "warnung" | "gefahr" }) {
  const t = { neutral: "bg-app-ruhig text-muted", gut: "bg-signal-soft text-moss", warnung: "bg-warning-soft text-warning", gefahr: "bg-danger-soft text-danger" }[ton];
  return <span className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold ${t}`}>{children}</span>;
}

function Aktion({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative z-10 mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-2 py-1.5 text-[12px] font-semibold text-white transition-colors duration-150 hover:bg-primary-hover"
    >
      {children}
    </button>
  );
}

function Erledigt({ children, onReset }: { children: ReactNode; onReset: () => void }) {
  return (
    <p className="mini-ein mt-2 flex items-center gap-1.5 rounded-md bg-signal-soft px-2 py-1.5 font-semibold text-moss">
      <Icon name="check" className="size-3.5 shrink-0" />
      <span className="min-w-0 flex-1">{children}</span>
      <button type="button" onClick={onReset} className="relative z-10 shrink-0 text-[11px] underline underline-offset-2">
        Von vorn
      </button>
    </p>
  );
}

export function AnfrageMini() {
  const [ok, setOk] = useState(false);
  return (
    <>
      <Zeile links={<b className="font-semibold">Steckdosen im Keller</b>} rechts={ok ? <Pille ton="gut">Eingeplant</Pille> : <Pille ton="gefahr">Dringend</Pille>} />
      <Zeile links="Anruf · Petra Schulz · 08:12" />
      {ok ? (
        <Erledigt onReset={() => setOk(false)}>Termin Di., 10:00 Uhr bestätigt</Erledigt>
      ) : (
        <>
          <p className="mt-2 rounded-md bg-app-ruhig px-2 py-1.5 text-ink">Vorschlag: Di., 10:00 Uhr</p>
          <Aktion onClick={() => setOk(true)}>Vorschlag übernehmen</Aktion>
        </>
      )}
    </>
  );
}

export function PlanungMini() {
  const [geloest, setGeloest] = useState(false);
  return (
    <>
      <Zeile links={<><b className="font-semibold">07:00</b> Sanierung Haus 24</>} rechts={<Pille ton="gut">Bestätigt</Pille>} />
      <Zeile links={<><b className="font-semibold">13:00</b> Jährliche Wartung</>} />
      <Zeile
        links={<><b className="font-semibold">{geloest ? "16:30" : "15:30"}</b> Besichtigung Neubau</>}
        rechts={geloest ? <Pille ton="gut">Bestätigt</Pille> : <Pille ton="warnung">Konflikt</Pille>}
      />
      {geloest ? (
        <Erledigt onReset={() => setGeloest(false)}>Auf 16:30 verschoben</Erledigt>
      ) : (
        <Aktion onClick={() => setGeloest(true)}>Konflikt lösen</Aktion>
      )}
    </>
  );
}

export function BaustelleMini() {
  const [fotos, setFotos] = useState(3);
  const [laeuft, setLaeuft] = useState(false);
  const [minuten, setMinuten] = useState(270);
  const [material, setMaterial] = useState(false);
  useEffect(() => {
    if (!laeuft) return;
    const t = window.setInterval(() => setMinuten((m) => m + 1), 1000);
    return () => window.clearInterval(t);
  }, [laeuft]);
  const kacheln: { icon: IconName; label: string; an: boolean; tun: () => void }[] = [
    { icon: "camera", label: `${fotos} Fotos`, an: fotos > 3, tun: () => setFotos((f) => f + 1) },
    { icon: "clock", label: `${Math.floor(minuten / 60)}:${String(minuten % 60).padStart(2, "0")} Std.`, an: laeuft, tun: () => setLaeuft((l) => !l) },
    { icon: "box", label: material ? "3 Pos." : "Material", an: material, tun: () => setMaterial((m) => !m) },
  ];
  return (
    <>
      <div className="grid flex-1 grid-cols-3 gap-1.5 text-center font-semibold">
        {kacheln.map((k) => (
          <button
            key={k.icon}
            type="button"
            aria-pressed={k.an}
            onClick={k.tun}
            className={`relative z-10 flex flex-col items-center justify-center gap-1 rounded-md border py-2 tabular-nums transition-colors duration-150 ${
              k.an ? "border-primary bg-signal-soft text-moss" : "border-app-linie bg-white hover:border-primary"
            }`}
          >
            <Icon name={k.icon} className="size-4 text-signal-dark" />
            {k.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-muted">{laeuft ? "Zeit läuft – landet direkt im Auftrag." : "Tippen: Foto, Zeit starten, Material."}</p>
    </>
  );
}

export function AbnahmeMini() {
  const [schritt, setSchritt] = useState<0 | 1 | 2>(0);
  return (
    <>
      <Zeile links={<b className="font-semibold">Unterschrift Kunde</b>} rechts={schritt ? <Pille ton="gut">Erhalten</Pille> : <Pille>Offen</Pille>} />
      <Zeile links="Rechnung R-2026-0005" rechts={schritt === 2 ? <Pille ton="gut">Gesendet</Pille> : <Pille>Vorbereitet</Pille>} />
      {schritt === 0 && (
        <Aktion onClick={() => setSchritt(1)}>
          <Icon name="signature" className="size-3.5" /> Unterschreiben lassen
        </Aktion>
      )}
      {schritt === 1 && (
        <>
          <svg viewBox="0 0 120 24" aria-hidden className="mini-ein mt-1 h-6 w-28 text-ink">
            <path d="M4 18c8-14 14-14 16-4s6 8 12-2 10-6 12 2 10 4 18-6 14-2 20 4 14 2 30-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <Aktion onClick={() => setSchritt(2)}>Rechnung senden</Aktion>
        </>
      )}
      {schritt === 2 && <Erledigt onReset={() => setSchritt(0)}>Rechnung ist beim Kunden</Erledigt>}
    </>
  );
}
