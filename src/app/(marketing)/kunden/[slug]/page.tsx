import Link from "next/link";
import { notFound } from "next/navigation";
import { BeispielHinweis } from "@/components/kunden/BeispielHinweis";
import { FinalCta, KundenCard } from "@/components/sections";
import {
  ArrowLink,
  Badge,
  Breadcrumbs,
  ButtonLink,
  Container,
  Icon,
  IconTile,
  Section,
  SectionHeading,
} from "@/components/ui";
import { aehnlicheKunden, funktionTitel, gewerkVon, groessen, groesseVon, kundenStories } from "@/content/kunden";
import { funktionHref, gewerkHref, kunden, type KundeSlug } from "@/content/registry";
import { pageMeta } from "@/lib/metadata";
import { cta } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return kunden.map((k) => ({ slug: k.slug }));
}

function finde(slug: string) {
  const k = kunden.find((x) => x.slug === slug);
  return k ? { k, story: kundenStories[k.slug as KundeSlug] } : null;
}

export async function generateMetadata({ params }: PageProps<"/kunden/[slug]">) {
  const { slug } = await params;
  const data = finde(slug);
  if (!data) return {};
  return pageMeta({
    title: `${data.k.betrieb} (Beispiel) – Kundenstory`,
    description: `Beispielgeschichte: ${data.story.kurz}`,
    path: `/kunden/${data.k.slug}`,
  });
}

export default async function KundenStoryPage({ params }: PageProps<"/kunden/[slug]">) {
  const { slug } = await params;
  const data = finde(slug);
  if (!data) notFound();
  const { k, story } = data;
  const gewerk = gewerkVon(k.slug);
  const aehnlich = aehnlicheKunden(k.slug);
  const initialen = k.betrieb
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

  const steckbrief: { label: string; wert: React.ReactNode; icon: "wrench" | "map" | "users" | "route" }[] = [
    {
      label: "Gewerk",
      wert: (
        <Link href={gewerkHref(gewerk.slug)} className="underline decoration-signal decoration-2 underline-offset-4 hover:decoration-ink">
          {gewerk.titel}
        </Link>
      ),
      icon: "wrench",
    },
    { label: "Ort", wert: k.ort, icon: "map" },
    { label: "Team", wert: `${k.mitarbeiter} Mitarbeiter (${groessen[groesseVon(k.mitarbeiter)].label})`, icon: "users" },
    { label: "Arbeitsweise", wert: story.arbeitsweise, icon: "route" },
  ];

  return (
    <>
      {/* 1. Hero – Betrieb + Ergebnis */}
      <section className="relative overflow-hidden border-b border-line bg-paper">
        <Container className="relative py-12 sm:py-16">
          <Breadcrumbs items={[{ label: "Kunden", href: "/kunden" }, { label: k.betrieb }]} />
          <BeispielHinweis className="mb-10 max-w-3xl" />
          <div className="grid items-start gap-10 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <p className="mb-4 flex flex-wrap items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-signal-dark">
                Kundenstory <Badge>Beispiel</Badge>
              </p>
              <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
                {k.betrieb}: {k.ergebnis}.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-pretty text-muted sm:text-xl">{story.kurz}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href={cta.primary.href} size="lg">
                  {cta.primary.label}
                </ButtonLink>
                <ButtonLink href={cta.secondary.href} variant="secondary" size="lg">
                  {cta.secondary.label}
                </ButtonLink>
              </div>
            </div>
            <aside aria-label="Steckbrief" className="overflow-hidden rounded-xl border border-line bg-white">
              <div className="relative flex h-28 items-end bg-[linear-gradient(135deg,var(--color-ink),var(--color-ink-soft))] p-5">
                <div
                  aria-hidden
                  className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,color-mix(in_oklab,var(--color-signal)_45%,transparent),transparent_55%)]"
                />
                <span aria-hidden className="relative font-display text-4xl font-extrabold text-white/90">
                  {initialen}
                </span>
                <span className="absolute right-4 top-4">
                  <Badge>Beispielbetrieb</Badge>
                </span>
              </div>
              <dl className="divide-y divide-line">
                {steckbrief.map((s) => (
                  <div key={s.label} className="flex items-start gap-3 px-5 py-3.5">
                    <Icon name={s.icon} className="mt-0.5 size-4.5 shrink-0 text-signal-dark" />
                    <dt className="w-28 shrink-0 text-sm text-muted">{s.label}</dt>
                    <dd className="text-sm font-semibold">{s.wert}</dd>
                  </div>
                ))}
              </dl>
            </aside>
          </div>
        </Container>
      </section>

      {/* 2. Betrieb + 3. Vorher */}
      <Section tone="white">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Der Betrieb" title="Wer ist das?" />
            <p className="mt-5 text-lg leading-relaxed text-ink-soft">{story.betrieb}</p>
          </div>
          <div>
            <SectionHeading eyebrow="Vorher" title="Was war das Problem?" />
            <ul className="mt-6 space-y-3">
              {story.vorher.map((v) => (
                <li key={v} className="flex gap-3 rounded-xl bg-paper p-4 ring-1 ring-line">
                  <span className="mt-0.5 inline-flex size-5.5 shrink-0 items-center justify-center rounded-full bg-signal-soft text-signal-dark">
                    <Icon name="x" className="size-3.5" />
                  </span>
                  <span className="leading-relaxed">{v}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* 4. Warum + 5. Einrichtung */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Warum Macher OS?" title="Einfach starten, ohne Berater." />
            <p className="mt-5 text-lg leading-relaxed text-ink-soft">{story.warum}</p>
          </div>
          <div>
            <SectionHeading eyebrow="Einrichtung" title="So ging der Start." />
            <ol className="mt-6 space-y-3">
              {story.einrichtung.map((e, i) => (
                <li key={e} className="flex gap-4 rounded-xl bg-white p-4 ring-1 ring-line">
                  <span className="font-display text-sm font-extrabold text-signal-dark">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="leading-relaxed">{e}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Section>

      {/* 6. Nutzung */}
      <Section tone="white">
        <SectionHeading
          eyebrow="Nutzung"
          title="Diese Funktionen nutzt der Betrieb im Alltag."
          intro="Jeder sieht nur, was er für seine Arbeit braucht – im Büro und auf der Baustelle."
        />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {story.nutzung.map((n) => (
            <li key={n.funktion}>
              <Link
                href={funktionHref(n.funktion)}
                className="group flex h-full gap-4 rounded-xl border border-line bg-paper p-6 transition hover:-translate-y-0.5 hover:border-ink/30"
              >
                <IconTile name="check" tone="moss" />
                <span>
                  <span className="font-display text-lg font-bold">
                    {funktionTitel(n.funktion)}
                    <Icon
                      name="arrow-right"
                      className="ml-1.5 inline size-4 -translate-y-px text-signal-dark transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                  <span className="mt-1.5 block leading-relaxed text-muted">{n.text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* 7. Ergebnis + 8. Zitat */}
      <Section tone="ink">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-signal">Ergebnis</p>
            <h2 className="font-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl">
              {k.ergebnis}.
            </h2>
            <ul className="mt-8 space-y-3">
              {story.ergebnis.map((e) => (
                <li key={e} className="flex gap-3">
                  <Icon name="check" className="mt-1 size-4.5 shrink-0 text-signal" />
                  <span className="leading-relaxed text-white/85">{e}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-white/55">Beschreibung eines typischen Ablaufs – keine gemessenen Werte.</p>
          </div>
          <figure className="rounded-xl bg-white/5 p-8 ring-1 ring-white/10">
            <Badge tone="signal">Beispielzitat</Badge>
            <blockquote className="mt-5 font-display text-2xl font-bold leading-snug text-balance">
              „{story.zitat.text}“
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3 text-sm text-white/70">
              <span
                aria-hidden
                className="inline-flex size-10 items-center justify-center rounded-lg bg-signal/20 font-display font-extrabold text-signal"
              >
                {initialen}
              </span>
              <span>
                {story.zitat.rolle}, {k.betrieb}
                <span className="block text-white/50">Beispielzitat, keine echte Person</span>
              </span>
            </figcaption>
          </figure>
        </div>
      </Section>

      {/* 9. Verwendete Funktionen */}
      <Section tight>
        <div className="grid gap-8 lg:grid-cols-[1fr_2fr] lg:items-center">
          <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Verwendete Funktionen</h2>
          <div>
            <ul className="flex flex-wrap gap-2">
              {story.nutzung.map((n) => (
                <li key={n.funktion}>
                  <Link
                    href={funktionHref(n.funktion)}
                    className="inline-flex rounded-md bg-white px-3 py-1.5 text-sm font-semibold ring-1 ring-line transition hover:ring-ink/40"
                  >
                    {funktionTitel(n.funktion)}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
              <ArrowLink href={gewerkHref(gewerk.slug)}>Macher OS für {gewerk.kurz}</ArrowLink>
              <ArrowLink href="/funktionen">Alle Funktionen</ArrowLink>
            </div>
          </div>
        </div>
      </Section>

      {/* 10. Ähnliche Kunden */}
      <Section tone="white">
        <SectionHeading eyebrow="Weitere Geschichten" title="Ähnliche Betriebe" />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {aehnlich.map((s) => (
            <li key={s} className="flex [&>a]:w-full">
              <KundenCard slug={s} />
            </li>
          ))}
        </ul>
        <ArrowLink href="/kunden" className="mt-8">
          Alle Kunden ansehen
        </ArrowLink>
      </Section>

      {/* 11. CTA */}
      <FinalCta
        title="So kann es in deinem Betrieb auch laufen."
        intro="Starte kostenlos und richte Macher OS in wenigen Minuten für dein Gewerk ein."
      />
    </>
  );
}
