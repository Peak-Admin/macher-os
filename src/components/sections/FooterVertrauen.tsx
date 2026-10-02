import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
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

const VERTRAUEN_ICON: Record<string, IconName> = {
  "DSGVO-konform": "shield",
  "Server in Frankfurt": "map",
  "KI nach EU AI Act": "spark",
};

/**
 * Kleine Glas-Kacheln mit den belegten Vertrauensaussagen (dieselbe Quelle wie in der Software).
 * Ersetzt im Footer den blauen Vertrauenskasten.
 */
export function VertrauensKacheln({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <ul className="grid gap-3 sm:grid-cols-3">
        {datenVertrauen.map((v) => (
          <li
            key={v.titel}
            className="flex items-center gap-3 rounded-xl bg-white/5 p-3 ring-1 ring-inset ring-white/10"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 text-white">
              <Icon name={VERTRAUEN_ICON[v.titel] ?? "check"} className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-white">{v.titel}</span>
              <span className="block text-sm text-white/65">{v.text}</span>
            </span>
          </li>
        ))}
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
