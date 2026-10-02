import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

type Variant = "primary" | "secondary" | "dark" | "light" | "onDark";

const variants: Record<Variant, string> = {
  primary: "btn-primaer",
  secondary: "bg-white text-signal-dark ring-1 ring-inset ring-signal-dark/60 hover:bg-hover",
  dark: "bg-ink text-white hover:bg-ink-soft",
  light: "bg-white/10 text-white ring-1 ring-inset ring-white/25 hover:bg-white/20",
  /** Hauptaktion auf dunklen Markenflächen */
  onDark: "bg-accent text-ink hover:bg-white",
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
  // Alle Varianten gleich hoch, damit Primär- und Zweitbutton nebeneinander bündig stehen.
  const sizes = { sm: "h-10 px-4", md: "h-12 px-6", lg: "h-14 px-8" };
  // Primärbutton bringt Schriftgröße und -stärke selbst mit (btn-primaer, 19 px fett).
  const schrift =
    variant === "primary" ? "" : { sm: "text-sm font-semibold", md: "text-[0.95rem] font-semibold", lg: "text-lg font-semibold" }[size];
  // Der Primärbutton bringt Radius, Fläche und Übergänge selbst mit.
  const form = variant === "primary" ? "" : "rounded-2xl transition-colors duration-150 ease-out";
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap ${form} ${sizes[size]} ${schrift} ${variants[variant]} ${className}`}
    >
      {variant === "primary" ? <BtnPfeil>{children}</BtnPfeil> : children}
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
