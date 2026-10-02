import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FinalCta } from "@/components/sections";
import { Breadcrumbs, ButtonLink, Container, Icon, Section, SectionHeading } from "@/components/ui";
import { BlogBlocks } from "@/components/wissen/BlogBlocks";
import { Abhakliste, FunktionLinks, Rechtshinweis, WerkzeugLinks } from "@/components/wissen/Teile";
import { blogArtikel, blogHref, getArtikel, lesezeit, weitereArtikel } from "@/content/wissen/blog";
import { formatDatum, themaTitel } from "@/content/wissen/themen";
import { getVorlage, vorlageHref } from "@/content/wissen/vorlagen";
import { gewerkHref, topGewerke } from "@/content/registry";
import { pageMeta } from "@/lib/metadata";
import { cta, site } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return blogArtikel.map((a) => ({ slug: a.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = getArtikel(slug);
  if (!a) return {};
  const meta = pageMeta({ title: a.titel, description: a.beschreibung, path: blogHref(a.slug) });
  return {
    ...meta,
    openGraph: { ...meta.openGraph, type: "article", publishedTime: a.datum, authors: ["Macher OS Redaktion"] },
  };
}

export default async function BlogArtikelPage({ params }: Props) {
  const { slug } = await params;
  const a = getArtikel(slug);
  if (!a) notFound();

  const toc = a.inhalt.flatMap((b) => (b.typ === "h2" ? [{ id: b.id, text: b.text }] : []));
  const vorlagen = a.vorlagen.map(getVorlage).filter((v) => v !== undefined);
  const weitere = weitereArtikel(a, 3);
  const gewerke = topGewerke.filter((g) => (a.gewerke as readonly string[]).includes(g.slug));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.titel,
    description: a.beschreibung,
    datePublished: a.datum,
    dateModified: a.datum,
    inLanguage: "de-DE",
    author: { "@type": "Organization", name: "Macher OS Redaktion", url: `${site.url}/wissen` },
    publisher: { "@type": "Organization", name: site.name, url: site.url },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${site.url}${blogHref(a.slug)}` },
    articleSection: a.themen.map(themaTitel),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      {/* 1. Titel + 2. Kurzantwort */}
      <section className="border-b border-line bg-paper">
        <Container size="narrow" className="py-12 sm:py-16">
          <Breadcrumbs items={[{ label: "Wissen", href: "/wissen" }, { label: "Blog", href: "/wissen/blog" }, { label: a.titel }]} />
          <p className="text-sm font-semibold font-tagline uppercase tracking-[0.06em] text-signal-dark">
            {a.themen.map(themaTitel).join(" · ")}
          </p>
          <h1 className="mt-3 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-balance sm:text-5xl">
            {a.titel}
          </h1>
          <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <span>Macher OS Redaktion</span>
            <span aria-hidden>·</span>
            <time dateTime={a.datum}>{formatDatum(a.datum)}</time>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <Icon name="clock" className="size-4" /> {lesezeit(a)} Min. Lesezeit
            </span>
          </p>
          <div className="mt-8 rounded-lg border border-line bg-white p-6">
            <p className="flex items-center gap-2 text-sm font-semibold font-tagline uppercase tracking-wider text-moss">
              <Icon name="check" className="size-4" /> Kurz gesagt
            </p>
            <p className="mt-2 text-lg leading-relaxed text-ink">{a.kurzantwort}</p>
          </div>
        </Container>
      </section>

      <Container className="py-12 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[17rem_minmax(0,48rem)]">
          {/* 3. Inhaltsverzeichnis */}
          <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <nav aria-label="Inhaltsverzeichnis" className="rounded-lg border border-line bg-white p-5">
              <p className="font-display font-bold">Inhalt</p>
              <ol className="mt-3 grid gap-2 text-sm">
                {toc.map((t, i) => (
                  <li key={t.id} className="flex gap-2">
                    <span className="w-4 shrink-0 text-right text-muted">{i + 1}.</span>
                    <a href={`#${t.id}`} className="hover:text-signal-dark">
                      {t.text}
                    </a>
                  </li>
                ))}
                <li className="flex gap-2">
                  <span className="w-4 shrink-0 text-right text-muted">{toc.length + 1}.</span>
                  <a href="#checkliste" className="hover:text-signal-dark">
                    Checkliste
                  </a>
                </li>
              </ol>
            </nav>
          </aside>

          {/* 4. Hauptinhalt inkl. 5. Beispiele */}
          <article className="min-w-0">
            <BlogBlocks blocks={a.inhalt} />

            {/* 6. Checkliste */}
            <section id="checkliste" className="mt-14 scroll-mt-28 rounded-lg bg-sand p-6 sm:p-8">
              <h2 className="font-display text-2xl font-extrabold tracking-tight">{a.checkliste.titel}</h2>
              <p className="mt-1 text-muted">Zum Abhaken – oder als Vorlage für deinen Betrieb.</p>
              <div className="mt-5">
                <Abhakliste punkte={a.checkliste.punkte} />
              </div>
            </section>

            {a.rechtshinweis && <Rechtshinweis className="mt-8" />}

            {/* 7. Rechner / Vorlage */}
            {(a.werkzeuge.length > 0 || vorlagen.length > 0) && (
              <section className="mt-14">
                <h2 className="font-display text-2xl font-extrabold tracking-tight">Gleich selbst anwenden</h2>
                {a.werkzeuge.length > 0 && (
                  <div className="mt-5">
                    <WerkzeugLinks slugs={a.werkzeuge} />
                  </div>
                )}
                {vorlagen.length > 0 && (
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                    {vorlagen.map((v) => (
                      <li key={v.slug}>
                        <Link
                          href={vorlageHref(v.slug)}
                          className="group flex h-full items-start gap-3 rounded-lg border border-line bg-white p-4 transition hover:border-ink/30"
                        >
                          <Icon name={v.art === "Checkliste" ? "clipboard" : "file"} className="mt-0.5 size-5 shrink-0 text-moss" />
                          <span>
                            <span className="block font-semibold group-hover:text-signal-dark">{v.titel}</span>
                            <span className="mt-0.5 block text-sm text-muted">
                              {v.art} · kostenlos drucken
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {gewerke.length > 0 && (
              <p className="mt-10 flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold">Besonders relevant für:</span>
                {gewerke.map((g) => (
                  <Link
                    key={g.slug}
                    href={gewerkHref(g.slug)}
                    className="rounded-md bg-white px-2.5 py-1 font-medium ring-1 ring-line hover:ring-ink/40"
                  >
                    {g.titel}
                  </Link>
                ))}
              </p>
            )}

            {/* 8. Passende Macher-OS-Funktion */}
            <section className="mt-14 rounded-lg border border-line bg-white p-6 sm:p-8">
              <p className="text-sm font-semibold font-tagline uppercase tracking-[0.06em] text-signal-dark">In Macher OS</p>
              <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight">So hilft dir Macher OS dabei</h2>
              <p className="mt-2 text-muted">
                Wenn du das nicht mehr von Hand machen willst: Diese Funktionen nehmen dir die Arbeit ab.
              </p>
              <div className="mt-5">
                <FunktionLinks slugs={a.funktionen} />
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink href={cta.primary.href}>{cta.primary.label}</ButtonLink>
                <ButtonLink href={cta.secondary.href} variant="secondary">
                  {cta.secondary.label}
                </ButtonLink>
              </div>
            </section>
          </article>
        </div>
      </Container>

      {/* 9. Weitere Artikel */}
      <Section tone="sand">
        <SectionHeading title="Weitere Artikel" />
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {weitere.map((w) => (
            <li key={w.slug}>
              <Link
                href={blogHref(w.slug)}
                className="group flex h-full flex-col rounded-lg border border-line bg-white p-6 transition hover:border-ink/30"
              >
                <span className="text-xs font-semibold font-tagline uppercase tracking-wider text-muted">
                  {w.themen.map(themaTitel).join(" · ")}
                </span>
                <span className="mt-2 font-display text-lg font-bold leading-snug group-hover:text-signal-dark">{w.titel}</span>
                <span className="mt-auto pt-4 text-sm text-muted">{lesezeit(w)} Min. Lesezeit</span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* 10. CTA */}
      <FinalCta />
    </>
  );
}
