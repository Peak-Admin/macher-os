import Link from "next/link";
import { FinalCta } from "@/components/sections";
import {
  ArrowLink,
  Breadcrumbs,
  Container,
  Icon,
  IconTile,
  Section,
  SectionHeading,
  type IconName,
} from "@/components/ui";
import { WissenKarte, WissenLinkListe } from "@/components/wissen/WissenKarte";
import { WissenSuche } from "@/components/wissen/WissenSuche";
import { topGewerke, werkzeuge, werkzeugHref } from "@/content/registry";
import { beliebteInhalte, inhalteFuerGewerk, inhalteZuThema, neuesteInhalte, wissenIndex } from "@/content/wissen";
import { gewerkIcons, themen } from "@/content/wissen/themen";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: "Wissen für Handwerksbetriebe – Tipps, Vorlagen, Webinare",
  description:
    "Praxistipps, Webinare, Kurse, Vorlagen, Checklisten, Hilfe und kostenlose Rechner für Handwerksbetriebe – alles an einem Ort.",
  path: "/wissen",
});

type Bereich = {
  titel: string;
  text: string;
  icon: IconName;
  href: string;
  linkLabel: string;
  links: { label: string; href: string; text: string }[];
};

const bereiche: Bereich[] = [
  {
    titel: "Wissen",
    text: "Lernen aus der Praxis – für Chef und Team.",
    icon: "book",
    href: "/wissen/blog",
    linkLabel: "Zum Blog",
    links: [
      { label: "Blog", href: "/wissen/blog", text: "Praxistipps fürs Handwerk" },
      { label: "Webinare", href: "/wissen/webinare", text: "Live und als Aufzeichnung" },
      { label: "Macher Akademie", href: "/wissen/akademie", text: "Kurse für Chef und Team" },
      { label: "Vorlagen & Checklisten", href: "/wissen/vorlagen", text: "Direkt nutzbar" },
      { label: "Video-Anleitungen", href: "/wissen/videos", text: "Kommt bald" },
    ],
  },
  {
    titel: "Hilfe",
    text: "Schnell Antworten finden und loslegen.",
    icon: "chat",
    href: "/hilfe",
    linkLabel: "Zur Hilfe",
    links: [
      { label: "Schnellstart", href: "/hilfe/schnellstart", text: "In wenigen Minuten loslegen" },
      { label: "Hilfe-Center", href: "/hilfe-center", text: "Anleitungen und Antworten" },
      { label: "Kontakt & Support", href: "/hilfe/kontakt", text: "Persönliche Hilfe" },
      { label: "Daten übernehmen", href: "/hilfe/daten-uebernehmen", text: "Kunden, Mitarbeiter, Artikel" },
    ],
  },
  {
    titel: "Werkzeuge",
    text: "Kostenlose Rechner und Helfer.",
    icon: "calculator",
    href: "/werkzeuge",
    linkLabel: "Alle Werkzeuge",
    links: werkzeuge.slice(0, 4).map((w) => ({ label: w.titel, href: werkzeugHref(w.slug), text: w.kurz })),
  },
];

export default function WissenHubPage() {
  const beliebt = beliebteInhalte(8);
  const neu = neuesteInhalte(6);

  return (
    <>
      {/* 1. Hero mit Suche */}
      <section className="relative overflow-hidden border-b border-line bg-paper">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--color-line)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-line)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40 [mask-image:radial-gradient(ellipse_at_top_right,black_20%,transparent_70%)]"
        />
        <Container className="relative py-14 sm:py-20">
          <Breadcrumbs items={[{ label: "Wissen" }]} />
          <p className="mb-4 text-sm font-semibold font-tagline uppercase tracking-[0.06em] text-signal-dark">Wissen</p>
          <h1 className="max-w-4xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Wissen für einen besseren Handwerksbetrieb.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-pretty text-muted sm:text-xl">
            Tipps, Webinare, Vorlagen, Hilfe und kostenlose Werkzeuge.
          </p>
          <WissenSuche eintraege={wissenIndex} />
        </Container>
      </section>

      {/* 2. Drei Hauptbereiche */}
      <Section tone="white">
        <SectionHeading eyebrow="Alles an einem Ort" title="Wissen, Hilfe und Werkzeuge." />
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {bereiche.map((b) => (
            <div key={b.titel} className="flex flex-col rounded-lg border border-line bg-paper p-6">
              <div className="flex items-center gap-3">
                <IconTile name={b.icon} />
                <div>
                  <h3 className="font-display text-xl font-bold">{b.titel}</h3>
                  <p className="text-sm text-muted">{b.text}</p>
                </div>
              </div>
              <ul className="mt-5 grid gap-1">
                {b.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="group flex items-start justify-between gap-3 rounded-md px-3 py-2.5 hover:bg-white">
                      <span>
                        <span className="block font-semibold group-hover:text-signal-dark">{l.label}</span>
                        <span className="block text-sm text-muted">{l.text}</span>
                      </span>
                      <Icon name="arrow-right" className="mt-1 size-4 shrink-0 text-signal-dark" />
                    </Link>
                  </li>
                ))}
              </ul>
              <ArrowLink href={b.href} className="mt-auto pt-5">
                {b.linkLabel}
              </ArrowLink>
            </div>
          ))}
        </div>
      </Section>

      {/* 3. Beliebte Inhalte */}
      <Section>
        <SectionHeading
          eyebrow="Beliebt"
          title="Das lesen und nutzen andere Betriebe."
          intro="Artikel, Webinare, Vorlagen und Kurse – ein guter Einstieg."
        />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {beliebt.map((e) => (
            <li key={e.href}>
              <WissenKarte eintrag={e} />
            </li>
          ))}
        </ul>
      </Section>

      {/* 4. Nach Thema */}
      <Section tone="sand">
        <SectionHeading eyebrow="Nach Thema" title="Wähl dein Thema." />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {themen.map((t) => {
            const anzahl = inhalteZuThema(t.slug).length;
            return (
              <li key={t.slug}>
                <Link
                  href={`/wissen/blog?thema=${t.slug}`}
                  className="group flex h-full flex-col rounded-lg border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:border-ink/30"
                >
                  <IconTile name={t.icon} tone="sky" className="size-10" />
                  <h3 className="mt-4 font-display text-lg font-bold group-hover:text-signal-dark">{t.titel}</h3>
                  <p className="mt-1 text-sm text-muted">{t.text}</p>
                  <p className="mt-auto pt-4 text-sm font-semibold">
                    {anzahl} {anzahl === 1 ? "Inhalt" : "Inhalte"}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* 5. Nach Gewerk */}
      <Section tone="white">
        <SectionHeading
          eyebrow="Nach Gewerk"
          title="Wissen für dein Gewerk."
          intro="Inhalte, die zu deinem Handwerk passen – plus alles, was jeder Betrieb braucht."
        />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {topGewerke.map((g) => (
            <li key={g.slug} className="flex flex-col rounded-lg border border-line bg-paper p-5">
              <div className="flex items-center gap-3">
                <IconTile name={gewerkIcons[g.slug]} className="size-10" />
                <h3 className="font-display text-lg font-bold leading-tight">{g.kurz}</h3>
              </div>
              <div className="mt-3">
                <WissenLinkListe eintraege={inhalteFuerGewerk(g.slug, 3)} />
              </div>
              <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-3 text-sm">
                <Link href={`/wissen/vorlagen?gewerk=${g.slug}`} className="font-semibold hover:text-signal-dark">
                  Vorlagen
                </Link>
                <Link href={`/gewerke/${g.slug}`} className="font-semibold hover:text-signal-dark">
                  Gewerk-Seite
                </Link>
              </div>
            </li>
          ))}
        </ul>
        <ArrowLink href="/gewerke" className="mt-8">
          Alle Gewerke
        </ArrowLink>
      </Section>

      {/* 6. Neueste Inhalte */}
      <Section>
        <SectionHeading eyebrow="Neu" title="Neueste Inhalte." />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {neu.map((e) => (
            <li key={e.href}>
              <WissenKarte eintrag={e} />
            </li>
          ))}
        </ul>
      </Section>

      {/* 7. Final CTA */}
      <FinalCta
        title="Vom Wissen ins Machen."
        intro="Probier Macher OS mit deinen echten Aufträgen aus – kostenlos und ohne Kreditkarte."
      />
    </>
  );
}
