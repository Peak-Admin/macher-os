import { PageHero } from "@/components/sections";
import { Section } from "@/components/ui";
import { gewerkBilder, missionMittelstandBilder, type Bildnachweis } from "@/content/bilder";
import { gewerkCluster, topGewerke } from "@/content/registry";
import { pageMeta } from "@/lib/metadata";

export const metadata = {
  ...pageMeta({
    title: "Bildnachweise",
    description: "Woher die Fotos auf der Website von Macher OS stammen und unter welcher Lizenz sie stehen.",
    path: "/bildnachweise",
  }),
  robots: { index: false },
};

const gewerkTitel = new Map<string, string>([...topGewerke, ...gewerkCluster].map((g) => [g.slug, g.titel]));

function Liste({ titel, bilder }: { titel: string; bilder: (Bildnachweis & { wo?: string })[] }) {
  return (
    <div className="mt-10 first:mt-0">
      <h2 className="font-display text-2xl font-bold">{titel}</h2>
      <ul className="mt-4 divide-y divide-line rounded-lg border border-line bg-white">
        {bilder.map((b) => (
          <li key={b.src} className="grid gap-1 p-4 sm:grid-cols-[14rem_1fr]">
            <span className="font-semibold">{b.wo ?? b.alt}</span>
            <span className="text-muted">
              {b.fotograf} ·{" "}
              {b.quelleUrl ? (
                <a href={b.quelleUrl} className="text-signal-dark underline underline-offset-2" rel="noopener noreferrer">
                  {b.quelle}
                </a>
              ) : (
                b.quelle
              )}{" "}
              ·{" "}
              {b.lizenzUrl ? (
                <a href={b.lizenzUrl} className="text-signal-dark underline underline-offset-2" rel="noopener noreferrer">
                  {b.lizenz}
                </a>
              ) : (
                b.lizenz
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function BildnachweisePage() {
  const gewerke = Object.entries(gewerkBilder).map(([slug, b]) => ({ ...b!, wo: gewerkTitel.get(slug) }));
  return (
    <>
      <PageHero
        eyebrow="Rechtliches"
        title="Bildnachweise"
        intro="Hier steht, woher die Fotos auf dieser Website stammen."
        breadcrumbs={[{ label: "Bildnachweise" }]}
        actions="none"
      />
      <Section tone="white" containerSize="narrow">
        <Liste titel="Mission Mittelstand" bilder={missionMittelstandBilder} />
        {gewerke.length > 0 && <Liste titel="Gewerke" bilder={gewerke} />}
      </Section>
    </>
  );
}
