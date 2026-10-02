import Link from "next/link";
import type { ReactNode } from "react";
import type { ObjektSchluessel } from "@/lib/objekte";
import { Icon, IconTile, type IconName } from "./Icon";
import { Objekt } from "./Objekt";
import { Fenster } from "./Fenster";
import { Skizze, type SkizzenMotiv } from "./Skizze";

/** Einfache Karte. Mit `href` wird die ganze Karte klickbar. */
export function Card({
  title,
  children,
  href,
  icon,
  iconTone,
  eyebrow,
  objekt,
  skizze,
  fenster = false,
  className = "",
}: {
  title: ReactNode;
  /** Objektbild oben in der Karte (statt Icon) – ein starkes Objekt pro Karte */
  objekt?: ObjektSchluessel;
  /** Abstrakte Skizze einer Funktion oben in der Karte (statt Icon) – wenn die Karte eine Funktion kurz erklärt */
  skizze?: SkizzenMotiv;
  /** Fenster-Skizze mit dem Glas-Icon zu `icon` oben in der Karte (statt Icon) – für Einstiege und Schnittstellen */
  fenster?: boolean;
  children?: ReactNode;
  href?: string;
  icon?: IconName;
  iconTone?: "signal" | "moss" | "sky" | "ink";
  eyebrow?: ReactNode;
  className?: string;
}) {
  const body = (
    <>
      {objekt ? (
        <Objekt objekt={objekt} className="-mx-2 -mt-2 mb-5" />
      ) : skizze ? (
        <Skizze motiv={skizze} className="-mx-2 -mt-2 mb-5" />
      ) : fenster && icon ? (
        <Fenster icon={icon} className="-mx-2 -mt-2 mb-5" />
      ) : (
        icon && <IconTile name={icon} tone={iconTone} className="mb-4" />
      )}
      {eyebrow && <div className="mb-2 text-xs font-semibold font-tagline uppercase tracking-wider text-muted">{eyebrow}</div>}
      <h3 className="font-display text-xl font-semibold leading-snug">
        {title}
        {href && (
          <Icon
            name="arrow-right"
            className="ml-1.5 inline size-4 -translate-y-px text-signal-dark transition-transform group-hover:translate-x-0.5"
          />
        )}
      </h3>
      {children && <div className="mt-2 text-[0.95rem] leading-relaxed text-muted">{children}</div>}
    </>
  );
  const base = `group block rounded-2xl border border-line bg-white p-6 shadow-[0_1px_2px_rgb(14_19_12/0.04)] ${className}`;
  if (href) {
    return (
      <Link href={href} className={`${base} transition hover:-translate-y-0.5 hover:border-ink/30 hover:shadow-lg hover:shadow-ink/5`}>
        {body}
      </Link>
    );
  }
  return <div className={base}>{body}</div>;
}

/** Häkchen-Liste für Vorteile und Aufzählungen. */
export function CheckList({
  items,
  columns = 1,
  className = "",
}: {
  items: ReactNode[];
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  const cols = { 1: "", 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3" }[columns];
  return (
    <ul className={`grid gap-x-8 gap-y-3 ${cols} ${className}`}>
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-0.5 inline-flex size-5.5 shrink-0 items-center justify-center rounded-full bg-moss text-white">
            <Icon name="check" className="size-3.5" />
          </span>
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Kleines Label, z. B. „Beispiel“ oder „Neu“. */
export function Badge({
  children,
  tone = "sand",
}: {
  children: ReactNode;
  tone?: "sand" | "signal" | "moss" | "sky" | "ink";
}) {
  const tones = {
    sand: "bg-sand text-ink-soft",
    signal: "bg-signal-soft text-signal-dark",
    moss: "bg-moss-soft text-moss",
    sky: "bg-sky-soft text-sky",
    ink: "bg-ink text-white",
  };
  return (
    <span className={`inline-flex items-center rounded px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}
