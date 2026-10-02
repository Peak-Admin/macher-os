import type { ReactNode } from "react";
import { Breadcrumbs, ButtonLink, Container } from "@/components/ui";
import { cta } from "@/lib/site";
import { TrustRow } from "./TrustRow";

/**
 * Einheitlicher Seitenkopf für Unterseiten.
 * `visual` erscheint rechts (Desktop) bzw. unter dem Text (Mobil).
 */
export function PageHero({
  eyebrow,
  title,
  intro,
  breadcrumbs,
  visual,
  actions = "default",
  trust = true,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  visual?: ReactNode;
  /** "default" = Kostenlos testen + Demo, "none" = keine Buttons, oder eigene Buttons. */
  actions?: "default" | "none" | ReactNode;
  trust?: boolean;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-line bg-paper">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--color-line)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-line)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40 [mask-image:radial-gradient(ellipse_at_top_right,black_20%,transparent_70%)]"
      />
      <Container className="relative py-14 sm:py-20">
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
            {actions === "default" ? (
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href={cta.primary.href} size="lg">
                  {cta.primary.label}
                </ButtonLink>
                <ButtonLink href={cta.secondary.href} variant="secondary" size="lg">
                  {cta.secondary.label}
                </ButtonLink>
              </div>
            ) : actions === "none" ? null : (
              <div className="mt-8 flex flex-wrap gap-3">{actions}</div>
            )}
            {trust && actions !== "none" && <TrustRow className="mt-6" />}
            {children}
          </div>
          {visual && <div className="min-w-0">{visual}</div>}
        </div>
      </Container>
    </section>
  );
}
