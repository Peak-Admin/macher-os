import Link from "next/link";
import { FinalCta, Flow, KundenCard, PageHero } from "@/components/sections";
import {
  ArrowLink,
  Badge,
  Card,
  CheckList,
  Faq,
  FaqJsonLd,
  Icon,
  IconTile,
  Section,
  SectionHeading,
  type IconName,
} from "@/components/ui";
import { topGewerkInhalte } from "@/content/gewerke";
import { kunden, topGewerke, werkzeuge, type TopGewerkSlug } from "@/content/registry";
import { ChipLink, EinrichtungsListe, FunktionLink, funktionTitel } from "./Bausteine";
import { GewerkPhoneMock, GewerkTagMock } from "./Mocks";

const auftragIcons: IconName[] = ["wrench", "clipboard", "calendar", "bolt", "warehouse", "layers"];

export function TopGewerkSeite({ slug }: { slug: TopGewerkSlug }) {
  const g = topGewerkInhalte[slug];
  const reg = topGewerke.find((x) => x.slug === slug)!;
  const kunde = kunden.find((k) => k.slug === g.kunde)!;
  const kundeAusGewerk = kunde.gewerk === slug;
  const andereGewerke = topGewerke.filter((x) => x.slug !== slug);

  return (
    <>
      {/* 1. Hero */}
      <PageHero
        breadcrumbs={[{ label: "Gewerke", href: "/gewerke" }, { label: reg.titel }]}
        eyebrow={g.seoTitel}
        title={
          <>
            Macher OS für <span className="text-signal-dark">{g.name}</span>.
          </>
        }
        intro={g.hero.intro}
        visual={<GewerkTagMock betrieb={g.hero.betrieb} label={g.name} tag={g.hero.tag} hinweis={g.hero.hinweis} />}
      />

      {/* 2. Typischer Arbeitsablauf */}
      <Section tone="white">
        <SectionHeading
          eyebrow="Typischer Arbeitsablauf"
          title="So läuft es in deinem Betrieb."
          intro="Jedes Gewerk hat seine eigenen Abläufe. Macher OS bildet sie so ab, wie du arbeitest."
        />
        <div className="mt-10 grid gap-4">
          {g.ablaeufe.map((a) => (
            <div key={a.titel} className="grid gap-5 rounded-lg border border-line bg-paper p-6 lg:grid-cols-[18rem_1fr] lg:items-center">
              <div>
                <h3 className="font-display text-xl font-bold">{a.titel}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{a.text}</p>
              </div>
              <Flow items={a.schritte} />
            </div>
          ))}
        </div>
      </Section>

      {/* 3. Die größten Probleme */}
      <Section>
        <SectionHeading
          eyebrow="Kennst du das?"
          title="Wo es im Alltag hakt."
          intro="Das hören wir von Betrieben immer wieder. Keine Theorie – Alltag."
        />
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {g.probleme.map((p, i) => (
            <li key={p.titel} className="rounded-lg border border-line bg-white p-6">
              <span className="font-display text-sm font-extrabold text-signal-dark">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-2 font-display text-lg font-bold leading-snug">{p.titel}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{p.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* 4. So hilft Macher OS */}
      <Section tone="sand">
        <SectionHeading
          eyebrow="So hilft Macher OS"
          title="Für jedes Problem die passende Funktion."
          intro="Alles in einer Software – vom ersten Anruf bis zur bezahlten Rechnung."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {g.hilfe.map((h) => (
            <FunktionLink key={h.funktion} slug={h.funktion} text={h.text} />
          ))}
        </div>
      </Section>

      {/* 5. Für dein Gewerk eingerichtet */}
      <Section tone="white">
        <SectionHeading
          eyebrow={`Für ${reg.kurz} eingerichtet`}
          title="Vom ersten Tag an in deiner Sprache."
          intro={`Wählst du beim Start „${reg.titel}“, richtet Macher OS Begriffe, Vorlagen, Checklisten und Qualifikationen passend ein. Alles kannst du ändern und ergänzen.`}
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <EinrichtungsListe titel="Begriffe" icon="chat" items={g.eingerichtet.begriffe} />
          <EinrichtungsListe titel="Vorlagen" icon="file" items={g.eingerichtet.vorlagen} />
          <EinrichtungsListe titel="Checklisten" icon="clipboard" items={g.eingerichtet.checklisten} />
          <EinrichtungsListe titel="Qualifikationen" icon="award" items={g.eingerichtet.qualifikationen} />
        </div>
      </Section>

      {/* 6. Aufträge */}
      <Section>
        <SectionHeading
          eyebrow="Aufträge"
          title="Typische Auftragsarten – schon angelegt."
          intro="Jede Auftragsart hat ihre eigenen Schritte, Vorlagen und Checklisten."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {g.auftragsarten.map((a, i) => (
            <Card key={a.titel} title={a.titel} icon={auftragIcons[i % auftragIcons.length]}>
              {a.text}
            </Card>
          ))}
        </div>
        <ArrowLink href="/funktionen/auftraege" className="mt-8">
          Aufträge in Macher OS ansehen
        </ArrowLink>
      </Section>

      {/* 7. Planung */}
      <Section tone="white">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-start">
          <div>
            <SectionHeading eyebrow="Planung" title="Mitarbeiter, Material und Termine." intro={g.planung.intro} />
            <ArrowLink href="/funktionen/einsatzplanung" className="mt-8">
              Einsatzplanung ansehen
            </ArrowLink>
          </div>
          <div className="grid gap-3">
            {(
              [
                ["Mitarbeiter", "users", g.planung.mitarbeiter],
                ["Material", "box", g.planung.material],
                ["Termine", "calendar", g.planung.termine],
              ] as const
            ).map(([titel, icon, text]) => (
              <div key={titel} className="flex gap-4 rounded-lg border border-line bg-paper p-5">
                <IconTile name={icon} tone="sky" />
                <div>
                  <h3 className="font-display text-lg font-bold">{titel}</h3>
                  <p className="mt-1 leading-relaxed text-muted">{text}</p>
                </div>
              </div>
            ))}
            <div className="rounded-lg border border-signal/40 bg-signal-soft p-5">
              <p className="flex items-center gap-1.5 text-sm font-bold text-signal-dark">
                <Icon name="spark" className="size-4" /> Macher-Vorschlag
              </p>
              <p className="mt-1.5 font-semibold leading-snug">{g.planung.vorschlag}</p>
            </div>
          </div>
        </div>
      </Section>

      {/* 8. Mobile Baustelle / Außendienst */}
      <Section>
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <GewerkPhoneMock einsatz={g.mobil.einsatz} />
          </div>
          <div className="order-1 lg:order-2">
            <SectionHeading eyebrow="Auf der Baustelle und unterwegs" title="Alles Wichtige auf dem Handy." intro={g.mobil.intro} />
            <CheckList items={g.mobil.punkte} columns={2} className="mt-8" />
            <ArrowLink href="/app" className="mt-8">
              Zur App
            </ArrowLink>
          </div>
        </div>
      </Section>

      {/* 9. Macher erledigt automatisch */}
      <Section tone="ink">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-signal">Macher erledigt</p>
            <h2 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-balance sm:text-5xl">
              Büroarbeit, die sich von selbst erledigt.
            </h2>
            <p className="mt-5 max-w-md text-lg text-white/70">
              Macher bereitet vor, du entscheidest. Was Macher für {g.name} übernimmt:
            </p>
            <Link
              href="/funktionen/automatisch-erledigen"
              className="mt-8 inline-flex items-center gap-1.5 font-bold text-signal underline decoration-2 underline-offset-4 hover:text-white"
            >
              So arbeitet Macher <Icon name="arrow-right" className="size-4" />
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {g.automatisch.map((a) => (
              <li key={a} className="flex items-center gap-3 rounded-lg bg-white/5 p-4 ring-1 ring-white/10">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-signal/15 text-signal">
                  <Icon name="spark" className="size-5" />
                </span>
                <span className="font-semibold leading-snug">Macher {a}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* 10. Kundenstory */}
      <Section tone="sand">
        <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <SectionHeading
              eyebrow="Kundenstory"
              title={kundeAusGewerk ? "So arbeitet ein Betrieb wie deiner." : "So arbeitet ein Betrieb aus einem verwandten Gewerk."}
              intro={
                kundeAusGewerk
                  ? "Ein Beispiel aus dem Alltag – wie Macher OS in einem Betrieb aus deinem Gewerk eingesetzt wird."
                  : "Für dein Gewerk haben wir noch keine eigene Story. Die Abläufe in diesem Beispiel sind deinen aber sehr ähnlich."
              }
            />
            <p className="mt-4 flex items-center gap-2 text-sm text-muted">
              <Badge>Beispiel</Badge> Die Kundenstories auf dieser Website sind Beispiele.
            </p>
            <ArrowLink href="/kunden" className="mt-8">
              Alle Kundenstories ansehen
            </ArrowLink>
          </div>
          <div className="max-w-sm lg:justify-self-end">
            <KundenCard slug={kunde.slug} />
          </div>
        </div>
      </Section>

      {/* 11. Relevante Funktionen */}
      <Section tone="white" tight>
        <SectionHeading eyebrow="Relevante Funktionen" title="Das brauchen Betriebe wie deiner am meisten." />
        <ul className="mt-8 flex flex-wrap gap-2.5">
          {g.funktionen.map((f) => (
            <li key={f}>
              <ChipLink href={`/funktionen/${f}`}>{funktionTitel(f)}</ChipLink>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
          <ArrowLink href="/funktionen">Alle Funktionen ansehen</ArrowLink>
          <ArrowLink href="/preise">Preise ansehen</ArrowLink>
        </div>
      </Section>

      {/* 12. Passendes Wissen */}
      <Section>
        <SectionHeading eyebrow="Wissen & Werkzeuge" title="Passend für deinen Betrieb." />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card title="Blog" icon="book" iconTone="sky" href="/wissen/blog">
            {g.wissen.blog}
          </Card>
          <Card title="Vorlagen & Checklisten" icon="file" iconTone="sky" href="/wissen/vorlagen">
            {g.wissen.vorlagen}
          </Card>
          {g.wissen.werkzeuge.map((w) => {
            const wz = werkzeuge.find((x) => x.slug === w)!;
            return (
              <Card key={w} title={wz.titel} icon="calculator" iconTone="moss" href={`/werkzeuge/${w}`} eyebrow="Werkzeug">
                {wz.kurz}
              </Card>
            );
          })}
          <Card title="Webinare" icon="play" iconTone="sky" href="/wissen/webinare">
            Live und als Aufzeichnung – Praxiswissen für Chefs und Büro.
          </Card>
        </div>
      </Section>

      {/* 13. FAQ */}
      <Section tone="white" containerSize="narrow">
        <SectionHeading title={`Häufige Fragen: Macher OS für ${g.name}`} />
        <div className="mt-8">
          <Faq items={g.faq} />
        </div>
        <FaqJsonLd items={g.faq} />
      </Section>

      {/* Weitere Gewerke */}
      <Section tight>
        <p className="font-display text-lg font-bold">Andere Gewerke</p>
        <ul className="mt-4 flex flex-wrap gap-2.5">
          {andereGewerke.map((x) => (
            <li key={x.slug}>
              <ChipLink href={`/gewerke/${x.slug}`}>{x.titel}</ChipLink>
            </li>
          ))}
          <li>
            <ChipLink href="/gewerke">Alle Gewerke</ChipLink>
          </li>
        </ul>
      </Section>

      {/* 14. Final CTA */}
      <FinalCta
        title={`Macher OS für ${g.name}. Jetzt ausprobieren.`}
        intro={`Starte kostenlos. Macher OS richtet sich beim Start für ${reg.titel} ein – mit Begriffen, Vorlagen und Abläufen aus deinem Gewerk.`}
      />
    </>
  );
}
