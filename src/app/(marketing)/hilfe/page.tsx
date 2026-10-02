import Link from "next/link";
import { HilfeSuche } from "@/components/hilfe/HilfeSuche";
import { FinalCta, PageHero } from "@/components/sections";
import {
  ArrowLink,
  ButtonLink,
  Card,
  CheckList,
  Faq,
  FaqJsonLd,
  Icon,
  Section,
  SectionHeading,
} from "@/components/ui";
import { artikelVonKategorie, hilfeKategorien, hilfeSuchindex } from "@/content/hilfe/artikel";
import { uebernehmbareDaten } from "@/content/hilfe/daten-uebernehmen";
import { schnellstartSchritte } from "@/content/hilfe/schnellstart";
import { hilfeFaq, supportAnliegen } from "@/content/hilfe/support";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: "Hilfe",
  description:
    "Schnellstart, Anleitungen, Datenübernahme und persönlicher Support für Macher OS – alle Hilfe an einem Ort.",
  path: "/hilfe",
});

export default function HilfePage() {
  return (
    <>
      {/* 1. Hero + 2. Suche */}
      <PageHero
        eyebrow="Hilfe"
        title="Wie können wir dir helfen?"
        intro="Einrichten, Fragen klären, Daten mitnehmen. Hier findest du Antworten – und wenn nicht, sind wir persönlich für dich da."
        breadcrumbs={[{ label: "Hilfe" }]}
        actions="none"
      >
        <div className="mt-8 max-w-2xl">
          <HilfeSuche eintraege={hilfeSuchindex()} vorschlaege={["Rechnung", "Mitarbeiter", "Urlaub", "offline"]} />
        </div>
      </PageHero>

      {/* Schnellzugriff */}
      <Section tone="white" tight>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card title="Schnellstart" icon="bolt" href="/hilfe/schnellstart">
            In 7 Schritten startklar.
          </Card>
          <Card title="Hilfe-Center" icon="book" iconTone="sky" href="/hilfe-center">
            Anleitungen zu allen Bereichen.
          </Card>
          <Card title="Daten übernehmen" icon="download" iconTone="moss" href="/hilfe/daten-uebernehmen">
            Kunden, Mitarbeiter, Artikel mitnehmen.
          </Card>
          <Card title="Kontakt & Support" icon="chat" iconTone="ink" href="/hilfe/kontakt">
            Persönliche Hilfe von uns.
          </Card>
        </div>
      </Section>

      {/* 3. Schnellstart */}
      <Section>
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <SectionHeading
              eyebrow="Schnellstart"
              title="In wenigen Minuten startklar."
              intro="Sieben kurze Schritte – vom Konto bis zur ersten Planung. Du kannst jederzeit unterbrechen und später weitermachen."
            />
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/hilfe/schnellstart">Schnellstart ansehen</ButtonLink>
              <ButtonLink href="/signup" variant="secondary">
                Direkt kostenlos starten
              </ButtonLink>
            </div>
          </div>
          <ol className="grid gap-2.5">
            {schnellstartSchritte.map((s, i) => (
              <li key={s.id}>
                <Link
                  href={`/hilfe/schnellstart#${s.id}`}
                  className="group flex items-center gap-4 rounded-lg border border-line bg-white px-4 py-3 transition hover:border-ink/30"
                >
                  <span className="font-display text-sm font-extrabold text-signal-dark">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex-1 font-semibold">{s.titel}</span>
                  <span className="hidden text-sm text-muted sm:inline">{s.dauer}</span>
                  <Icon name="arrow-right" className="size-4 text-muted transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* 4. Häufige Fragen */}
      <Section tone="white" containerSize="narrow">
        <SectionHeading title="Häufige Fragen" />
        <div className="mt-8">
          <Faq items={hilfeFaq} />
        </div>
        <FaqJsonLd items={hilfeFaq} />
      </Section>

      {/* 5. Hilfe-Center */}
      <Section tone="sand">
        <SectionHeading
          eyebrow="Hilfe-Center"
          title="Anleitungen für jeden Bereich."
          intro="Schritt für Schritt erklärt – so, wie Macher OS gedacht ist."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {hilfeKategorien.map((k) => (
            <Link
              key={k.slug}
              href={`/hilfe-center#${k.slug}`}
              className="group rounded-xl border border-line bg-white p-4 transition hover:border-ink/30"
            >
              <Icon name={k.icon} className="size-5 text-signal-dark" />
              <p className="mt-3 font-display font-bold">{k.titel}</p>
              <p className="mt-1 text-sm text-muted">{artikelVonKategorie(k.slug).length} Anleitungen</p>
            </Link>
          ))}
        </div>
        <ArrowLink href="/hilfe-center" className="mt-8">
          Zum Hilfe-Center
        </ArrowLink>
      </Section>

      {/* 6. Daten übernehmen */}
      <Section tone="white">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Daten übernehmen"
              title="Nimm mit, was du schon hast."
              intro="Du musst nicht bei null anfangen. Bestehende Listen übernimmst du aus Excel, CSV oder deiner bisherigen Software."
            />
            <ArrowLink href="/hilfe/daten-uebernehmen" className="mt-8">
              So funktioniert die Übernahme
            </ArrowLink>
          </div>
          <div className="rounded-2xl border border-line bg-paper p-6 sm:p-8">
            <p className="font-display text-lg font-bold">Das kannst du übernehmen:</p>
            <CheckList items={uebernehmbareDaten.map((d) => d.titel)} columns={2} className="mt-5" />
          </div>
        </div>
      </Section>

      {/* 7. Kontakt & Support */}
      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <SectionHeading
            eyebrow="Kontakt & Support"
            title="Nicht gefunden, was du suchst?"
            intro="Schreib uns. Wähle dein Thema, dann landet deine Nachricht direkt bei den richtigen Leuten."
          />
          <div>
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {supportAnliegen.map((a) => (
                <li key={a.id} className="flex items-center gap-3 rounded-lg border border-line bg-white p-3.5">
                  <Icon name={a.icon} className="size-5 text-signal-dark" />
                  <span className="font-semibold">{a.label}</span>
                </li>
              ))}
            </ul>
            <ButtonLink href="/hilfe/kontakt" variant="dark" className="mt-6">
              Kontakt & Support <Icon name="arrow-right" className="size-4" />
            </ButtonLink>
          </div>
        </div>
      </Section>

      {/* 8. Systemstatus – bewusst ohne Werte */}
      <Section tone="white" tight>
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-dashed border-line bg-paper p-5">
          <p className="flex items-center gap-3">
            <Icon name="monitor" className="size-5 text-muted" />
            <span>
              <b>Systemstatus</b>
              <span className="text-muted"> – eine eigene Statusseite ist in Vorbereitung. Merkst du eine Störung, sag uns bitte Bescheid.</span>
            </span>
          </p>
          <ArrowLink href="/hilfe/kontakt">Störung melden</ArrowLink>
        </div>
      </Section>

      <FinalCta
        title="Am besten lernst du es beim Machen."
        intro="Starte kostenlos und probiere alles mit deinem eigenen Betrieb aus."
      />
    </>
  );
}
