import Link from "next/link";
import { notFound } from "next/navigation";
import { FinalCta } from "@/components/sections";
import { ArrowLink, Breadcrumbs, Container, Icon, Section } from "@/components/ui";
import { artikelVonKategorie, hilfeArtikel, hilfeKategorien, kategorieVon } from "@/content/hilfe/artikel";
import { funktionen } from "@/content/registry";
import { pageMeta } from "@/lib/metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return hilfeArtikel.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const artikel = hilfeArtikel.find((a) => a.slug === slug);
  if (!artikel) return {};
  return pageMeta({
    title: `${artikel.titel} – Hilfe-Center`,
    description: artikel.kurz,
    path: `/hilfe-center/${artikel.slug}`,
  });
}

export default async function HilfeArtikelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const artikel = hilfeArtikel.find((a) => a.slug === slug);
  if (!artikel) notFound();

  const kategorie = kategorieVon(artikel.kategorie);
  const verwandt = artikelVonKategorie(artikel.kategorie).filter((a) => a.slug !== artikel.slug);
  const funktion = artikel.funktion ? funktionen.find((f) => f.slug === artikel.funktion) : undefined;

  const howTo = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: artikel.titel,
    description: artikel.kurz,
    step: artikel.schritte.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.titel, text: s.text })),
  };

  return (
    <>
      <section className="border-b border-line bg-paper">
        <Container className="py-12 sm:py-16">
          <Breadcrumbs
            items={[
              { label: "Hilfe", href: "/hilfe" },
              { label: "Hilfe-Center", href: "/hilfe-center" },
              { label: kategorie.titel, href: `/hilfe-center#${kategorie.slug}` },
              { label: artikel.titel },
            ]}
          />
          <p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold font-tagline uppercase tracking-[0.06em] text-signal-dark">
            <Icon name={kategorie.icon} className="size-4" /> {kategorie.titel}
          </p>
          <h1 className="max-w-3xl font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-balance sm:text-5xl">
            {artikel.titel}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{artikel.einleitung}</p>
        </Container>
      </section>

      <Section tone="white" tight>
        <div className="grid gap-12 lg:grid-cols-[1fr_18rem]">
          <article>
            <h2 className="font-display text-2xl font-bold">So geht&apos;s</h2>
            <ol className="mt-6 space-y-4">
              {artikel.schritte.map((s, i) => (
                <li key={s.titel} className="flex gap-4 rounded-xl border border-line bg-paper p-5">
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-ink font-display text-sm font-extrabold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-bold leading-snug">{s.titel}</h3>
                    <p className="mt-1 leading-relaxed text-ink-soft">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>

            {artikel.tipp && (
              <div className="mt-8 flex gap-3 rounded-xl border border-moss/30 bg-moss-soft p-5">
                <Icon name="spark" className="mt-0.5 size-5 shrink-0 text-moss" />
                <p>
                  <b className="text-moss">Tipp:</b> {artikel.tipp}
                </p>
              </div>
            )}

            <div className="mt-10 rounded-xl border border-line p-5">
              <p className="font-semibold">Nicht weitergekommen?</p>
              <p className="mt-1 text-muted">Schreib uns kurz, wobei du hängst. Wir helfen dir persönlich weiter.</p>
              <ArrowLink href="/hilfe/kontakt" className="mt-4">
                Kontakt & Support
              </ArrowLink>
            </div>
          </article>

          <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
            {verwandt.length > 0 && (
              <div>
                <p className="text-sm font-bold font-tagline uppercase tracking-wider text-muted">Mehr zu {kategorie.titel}</p>
                <ul className="mt-3 space-y-2">
                  {verwandt.map((a) => (
                    <li key={a.slug}>
                      <Link href={`/hilfe-center/${a.slug}`} className="font-semibold hover:underline">
                        {a.titel}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {funktion && (
              <div className="rounded-xl bg-sand p-5">
                <p className="text-sm font-bold font-tagline uppercase tracking-wider text-muted">Passende Funktion</p>
                <ArrowLink href={`/funktionen/${funktion.slug}`} className="mt-2">
                  {funktion.titel}
                </ArrowLink>
              </div>
            )}
            <div>
              <p className="text-sm font-bold font-tagline uppercase tracking-wider text-muted">Alle Bereiche</p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {hilfeKategorien.map((k) => (
                  <li key={k.slug}>
                    <Link
                      href={`/hilfe-center#${k.slug}`}
                      className="inline-block rounded-md bg-paper px-2.5 py-1 text-sm ring-1 ring-line hover:ring-ink/40"
                    >
                      {k.titel}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </Section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howTo).replace(/</g, "\\u003c") }}
      />

      <FinalCta
        title="Ausprobieren ist der schnellste Weg."
        intro="Teste Macher OS kostenlos mit deinem eigenen Betrieb – ohne Kreditkarte."
      />
    </>
  );
}
