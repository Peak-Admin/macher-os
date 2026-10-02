import { FinalCta, PageHero } from "@/components/sections";
import { ArrowLink, Card, Faq, FaqJsonLd, IconTile, Section, SectionHeading } from "@/components/ui";
import { clusterInhalte, topGewerkInhalte } from "@/content/gewerke";
import { gewerkCluster, topGewerke, type GewerkClusterSlug } from "@/content/registry";
import { arbeitsweiseIcon, ChipLink, FunktionLink } from "./Bausteine";
import { GewerkTagMock } from "./Mocks";

export function ClusterSeite({ slug }: { slug: GewerkClusterSlug }) {
  const c = clusterInhalte[slug];
  const reg = gewerkCluster.find((x) => x.slug === slug)!;
  const tops = c.top.map((t) => topGewerke.find((x) => x.slug === t)!);
  const verwandt = c.verwandt.map((v) => gewerkCluster.find((x) => x.slug === v)!);

  return (
    <>
      {/* Hero */}
      <PageHero
        breadcrumbs={[{ label: "Gewerke", href: "/gewerke" }, { label: reg.titel }]}
        eyebrow={c.seoTitel}
        title={c.heroTitel}
        intro={c.intro}
        visual={<GewerkTagMock betrieb="Dein Betrieb" label={reg.titel} tag={c.tag} chips={c.berufe.slice(0, 4)} />}
      />

      {/* Welche Berufe dazugehören */}
      <Section tone="white">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <SectionHeading
            eyebrow="Für diese Berufe"
            title="Wer hier richtig ist."
            intro="Macher OS ist für diese Berufe vorbereitet. Dein Beruf fehlt? Die Einrichtung richtet sich nach deiner Arbeitsweise – nicht nach einer Liste."
          />
          <ul className="flex flex-wrap content-start gap-2.5">
            {c.berufe.map((b) => (
              <li key={b} className="rounded-md bg-paper px-3.5 py-2 font-semibold ring-1 ring-line">
                {b}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Typische Arbeitsweisen */}
      <Section>
        <SectionHeading
          eyebrow="Typische Arbeitsweisen"
          title="So wird in diesen Betrieben gearbeitet."
          intro="Beim Start wählst du, wie dein Betrieb arbeitet. Danach richtet Macher OS Abläufe und Planung ein."
        />
        <div className={`mt-10 grid gap-4 sm:grid-cols-2 ${c.arbeitsweisen.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
          {c.arbeitsweisen.map((a) => (
            <div key={a.art} className="rounded-lg border border-line bg-white p-6">
              <IconTile name={arbeitsweiseIcon[a.art]} tone="sky" className="mb-4" />
              <h3 className="font-display text-lg font-bold">{a.art}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{a.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Was Macher OS einrichtet */}
      <Section tone="sand">
        <SectionHeading
          eyebrow="Eingerichtet für dich"
          title="Was Macher OS für dich vorbereitet."
          intro="Alles ist von Anfang an da – und lässt sich an deinen Betrieb anpassen."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {c.einrichtung.map((e) => (
            <Card key={e.titel} title={e.titel} icon="check" iconTone="moss">
              {e.text}
            </Card>
          ))}
        </div>
      </Section>

      {/* Passende Funktionen */}
      <Section tone="white">
        <SectionHeading eyebrow="Passende Funktionen" title="Das brauchst du jeden Tag." />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {c.funktionen.map((f) => (
            <FunktionLink key={f} slug={f} />
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
          <ArrowLink href="/funktionen">Alle Funktionen ansehen</ArrowLink>
          <ArrowLink href="/preise">Preise ansehen</ArrowLink>
        </div>
      </Section>

      {/* Passende Top-Gewerke und verwandte Bereiche */}
      <Section>
        <SectionHeading
          eyebrow="Mehr ansehen"
          title={tops.length > 0 ? "Verwandte Gewerke im Detail." : "Verwandte Bereiche."}
          intro={
            tops.length > 0
              ? "Für diese Gewerke gibt es ausführliche Seiten mit Abläufen, Vorlagen und Beispielen."
              : "Diese Bereiche arbeiten ähnlich wie du."
          }
        />
        {tops.length > 0 && (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tops.map((t) => (
              <Card key={t.slug} title={`Macher OS für ${topGewerkInhalte[t.slug].name}`} icon={topGewerkInhalte[t.slug].icon} href={`/gewerke/${t.slug}`}>
                {topGewerkInhalte[t.slug].teaser}
              </Card>
            ))}
          </div>
        )}
        <ul className="mt-8 flex flex-wrap gap-2.5">
          {verwandt.map((v) => (
            <li key={v.slug}>
              <ChipLink href={`/gewerke/${v.slug}`}>{v.titel}</ChipLink>
            </li>
          ))}
          <li>
            <ChipLink href="/gewerke">Alle Gewerke</ChipLink>
          </li>
        </ul>
      </Section>

      {/* FAQ */}
      <Section tone="white" containerSize="narrow">
        <SectionHeading title="Häufige Fragen" />
        <div className="mt-8">
          <Faq items={c.faq} />
        </div>
        <FaqJsonLd items={c.faq} />
      </Section>

      <FinalCta
        title="Macher OS für deinen Betrieb einrichten."
        intro="Starte kostenlos. Wähle dein Gewerk und deine Arbeitsweise – Macher OS richtet den Rest ein."
      />
    </>
  );
}
