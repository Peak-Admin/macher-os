import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FinalCta } from "@/components/sections";
import { Breadcrumbs, CheckList, Container, Icon, IconTile, Section, SectionHeading, zone } from "@/components/ui";
import { MailtoFormular } from "@/components/wissen/MailtoFormular";
import { FunktionLinks } from "@/components/wissen/Teile";
import { WebinarKarte, WebinarStatusLabel } from "@/components/wissen/WebinarKarte";
import { topGewerke } from "@/content/registry";
import { blogHref, getArtikel } from "@/content/wissen/blog";
import { getWebinar, KONTAKT_EMAIL, sprecherRollen, webinare, webinarHref } from "@/content/wissen/webinare";
import { pageMeta } from "@/lib/metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return webinare.map((w) => ({ slug: w.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const w = getWebinar(slug);
  if (!w) return {};
  return pageMeta({ title: `Webinar: ${w.titel}`, description: w.kurz, path: webinarHref(w.slug) });
}

export default async function WebinarPage({ params }: Props) {
  const { slug } = await params;
  const w = getWebinar(slug);
  if (!w) notFound();

  const sprecher = sprecherRollen.find((s) => s.rolle === w.sprecher);
  const artikel = w.artikel.map(getArtikel).filter((a) => a !== undefined);
  const weitere = webinare.filter((x) => x.slug !== w.slug).slice(0, 3);
  const aufzeichnung = w.status === "aufzeichnung";
  const gewerkOptionen = topGewerke.map((g) => ({ slug: g.slug, titel: g.titel }));

  return (
    <>
      {/* 1. Thema + 2. Termin / Status */}
      <section {...zone("weiss")}>
        <Container className="py-12 sm:py-16">
          <Breadcrumbs
            items={[{ label: "Wissen", href: "/wissen" }, { label: "Webinare", href: "/wissen/webinare" }, { label: w.titel }]}
          />
          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-start">
            <div>
              <WebinarStatusLabel status={w.status} />
              <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-balance sm:text-5xl">
                {w.titel}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">{w.kurz}</p>
              <dl className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-line bg-white p-4">
                  <dt className="text-sm font-semibold font-tagline uppercase tracking-wider text-muted">Termin</dt>
                  <dd className="mt-1 font-semibold">{aufzeichnung ? "Als Aufzeichnung verfügbar" : "Termin folgt"}</dd>
                </div>
                <div className="rounded-lg border border-line bg-white p-4">
                  <dt className="text-sm font-semibold font-tagline uppercase tracking-wider text-muted">Dauer</dt>
                  <dd className="mt-1 font-semibold">ca. {w.dauer} Minuten</dd>
                </div>
                <div className="rounded-lg border border-line bg-white p-4">
                  <dt className="text-sm font-semibold font-tagline uppercase tracking-wider text-muted">Kosten</dt>
                  <dd className="mt-1 font-semibold">Kostenlos</dd>
                </div>
              </dl>
              <p className="mt-6 text-muted">
                <span className="font-semibold text-ink">Für wen:</span> {w.fuerWen}
              </p>
            </div>

            {/* 6. Anmeldung / Aufzeichnung */}
            <div id="anmeldung" className="scroll-mt-28 rounded-lg border border-line bg-white p-6 shadow-xl shadow-ink/5 sm:p-8">
              <h2 className="font-display text-2xl font-extrabold tracking-tight">
                {aufzeichnung ? "Aufzeichnung anfordern" : "Benachrichtigt mich"}
              </h2>
              <p className="mt-2 text-muted">
                {aufzeichnung
                  ? "Wir schicken dir den Link zur Aufzeichnung per E-Mail."
                  : "Der Termin steht noch nicht fest. Wir sagen dir Bescheid, sobald du dich anmelden kannst."}
              </p>
              <div className="mt-6">
                <MailtoFormular
                  email={KONTAKT_EMAIL}
                  betreff={
                    aufzeichnung ? `Aufzeichnung anfordern: ${w.titel}` : `Benachrichtigung zum Webinar: ${w.titel}`
                  }
                  einleitung={
                    aufzeichnung
                      ? `Hallo Macher-OS-Team, bitte schickt mir die Aufzeichnung des Webinars „${w.titel}“.`
                      : `Hallo Macher-OS-Team, bitte benachrichtigt mich, sobald es einen Termin für das Webinar „${w.titel}“ gibt.`
                  }
                  buttonLabel={aufzeichnung ? "Aufzeichnung anfordern" : "Benachrichtigt mich"}
                  gewerke={gewerkOptionen}
                />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 3. Nutzen + 4. Agenda */}
      <Section tone="white">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Nutzen" title="Das nimmst du mit." />
            <CheckList items={w.nutzen} className="mt-8" />
          </div>
          <div>
            <SectionHeading eyebrow="Agenda" title="Ablauf." />
            <ol className="mt-8 grid gap-3">
              {w.agenda.map((p, i) => (
                <li key={p.titel} className="flex gap-4 rounded-lg border border-line bg-paper p-4">
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-ink font-display text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <span>
                    <span className="block font-semibold">{p.titel}</span>
                    <span className="block text-sm text-muted">{p.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Section>

      {/* 5. Sprecher */}
      <Section tight>
        <div className="flex flex-col gap-4 rounded-lg border border-line bg-white p-6 sm:flex-row sm:items-center sm:p-8">
          <IconTile name="mic" tone="ink" />
          <div>
            <p className="text-sm font-semibold font-tagline uppercase tracking-[0.06em] text-signal-dark">Sprecher</p>
            <h2 className="mt-1 font-display text-xl font-bold">{w.sprecher}</h2>
            {sprecher && <p className="mt-1 text-muted">{sprecher.text}</p>}
          </div>
        </div>
      </Section>

      {/* 7. Relevante Funktionen + Artikel */}
      <Section tone="white">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <SectionHeading eyebrow="In Macher OS" title="Passende Funktionen." />
            <div className="mt-8">
              <FunktionLinks slugs={w.funktionen} />
            </div>
          </div>
          {artikel.length > 0 && (
            <div>
              <SectionHeading eyebrow="Zum Nachlesen" title="Passende Artikel." />
              <ul className="mt-8 grid gap-3">
                {artikel.map((a) => (
                  <li key={a.slug}>
                    <Link
                      href={blogHref(a.slug)}
                      className="group flex items-start gap-3 rounded-lg border border-line bg-paper p-4 hover:border-ink/30"
                    >
                      <Icon name="book" className="mt-0.5 size-5 shrink-0 text-sky" />
                      <span className="font-semibold group-hover:text-signal-dark">{a.titel}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Section>

      <Section tone="sand">
        <SectionHeading title="Weitere Webinare" />
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {weitere.map((x) => (
            <li key={x.slug}>
              <WebinarKarte webinar={x} />
            </li>
          ))}
        </ul>
      </Section>

      {/* 8. CTA */}
      <FinalCta />
    </>
  );
}
