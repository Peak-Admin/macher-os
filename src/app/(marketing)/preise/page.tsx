import Link from "next/link";
import { PlanWegweiser } from "@/components/preise/PlanWegweiser";
import { PreisUmschalter } from "@/components/preise/PreisUmschalter";
import { Vergleichstabelle } from "@/components/preise/Vergleichstabelle";
import { FinalCta, KundenCard, PageHero } from "@/components/sections";
import {
  ArrowLink,
  ButtonLink,
  CheckList,
  Faq,
  FaqJsonLd,
  Icon,
  IconTile,
  Section,
  SectionHeading,
} from "@/components/ui";
import { immerDabei } from "@/content/preise";
import { inAllenPlaenen, preiseFaq, wechselSchritte, zusatzleistungen } from "@/content/preise-vergleich";
import { kunden } from "@/content/registry";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: "Preise – Einfacher Preis für deinen ganzen Betrieb",
  description:
    "Die Preise von Macher OS: Pläne für Ein-Mann-Betriebe bis zu Betrieben mit mehreren Standorten. Monatlich kündbar oder jährlich günstiger. Kostenlos testen ohne Kreditkarte.",
  path: "/preise",
});

export default function PreisePage() {
  return (
    <>
      <PageHero
        breadcrumbs={[{ label: "Preise" }]}
        eyebrow="Preise"
        title="Einfacher Preis für deinen ganzen Betrieb."
        intro="Ein Plan für alle im Betrieb – Büro und Baustelle. Monatlich kündbar oder jährlich günstiger."
        actions="none"
      />

      {/* Toggle + Preiskarten */}
      <Section tone="white" tight>
        <PreisUmschalter />
      </Section>

      {/* Welcher Plan passt zu mir? */}
      <Section>
        <SectionHeading
          eyebrow="Wegweiser"
          title="Welcher Plan passt zu mir?"
          intro="Die wichtigste Frage ist, wie viele Leute mit Macher OS arbeiten. Den Rest kannst du jederzeit anpassen."
        />
        <div className="mt-10">
          <PlanWegweiser />
        </div>
      </Section>

      {/* Vergleich */}
      <Section tone="white">
        <SectionHeading
          eyebrow="Vergleich"
          title="Die Unterschiede auf einen Blick."
          intro="Hier steht nur, was sich zwischen den Plänen unterscheidet."
        />
        <p className="mt-6 text-sm text-muted">
          <b className="text-ink">In allen Plänen dabei:</b> {inAllenPlaenen.join(" · ")}
        </p>
        <div className="mt-6">
          <Vergleichstabelle />
        </div>
      </Section>

      {/* Was immer dabei ist */}
      <Section tone="ink">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-center">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-signal">Ohne Aufpreis</p>
            <h2 className="font-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl">
              Was immer dabei ist.
            </h2>
            <p className="mt-4 text-lg text-white/70">Egal welcher Plan – das bekommst du immer.</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {immerDabei.map((x) => (
              <li key={x} className="flex items-center gap-3 rounded-lg bg-white/5 p-4 ring-1 ring-white/10">
                <Icon name="check" className="size-5 shrink-0 text-signal" />
                <span className="font-semibold">{x}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Zusatzleistungen */}
      <Section>
        <SectionHeading
          eyebrow="Zusatzleistungen"
          title="Bei Bedarf dazu."
          intro="Diese Leistungen besprechen wir einzeln mit dir. Den Preis bekommst du auf Anfrage."
        />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {zusatzleistungen.map((z) => (
            <li key={z.titel} className="flex flex-col rounded-xl border border-line bg-white p-6">
              <IconTile name={z.icon} tone="sky" />
              <h3 className="mt-4 font-display text-lg font-bold">{z.titel}</h3>
              <p className="mt-2 flex-1 text-[0.95rem] leading-relaxed text-muted">{z.text}</p>
              <p className="mt-4 text-sm font-semibold">Preis auf Anfrage</p>
              <Link
                href={z.href}
                className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-signal-dark hover:text-ink"
              >
                {z.linkLabel} <Icon name="arrow-right" className="size-4" />
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* Wechselservice */}
      <Section tone="sand">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading
              eyebrow="Wechselservice"
              title="Wir helfen dir beim Umstieg."
              intro="Du nutzt schon ein anderes Programm oder arbeitest mit Excel und Zetteln? Deine Daten kommen mit."
            />
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/hilfe/daten-uebernehmen" variant="dark">
                So übernimmst du deine Daten
              </ButtonLink>
            </div>
          </div>
          <ol className="grid gap-3">
            {wechselSchritte.map((s, i) => (
              <li key={s.titel} className="flex gap-4 rounded-xl bg-white p-5 ring-1 ring-line">
                <span className="font-display text-sm font-extrabold text-signal-dark">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>
                  <span className="block font-display font-bold">{s.titel}</span>
                  <span className="mt-1 block text-[0.95rem] text-muted">{s.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* Kundenbeweis */}
      <Section tone="white">
        <SectionHeading
          eyebrow="Kunden"
          title="So arbeiten Betriebe mit Macher OS."
          intro="Beispielgeschichten, die zeigen, wie typische Betriebe Macher OS nutzen."
        />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kunden.slice(0, 3).map((k) => (
            <li key={k.slug} className="flex [&>a]:w-full">
              <KundenCard slug={k.slug} />
            </li>
          ))}
        </ul>
        <ArrowLink href="/kunden" className="mt-8">
          Alle Kunden ansehen
        </ArrowLink>
      </Section>

      {/* FAQ */}
      <Section containerSize="narrow">
        <SectionHeading title="Häufige Fragen zu den Preisen" />
        <div className="mt-8">
          <Faq items={preiseFaq} />
        </div>
        <FaqJsonLd items={preiseFaq} />
        <CheckList
          className="mt-8 text-sm text-muted"
          items={["Kostenlos testen ohne Kreditkarte", "Monatlich kündbar", "Support auf Deutsch"]}
          columns={3}
        />
      </Section>

      <FinalCta
        title="Starte heute. Zahl erst, wenn es passt."
        intro="Teste Macher OS kostenlos und richte es in wenigen Minuten für deinen Betrieb ein."
      />
    </>
  );
}
