import { ProductMock } from "@/components/mocks";
import { FinalCta, Flow, MissionMittelstand, MissionMittelstandFoto, PageHero } from "@/components/sections";
import { ArrowLink, ButtonLink, Card, Icon, Section, SectionHeading } from "@/components/ui";
import { KONTAKT_EMAIL, werte } from "@/content/unternehmen";
import { pageMeta } from "@/lib/metadata";
import { herausgeber } from "@/lib/site";

export const metadata = pageMeta({
  title: "Über uns",
  description:
    "Macher OS ist ein Joint-Venture-Projekt von Mission Mittelstand: ein Betriebssystem für Handwerksbetriebe, das Büroarbeit abnimmt. Einfach vorne. Vollständig hinten.",
  path: "/ueber-uns",
});

const probleme = [
  "Zettel im Auto, Fotos im privaten Handy",
  "Termine im Kopf vom Chef",
  "Angebote abends am Küchentisch",
  "drei Programme, die nicht miteinander reden",
  "Rechnungen, die Wochen liegen bleiben",
];

export default function UeberUnsPage() {
  return (
    <>
      <PageHero
        bild="seite/ueber-uns"
        eyebrow="Über Macher OS"
        title="Software von Mission Mittelstand. Gemacht fürs Handwerk."
        intro={`Macher OS ist ein Joint-Venture-Projekt von ${herausgeber.name}. Handwerker sollen machen, nicht verwalten – deshalb nimmt Macher OS so viel Büroarbeit ab wie möglich. Damit mehr Zeit für Kunden, Baustelle und Feierabend bleibt.`}
        breadcrumbs={[{ label: "Über uns" }]}
        actions="none"
      />

      {/* 1. Mission */}
      <Section tone="white">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold font-tagline uppercase tracking-[0.06em] text-signal-dark">Unsere Mission</p>
          <p className="mt-4 font-display text-3xl font-extrabold leading-[1.15] tracking-tight text-balance sm:text-4xl lg:text-5xl">
            Jeder Handwerksbetrieb soll so gut organisiert sein wie die besten – ohne dafür ein eigenes Büro aufbauen zu
            müssen.
          </p>
        </div>
      </Section>

      {/* 2. Warum Macher OS existiert */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Warum es uns gibt"
              title="Das Handwerk hat genug Arbeit. Büro sollte nicht dazugehören."
              intro="Die Auftragsbücher sind voll, die Leute knapp. Trotzdem verbringen Chefs und Büros viel Zeit mit Suchen, Abtippen und Hinterhertelefonieren."
            />
          </div>
          <div className="rounded-2xl border border-line bg-white p-6 sm:p-8">
            <p className="font-display text-lg font-bold">Was wir in vielen Betrieben sehen:</p>
            <ul className="mt-5 space-y-3">
              {probleme.map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <Icon name="x" className="mt-0.5 size-5 shrink-0 text-signal-dark" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 border-t border-line pt-5 text-muted">
              Macher OS hält alles an einem Ort zusammen – vom ersten Anruf bis zur bezahlten Rechnung.
            </p>
          </div>
        </div>
        <div className="mt-12">
          <Flow items={["Anfrage", "Angebot", "Termin", "Arbeit", "Rechnung", "Bezahlt"]} />
        </div>
      </Section>

      {/* 3. Produktphilosophie */}
      <Section tone="ink">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="mb-3 text-sm font-semibold font-tagline uppercase tracking-[0.06em] text-accent">Produktphilosophie</p>
            <h2 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
              Einfach vorne.
              <br />
              Vollständig hinten.
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="font-display text-lg font-bold">Einfach vorne</p>
                <p className="mt-2 text-white/70">
                  Jeder sieht nur, was er gerade braucht. Der Monteur seinen nächsten Einsatz, das Büro die offenen
                  Angebote, der Chef den Überblick.
                </p>
              </div>
              <div>
                <p className="font-display text-lg font-bold">Vollständig hinten</p>
                <p className="mt-2 text-white/70">
                  Im Hintergrund hängt alles zusammen. Was einmal erfasst ist, wird überall genutzt – und Macher erledigt
                  die Routine automatisch.
                </p>
              </div>
            </div>
          </div>
          <ProductMock />
        </div>
      </Section>

      {/* 4. Mission Mittelstand */}
      <MissionMittelstand
        id="mission-mittelstand"
        title="Hinter Macher OS steht Mission Mittelstand."
      />

      {/* 5. Team */}
      <Section>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <SectionHeading
            eyebrow="Team"
            title="Ein Team, das Betriebe von innen kennt."
            intro={`Macher OS entsteht gemeinsam mit ${herausgeber.name}. Das ist uns bei der Arbeit wichtig:`}
          />
          <MissionMittelstandFoto />
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {werte.map((w) => (
            <Card key={w.titel} title={w.titel} icon={w.icon}>
              {w.text}
            </Card>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
          <ArrowLink href="/karriere">Mitmachen? Zur Karriere-Seite</ArrowLink>
          <ArrowLink href="/neuigkeiten">Was ist neu in Macher OS?</ArrowLink>
        </div>
      </Section>

      {/* 6. Partner */}
      <Section tone="sand" tight>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-extrabold">Gemeinsam fürs Handwerk.</h2>
            <p className="mt-2 text-muted">
              Wir arbeiten gern mit Steuerberatern, Großhändlern, Verbänden und anderen zusammen, die Handwerksbetriebe
              begleiten.
            </p>
          </div>
          <ArrowLink href="/partner">Partner werden</ArrowLink>
        </div>
      </Section>

      {/* 7. Kontakt */}
      <Section tone="white">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
          <SectionHeading
            title="Lust auf ein Gespräch?"
            intro="Fragen, Ideen oder Kritik – schreib uns. Wir lernen am meisten von Leuten, die jeden Tag im Handwerk arbeiten."
          />
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/kontakt" variant="secondary">
              Kontakt aufnehmen
            </ButtonLink>
            <ButtonLink href={`mailto:${KONTAKT_EMAIL}`} variant="secondary">
              {KONTAKT_EMAIL}
            </ButtonLink>
          </div>
        </div>
      </Section>

      {/* 8. CTA */}
      <FinalCta />
    </>
  );
}
