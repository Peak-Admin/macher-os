import Link from "next/link";
import { HilfeSuche } from "@/components/hilfe/HilfeSuche";
import { FinalCta, PageHero } from "@/components/sections";
import { ArrowLink, Icon, IconTile, Section } from "@/components/ui";
import { artikelVonKategorie, hilfeArtikel, hilfeKategorien, hilfeSuchindex } from "@/content/hilfe/artikel";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: "Hilfe-Center",
  description:
    "Anleitungen für Macher OS: Konto, Aufträge, Planung, Mitarbeiter, Material, Geld, App, Einstellungen, Schnittstellen und Sicherheit – Schritt für Schritt erklärt.",
  path: "/hilfe-center",
});

export default function HilfeCenterPage() {
  return (
    <>
      <PageHero
        eyebrow="Hilfe-Center"
        title="Antworten und Anleitungen."
        intro={`${hilfeArtikel.length} Anleitungen in ${hilfeKategorien.length} Bereichen – kurz, klar und Schritt für Schritt.`}
        breadcrumbs={[{ label: "Hilfe", href: "/hilfe" }, { label: "Hilfe-Center" }]}
        actions="none"
      >
        <div className="mt-8 max-w-2xl">
          <HilfeSuche eintraege={hilfeSuchindex()} vorschlaege={["Angebot", "Daten sichern", "Datanorm", "Unterschrift"]} />
        </div>
      </PageHero>

      <Section tone="white" tight>
        <nav aria-label="Bereiche">
          <ul className="flex flex-wrap gap-2">
            {hilfeKategorien.map((k) => (
              <li key={k.slug}>
                <a
                  href={`#${k.slug}`}
                  className="inline-flex items-center gap-2 rounded-md bg-paper px-3 py-2 text-sm font-semibold ring-1 ring-line hover:ring-ink/40"
                >
                  <Icon name={k.icon} className="size-4 text-signal-dark" /> {k.titel}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </Section>

      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          {hilfeKategorien.map((k) => (
            <section key={k.slug} id={k.slug} className="scroll-mt-24 rounded-2xl border border-line bg-white p-6">
              <div className="flex items-start gap-4">
                <IconTile name={k.icon} />
                <div>
                  <h2 className="font-display text-xl font-bold">{k.titel}</h2>
                  <p className="mt-1 text-sm text-muted">{k.text}</p>
                </div>
              </div>
              <ul className="mt-5 divide-y divide-line border-t border-line">
                {artikelVonKategorie(k.slug).map((a) => (
                  <li key={a.slug}>
                    <Link href={`/hilfe-center/${a.slug}`} className="group flex items-start gap-3 py-3">
                      <Icon name="file" className="mt-0.5 size-4 shrink-0 text-muted group-hover:text-signal-dark" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold group-hover:underline">{a.titel}</span>
                        <span className="block text-sm text-muted">{a.kurz}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
          <ArrowLink href="/hilfe/schnellstart">Schnellstart in 7 Schritten</ArrowLink>
          <ArrowLink href="/hilfe/kontakt">Frage nicht beantwortet? Schreib uns</ArrowLink>
        </div>
      </Section>

      <FinalCta />
    </>
  );
}
