import { Icon } from "@/components/ui";

/**
 * Store-Button als schlichter Link. Bewusst ohne echte Store-Logos,
 * solange die App noch nicht in den Stores ist.
 */
export function StoreLink({ plattform }: { plattform: "iphone" | "android" }) {
  const text = plattform === "iphone" ? { oben: "Für iPhone", unten: "App Store" } : { oben: "Für Android", unten: "Google Play" };
  return (
    <a
      href="#"
      aria-disabled="true"
      aria-label={`${text.oben} – ${text.unten}, bald verfügbar`}
      className="inline-flex h-14 items-center gap-3 rounded-lg bg-ink px-4 text-white ring-1 ring-ink transition hover:bg-ink-soft"
    >
      <Icon name="smartphone" className="size-6 shrink-0" />
      <span className="text-left leading-tight">
        <span className="block text-[0.7rem] text-white/70">{text.oben}</span>
        <span className="block font-semibold">{text.unten}</span>
      </span>
      <span className="ml-1 rounded-md bg-white/15 px-2 py-0.5 text-[0.65rem] font-semibold">bald verfügbar</span>
    </a>
  );
}

/**
 * Platzhalter-Kachel für einen QR-Code. Das Muster ist dekorativ und
 * enthält keinen lesbaren Code – vor dem Livegang durch echten Code ersetzen.
 */
export function QrPlatzhalter({ className = "" }: { className?: string }) {
  const n = 21;
  const zellen: [number, number][] = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const imFinder = (x < 8 && y < 8) || (x >= n - 8 && y < 8) || (x < 8 && y >= n - 8);
      if (imFinder) continue;
      // deterministisches Pseudomuster
      if ((x * 7 + y * 13 + x * y) % 5 < 2) zellen.push([x, y]);
    }
  }
  const finder = (fx: number, fy: number) => (
    <g key={`${fx}-${fy}`}>
      <rect x={fx} y={fy} width={7} height={7} className="fill-ink" />
      <rect x={fx + 1} y={fy + 1} width={5} height={5} className="fill-white" />
      <rect x={fx + 2} y={fy + 2} width={3} height={3} className="fill-ink" />
    </g>
  );
  return (
    <figure className={`inline-flex flex-col items-center rounded-lg border border-line bg-white p-4 ${className}`}>
      <svg viewBox={`-1 -1 ${n + 2} ${n + 2}`} role="img" aria-label="Platzhalter für QR-Code zum Download der App" className="size-40">
        <rect x={-1} y={-1} width={n + 2} height={n + 2} className="fill-white" />
        {finder(0, 0)}
        {finder(n - 7, 0)}
        {finder(0, n - 7)}
        {zellen.map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} className="fill-ink" />
        ))}
      </svg>
      <figcaption className="mt-3 text-center text-sm text-muted">
        Platzhalter – QR-Code folgt,
        <br />
        sobald die App verfügbar ist.
      </figcaption>
    </figure>
  );
}
