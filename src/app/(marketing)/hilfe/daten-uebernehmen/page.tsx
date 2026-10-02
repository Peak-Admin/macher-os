import { FinalCta, PageHero, Steps } from "@/components/sections";
import {
  ArrowLink,
  ButtonLink,
  Card,
  CheckList,
  Faq,
  FaqJsonLd,
  Icon,
  IconTile,
  Section,
  SectionHeading,
} from "@/components/ui";
import { datenQuellen, uebernahmeAblauf, uebernahmeFaq, uebernehmbareDaten } from "@/content/hilfe/daten-uebernehmen";
import { cta } from "@/lib/site";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: "Daten übernehmen",
  description:
    "Kunden, Mitarbeiter, Artikel, offene Aufträge und Dokumente in Macher OS übernehmen – aus Excel, CSV, deiner bisherigen Software oder per Datanorm.",
  path: "/hilfe/daten-uebernehmen",
});

/** Stilisierte Import-Ansicht: Spalten zuordnen. */
function ImportMock() {
  const zeilen = [
    ["Firma / Name", "Kunde"],
    ["Strasse", "Straße"],
    ["PLZ", "PLZ"],
    ["Ort", "Ort"],
    ["Tel.", "Telefon"],
    ["Mail", "E-Mail"],
  ];
  return (
    <div
      role="img"
      aria-label="Import in Macher OS: Spalten aus einer Excel-Datei werden Feldern zugeordnet"
      className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-xl shadow-ink/10"
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <span className="flex items-center gap-2 font-display text-sm font-bold">
          <Icon name="download" className="size-4 text-signal-dark" /> Kunden importieren
        </span>
        <span className="rounded-md bg-sky-soft px-2 py-0.5 text-xs font-semibold text-sky">kunden.xlsx</span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 gap-y-2 p-4 text-sm">
        <span className="text-xs font-semibold font-tagline uppercase tracking-wider text-muted">Deine Spalte</span>
        <span />
        <span className="text-xs font-semibold font-tagline uppercase tracking-wider text-muted">Macher OS</span>
        {zeilen.map(([von, nach]) => (
          <div key={von} className="contents">
            <span className="rounded-md bg-paper px-2.5 py-1.5 ring-1 ring-line">{von}</span>
            <Icon name="arrow-right" className="size-4 text-muted" />
            <span className="flex items-center gap-1.5 rounded-md bg-moss-soft px-2.5 py-1.5 font-semibold text-moss">
              <Icon name="check" className="size-3.5" /> {nach}
            </span>
          </div>
        ))}
      </div>
      <div className="border-t border-line bg-signal-soft px-4 py-2.5 text-xs">
        <b>Vorschau:</b> 248 Kunden erkannt · 3 mögliche Doppelte zum Prüfen
      </div>
    </div>
  );
}

export default function DatenUebernehmenPage() {
  return (
    <>
      {/* 1. Hero */}
      <PageHero
        eyebrow="Daten übernehmen"
        title="Wechseln, ohne bei null anzufangen."
        intro="Kunden, Mitarbeiter, Artikel und offene Aufträge nimmst du mit. Aus Excel, aus deiner bisherigen Software oder direkt vom Großhändler."
        breadcrumbs={[{ label: "Hilfe", href: "/hilfe" }, { label: "Daten übernehmen" }]}
        visual={<ImportMock />}
        actions={
          <>
            <ButtonLink href={cta.primary.href} size="lg">
              {cta.primary.label}
            </ButtonLink>
            <ButtonLink href="/hilfe/kontakt" variant="secondary" size="lg">
              Hilfe bei der Übernahme
            </ButtonLink>
          </>
        }
      />

      {/* 2. Was übernommen werden kann */}
      <Section tone="white">
        <SectionHeading
          eyebrow="Was du mitnehmen kannst"
          title="Das Wichtigste ist schnell drin."
          intro="Du entscheidest, was du übernimmst – alles auf einmal oder Schritt für Schritt."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {uebernehmbareDaten.map((d) => (
            <Card key={d.titel} title={d.titel} icon={d.icon}>
              {d.text}
            </Card>
          ))}
        </div>
      </Section>

      {/* 3. Unterstützte Quellen */}
      <Section>
        <SectionHeading
          eyebrow="Woher die Daten kommen"
          title="Aus Tabelle, Software oder vom Großhändler."
          intro="Macher OS arbeitet mit gängigen Dateiformaten. Was deine bisherige Software exportieren kann, ist von Programm zu Programm verschieden – im Zweifel schauen wir uns eine Beispieldatei an."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {datenQuellen.map((q) => (
            <Card key={q.titel} title={q.titel} icon={q.icon} iconTone="sky">
              {q.text}
            </Card>
          ))}
        </div>
      </Section>

      {/* 4. Ablauf */}
      <Section tone="white">
        <SectionHeading eyebrow="Ablauf" title="So läuft die Übernahme." />
        <Steps steps={uebernahmeAblauf} className="mt-10" />
        <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
          <ArrowLink href="/hilfe-center/grosshaendler-daten">Artikel vom Großhändler übernehmen</ArrowLink>
          <ArrowLink href="/wechseln">Wechseln zu Macher OS</ArrowLink>
        </div>
      </Section>

      {/* 5. Automatische / persönliche Hilfe */}
      <Section>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-line bg-white p-8">
            <IconTile name="spark" tone="moss" />
            <h2 className="mt-5 font-display text-2xl font-extrabold">Selbst übernehmen</h2>
            <p className="mt-2 text-muted">Für die meisten Betriebe reicht das. Macher OS hilft automatisch mit:</p>
            <CheckList
              className="mt-5"
              items={[
                "erkennt Spalten und schlägt die Zuordnung vor",
                "findet doppelte Einträge",
                "zeigt vorher, was übernommen wird",
                "Import lässt sich rückgängig machen",
              ]}
            />
          </div>
          <div className="rounded-2xl bg-ink p-8 text-white">
            <IconTile name="users" tone="signal" />
            <h2 className="mt-5 font-display text-2xl font-extrabold">Mit persönlicher Hilfe</h2>
            <p className="mt-2 text-white/70">Viele Daten, alte Software oder einfach keine Zeit? Wir helfen dir beim Umstieg.</p>
            <ul className="mt-5 space-y-3">
              {[
                "gemeinsamer Blick auf deine Dateien",
                "Hilfe bei Export und Zuordnung",
                "Klärung vorab, was sinnvoll ist",
              ].map((p) => (
                <li key={p} className="flex items-center gap-2.5">
                  <Icon name="check" className="size-4 text-accent" /> {p}
                </li>
              ))}
            </ul>
            <ButtonLink href="/hilfe/kontakt" className="mt-7">
              Hilfe anfragen
            </ButtonLink>
          </div>
        </div>
      </Section>

      {/* 6. Datenschutz */}
      <Section tone="sand">
        <div className="grid items-center gap-10 lg:grid-cols-[auto_1fr]">
          <IconTile name="shield" tone="ink" />
          <div>
            <h2 className="font-display text-2xl font-extrabold sm:text-3xl">Deine Daten bleiben deine Daten.</h2>
            <p className="mt-3 max-w-3xl text-lg text-muted">
              Wir nutzen übernommene Daten nur, um sie in deinem Betrieb bereitzustellen. Wenn wir dir persönlich helfen,
              sehen wir uns Dateien nur mit deiner Zustimmung an. Du kannst jederzeit einen vollständigen Export
              herunterladen.
            </p>
            <ArrowLink href="/datenschutz" className="mt-5">
              Datenschutz bei Macher OS
            </ArrowLink>
          </div>
        </div>
      </Section>

      <Section tone="white" containerSize="narrow">
        <SectionHeading title="Fragen zur Übernahme" />
        <div className="mt-8">
          <Faq items={uebernahmeFaq} />
        </div>
        <FaqJsonLd items={uebernahmeFaq} />
      </Section>

      {/* 7. CTA */}
      <FinalCta
        title="Bring deinen Betrieb mit."
        intro="Starte kostenlos, lade deine erste Liste hoch und sieh selbst, wie schnell es geht."
      />
    </>
  );
}
