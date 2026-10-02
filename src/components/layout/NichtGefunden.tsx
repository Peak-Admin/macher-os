import { ArrowLink, ButtonLink, Container } from "@/components/ui";

/** Inhalt der 404-Seite – genutzt von `(marketing)/not-found.tsx` und `global-not-found.tsx`. */
export function NichtGefunden() {
  return (
    <Container size="narrow" className="py-24 sm:py-32">
      <p className="text-sm font-bold font-tagline uppercase tracking-widest text-signal-dark">Fehler 404</p>
      <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
        Diese Seite gibt es nicht.
      </h1>
      <p className="mt-4 text-lg text-muted">
        Vielleicht wurde sie verschoben. Fang am besten auf der Startseite an – oder schau dir an, was Macher OS kann.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-5">
        <ButtonLink href="/">Zur Startseite</ButtonLink>
        <ArrowLink href="/funktionen">Alle Funktionen</ArrowLink>
      </div>
    </Container>
  );
}
