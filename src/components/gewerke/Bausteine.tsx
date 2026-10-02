import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui";
import type { Arbeitsweise } from "@/content/gewerke";
import { funktionen, type FunktionSlug } from "@/content/registry";

export const arbeitsweiseIcon: Record<Arbeitsweise, IconName> = {
  Kundendienst: "truck",
  Baustelle: "warehouse",
  Werkstatt: "wrench",
  Fertigung: "layers",
  Laden: "home",
};

export function funktionTitel(slug: FunktionSlug) {
  return funktionen.find((f) => f.slug === slug)?.titel ?? slug;
}

/** Kompakte Link-Kachel auf eine Funktionsseite. */
export function FunktionLink({ slug, text }: { slug: FunktionSlug; text?: string }) {
  return (
    <Link
      href={`/funktionen/${slug}`}
      className="group flex h-full flex-col rounded-lg border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:border-ink/30 hover:shadow-lg hover:shadow-ink/5"
    >
      <span className="flex items-center justify-between gap-3 font-display text-lg font-bold leading-snug">
        {funktionTitel(slug)}
        <Icon
          name="arrow-right"
          className="size-4 shrink-0 text-signal-dark transition-transform group-hover:translate-x-0.5"
        />
      </span>
      {text && <span className="mt-2 text-[0.95rem] leading-relaxed text-muted">{text}</span>}
    </Link>
  );
}

/** Kleiner Link-Chip, z. B. für „Relevante Funktionen“. */
export function ChipLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-md bg-white px-3.5 py-2 text-sm font-semibold ring-1 ring-line transition hover:ring-ink/40"
    >
      {children}
      <Icon name="arrow-right" className="size-3.5 text-signal-dark" />
    </Link>
  );
}

/** Liste mit Überschrift für „Für dein Gewerk eingerichtet“. */
export function EinrichtungsListe({ titel, icon, items }: { titel: string; icon: IconName; items: string[] }) {
  return (
    <div className="rounded-lg border border-line bg-white p-6">
      <p className="flex items-center gap-2 font-display text-lg font-bold">
        <Icon name={icon} className="size-5 text-signal-dark" /> {titel}
      </p>
      <ul className="mt-4 space-y-2.5">
        {items.map((i) => (
          <li key={i} className="flex gap-2.5 text-[0.95rem] leading-snug">
            <Icon name="check" className="mt-0.5 size-4 shrink-0 text-moss" />
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}
