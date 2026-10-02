import Link from "next/link";
import { FinalCta, PageHero } from "@/components/sections";
import { ArrowLink, ButtonLink, CheckList, Icon, IconTile, Section, SectionHeading } from "@/components/ui";
import { FunktionLinks } from "@/components/wissen/Teile";
import { topGewerke } from "@/content/registry";
import { kurse, lernbereiche, rollen, type Kurs } from "@/content/wissen/akademie";
import { gewerkIcons } from "@/content/wissen/themen";
import { pageMeta } from "@/lib/metadata";
import { cta } from "@/lib/site";

export const metadata = pageMeta({
  title: "Macher Akademie – Kurse für Chef und Team",
  description:
    "Kurse für Handwerksbetriebe: Stundensatz, Angebote, Rechnungen, Einsatzplanung, Einarbeitung und Macher OS – für Chef, Büro, Monteure und Azubis.",
  path: "/wissen/akademie",
});

const rollenTitel = Object.fromEntries(rollen.map((r) => [r.slug, r.titel])) as Record<Kurs["rollen"][number], string>;

function KursKarte({ kurs }: { kurs: Kurs }) {
  return (
    <article id={`kurs-${kurs.slug}`} className="flex h-full scroll-mt-28 flex-col rounded-lg border border-line bg-white p-6 target:ring-2 target:ring-signal">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
        <span className="rounded-md bg-sand px-2 py-0.5 text-ink-soft">{kurs.lernbereich}</span>
        <span className="inline-flex items-center gap-1 text-muted">
          <Icon name="clock" className="size-3.5" /> ca. {kurs.dauer} Min.
        </span>
      </div>
      <h3 className="mt-3 font-display text-xl font-bold leading-snug">{kurs.titel}</h3>
      <p className="mt-2 text-muted">{kurs.kurz}</p>
      <details className="group mt-4 rounded-md bg-paper px-4 py-3">
        <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold">
          {kurs.lektionen.length} Lektionen
          <Icon name="chevron-down" className="size-4 transition-transform group-open:rotate-180" />
        </summary>
        <ol className="mt-3 grid list-decimal gap-1.5 pl-5 text-sm text-ink-soft">
          {kurs.lektionen.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ol>
      </details>
      <p className="mt-auto pt-4 text-sm text-muted">
        Für: {kurs.rollen.map((r) => rollenTitel[r]).join(", ")}
      </p>
    </article>
  );
}

export default function AkademiePage() {
  return (
    <>
      {/* 1. Hero */}
      <PageHero
        breadcrumbs={[{ label: "Wissen", href: "/wissen" }, { label: "Macher Akademie" }]}
        eyebrow="Macher Akademie"
        title="Lernen für Unternehmer und Mitarbeiter."
        intro="Kurze, praxisnahe Kurse für jede Rolle im Betrieb – vom Stundensatz bis zur App auf der Baustelle. In Häppchen, die in den Alltag passen."
        actions={
          <>
            <ButtonLink href="#kurse" size="lg">
              Kurse ansehen
            </ButtonLink>
            <ButtonLink href={cta.primary.href} variant="secondary" size="lg">
              {cta.primary.label}
            </ButtonLink>
          </>
        }
        trust={false}
      />

      {/* 2. Lernbereiche */}
      <Section tone="white">
        <SectionHeading eyebrow="Lernbereiche" title="Vier Bereiche. Alles, was ein Betrieb braucht." />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {lernbereiche.map((l) => {
            const anzahl = kurse.filter((k) => k.lernbereich === l.titel).length;
            return (
              <div key={l.titel} className="rounded-lg border border-line bg-paper p-6">
                <IconTile name={l.icon} />
                <h3 className="mt-4 font-display text-lg font-bold">{l.titel}</h3>
                <p className="mt-1 text-muted">{l.text}</p>
                <p className="mt-3 text-sm font-semibold">
                  {anzahl} {anzahl === 1 ? "Kurs" : "Kurse"}
                </p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 3. Kurse */}
      <Section id="kurse" className="scroll-mt-20">
        <SectionHeading
          eyebrow="Kurse"
          title="Alle Kurse."
          intro="Die Kurse findest du in deinem Macher-OS-Konto. Lernzeiten sind ungefähre Angaben."
        />
        <ul className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {kurse.map((k) => (
            <li key={k.slug}>
              <KursKarte kurs={k} />
            </li>
          ))}
        </ul>
      </Section>

      {/* 4. Nach Rolle */}
      <Section tone="sand">
        <SectionHeading eyebrow="Nach Rolle" title="Für jeden im Betrieb das Richtige." />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {rollen.map((r) => (
            <div key={r.slug} className="flex flex-col rounded-lg border border-line bg-white p-6">
              <IconTile name={r.icon} tone="ink" />
              <h3 className="mt-4 font-display text-lg font-bold">{r.titel}</h3>
              <p className="mt-1 text-sm text-muted">{r.text}</p>
              <ul className="mt-4 grid gap-2 border-t border-line pt-4 text-[0.95rem]">
                {kurse
                  .filter((k) => k.rollen.includes(r.slug))
                  .map((k) => (
                    <li key={k.slug}>
                      <a href={`#kurs-${k.slug}`} className="flex gap-2 hover:text-signal-dark">
                        <Icon name="award" className="mt-1 size-4 shrink-0 text-muted" />
                        <span className="leading-snug">{k.titel}</span>
                      </a>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* 5. Nach Gewerk */}
      <Section tone="white">
        <SectionHeading
          eyebrow="Nach Gewerk"
          title="Passend zu deinem Gewerk."
          intro="Die Grundlagen-Kurse gelten für alle. In Macher OS siehst du zusätzlich Beispiele, Begriffe und Vorlagen aus deinem Gewerk."
        />
        <ul className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {topGewerke.map((g) => {
            const speziell = kurse.filter((k) => (k.gewerke as readonly string[]).includes(g.slug));
            return (
              <li key={g.slug} className="rounded-lg border border-line bg-paper p-4">
                <div className="flex items-center gap-3">
                  <IconTile name={gewerkIcons[g.slug]} className="size-9" />
                  <Link href={`/gewerke/${g.slug}`} className="font-display font-bold hover:text-signal-dark">
                    {g.kurz}
                  </Link>
                </div>
                <p className="mt-2 text-sm text-muted">
                  {speziell.length > 0
                    ? `Besonders passend: ${speziell.map((k) => k.titel).join(", ")}.`
                    : "Alle Grundlagen-Kurse, mit Beispielen aus deinem Gewerk."}
                </p>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* 6. Schulungen für Mitarbeiter + 7. Nachweise */}
      <Section tone="ink">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-semibold font-tagline uppercase tracking-[0.06em] text-accent">Schulungen für Mitarbeiter</p>
            <h2 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
              Dein Team lernt. Du behältst den Überblick.
            </h2>
            <p className="mt-5 max-w-md text-lg text-white/70">
              Mit Macher OS weist du Mitarbeitern Kurse und eigene Schulungen zu – etwa die jährliche Unterweisung. Wer
              was abgeschlossen hat, siehst du auf einen Blick.
            </p>
            <Link
              href="/funktionen/schulungen"
              className="mt-8 inline-flex items-center gap-1.5 font-bold text-accent underline decoration-2 underline-offset-4 hover:text-white"
            >
              Funktion Schulungen ansehen <Icon name="arrow-right" className="size-4" />
            </Link>
          </div>
          <div className="karte-dunkel p-6 sm:p-8">
            <CheckList
              items={[
                "Kurse und eigene Schulungen zuweisen",
                "Unterweisungen dokumentieren",
                "Erinnerung, wenn eine Wiederholung fällig ist",
                "Abschlüsse beim Mitarbeiter gespeichert",
                "Qualifikationen fließen in die Einsatzplanung ein",
              ]}
            />
            <p className="mt-6 border-t border-white/15 pt-5 text-sm text-white/70">
              Zertifikate: Abgeschlossene Kurse werden im Mitarbeiterprofil vermerkt. Offizielle Zertifikate oder
              anerkannte Weiterbildungsnachweise stellt die Macher Akademie nicht aus – dafür sind Kammern, Verbände und
              Berufsgenossenschaften zuständig.
            </p>
          </div>
        </div>
      </Section>

      <Section tone="white" tight>
        <SectionHeading eyebrow="In Macher OS" title="Passende Funktionen." />
        <div className="mt-8 max-w-3xl">
          <FunktionLinks slugs={["schulungen", "qualifikationen", "mitarbeiter"]} />
        </div>
        <ArrowLink href="/wissen/vorlagen/checkliste-unterweisung-neue-mitarbeiter" className="mt-8">
          Checkliste Unterweisung kostenlos nutzen
        </ArrowLink>
      </Section>

      {/* 8. CTA */}
      <FinalCta
        title="Lernen, wo gearbeitet wird."
        intro="Starte Macher OS kostenlos – die Akademie-Kurse sind für dich und dein Team gleich mit dabei."
      />
    </>
  );
}
