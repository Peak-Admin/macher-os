import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FinalCta } from "@/components/sections";
import { Breadcrumbs, ButtonLink, CheckList, Container, Icon, Section, SectionHeading } from "@/components/ui";
import { DruckenButton, DruckStyles } from "@/components/wissen/Drucken";
import { FunktionLinks, Rechtshinweis } from "@/components/wissen/Teile";
import { VorlageVorschau } from "@/components/wissen/VorlageVorschau";
import { gewerkHref, topGewerke } from "@/content/registry";
import { blogArtikel, blogHref } from "@/content/wissen/blog";
import { getVorlage, vorlageHref, vorlagen } from "@/content/wissen/vorlagen";
import { pageMeta } from "@/lib/metadata";
import { cta } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return vorlagen.map((v) => ({ slug: v.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const v = getVorlage(slug);
  if (!v) return {};
  return pageMeta({
    title: `${v.titel} – kostenlose Vorlage`,
    description: `${v.kurz} Kostenlos ansehen, drucken oder als PDF speichern.`,
    path: vorlageHref(v.slug),
  });
}

export default async function VorlagePage({ params }: Props) {
  const { slug } = await params;
  const v = getVorlage(slug);
  if (!v) notFound();

  const verwandt = v.verwandt.map(getVorlage).filter((x) => x !== undefined);
  const artikel = blogArtikel.filter((a) => a.vorlagen.includes(v.slug)).slice(0, 3);
  const gewerke = topGewerke.filter((g) => (v.gewerke as readonly string[]).includes(g.slug));

  return (
    <>
      <DruckStyles />

      {/* 1. Was ist die Vorlage? + 2. Wofür? */}
      <section className="border-b border-line bg-paper print:hidden">
        <Container className="py-12 sm:py-16">
          <Breadcrumbs
            items={[
              { label: "Wissen", href: "/wissen" },
              { label: "Vorlagen & Checklisten", href: "/wissen/vorlagen" },
              { label: v.titel },
            ]}
          />
          <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold font-tagline uppercase tracking-[0.06em] text-signal-dark">Kostenlose {v.art}</p>
              <h1 className="mt-3 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-balance sm:text-5xl">
                {v.titel}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{v.wasIst}</p>
              {/* 4. Kostenlos nutzen + 5. In Macher OS */}
              <div className="mt-8 flex flex-wrap gap-3">
                <DruckenButton />
                <ButtonLink href={cta.primary.href} variant="secondary" size="lg">
                  Direkt in Macher OS verwenden
                </ButtonLink>
              </div>
              <p className="mt-3 text-sm text-muted">
                Tipp: Im Druckdialog kannst du die Vorlage auch „Als PDF speichern“.
              </p>
            </div>
            <div className="rounded-lg border border-line bg-white p-6">
              <h2 className="font-display text-lg font-bold">Wofür brauchst du sie?</h2>
              <CheckList items={v.wofuer} className="mt-4" />
            </div>
          </div>
        </Container>
      </section>

      {/* 3. Vorschau */}
      <section className="bg-sand py-12 sm:py-16 print:bg-transparent print:p-0">
        <Container className="print:max-w-none print:px-0">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
            <h2 className="font-display text-2xl font-extrabold tracking-tight">Vorschau</h2>
            <DruckenButton label="Drucken" className="h-11! px-5!" />
          </div>
          <VorlageVorschau vorlage={v} />
        </Container>
      </section>

      <div className="print:hidden">
        {/* 6. Erklärung */}
        <Section tone="white">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr]">
            <SectionHeading eyebrow="Erklärung" title="So nutzt du die Vorlage." />
            <div className="grid gap-6">
              {v.erklaerung.map((e) => (
                <div key={e.titel}>
                  <h3 className="font-display text-lg font-bold">{e.titel}</h3>
                  <p className="mt-1.5 leading-relaxed text-ink-soft">{e.text}</p>
                </div>
              ))}
              {v.rechtshinweis && <Rechtshinweis />}
              {gewerke.length > 0 && (
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold">Besonders praktisch für:</span>
                  {gewerke.map((g) => (
                    <Link
                      key={g.slug}
                      href={gewerkHref(g.slug)}
                      className="rounded-md bg-paper px-2.5 py-1 font-medium ring-1 ring-line hover:ring-ink/40"
                    >
                      {g.titel}
                    </Link>
                  ))}
                </p>
              )}
            </div>
          </div>
        </Section>

        {/* Digital in Macher OS */}
        <Section>
          <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-start">
            <div>
              <SectionHeading
                eyebrow="In Macher OS"
                title="Ohne Zettel geht's schneller."
                intro="In Macher OS füllst du das auf dem Handy aus, hängst Fotos an und lässt direkt unterschreiben. Alles landet automatisch am richtigen Auftrag."
              />
              <ButtonLink href={cta.primary.href} size="lg" className="mt-8">
                Direkt in Macher OS verwenden <Icon name="arrow-right" className="size-4" />
              </ButtonLink>
            </div>
            <FunktionLinks slugs={v.funktionen} />
          </div>
        </Section>

        {/* 7. Verwandte Vorlagen + Artikel */}
        <Section tone="white">
          <SectionHeading title="Verwandte Vorlagen" />
          <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {verwandt.map((x) => (
              <li key={x.slug}>
                <Link
                  href={vorlageHref(x.slug)}
                  className="group flex h-full flex-col rounded-lg border border-line bg-paper p-6 transition hover:border-ink/30"
                >
                  <span className="text-xs font-semibold font-tagline uppercase tracking-wider text-moss">{x.art}</span>
                  <span className="mt-2 font-display text-lg font-bold group-hover:text-signal-dark">{x.titel}</span>
                  <span className="mt-1 text-sm text-muted">{x.kurz}</span>
                </Link>
              </li>
            ))}
            {artikel.map((a) => (
              <li key={a.slug}>
                <Link
                  href={blogHref(a.slug)}
                  className="group flex h-full flex-col rounded-lg border border-line bg-paper p-6 transition hover:border-ink/30"
                >
                  <span className="text-xs font-semibold font-tagline uppercase tracking-wider text-sky">Artikel</span>
                  <span className="mt-2 font-display text-lg font-bold group-hover:text-signal-dark">{a.titel}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        {/* 8. CTA */}
        <FinalCta />
      </div>
    </>
  );
}
