import Link from "next/link";
import { PhoneMock } from "@/components/mocks";
import { FinalCta, PageHero } from "@/components/sections";
import {
  ArrowLink,
  Card,
  CheckList,
  Faq,
  FaqJsonLd,
  Icon,
  IconTile,
  Section,
  SectionHeading,
  type FaqItem,
  type IconName,
} from "@/components/ui";
import { QrPlatzhalter, StoreLink } from "@/components/unternehmen/AppDownload";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: "App für iPhone und Android",
  description:
    "Die Macher OS App für die Baustelle: nächster Einsatz, Navigation, Fotos, Spracheingabe, Zeiten, Material und Unterschrift – auch ohne Netz.",
  path: "/app",
});

const useCases: { titel: string; text: string; icon: IconName }[] = [
  { titel: "Morgens", text: "Einsätze des Tages ansehen: wer, wo, was – und ob das Material im Wagen ist.", icon: "calendar" },
  { titel: "Unterwegs", text: "Mit einem Tipp zur Baustelle navigieren. Kunde anrufen, falls es später wird.", icon: "route" },
  { titel: "Vor Ort", text: "Auftrag starten, Fotos machen, Notizen einsprechen, Material eintragen.", icon: "camera" },
  { titel: "Zum Schluss", text: "Unterschrift vom Kunden holen und abschließen. Das Büro sieht es sofort.", icon: "signature" },
];

const offline = [
  "Einsätze des Tages ansehen",
  "Zeiten starten und stoppen",
  "Fotos und Notizen erfassen",
  "Material eintragen",
  "Unterschrift einholen",
  "automatisch übertragen, sobald wieder Netz da ist",
];

const faq: FaqItem[] = [
  {
    frage: "Was kostet die App?",
    antwort: "Die App gehört zu Macher OS – du kaufst keine separate App. Was in deinem Tarif enthalten ist, siehst du auf der Preisseite.",
  },
  {
    frage: "Brauche ich ein bestimmtes Handy?",
    antwort: "Die App ist für aktuelle iPhones und Android-Handys gedacht. Ein Tablet geht auch.",
  },
  {
    frage: "Sehen Mitarbeiter in der App Preise?",
    antwort: "Nur wenn du es erlaubst. Was jemand sieht, legst du über Rollen und Rechte fest.",
  },
  {
    frage: "Wann ist die App in den Stores?",
    antwort:
      "Die Store-Links folgen hier, sobald die App verfügbar ist. Bis dahin kannst du Macher OS im Browser auf dem Handy nutzen.",
  },
];

export default function AppPage() {
  return (
    <>
      {/* 1. Hero */}
      <PageHero
        bild="alltag/baustelle"
        eyebrow="Die App"
        title="Dein Betrieb in der Hosentasche."
        intro="Für die Baustelle gemacht: große Knöpfe, wenig Text. Deine Leute sehen nur, was sie für den nächsten Einsatz brauchen."
        breadcrumbs={[{ label: "App" }]}
        visual={<PhoneMock />}
        actions={
          <>
            <StoreLink plattform="iphone" />
            <StoreLink plattform="android" />
          </>
        }
        trust={false}
      >
        <p className="mt-4 text-sm text-muted">
          Die App ist bald in den Stores. Bis dahin funktioniert Macher OS im Browser auf jedem Handy.
        </p>
      </PageHero>

      {/* 2./3. iPhone und Android */}
      <Section tone="white">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-paper p-8">
            <IconTile name="smartphone" tone="ink" />
            <h2 className="mt-5 font-display text-2xl font-extrabold">Für iPhone</h2>
            <p className="mt-2 text-muted">Läuft auf aktuellen iPhones. Mitteilungen, Kamera und Navigation sind direkt eingebunden.</p>
            <div className="mt-6">
              <StoreLink plattform="iphone" />
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-paper p-8">
            <IconTile name="smartphone" tone="moss" />
            <h2 className="mt-5 font-display text-2xl font-extrabold">Für Android</h2>
            <p className="mt-2 text-muted">Läuft auf aktuellen Android-Handys – auch auf robusten Baustellen-Geräten.</p>
            <div className="mt-6">
              <StoreLink plattform="android" />
            </div>
          </div>
        </div>
      </Section>

      {/* 4. Baustellen-Use-Cases */}
      <Section>
        <SectionHeading
          eyebrow="Ein Tag auf der Baustelle"
          title="Vom ersten Einsatz bis zum Feierabend."
          intro="Was früher Zettel, Anrufe und Fotos im privaten Handy waren, läuft jetzt über eine App."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {useCases.map((u) => (
            <Card key={u.titel} title={u.titel} icon={u.icon}>
              {u.text}
            </Card>
          ))}
        </div>
      </Section>

      {/* 5. Offline */}
      <Section tone="ink">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-semibold font-tagline uppercase tracking-[0.06em] text-accent">Offline</p>
            <h2 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
              Kein Netz im Keller? Kein Problem.
            </h2>
            <p className="mt-5 max-w-md text-lg text-white/70">
              Die wichtigsten Dinge gehen auch ohne Empfang. Sobald wieder Netz da ist, wird alles übertragen.
            </p>
            <Link
              href="/hilfe-center/offline-arbeiten"
              className="mt-8 inline-flex items-center gap-1.5 font-bold text-accent underline decoration-2 underline-offset-4 hover:text-white"
            >
              So funktioniert es offline <Icon name="arrow-right" className="size-4" />
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {offline.map((o) => (
              <li key={o} className="flex items-center gap-3 karte-dunkel p-4">
                <Icon name="check" className="size-5 shrink-0 text-accent" />
                <span className="font-semibold">{o}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* 6. Kamera / Sprache / Navigation */}
      <Section tone="white">
        <SectionHeading eyebrow="Eingebaut" title="Kamera, Sprache, Navigation." />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <Card title="Kamera" icon="camera">
            Fotos landen direkt am richtigen Auftrag – mit Datum. Nichts mehr im privaten Handyspeicher.
          </Card>
          <Card title="Sprache" icon="mic" iconTone="sky">
            Notizen einsprechen statt tippen. Praktisch mit Handschuhen oder dreckigen Händen.
          </Card>
          <Card title="Navigation" icon="map" iconTone="moss">
            Mit einem Tipp zur Baustelle – in der Navigations-App, die du sowieso nutzt.
          </Card>
        </div>
      </Section>

      {/* 7. QR-Code */}
      <Section>
        <div className="grid items-center gap-10 rounded-2xl border border-line bg-white p-8 sm:p-10 lg:grid-cols-[auto_1fr]">
          <QrPlatzhalter />
          <div>
            <h2 className="font-display text-2xl font-extrabold sm:text-3xl">Mit dem Handy scannen und loslegen.</h2>
            <p className="mt-3 max-w-xl text-muted">
              Sobald die App in den Stores ist, findest du hier einen QR-Code. Scannen, installieren, anmelden – fertig.
              Deine Mitarbeiter bekommen den Link automatisch mit ihrer Einladung.
            </p>
            <CheckList
              className="mt-6"
              items={["Einladung per SMS oder E-Mail", "Anmeldung mit eigenem Zugang", "nächster Einsatz sofort sichtbar"]}
            />
            <ArrowLink href="/hilfe-center/app-installieren" className="mt-6">
              Anleitung: App installieren
            </ArrowLink>
          </div>
        </div>
      </Section>

      <Section tone="white" containerSize="narrow">
        <SectionHeading title="Fragen zur App" />
        <div className="mt-8">
          <Faq items={faq} />
        </div>
        <FaqJsonLd items={faq} />
      </Section>

      {/* 8. CTA */}
      <FinalCta
        title="Büro und Baustelle in einem System."
        intro="Starte kostenlos, lade dein Team ein und sieh, wie viel Telefoniererei wegfällt."
      />
    </>
  );
}
