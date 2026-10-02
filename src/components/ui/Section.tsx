import type { ReactNode } from "react";
import { Container } from "./Container";
import { zone, type ZonenTon } from "./Zone";

export type Tone = "paper" | "sand" | "white" | "ink" | "gruen" | "beige" | "transparent";

/** Jeder Ton wird zu einer Box wie auf der Startseite: dunkelgrün · beige · weiß. */
const boxen: Record<Exclude<Tone, "transparent">, ZonenTon> = {
  paper: "weiss",
  white: "weiss",
  sand: "beige",
  beige: "beige",
  gruen: "beige",
  ink: "dunkel",
};

/**
 * Standard-Abschnitt mit einheitlichem vertikalen Rhythmus – als Box (`Zone`) wie auf der Startseite.
 * `transparent` nur innerhalb einer Zone: dann kommt die Fläche von der Box.
 */
export function Section({
  children,
  tone = "paper",
  id,
  className = "",
  containerSize,
  tight = false,
}: {
  children: ReactNode;
  tone?: Tone;
  id?: string;
  className?: string;
  containerSize?: "default" | "narrow" | "wide";
  tight?: boolean;
}) {
  return (
    <section id={id} {...rahmen(tone, `${tight ? "py-12 sm:py-16" : "py-16 sm:py-24"} ${className}`)}>
      <Container size={containerSize}>{children}</Container>
    </section>
  );
}

function rahmen(tone: Tone, className: string) {
  return tone === "transparent" ? { className } : zone(boxen[tone], className);
}

/** Überschriftenblock eines Abschnitts: Dachzeile, Headline, Einleitung. */
export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "left",
  as: Tag = "h2",
  className = "",
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: "left" | "center";
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  const center = align === "center";
  return (
    <div className={`${center ? "mx-auto text-center" : ""} max-w-3xl ${className}`}>
      {eyebrow && (
        <p className="mb-3 text-sm font-semibold font-tagline uppercase tracking-[0.06em] text-signal-dark">{eyebrow}</p>
      )}
      <Tag className="font-display text-3xl font-bold leading-[1.1] tracking-tight text-balance sm:text-4xl lg:text-[2.75rem]">
        {title}
      </Tag>
      {intro && <p className="mt-4 text-lg leading-relaxed text-pretty opacity-80">{intro}</p>}
    </div>
  );
}
