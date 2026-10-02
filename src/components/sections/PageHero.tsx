import type { ReactNode } from "react";
import { Breadcrumbs, ButtonLink, Container } from "@/components/ui";
import { Foto, fotoVorhanden } from "@/components/ui/Foto";
import type { BildKey } from "@/content/bilder";
import { cta } from "@/lib/site";
import { TrustRow } from "./TrustRow";

type HeroProps = {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  visual?: ReactNode;
  /** "default" = Kostenlos testen + Demo, "none" = keine Buttons, oder eigene Buttons. */
  actions?: "default" | "none" | ReactNode;
  trust?: boolean;
  children?: ReactNode;
  /**
   * Foto aus dem Bildregister. Macht den Kopf zum dunklen Bild-Hero im Stil von
   * Mission Mittelstand: Foto rechts, Headline in Versalien. Ohne vorhandenes Foto bleibt es eine ruhige dunkle Fläche.
   * Hervorgehobene Wörter (`<span>` im Titel) erscheinen in Akzentgrün.
   */
  bild?: BildKey;
};

/**
 * Einheitlicher Seitenkopf für Unterseiten.
 * `visual` erscheint rechts (Desktop) bzw. unter dem Text (Mobil).
 */
export function PageHero(props: HeroProps) {
  if (props.bild) return <BildHero {...props} bild={props.bild} />;

  const { eyebrow, title, intro, breadcrumbs, visual, actions = "default", trust = true, children } = props;
  return (
    <section className="relative overflow-hidden border-b border-line bg-paper">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--color-line)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-line)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40 [mask-image:radial-gradient(ellipse_at_top_right,black_20%,transparent_70%)]"
      />
      <Container className="relative py-12 sm:py-16">
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
        <div className={`grid items-center gap-12 ${visual ? "lg:grid-cols-[1.05fr_1fr]" : ""}`}>
          <div className="max-w-3xl">
            {eyebrow && (
              <p className="mb-4 text-sm font-semibold font-tagline uppercase tracking-[0.06em] text-signal-dark">{eyebrow}</p>
            )}
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            {intro && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-pretty text-muted sm:text-xl">{intro}</p>}
            <HeroActions actions={actions} />
            {trust && actions !== "none" && <TrustRow className="mt-6" />}
            {children}
          </div>
          {visual && <div className="min-w-0">{visual}</div>}
        </div>
      </Container>
    </section>
  );
}

function HeroActions({ actions, dark = false }: { actions: HeroProps["actions"]; dark?: boolean }) {
  if (actions === "none") return null;
  if (actions === "default" || actions === undefined) {
    return (
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href={cta.primary.href} size="lg" variant={dark ? "onDark" : "primary"}>
          {cta.primary.label}
        </ButtonLink>
        <ButtonLink href={cta.secondary.href} variant={dark ? "light" : "secondary"} size="lg">
          {cta.secondary.label}
        </ButtonLink>
      </div>
    );
  }
  return <div className="mt-8 flex flex-wrap gap-3">{actions}</div>;
}

/**
 * Dunkler Bild-Hero (Referenz: mission-mittelstand.de, Fallstudien und Landingpages).
 * Mobil: Aussage → Nutzen → Aktion zuerst, das Foto folgt darunter als Band. Ab `lg` füllt es die rechte Hälfte
 * und läuft weich in die dunkle Fläche aus. Fehlt das Foto, gibt es keine Bildfläche – keine Deko vor der Aussage.
 */
function BildHero({
  eyebrow,
  title,
  intro,
  breadcrumbs,
  visual,
  actions = "default",
  trust = true,
  children,
  bild,
}: HeroProps & { bild: BildKey }) {
  return (
    <section className="relative isolate overflow-hidden bg-ink text-white">
      <Container className="relative py-12 sm:py-16 lg:py-24 xl:py-28">
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} dark />}
        <div className={`grid items-center gap-12 ${visual ? "lg:grid-cols-[1.05fr_1fr]" : ""}`}>
          <div className="max-w-2xl">
            {eyebrow && (
              <p className="mb-4 text-sm font-semibold font-tagline uppercase tracking-[0.06em] text-accent">{eyebrow}</p>
            )}
            <h1 className="font-display text-4xl font-extrabold uppercase leading-[1.02] tracking-tight text-balance sm:text-5xl lg:text-6xl [&_span]:text-accent">
              {title}
            </h1>
            {intro && <p className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-white/80 sm:text-xl">{intro}</p>}
            <HeroActions actions={actions} dark />
            {trust && actions !== "none" && <TrustRow dark className="mt-6" />}
            {children}
          </div>
          {visual && <div className="relative min-w-0">{visual}</div>}
        </div>
      </Container>
      {fotoVorhanden(bild) && (
        <div className="relative h-56 sm:h-80 lg:absolute lg:inset-y-0 lg:right-0 lg:-z-10 lg:h-auto lg:w-[58%]">
          <Foto bild={bild} preload sizes="(min-width: 1024px) 58vw, 100vw" />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-ink via-ink/20 to-ink/10 lg:bg-gradient-to-r lg:from-ink lg:via-ink/55 lg:to-ink/0"
          />
        </div>
      )}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-brand" />
    </section>
  );
}
