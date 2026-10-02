import { KundenFilter } from "@/components/kunden/KundenFilter";
import { FinalCta, KundenCard, PageHero } from "@/components/sections";
import { ArrowLink, Faq, FaqJsonLd, Icon, IconTile, Section, SectionHeading, type FaqItem, type IconName } from "@/components/ui";
import { funktionTitel, groessen, kundenUebersicht, type Groesse } from "@/content/kunden";
import { gewerkCluster, kunden, topGewerke, type FunktionSlug, type KundeSlug } from "@/content/registry";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: "Kunden – So arbeiten Handwerksbetriebe mit Macher OS",
  description:
    "Beispielgeschichten aus Elektro, SHK, Maler, Tischler, Dach und GaLaBau: So organisieren Handwerksbetriebe Aufträge, Planung und Büroarbeit mit Macher OS.",
  path: "/kunden",
});

const fakten: { titel: string; text: string; icon: IconName }[] = [
  {
    titel: "Für Betriebe von 1 bis 50 Leuten",
    text: "Vom Ein-Mann-Betrieb bis zum Betrieb mit eigenem Büro und mehreren Kolonnen.",
    icon: "users",
  },
  {
    titel: `${topGewerke.length} beliebte Gewerke, ${gewerkCluster.length} weitere Bereiche`,
    text: "Begriffe, Vorlagen und Abläufe passen sich an dein Gewerk an.",
    icon: "wrench",
  },
  {
    titel: "Büro und Baustelle",
    text: "Im Browser fürs Büro, als App für iPhone und Android auf der Baustelle.",
    icon: "smartphone",
  },
];

const faq: FaqItem[] = [
  {
    frage: "Sind das echte Kunden?",
    antwort:
      "Noch nicht. Die Geschichten auf dieser Seite sind Beispiele. Sie zeigen, wie ein typischer Betrieb mit Macher OS arbeitet. Echte Kundenstories veröffentlichen wir, sobald Betriebe sie freigegeben haben.",
  },
  {
    frage: "Passt Macher OS auch zu meinem Gewerk?",
    antwort:
      "Macher OS ist für fast alle Handwerksbetriebe gemacht. Beim Start wählst du dein Gewerk und deine Leistungen – danach sind Begriffe, Vorlagen und Abläufe passend eingerichtet.",
  },
  {
    frage: "Kann ich meine eigene Geschichte erzählen?",
    antwort:
      "Gern. Wenn du Macher OS nutzt und erzählen möchtest, wie dein Betrieb damit arbeitet, schreib uns über die Kontaktseite.",
  },
];

export default function KundenPage() {
  const eintraege = kundenUebersicht();
  const gewerkOptionen = topGewerke
    .filter((g) => eintraege.some((e) => e.gewerk === g.slug))
    .map((g) => ({ value: g.slug, label: g.titel }));
  const groessenOptionen = (Object.keys(groessen) as Groesse[]).map((g) => ({ value: g, label: groessen[g].label }));
  const genutzt = [...new Set(eintraege.flatMap((e) => e.funktionen))] as FunktionSlug[];
  const funktionOptionen = genutzt
    .map((f) => ({ value: f, label: funktionTitel(f) }))
    .sort((a, b) => a.label.localeCompare(b.label, "de"));

  return (
    <>
      <PageHero
        bild="seite/kunden"
        breadcrumbs={[{ label: "Kunden" }]}
        eyebrow="Kunden"
        title="So arbeiten andere Handwerksbetriebe mit Macher OS."
        intro="Wie kommen Anfragen rein? Wer plant die Woche? Wann geht die Rechnung raus? Diese Geschichten zeigen typische Betriebe und wie sie ihren Alltag mit Macher OS organisieren."
      />

      {/* Social Proof ohne erfundene Zahlen */}
      <Section tone="white" tight>
        <ul className="grid gap-4 md:grid-cols-3">
          {fakten.map((f) => (
            <li key={f.titel} className="flex gap-4 rounded-xl border border-line bg-paper p-6">
              <IconTile name={f.icon} />
              <div>
                <p className="font-display text-lg font-bold leading-snug">{f.titel}</p>
                <p className="mt-1.5 text-[0.95rem] leading-relaxed text-muted">{f.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {/* Filter + Kundenstories */}
      <Section>
        <SectionHeading
          eyebrow="Geschichten"
          title="Finde einen Betrieb wie deinen."
          intro="Filtere nach Gewerk, Betriebsgröße oder der Funktion, die dich interessiert."
        />
        <p className="mt-6 flex max-w-3xl items-start gap-2.5 rounded-xl bg-sand px-4 py-3 text-sm text-ink-soft">
          <Icon name="bell" className="mt-0.5 size-4 shrink-0 text-signal-dark" />
          <span>
            <b>Hinweis:</b> Alle Geschichten sind Beispiele und zeigen, wie ein typischer Betrieb mit Macher OS arbeitet.
            Echte Kundenstories folgen.
          </span>
        </p>
        <div className="mt-8">
          <KundenFilter
            eintraege={eintraege}
            gewerke={gewerkOptionen}
            groessen={groessenOptionen}
            funktionen={funktionOptionen}
            karten={
              Object.fromEntries(kunden.map((k) => [k.slug, <KundenCard key={k.slug} slug={k.slug} />])) as Record<
                KundeSlug,
                React.ReactNode
              >
            }
          />
        </div>
      </Section>

      {/* Dein Gewerk */}
      <Section tone="sand" tight>
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              Dein Gewerk ist nicht dabei?
            </h2>
            <p className="mt-2 text-muted">
              Macher OS passt sich an viele Gewerke an – von Metall über Fahrzeug bis Gebäude-Service.
            </p>
          </div>
          <ArrowLink href="/gewerke">Alle Gewerke ansehen</ArrowLink>
        </div>
      </Section>

      <Section containerSize="narrow">
        <SectionHeading title="Häufige Fragen" />
        <div className="mt-8">
          <Faq items={faq} />
        </div>
        <FaqJsonLd items={faq} />
        <ArrowLink href="/kontakt" className="mt-8">
          Eigene Geschichte erzählen
        </ArrowLink>
      </Section>

      <FinalCta
        title="Schreib deine eigene Geschichte."
        intro="Starte kostenlos und richte Macher OS in wenigen Minuten für deinen Betrieb ein."
      />
    </>
  );
}
