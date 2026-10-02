import Link from "next/link";
import { HerausgeberMarke } from "@/components/sections/MissionMittelstand";
import { footerNav, herausgeber, legalNav, site } from "@/lib/site";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="markenflaeche relative text-white">
      <div aria-hidden className="h-1 bg-brand" />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_3fr]">
          <div className="max-w-xs">
            <Logo dark />
            <p className="mt-4 text-sm leading-relaxed text-white/65">
              Das Betriebssystem für Handwerksbetriebe. Einfach vorne. Vollständig hinten.
            </p>
            <div className="mt-6 border-t border-white/10 pt-5">
              <p className="text-sm text-white/65">{herausgeber.kurz}</p>
              <a
                href={herausgeber.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block rounded-sm hover:opacity-80"
              >
                <HerausgeberMarke dark className="h-12" />
                <span className="sr-only"> (öffnet in neuem Tab)</span>
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 xl:grid-cols-7">
            {footerNav.map((col) => (
              <div key={col.titel}>
                <p className="text-sm font-bold">{col.titel}</p>
                <ul className="mt-3 space-y-2">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="text-sm text-white/65 hover:text-white">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name} · ein Projekt von {herausgeber.name}
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {legalNav.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
