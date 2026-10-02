import Link from "next/link";
import { FinalCta, PageHero } from "@/components/sections";
import { Icon, Section } from "@/components/ui";
import { datumLang, neuigkeitenNachMonat } from "@/content/neuigkeiten";
import { funktionen, funktionHref } from "@/content/registry";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: "Was ist neu? – Änderungen in Macher OS",
  description:
    "Was sich in Macher OS geändert hat: neue Funktionen und Verbesserungen, neueste zuerst.",
  path: "/neu",
});

function funktionTitel(slug: string) {
  return funktionen.find((f) => f.slug === slug)?.titel ?? slug;
}

export default function NeuPage() {
  const gruppen = neuigkeitenNachMonat();

  return (
    <>
      {/* 1. Hero */}
      <PageHero
        eyebrow="Was ist neu?"
        title="Was sich in Macher OS geändert hat."
        intro="Neue Funktionen und Verbesserungen – das Neueste steht oben."
        actions="none"
      />

      {/* 2. Änderungsprotokoll nach Monat */}
      <Section tone="white" containerSize="narrow">
        <div className="grid gap-14">
          {gruppen.map((g) => (
            <section key={g.schluessel} aria-labelledby={`monat-${g.schluessel}`}>
              <h2
                id={`monat-${g.schluessel}`}
                className="font-display text-2xl font-bold tracking-tight sm:text-3xl"
              >
                {g.monat}
              </h2>
              <ol className="mt-6 grid gap-4">
                {g.eintraege.map((n) => (
                  <li key={`${n.datum}-${n.titel}`} className="rounded-xl border border-line bg-paper p-5 sm:p-6">
                    <p className="text-sm text-muted">
                      <time dateTime={n.datum}>{datumLang(n.datum)}</time>
                    </p>
                    <h3 className="mt-1 font-display text-xl font-bold">{n.titel}</h3>
                    <p className="mt-2 leading-relaxed">{n.text}</p>
                    {n.funktion && (
                      <Link
                        href={funktionHref(n.funktion)}
                        className="mt-3 inline-flex items-center gap-2 font-semibold text-signal-dark hover:underline"
                      >
                        Mehr zu {funktionTitel(n.funktion)}
                        <Icon name="arrow-right" className="size-4 shrink-0" />
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </Section>

      {/* 3. CTA */}
      <FinalCta
        title="Probier das Neue gleich aus."
        intro="Teste Macher OS kostenlos mit deinen eigenen Aufträgen – oder schau dir zuerst die Demo an."
      />
    </>
  );
}
