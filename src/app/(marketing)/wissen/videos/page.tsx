import Link from "next/link";
import { FinalCta, PageHero } from "@/components/sections";
import { Faq, FaqJsonLd, Icon, IconTile, Section, SectionHeading } from "@/components/ui";
import { videoBisDahin, videoFaq, videoStatus, videoThemaHref, videoThemen } from "@/content/wissen/videos";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: "Video-Anleitungen für Handwerk OS",
  description:
    "Kurze Video-Anleitungen zu den wichtigsten Abläufen in Handwerk OS sind in Arbeit. Hier siehst du die geplanten Themen und wo du bis dahin Hilfe findest.",
  path: "/wissen/videos",
});

function StatusKommtBald() {
  return (
    <span className="inline-flex items-center gap-2 rounded bg-warning-soft px-3 py-1 text-sm font-semibold text-warning">
      <Icon name="clock" className="size-4 shrink-0" />
      {videoStatus}
    </span>
  );
}

export default function VideosPage() {
  return (
    <>
      {/* 1. Hero mit ehrlichem Status */}
      <PageHero
        breadcrumbs={[{ label: "Wissen", href: "/wissen" }, { label: "Video-Anleitungen" }]}
        eyebrow="Video-Anleitungen"
        title="Handwerk OS in kurzen Videos."
        intro="Wir drehen gerade kurze Anleitungen zu den Abläufen, die du jeden Tag brauchst. Noch ist kein Video fertig – hier siehst du, was kommt."
        actions="none"
      >
        <div className="mt-6">
          <StatusKommtBald />
        </div>
      </PageHero>

      {/* 2. Geplante Themen */}
      <Section tone="white">
        <SectionHeading
          eyebrow="Geplant"
          title="Diese Themen kommen zuerst."
          intro="Die Reihe folgt den Kernabläufen im Betrieb. Bis ein Video da ist, zeigt dir die Funktionsseite, wie es geht."
        />
        <ul className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {videoThemen.map((t) => (
            <li key={t.titel} className="flex flex-col rounded-xl border border-line bg-paper p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <IconTile name={t.icon} />
                <StatusKommtBald />
              </div>
              <h3 className="mt-4 font-display text-xl font-bold">{t.titel}</h3>
              <p className="mt-2 text-muted">{t.text}</p>
              <Link
                href={videoThemaHref(t)}
                className="mt-auto inline-flex items-center gap-2 pt-4 font-semibold text-signal-dark hover:underline"
              >
                Funktion ansehen: {t.funktionLabel}
                <Icon name="arrow-right" className="size-4 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* 3. Bis dahin */}
      <Section>
        <SectionHeading
          eyebrow="Bis dahin"
          title="Hier bekommst du schon heute Hilfe."
          intro="Anleitungen zum Lesen, ein schneller Einstieg und Beispiele zum Durchklicken."
        />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {videoBisDahin.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="group flex h-full flex-col rounded-xl border border-line bg-white p-5 transition hover:border-ink/30"
              >
                <IconTile name={l.icon} tone="sky" className="size-10" />
                <h3 className="mt-4 font-display text-lg font-bold group-hover:text-signal-dark">{l.titel}</h3>
                <p className="mt-1 text-muted">{l.text}</p>
                <span className="mt-auto inline-flex items-center gap-2 pt-4 font-semibold text-signal-dark">
                  Öffnen
                  <Icon name="arrow-right" className="size-4 shrink-0" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* 4. FAQ */}
      <Section tone="white" containerSize="narrow">
        <SectionHeading title="Fragen zu den Video-Anleitungen" />
        <div className="mt-8">
          <Faq items={videoFaq} />
        </div>
        <FaqJsonLd items={videoFaq} />
      </Section>

      {/* 5. CTA */}
      <FinalCta
        title="Lieber gleich selbst ausprobieren?"
        intro="Teste Handwerk OS kostenlos mit deinen eigenen Aufträgen – oder schau dir zuerst die Demo an."
      />
    </>
  );
}
