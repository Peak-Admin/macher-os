import Link from "next/link";

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" aria-label="Macher OS – zur Startseite" className="flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
        <rect width="32" height="32" rx="8" className="fill-signal" />
        <path d="M8 23V10l8 7 8-7v13" fill="none" stroke="#15181d" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <span className={`font-display text-lg font-extrabold tracking-tight ${dark ? "text-white" : "text-ink"}`}>
        MACHER<span className="text-signal-dark"> OS</span>
      </span>
    </Link>
  );
}
