import { PageHero, Steps } from "@/components/sections";
import { ArrowLink, ButtonLink, CheckList, Icon, IconTile, Section, SectionHeading } from "@/components/ui";
import { AnliegenFormular } from "@/components/unternehmen/AnliegenFormular";
import { PARTNER_EMAIL, partnerGruppen, type Anliegen } from "@/content/unternehmen";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: "Partner",
  description:
    "Partner von Macher OS werden – der Software von Mission Mittelstand: für Steuerberater, Großhändler, Verbände, Berater, Hersteller und Integrationspartner, die Handwerksbetriebe begleiten.",
  path: "/partner",
});

const partnerAnliegen: Anliegen[] = partnerGruppen.map((p) => ({
  id: p.id,
  label: p.titel,
  beschreibung: p.text,
  icon: p.icon,
  email: PARTNER_EMAIL,
  platzhalter: "Wer seid ihr, mit wie vielen Handwerksbetrieben arbeitet ihr und was stellt ihr euch vor?",
}));

const vorteile = [
  "Handwerksbetriebe, die besser organisiert sind – und damit bessere Kunden für euch",
  "direkter Draht zu unserem Team",
  "gemeinsame Inhalte wie Webinare, Vorlagen und Checklisten",
  "früh mitreden, wenn neue Funktionen entstehen",
];

export default function PartnerPage() {
  return (
    <>
      <PageHero
        bild="seite/partner"
        eyebrow="Partner"
        title="Gemeinsam fürs Handwerk."
        intro="Ihr begleitet Handwerksbetriebe – als Steuerberater, Großhändler, Verband, Berater, Hersteller oder mit eurer eigenen Software? Dann lasst uns reden – mit Macher OS, dem Joint-Venture-Projekt von Mission Mittelstand."
        breadcrumbs={[{ label: "Partner" }]}
        actions={
          <>
            <ButtonLink href="#anfrage" size="lg">
              Partner werden
            </ButtonLink>
            <ButtonLink href="/ueber-uns" variant="secondary" size="lg">
              Über Macher OS
            </ButtonLink>
          </>
        }
        trust={false}
      />

      <Section tone="white">
        <SectionHeading eyebrow="Für wen" title="Wer gut zu uns passt." />
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {partnerGruppen.map((p) => (
            <div key={p.id} className="rounded-2xl border border-line bg-white p-6">
              <IconTile name={p.icon} />
              <h3 className="mt-4 font-display text-lg font-bold">{p.titel}</h3>
              <p className="mt-2 text-muted">{p.text}</p>
              <ul className="mt-4 space-y-1.5 text-sm">
                {p.nutzen.map((n) => (
                  <li key={n} className="flex items-start gap-2">
                    <Icon name="check" className="mt-0.5 size-4 shrink-0 text-moss" /> {n}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <SectionHeading
            eyebrow="Was ihr davon habt"
            title="Bessere Abläufe in den Betrieben, mit denen ihr arbeitet."
            intro="Wie eine Zusammenarbeit genau aussieht, besprechen wir mit jedem Partner einzeln."
          />
          <CheckList items={vorteile} className="self-center text-lg" />
        </div>
      </Section>

      <Section tone="white">
        <SectionHeading eyebrow="So geht's los" title="In drei Schritten zur Partnerschaft." />
        <Steps
          className="mt-10"
          steps={[
            { titel: "Anfrage schicken", text: "Kurz beschreiben, wer ihr seid und was ihr euch vorstellt." },
            { titel: "Gespräch", text: "Wir lernen uns kennen und schauen, was für beide Seiten sinnvoll ist." },
            { titel: "Loslegen", text: "Gemeinsam starten – zum Beispiel mit Testzugang und Unterlagen für euer Team." },
          ]}
        />
      </Section>

      <Section id="anfrage" className="scroll-mt-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <SectionHeading title="Partner werden" intro="Wählt eure Gruppe und schreibt uns ein paar Zeilen." />
            <p className="mt-6 text-muted">
              Oder direkt per E-Mail an{" "}
              <a href={`mailto:${PARTNER_EMAIL}`} className="font-semibold text-ink underline underline-offset-2">
                {PARTNER_EMAIL}
              </a>
              .
            </p>
            <ArrowLink href="/kontakt" className="mt-6">
              Anderes Anliegen? Zum Kontakt
            </ArrowLink>
          </div>
          <AnliegenFormular anliegen={partnerAnliegen} frage="Wer seid ihr?" betreffPrefix="Partneranfrage" />
        </div>
      </Section>
    </>
  );
}
