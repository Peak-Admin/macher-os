import { ButtonLink, Container } from "@/components/ui";
import { Chevrons, Foto } from "@/components/ui/Foto";
import type { BildKey } from "@/content/bilder";
import { cta } from "@/lib/site";
import { TrustRow } from "./TrustRow";

/**
 * Abschluss-CTA jeder Marketingseite – dunkler Abschnitt mit Foto und
 * Pfeilmotiv (Referenz: „Dunkler CTA-Abschnitt“ in docs/design/festlegungen.md).
 */
export function FinalCta({
  eyebrow = "Jetzt starten",
  title = "Weniger Büro. Mehr Handwerk.",
  intro = "Starte kostenlos und richte Macher OS in wenigen Minuten für deinen Betrieb ein.",
  primaryLabel = cta.primary.label,
  primaryHref = cta.primary.href,
  secondary = true,
  bild = "seite/cta",
}: {
  eyebrow?: string;
  title?: string;
  intro?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondary?: boolean;
  bild?: BildKey;
}) {
  return (
    <section className="relative isolate overflow-hidden border-t border-white/10 bg-ink text-white">
      <div className="relative h-56 sm:h-72 lg:absolute lg:inset-y-0 lg:left-0 lg:h-auto lg:w-[42%]">
        <Foto bild={bild} sizes="(min-width: 1024px) 42vw, 100vw" />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent lg:bg-gradient-to-l lg:from-ink lg:via-ink/40 lg:to-transparent"
        />
      </div>
      <Chevrons className="absolute -right-16 -top-10 hidden h-[120%] text-brand/15 lg:block" />

      <Container className="relative py-14 sm:py-20 lg:py-28">
        <div className="lg:ml-[42%] lg:pl-12">
          <p className="text-sm font-semibold font-tagline uppercase tracking-[0.06em] text-accent">{eyebrow}</p>
          <h2 className="mt-4 font-display text-4xl font-bold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
            {title}
          </h2>
          <p className="mt-5 max-w-xl text-lg text-white/80">{intro}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href={primaryHref} size="lg" className="sm:min-w-64">
              {primaryLabel}
            </ButtonLink>
            {secondary && (
              <ButtonLink href={cta.secondary.href} variant="light" size="lg">
                {cta.secondary.label}
              </ButtonLink>
            )}
          </div>
          <TrustRow dark className="mt-7" />
        </div>
      </Container>
    </section>
  );
}
