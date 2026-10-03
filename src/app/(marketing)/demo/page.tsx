import { app, cta } from "@/lib/site";
import { DemoExplorer } from "@/components/demo/DemoExplorer";
import { PageHero, TrustRow } from "@/components/sections";
import {
  ButtonLink,
  Container,
  Faq,
  FaqJsonLd,
  Fenster,
  Icon,
  Section,
  SectionHeading,
  zone,
  type FaqItem,
} from "@/components/ui";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: "Demo – Sieh Handwerk OS in Aktion",
  description:
    "Öffne das echte Handwerk OS mit einem Beispielbetrieb: Heute, Aufträge, Plan, Betrieb und Rechnungen – für Elektro, SHK, Tischler, Maler und allgemeine Betriebe.",
  path: "/demo",
});

const faq: FaqItem[] = [
  {
    frage: "Muss ich mich für die Demo anmelden?",
    antwort: "Nein. Die Demo öffnet sich ohne Anmeldung direkt im Browser. Alle Inhalte sind Beispieldaten.",
  },
  {
    frage: "Ist das das echte Programm?",
    antwort:
      "Ja. Die Demo ist das echte Handwerk OS mit einem Beispielbetrieb. Du kannst Aufträge anlegen, planen und Rechnungen schreiben. Die Beispieldaten bleiben getrennt von deinen echten Daten und verschwinden, sobald du deinen eigenen Betrieb einrichtest.",
  },
  {
    frage: "Was passiert mit meinen Daten, wenn ich Handwerk OS schon nutze?",
    antwort:
      "Sie werden während der Demo sicher zur Seite gelegt. Über den Hinweis „Spielwiese“ oben kommst du jederzeit zurück – deine Daten sind dann unverändert da.",
  },
  {
    frage: "Kann ich mir Handwerk OS auch persönlich zeigen lassen?",
    antwort:
      "Ja. Schreib uns über die Kontaktseite, dann zeigen wir dir Handwerk OS in Ruhe – passend zu deinem Gewerk und deinen Fragen.",
  },
];

export default function DemoPage() {
  return (
    <>
      <PageHero
        breadcrumbs={[{ label: "Demo" }]}
        eyebrow="Demo"
        title="Sieh Handwerk OS in Aktion."
        intro="Das echte Programm mit einem Beispielbetrieb. Ohne Anmeldung, ohne Verkaufsgespräch – getrennt von deinen echten Daten."
        actions={
          <>
            <ButtonLink href={app.demo()} size="lg">
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
      <section {...zone("dunkel")}>
        <Container className="grid gap-10 py-16 sm:py-20 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <h2 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-balance sm:text-5xl">
              Jetzt mit deinem eigenen Betrieb.
            </h2>
            <p className="mt-4 max-w-xl text-lg text-white/75">
              Teste Handwerk OS kostenlos – eingerichtet für dein Gewerk, mit deinen Leistungen.
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
          <div className="karte-dunkel p-6 text-center">
            <Fenster icon="chat" ton="dunkel" className="mb-5" />
            <p className="font-display text-lg font-bold">Lieber persönlich?</p>
            <p className="mt-2 text-white/70">
              Wir zeigen dir Handwerk OS passend zu deinem Gewerk und beantworten deine Fragen.
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
