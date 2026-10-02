import { PageHero } from "@/components/sections";
import { ArrowLink, ButtonLink, Card, CheckList, Icon, Section, SectionHeading } from "@/components/ui";
import { KARRIERE_EMAIL, werte } from "@/content/unternehmen";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: "Karriere",
  description:
    "Arbeiten bei Macher OS, dem Joint-Venture-Projekt von Mission Mittelstand: Wir bauen Software für das Handwerk. Aktuell keine offenen Stellen – Initiativbewerbungen sind willkommen.",
  path: "/karriere",
});

const soArbeitenWir = [
  "Wir reden mit Handwerkern, bevor wir bauen – und danach wieder.",
  "Kleine Schritte, oft ausliefern, ehrlich nachbessern.",
  "Klare Sprache statt Fachchinesisch – im Produkt und im Team.",
  "Verantwortung für das Ganze, nicht nur für die eigene Aufgabe.",
];

export default function KarrierePage() {
  const betreff = encodeURIComponent("Initiativbewerbung");
  return (
    <>
      <PageHero
        eyebrow="Karriere"
        title="Bau mit uns Software fürs Handwerk."
        intro="Macher OS ist ein Joint-Venture-Projekt von Mission Mittelstand. Wir wollen Handwerksbetrieben die Büroarbeit abnehmen. Dafür suchen wir Leute, die Lust auf echte Probleme und einfache Lösungen haben."
        breadcrumbs={[{ label: "Karriere" }]}
        actions="none"
      />

      <Section tone="white">
        <SectionHeading eyebrow="Was uns wichtig ist" title="Unsere Werte." />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {werte.map((w) => (
            <Card key={w.titel} title={w.titel} icon={w.icon}>
              {w.text}
            </Card>
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <SectionHeading eyebrow="Wie wir arbeiten" title="Nah am Handwerk. Klar im Kopf." />
          <CheckList items={soArbeitenWir} className="self-center text-lg" />
        </div>
      </Section>

      <Section tone="white">
        <div className="rounded-2xl border border-line bg-paper p-8 sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div className="max-w-2xl">
              <p className="flex items-center gap-2 text-sm font-semibold font-tagline uppercase tracking-[0.06em] text-muted">
                <Icon name="inbox" className="size-4" /> Offene Stellen
              </p>
              <h2 className="mt-3 font-display text-2xl font-extrabold sm:text-3xl">
                Aktuell keine offenen Stellen – Initiativbewerbung willkommen.
              </h2>
              <p className="mt-3 text-muted">
                Du kommst aus dem Handwerk, aus der Softwareentwicklung, aus Gestaltung oder Kundenbetreuung und findest
                uns spannend? Erzähl uns, wer du bist und was du bei uns bewegen willst. Ein paar Zeilen reichen.
              </p>
            </div>
            <ButtonLink href={`mailto:${KARRIERE_EMAIL}?subject=${betreff}`} size="lg">
              Initiativ bewerben
            </ButtonLink>
          </div>
          <p className="mt-6 text-sm text-muted">
            E-Mail:{" "}
            <a href={`mailto:${KARRIERE_EMAIL}`} className="font-semibold text-ink underline underline-offset-2">
              {KARRIERE_EMAIL}
            </a>
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
          <ArrowLink href="/ueber-uns">Mehr über Macher OS</ArrowLink>
          <ArrowLink href="/kontakt">Andere Frage? Zum Kontakt</ArrowLink>
        </div>
      </Section>
    </>
  );
}
