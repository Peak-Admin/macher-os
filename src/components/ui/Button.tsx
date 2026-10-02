import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

type Variant = "primary" | "secondary" | "dark" | "light";

const variants: Record<Variant, string> = {
  primary: "bg-signal text-ink hover:bg-signal-dark shadow-[0_1px_0_rgba(0,0,0,0.15)]",
  secondary: "bg-white text-ink ring-1 ring-inset ring-line hover:ring-ink/40",
  dark: "bg-ink text-white hover:bg-ink-soft",
  light: "bg-white/10 text-white ring-1 ring-inset ring-white/25 hover:bg-white/20",
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
    sm: "h-9 px-4 text-sm",
    md: "h-11 px-5 text-[0.95rem]",
    lg: "h-13 px-7 text-base",
  };
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${sizes[size]} ${variants[variant]} ${className}`}
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
