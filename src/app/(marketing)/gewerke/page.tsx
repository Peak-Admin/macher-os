import Link from "next/link";
import { EinrichtungMock } from "@/components/gewerke/Mocks";
import { GewerkSuche } from "@/components/gewerke/GewerkSuche";
import { FinalCta, PageHero } from "@/components/sections";
import {
  ButtonLink,
  Faq,
  FaqJsonLd,
  Icon,
  IconTile,
  Section,
  SectionHeading,
  type FaqItem,
} from "@/components/ui";
import { anpassungen, clusterInhalte, gewerkSuchbegriffe, topGewerkInhalte } from "@/content/gewerke";
import { gewerkCluster, topGewerke } from "@/content/registry";
import { pageMeta } from "@/lib/metadata";
import { cta } from "@/lib/site";

export const metadata = pageMeta({
  title: "Handwerkersoftware für dein Gewerk",
  description:
    "Macher OS für Elektriker, SHK, Maler, Fliesenleger, Tischler, Dachdecker, Bau, GaLaBau und viele weitere Gewerke. Wähle dein Gewerk – Macher OS passt Abläufe, Begriffe und Vorlagen an.",
  path: "/gewerke",
});

const sucheBeispiele = ["Kälteanlagenbauer", "Parkettleger", "Zimmerer", "Glaser", "Konditor"];

const faq: FaqItem[] = [
  {
    frage: "Mein Gewerk steht nicht auf der Liste. Kann ich Macher OS trotzdem nutzen?",
    antwort:
      "Ja. Beim Start wählst du neben dem Gewerk auch deine Arbeitsweise – Kundendienst, Baustelle, Werkstatt, Fertigung oder Laden. Danach passt du Begriffe, Abläufe und Vorlagen an deinen Betrieb an.",
  },
  {
    frage: "Was passiert, wenn mein Betrieb mehrere Gewerke hat?",
    antwort:
      "Kein Problem. Viele Betriebe machen zum Beispiel Sanitär und Elektro oder Maler und Bodenbeläge. Du wählst ein Hauptgewerk und ergänzt Auftragsarten, Vorlagen und Qualifikationen aus den anderen.",
  },
  {
    frage: "Kann ich die Einrichtung später ändern?",
    antwort:
      "Ja. Begriffe, Abläufe, Vorlagen und Checklisten sind nur ein Startpunkt. Du kannst alles jederzeit ändern, ergänzen oder löschen.",
  },
  {
    frage: "Ist Macher OS für jedes Gewerk gleich teuer?",
    antwort: "Ja. Die Preise richten sich nach der Größe deines Betriebs, nicht nach dem Gewerk. Alle Pläne findest du auf der Preisseite.",
  },
];

export default function GewerkeHubPage() {
  const begriffe = gewerkSuchbegriffe();

  return (
    <>
      {/* 1. Hero */}
      <PageHero
        breadcrumbs={[{ label: "Gewerke" }]}
        eyebrow="Gewerke"
        title={
          <>
            Macher OS für <span className="text-signal-dark">dein Handwerk</span>.
          </>
        }
        intro="Wähle dein Gewerk. Macher OS passt Abläufe, Begriffe und Funktionen an deinen Betrieb an."
        actions={
          <>
            <ButtonLink href="#beliebte-gewerke" size="lg">
              Mein Gewerk ansehen
            </ButtonLink>
            <ButtonLink href={cta.secondary.href} variant="secondary" size="lg">
              {cta.secondary.label}
            </ButtonLink>
          </>
        }
        trust={false}
        visual={<EinrichtungMock />}
      />

      {/* 2. Beliebte Gewerke */}
      <Section tone="white" id="beliebte-gewerke" className="scroll-mt-20">
        <SectionHeading
          eyebrow="Beliebte Gewerke"
          title="Für deinen Betrieb gemacht."
          intro="Für diese Gewerke gibt es ausführliche Seiten mit Abläufen, Vorlagen und Beispielen."
        />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {topGewerke.map((g) => {
            const inhalt = topGewerkInhalte[g.slug];
            return (
              <li key={g.slug}>
                <Link
                  href={`/gewerke/${g.slug}`}
                  className="group flex h-full flex-col rounded-lg border border-line bg-paper p-5 transition hover:-translate-y-0.5 hover:border-ink/30 hover:bg-white hover:shadow-lg hover:shadow-ink/5"
                >
                  <IconTile name={inhalt.icon} className="mb-4" />
                  <span className="flex items-center gap-1.5 font-display text-lg font-bold leading-snug">
                    {g.titel}
                    <Icon
                      name="arrow-right"
                      className="size-4 shrink-0 text-signal-dark transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                  <span className="mt-2 text-[0.95rem] leading-relaxed text-muted">{inhalt.teaser}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* 3. Alle Gewerk-Cluster */}
      <Section>
        <SectionHeading
          eyebrow="Alle Gewerke"
          title="Alle Bereiche im Überblick."
          intro="Jeder Bereich fasst Berufe zusammen, die ähnlich arbeiten."
        />
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {gewerkCluster.map((c) => {
            const inhalt = clusterInhalte[c.slug];
            return (
              <li key={c.slug}>
                <Link
                  href={`/gewerke/${c.slug}`}
                  className="group flex h-full gap-3 rounded-lg bg-white p-4 ring-1 ring-line transition hover:ring-ink/40"
                >
                  <IconTile name={inhalt.icon} tone="sky" className="size-10" />
                  <span className="min-w-0">
                    <span className="block font-display font-bold leading-snug">{c.titel}</span>
                    <span className="mt-1 block text-sm leading-snug text-muted">{inhalt.teaser}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* 4. Gewerk nicht gefunden? */}
      <Section tone="sand" id="gewerk-finden">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-start">
          <SectionHeading
            eyebrow="Gewerk nicht gefunden?"
            title="Sag uns, was dein Betrieb macht."
            intro="Gib deinen Beruf ein. Wir zeigen dir die passende Seite – auch wenn dein Gewerk keinen eigenen Eintrag hat."
          />
          <GewerkSuche begriffe={begriffe} beispiele={sucheBeispiele} />
        </div>
      </Section>

      {/* 5. Anpassungsprinzip */}
      <Section tone="white">
        <SectionHeading
          eyebrow="So passt sich Macher OS an"
          title="Eine Software. Für jedes Gewerk eingerichtet."
          intro="Du wählst dein Gewerk – Macher OS verändert, was du jeden Tag siehst. Hier ein Beispiel pro Bereich."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {anpassungen.map((a) => (
            <div key={a.bereich} className="flex flex-col rounded-lg border border-line bg-paper p-5">
              <div className="flex items-center gap-3">
                <IconTile name={a.icon} className="size-10" />
                <div>
                  <h3 className="font-display text-lg font-bold leading-tight">{a.bereich}</h3>
                  <p className="text-sm text-muted">{a.text}</p>
                </div>
              </div>
              <div className="mt-5 flex-1 space-y-2 text-sm">
                <p className="text-xs font-semibold font-tagline uppercase tracking-wider text-muted">Beispiel {a.gewerk}</p>
                <div className="rounded-md bg-white p-3 ring-1 ring-line">
                  <span className="block text-xs font-semibold text-muted">Ohne Anpassung</span>
                  <span className="text-muted line-through decoration-muted/40">{a.vorher}</span>
                </div>
                <div className="rounded-md bg-moss-soft p-3 ring-1 ring-moss/30">
                  <span className="block text-xs font-semibold text-moss">Für dein Gewerk</span>
                  <span className="font-semibold text-ink">{a.nachher}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section containerSize="narrow">
        <SectionHeading title="Häufige Fragen zu Gewerken" />
        <div className="mt-8">
          <Faq items={faq} />
        </div>
        <FaqJsonLd items={faq} />
      </Section>

      {/* 6. Final CTA */}
      <FinalCta
        title="Dein Gewerk. Deine Abläufe. Eine Software."
        intro="Wähle beim Start dein Gewerk – Macher OS richtet Begriffe, Vorlagen und Abläufe für dich ein."
        primaryLabel="Macher OS für meinen Betrieb einrichten"
      />
    </>
  );
}
