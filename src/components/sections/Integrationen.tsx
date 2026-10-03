import Link from "next/link";
import { ButtonLink, IntegrationLogo, Section, Zone } from "@/components/ui";
import { integration, integrationenZahl, logoReihe, saeulen, type Integration } from "@/content/integrationen";
import { GlasIcon } from "@/os/ui/glas";

const reihe = logoReihe.map(integration).filter((i): i is Integration => !!i);

/** Ruhige Logo-Wand der wichtigsten Marken – mit Namen, damit kein Logo allein für sich spricht. */
export function LogoWand({ dunkel = false, anzahl = 12 }: { dunkel?: boolean; anzahl?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-3 sm:gap-3">
      {reihe.slice(0, anzahl).map((i) => (
        <li
          key={i.id}
          className={`flex min-w-0 items-center gap-3 rounded-xl p-2.5 pr-3 ${
            dunkel ? "bg-white/[0.06] ring-1 ring-white/15" : "bg-white ring-1 ring-line"
          }`}
        >
          <IntegrationLogo integration={i} groesse="sm" />
          <span className={`min-w-0 text-sm font-semibold leading-tight ${dunkel ? "text-white" : "text-ink"}`}>
            {i.marke ?? i.name}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Highlight-Box für die Startseite: vier Säulen + Logo-Wand + Weg zur Seite „Integrationen“. */
export function IntegrationenHighlight() {
  return (
    <Zone ton="dunkel" label="integrationen-titel">
      <Section tone="transparent">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="min-w-0">
            <p className="mb-3 text-sm font-semibold font-tagline uppercase tracking-[0.06em] text-accent">Integrationen</p>
            <h2 id="integrationen-titel" className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-balance sm:text-5xl">
              Passt zu dem, was du schon nutzt.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-on-dark">
              E-Mail, Kalender, Steuerberater, Großhändler und Ausschreibung. Handwerk OS verbindet sich in vier Säulen.
            </p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {saeulen.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/integrationen#${s.id}`}
                    className="flex h-full items-start gap-3 rounded-xl bg-white/[0.06] p-4 ring-1 ring-white/15 transition-colors duration-150 ease-out hover:bg-white/10"
                  >
                    <GlasIcon name={s.icon} className="size-10 shrink-0" />
                    <span className="min-w-0">
                      <span className="block font-semibold text-white">{s.name}</span>
                      <span className="block text-sm text-on-dark">{s.kurz}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="min-w-0 rounded-2xl bg-white p-5 text-ink sm:p-6">
            <p className="mb-4 font-display text-xl font-bold">Womit Handwerk OS arbeitet</p>
            <LogoWand />
            <p className="mt-4 text-sm text-muted">
              {integrationenZahl} Integrationen in vier Säulen. Die Marken gehören ihren Inhabern.
            </p>
            <ButtonLink href="/integrationen" className="mt-5 w-full sm:w-auto">
              Alle Integrationen ansehen
            </ButtonLink>
          </div>
        </div>
      </Section>
    </Zone>
  );
}
