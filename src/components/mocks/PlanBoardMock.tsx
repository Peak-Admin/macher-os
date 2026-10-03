"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Plantafel zum Ausprobieren: Mitarbeiter × Wochentage. Ein Klick auf einen Einsatz zeigt ihn unten,
 * „Vorschlag übernehmen“ plant den Kundendienst bei Mehmet ein. Beispieldaten, nichts wird gespeichert.
 */
const tage = ["Mo", "Di", "Mi", "Do", "Fr"];

type Art = "voll" | "hell" | "frei" | "abwesend";
type Block = { id: string; start: number; len: number; label: string; art: Art };
const farbe: Record<Art, string> = {
  voll: "bg-primary text-white",
  hell: "bg-signal-soft text-signal-dark ring-1 ring-inset ring-primary/20",
  abwesend: "bg-app-ruhig text-muted",
  frei: "border border-dashed border-line-dark text-muted",
};

const start: { name: string; bild: string; rolle: string; blocks: Block[] }[] = [
  {
    name: "Jonas",
    bild: "jonas-becker",
    rolle: "Geselle",
    blocks: [
      { id: "j1", start: 0, len: 2, label: "Neubau Schmidt", art: "voll" },
      { id: "j2", start: 2, len: 1, label: "Wartung", art: "hell" },
      { id: "j3", start: 3, len: 2, label: "Altbau Krüger", art: "voll" },
    ],
  },
  {
    name: "Max",
    bild: "max-macher",
    rolle: "Meister",
    blocks: [
      { id: "m1", start: 0, len: 1, label: "Besichtigung", art: "hell" },
      { id: "m2", start: 1, len: 3, label: "Wallbox + PV Petersen", art: "voll" },
    ],
  },
  {
    name: "Lukas",
    bild: "lukas-wagner",
    rolle: "Azubi",
    blocks: [
      { id: "l1", start: 0, len: 2, label: "mit Jonas", art: "hell" },
      { id: "l2", start: 2, len: 1, label: "Berufsschule", art: "abwesend" },
      { id: "l3", start: 3, len: 2, label: "mit Jonas", art: "hell" },
    ],
  },
  {
    name: "Mehmet",
    bild: "mehmet-yilmaz",
    rolle: "Geselle",
    blocks: [
      { id: "h1", start: 0, len: 3, label: "Urlaub", art: "abwesend" },
      { id: "h2", start: 3, len: 1, label: "Kundendienst", art: "voll" },
      { id: "h3", start: 4, len: 1, label: "frei", art: "frei" },
    ],
  },
];

export function PlanBoardMock() {
  const [reihen, setReihen] = useState(start);
  const [gewaehlt, setGewaehlt] = useState<{ name: string; b: Block } | null>(null);
  const [uebernommen, setUebernommen] = useState(false);

  const uebernehmen = () => {
    setReihen((r) =>
      r.map((z) =>
        z.name === "Mehmet" ? { ...z, blocks: z.blocks.map((b) => (b.id === "h3" ? { ...b, label: "Kundendienst Weber", art: "voll" as Art } : b)) } : z,
      ),
    );
    setUebernommen(true);
    setGewaehlt(null);
  };
  const vonVorn = () => (setReihen(start), setUebernommen(false), setGewaehlt(null));

  return (
    <div role="group" aria-label="Plantafel zum Ausprobieren (Beispieldaten)" className="overflow-hidden rounded-2xl border border-ink/10 bg-white text-ink shadow-xl shadow-ink/10">
      <div className="flex items-center justify-between border-b border-app-linie px-4 py-3">
        <span className="font-display text-sm font-bold">Plan · KW 42</span>
        <span className="rounded-sm border border-dashed border-line-dark px-1 text-[10px] font-semibold text-muted">Beispiel</span>
      </div>
      <div className="grid grid-cols-[5.5rem_repeat(5,minmax(0,1fr))] text-xs">
        <div />
        {tage.map((d) => (
          <div key={d} className="border-l border-app-linie px-2 py-2 text-center font-semibold text-muted">
            {d}
          </div>
        ))}
        {reihen.map((r) => (
          <div key={r.name} className="contents">
            <div className="border-t border-app-linie px-3 py-3">
              <Image src={`/bilder/os/team/${r.bild}.webp`} alt="" width={24} height={24} className="mb-1 size-6 rounded-full object-cover" />
              <div className="font-semibold">{r.name}</div>
              <div className="text-[0.65rem] text-muted">{r.rolle}</div>
            </div>
            <div className="relative col-span-5 grid grid-cols-5 gap-1 border-t border-app-linie p-1.5">
              {r.blocks.map((b) => {
                const an = gewaehlt?.b.id === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    aria-pressed={an}
                    onClick={() => setGewaehlt(an ? null : { name: r.name, b })}
                    style={{ gridColumn: `${b.start + 1} / span ${b.len}` }}
                    className={`flex items-center truncate rounded-md px-2 py-2 text-left text-[0.68rem] font-semibold transition-[box-shadow,transform] duration-150 hover:-translate-y-px ${farbe[b.art]} ${
                      an ? "ring-2 ring-ink ring-offset-1" : ""
                    } ${b.id === "h3" && uebernommen ? "mini-ein" : ""}`}
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div role="status" className="flex min-h-11 flex-wrap items-center gap-2 border-t border-app-linie bg-signal-soft px-4 py-2.5 text-xs">
        {gewaehlt ? (
          <span className="mini-ein">
            <b>{gewaehlt.name}</b> · {tage[gewaehlt.b.start]}
            {gewaehlt.b.len > 1 ? `–${tage[gewaehlt.b.start + gewaehlt.b.len - 1]}` : ""} · {gewaehlt.b.label}
          </span>
        ) : uebernommen ? (
          <>
            <span className="mini-ein">
              <b>Eingeplant:</b> Kundendienst Fr. Weber → Mehmet, Freitag 8:00
            </span>
            <button type="button" onClick={vonVorn} className="ml-auto font-semibold text-signal-dark underline underline-offset-2">
              Von vorn
            </button>
          </>
        ) : (
          <>
            <span>
              <b>Vorschlag von Lotte:</b> Kundendienst Fr. Weber → Mehmet, Freitag 8:00 (frei, 12 Min. entfernt)
            </span>
            <button type="button" onClick={uebernehmen} className="ml-auto rounded-lg bg-primary px-2.5 py-1.5 font-semibold text-white transition-colors duration-150 hover:bg-primary-hover">
              Vorschlag übernehmen
            </button>
          </>
        )}
      </div>
    </div>
  );
}
