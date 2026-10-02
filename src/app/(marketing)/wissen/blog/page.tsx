import Link from "next/link";
import { Suspense } from "react";
import { FinalCta, PageHero } from "@/components/sections";
import { ArrowLink, Icon, IconTile, Section, SectionHeading } from "@/components/ui";
import { BlogFilter, BlogFilterMitParams, type BlogListenEintrag } from "@/components/wissen/BlogFilter";
import { WerkzeugLinks } from "@/components/wissen/Teile";
import { topGewerke, werkzeuge } from "@/content/registry";
import { blogArtikel, blogHref, lesezeit } from "@/content/wissen/blog";
import { formatDatum, gewerkIcons, themaTitel, themen } from "@/content/wissen/themen";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: "Blog – Praxistipps fürs Handwerk",
  description:
    "Praxistipps für Handwerksbetriebe: Stundensatz, Kalkulation, E-Rechnung, Baustellendokumentation, Mitarbeiter, Einsatzplanung, Digitalisierung und KI.",
  path: "/wissen/blog",
});

export default function BlogHubPage() {
  const liste: BlogListenEintrag[] = blogArtikel.map((a) => ({
    slug: a.slug,
    href: blogHref(a.slug),
    titel: a.titel,
    beschreibung: a.beschreibung,
    datum: a.datum,
    datumText: formatDatum(a.datum),
    lesezeit: lesezeit(a),
    themen: a.themen,
    themenText: a.themen.map(themaTitel),
    stichworte: [a.kurzantwort, ...a.inhalt.flatMap((b) => (b.typ === "h2" || b.typ === "h3" ? [b.text] : []))].join(" "),
  }));
  const themenOptionen = themen.map((t) => ({ slug: t.slug, titel: t.titel }));
  const beliebt = blogArtikel.filter((a) => a.beliebt).slice(0, 3);
  const neueste = blogArtikel.slice(0, 4);

  return (
    <>
      {/* 1. Hero */}
      <PageHero
        breadcrumbs={[{ label: "Wissen", href: "/wissen" }, { label: "Blog" }]}
        eyebrow="Blog"
        title="Praxistipps für deinen Handwerksbetrieb."
        intro="Ehrliche Antworten auf Fragen aus dem Alltag: Kalkulation, Rechnungen, Mitarbeiter, Planung und Digitalisierung. Erst helfen, dann verkaufen."
        actions="none"
      />

      {/* 2.–3. Suche und Themenfilter */}
      <Section tone="white" tight>
        <h2 className="sr-only">Alle Artikel</h2>
        <Suspense fallback={<BlogFilter artikel={liste} themen={themenOptionen} />}>
          <BlogFilterMitParams artikel={liste} themen={themenOptionen} />
        </Suspense>
      </Section>

      {/* 4. Beliebte Artikel */}
      <Section>
        <SectionHeading eyebrow="Beliebt" title="Meistgelesene Artikel." />
        <ol className="mt-10 grid gap-4 lg:grid-cols-3">
          {beliebt.map((a, i) => (
            <li key={a.slug}>
              <Link
                href={blogHref(a.slug)}
                className="group flex h-full gap-4 rounded-lg border border-line bg-white p-6 transition hover:border-ink/30"
              >
                <span className="font-display text-4xl font-black leading-none text-signal">{i + 1}</span>
                <span>
                  <span className="block font-display text-lg font-bold leading-snug group-hover:text-signal-dark">
                    {a.titel}
                  </span>
                  <span className="mt-2 block text-sm text-muted">{lesezeit(a)} Min. Lesezeit</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </Section>

      {/* 5. Neueste Artikel */}
      <Section tone="white">
        <SectionHeading eyebrow="Neu" title="Neueste Artikel." />
        <ul className="mt-10 divide-y divide-line rounded-lg border border-line bg-white">
          {neueste.map((a) => (
            <li key={a.slug}>
              <Link
                href={blogHref(a.slug)}
                className="group flex flex-col gap-1 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
              >
                <span className="font-semibold group-hover:text-signal-dark">{a.titel}</span>
                <time dateTime={a.datum} className="shrink-0 text-sm text-muted">
                  {formatDatum(a.datum)}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* 6. Nach Gewerk */}
      <Section tone="sand">
        <SectionHeading
          eyebrow="Nach Gewerk"
          title="Artikel für dein Gewerk."
          intro="Die meisten Themen betreffen jeden Betrieb. Diese Artikel passen besonders gut zu deinem Gewerk."
        />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {topGewerke.map((g) => {
            const passend = blogArtikel.filter((a) => (a.gewerke as readonly string[]).includes(g.slug));
            const liste = (passend.length > 0 ? passend : blogArtikel.filter((a) => a.beliebt)).slice(0, 3);
            return (
              <li key={g.slug} className="rounded-lg border border-line bg-white p-5">
                <div className="flex items-center gap-3">
                  <IconTile name={gewerkIcons[g.slug]} className="size-10" />
                  <h3 className="font-display text-lg font-bold">{g.kurz}</h3>
                </div>
                <ul className="mt-3 grid gap-2 text-[0.95rem]">
                  {liste.map((a) => (
                    <li key={a.slug}>
                      <Link href={blogHref(a.slug)} className="flex gap-2 hover:text-signal-dark">
                        <Icon name="book" className="mt-1 size-4 shrink-0 text-muted" />
                        <span className="leading-snug">{a.titel}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href={`/gewerke/${g.slug}`} className="mt-4 inline-block text-sm font-semibold hover:text-signal-dark">
                  Zur Gewerk-Seite →
                </Link>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* 7. Passende Werkzeuge */}
      <Section tone="white">
        <SectionHeading
          eyebrow="Werkzeuge"
          title="Gleich ausrechnen."
          intro="Kostenlose Rechner zu den Themen im Blog – ohne Anmeldung."
        />
        <div className="mt-10">
          <WerkzeugLinks slugs={werkzeuge.map((w) => w.slug)} />
        </div>
        <ArrowLink href="/werkzeuge" className="mt-8">
          Alle Werkzeuge ansehen
        </ArrowLink>
      </Section>

      {/* 8. CTA */}
      <FinalCta />
    </>
  );
}
