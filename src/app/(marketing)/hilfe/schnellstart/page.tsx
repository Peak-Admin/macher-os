import { SchnellstartAnsicht } from "@/components/hilfe/SchnellstartAnsicht";
import { FinalCta, PageHero } from "@/components/sections";
import { ArrowLink, ButtonLink, CheckList, Icon, IconTile, Section, SectionHeading } from "@/components/ui";
import { schnellstartSchritte } from "@/content/hilfe/schnellstart";
import { cta } from "@/lib/site";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: "Schnellstart",
  description:
    "In 7 Schritten mit Macher OS starten: Konto erstellen, Gewerk und Leistungen wählen, Mitarbeiter einladen, ersten Auftrag anlegen, App installieren und planen.",
  path: "/hilfe/schnellstart",
});

export default function SchnellstartPage() {
  return (
    <>
      <PageHero
        eyebrow="Schnellstart"
        title="In 7 Schritten startklar."
        intro="Vom Konto bis zur ersten Planung. Die meisten Schritte dauern nur ein, zwei Minuten – und du kannst jederzeit später weitermachen."
        breadcrumbs={[{ label: "Hilfe", href: "/hilfe" }, { label: "Schnellstart" }]}
        actions={
          <>
            <ButtonLink href={cta.primary.href} size="lg">
              {cta.primary.label}
            </ButtonLink>
            <ButtonLink href="/hilfe-center" variant="secondary" size="lg">
              Zum Hilfe-Center
            </ButtonLink>
          </>
        }
      >
        <ol className="mt-8 flex flex-wrap gap-2 text-sm">
          {schnellstartSchritte.map((s, i) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 font-semibold ring-1 ring-line hover:ring-ink/40"
              >
                <span className="text-signal-dark">{i + 1}</span> {s.titel}
              </a>
            </li>
          ))}
        </ol>
      </PageHero>

      <Section tone="white">
        <ol className="space-y-6 sm:space-y-8">
          {schnellstartSchritte.map((s, i) => (
            <li
              key={s.id}
              id={s.id}
              className="scroll-mt-24 grid items-center gap-8 rounded-2xl border border-line bg-paper p-6 sm:p-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12"
            >
              <div>
                <div className="flex items-center gap-3">
                  <IconTile name={s.icon} />
                  <span className="text-sm font-extrabold font-tagline uppercase tracking-wider text-signal-dark">
                    Schritt {i + 1} von {schnellstartSchritte.length}
                  </span>
                </div>
                <h2 className="mt-4 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{s.titel}</h2>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                  <Icon name="clock" className="size-4" /> {s.dauer}
                </p>
                <p className="mt-4 text-lg leading-relaxed text-ink-soft">{s.text}</p>
                <CheckList items={s.punkte} className="mt-5" />
                {s.artikel && (
                  <ArrowLink href={`/hilfe-center/${s.artikel}`} className="mt-6">
                    Ausführliche Anleitung
                  </ArrowLink>
                )}
              </div>
              <div className="mx-auto w-full max-w-sm">
                <SchnellstartAnsicht ansicht={s.id} />
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <SectionHeading
            eyebrow="Geschafft"
            title="Und jetzt? Einfach arbeiten."
            intro="Ab hier lernst du Macher OS im Alltag kennen. Macher erinnert dich an offene Aufgaben und schlägt dir vor, was als Nächstes sinnvoll ist."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <ArrowLink href="/hilfe/daten-uebernehmen">Bestehende Daten übernehmen</ArrowLink>
            <ArrowLink href="/hilfe-center/angebot-erstellen">Erstes Angebot schreiben</ArrowLink>
            <ArrowLink href="/hilfe-center/rollen-und-rechte">Rollen und Rechte festlegen</ArrowLink>
            <ArrowLink href="/hilfe/kontakt">Hilfe beim Einrichten</ArrowLink>
          </div>
        </div>
      </Section>

      <FinalCta
        title="Leg los. Dein Betrieb wartet."
        intro="Konto anlegen, Gewerk wählen – der Rest ergibt sich. Kostenlos und ohne Kreditkarte."
        primaryLabel="Jetzt kostenlos starten"
      />
    </>
  );
}
