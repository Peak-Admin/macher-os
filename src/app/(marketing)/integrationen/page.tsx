import Image from "next/image";
import { FinalCta, LogoWand, PageHero } from "@/components/sections";
import { ArrowLink, Faq, FaqJsonLd, IntegrationLogo, Section, SectionHeading, type FaqItem } from "@/components/ui";
import {
  STAND_LABEL,
  heuteZahl,
  integrationenDerSaeule,
  integrationenZahl,
  pipedreamLogo,
  saeulen,
  type Stand,
} from "@/content/integrationen";
import { pageMeta } from "@/lib/metadata";
import { GlasIcon } from "@/os/ui/glas";

export const metadata = pageMeta({
  title: "Integrationen – Gmail, Outlook, DATEV, GAEB, DATANORM und mehr",
  description:
    "Macher OS verbindet sich in vier Säulen: Macher Connect (Gmail, Outlook, Kalender, Lexware, Stripe), Format Engine (DATEV, XRechnung, GAEB, DATANORM), Universal Connectors und Handwerk Connect (IDS Connect, UGL, OCI). Mit ehrlichem Stand.",
  path: "/integrationen",
});

const standStil: Record<Stand, string> = {
  heute: "bg-signal-soft text-signal-dark",
  teilweise: "bg-paper text-ink ring-1 ring-line",
  kommt: "bg-paper text-muted ring-1 ring-line",
};

const faq: FaqItem[] = [
  {
    frage: "Was heißt „Kommt“?",
    antwort:
      "Die Verbindung ist geplant, aber noch nicht fertig. Wir nennen keine Termine, weil es auch von den Anbietern abhängt. Bis dahin gibt es meist einen Weg per Datei – zum Beispiel die Kalenderdatei statt Google Kalender.",
  },
  {
    frage: "Muss ich bei Gmail oder Outlook mein Passwort in Macher OS eingeben?",
    antwort:
      "Nein. Die Anmeldung läuft beim Anbieter selbst über unseren Integrationspartner. Macher OS sieht und speichert dein Passwort nie, und du kannst die Verbindung jederzeit trennen.",
  },
  {
    frage: "Kostet eine Integration extra?",
    antwort: "Die Verbindungen in Macher OS sind in jedem Plan drin. Spezielle Anbindungen nur für deinen Betrieb gibt es ab dem Plan Betrieb auf Anfrage.",
  },
  {
    frage: "In welcher Reihenfolge baut ihr?",
    antwort:
      "Was die meisten Betriebe jeden Tag brauchen, kommt zuerst: E-Rechnung, DATEV, E-Mail und Kalender, dann Großhandel und Zahlungen. Fehlt dir etwas, sag es uns – das verschiebt die Reihenfolge.",
  },
];

export default function IntegrationenPage() {
  return (
    <>
      <PageHero
        eyebrow="Integrationen"
        title="Macher OS spricht mit deinen Programmen."
        intro={`E-Mail, Kalender, Steuerberater, Großhändler und Ausschreibung – in vier Säulen. ${heuteZahl} von ${integrationenZahl} Verbindungen gehen heute schon ganz oder teilweise. Den Rest bauen wir Schritt für Schritt.`}
        breadcrumbs={[{ label: "Integrationen" }]}
        visual={
          <div className="rounded-2xl border border-line bg-paper p-4 sm:p-5">
            <LogoWand />
          </div>
        }
      />

      {/* Die vier Säulen im Überblick */}
      <Section tone="beige">
        <SectionHeading
          eyebrow="Vier Säulen"
          title="So ist Macher OS verbunden."
          intro="Jede Säule löst eine Art von Verbindung. Du musst dir nur merken: Was du schon nutzt, bleibt."
        />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {saeulen.map((s, n) => {
            const liste = integrationenDerSaeule(s.id);
            const heute = liste.filter((i) => i.stand !== "kommt").length;
            return (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="flex h-full flex-col rounded-xl border border-line bg-white p-6 transition-colors duration-150 ease-out hover:border-signal-dark"
                >
                  <div className="flex items-center justify-between">
                    <GlasIcon name={s.icon} className="size-12" />
                    <span className="font-display text-sm font-bold tabular-nums text-muted">0{n + 1}</span>
                  </div>
                  <h3 className="mt-5 font-display text-2xl font-bold leading-tight text-ink">{s.name}</h3>
                  <p className="mt-1 font-semibold text-signal-dark">{s.kurz}</p>
                  <p className="mt-3 flex-1 text-muted">{s.text}</p>
                  <p className="mt-5 border-t border-line pt-4 text-sm text-muted">
                    {liste.length} Verbindungen · {heute} heute nutzbar
                  </p>
                </a>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* Jede Säule mit allen Verbindungen, sortiert nach unserer Reihenfolge */}
      {saeulen.map((s, n) => {
        const liste = integrationenDerSaeule(s.id);
        return (
          <Section key={s.id} id={s.id} tone={n % 2 === 0 ? "white" : "beige"} className="scroll-mt-24">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="flex max-w-3xl items-start gap-4">
                <GlasIcon name={s.icon} className="size-14 shrink-0" />
                <SectionHeading eyebrow={`Säule ${n + 1}`} title={s.name} intro={s.text} />
              </div>
              {s.id === "connect" && (
                <div className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3">
                  <Image src={`/logos/integrationen/${pipedreamLogo}`} alt="" width={32} height={32} unoptimized className="size-8 rounded-md" />
                  <span className="text-sm">
                    <span className="block font-semibold text-ink">Integrationspartner</span>
                    <span className="block text-muted">Pipedream Connect</span>
                  </span>
                </div>
              )}
            </div>
            <p className="mt-4 max-w-3xl text-sm text-muted">{s.fundament}</p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {liste.map((i) => (
                <li key={i.id} className="flex min-w-0 items-center gap-4 rounded-xl border border-line bg-white p-4">
                  <IntegrationLogo integration={i} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-snug text-ink">{i.name}</p>
                    {i.hinweis && <p className="mt-0.5 text-sm leading-snug text-muted">{i.hinweis}</p>}
                    <span className={`mt-2 inline-flex rounded px-2 py-0.5 text-xs font-semibold ${standStil[i.stand]}`}>
                      {STAND_LABEL[i.stand]}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        );
      })}

      <Section tone="white" tight>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="min-w-0">
            <SectionHeading eyebrow="Fragen" title="Gut zu wissen." />
            <p className="mt-4 text-muted">
              Marken und Logos gehören ihren Inhabern. Sie zeigen nur, womit Macher OS arbeitet oder arbeiten wird – das ist keine
              Partnerschaft.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <ArrowLink href="/schnittstellen#anfrage">Integration fehlt? Sag uns Bescheid</ArrowLink>
              <ArrowLink href="/schnittstellen">Was heute geht und was bis dahin hilft</ArrowLink>
            </div>
          </div>
          <div className="min-w-0">
            <Faq items={faq} />
          </div>
        </div>
      </Section>
      <FaqJsonLd items={faq} />

      <FinalCta title="Probier es mit deinen Daten." intro="Starte kostenlos und schau, was Macher OS mit deinen Programmen heute schon kann." />
    </>
  );
}
