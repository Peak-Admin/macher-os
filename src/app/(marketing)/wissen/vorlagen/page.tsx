import { Objekt } from "@/components/ui/Objekt";
import { Suspense } from "react";
import { FinalCta, PageHero } from "@/components/sections";
import { ArrowLink, ButtonLink, CheckList, Icon, Section, SectionHeading } from "@/components/ui";
import { VorlagenFilter, VorlagenFilterMitParams } from "@/components/wissen/VorlagenFilter";
import { topGewerke } from "@/content/registry";
import { wissenIndex } from "@/content/wissen";
import { themen } from "@/content/wissen/themen";
import { pageMeta } from "@/lib/metadata";
import { cta } from "@/lib/site";

export const metadata = pageMeta({
  title: "Kostenlose Vorlagen & Checklisten fürs Handwerk",
  description:
    "Kostenlose Vorlagen, Checklisten und Formulare für Handwerksbetriebe: Abnahmeprotokoll, Aufmaßblatt, Stundenzettel, Regiebericht, Wartungsprotokoll und mehr – direkt drucken.",
  path: "/wissen/vorlagen",
});

export default function VorlagenHubPage() {
  const eintraege = wissenIndex.filter((e) => e.typ === "Vorlage" || e.typ === "Checkliste" || e.typ === "Formular");
  const genutzt = themen.filter((t) => eintraege.some((e) => e.themen.includes(t.slug)));
  const themenOptionen = genutzt.map((t) => ({ slug: t.slug, titel: t.titel }));
  const gewerkOptionen = topGewerke.map((g) => ({ slug: g.slug, titel: g.titel }));

  return (
    <>
      {/* 1. Hero */}
      <PageHero
        breadcrumbs={[{ label: "Wissen", href: "/wissen" }, { label: "Vorlagen & Checklisten" }]}
        eyebrow="Vorlagen & Checklisten"
        title="Vorlagen, die auf der Baustelle funktionieren."
        intro="Kostenlos ansehen, ausdrucken oder als PDF speichern. Ohne Anmeldung. Und wenn du keine Zettel mehr willst: direkt in Macher OS verwenden."
        actions="none"
        visual={<Objekt objekt="klemmbrett" sizes="(min-width: 1024px) 480px, 90vw" className="shadow-popover" />}
      />

      {/* 2.–6. Filter + Vorlagen, Checklisten, Formulare */}
      <Section tone="white" tight>
        <h2 className="sr-only">Alle Vorlagen</h2>
        <Suspense fallback={<VorlagenFilter eintraege={eintraege} themen={themenOptionen} gewerke={gewerkOptionen} />}>
          <VorlagenFilterMitParams eintraege={eintraege} themen={themenOptionen} gewerke={gewerkOptionen} />
        </Suspense>
      </Section>

      {/* 7. Direkt in Macher OS verwenden */}
      <Section>
        <div className="grid items-center gap-10 rounded-lg border border-line bg-white p-6 sm:p-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <SectionHeading
              eyebrow="Ohne Papier"
              title="Direkt in Macher OS verwenden."
              intro="Alle Checklisten und Formulare gibt es auch digital: auf dem Handy ausfüllen, Fotos dranhängen, beim Kunden unterschreiben lassen – automatisch am richtigen Auftrag gespeichert."
            />
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={cta.primary.href} size="lg">
                {cta.primary.label}
              </ButtonLink>
              <ButtonLink href={cta.secondary.href} variant="secondary" size="lg">
                <Icon name="play" className="size-4" /> {cta.secondary.label}
              </ButtonLink>
            </div>
          </div>
          <CheckList
            items={[
              "Kein Abtippen von Zetteln",
              "Unterschrift direkt auf dem Handy",
              "Fotos und Notizen am Auftrag",
              "Eigene Checklisten für deinen Betrieb",
              "Alles auffindbar – auch in fünf Jahren",
            ]}
          />
        </div>
        <ArrowLink href="/funktionen/dokumentation" className="mt-8">
          Fotos & Dokumentation ansehen
        </ArrowLink>
      </Section>

      {/* 8. CTA */}
      <FinalCta />
    </>
  );
}
