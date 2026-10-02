import { Fragment, type ReactNode } from "react";
import { Breadcrumbs, Container, Icon } from "@/components/ui";
import { type RechtsAbschnitt } from "@/content/unternehmen";

/** Hebt Platzhalter wie „[Firmenname]“ sichtbar hervor. */
export function MitPlatzhaltern({ text }: { text: string }) {
  const teile = text.split(/(\[[^\]]+\])/g);
  return (
    <>
      {teile.map((t, i) =>
        t.startsWith("[") && t.endsWith("]") ? (
          <Platzhalter key={i}>{t}</Platzhalter>
        ) : (
          <Fragment key={i}>{t}</Fragment>
        ),
      )}
    </>
  );
}

/** Markierung für offene Angaben: Warnfarbe aus dem Playbook, gestrichelter Rahmen, nicht nur Farbe. */
function Platzhalter({ children }: { children: ReactNode }) {
  return (
    <mark className="rounded-sm border border-dashed border-warning bg-warning-soft px-1 font-semibold text-warning">
      {children}
    </mark>
  );
}

/** Gut sichtbarer Hinweis, dass der Text ein Entwurf ist. */
export function EntwurfHinweis() {
  return (
    <div role="note" className="flex items-start gap-3 rounded-lg border-2 border-warning bg-warning-soft p-4 text-sm">
      <Icon name="bell" className="mt-0.5 size-5 shrink-0 text-warning" />
      <p>
        <b className="block text-base">Entwurf – vor Veröffentlichung rechtlich prüfen lassen.</b>
        Offene Angaben sind so markiert: <Platzhalter>[Platzhalter]</Platzhalter>. Sie müssen ersetzt werden.
      </p>
    </div>
  );
}

/** Einheitliches Layout für Impressum, Datenschutz, AGB und Auftragsverarbeitung. */
export function RechtsSeite({
  titel,
  intro,
  stand = "[Datum]",
  abschnitte,
  inhaltsverzeichnis = true,
  children,
}: {
  titel: string;
  intro?: string;
  stand?: string;
  abschnitte: RechtsAbschnitt[];
  inhaltsverzeichnis?: boolean;
  children?: ReactNode;
}) {
  return (
    <>
      <section className="border-b border-line bg-paper">
        <Container size="narrow" className="py-12 sm:py-16">
          <Breadcrumbs items={[{ label: titel }]} />
          <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">{titel}</h1>
          {intro && <p className="mt-4 text-lg leading-relaxed text-muted">{intro}</p>}
          <p className="mt-3 text-sm text-muted">
            Stand: <MitPlatzhaltern text={stand} />
          </p>
          <div className="mt-6">
            <EntwurfHinweis />
          </div>
        </Container>
      </section>
      <section className="bg-white py-12 sm:py-16">
        <Container size="narrow">
          {inhaltsverzeichnis && abschnitte.length > 3 && (
            <nav aria-label="Inhalt" className="mb-10 rounded-lg border border-line bg-paper p-5">
              <p className="text-sm font-bold">Inhalt</p>
              <ol className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
                {abschnitte.map((a, i) => (
                  <li key={a.id}>
                    <a href={`#${a.id}`} className="text-muted hover:text-ink">
                      {i + 1}. {a.titel}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}
          <div className="space-y-10">
            {abschnitte.map((a, i) => (
              <section key={a.id} id={a.id} className="scroll-mt-24">
                <h2 className="font-display text-xl font-bold sm:text-2xl">
                  {i + 1}. {a.titel}
                </h2>
                {a.absaetze?.map((p, j) => (
                  <p key={j} className="mt-3 leading-relaxed text-ink-soft">
                    <MitPlatzhaltern text={p} />
                  </p>
                ))}
                {a.liste && (
                  <ul className="mt-3 list-disc space-y-1.5 pl-5 leading-relaxed text-ink-soft marker:text-muted">
                    {a.liste.map((l, j) => (
                      <li key={j}>
                        <MitPlatzhaltern text={l} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
          {children}
        </Container>
      </section>
    </>
  );
}
