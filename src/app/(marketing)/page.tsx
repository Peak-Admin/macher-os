import Link from "next/link";
import { PhoneMock, PlanBoardMock, ProductMock } from "@/components/mocks";
import {
  BereichsKarte,
  BildKarten,
  BildText,
  DunkleHeadline,
  DunklerAbschnitt,
  FinalCta,
  FotoBuehne,
  Flow,
  KundenCard,
  PlanCards,
  MissionMittelstand,
  TrustRow,
} from "@/components/sections";
import {
  ArrowLink,
  ButtonLink,
  Card,
  CheckList,
  Container,
  Faq,
  FaqJsonLd,
  Icon,
  Section,
  SectionHeading,
  type FaqItem,
  type IconName,
} from "@/components/ui";
import { Chevrons, Foto } from "@/components/ui/Foto";
import { gewerkBild } from "@/content/bilder";
import { kunden, topGewerke } from "@/content/registry";
import { cta, herausgeber, site } from "@/lib/site";

export const metadata = {
  title: { absolute: `${site.name} – Dein Betrieb. Eine Software.` },
  description: site.description,
  alternates: { canonical: "/" },
};

const machtMacher: { text: string; icon: IconName }[] = [
  { text: "nimmt Kundenanfragen auf", icon: "phone" },
  { text: "findet passende Termine", icon: "calendar" },
  { text: "plant Mitarbeiter", icon: "users" },
  { text: "erkennt fehlendes Material", icon: "box" },
  { text: "bereitet Angebote vor", icon: "file" },
  { text: "erinnert an offene Aufgaben", icon: "bell" },
  { text: "erstellt Dokumentation", icon: "camera" },
  { text: "bereitet Rechnungen vor", icon: "euro" },
  { text: "verfolgt offene Zahlungen", icon: "chart" },
];

const bereiche: { titel: string; text: string; icon: IconName; href: string }[] = [
  { titel: "Heute", text: "Was jetzt wichtig ist.", icon: "home", href: "/funktionen" },
  { titel: "Aufträge", text: "Alles rund um Kunden und Arbeit.", icon: "clipboard", href: "/funktionen/auftraege" },
  { titel: "Plan", text: "Was als Nächstes passiert.", icon: "calendar", href: "/funktionen/einsatzplanung" },
  { titel: "Betrieb", text: "Mitarbeiter, Material, Geld und Unternehmen.", icon: "layers", href: "/funktionen/mitarbeiter" },
];

const gewerkIcons: Record<string, IconName> = {
  elektriker: "bolt",
  shk: "wrench",
  maler: "pen",
  fliesenleger: "layers",
  tischler: "ruler",
  dachdecker: "home",
  bau: "warehouse",
  galabau: "map",
};

const mobil = [
  "nächster Einsatz",
  "Navigation",
  "Auftrag starten",
  "Foto aufnehmen",
  "Spracheingabe",
  "Material erfassen",
  "Unterschrift",
  "Auftrag abschließen",
];

const planung = ["Termine", "Mitarbeiter", "Qualifikationen", "Urlaub", "Fahrtzeiten", "Material", "Werkzeuge", "Fahrzeuge"];

const wissen: { titel: string; text: string; href: string; icon: IconName }[] = [
  { titel: "Blog", text: "Praxistipps fürs Handwerk", href: "/wissen/blog", icon: "book" },
  { titel: "Webinare", text: "Live und als Aufzeichnung", href: "/wissen/webinare", icon: "play" },
  { titel: "Akademie", text: "Kurse für Chef und Team", href: "/wissen/akademie", icon: "award" },
  { titel: "Vorlagen", text: "Direkt nutzbar", href: "/wissen/vorlagen", icon: "file" },
  { titel: "Rechner", text: "Stundensatz, Angebot & mehr", href: "/werkzeuge", icon: "calculator" },
  { titel: "Checklisten", text: "Nichts mehr vergessen", href: "/wissen/vorlagen", icon: "clipboard" },
];

const faq: FaqItem[] = [
  {
    frage: "Wer steckt hinter Macher OS?",
    antwort: `Macher OS ist ein Joint-Venture-Projekt von ${herausgeber.name}. ${herausgeber.name} berät Handwerksbetriebe und Mittelständler – diese Erfahrung steckt in Macher OS.`,
  },
  {
    frage: "Für welche Gewerke ist Macher OS geeignet?",
    antwort:
      "Für fast alle Handwerksbetriebe – von Elektro, SHK, Maler und Tischler bis Dach, Bau und GaLaBau. Beim Start wählst du dein Gewerk, und Macher OS richtet Begriffe, Vorlagen und Abläufe passend ein.",
  },
  {
    frage: "Muss mein Team technisch versiert sein?",
    antwort:
      "Nein. Jeder sieht nur das, was er für seine Arbeit braucht. Wer ein Smartphone bedienen kann, kann auch Macher OS bedienen.",
  },
  {
    frage: "Gibt es eine App?",
    antwort:
      "Ja, für iPhone und Android. Mitarbeiter sehen dort ihren nächsten Einsatz, machen Fotos, erfassen Zeiten und Material und holen die Unterschrift beim Kunden ein.",
  },
  {
    frage: "Kann ich bestehende Daten übernehmen?",
    antwort:
      "Ja. Kunden, Mitarbeiter und Artikel kannst du einfach importieren. Bei Bedarf helfen wir dir persönlich beim Umstieg.",
  },
  {
    frage: "Funktioniert Macher OS auch unterwegs?",
    antwort:
      "Ja. Macher OS läuft im Browser und als App. Wichtige Funktionen gehen auch ohne Netz und werden synchronisiert, sobald wieder Empfang da ist.",
  },
  {
    frage: "Können Mitarbeiter unterschiedliche Rechte bekommen?",
    antwort:
      "Ja. Du legst fest, wer was sehen und bearbeiten darf – zum Beispiel sehen Monteure keine Preise, das Büro aber schon.",
  },
  {
    frage: "Kann ich kostenlos starten?",
    antwort: "Ja. Du kannst Macher OS kostenlos testen – ohne Kreditkarte und ohne Verpflichtung.",
  },
  {
    frage: "Wie funktioniert die automatische Planung?",
    antwort:
      "Macher schaut auf Termine, freie Mitarbeiter, Qualifikationen, Urlaub, Fahrtzeiten und Material und schlägt dir den passenden Einsatz vor. Du bestätigst nur noch – oder änderst, was du anders willst.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* 1. Hero – dunkel, Foto, Pfeilmotiv */}
      <section className="relative isolate overflow-hidden bg-ink text-white">
        <div className="relative h-72 sm:h-96 lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[60%]">
          <Foto bild="start/hero" preload sizes="(min-width: 1024px) 60vw, 100vw" />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-ink/10 lg:bg-gradient-to-r lg:from-ink lg:via-ink/50 lg:to-ink/0"
          />
        </div>
        <Chevrons className="absolute bottom-24 right-[6%] hidden h-[55%] max-h-[24rem] text-brand/80 mix-blend-screen lg:block" />
        <Container className="relative -mt-20 pb-36 sm:-mt-24 lg:mt-0 lg:pb-52 lg:pt-28">
          <div className="max-w-2xl">
            <p className="mb-5 text-sm font-semibold font-tagline uppercase tracking-[0.06em] text-accent">
              Von {herausgeber.name} · Das Betriebssystem für Handwerker
            </p>
            <h1 className="font-display text-5xl font-black uppercase leading-[0.95] tracking-tight text-balance sm:text-6xl lg:text-7xl">
              Dein Betrieb.
              <br />
              <span className="text-accent">Eine Software.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80 sm:text-xl">
              Aufträge, Mitarbeiter, Planung und Büroarbeit in einem einfachen Betriebssystem für Handwerker.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={cta.primary.href} size="lg" variant="onDark">
                {cta.primary.label}
              </ButtonLink>
              <ButtonLink href={cta.secondary.href} variant="light" size="lg">
                <Icon name="play" className="size-4" /> {cta.secondary.label}
              </ButtonLink>
            </div>
            <TrustRow dark className="mt-6" />
          </div>
        </Container>
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-brand" />
      </section>

      {/* 2. Produktbeweis ragt aus dem Hero + kompletter Ablauf */}
      <section className="bg-white pb-16 sm:pb-24">
        <Container>
          <div className="relative z-10 -mt-28 lg:-mt-40">
            <div className="mx-auto max-w-5xl">
              <ProductMock />
            </div>
          </div>
          <div className="mt-16 grid gap-8">
            <SectionHeading
              title="Vom ersten Anruf bis zur bezahlten Rechnung."
              intro="Macher OS hält alle Informationen zusammen und übernimmt möglichst viel Organisation dazwischen."
            />
            <Flow items={["Anfrage", "Angebot", "Termin", "Arbeit", "Rechnung", "Bezahlt"]} />
          </div>
        </Container>
      </section>

      {/* 2b. So läuft's – Bildkarten-Reihe */}
      <BildKarten
        eyebrow="Dein Alltag"
        gruen="So läuft's"
        rest="mit Macher OS"
        intro="Vier Momente aus jedem Handwerksbetrieb – und was Macher OS dabei für dich übernimmt."
        karten={[
          {
            bild: "alltag/anfrage",
            titel: "Anfrage",
            text: "Der Kunde ruft an. Macher legt die Anfrage an und schlägt einen Termin vor.",
            href: "/funktionen/anfragen",
          },
          {
            bild: "alltag/planung",
            titel: "Planung",
            text: "Jeder weiß morgens, wo er hinfährt und was er mitnehmen muss.",
            href: "/funktionen/einsatzplanung",
          },
          {
            bild: "alltag/baustelle",
            titel: "Baustelle",
            text: "Fotos, Zeiten und Material landen direkt im Auftrag – vom Handy.",
            href: "/funktionen/dokumentation",
          },
          {
            bild: "alltag/abnahme",
            titel: "Abnahme",
            text: "Unterschrift vor Ort. Die Rechnung ist vorbereitet, bevor du wieder im Auto sitzt.",
            href: "/funktionen/rechnungen",
          },
        ]}
      />

      {/* 4. Vier Bereiche */}
      <Section>
        <SectionHeading
          eyebrow="Vier Bereiche"
          title="Alles da. Trotzdem einfach."
          intro="Macher OS ist in vier Bereiche aufgeteilt. Mehr musst du dir nicht merken."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {bereiche.map((b) => (
            <Card key={b.titel} title={b.titel} icon={b.icon} href={b.href}>
              {b.text}
            </Card>
          ))}
        </div>
        <ArrowLink href="/funktionen" className="mt-8">
          Alle Funktionen ansehen
        </ArrowLink>
      </Section>

      {/* 5. Gewerke – Hochkant-Karten mit Fotos */}
      <DunklerAbschnitt hintergrund="Gewerke">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <DunkleHeadline
            eyebrow="Gewerke"
            gruen="Für deinen Betrieb"
            rest="gemacht."
            intro="Wähle dein Gewerk – Macher OS passt Begriffe, Vorlagen und Abläufe an."
          />
          <Link
            href="/gewerke"
            className="inline-flex items-center gap-1.5 font-bold text-accent underline decoration-2 underline-offset-4 hover:text-white"
          >
            Alle Gewerke <Icon name="arrow-right" className="size-4" />
          </Link>
        </div>
        <ul className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {topGewerke.map((g) => (
            <li key={g.slug}>
              <BereichsKarte
                href={`/gewerke/${g.slug}`}
                bild={gewerkBild(g.slug)}
                titel={g.kurz}
                icon={gewerkIcons[g.slug] ?? "wrench"}
              />
            </li>
          ))}
        </ul>
      </DunklerAbschnitt>

      {/* 6. Mobiles Arbeiten – Handy vor Baustellenfoto */}
      <Section tone="white">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div className="order-2 min-w-0 lg:order-1">
            <FotoBuehne bild="alltag/handy">
              <PhoneMock />
            </FotoBuehne>
          </div>
          <div className="order-1 lg:order-2">
            <SectionHeading
              eyebrow="Büro und Baustelle"
              title="Gemacht für Büro und Baustelle."
              intro="Der Mitarbeiter sieht nur, was er für seinen nächsten Einsatz braucht."
            />
            <CheckList items={mobil} columns={2} className="mt-8" />
            <ArrowLink href="/app" className="mt-8">
              Zur App
            </ArrowLink>
          </div>
        </div>
      </Section>

      {/* 6b. Alltagssituation */}
      <BildText bild="alltag/buero" seite="rechts" tone="paper">
        <SectionHeading
          eyebrow="Feierabend statt Papierkram"
          title="Kein Küchentisch-Büro mehr am Abend."
          intro="Angebote, Stundenzettel, Rechnungen: Was früher abends liegen blieb, bereitet Macher OS tagsüber vor. Du prüfst und schickst ab."
        />
        <CheckList
          items={["Stundenzettel kommen vom Handy", "Rechnungen sind vorbereitet", "Offene Zahlungen im Blick"]}
          className="mt-8"
        />
        <ArrowLink href="/funktionen/automatisch-erledigen" className="mt-8">
          So arbeitet Macher
        </ArrowLink>
      </BildText>

      {/* 3. Macher erledigt die Büroarbeit */}
      <Section tone="ink">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <p className="mb-3 text-sm font-semibold font-tagline uppercase tracking-[0.06em] text-accent">Macher erledigt</p>
            <h2 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
              Weniger organisieren. Mehr machen.
            </h2>
            <p className="mt-5 max-w-md text-lg text-white/70">
              Macher OS übernimmt die Büroarbeit, die sonst abends am Küchentisch liegen bleibt.
            </p>
            <Link
              href="/funktionen/automatisch-erledigen"
              className="mt-8 inline-flex items-center gap-1.5 font-bold text-accent underline decoration-2 underline-offset-4 hover:text-white"
            >
              So arbeitet Macher <Icon name="arrow-right" className="size-4" />
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {machtMacher.map((m) => (
              <li key={m.text} className="flex items-center gap-3 rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg icon-kachel">
                  <Icon name={m.icon} className="size-5" />
                </span>
                <span className="font-semibold leading-snug">{m.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* 7. Planung */}
      <Section>
        <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <SectionHeading
              eyebrow="Planung"
              title="Macher plant mit."
              intro="Macher schlägt dir vor, wer wann wohin fährt – und denkt dabei an alles, was du sonst im Kopf haben musst."
            />
            <ul className="mt-8 flex flex-wrap gap-2">
              {planung.map((p) => (
                <li key={p} className="rounded bg-white px-3.5 py-1.5 text-sm font-semibold ring-1 ring-line">
                  {p}
                </li>
              ))}
            </ul>
            <ArrowLink href="/funktionen/einsatzplanung" className="mt-8">
              Einsatzplanung ansehen
            </ArrowLink>
          </div>
          <PlanBoardMock />
        </div>
      </Section>

      {/* 8. Kundenbeweise */}
      <Section tone="white">
        <SectionHeading eyebrow="Kunden" title="Von Machern für Macher." />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kunden.slice(0, 3).map((k) => (
            <KundenCard key={k.slug} slug={k.slug} />
          ))}
        </div>
        <ArrowLink href="/kunden" className="mt-8">
          Alle Kunden ansehen
        </ArrowLink>
      </Section>

      {/* 9a. Von Mission Mittelstand */}
      <MissionMittelstand />

      {/* 9. Einrichtung */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Einrichtung"
              title="Dein Betrieb ist schon vorbereitet."
              intro="Beim Start beantwortest du vier kurze Fragen. Den Rest richtet Macher OS für dich ein."
            />
            <ol className="mt-8 grid grid-cols-2 gap-3">
              {["Gewerk", "Leistungen", "Arbeitsweise", "Teamgröße"].map((s, i) => (
                <li key={s} className="flex items-center gap-3 rounded-xl bg-white p-4 ring-1 ring-line">
                  <span className="font-display text-sm font-extrabold text-signal-dark">{i + 1}</span>
                  <span className="font-semibold">{s}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-2xl bg-ink p-8 text-white">
            <p className="font-display text-xl font-bold">Macher OS richtet automatisch ein:</p>
            <ul className="mt-5 grid grid-cols-2 gap-3">
              {["passende Funktionen", "Begriffe", "Vorlagen", "Abläufe", "Checklisten", "Schulungen"].map((x) => (
                <li key={x} className="flex items-center gap-2">
                  <Icon name="check" className="size-4 text-accent" /> {x}
                </li>
              ))}
            </ul>
            <p className="mt-6 border-t border-white/15 pt-5 text-white/75">
              Bestehende Kunden, Mitarbeiter und Artikel einfach übernehmen.
            </p>
            <ButtonLink href={cta.primary.href} variant="onDark" className="mt-6">
              Kostenlos starten <Icon name="arrow-right" className="size-4" />
            </ButtonLink>
          </div>
        </div>
      </Section>

      {/* 10. Wissen & Werkzeuge */}
      <Section tone="sand">
        <SectionHeading eyebrow="Wissen" title="Wissen, das deinen Betrieb besser macht." />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wissen.map((w) => (
            <Card key={w.titel} title={w.titel} icon={w.icon} iconTone="sky" href={w.href}>
              {w.text}
            </Card>
          ))}
        </div>
        <ArrowLink href="/wissen" className="mt-8">
          Wissen entdecken
        </ArrowLink>
      </Section>

      {/* 11. Preise */}
      <Section tone="white">
        <SectionHeading
          eyebrow="Preise"
          title="Einfacher Preis. Keine Überraschungen."
          intro="Ein Preis für deinen ganzen Betrieb. Monatlich kündbar."
        />
        <div className="mt-12">
          <PlanCards />
        </div>
        <ArrowLink href="/preise" className="mt-8">
          Alle Preise ansehen
        </ArrowLink>
      </Section>

      {/* 12. FAQ – dunkel */}
      <Section tone="ink" containerSize="narrow">
        <DunkleHeadline gruen="Häufige" rest="Fragen" />
        <div className="mt-10">
          <Faq items={faq} dark />
        </div>
        <FaqJsonLd items={faq} />
      </Section>

      {/* 13. Final CTA */}
      <FinalCta />
    </>
  );
}
