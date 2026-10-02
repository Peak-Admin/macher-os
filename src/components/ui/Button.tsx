import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

type Variant = "primary" | "secondary" | "light" | "onDark";

const variants: Record<Variant, string> = {
  primary: "btn-primaer",
  /** Nebenaktion: weiß mit erkennbarem Rand, dunkelgrüne Schrift */
  secondary: "bg-white text-signal-dark ring-1 ring-inset ring-line-dark hover:bg-signal-soft",
  light: "bg-white/10 text-white ring-1 ring-inset ring-white/25 hover:bg-white/20",
  /** Hauptaktion auf dunklen Markenflächen: dasselbe Aktionsgrün wie überall, mit hellem Rand für die Kante */
  onDark: "btn-primaer ring-1 ring-inset ring-white/40",
};

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
  const sizes = {
    sm: "min-h-11 px-4",
    md: "min-h-12 px-5",
    lg: "min-h-12 px-6",
  };
  // Primärbutton bringt Schriftgröße und -stärke selbst mit (btn-primaer, 19 px fett).
  const schrift =
    variant === "primary" ? "" : { sm: "text-base font-semibold", md: "text-base font-semibold", lg: "text-lg font-semibold" }[size];
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-md whitespace-nowrap transition-colors duration-150 ease-out ${sizes[size]} ${schrift} ${variants[variant]} ${className}`}
    >
      {children}
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
