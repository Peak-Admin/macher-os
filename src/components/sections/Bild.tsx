import Link from "next/link";
import type { ReactNode } from "react";
import { Container, Icon, IconTile, type IconName } from "@/components/ui";
import { Foto, fotoVorhanden } from "@/components/ui/Foto";
import type { BildKey } from "@/content/bilder";

/**
 * Bildbausteine im Stil von mission-mittelstand.de.
 * Vorlagen: „Bildkarten-Reihe“, „Event-/Bereichskarten hochkant“ und
 * „Statement in Versalien“ in docs/design/festlegungen.md.
 */

/** Dachzeile + Versalien-Headline; der erste Teil (`gruen`) steht in Akzentgrün. */
export function DunkleHeadline({
  eyebrow,
  gruen,
  rest,
  intro,
  className = "",
}: {
  eyebrow?: string;
  gruen: string;
  rest?: string;
  intro?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`max-w-3xl ${className}`}>
      {eyebrow && <p className="mb-3 text-sm font-semibold font-tagline uppercase tracking-[0.06em] text-white/70">{eyebrow}</p>}
      <h2 className="font-display text-3xl font-bold leading-[1.1] tracking-tight text-balance sm:text-4xl lg:text-5xl">
        <span className="text-accent">{gruen}</span>
        {rest && <> {rest}</>}
      </h2>
      {intro && <p className="mt-4 text-lg leading-relaxed text-pretty text-on-dark">{intro}</p>}
    </div>
  );
}

/** Dunkler Abschnitt mit vier Fotos nebeneinander, Titel in Akzentgrün darunter. */
export function BildKarten({
  eyebrow,
  gruen,
  rest,
  intro,
  karten,
}: {
  eyebrow?: string;
  gruen: string;
  rest?: string;
  intro?: ReactNode;
  karten: { bild: BildKey; titel: string; text: string; href?: string }[];
}) {
  return (
    <section className="bg-ink py-16 text-white sm:py-24">
      <Container>
        <DunkleHeadline eyebrow={eyebrow} gruen={gruen} rest={rest} intro={intro} />
        <ul className="mt-12 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {karten.map((k) => {
            const inhalt = (
              <>
                <div className="relative aspect-[4/3] overflow-hidden bg-ink-soft">
                  <Foto
                    bild={k.bild}
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                  />
                  <div aria-hidden className="absolute inset-0 bg-accent/15 mix-blend-multiply" />
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold text-accent">{k.titel}</h3>
                <p className="mt-2 leading-relaxed text-white/80">{k.text}</p>
              </>
            );
            return (
              <li key={k.titel}>
                {k.href ? (
                  <Link href={k.href} className="group block">
                    {inhalt}
                  </Link>
                ) : (
                  <div className="group">{inhalt}</div>
                )}
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}

/**
 * Hochkant-Karte mit Foto (Bereichskarte): Icon oben links, großer Titel in
 * Versalien unten, Pfeil ↗ in Akzentgrün. Für Gewerke und Einstiege.
 */
export function BereichsKarte({
  href,
  bild,
  titel,
  text,
  icon,
  sizes = "(min-width: 1024px) 25vw, 50vw",
}: {
  href: string;
  bild: BildKey;
  titel: string;
  text?: string;
  icon?: IconName;
  sizes?: string;
}) {
  return (
    <Link
      href={href}
      className="group relative isolate flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-lg bg-ink p-4 text-white ring-1 ring-brand/50 transition duration-150 ease-out hover:ring-accent sm:p-5"
    >
      <Foto bild={bild} sizes={sizes} className="-z-10 transition-transform duration-500 ease-out group-hover:scale-[1.05]" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,color-mix(in_oklab,var(--color-ink)_35%,transparent)_0%,transparent_30%,color-mix(in_oklab,var(--color-ink)_75%,transparent)_65%,color-mix(in_oklab,var(--color-signal)_85%,var(--color-ink))_100%)]"
      />
      {icon ? (
        <IconTile name={icon} className="size-10" />
      ) : (
        <span />
      )}
      <div>
        <div className="flex items-end justify-between gap-3">
          <span className="font-display text-xl font-bold leading-[1.1] tracking-tight text-balance sm:text-2xl">
            {titel}
          </span>
          <Icon
            name="arrow-up-right"
            className="size-6 shrink-0 text-accent transition-transform duration-150 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </div>
        {text && <p className="mt-2 line-clamp-2 text-sm leading-snug text-white/80">{text}</p>}
      </div>
    </Link>
  );
}

/** Ruhiger dunkler Abschnitt (Waldgrün) – ohne Dekowort im Hintergrund. */
export function DunklerAbschnitt({
  children,
  id,
  className = "",
}: {
  children: ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <section id={id} className={`relative isolate overflow-hidden bg-ink py-16 text-white sm:py-24 ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}

/**
 * Foto + Text nebeneinander. Das Foto läuft auf großen Bildschirmen bis an den
 * Rand; daneben steht der Inhalt. Für Alltagssituationen („Kennst du das?“).
 */
export function BildText({
  bild,
  children,
  seite = "links",
  tone = "white",
  overlay,
}: {
  bild: BildKey;
  children: ReactNode;
  seite?: "links" | "rechts";
  tone?: "white" | "paper" | "ink" | "beige";
  /** Optional über dem Foto, z. B. ein Handy-Mock. */
  overlay?: ReactNode;
}) {
  const tones = { white: "bg-white text-ink", paper: "bg-paper text-ink", ink: "bg-ink text-white", beige: "bg-beige text-ink" };
  const rechts = seite === "rechts";
  // Ohne Foto und ohne Produktansicht keine Bildfläche: der Text steht allein, ruhig und lesbar.
  if (!fotoVorhanden(bild) && !overlay) {
    return (
      <section className={`relative ${tones[tone]}`}>
        <Container className="relative py-14 sm:py-20 lg:py-24">
          <div className="max-w-3xl">{children}</div>
        </Container>
      </section>
    );
  }
  return (
    <section className={`relative isolate overflow-hidden ${tones[tone]}`}>
      <div
        className={`relative h-72 sm:h-96 lg:absolute lg:inset-y-0 lg:h-auto lg:w-1/2 ${rechts ? "lg:right-0" : "lg:left-0"}`}
      >
        <Foto bild={bild} sizes="(min-width: 1024px) 50vw, 100vw" />
        {overlay && <div className="absolute inset-0 flex items-center justify-center p-6">{overlay}</div>}
      </div>
      <Container className="relative py-14 sm:py-20 lg:py-28">
        <div className={`lg:w-1/2 ${rechts ? "lg:pr-16" : "lg:ml-auto lg:pl-16"}`}>{children}</div>
      </Container>
    </section>
  );
}

/**
 * Bühne für Produktansichten: Foto als Hintergrund, abgedunkelt, darauf ein
 * Mock (Handy, Plantafel). Verbindet Alltagsfoto und Produktbeweis.
 */
export function FotoBuehne({
  bild,
  children,
  className = "",
}: {
  bild: BildKey;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative isolate overflow-hidden rounded-lg bg-ink px-4 py-10 sm:px-10 sm:py-14 ${className}`}>
      <Foto bild={bild} sizes="(min-width: 1024px) 50vw, 100vw" className="-z-10" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/85 via-ink/35 to-ink/10" />
      <div className="relative">{children}</div>
    </div>
  );
}
