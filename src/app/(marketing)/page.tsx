import Link from "next/link";
import type { ReactNode } from "react";
import { WissenVignette, type WissenMotiv } from "@/components/sections/WissenVignette";
import { PhoneMock, PlanBoardMock, VorschauRahmen } from "@/components/mocks";
import {
  Ablauf,
  Alltag,
  DunkleHeadline,
  FinalCta,
  FotoBuehne,
  IntegrationenHighlight,
  KartenReihe,
  PlanCards,
  MissionMittelstand,
  ReihenKarte,
  StartHero,
  type KartenTon,
} from "@/components/sections";
import {
  BelegStapel,
  HandyAusschnitt,
  Hinweis,
  IconAussage,
  PlanAusschnitt,
  ZitatAnsicht,
} from "@/components/sections/ReihenAnsichten";
import {
  ArrowLink,
  Badge,
  ButtonLink,
  CheckList,
  Faq,
  FaqJsonLd,
  Fenster,
  Icon,
  IconTile,
  Karte3D,
  Section,
  SectionHeading,
  UiEbeneAktiv,
  UiStatus,
  type UiAktivZeile,
  Zone,
  type FaqItem,
  type IconName,
} from "@/components/ui";
import { gewerkBild } from "@/content/bilder";
import { topGewerkInhalte } from "@/content/gewerke";
import { kundenStories } from "@/content/kunden";
import { kernaengste, weitereEinwaende } from "@/content/einwaende";
import { testTage } from "@/content/preise";
import { kunden, topGewerke, type GewerkSlug } from "@/content/registry";
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
/** Jede Karte hat einen eigenen Ton und eine eigene Ansicht (Vorbild Feather) – nie vier gleiche Kacheln. */
const bereiche: { titel: string; text: string; href: string; inhalt: string[]; ton: KartenTon; ansicht: ReactNode }[] = [
  {
    titel: "Heute",
    text: "Was jetzt wichtig ist.",
    href: "/funktionen",
    inhalt: ["Dein nächster Schritt", "Braucht deine Entscheidung", "Heute im Betrieb"],
    ton: "hell",
    ansicht: (
      <HandyAusschnitt
        kopf="Heute"
        zeilen={[
          { text: "Angebot freigeben", icon: "file", status: "Neu" },
          { text: "Einsatz Lindenstraße", icon: "route" },
          { text: "Material bestellen", icon: "box" },
          { text: "Rechnung prüfen", icon: "euro" },
        ]}
      />
    ),
  },
  {
    titel: "Aufträge",
    text: "Alles rund um Kunden und Arbeit.",
    href: "/funktionen/auftraege",
    inhalt: ["Aufträge und Angebote", "Eingang mit neuen Anfragen", "Kunden und Service"],
    ton: "foto",
    ansicht: <Hinweis text="Angebot angenommen" schritte={["Auftrag angelegt", "Einsatz geplant", "Rechnung vorbereitet"]} className="inset-x-6 top-[42%]" />,
  },
  {
    titel: "Planen",
    text: "Was als Nächstes passiert.",
    href: "/funktionen/einsatzplanung",
    inhalt: ["Kalender und Plantafel", "Einplanen mit Vorschlag", "Kapazität im Team"],
    ton: "beige",
    ansicht: (
      <PlanAusschnitt
        objekt="zollstock"
        kopf="Diese Woche"
        zeilen={[
          { name: "Kevin", balken: [[0, 38, "voll"], [44, 30, "hell"]] },
          { name: "Lena", balken: [[10, 50, "voll"]] },
          { name: "Tom", balken: [[0, 22, "hell"], [28, 46, "voll"]] },
          { name: "Ayse", balken: [[18, 34, "voll"]] },
        ]}
      />
    ),
  },
  {
    titel: "Betrieb",
    text: "Mitarbeiter, Material, Geld und Unternehmen.",
    href: "/funktionen/mitarbeiter",
    inhalt: ["Geld: Rechnungen und Belege", "Team: Menschen und Zeiten", "Ausstattung und Unternehmen"],
    ton: "dunkel",
    ansicht: (
      <BelegStapel
        eintraege={[
          { titel: "Rechnung bezahlt", text: "Geld", icon: "euro" },
          { titel: "Stunden vom Handy", text: "Team", icon: "clock" },
          { titel: "Material im Lager", text: "Ausstattung", icon: "warehouse" },
        ]}
      />
    ),
  },
];

const gewerkIcons: Record<(typeof topGewerke)[number]["slug"], IconName> = {
  elektriker: "bolt",
  shk: "wrench",
  maler: "pen",
  fliesenleger: "layers",
  tischler: "ruler",
  dachdecker: "home",
  bau: "warehouse",
  galabau: "map",
};

const kundenFoto: Record<(typeof topGewerke)[number]["slug"], GewerkSlug> = {
  elektriker: "elektro-energie",
  shk: "shk-gebaeudetechnik",
  maler: "maler-boden-oberflaechen",
  fliesenleger: "maler-boden-oberflaechen",
  tischler: "holz-innenausbau",
  dachdecker: "dach-gebaeudehuelle",
  bau: "bau-rohbau",
  galabau: "garten-aussenanlagen",
};

/** Drei Ergebnisse, jeweils mit einer UI-Ebene zum Ausprobieren (Beispieldaten). */
const feierabend: { text: string; ort: string; zeilen: UiAktivZeile[] }[] = [
  {
    text: "Stundenzettel kommen vom Handy",
    ort: "Zeiten · Heute",
    zeilen: [
      {
        links: <b className="font-semibold">Max Berger · vom Handy</b>,
        rechts: <UiStatus>Zur Freigabe</UiStatus>,
        aktion: { label: "Freigeben", danach: <UiStatus ton="gut">Freigegeben</UiStatus>, meldung: "Stunden ins Zeitkonto übernommen" },
      },
      { links: "Sanierung Haus 24", rechts: <span className="font-semibold tabular-nums">7:45 Std.</span> },
      { links: "Fahrtzeit", rechts: <span className="font-semibold tabular-nums">0:30 Std.</span> },
    ],
  },
  {
    text: "Rechnungen sind vorbereitet",
    ort: "Rechnung · Entwurf",
    zeilen: [
      {
        links: <b className="font-semibold">Sanierung Haus 24</b>,
        rechts: <UiStatus>Zum Prüfen</UiStatus>,
        aktion: { label: "Prüfen & senden", danach: <UiStatus ton="gut">Gesendet</UiStatus>, meldung: "Rechnung an den Kunden geschickt" },
      },
      { links: "Stunden aus der App", rechts: <UiStatus>Übernommen</UiStatus> },
      { links: "Material vom Einsatz", rechts: <UiStatus>Übernommen</UiStatus> },
    ],
  },
  {
    text: "Offene Zahlungen im Blick",
    ort: "Zahlungen",
    zeilen: [
      { links: <b className="font-semibold">Rechnung Schulz</b>, rechts: <UiStatus ton="gut">Bezahlt</UiStatus> },
      { links: <b className="font-semibold">Rechnung Weber</b>, rechts: <UiStatus ton="warnung">Überfällig</UiStatus> },
      {
        links: "Erinnerung vorbereitet",
        rechts: <UiStatus>Wartet auf dich</UiStatus>,
        aktion: { label: "Senden", danach: <UiStatus ton="gut">Gesendet</UiStatus>, meldung: "Erinnerung an Weber verschickt" },
      },
    ],
  },
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

const wissen: { titel: string; text: string; href: string; icon: IconName; motiv?: WissenMotiv }[] = [
  { titel: "Blog", text: "Praxistipps fürs Handwerk", href: "/wissen/blog", icon: "book" },
  { titel: "Webinare", text: "Live und als Aufzeichnung", href: "/wissen/webinare", icon: "play", motiv: "webinare" },
  { titel: "Akademie", text: "Kurse für Chef und Team", href: "/wissen/akademie", icon: "award", motiv: "akademie" },
  { titel: "Vorlagen", text: "Direkt nutzbar", href: "/wissen/vorlagen", icon: "file", motiv: "vorlagen" },
  { titel: "Rechner", text: "Stundensatz, Angebot & mehr", href: "/werkzeuge", icon: "calculator", motiv: "rechner" },
  { titel: "Checklisten", text: "Nichts mehr vergessen", href: "/wissen/vorlagen", icon: "clipboard", motiv: "checklisten" },
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

      {/* 4. Vier Bereiche – Kartenreihe: jede Karte anders (Handy, Foto mit Hinweis, Plantafel, dunkle Belege) */}
      <Zone ton="weiss">
        <Section tone="transparent">
          <KartenReihe
            eyebrow="Vier Bereiche"
            titel="Alles da. Trotzdem einfach."
            nachsatz="Mehr musst du dir nicht merken."
          >
            {bereiche.map((b) => (
              <ReihenKarte
                key={b.titel}
                titel={b.titel}
                href={b.href}
                ton={b.ton}
                bild={b.ton === "foto" ? "gewerk/shk-gebaeudetechnik" : undefined}
                ansicht={b.ansicht}
                linkText={`${b.titel} ansehen`}
                details={
                  <>
                    <p>{b.text}</p>
                    <ul className="mt-4 space-y-2">
                      {b.inhalt.map((x) => (
                        <li key={x} className="flex items-center gap-2">
                          <Icon name="check" className="size-4 shrink-0 text-primary" /> {x}
                        </li>
                      ))}
                    </ul>
                  </>
                }
              />
            ))}
          </KartenReihe>
          <ArrowLink href="/funktionen" className="mt-8">
            Alle Funktionen ansehen
          </ArrowLink>
        </Section>
      </Zone>

      {/* 5. Gewerke – Kartenreihe: Fotos im Wechsel mit hellen Karten und Glas-Icons */}
      <Zone ton="dunkel">
        <Section tone="transparent">
          <KartenReihe
            dunkel
            eyebrow="Gewerke"
            titel="Für deinen Betrieb gemacht."
            nachsatz="Passend zu deinem Gewerk."
          >
            {topGewerke.map((g, n) => {
              // Wechsel: Foto · helle Karte mit Glas-Icon · Foto mit Hinweis · grüne Karte mit Glas-Icon
              const art = (["foto", "beige", "foto-hinweis", "gruen"] as const)[n % 4];
              const teaser = topGewerkInhalte[g.slug].teaser;
              return (
                <ReihenKarte
                  key={g.slug}
                  ton={art === "foto" || art === "foto-hinweis" ? "foto" : art}
                  titel={g.kurz}
                  href={`/gewerke/${g.slug}`}
                  bild={gewerkBild(g.slug)}
                  ansicht={
                    art === "foto-hinweis" ? (
                      <Hinweis text={`Vorlagen für ${g.kurz}`} className="left-6 top-8" />
                    ) : art === "beige" || art === "gruen" ? (
                      <IconAussage icon={gewerkIcons[g.slug]} text={teaser} />
                    ) : undefined
                  }
                  linkText={`Macher OS für ${g.kurz}`}
                  details={<p>{teaser}</p>}
                />
              );
            })}
          </KartenReihe>
          <Link
            href="/gewerke"
            className="mt-8 inline-flex items-center gap-1.5 font-bold text-accent underline decoration-2 underline-offset-4 hover:text-white"
          >
            Alle Gewerke <Icon name="arrow-right" className="size-4" />
          </Link>
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

      {/* 6b. Integrationen – Highlight mit echten Logos und den vier Säulen */}
      <IntegrationenHighlight />

      {/* 7. Feierabend statt Papierkram – alles in Boxen */}
      <Zone ton="weiss">
        <Section tone="transparent">
          <SectionHeading
            eyebrow="Feierabend statt Papierkram"
            title="Kein Küchentisch-Büro mehr am Abend."
            intro="Angebote, Stundenzettel, Rechnungen: Was früher abends liegen blieb, bereitet Macher OS tagsüber vor. Du prüfst und schickst ab."
          />
          <ul className="mt-10 grid gap-4 lg:grid-cols-3">
            {feierabend.map((p) => (
              <li key={p.text}>
                <Karte3D innen="group flex h-full flex-col gap-5 rounded-2xl bg-white p-5 ring-1 ring-line">
                  <UiEbeneAktiv ort={p.ort} zeilen={p.zeilen} />
                  <span className="font-display text-lg font-bold leading-snug text-ink">{p.text}</span>
                </Karte3D>
              </li>
            ))}
          </ul>
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

      {/* 10. Kunden – Kartenreihe im Wechsel Foto · Zitat dunkel · Zitat hell; alle Stories sind Beispiele und so markiert */}
      <Zone ton="weiss">
        <Section tone="transparent">
          <KartenReihe eyebrow="Kunden" titel="Von Machern für Macher." nachsatz="So arbeiten Betriebe wie deiner.">
            {kunden.map((k, n) => (
              <ReihenKarte
                key={k.slug}
                // Wechsel: Foto mit Ergebnis · dunkles Zitat · helles Zitat
                ton={(["foto", "dunkel", "beige"] as const)[n % 3]}
                titel={n % 3 === 0 ? k.ergebnis : k.betrieb}
                href={`/kunden/${k.slug}`}
                // Anderes Foto als in der Gewerke-Reihe, damit kein Bild doppelt auf der Seite steht
                bild={gewerkBild(kundenFoto[k.gewerk])}
                ansicht={
                  n % 3 === 0 ? undefined : (
                    <ZitatAnsicht
                      text={kundenStories[k.slug].zitat.text}
                      rolle={kundenStories[k.slug].zitat.rolle}
                      dunkel={n % 3 === 1}
                    />
                  )
                }
                marke={<Badge>Beispiel</Badge>}
                linkText="Story lesen"
                details={
                  <>
                    <p className="font-semibold text-ink">{n % 3 === 0 ? k.betrieb : k.ergebnis}</p>
                    <p className="text-muted">
                      {topGewerke.find((g) => g.slug === k.gewerk)!.kurz} · {k.mitarbeiter} Mitarbeiter · {k.ort}
                    </p>
                    <p className="mt-3">
                      Beispielgeschichte mit Symbolbild: Sie zeigt, wie ein typischer Betrieb mit Macher OS arbeitet.
                    </p>
                  </>
                }
              />
            ))}
          </KartenReihe>
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
              // Töne nach Bedeutung, nicht alle gleich: Blog dunkel (Hauptkachel), dann hellgrün, beige, weiß im Wechsel
              const ton = gross
                ? "bg-ink text-white lg:col-span-6 lg:row-span-2"
                : n === 1
                  ? "bg-signal-soft text-ink ring-1 ring-primary/15 lg:col-span-3"
                  : n === 2
                    ? "bg-beige text-ink ring-1 ring-beige-line lg:col-span-3"
                    : n === 3
                      ? "bg-white text-ink ring-1 ring-line lg:col-span-2"
                      : n === 4
                        ? "bg-beige text-ink ring-1 ring-beige-line lg:col-span-2"
                        : "bg-signal-soft text-ink ring-1 ring-primary/15 lg:col-span-2";
              return (
                <li
                  key={w.titel}
                  className={`${ton} ${gross ? "sm:col-span-2" : ""} rounded-2xl shadow-[inset_0_1px_0_rgb(255_255_255/70%),0_14px_30px_-22px_color-mix(in_srgb,var(--color-ink)_45%,transparent)] transition-shadow duration-200 hover:shadow-[inset_0_1px_0_rgb(255_255_255/70%),0_22px_40px_-22px_color-mix(in_srgb,var(--color-ink)_55%,transparent)]`}
                >
                  <Link
                    href={w.href}
                    className={`group relative flex h-full flex-col rounded-2xl p-6 transition-transform duration-150 ease-out hover:-translate-y-0.5 ${gross ? "min-h-64 lg:p-8" : "min-h-56"}`}
                  >
                    {gross ? (
                      <Fenster icon={w.icon} ton="dunkel" className="-mx-2 -mt-2" />
                    ) : (
                      <>
                        {w.motiv && <WissenVignette motiv={w.motiv} />}
                        <span className="absolute right-4 top-4 hidden size-8 items-center justify-center rounded-full bg-white/80 text-signal-dark opacity-0 ring-1 ring-line transition-[opacity,translate] duration-150 group-hover:translate-x-0.5 group-hover:opacity-100 group-focus-visible:opacity-100 sm:inline-flex">
                          <Icon name="arrow-up-right" className="size-4" />
                        </span>
                      </>
                    )}
                    <span className={`mt-auto pt-5 font-display font-bold leading-tight ${gross ? "text-4xl" : "text-xl"}`}>{w.titel}</span>
                    <span className={`mt-1 ${gross ? "text-lg text-white/75" : "text-muted"}`}>{w.text}</span>
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
