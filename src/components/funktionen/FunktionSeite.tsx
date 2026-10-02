import Link from "next/link";
import { FinalCta, KundenCard, PageHero, Steps } from "@/components/sections";
import { ArrowLink, CheckList, Faq, FaqJsonLd, Icon, IconTile, Section, SectionHeading } from "@/components/ui";
import {
  funktionGruppe,
  funktionInhalte,
  funktionTitel,
  gewerkTitel,
  type StandardSlug,
} from "@/content/funktionen";
import { funktionGruppen, gewerkHref, werkzeuge } from "@/content/registry";
import { DetailKarte } from "./DetailKarte";
import { FunktionKarte } from "./FunktionKarte";
import { FunktionsHandy } from "./FunktionsHandy";
import { FunktionsMock } from "./FunktionsMock";

/** Einheitlicher Aufbau einer Funktionsseite (Abschnitt 8 der Website-Struktur). */
export function FunktionSeite({ slug }: { slug: StandardSlug }) {
  const f = funktionInhalte[slug];
  const titel = funktionTitel(slug);
  const gruppe = funktionGruppen[funktionGruppe(slug)];
  const werkzeug = f.werkzeug ? werkzeuge.find((w) => w.slug === f.werkzeug) : undefined;

  return (
    <>
      {/* 1. Hero: Problem + Lösung */}
      <PageHero
        breadcrumbs={[{ label: "Funktionen", href: "/funktionen" }, { label: titel }]}
        eyebrow={`${gruppe.titel} · ${titel}`}
        title={f.hero.titel}
        intro={
          <>
            {f.hero.problem} <span className="font-semibold text-ink">{f.hero.loesung}</span>
          </>
        }
        visual={<FunktionsMock visual={f.visual} label={`Produktansicht Macher OS: ${titel}`} />}
      />

      {/* 2. Das Problem */}
      <Section tone="white">
        <SectionHeading eyebrow="Das Problem" title={f.problemTitel} />
        <ul className={`mt-10 grid gap-4 sm:grid-cols-2 ${f.probleme.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
          {f.probleme.map((p) => (
            <li key={p.titel} className="rounded-lg border border-line bg-paper p-6">
              <span className="inline-flex size-9 items-center justify-center rounded-md bg-signal-soft text-signal-dark">
                <Icon name="x" className="size-4.5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-bold leading-snug">{p.titel}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{p.text}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* 3. So löst Macher OS es */}
      <Section>
        <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <SectionHeading eyebrow="So löst Macher OS es" title={f.loesung.titel} intro={f.loesung.text} />
            <CheckList items={f.loesung.punkte} className="mt-8" />
          </div>
          <div className="px-3 sm:px-6">
            <DetailKarte detail={f.detail} label={`Detailansicht in Macher OS: ${f.detail.titel}`} />
          </div>
        </div>
      </Section>

      {/* 4. So läuft es ab */}
      <Section tone="sand">
        <SectionHeading eyebrow="So läuft es ab" title={`${titel} in ${f.schritte.length} Schritten.`} />
        <Steps steps={f.schritte} className="mt-10" />
      </Section>

      {/* 5. Automatisch erledigt */}
      <Section tone="ink">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-signal">Automatisch erledigt</p>
            <h2 className="font-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl">
              Das übernimmt Macher für dich.
            </h2>
            <p className="mt-5 max-w-md text-lg text-white/70">
              Du legst die Regeln fest. Was nach außen geht oder Geld kostet, gibst du frei.
            </p>
            <Link
              href="/funktionen/automatisch-erledigen"
              className="mt-8 inline-flex items-center gap-1.5 font-bold text-signal underline decoration-2 underline-offset-4 hover:text-white"
            >
              Alles, was Macher erledigt <Icon name="arrow-right" className="size-4" />
            </Link>
          </div>
          <ul className="grid content-start gap-3 sm:grid-cols-2">
            {f.automatisch.map((a) => (
              <li key={a} className="flex items-start gap-3 rounded-lg bg-white/5 p-4 ring-1 ring-white/10">
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-signal/15 text-signal">
                  <Icon name="spark" className="size-4" />
                </span>
                <span className="font-semibold leading-snug">Macher {a}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* 6. Auf Handy und Computer */}
      <Section tone="white">
        <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.3fr]">
          <div className="order-2 lg:order-1">
            <FunktionsHandy handy={f.geraete.handyVisual} label={`Macher OS App auf dem Handy: ${titel}`} />
          </div>
          <div className="order-1 lg:order-2">
            <SectionHeading
              eyebrow="Auf Handy und Computer"
              title="Auf der Baustelle und im Büro."
              intro="Alle sehen denselben Stand – jeder nur das, was er für seine Arbeit braucht."
            />
            <div className="mt-10 grid gap-8 sm:grid-cols-2">
              <div>
                <p className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
                  <IconTile name="smartphone" tone="sky" className="size-9" /> Auf dem Handy
                </p>
                <CheckList items={f.geraete.handy} />
              </div>
              <div>
                <p className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
                  <IconTile name="monitor" tone="sky" className="size-9" /> Am Computer
                </p>
                <CheckList items={f.geraete.computer} />
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* 7. Für diese Gewerke besonders relevant */}
      <Section>
        <SectionHeading
          eyebrow="Gewerke"
          title="Für diese Gewerke besonders wichtig."
          intro="Macher OS richtet die Funktion passend zu deinem Gewerk ein – mit den Begriffen und Vorlagen, die du kennst."
        />
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {f.gewerke.map((g) => (
            <li key={g.slug}>
              <Link
                href={gewerkHref(g.slug)}
                className="group flex h-full flex-col rounded-lg border border-line bg-white p-6 transition hover:border-ink/30 hover:shadow-lg hover:shadow-ink/5"
              >
                <span className="font-display text-lg font-bold">
                  {gewerkTitel(g.slug)}
                  <Icon
                    name="arrow-right"
                    className="ml-1.5 inline size-4 -translate-y-px text-signal-dark transition-transform group-hover:translate-x-0.5"
                  />
                </span>
                <span className="mt-2 text-[0.95rem] leading-relaxed text-muted">{g.text}</span>
              </Link>
            </li>
          ))}
        </ul>
        <ArrowLink href="/gewerke" className="mt-8">
          Mein Gewerk ansehen
        </ArrowLink>
      </Section>

      {/* 8. Kundenbeweis */}
      <Section tone="white">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionHeading eyebrow="Aus der Praxis" title="So arbeiten andere Betriebe." intro={f.kunde.text} />
            <p className="mt-4 text-sm text-muted">
              Die Kundenstory ist ein Beispiel und zeigt, wie ein Betrieb mit Macher OS arbeiten kann.
            </p>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
              <ArrowLink href="/kunden">Alle Kundenstories</ArrowLink>
              {werkzeug && <ArrowLink href={`/werkzeuge/${werkzeug.slug}`}>{werkzeug.titel} nutzen</ArrowLink>}
              <ArrowLink href="/wissen">Wissen fürs Handwerk</ArrowLink>
            </div>
          </div>
          <div className="mx-auto w-full max-w-sm">
            <KundenCard slug={f.kunde.slug} />
          </div>
        </div>
      </Section>

      {/* 9. FAQ */}
      <Section containerSize="narrow">
        <SectionHeading title={`Häufige Fragen zu ${titel}`} />
        <div className="mt-8">
          <Faq items={f.faq} />
        </div>
        <FaqJsonLd items={f.faq} />
      </Section>

      {/* Verwandte Funktionen */}
      <Section tone="sand" tight>
        <SectionHeading eyebrow="Verwandte Funktionen" title="Hängt alles zusammen." />
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {f.verwandt.map((v) => (
            <li key={v}>
              <FunktionKarte slug={v} />
            </li>
          ))}
        </ul>
        <ArrowLink href="/funktionen" className="mt-8">
          Alle Funktionen ansehen
        </ArrowLink>
      </Section>

      {/* 10. CTA */}
      <FinalCta />
    </>
  );
}
