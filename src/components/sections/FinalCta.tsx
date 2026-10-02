import { ButtonLink, Container } from "@/components/ui";
import { cta } from "@/lib/site";
import { TrustRow } from "./TrustRow";

/** Abschluss-CTA jeder Marketingseite. */
export function FinalCta({
  title = "Weniger Büro. Mehr Handwerk.",
  intro = "Starte kostenlos und richte Macher OS in wenigen Minuten für deinen Betrieb ein.",
  primaryLabel = cta.primary.label,
  primaryHref = cta.primary.href,
  secondary = true,
}: {
  title?: string;
  intro?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondary?: boolean;
}) {
  return (
    <section className="relative overflow-hidden bg-ink text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 size-[32rem] rounded-full bg-brand/25 blur-3xl"
      />
      <Container className="relative py-20 sm:py-28">
        <div className="relative max-w-3xl">
          <h2 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-balance sm:text-6xl">
            {title}
          </h2>
          <p className="mt-5 max-w-xl text-lg text-white/75">{intro}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href={primaryHref} size="lg" variant="onDark">
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
