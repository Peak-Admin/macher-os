import Link from "next/link";
import { PhoneMock, PlanBoardMock, VorschauRahmen } from "@/components/mocks";
import {
  Ablauf,
  Alltag,
  BereichsKarte,
  DunkleHeadline,
  FinalCta,
  FotoBuehne,
  KundenCard,
  PlanCards,
  MissionMittelstand,
  StartHero,
} from "@/components/sections";
import {
  ArrowLink,
  Zone,
  ButtonLink,
  CheckList,
  Faq,
  FaqJsonLd,
  Icon,
  IconTile,
  Karte3D,
  Objekt,
  Section,
  SectionHeading,
  type FaqItem,
  type IconName,
} from "@/components/ui";
import { gewerkBild } from "@/content/bilder";
import { kernaengste, weitereEinwaende } from "@/content/einwaende";
import { testTage } from "@/content/preise";
import { kunden, topGewerke } from "@/content/registry";
import type { ObjektSchluessel } from "@/lib/objekte";
import { cta, herausgeber, site } from "@/lib/site";

export const metadata = {
  title: { absolute: `${site.name} – Dein Betrieb. Einfach im Griff.` },
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

/** Die vier Bereiche der Software – mit den Ansichten, die dort wirklich stehen. */
const bereiche: { titel: string; text: string; icon: IconName; objekt: ObjektSchluessel; href: string; inhalt: string[] }[] = [
  {
    titel: "Heute",
    text: "Was jetzt wichtig ist.",
    icon: "spark",
    objekt: "werkzeugwand",
    href: "/funktionen",
    inhalt: ["Dein nächster Schritt", "Braucht deine Entscheidung", "Heute im Betrieb"],
  },
  {
    titel: "Aufträge",
    text: "Alles rund um Kunden und Arbeit.",
    icon: "clipboard",
    objekt: "klemmbrett",
    href: "/funktionen/auftraege",
    inhalt: ["Aufträge und Angebote", "Eingang mit neuen Anfragen", "Kunden und Service"],
  },
  {
    titel: "Planen",
    text: "Was als Nächstes passiert.",
    icon: "calendar",
    objekt: "zollstock",
    href: "/funktionen/einsatzplanung",
    inhalt: ["Kalender und Plantafel", "Einplanen mit Vorschlag", "Kapazität im Team"],
  },
  {
    titel: "Betrieb",
    text: "Mitarbeiter, Material, Geld und Unternehmen.",
    icon: "home",
    objekt: "werkbank",
    href: "/funktionen/mitarbeiter",
    inhalt: ["Geld: Rechnungen und Belege", "Team: Menschen und Zeiten", "Ausstattung und Unternehmen"],
  },
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

const feierabend: { text: string; icon: IconName }[] = [
  { text: "Stundenzettel kommen vom Handy", icon: "smartphone" },
  { text: "Rechnungen sind vorbereitet", icon: "euro" },
  { text: "Offene Zahlungen im Blick", icon: "chart" },
];

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
    antwort: `Macher OS ist ein Projekt von ${herausgeber.name} – von Handwerkern für Handwerker. Gebaut aus dem Alltag echter Betriebe, nicht am Schreibtisch.`,
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
      {/* Alle Abschnitte sind Boxen im Wechsel dunkelgrün · beige · weiß (nach Peak One). Der Glas-Kopf liegt auf dem Hero. */}

      {/* 1. Hero – Text mittig, Einstieg per Google oder E-Mail, darunter fünf Kernelemente und die Software; rechts Matthias Aumann */}
      <StartHero />

      {/* 2. Dein Alltag – 3D-Karten mit Blick in die App */}
      <Alltag nachUeberhang />

      {/* 3. Ablauf – vier klickbare Schritte */}
      <Ablauf />

      {/* 4. Vier Bereiche */}
      <Zone ton="weiss">
        <Section tone="transparent">
          <SectionHeading
            eyebrow="Vier Bereiche"
            title="Alles da. Trotzdem einfach."
            intro="Macher OS ist in vier Bereiche aufgeteilt. Mehr musst du dir nicht merken."
          />
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {bereiche.map((b, n) => (
              <li key={b.titel}>
                <Karte3D href={b.href} innen="flex flex-col rounded-2xl border border-line bg-white p-6">
                  <Objekt objekt={b.objekt} className="-mx-2 -mt-2 mb-5" sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 90vw" />
                  <div className="flex items-center justify-between">
                    <IconTile name={b.icon} className="karte-3d-tief size-12" />
                    <span className="font-display text-sm font-bold tabular-nums text-muted">0{n + 1}</span>
                  </div>
                  <h3 className="mt-6 font-display text-2xl font-bold text-ink">{b.titel}</h3>
                  <p className="mt-1 text-muted">{b.text}</p>
                  <ul className="mt-5 flex-1 space-y-2 border-t border-line pt-4 text-[0.95rem]">
                    {b.inhalt.map((x) => (
                      <li key={x} className="flex items-center gap-2">
                        <Icon name="check" className="size-4 shrink-0 text-primary" /> {x}
                      </li>
                    ))}
                  </ul>
                  <span className="mt-5 inline-flex items-center gap-1.5 font-semibold text-signal-dark">
                    Ansehen <Icon name="arrow-right" className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                  </span>
                </Karte3D>
              </li>
            ))}
          </ul>
          <ArrowLink href="/funktionen" className="mt-8">
            Alle Funktionen ansehen
          </ArrowLink>
        </Section>
      </Zone>

      {/* 5. Gewerke */}
      <Zone ton="dunkel">
        <Section tone="transparent">
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
        </Section>
      </Zone>

      {/* 6. Büro und Baustelle */}
      <Zone ton="beige">
        <Section tone="transparent">
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
      </Zone>

      {/* 7. Feierabend statt Papierkram – alles in Boxen */}
      <Zone ton="weiss">
        <Section tone="transparent">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
            <SectionHeading
              eyebrow="Feierabend statt Papierkram"
              title="Kein Küchentisch-Büro mehr am Abend."
              intro="Angebote, Stundenzettel, Rechnungen: Was früher abends liegen blieb, bereitet Macher OS tagsüber vor. Du prüfst und schickst ab."
            />
            <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {feierabend.map((p) => (
                <li key={p.text}>
                  <Karte3D innen="flex h-full flex-col gap-4 rounded-2xl bg-beige p-5 ring-1 ring-beige-line">
                    <IconTile name={p.icon} className="karte-3d-tief size-11" />
                    <span className="font-display text-lg font-bold leading-snug text-ink">{p.text}</span>
                  </Karte3D>
                </li>
              ))}
            </ul>
          </div>
          <ArrowLink href="/funktionen/automatisch-erledigen" className="mt-8">
            So arbeitet Macher
          </ArrowLink>
        </Section>
      </Zone>

      {/* 8. Macher erledigt */}
      <Zone ton="dunkel">
        <Section tone="transparent">
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
                <li key={m.text}>
                  <Karte3D innen="flex items-center gap-3 karte-dunkel p-4" stark={8}>
                    <IconTile name={m.icon} className="karte-3d-tief size-10" />
                    <span className="font-semibold leading-snug">{m.text}</span>
                  </Karte3D>
                </li>
              ))}
            </ul>
          </div>
        </Section>
      </Zone>

      {/* 9. Planung */}
      <Zone ton="beige">
        <Section tone="transparent">
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
            <VorschauRahmen>
              <PlanBoardMock />
            </VorschauRahmen>
          </div>
        </Section>
      </Zone>

      {/* 10. Kunden */}
      <Zone ton="weiss">
        <Section tone="transparent">
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
      </Zone>

      {/* 11. Von Mission Mittelstand */}
      <MissionMittelstand />

      {/* 12. Einrichtung */}
      <Zone ton="beige">
        <Section tone="transparent">
          <div className="grid gap-12 lg:grid-cols-2">
            <div className="min-w-0">
              <SectionHeading
                eyebrow="Einrichtung"
                title="Dein Betrieb ist schon vorbereitet."
                intro="Beim Start beantwortest du eine Frage: Welcher Betrieb bist du? Den Rest richtet Macher OS für dich ein."
              />
              <ul className="mt-8 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
                {[
                  { titel: "Website angeben", text: "Macher liest Name, Logo, Gewerk und Leistungen aus.", icon: "link" as const },
                  { titel: "Keine Website?", text: "Dann tippst du einfach dein Gewerk an.", icon: "wrench" as const },
                ].map((w) => (
                  <li key={w.titel} className="flex items-start gap-3 rounded-xl bg-white p-4 ring-1 ring-line">
                    <Icon name={w.icon} className="mt-0.5 size-5 shrink-0 text-signal-dark" />
                    <span>
                      <span className="block font-semibold">{w.titel}</span>
                      <span className="block text-muted">{w.text}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-muted">Briefkopf, Kunden, Preise und Team fragt Macher erst, wenn du sie brauchst.</p>
            </div>
            <div className="min-w-0 rounded-2xl bg-ink p-6 text-white sm:p-8">
              <p className="font-display text-xl font-bold">Macher OS richtet automatisch ein:</p>
              <ul className="mt-5 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
                {["passende Funktionen", "Begriffe", "Vorlagen", "Abläufe", "Checklisten", "Schulungen"].map((x) => (
                  <li key={x} className="flex items-center gap-2">
                    <Icon name="check" className="size-4 text-accent" /> {x}
                  </li>
                ))}
              </ul>
              <p className="mt-6 border-t border-white/15 pt-5 text-white/75">
                Bestehende Kunden, Mitarbeiter und Artikel einfach übernehmen.
              </p>
              <ButtonLink href={cta.primary.href} size="lg" className="mt-7 w-full sm:w-auto sm:min-w-72">
                Kostenlos starten
              </ButtonLink>
            </div>
          </div>
        </Section>
      </Zone>

      {/* 12b. Bedenken – die fünf Kernängste als Karten, die nächsten fünf zum Aufklappen, alle unter /bedenken (docs/produkt/einwaende.md) */}
      <Zone ton="dunkel" id="bedenken">
        <Section tone="transparent">
          <p className="mb-3 text-sm font-semibold font-tagline uppercase tracking-[0.06em] text-accent">Bedenken</p>
          <h2 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
            Ehrliche Antworten auf deine Bedenken.
          </h2>
          <p className="mt-5 max-w-xl text-lg text-white/70">Das hören wir von Handwerkern am häufigsten, bevor sie anfangen.</p>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {kernaengste.map((k) => (
              <li key={k.angst} className="rounded-2xl bg-white p-6 text-ink">
                <p className="text-muted">„{k.angst}“</p>
                <p className="mt-3 flex items-start gap-3 font-display text-xl font-bold leading-snug">
                  <Icon name={k.icon} className="mt-0.5 size-6 shrink-0 text-primary" />
                  {k.antwort}
                </p>
                <p className="mt-2 leading-relaxed text-muted">{k.text}</p>
              </li>
            ))}
            <li className="flex flex-col justify-between rounded-2xl bg-ink-soft p-6 ring-1 ring-white/15">
              <div>
                <p className="font-display text-xl font-bold leading-snug">Überzeug dich selbst.</p>
                <p className="mt-2 leading-relaxed text-on-dark">
                  Mit deinem echten Betrieb. {testTage} Tage kostenlos, ohne Kreditkarte.
                </p>
              </div>
              <ButtonLink href={cta.primary.href} className="mt-6 self-start">
                {cta.primary.label}
              </ButtonLink>
            </li>
          </ul>
          <h3 className="mt-14 font-display text-2xl font-bold">Weitere Bedenken</h3>
          <div className="mt-6">
            <Faq items={weitereEinwaende} dark />
          </div>
          <ButtonLink href="/bedenken" variant="light" className="mt-6">
            Alle Bedenken ansehen und durchsuchen
          </ButtonLink>
        </Section>
      </Zone>

      {/* 13. Wissen – Bento */}
      <Zone ton="weiss">
        <Section tone="transparent">
          <SectionHeading eyebrow="Wissen" title="Wissen für deinen Betrieb." />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:grid-rows-2">
            {wissen.map((w, n) => {
              const gross = n === 0;
              const ton = gross
                ? "bg-ink text-white lg:col-span-6 lg:row-span-2"
                : n === 1
                  ? "bg-beige text-ink lg:col-span-3"
                  : n === 2
                    ? "bg-white text-ink lg:col-span-3"
                    : n === 3
                      ? "bg-white text-ink lg:col-span-2"
                      : n === 4
                        ? "bg-beige text-ink lg:col-span-2"
                        : "bg-white text-ink lg:col-span-2";
              const dunkel = gross;
              return (
                <li key={w.titel} className={`${ton} ${gross ? "sm:col-span-2" : ""} rounded-2xl ${dunkel ? "" : "ring-1 ring-beige-line"}`}>
                  <Link
                    href={w.href}
                    className={`group flex h-full flex-col rounded-2xl p-6 transition-transform duration-150 ease-out hover:-translate-y-0.5 ${gross ? "min-h-64 lg:p-8" : "min-h-44"}`}
                  >
                    <span
                      className={`inline-flex size-11 items-center justify-center rounded-xl ${
                        dunkel ? "bg-white/10 text-accent" : "bg-white text-signal-dark ring-1 ring-line"
                      }`}
                    >
                      <Icon name={w.icon} className="size-5" />
                    </span>
                    <span className={`mt-auto pt-6 font-display font-bold leading-tight ${gross ? "text-4xl" : "text-xl"}`}>{w.titel}</span>
                    <span className={`mt-1 ${dunkel ? "text-white/75" : "text-muted"} ${gross ? "text-lg" : ""}`}>{w.text}</span>
                    {gross && (
                      <span className="mt-6 inline-flex items-center gap-1.5 font-semibold text-accent">
                        Zum Blog <Icon name="arrow-right" className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
          <ArrowLink href="/wissen" className="mt-8">
            Wissen entdecken
          </ArrowLink>
        </Section>
      </Zone>

      {/* 14. Preise */}
      <Zone ton="beige">
        <Section tone="transparent">
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
      </Zone>

      {/* 15. Häufige Fragen – dunkelgrüne Box */}
      <Zone ton="dunkel">
        <Section tone="transparent" containerSize="narrow">
          <DunkleHeadline gruen="Häufige" rest="Fragen" />
          <div className="mt-10">
            <Faq items={faq} dark />
          </div>
          <FaqJsonLd items={faq} />
        </Section>
      </Zone>

      {/* 16. Jetzt starten – weiße Box; danach die grüne Footer-Box */}
      <FinalCta />
    </>
  );
}
