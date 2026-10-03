import Link from "next/link";
import { FinalCta, PageHero } from "@/components/sections";
import { Icon, IconTile, Section, SectionHeading } from "@/components/ui";
import { WebinarKarte } from "@/components/wissen/WebinarKarte";
import { topGewerke } from "@/content/registry";
import { gewerkIcons, themaTitel, themen } from "@/content/wissen/themen";
import { sprecherRollen, webinare, webinarHref } from "@/content/wissen/webinare";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: "Webinare für Handwerksbetriebe",
  description:
    "Kostenlose Webinare zu E-Rechnung, Kalkulation, Einsatzplanung, KI und Handwerk OS – als Aufzeichnung oder demnächst live.",
  path: "/wissen/webinare",
});

export default function WebinareHubPage() {
  const kommend = webinare.filter((w) => w.status === "demnaechst");
  const aufzeichnungen = webinare.filter((w) => w.status === "aufzeichnung");
  const genutzteThemen = themen.filter((t) => webinare.some((w) => w.themen.includes(t.slug)));

  return (
    <>
      {/* 1. Hero */}
      <PageHero
        breadcrumbs={[{ label: "Wissen", href: "/wissen" }, { label: "Webinare" }]}
        eyebrow="Webinare"
        title="Lernen in 30 bis 60 Minuten."
        intro="Kostenlose Webinare zu Themen, die Handwerksbetriebe gerade beschäftigen. Mit Zeit für eure Fragen – live oder als Aufzeichnung."
        actions="none"
      />

      {/* 2. Kommende Webinare */}
      <Section tone="white">
        <SectionHeading
          eyebrow="Demnächst"
          title="Kommende Webinare."
          intro="Die Termine stehen noch nicht fest. Lass dich benachrichtigen – wir melden uns, sobald es losgeht."
        />
        <ul className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {kommend.map((w) => (
            <li key={w.slug}>
              <WebinarKarte webinar={w} />
            </li>
          ))}
        </ul>
      </Section>

      {/* 3. Aufzeichnungen – erst sichtbar, wenn es welche gibt */}
      {aufzeichnungen.length > 0 && (
      <Section>
        <SectionHeading
          eyebrow="Aufzeichnungen"
          title="Jederzeit ansehen."
          intro="Fordere die Aufzeichnung an – wir schicken dir den Link per E-Mail."
        />
        <ul className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {aufzeichnungen.map((w) => (
            <li key={w.slug}>
              <WebinarKarte webinar={w} />
            </li>
          ))}
        </ul>
      </Section>
      )}

      {/* 4. Themen */}
      <Section tone="sand">
        <SectionHeading eyebrow="Themen" title="Webinare nach Thema." />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {genutzteThemen.map((t) => (
            <div key={t.slug} className="rounded-lg border border-line bg-white p-5">
              <div className="flex items-center gap-3">
                <IconTile name={t.icon} tone="sky" className="size-10" />
                <h3 className="font-display text-lg font-bold">{t.titel}</h3>
              </div>
              <ul className="mt-3 grid gap-2 text-[0.95rem]">
                {webinare
                  .filter((w) => w.themen.includes(t.slug))
                  .map((w) => (
                    <li key={w.slug}>
                      <Link href={webinarHref(w.slug)} className="flex gap-2 hover:text-signal-dark">
                        <Icon name="play" className="mt-1 size-4 shrink-0 text-muted" />
                        <span className="leading-snug">{w.titel}</span>
                      </Link>
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
          title="Für jedes Gewerk."
          intro="Die meisten Webinare passen für alle Betriebe. Einige gehen besonders auf bestimmte Gewerke ein."
        />
        <ul className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {topGewerke.map((g) => {
            const passend = webinare.filter((w) => (w.gewerke as readonly string[]).includes(g.slug));
            return (
              <li key={g.slug} className="rounded-lg border border-line bg-paper p-4">
                <div className="flex items-center gap-3">
                  <IconTile name={gewerkIcons[g.slug]} className="size-9" />
                  <Link href={`/gewerke/${g.slug}`} className="font-display font-bold hover:text-signal-dark">
                    {g.kurz}
                  </Link>
                </div>
                <p className="mt-2 text-sm text-muted">
                  {passend.length > 0
                    ? `Besonders passend: ${passend.map((w) => w.titel).join(", ")}.`
                    : `Alle allgemeinen Webinare, z. B. ${themaTitel("auftraege-geld")} und ${themaTitel("digital-arbeiten")}.`}
                </p>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* 6. Sprecher */}
      <Section>
        <SectionHeading
          eyebrow="Sprecher"
          title="Wer spricht?"
          intro="Unsere Webinare halten Leute aus dem Handwerk-OS-Team – keine bezahlten Redner, keine Show."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {sprecherRollen.map((s) => (
            <div key={s.rolle} className="flex gap-4 rounded-lg border border-line bg-white p-6">
              <IconTile name="mic" tone="ink" />
              <div>
                <h3 className="font-display text-lg font-bold">{s.rolle}</h3>
                <p className="mt-1 text-muted">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 7. CTA */}
      <FinalCta
        title="Lieber gleich selbst ausprobieren?"
        intro="Teste Handwerk OS kostenlos mit deinen eigenen Aufträgen – oder schau dir zuerst die Demo an."
      />
    </>
  );
}
