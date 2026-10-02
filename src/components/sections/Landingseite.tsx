import { AnliegenFormular } from "@/components/unternehmen/AnliegenFormular";
import { ArrowLink, ButtonLink, Card, Faq, FaqJsonLd, Icon, Section, SectionHeading } from "@/components/ui";
import type { Landing, VergleichsZelle } from "@/content/landing/typ";
import { pageMeta } from "@/lib/metadata";
import { FinalCta } from "./FinalCta";
import { PageHero } from "./PageHero";
import { Steps } from "./Steps";

export function landingMeta(seite: Landing) {
  return pageMeta({ ...seite.meta, path: seite.pfad });
}

/**
 * Einheitliche Landingpage: Nutzen-Headline, Alltag, Funktionsweise, Vergleich, Vertrauen, FAQ, ein CTA.
 * Inhalte liegen typisiert unter `src/content/landing/`.
 */
export function Landingseite({ seite }: { seite: Landing }) {
  const { hero, schmerz, wegweiser, vorteile, vergleich, ablauf, checkliste, anfrage, faq, weiter, cta } = seite;
  return (
    <>
      <PageHero
        bild={hero.bild}
        eyebrow={hero.eyebrow}
        title={hero.title}
        intro={hero.intro}
        breadcrumbs={seite.breadcrumbs}
        actions={
          hero.aktionen ? (
            <>
              <ButtonLink href={hero.aktionen.primaer.href} size="lg" variant={hero.bild ? "onDark" : "primary"}>
                {hero.aktionen.primaer.label}
              </ButtonLink>
              {hero.aktionen.sekundaer && (
                <ButtonLink href={hero.aktionen.sekundaer.href} size="lg" variant={hero.bild ? "light" : "secondary"}>
                  {hero.aktionen.sekundaer.label}
                </ButtonLink>
              )}
            </>
          ) : (
            "default"
          )
        }
        trust={!hero.aktionen}
      >
        {hero.hinweis && <p className={`mt-5 text-sm ${hero.bild ? "text-white/70" : "text-muted"}`}>{hero.hinweis}</p>}
      </PageHero>

      {schmerz && (
        <Section tone="white">
          <div className="grid gap-12 lg:grid-cols-2">
            <SectionHeading eyebrow={schmerz.eyebrow ?? "Kennst du das?"} title={schmerz.titel} />
            <div className="rounded-2xl border border-line bg-paper p-6 sm:p-8">
              <ul className="space-y-3">
                {schmerz.punkte.map((p) => (
                  <li key={p} className="flex items-start gap-3">
                    <Icon name="x" className="mt-0.5 size-5 shrink-0 text-muted" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 flex items-start gap-3 border-t border-line pt-5 font-semibold">
                <Icon name="check" className="mt-0.5 size-5 shrink-0 text-signal-dark" />
                <span>{schmerz.antwort}</span>
              </p>
            </div>
          </div>
        </Section>
      )}

      {wegweiser && (
        <Section id="uebersicht" tone={schmerz ? "paper" : "white"} className="scroll-mt-20">
          <SectionHeading eyebrow={wegweiser.eyebrow} title={wegweiser.titel} intro={wegweiser.intro} />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wegweiser.karten.map((k) => (
              <Card key={k.href} title={k.titel} href={k.href} icon={k.icon}>
                {k.text}
              </Card>
            ))}
          </div>
        </Section>
      )}

      {vorteile && (
        <Section tone={schmerz && !wegweiser ? "paper" : "white"}>
          <SectionHeading eyebrow={vorteile.eyebrow} title={vorteile.titel} intro={vorteile.intro} />
          <div className={`mt-10 grid gap-4 sm:grid-cols-2 ${vorteile.karten.length % 3 === 0 ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>
            {vorteile.karten.map((k) => (
              <Card key={k.titel} title={k.titel} icon={k.icon}>
                {k.text}
              </Card>
            ))}
          </div>
        </Section>
      )}

      {vergleich && (
        <Section tone="white">
          <SectionHeading eyebrow={vergleich.eyebrow ?? "Im Vergleich"} title={vergleich.titel} intro={vergleich.intro} />
          <Vergleichstabelle vergleich={vergleich} />
        </Section>
      )}

      {ablauf && (
        <Section>
          <SectionHeading eyebrow={ablauf.eyebrow ?? "So geht's"} title={ablauf.titel} intro={ablauf.intro} />
          <Steps steps={ablauf.schritte} className="mt-10" />
          {ablauf.link && (
            <ArrowLink href={ablauf.link.href} className="mt-8">
              {ablauf.link.label}
            </ArrowLink>
          )}
        </Section>
      )}

      {checkliste && (
        <Section tone="ink">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              {checkliste.eyebrow && (
                <p className="mb-3 text-sm font-semibold font-tagline uppercase tracking-[0.06em] text-accent">{checkliste.eyebrow}</p>
              )}
              <h2 className="font-display text-3xl font-bold leading-[1.1] tracking-tight text-balance sm:text-4xl">{checkliste.titel}</h2>
              {checkliste.intro && <p className="mt-5 max-w-md text-lg text-white/75">{checkliste.intro}</p>}
              {checkliste.link && (
                <ButtonLink href={checkliste.link.href} variant="onDark" size="lg" className="mt-8">
                  {checkliste.link.label}
                </ButtonLink>
              )}
            </div>
            <ul className="grid gap-3">
              {checkliste.punkte.map((p) => (
                <li key={p} className="flex items-start gap-3 karte-dunkel p-4">
                  <Icon name="check" className="mt-0.5 size-5 shrink-0 text-accent" />
                  <span className="font-semibold">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </Section>
      )}

      {anfrage && (
        <Section id="anfrage" tone="white" className="scroll-mt-20">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <SectionHeading title={anfrage.titel} intro={anfrage.intro} />
              <p className="mt-6 text-muted">
                Oder direkt per E-Mail an{" "}
                <a href={`mailto:${anfrage.email}`} className="font-semibold text-ink underline underline-offset-2">
                  {anfrage.email}
                </a>
                .
              </p>
            </div>
            <AnliegenFormular anliegen={anfrage.anliegen} frage={anfrage.frage} betreffPrefix={anfrage.betreff} />
          </div>
        </Section>
      )}

      <Section tone={anfrage ? "paper" : "white"} containerSize="narrow">
        <SectionHeading title="Häufige Fragen" />
        <div className="mt-8">
          <Faq items={faq} />
        </div>
        <FaqJsonLd items={faq} />
      </Section>

      <Section tone={anfrage ? "white" : "paper"} tight>
        <h2 className="font-display text-2xl font-bold">{weiter.titel ?? "Das könnte dich auch interessieren"}</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {weiter.links.map((l) => (
            <li key={l.href} className="rounded-2xl border border-line bg-white p-5">
              <ArrowLink href={l.href}>{l.label}</ArrowLink>
              <p className="mt-2 text-[0.95rem] text-muted">{l.text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <FinalCta title={cta?.title} intro={cta?.intro} />
    </>
  );
}

function Zelle({ wert }: { wert: VergleichsZelle }) {
  if (wert === true)
    return (
      <span className="inline-flex items-center gap-2 font-semibold text-signal-dark">
        <Icon name="check" className="size-5 shrink-0" /> Ja
      </span>
    );
  if (wert === false)
    return (
      <span className="inline-flex items-center gap-2 text-muted">
        <Icon name="x" className="size-5 shrink-0" /> Nein
      </span>
    );
  return <span>{wert}</span>;
}

/** Tabelle ab `md`, darunter je Merkmal eine Karte – kein waagerechter Überlauf ab 320 px. */
function Vergleichstabelle({ vergleich }: { vergleich: NonNullable<Landing["vergleich"]> }) {
  const [links, rechts] = vergleich.spalten;
  return (
    <>
      <div className="mt-10 hidden overflow-hidden rounded-2xl border border-line bg-white md:block">
        <table className="w-full text-left">
          <thead className="bg-paper">
            <tr>
              <th scope="col" className="w-[34%] px-6 py-4 font-display font-semibold">
                Worauf es ankommt
              </th>
              <th scope="col" className="px-6 py-4 font-display font-semibold">
                {links}
              </th>
              <th scope="col" className="px-6 py-4 font-display font-semibold text-signal-dark">
                {rechts}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {vergleich.zeilen.map((z) => (
              <tr key={z.merkmal} className="align-top">
                <th scope="row" className="px-6 py-4 font-semibold">
                  {z.merkmal}
                </th>
                <td className="px-6 py-4 text-muted">
                  <Zelle wert={z.links} />
                </td>
                <td className="bg-signal-soft/40 px-6 py-4">
                  <Zelle wert={z.rechts} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="mt-8 grid gap-3 md:hidden">
        {vergleich.zeilen.map((z) => (
          <li key={z.merkmal} className="rounded-2xl border border-line bg-white p-5">
            <p className="font-semibold">{z.merkmal}</p>
            <dl className="mt-3 grid gap-3 text-[0.95rem]">
              <div>
                <dt className="text-sm text-muted">{links}</dt>
                <dd className="mt-0.5 text-muted">
                  <Zelle wert={z.links} />
                </dd>
              </div>
              <div className="rounded-lg bg-signal-soft p-3">
                <dt className="text-sm font-semibold text-signal-dark">{rechts}</dt>
                <dd className="mt-0.5">
                  <Zelle wert={z.rechts} />
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
      {vergleich.hinweis && <p className="mt-6 max-w-3xl text-sm text-muted">{vergleich.hinweis}</p>}
    </>
  );
}
