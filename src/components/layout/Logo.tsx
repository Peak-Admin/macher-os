import Link from "next/link";

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" aria-label="Macher OS – zur Startseite" className="flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
        <rect width="32" height="32" rx="8" className="fill-brand" />
        <path d="M8 23V10l8 7 8-7v13" fill="none" stroke="#0e130c" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <span className={`whitespace-nowrap font-display text-base font-extrabold tracking-tight sm:text-lg ${dark ? "text-white" : "text-ink"}`}>
        MACHER<span className={dark ? "text-accent" : "text-brand"}> OS</span>
      </span>
    </Link>
  );
}
