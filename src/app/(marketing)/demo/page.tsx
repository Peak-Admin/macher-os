import { cta } from "@/lib/site";
import { DemoExplorer } from "@/components/demo/DemoExplorer";
import { PageHero, TrustRow } from "@/components/sections";
import { ButtonLink, Container, Faq, FaqJsonLd, Icon, Section, SectionHeading, type FaqItem } from "@/components/ui";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: "Demo – Sieh Macher OS in Aktion",
  description:
    "Klick dich durch Macher OS: Heute, Aufträge, Plan, Betrieb und automatische Büroarbeit – mit Beispielen für Elektro, SHK, Tischler, Maler und allgemeine Betriebe.",
  path: "/demo",
});

const faq: FaqItem[] = [
  {
    frage: "Muss ich mich für die Demo anmelden?",
    antwort: "Nein. Die Demo auf dieser Seite kannst du ohne Anmeldung ausprobieren. Alle Inhalte sind Beispieldaten.",
  },
  {
    frage: "Ist das das echte Programm?",
    antwort:
      "Die Demo ist eine vereinfachte Ansicht, die zeigt, wie Macher OS aufgebaut ist. Wenn du alles selbst ausprobieren willst, teste Macher OS kostenlos mit deinem eigenen Betrieb.",
  },
  {
    frage: "Kann ich mir Macher OS auch persönlich zeigen lassen?",
    antwort:
      "Ja. Schreib uns über die Kontaktseite, dann zeigen wir dir Macher OS in Ruhe – passend zu deinem Gewerk und deinen Fragen.",
  },
];

export default function DemoPage() {
  return (
    <>
      <PageHero
        breadcrumbs={[{ label: "Demo" }]}
        eyebrow="Demo"
        title="Sieh Macher OS in Aktion."
        intro="Ohne Anmeldung, ohne Verkaufsgespräch. Wähle dein Gewerk und klick dich durch einen normalen Arbeitstag."
        actions={
          <>
            <ButtonLink href="#demo" size="lg">
              <Icon name="play" className="size-4" /> Demo starten
            </ButtonLink>
            <ButtonLink href="#tour" variant="secondary" size="lg">
              5-Minuten-Tour
            </ButtonLink>
          </>
        }
        trust={false}
      />

      <DemoExplorer />

      {/* CTA */}
      <section className="bg-ink text-white">
        <Container className="grid gap-10 py-16 sm:py-20 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <h2 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-balance sm:text-5xl">
              Jetzt mit deinem eigenen Betrieb.
            </h2>
            <p className="mt-4 max-w-xl text-lg text-white/75">
              Teste Macher OS kostenlos – eingerichtet für dein Gewerk, mit deinen Leistungen.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={cta.primary.href} size="lg">
                Selbst kostenlos testen
              </ButtonLink>
              <ButtonLink href="/kontakt" variant="light" size="lg">
                Persönliche Demo buchen
              </ButtonLink>
            </div>
            <TrustRow dark className="mt-6" />
          </div>
          <div className="karte-dunkel p-6">
            <p className="font-display text-lg font-bold">Lieber persönlich?</p>
            <p className="mt-2 text-white/70">
              Wir zeigen dir Macher OS passend zu deinem Gewerk und beantworten deine Fragen.
            </p>
          </div>
        </Container>
      </section>

      <Section containerSize="narrow">
        <SectionHeading title="Fragen zur Demo" />
        <div className="mt-8">
          <Faq items={faq} />
        </div>
        <FaqJsonLd items={faq} />
      </Section>
    </>
  );
}
