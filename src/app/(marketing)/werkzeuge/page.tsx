import Link from "next/link";
import { FinalCta, PageHero } from "@/components/sections";
import {
  ArrowLink,
  ButtonLink,
  Card,
  CheckList,
  Faq,
  FaqJsonLd,
  Icon,
  Section,
  SectionHeading,
} from "@/components/ui";
import { WerkzeugKarte } from "@/components/werkzeuge/WerkzeugKarte";
import { gewerkHref, topGewerke, werkzeuge, werkzeugHref } from "@/content/registry";
import { berechneStundensatz, euro, zahl } from "@/content/werkzeuge/rechnen";
import { hub } from "@/content/werkzeuge/hub";
import { werkzeugeNachGewerk } from "@/content/werkzeuge/inhalte";
import { standardwerte } from "@/content/werkzeuge/standardwerte";
import { pageMeta } from "@/lib/metadata";
import { cta } from "@/lib/site";

export const metadata = pageMeta({
  title: hub.seoTitel,
  description: hub.beschreibung,
  path: "/werkzeuge",
});

const titelVon = (slug: string) => werkzeuge.find((w) => w.slug === slug)?.titel ?? slug;

/** Stilisierte Vorschau eines Rechner-Ergebnisses – mit echten Beispielzahlen. */
function RechnerVorschau() {
  const s = standardwerte.stundensatz;
  const r = berechneStundensatz(s)!;
  const zeilen: [string, string][] = [
    ["Jahreskosten", euro(r.jahreskosten)],
    ["Produktive Stunden", `${zahl(r.produktiveStunden)} h`],
    ["Kosten pro Stunde", euro(r.kostensatz)],
  ];
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-line bg-white p-5 shadow-xl shadow-ink/5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-muted">
          <Icon name="calculator" className="size-4 text-signal-dark" /> Stundensatz-Rechner
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            ["Mitarbeiter", `${s.produktiveMitarbeiter} Pers.`],
            ["Urlaub", `${s.urlaub} Tage`],
            ["Abrechenbar", `${s.produktivAnteil} %`],
            ["Gewinn", `${s.gewinn} %`],
          ].map(([l, w]) => (
            <div key={l}>
              <p className="mb-1 text-xs font-semibold text-muted">{l}</p>
              <p className="rounded-lg bg-paper px-3 py-2 text-right font-semibold tabular-nums ring-1 ring-line">{w}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="-mt-4 ml-6 rounded-2xl bg-ink p-5 text-white shadow-xl sm:ml-12">
        <p className="text-xs font-semibold font-tagline uppercase tracking-[0.12em] text-white/60">Dein Stundensatz netto</p>
        <p className="mt-1 font-display text-4xl font-extrabold tabular-nums">{euro(r.netto)}</p>
        <dl className="mt-4 divide-y divide-white/10 border-t border-white/10 text-sm">
          {zeilen.map(([l, w]) => (
            <div key={l} className="flex justify-between py-2">
              <dt className="text-white/70">{l}</dt>
              <dd className="font-semibold tabular-nums">{w}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

export default function WerkzeugeHub() {
  return (
    <>
      {/* 1. Hero */}
      <PageHero
        breadcrumbs={[{ label: "Werkzeuge" }]}
        eyebrow="Werkzeuge"
        title="Kostenlose Werkzeuge für deinen Betrieb."
        intro={hub.intro}
        actions={
          <>
            <ButtonLink href="#rechner" size="lg">
              Rechner ansehen
            </ButtonLink>
            <ButtonLink href={cta.primary.href} variant="secondary" size="lg">
              {cta.primary.label}
            </ButtonLink>
          </>
        }
        trust={false}
        visual={<RechnerVorschau />}
      >
        <CheckList items={hub.vorteile} className="mt-6 text-sm font-medium sm:grid-cols-3" />
      </PageHero>

      {/* 2. Rechner */}
      <Section id="rechner" tone="white">
        <SectionHeading
          eyebrow="Rechner"
          title="Sechs Rechner für die wichtigsten Zahlen."
          intro="Jeder Rechner zeigt dir das Ergebnis sofort – mit Formel, Beispiel und Erklärung."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {werkzeuge.map((w) => (
            <WerkzeugKarte key={w.slug} slug={w.slug} mitLabel />
          ))}
        </div>
      </Section>

      {/* 3. Vorlagen */}
      <Section tone="sand" tight>
        <div className="grid items-center gap-8 rounded-2xl bg-white p-6 ring-1 ring-line sm:p-10 lg:grid-cols-[1fr_auto]">
          <div className="flex gap-5">
            <span className="hidden size-12 shrink-0 items-center justify-center rounded-lg bg-sky-soft text-sky sm:inline-flex">
              <Icon name="file" className="size-6" />
            </span>
            <div>
              <p className="mb-2 text-sm font-semibold font-tagline uppercase tracking-[0.06em] text-signal-dark">Vorlagen</p>
              <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                Vorlagen und Checklisten zum Mitnehmen.
              </h2>
              <p className="mt-2 max-w-2xl text-muted">
                Für Aufmaß, Abnahme, Baustellenstart und mehr. Direkt nutzbar – auf Papier oder am Handy.
              </p>
            </div>
          </div>
          <ButtonLink href="/wissen/vorlagen" variant="dark">
            Zu den Vorlagen <Icon name="arrow-right" className="size-4" />
          </ButtonLink>
        </div>
      </Section>

      {/* 4. Nach Gewerk */}
      <Section>
        <SectionHeading
          eyebrow="Nach Gewerk"
          title="Welche Rechner zu deinem Gewerk passen."
          intro="Jedes Gewerk rechnet ein bisschen anders. Hier siehst du, womit du anfangen solltest."
        />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {topGewerke.map((g) => {
            const eintrag = werkzeugeNachGewerk[g.slug];
            return (
              <li key={g.slug} className="flex flex-col rounded-2xl border border-line bg-white p-5">
                <Link
                  href={gewerkHref(g.slug)}
                  className="group inline-flex items-center gap-1.5 font-display text-lg font-bold leading-snug hover:text-signal-dark"
                >
                  {g.titel}
                  <Icon name="arrow-right" className="size-4 text-signal-dark transition-transform group-hover:translate-x-0.5" />
                </Link>
                <p className="mt-1 text-sm text-muted">{eintrag.text}</p>
                <ul className="mt-4 grid gap-1.5 border-t border-line pt-4">
                  {eintrag.werkzeuge.map((w) => (
                    <li key={w}>
                      <Link
                        href={werkzeugHref(w)}
                        className="flex items-center gap-2 text-sm font-semibold underline decoration-line decoration-2 underline-offset-4 hover:decoration-signal"
                      >
                        <Icon name="calculator" className="size-4 shrink-0 text-muted" />
                        {titelVon(w)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
        <ArrowLink href="/gewerke" className="mt-8">
          Alle Gewerke ansehen
        </ArrowLink>
      </Section>

      {/* 5. Neu / beliebt */}
      <Section tone="white">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Beliebt" title="Gut für den Einstieg." as="h2" />
            <div className="mt-8 grid gap-4">
              {hub.beliebt.map((s) => (
                <WerkzeugKarte key={s} slug={s} />
              ))}
            </div>
          </div>
          <div>
            <SectionHeading eyebrow="Neu" title="Neu dazugekommen." as="h2" />
            <div className="mt-8 grid gap-4">
              {hub.neu.map((s) => (
                <WerkzeugKarte key={s} slug={s} />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <Card title="Praxistipps im Blog" icon="book" iconTone="sky" href="/wissen/blog">
            Stundensatz, Angebot, Nachkalkulation – einfach erklärt.
          </Card>
          <Card title="Kalkulation in Macher OS" icon="calculator" href="/funktionen/kalkulation">
            Deine Zahlen einmal hinterlegen und in jedem Angebot nutzen.
          </Card>
        </div>
      </Section>

      {/* FAQ */}
      <Section containerSize="narrow">
        <SectionHeading title="Häufige Fragen" />
        <div className="mt-8">
          <Faq items={hub.faq} />
        </div>
        <FaqJsonLd items={hub.faq} />
      </Section>

      {/* 6. CTA */}
      <FinalCta
        title="Macher OS kostenlos testen"
        intro="Die Rechner sind der Anfang. In Macher OS rechnen Angebote, Aufträge und Auswertungen automatisch mit deinen Zahlen."
        primaryLabel="Macher OS kostenlos testen"
      />
    </>
  );
}
