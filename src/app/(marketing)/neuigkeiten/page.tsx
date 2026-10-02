import { FinalCta, PageHero } from "@/components/sections";
import { ArrowLink, Badge, Icon, IconTile, Section, SectionHeading } from "@/components/ui";
import { demnaechst, neuigkeiten } from "@/content/landing/neuigkeiten";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: "Was ist neu? – Produktupdates von Macher OS",
  description:
    "Neue Funktionen in Macher OS: GAEB-Import, Datanorm, Zahlungsabgleich, XRechnung, Sprach-Baustellenbericht und mehr. Und was als Nächstes kommt.",
  path: "/neuigkeiten",
});

export default function NeuigkeitenPage() {
  return (
    <>
      <PageHero
        eyebrow="Was ist neu?"
        title="Macher OS wird laufend besser."
        intro="Hier siehst du, was neu dazugekommen ist. Alle Updates sind in deinem Plan drin – automatisch, ohne Aufpreis."
        breadcrumbs={[{ label: "Was ist neu?" }]}
      />

      {neuigkeiten.map((m) => (
        <Section key={m.monat} tone="white">
          <SectionHeading eyebrow="Neu" title={m.monat} />
          <ol className="mt-10 grid gap-4 md:grid-cols-2">
            {m.eintraege.map((e) => (
              <li key={e.titel} className="flex gap-4 rounded-2xl border border-line bg-white p-6">
                <IconTile name={e.icon} />
                <div className="min-w-0">
                  <Badge tone="signal">{e.bereich}</Badge>
                  <h3 className="mt-2 font-display text-xl font-semibold leading-snug">{e.titel}</h3>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{e.text}</p>
                  {e.link && (
                    <ArrowLink href={e.link.href} className="mt-3">
                      {e.link.label}
                    </ArrowLink>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </Section>
      ))}

      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <SectionHeading
            eyebrow="Demnächst"
            title="Woran wir gerade arbeiten."
            intro="Ohne Termine – wann etwas fertig ist, hängt manchmal auch von anderen Anbietern ab. Was fehlt dir? Schreib uns."
          />
          <div className="rounded-2xl border border-line bg-white p-6 sm:p-8">
            <ul className="space-y-3">
              {demnaechst.map((d) => (
                <li key={d} className="flex items-start gap-3">
                  <Icon name="clock" className="mt-0.5 size-5 shrink-0 text-muted" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
            <ArrowLink href="/kontakt" className="mt-6">
              Wunsch schicken
            </ArrowLink>
          </div>
        </div>
      </Section>

      <FinalCta title="Neugierig geworden?" intro="Probier die neuen Funktionen aus – kostenlos und ohne Kreditkarte." />
    </>
  );
}
