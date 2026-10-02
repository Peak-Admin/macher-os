import { MissionMittelstandFoto } from "@/components/sections/MissionMittelstand";
import Link from "next/link";
import { PageHero } from "@/components/sections";
import { ArrowLink, Icon, Section } from "@/components/ui";
import { AnliegenFormular } from "@/components/unternehmen/AnliegenFormular";
import { supportAnliegen } from "@/content/hilfe/support";
import { SUPPORT_EMAIL } from "@/content/unternehmen";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: "Kontakt & Support",
  description:
    "Persönliche Hilfe zu Macher OS: Produktfragen, technische Probleme, Einrichtung, Datenübernahme oder Rechnung – wähle dein Thema und schreib uns.",
  path: "/hilfe/kontakt",
});

const selbstHilfe = [
  { titel: "Schnellstart", text: "In 7 Schritten startklar.", href: "/hilfe/schnellstart", icon: "bolt" },
  { titel: "Hilfe-Center", text: "Anleitungen zu allen Bereichen.", href: "/hilfe-center", icon: "book" },
  { titel: "Daten übernehmen", text: "So kommen deine Listen rein.", href: "/hilfe/daten-uebernehmen", icon: "download" },
] as const;

export default function SupportKontaktPage() {
  return (
    <>
      <PageHero
        eyebrow="Kontakt & Support"
        title="Wir helfen dir persönlich."
        intro="Wähle kurz dein Thema und schreib, wobei du Hilfe brauchst. Ein paar Sätze reichen."
        breadcrumbs={[{ label: "Hilfe", href: "/hilfe" }, { label: "Kontakt & Support" }]}
        actions="none"
        visual={<MissionMittelstandFoto className="rounded-xl shadow-popover" />}
      />

      <Section tone="white">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <AnliegenFormular anliegen={supportAnliegen} frage="Wobei brauchst du Hilfe?" betreffPrefix="Support" />

          <aside className="space-y-8">
            <div>
              <p className="font-display text-lg font-bold">Vielleicht geht es schneller:</p>
              <ul className="mt-4 space-y-2.5">
                {selbstHilfe.map((s) => (
                  <li key={s.href}>
                    <Link
                      href={s.href}
                      className="group flex items-center gap-3 rounded-lg border border-line bg-paper p-3.5 transition hover:border-ink/30"
                    >
                      <Icon name={s.icon} className="size-5 text-signal-dark" />
                      <span className="flex-1">
                        <span className="block font-semibold">{s.titel}</span>
                        <span className="block text-sm text-muted">{s.text}</span>
                      </span>
                      <Icon name="arrow-right" className="size-4 text-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl bg-sand p-5">
              <p className="font-semibold">Lieber direkt per E-Mail?</p>
              <p className="mt-1 text-muted">
                Schreib an{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-ink underline underline-offset-2">
                  {SUPPORT_EMAIL}
                </a>
                .
              </p>
              <p className="mt-3 text-sm text-muted">
                Bei technischen Problemen helfen uns ein Screenshot und die Angabe, ob du im Browser oder in der App
                arbeitest.
              </p>
            </div>
            <div>
              <p className="text-sm text-muted">Noch kein Kunde und Fragen zum Produkt?</p>
              <ArrowLink href="/kontakt" className="mt-2">
                Allgemeiner Kontakt
              </ArrowLink>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
