import { FinalCta, KundenCard, PageHero, Steps, MissionMittelstandStreifen } from "@/components/sections";
import {
  ArrowLink,
  Badge,
  ButtonLink,
  CheckList,
  Faq,
  FaqJsonLd,
  Icon,
  Section,
  SectionHeading,
} from "@/components/ui";
import { allesDrin, immerDabei, preiseFaq, preiseVorlaeufig, testTage } from "@/content/preise";
import { wechselSchritte } from "@/content/preise-vergleich";
import { kunden } from "@/content/registry";
import { pageMeta } from "@/lib/metadata";
import { PreisRechner } from "./PreisRechner";

export const metadata = pageMeta({
  title: "Preise – Ein Preis für deinen Betrieb, alles drin",
  description: `Die Preise von Handwerk OS: ein Preis je Betrieb nach Teamgröße, alle Funktionen drin. ${testTage} Tage kostenlos testen ohne Zahlungsdaten, monatlich kündbar, SEPA-Lastschrift.`,
  path: "/preise",
});

export default function PreisePage() {
  return (
    <>
      <PageHero
        breadcrumbs={[{ label: "Preise" }]}
        eyebrow="Preise"
        title="Ein Preis für deinen Betrieb. Alles drin."
        intro={`Du zahlst nach Teamgröße – nicht nach Funktionen. ${testTage} Tage kostenlos testen, danach monatlich kündbar.`}
        actions="none"
      />

      {/* Teamgröße → Plan */}
      <Section tone="white" tight>
        {preiseVorlaeufig && (
          <p className="mb-6 flex flex-wrap items-center justify-center gap-2 text-center text-sm text-muted">
            <Badge tone="sand">Vorläufig</Badge>
            Die Preise stehen noch nicht endgültig fest. Vor der ersten Abbuchung siehst und bestätigst du den endgültigen Preis.
          </p>
        )}
        <PreisRechner />
      </Section>

      {/* Alles drin */}
      <Section tone="ink">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-center">
          <div>
            <p className="mb-3 text-sm font-semibold font-tagline uppercase tracking-[0.06em] text-accent">In jedem Plan</p>
            <h2 className="font-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl">Alles drin. Ohne Aufpreis.</h2>
            <p className="mt-4 text-lg text-white/70">
              Keine Pakete, keine Zusatzmodule zum Freischalten. Die Pläne unterscheiden sich nur darin, wie viele Leute mitarbeiten.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {allesDrin.map((x) => (
              <li key={x} className="flex items-center gap-3 karte-dunkel p-4">
                <Icon name="check" className="size-5 shrink-0 text-accent" />
                <span className="font-semibold">{x}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* So läuft es ab */}
      <Section>
        <SectionHeading
          eyebrow="Ablauf"
          title="Bezahlen ist eine Formalität."
          intro="Du entscheidest erst, wenn Handwerk OS bei dir läuft. Und deine Daten gehören immer dir."
        />
        <Steps
          className="mt-10"
          steps={[
            { titel: `${testTage} Tage testen`, text: "Ohne Kreditkarte, ohne Bankverbindung. Mit deinen echten Daten und deinem ganzen Team." },
            { titel: "Plan in einem Schritt buchen", text: "Der Plan ist aus deiner Teamgröße vorgewählt. SEPA-Lastschrift oder Karte – fertig." },
            { titel: "Monatlich kündbar", text: "In zwei Klicks in Handwerk OS. Danach bleibt alles lesbar, und der Export ist immer kostenlos." },
          ]}
        />
      </Section>

      {/* Wechselservice */}
      <Section tone="sand">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading
              eyebrow="Wechselservice"
              title="Wir helfen dir beim Umstieg."
              intro="Du nutzt schon ein anderes Programm oder arbeitest mit Excel und Zetteln? Deine Daten kommen mit."
            />
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/hilfe/daten-uebernehmen" variant="secondary">
                So übernimmst du deine Daten
              </ButtonLink>
            </div>
          </div>
          <ol className="grid gap-3">
            {wechselSchritte.map((s, i) => (
              <li key={s.titel} className="flex gap-4 rounded-xl bg-white p-5 ring-1 ring-line">
                <span className="font-display text-sm font-extrabold text-signal-dark">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>
                  <span className="block font-display font-bold">{s.titel}</span>
                  <span className="mt-1 block text-[0.95rem] text-muted">{s.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* Kundenbeweis */}
      <Section tone="white">
        <SectionHeading
          eyebrow="Kunden"
          title="So arbeiten Betriebe mit Handwerk OS."
          intro="Beispielgeschichten, die zeigen, wie typische Betriebe Handwerk OS nutzen."
        />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kunden.slice(0, 3).map((k) => (
            <li key={k.slug} className="flex [&>a]:w-full">
              <KundenCard slug={k.slug} />
            </li>
          ))}
        </ul>
        <ArrowLink href="/kunden" className="mt-8">
          Alle Kunden ansehen
        </ArrowLink>
      </Section>

      {/* FAQ */}
      <Section containerSize="narrow">
        <SectionHeading title="Häufige Fragen zu den Preisen" />
        <div className="mt-8">
          <Faq items={preiseFaq} />
        </div>
        <FaqJsonLd items={preiseFaq} />
        <CheckList
          className="mt-8 text-sm text-muted"
          items={immerDabei}
          columns={2}
        />
        <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
          <ArrowLink href="/vergleich">Software-Vergleich</ArrowLink>
          <ArrowLink href="/wechselbonus">Wechselbonus für laufende Verträge</ArrowLink>
        </div>
      </Section>

      <MissionMittelstandStreifen />

      <FinalCta
        title="Starte heute. Zahl erst, wenn es passt."
        intro={`Teste Handwerk OS ${testTage} Tage kostenlos – ohne Zahlungsdaten – und richte es in wenigen Minuten für deinen Betrieb ein.`}
      />
    </>
  );
}
