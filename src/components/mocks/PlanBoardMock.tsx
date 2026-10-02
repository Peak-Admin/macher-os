/** Stilisierte Plantafel: Mitarbeiter × Wochentage. Rein dekorativ. */
const days = ["Mo", "Di", "Mi", "Do", "Fr"];

const rows: { name: string; rolle: string; blocks: { start: number; len: number; label: string; color: string }[] }[] = [
  {
    name: "Lukas",
    rolle: "Geselle",
    blocks: [
      { start: 0, len: 2, label: "Neubau Schmidt", color: "bg-sky text-white" },
      { start: 2, len: 1, label: "Wartung", color: "bg-sky-soft text-sky" },
      { start: 3, len: 2, label: "Altbau Krüger", color: "bg-sky text-white" },
    ],
  },
  {
    name: "Ali",
    rolle: "Meister",
    blocks: [
      { start: 0, len: 1, label: "Besichtigung", color: "bg-moss-soft text-moss" },
      { start: 1, len: 3, label: "Wallbox + PV Petersen", color: "bg-signal text-white" },
    ],
  },
  {
    name: "Mia",
    rolle: "Azubi",
    blocks: [
      { start: 0, len: 2, label: "mit Lukas", color: "bg-sky-soft text-sky" },
      { start: 2, len: 1, label: "Berufsschule", color: "bg-sand text-muted" },
      { start: 3, len: 2, label: "mit Lukas", color: "bg-sky-soft text-sky" },
    ],
  },
  {
    name: "Tom",
    rolle: "Geselle",
    blocks: [
      { start: 0, len: 3, label: "Urlaub", color: "bg-sand text-muted" },
      { start: 3, len: 1, label: "Kundendienst", color: "bg-moss text-white" },
      { start: 4, len: 1, label: "frei", color: "border border-dashed border-line text-muted" },
    ],
  },
];

export function PlanBoardMock() {
  return (
    <div
      role="img"
      aria-label="Plantafel in Macher OS: Mitarbeiter und ihre Einsätze über die Woche"
      className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-xl shadow-ink/10"
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <span className="font-display text-sm font-bold">Plan · KW 42</span>
        <span className="rounded bg-moss-soft px-2.5 py-0.5 text-xs font-semibold text-moss">
          Auslastung 86 %
        </span>
      </div>
      <div className="grid grid-cols-[5.5rem_repeat(5,minmax(0,1fr))] text-xs">
        <div />
        {days.map((d) => (
          <div key={d} className="border-l border-line px-2 py-2 text-center font-semibold text-muted">
            {d}
          </div>
        ))}
        {rows.map((r) => (
          <div key={r.name} className="contents">
            <div className="border-t border-line px-3 py-3">
              <div className="font-semibold">{r.name}</div>
              <div className="text-[0.65rem] text-muted">{r.rolle}</div>
            </div>
            <div className="relative col-span-5 grid grid-cols-5 gap-1 border-t border-line p-1.5">
              {r.blocks.map((b) => (
                <div
                  key={b.label + b.start}
                  style={{ gridColumn: `${b.start + 1} / span ${b.len}` }}
                  className={`flex items-center truncate rounded-md px-2 py-2 text-[0.68rem] font-semibold ${b.color}`}
                >
                  {b.label}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-line bg-signal-soft px-4 py-2.5 text-xs">
        <b>Macher-Vorschlag:</b> Kundendienst Fr. Weber → Tom, Freitag 8:00 (frei, 12 Min. entfernt)
      </div>
    </div>
  );
}
