import Link from "next/link";
import { FinalCta, KundenCard, PageHero } from "@/components/sections";
import { ArrowLink, Faq, FaqJsonLd, Icon, IconTile, Lotte, LotteHerkunft, Section, SectionHeading, Skizze } from "@/components/ui";
import type { LottePose } from "@/content/lotte";
import { funktionInhalte, funktionTitel, gewerkTitel } from "@/content/funktionen";
import { funktionHref, gewerkHref } from "@/content/registry";
import { FunktionKarte } from "./FunktionKarte";
import { FunktionsMock } from "./FunktionsMock";

const lotteZeigt: { pose: LottePose; titel: string; text: string }[] = [
  { pose: "erklaert", titel: "Sie fragt nach", text: "Fehlt eine Angabe, fragt Lotte nach – bei dir oder beim Kunden." },
  { pose: "laptop", titel: "Sie bereitet vor", text: "Angebote, Rechnungen, Termine: Lotte legt alles fertig hin." },
  { pose: "telefon", titel: "Du gibst frei", text: "Was nach außen geht oder Geld kostet, schickst du mit einem Klick ab." },
];

/** Eigene, ausführlichere Seite für „Lotte erledigt automatisch“. */
export function AutomatischSeite() {
  const f = funktionInhalte["automatisch-erledigen"];

  return (
    <>
      <PageHero
        breadcrumbs={[{ label: "Funktionen", href: "/funktionen" }, { label: "Lotte erledigt automatisch" }]}
        eyebrow="Lotte erledigt"
        title={f.hero.titel}
        intro={
          <>
            {f.hero.problem} <span className="font-semibold text-ink">{f.hero.loesung}</span>
          </>
        }
        visual={<FunktionsMock visual={f.visual} label="Startseite in Handwerk OS: Was Lotte heute erledigt hat" />}
      />

      {/* Das ist Lotte */}
      <Section tone="sand" tight>
        <SectionHeading
          eyebrow="Das ist Lotte"
          title="Deine Bürokraft, die nie Feierabend braucht."
          intro="Lotte ist die KI in Handwerk OS. Sie kennt deine Kunden, Aufträge und Termine – und sieht nur, was du auch siehst."
        />
        <LotteHerkunft className="mt-4 max-w-2xl" />
        <ul className="mt-10 grid gap-6 sm:grid-cols-3">
          {lotteZeigt.map((l) => (
            <li key={l.pose} className="flex flex-col items-center text-center">
              <Lotte pose={l.pose} dekorativ className="w-44 sm:w-full sm:max-w-60" sizes="(min-width: 640px) 240px, 176px" />
              <h3 className="mt-4 font-display text-xl font-bold">{l.titel}</h3>
              <p className="mt-1 max-w-xs text-muted">{l.text}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* Übersicht: zehn Aufgaben als Sprungmarken */}
      <Section tone="white" tight>
        <SectionHeading
          eyebrow="Was Lotte übernimmt"
          title="Zehn Aufgaben, die du nicht mehr selbst machen musst."
          intro="Jede davon kannst du einzeln einschalten – oder erst einmal nur Vorschläge bekommen."
        />
        <ul className="mt-8 flex flex-wrap gap-2">
          {f.aufgaben.map((a, i) => (
            <li key={a.titel}>
              <a
                href={`#aufgabe-${i + 1}`}
                className="inline-flex items-center gap-2 rounded-md bg-paper px-3 py-2 text-sm font-semibold ring-1 ring-line transition hover:ring-ink/40"
              >
                <Icon name={a.icon} className="size-4 text-signal-dark" />
                {a.titel}
              </a>
            </li>
          ))}
        </ul>
      </Section>

      {/* Vorher / Nachher */}
      <Section>
        <SectionHeading eyebrow="Vorher und nachher" title="So sieht der Alltag mit Lotte aus." />
        <ol className="mt-10 grid gap-5">
          {f.aufgaben.map((a, i) => (
            <li
              key={a.titel}
              id={`aufgabe-${i + 1}`}
              className="scroll-mt-28 overflow-hidden rounded-lg border border-line bg-white"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
                <h3 className="flex items-center gap-3 font-display text-lg font-bold sm:text-xl">
                  <IconTile name={a.icon} className="size-10" />
                  <span>
                    <span className="mr-2 text-sm font-extrabold text-signal-dark">{String(i + 1).padStart(2, "0")}</span>
                    {a.titel}
                  </span>
                </h3>
                <Link
                  href={funktionHref(a.funktion)}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink"
                >
                  Zur Funktion {funktionTitel(a.funktion)} <Icon name="arrow-right" className="size-4" />
                </Link>
              </div>
              <div className="grid md:grid-cols-[1fr_1fr_0.8fr]">
                <div className="border-b border-line p-5 sm:p-6 md:border-b-0 md:border-r">
                  <p className="mb-2 text-sm font-semibold font-tagline uppercase tracking-wider text-muted">Vorher</p>
                  <p className="leading-relaxed text-ink-soft">{a.vorher}</p>
                </div>
                <div className="border-b border-line bg-moss-soft/60 p-5 sm:p-6 md:border-b-0 md:border-r">
                  <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold font-tagline uppercase tracking-wider text-moss">
                    <Icon name="spark" className="size-3.5" /> Mit Lotte
                  </p>
                  <p className="font-semibold leading-relaxed">{a.nachher}</p>
                </div>
                <div className="p-5 sm:p-6">
                  <p className="mb-2 text-sm font-semibold font-tagline uppercase tracking-wider text-muted">Du entscheidest</p>
                  <p className="leading-relaxed text-ink-soft">{a.duEntscheidest}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* Ein Tag mit Lotte */}
      <Section tone="ink">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="mb-3 text-sm font-semibold font-tagline uppercase tracking-[0.06em] text-accent">Ein Tag mit Lotte</p>
            <h2 className="font-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl">
              Dienstag in einem Elektrobetrieb.
            </h2>
            <p className="mt-5 max-w-md text-lg text-white/70">
              Ein ausgedachter, aber typischer Tag: Was passiert, und was Lotte davon übernimmt.
            </p>
          </div>
          <ol className="relative grid gap-4 border-l border-white/15 pl-6">
            {f.tagesablauf.map((t) => (
              <li key={t.zeit} className="relative">
                <span aria-hidden className="absolute -left-[1.85rem] top-1.5 size-3 rounded-full bg-signal ring-4 ring-ink" />
                <p className="font-display text-sm font-extrabold text-accent">{t.zeit}</p>
                <p className="mt-0.5 leading-relaxed text-white/85">{t.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* Prinzipien */}
      <Section tone="white">
        <SectionHeading
          eyebrow="So arbeitet Lotte"
          title="Automatisch heißt nicht: ohne dich."
          intro="Lotte arbeitet nach deinen Regeln. Du kannst jederzeit sehen, was passiert ist, und alles ändern."
        />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {f.prinzipien.map((p) => (
            <li key={p.titel} className="rounded-lg border border-line bg-white p-5">
              <Skizze motiv={p.skizze} className="-mx-1 -mt-1 mb-5" />
              <h3 className="font-display text-lg font-bold leading-snug">{p.titel}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{p.text}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* Gewerke + Kunde */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <SectionHeading eyebrow="Gewerke" title="Lotte kennt dein Gewerk." />
            <ul className="mt-8 grid gap-3">
              {f.gewerke.map((g) => (
                <li key={g.slug}>
                  <Link
                    href={gewerkHref(g.slug)}
                    className="group flex items-start justify-between gap-4 rounded-lg border border-line bg-white p-5 transition hover:border-ink/30"
                  >
                    <span>
                      <span className="block font-display font-bold">{gewerkTitel(g.slug)}</span>
                      <span className="mt-1 block text-[0.95rem] text-muted">{g.text}</span>
                    </span>
                    <Icon name="arrow-right" className="mt-1 size-4 shrink-0 text-signal-dark transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
            <ArrowLink href="/gewerke" className="mt-8">
              Mein Gewerk ansehen
            </ArrowLink>
          </div>
          <div>
            <SectionHeading eyebrow="Aus der Praxis" title="So arbeiten andere Betriebe." />
            <p className="mt-4 text-muted">{f.kunde.text}</p>
            <div className="mt-6 max-w-sm">
              <KundenCard slug={f.kunde.slug} />
            </div>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section tone="white" containerSize="narrow">
        <SectionHeading title="Häufige Fragen zu Lotte" />
        <div className="mt-8">
          <Faq items={f.faq} />
        </div>
        <FaqJsonLd items={f.faq} />
      </Section>

      {/* Verwandte Funktionen */}
      <Section tone="sand" tight>
        <SectionHeading eyebrow="Verwandte Funktionen" title="Hier arbeitet Lotte am meisten mit." />
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {f.verwandt.map((v) => (
            <li key={v}>
              <FunktionKarte slug={v} />
            </li>
          ))}
        </ul>
        <ArrowLink href="/funktionen" className="mt-8">
          Alle Funktionen ansehen
        </ArrowLink>
      </Section>

      <FinalCta title="Gib die Büroarbeit ab." />
    </>
  );
}
