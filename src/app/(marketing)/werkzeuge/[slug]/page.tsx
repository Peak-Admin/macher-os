import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FinalCta } from "@/components/sections";
import {
  ArrowLink,
  Breadcrumbs,
  Card,
  Container,
  Faq,
  FaqJsonLd,
  Icon,
  IconTile,
  Section,
  SectionHeading,
  zone,
} from "@/components/ui";
import { Druckstil } from "@/components/werkzeuge/Druckstil";
import { Rechner } from "@/components/werkzeuge/Rechner";
import { WerkzeugKarte } from "@/components/werkzeuge/WerkzeugKarte";
import { funktionen, funktionHref, werkzeuge, type WerkzeugSlug } from "@/content/registry";
import { beispiele } from "@/content/werkzeuge/beispiele";
import { werkzeugInhalte } from "@/content/werkzeuge/inhalte";
import { pageMeta } from "@/lib/metadata";
import { site } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return werkzeuge.map((w) => ({ slug: w.slug }));
}

type Props = { params: Promise<{ slug: string }> };

function finde(slug: string) {
  const werkzeug = werkzeuge.find((w) => w.slug === slug);
  if (!werkzeug) return null;
  return { werkzeug, inhalt: werkzeugInhalte[werkzeug.slug as WerkzeugSlug] };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const daten = finde(slug);
  if (!daten) return {};
  return pageMeta({
    title: daten.inhalt.seoTitel,
    description: daten.inhalt.beschreibung,
    path: `/werkzeuge/${slug}`,
  });
}

export default async function WerkzeugSeite({ params }: Props) {
  const { slug } = await params;
  const daten = finde(slug);
  if (!daten) notFound();
  const { werkzeug, inhalt } = daten;
  const beispiel = beispiele[werkzeug.slug]();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: werkzeug.titel,
    url: `${site.url}/werkzeuge/${werkzeug.slug}`,
    description: inhalt.beschreibung,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Browser",
    inLanguage: "de-DE",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    publisher: { "@type": "Organization", name: site.name, url: site.url },
  };

  return (
    <>
      <Druckstil />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      {/* 1.–3. Headline, Rechner, Ergebnis – sofort sichtbar */}
      <section {...zone("weiss")}>
        <Container className="pb-14 pt-8 sm:pb-20 sm:pt-10">
          <Breadcrumbs items={[{ label: "Werkzeuge", href: "/werkzeuge" }, { label: werkzeug.titel }]} />
          <div className="mb-8 max-w-3xl print:hidden">
            <p className="mb-3 text-sm font-semibold font-tagline uppercase tracking-[0.06em] text-signal-dark">
              Kostenloser Rechner · ohne Anmeldung
            </p>
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-balance sm:text-5xl">
              {inhalt.h1}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-pretty text-muted">{inhalt.intro}</p>
          </div>
          <Rechner slug={werkzeug.slug} />
          <p className="mt-4 text-sm text-muted print:hidden">{inhalt.hinweis}</p>
        </Container>
      </section>

      {/* 4. Kurze Erklärung */}
      <Section tone="white">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading eyebrow="So wird gerechnet" title="Die Rechnung – Schritt für Schritt." />
            <div className="mt-6 grid gap-4 text-lg leading-relaxed text-muted">
              {inhalt.erklaerung.absaetze.map((a) => (
                <p key={a}>{a}</p>
              ))}
            </div>
          </div>
          <div className="self-start rounded-2xl border border-line bg-paper p-6 sm:p-8">
            <p className="mb-4 font-display text-lg font-bold">Die Formel</p>
            <ol className="grid gap-3">
              {inhalt.erklaerung.formel.map((zeile, i) => (
                <li key={zeile} className="flex gap-3">
                  <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-ink font-display text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <code className="pt-0.5 font-sans text-[0.95rem] font-semibold leading-relaxed">{zeile}</code>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Section>

      {/* 5. Beispiel mit echten Zahlen */}
      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
          <div>
            <SectionHeading eyebrow="Beispiel" title="Mit echten Zahlen durchgerechnet." intro={inhalt.beispielIntro} />
            <p className="mt-6 text-muted">
              Die Werte im Rechner oben sind genau dieses Beispiel. Ändere sie einfach auf deine Zahlen.
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-line bg-white">
            <table className="w-full text-left">
              <caption className="sr-only">Beispielrechnung {werkzeug.titel}</caption>
              <thead className="bg-sand text-xs font-tagline uppercase tracking-wider text-muted">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Schritt</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">Betrag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {beispiel.zeilen.map((z) => (
                  <tr key={z.label} className={z.betont ? "bg-paper" : ""}>
                    <th scope="row" className={`px-5 py-3 align-top ${z.betont ? "font-bold" : "font-medium"}`}>
                      {z.label}
                      {z.rechnung && <span className="mt-0.5 block text-sm font-normal text-muted">{z.rechnung}</span>}
                    </th>
                    <td
                      className={`whitespace-nowrap px-5 py-3 text-right align-top tabular-nums ${
                        z.betont ? "font-display text-lg font-bold" : "font-semibold"
                      }`}
                    >
                      {z.wert}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="flex gap-3 border-t border-line bg-signal-soft px-5 py-4 text-[0.95rem] font-medium">
              <Icon name="spark" className="mt-0.5 size-5 shrink-0 text-signal-dark" />
              {beispiel.fazit}
            </p>
          </div>
        </div>
      </Section>

      {/* 6. Ergebnis speichern / senden – Hinweis */}
      <Section tone="sand" tight>
        <div className="grid items-center gap-6 md:grid-cols-[auto_1fr_auto]">
          <IconTile name="download" className="size-12" />
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight">Ergebnis behalten oder weitergeben.</h2>
            <p className="mt-1 text-muted">
              Kopier die Zusammenfassung, druck sie als PDF oder schick sie dir per E-Mail – direkt unter dem Ergebnis.
              Deine Zahlen bleiben in deinem Browser.
            </p>
          </div>
          <a
            href="#inhalt"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-white px-5 font-semibold text-signal-dark ring-1 ring-inset ring-line-dark hover:bg-signal-soft"
          >
            Zum Rechner <Icon name="arrow-right" className="size-4 -rotate-90" />
          </a>
        </div>
      </Section>

      {/* 7. Passende Macher-OS-Funktion */}
      <Section tone="white">
        <SectionHeading
          eyebrow="In Macher OS"
          title="Nie wieder neu rechnen."
          intro="In Macher OS hinterlegst du deine Zahlen einmal. Danach rechnet jedes Angebot und jeder Auftrag automatisch damit."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {inhalt.funktionen.map((fn) => {
            const titel = funktionen.find((x) => x.slug === fn.slug)?.titel ?? fn.slug;
            return (
              <Card key={fn.slug} title={titel} href={funktionHref(fn.slug)} eyebrow="Funktion">
                {fn.text}
              </Card>
            );
          })}
        </div>
        <ArrowLink href="/funktionen" className="mt-8">
          Alle Funktionen ansehen
        </ArrowLink>
      </Section>

      {/* Wissen + weitere Rechner */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
          <div>
            <SectionHeading eyebrow="Wissen" title="Mehr dazu im Blog." as="h2" />
            <ul className="mt-6 grid gap-2">
              {inhalt.blogThemen.map((t) => (
                <li key={t}>
                  <Link
                    href="/wissen/blog"
                    className="group flex items-center justify-between gap-3 rounded-lg bg-white px-4 py-3 font-semibold ring-1 ring-line transition hover:ring-ink/40"
                  >
                    <span className="flex items-center gap-3">
                      <Icon name="book" className="size-4.5 shrink-0 text-sky" />
                      {t}
                    </span>
                    <Icon name="arrow-right" className="size-4 shrink-0 text-signal-dark transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
            <ArrowLink href="/wissen/vorlagen" className="mt-6">
              Vorlagen und Checklisten
            </ArrowLink>
          </div>
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight">Weitere Rechner</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {inhalt.verwandt.map((v) => (
                <WerkzeugKarte key={v} slug={v} />
              ))}
            </div>
            <ArrowLink href="/werkzeuge" className="mt-6">
              Alle Werkzeuge ansehen
            </ArrowLink>
          </div>
        </div>
      </Section>

      {/* 8. FAQ */}
      <Section tone="white" containerSize="narrow">
        <SectionHeading title="Häufige Fragen" />
        <div className="mt-8">
          <Faq items={inhalt.faq} />
        </div>
        <FaqJsonLd items={inhalt.faq} />
      </Section>

      {/* 9. CTA */}
      <FinalCta
        title="Rechnen ist gut. Automatisch rechnen ist besser."
        intro="Mit Macher OS fließen deine Stundensätze, Aufschläge und Kosten direkt in Angebote, Aufträge und Auswertungen."
        primaryLabel="Macher OS kostenlos testen"
      />
    </>
  );
}
