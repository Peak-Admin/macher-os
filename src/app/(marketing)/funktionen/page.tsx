import { Objekt } from "@/components/ui/Objekt";
import type { ObjektSchluessel } from "@/lib/objekte";
import Link from "next/link";
import { FunktionKarte, VerbindungsDiagramm } from "@/components/funktionen";
import { AppVorschau, VorschauRahmen } from "@/components/mocks";
import { FinalCta, PageHero, MissionMittelstandStreifen } from "@/components/sections";
import {
  ArrowLink,
  ButtonLink,
  Faq,
  FaqJsonLd,
  Icon,
  IconTile,
  Section,
  SectionHeading,
  type FaqItem,
  type IconName,
} from "@/components/ui";
import { funktionInhalte } from "@/content/funktionen";
import {
  funktionen,
  funktionGruppen,
  funktionHref,
  gewerkHref,
  topGewerke,
  type FunktionGruppe,
} from "@/content/registry";
import { pageMeta } from "@/lib/metadata";
import { cta } from "@/lib/site";

export const metadata = pageMeta({
  title: "Funktionen – alles, was dein Handwerksbetrieb braucht",
  description:
    "Von der Anfrage bis zur Rechnung, von Mitarbeitern bis Material: Alle Funktionen von Macher OS im Überblick – nach Arbeitsablauf sortiert und miteinander verbunden.",
  path: "/funktionen",
});

const ablauf: { gruppe: FunktionGruppe; titel: string; text: string; icon: IconName; kette: string[] }[] = [
  {
    gruppe: "auftraege",
    titel: "Aufträge",
    text: "Vom Kundenkontakt bis zur Bezahlung.",
    icon: "clipboard",
    kette: ["Anfrage", "Angebot", "Auftrag", "Rechnung"],
  },
  {
    gruppe: "planen",
    titel: "Planen",
    text: "Termine, Mitarbeiter und Einsätze.",
    icon: "calendar",
    kette: ["Termin", "Team", "Material", "Fahrzeug"],
  },
  {
    gruppe: "betrieb",
    titel: "Betrieb",
    text: "Team, Material, Fahrzeuge und Geld.",
    icon: "layers",
    kette: ["Mitarbeiter", "Lager", "Kosten"],
  },
  {
    gruppe: "macher",
    titel: "Macher",
    text: "Arbeit, die automatisch erledigt wird.",
    icon: "spark",
    kette: ["Anrufe", "Termine", "Erinnerungen"],
  },
];

const gruppenIcons: Record<FunktionGruppe, IconName> = {
  auftraege: "clipboard",
  planen: "calendar",
  betrieb: "layers",
  macher: "spark",
};

const gewerkBeispiele: Record<(typeof topGewerke)[number]["slug"], string> = {
  elektriker: "Prüfprotokolle, Zählerschrank, Wallbox",
  shk: "Wartungen, Anlagen, Notdienst",
  maler: "Flächen in m², Farbtöne, Untergründe",
  fliesenleger: "Boden, Wand, Sockel, Verschnitt",
  tischler: "Werkstatt, Montage, Plattenmaterial",
  dachdecker: "Dachflächen, Gerüst, Wetter",
  bau: "Bauabschnitte, Kolonnen, Abschläge",
  galabau: "Pflegetermine, Flächen, Saison",
};

const verbindungen = [
  "Der Monteur sieht Adresse, Fotos und Material des Auftrags auf dem Handy.",
  "Seine Stunden landen beim Auftrag – und gleichzeitig im Lohnbüro.",
  "Verbautes Material und Zusatzarbeiten stehen schon in der Rechnung.",
  "Am Ende zeigt die Nachkalkulation, was der Auftrag gebracht hat.",
];

const faq: FaqItem[] = [
  {
    frage: "Muss ich alle Funktionen nutzen?",
    antwort:
      "Nein. Du startest mit dem, was du brauchst – zum Beispiel Angebote, Rechnungen und Kalender. Weitere Funktionen schaltest du dazu, wenn es passt.",
  },
  {
    frage: "Brauche ich für Lager, Planung und Zeiterfassung extra Programme?",
    antwort:
      "Nein. Alles steckt in Macher OS und greift ineinander. Ein Auftrag kennt seinen Kunden, seine Termine, sein Material und seine Stunden.",
  },
  {
    frage: "Was heißt „Macher erledigt“?",
    antwort:
      "Macher übernimmt wiederkehrende Büroarbeit: Anrufe annehmen, Termine abstimmen, Angebote und Rechnungen vorbereiten, an Zahlungen erinnern. Was nach außen geht oder Geld kostet, gibst du frei.",
  },
  {
    frage: "Passt Macher OS zu meinem Gewerk?",
    antwort:
      "Beim Start wählst du dein Gewerk. Macher OS richtet dann Begriffe, Vorlagen, Checklisten und Abläufe passend ein – vom Elektriker bis zum Gartenbauer.",
  },
];

export default function FunktionenPage() {
  const macherAufgaben = funktionInhalte["automatisch-erledigen"].aufgaben;
  const gruppen = (["auftraege", "planen", "betrieb"] as const).map((g) => ({
    id: g,
    ...funktionGruppen[g],
    slugs: funktionen.filter((f) => f.gruppe === g).map((f) => f.slug),
  }));

  return (
    <>
      {/* 1. Hero */}
      <PageHero
        bild="seite/funktionen"
        breadcrumbs={[{ label: "Funktionen" }]}
        eyebrow="Funktionen"
        title="Alles, was dein Betrieb braucht."
        intro="Von der Anfrage bis zur Rechnung – und von Mitarbeitern bis Material."
        actions={
          <>
            <ButtonLink href={cta.primary.href} size="lg">
              {cta.primary.label}
            </ButtonLink>
            <ButtonLink href="#alle-funktionen" variant="secondary" size="lg">
              Alle Funktionen ansehen
            </ButtonLink>
          </>
        }
        visual={
          <VorschauRahmen hinweis="Klick dich durch – alles Beispieldaten.">
            <AppVorschau start="auftraege" />
          </VorschauRahmen>
        }
      />

      {/* 2. Nach Arbeitsablauf */}
      <Section tone="white">
        <SectionHeading
          eyebrow="Nach Arbeitsablauf"
          title="Vier Bereiche. Mehr musst du dir nicht merken."
          intro="Macher OS ist so aufgebaut, wie dein Betrieb arbeitet – nicht wie eine Liste von Programmteilen."
        />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ablauf.map((b) => (
            <li key={b.gruppe}>
              <a
                href={`#${b.gruppe}`}
                className={`group flex h-full flex-col rounded-lg p-6 transition hover:-translate-y-0.5 ${
                  b.gruppe === "macher"
                    ? "bg-ink text-white"
                    : "border border-line bg-paper hover:border-ink/30 hover:shadow-lg hover:shadow-ink/5"
                }`}
              >
                {b.gruppe === "macher" ? (
                  <IconTile name={b.icon} tone="signal" />
                ) : (
                  <Objekt objekt={{ auftraege: "klemmbrett", planen: "zollstock", betrieb: "handschuhe" }[b.gruppe as "auftraege" | "planen" | "betrieb"] as ObjektSchluessel} className="-mx-2 -mt-2" />
                )}
                <h3 className="mt-5 font-display text-2xl font-extrabold">{b.titel}</h3>
                <p className={`mt-1 ${b.gruppe === "macher" ? "text-white/70" : "text-muted"}`}>{b.text}</p>
                <p className={`mt-5 flex flex-wrap items-center gap-1.5 text-xs font-semibold ${b.gruppe === "macher" ? "text-white/80" : "text-ink-soft"}`}>
                  {b.kette.map((k, i) => (
                    <span key={k} className="flex items-center gap-1.5">
                      <span className={`rounded-md px-2 py-1 ${b.gruppe === "macher" ? "bg-white/10" : "bg-white ring-1 ring-line"}`}>{k}</span>
                      {i < b.kette.length - 1 && <span aria-hidden>→</span>}
                    </span>
                  ))}
                </p>
                <span className={`mt-auto inline-flex items-center gap-1 pt-6 text-sm font-bold ${b.gruppe === "macher" ? "text-signal" : "text-signal-dark"}`}>
                  Funktionen ansehen <Icon name="arrow-right" className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Section>

      {/* 3. Alle Funktionen – gruppiert */}
      <Section id="alle-funktionen" className="scroll-mt-20">
        <SectionHeading
          eyebrow="Alle Funktionen"
          title="Alles an seinem Platz."
          intro="Jede Funktion gehört zu einem Arbeitsschritt. Unter jeder Funktion siehst du, was darin steckt."
        />
        <div className="mt-12 grid gap-14">
          {gruppen.map((g) => (
            <div key={g.id} id={g.id} className="grid scroll-mt-24 gap-6 border-t border-line pt-10 lg:grid-cols-[18rem_1fr] lg:gap-10">
              <div>
                <IconTile name={gruppenIcons[g.id]} tone="ink" />
                <h3 className="mt-4 font-display text-2xl font-extrabold">{g.titel}</h3>
                <p className="mt-2 text-muted">{g.beschreibung}</p>
                <p className="mt-3 text-sm font-semibold text-ink-soft">{g.slugs.length} Funktionen</p>
              </div>
              <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {g.slugs.map((s) => (
                  <li key={s}>
                    <FunktionKarte slug={s} mitUnterpunkten />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* Macher erledigt */}
      <Section tone="ink" id="macher" className="scroll-mt-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="mb-3 text-sm font-semibold font-tagline uppercase tracking-[0.06em] text-accent">
              {funktionGruppen.macher.titel}
            </p>
            <h2 className="font-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl">
              Arbeit, die automatisch erledigt wird.
            </h2>
            <p className="mt-5 max-w-md text-lg text-white/70">{funktionGruppen.macher.beschreibung}</p>
            <Link
              href={funktionHref("automatisch-erledigen")}
              className="mt-8 inline-flex items-center gap-1.5 font-bold text-accent underline decoration-2 underline-offset-4 hover:text-white"
            >
              Was Macher automatisch erledigt <Icon name="arrow-right" className="size-4" />
            </Link>
          </div>
          <ul className="grid content-start gap-3 sm:grid-cols-2">
            {macherAufgaben.map((a) => (
              <li key={a.titel}>
                <Link
                  href={funktionHref(a.funktion)}
                  className="flex items-center gap-3 karte-dunkel p-4 transition hover:bg-white/10"
                >
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md icon-kachel">
                    <Icon name={a.icon} className="size-5" />
                  </span>
                  <span className="font-semibold leading-snug">{a.titel}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* 4. Verbindungen zeigen */}
      <Section tone="white">
        <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <SectionHeading
              eyebrow="Alles verbunden"
              title="Ein Auftrag verbindet alles."
              intro="Kunde, Termin, Mitarbeiter, Material, Fotos, Zeiten und Rechnung hängen am selben Auftrag. Was einmal erfasst ist, muss keiner mehr abtippen."
            />
            <ul className="mt-8 grid gap-3">
              {verbindungen.map((v) => (
                <li key={v} className="flex gap-3">
                  <Icon name="link" className="mt-0.5 size-5 shrink-0 text-signal-dark" />
                  <span className="leading-relaxed">{v}</span>
                </li>
              ))}
            </ul>
            <ArrowLink href={funktionHref("auftraege")} className="mt-8">
              Aufträge ansehen
            </ArrowLink>
          </div>
          <VerbindungsDiagramm />
        </div>
      </Section>

      {/* 5. Gewerkspezifische Anpassung */}
      <Section tone="sand">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <SectionHeading
              eyebrow="Für dein Gewerk"
              title="Passend zu deinem Gewerk eingerichtet."
              intro="Macher OS richtet Funktionen und Abläufe passend zu deinem Gewerk ein – mit den Begriffen, Vorlagen und Checklisten, die du kennst."
            />
            <ButtonLink href="/gewerke" variant="secondary" className="mt-8">
              Mein Gewerk ansehen <Icon name="arrow-right" className="size-4" />
            </ButtonLink>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {topGewerke.map((g) => (
              <li key={g.slug}>
                <Link
                  href={gewerkHref(g.slug)}
                  className="group flex h-full flex-col rounded-lg bg-white p-4 ring-1 ring-line transition hover:ring-ink/40"
                >
                  <span className="font-display font-bold">
                    {g.titel}
                    <Icon
                      name="arrow-right"
                      className="ml-1 inline size-4 -translate-y-px text-signal-dark transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                  <span className="mt-1 text-sm text-muted">{gewerkBeispiele[g.slug]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* FAQ */}
      <Section containerSize="narrow">
        <SectionHeading title="Häufige Fragen zu den Funktionen" />
        <div className="mt-8">
          <Faq items={faq} />
        </div>
        <FaqJsonLd items={faq} />
        <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
          <ArrowLink href="/schnittstellen">Schnittstellen: DATEV, GAEB, Datanorm</ArrowLink>
          <ArrowLink href="/vergleich">Software-Vergleich</ArrowLink>
        </div>
      </Section>

      {/* 6. Final CTA */}
      <MissionMittelstandStreifen />

      <FinalCta />
    </>
  );
}
