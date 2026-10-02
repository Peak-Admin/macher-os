import Link from "next/link";
import { KiFragen, VertrauensKacheln } from "@/components/sections/FooterVertrauen";
import { ButtonLink } from "@/components/ui";
import { HerausgeberMarke } from "@/components/sections/MissionMittelstand";
import { cta, footerNav, herausgeber, legalNav, site } from "@/lib/site";
import { Logo } from "./Logo";
import { ausgehend } from "@/lib/link/ausgehend";

export function Footer() {
  return (
    // Der Footer ist eine eigene dunkelgrüne Box mit Rand zum Fenster (wie die Abschnitte darüber, nach Peak One).
    <div className="px-2 pb-2 sm:px-3 sm:pb-3">
    <footer data-header-theme="dunkel" className="markenflaeche relative overflow-hidden rounded-xl text-white sm:rounded-2xl lg:rounded-3xl">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_3fr]">
          <div className="max-w-xs">
            <Logo dark />
            <p className="mt-4 text-sm leading-relaxed text-white/65">
              Das Betriebssystem für Handwerksbetriebe. Einfach vorne. Vollständig hinten.
            </p>
            <ButtonLink href={cta.primary.href} variant="onDark" className="mt-6">
              {cta.primary.label}
            </ButtonLink>
            <div className="mt-6 border-t border-white/10 pt-5">
              <p className="text-sm text-white/65">{herausgeber.kurz}</p>
              <a
                href={ausgehend(herausgeber.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block rounded-sm hover:opacity-80"
              >
                <HerausgeberMarke dark className="h-12" />
                <span className="sr-only"> (öffnet in neuem Tab)</span>
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 xl:grid-cols-5">
            {footerNav.map((col) => (
              <div key={col.titel}>
                <p className="text-sm font-bold text-accent">{col.titel}</p>
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
        <div className="mt-12 border-t border-white/10 pt-8">
          <div className="sm:ml-auto sm:w-fit">
            <KiFragen />
            <VertrauensKacheln className="mt-6" />
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-white/55 sm:flex-row sm:items-center sm:justify-between">
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
    </div>
  );
}
