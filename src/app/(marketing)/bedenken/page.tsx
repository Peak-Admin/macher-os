import { BedenkenSuche } from "@/components/bedenken/BedenkenSuche";
import { FinalCta, PageHero } from "@/components/sections";
import { FaqJsonLd, Section } from "@/components/ui";
import { alleEinwaende } from "@/content/einwaende";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: "Bedenken",
  description:
    "Ehrliche Antworten auf die häufigsten Bedenken von Handwerkern gegen Software – von Zeit und Kosten bis Datenschutz und Mitarbeiter.",
  path: "/bedenken",
});

export default function BedenkenPage() {
  return (
    <>
      <FaqJsonLd items={alleEinwaende} />
      <PageHero
        eyebrow="Bedenken"
        title="Ehrliche Antworten auf deine Bedenken."
        intro="Das hören wir von Handwerkern, bevor sie anfangen. Such nach deinem Thema oder schau alle durch."
        breadcrumbs={[{ label: "Bedenken" }]}
        actions="none"
      />
      <Section tone="white" tight>
        <div className="mx-auto max-w-3xl">
          <BedenkenSuche eintraege={alleEinwaende} vorschlaege={["Daten", "Kosten", "Mitarbeiter", "Zeit", "DATEV"]} />
        </div>
      </Section>
      <FinalCta />
    </>
  );
}
