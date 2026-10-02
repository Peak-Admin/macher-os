import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

type Variant = "primary" | "secondary" | "light" | "onDark";

const variants: Record<Variant, string> = {
  primary: "btn-primaer",
  /** Nebenaktion: weiß mit erkennbarem Rand, dunkelgrüne Schrift */
  secondary: "bg-white text-signal-dark ring-1 ring-inset ring-line-dark hover:bg-signal-soft",
  light: "bg-white/10 text-white ring-1 ring-inset ring-white/25 hover:bg-white/20",
  /** Hauptaktion auf dunklen Markenflächen: derselbe Primärbutton wie überall (ein Grün für alle Hauptaktionen) */
  onDark: "btn-primaer",
};

/**
 * Inhalt des Primärbuttons: Pfeil im weißen Kreis links, beim Hover wandert er nach rechts.
 * Nur innerhalb von `btn-primaer` verwenden.
 */
export function BtnPfeil({ children }: { children: ReactNode }) {
  return (
    <span className="btn-pfeil-inhalt">
      <span aria-hidden className="btn-pfeil">
        <Icon name="arrow-right" className="size-3.5 stroke-[2.5]" />
      </span>
      <span>{children}</span>
      <span aria-hidden className="btn-pfeil btn-pfeil--nach">
        <Icon name="arrow-right" className="size-3.5 stroke-[2.5]" />
      </span>
    </span>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  // Alle Varianten gleich hoch (mind. 48 px), damit Primär- und Zweitbutton nebeneinander bündig stehen.
  const sizes = { sm: "min-h-11 px-4", md: "min-h-12 px-5 sm:px-6", lg: "min-h-14 px-5 sm:px-8" };
  const primaer = variant === "primary" || variant === "onDark";
  // Primärbutton bringt Schriftgröße, Radius, Fläche und Übergänge selbst mit (btn-primaer).
  const schrift = primaer ? "" : { sm: "text-base font-semibold", md: "text-base font-semibold", lg: "text-lg font-semibold" }[size];
  const form = primaer ? "" : "rounded-xl transition-colors duration-150 ease-out";
  return (
    <Link
      href={href}
      className={`inline-flex max-w-full items-center justify-center gap-2 text-center sm:whitespace-nowrap ${form} ${sizes[size]} ${schrift} ${variants[variant]} ${className}`}
    >
      {primaer ? <BtnPfeil>{children}</BtnPfeil> : children}
    </Link>
  );
}

/** Tertiärer Link im Stil „Alle Funktionen ansehen →“. */
export function ArrowLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-1.5 font-semibold text-ink underline decoration-signal decoration-2 underline-offset-4 hover:decoration-ink ${className}`}
    >
      {children}
      <Icon name="arrow-right" className="size-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
