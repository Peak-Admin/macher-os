import Link from "next/link";
import type { ReactNode } from "react";
import { datenVertrauen } from "@/content/einwaende";
import { ausgehend } from "@/lib/link/ausgehend";

/** Glas-Pille „Made in Germany“ mit runder Flagge – für dunkle Markenflächen. */
export function MadeInGermany({ className = "" }: { className?: string }) {
  return (
    <p
      className={`inline-flex items-center gap-2 rounded-full bg-white/10 py-1.5 pl-1.5 pr-4 text-sm font-semibold text-white ring-1 ring-inset ring-white/15 ${className}`}
    >
      <span aria-hidden className="flagge-de size-6 shrink-0 rounded-full ring-1 ring-white/30" />
      Made in Germany
    </p>
  );
}

/** Zwölf goldene Sterne im Kreis – das EU-Logo. */
const EU_STERNE = Array.from({ length: 12 }, (_, i) => {
  const w = (i * Math.PI) / 6;
  const cx = 12 + 8 * Math.sin(w);
  const cy = 12 - 8 * Math.cos(w);
  const punkte = Array.from({ length: 10 }, (_, k) => {
    const r = k % 2 ? 0.75 : 1.8;
    const a = (k * Math.PI) / 5;
    return `${(cx + r * Math.sin(a)).toFixed(2)},${(cy - r * Math.cos(a)).toFixed(2)}`;
  });
  return punkte.join(" ");
});

function EuLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`text-eu-gold ${className}`}>
      {EU_STERNE.map((p) => (
        <polygon key={p} points={p} fill="currentColor" />
      ))}
    </svg>
  );
}

/** Welche Aussage ist eine EU-Regel (blau mit EU-Logo), welche ein Standort (deutsche Flagge)? */
const EU_REGEL = new Set<string>(["DSGVO-konform", "KI nach EU AI Act"]);

/**
 * Kleine Kacheln mit den belegten Vertrauensaussagen (dieselbe Quelle wie in der Software).
 * EU-Regeln (DSGVO, EU AI Act) als blaue Kachel mit EU-Logo, der Serverstandort mit deutscher Flagge.
 */
export function VertrauensKacheln({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <ul className="grid gap-3 sm:grid-cols-3">
        {datenVertrauen.map((v) => {
          const eu = EU_REGEL.has(v.titel);
          return (
            <li
              key={v.titel}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 ring-1 ring-inset ${
                eu ? "bg-eu ring-white/15" : "bg-white/5 ring-white/10"
              }`}
            >
              {eu ? (
                <EuLogo className="size-8 shrink-0" />
              ) : (
                <span aria-hidden className="flagge-de h-5 w-8 shrink-0 rounded-sm ring-1 ring-white/30" />
              )}
              <span className="min-w-0 leading-snug">
                <span className="block text-sm font-semibold text-white">{v.titel}</span>
                <span className={`block text-sm ${eu ? "text-white/80" : "text-white/65"}`}>{v.text}</span>
              </span>
            </li>
          );
        })}
      </ul>
      <Link
        href="/datenschutz"
        className="mt-3 inline-block text-sm font-semibold text-white/80 underline underline-offset-4 hover:text-white hover:no-underline"
      >
        Mehr zum Datenschutz
      </Link>
    </div>
  );
}

const FRAGE =
  "Was ist Macher OS (macher-os.de)? Erklär mir kurz, was die Software für Handwerksbetriebe kann und für wen sie passt.";

const KIS: { name: string; url: (q: string) => string; logo: ReactNode }[] = [
  {
    name: "ChatGPT",
    url: (q) => `https://chatgpt.com/?q=${q}`,
    logo: (
      <g fill="none" stroke="currentColor" strokeWidth="1.6">
        {[0, 60, 120].map((w) => (
          <ellipse key={w} cx="12" cy="12" rx="8" ry="3.6" transform={`rotate(${w} 12 12)`} />
        ))}
      </g>
    ),
  },
  {
    name: "Claude",
    url: (q) => `https://claude.ai/new?q=${q}`,
    logo: <path fill="currentColor" d="M8 4h3l5.5 16h-3.1l-1.1-3.4H6.6L5.5 20H2.5Zm-.6 10.1h4.1L9.5 7.6ZM14.4 4h3.1l5.5 16h-3.1Z" />,
  },
  {
    name: "Perplexity",
    url: (q) => `https://www.perplexity.ai/search?q=${q}`,
    logo: <path fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" d="M12 3c.6 4.6 4.4 8.4 9 9-4.6.6-8.4 4.4-9 9-.6-4.6-4.4-8.4-9-9 4.6-.6 8.4-4.4 9-9Z" />,
  },
];

/** „KI fragen“: öffnet ChatGPT, Claude oder Perplexity mit einer fertigen Frage zu Macher OS (neuer Tab). */
export function KiFragen({ className = "" }: { className?: string }) {
  const q = encodeURIComponent(FRAGE);
  return (
    <div className={className}>
      <p className="text-sm font-semibold text-white">KI fragen</p>
      <p className="mt-1 text-sm text-white/65">Lass dir Macher OS von deiner KI erklären.</p>
      <ul className="mt-3 flex gap-3">
        {KIS.map((k) => (
          <li key={k.name}>
            <a
              href={ausgehend(k.url(q))}
              target="_blank"
              rel="noopener noreferrer"
              title={`${k.name} fragen`}
              className="grid size-12 place-items-center rounded-full bg-white text-ink transition-transform duration-150 ease-out hover:scale-105 motion-reduce:transition-none"
            >
              <svg viewBox="0 0 24 24" aria-hidden className="size-6">
                {k.logo}
              </svg>
              <span className="sr-only">{k.name} nach Macher OS fragen (öffnet in neuem Tab)</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
