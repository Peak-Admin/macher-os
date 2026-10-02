import { PageHero } from "@/components/sections";
import { ArrowLink, Section } from "@/components/ui";
import { AnliegenFormular } from "@/components/unternehmen/AnliegenFormular";
import { KONTAKT_EMAIL, kontaktAnliegen, PRESSE_EMAIL, SUPPORT_EMAIL } from "@/content/unternehmen";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: "Kontakt",
  description:
    "Kontakt zu Macher OS: Fragen zum Produkt, Hilfe, Partnerschaft oder Presse. Wähle dein Thema und schreib uns ein paar Zeilen.",
  path: "/kontakt",
});

const direkt = [
  { label: "Allgemein", email: KONTAKT_EMAIL },
  { label: "Hilfe & Support", email: SUPPORT_EMAIL },
  { label: "Presse", email: PRESSE_EMAIL },
];

export default function KontaktPage() {
  return (
    <>
      <PageHero
        eyebrow="Kontakt"
        title="Schreib uns."
        intro="Ob Frage zum Produkt, Partnerschaft oder Presse: Wähle dein Thema und schreib ein paar Zeilen. Wir melden uns."
        breadcrumbs={[{ label: "Kontakt" }]}
        actions="none"
      />
      <Section tone="white">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <AnliegenFormular anliegen={kontaktAnliegen} />
          <aside className="space-y-8">
            <div className="rounded-xl bg-sand p-5">
              <p className="font-semibold">Direkt per E-Mail</p>
              <dl className="mt-3 space-y-2.5 text-sm">
                {direkt.map((d) => (
                  <div key={d.email}>
                    <dt className="text-muted">{d.label}</dt>
                    <dd>
                      <a href={`mailto:${d.email}`} className="font-semibold underline underline-offset-2">
                        {d.email}
                      </a>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <p className="text-muted">Du nutzt Macher OS schon und brauchst Hilfe?</p>
              <ArrowLink href="/hilfe/kontakt" className="mt-2">
                Kontakt & Support
              </ArrowLink>
            </div>
            <div>
              <p className="text-muted">Lieber erst selbst schauen?</p>
              <ArrowLink href="/demo" className="mt-2">
                Demo ansehen
              </ArrowLink>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
