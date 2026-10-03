import Link from "next/link";
import { Icon, IconTile, type IconName } from "@/components/ui";
import { funktionen, funktionHref, werkzeuge, werkzeugHref, type FunktionSlug, type WerkzeugSlug } from "@/content/registry";

/** Hinweis „keine Rechts-/Steuerberatung“. */
export function Rechtshinweis({ className = "" }: { className?: string }) {
  return (
    <p className={`rounded-lg border border-line bg-sand px-4 py-3 text-sm leading-relaxed text-ink-soft ${className}`}>
      <strong className="font-semibold text-ink">Hinweis:</strong> Dieser Inhalt gibt einen allgemeinen Überblick und
      ersetzt keine Rechts- oder Steuerberatung. Regeln können sich ändern. Für deinen konkreten Fall frag bitte deinen
      Steuerberater, Rechtsanwalt oder deine Handwerkskammer.
    </p>
  );
}

const funktionIcons: Partial<Record<FunktionSlug, IconName>> = {
  anfragen: "inbox",
  telefon: "phone",
  kunden: "user",
  auftraege: "clipboard",
  aufmass: "ruler",
  kalkulation: "calculator",
  angebote: "file",
  dokumentation: "camera",
  rechnungen: "euro",
  zahlungen: "chart",
  kalender: "calendar",
  einsatzplanung: "route",
  mitarbeiter: "users",
  zeiterfassung: "clock",
  qualifikationen: "award",
  schulungen: "book",
  material: "box",
  lager: "warehouse",
  einkauf: "cart",
  werkzeuge: "wrench",
  fahrzeuge: "truck",
  auswertung: "chart",
  "automatisch-erledigen": "spark",
};

/** Kacheln „Passende Funktion in Handwerk OS“. */
export function FunktionLinks({ slugs }: { slugs: FunktionSlug[] }) {
  const liste = slugs.map((s) => funktionen.find((f) => f.slug === s)).filter((f) => f !== undefined);
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {liste.map((f) => (
        <li key={f.slug}>
          <Link
            href={funktionHref(f.slug)}
            className="group flex items-center gap-3 rounded-lg border border-line bg-white p-4 transition hover:border-ink/30"
          >
            <IconTile name={funktionIcons[f.slug] ?? "layers"} className="size-10" />
            <span className="font-semibold leading-snug">{f.titel}</span>
            <Icon
              name="arrow-right"
              className="ml-auto size-4 shrink-0 text-signal-dark transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Kacheln für kostenlose Werkzeuge (Rechner). */
export function WerkzeugLinks({ slugs }: { slugs: readonly WerkzeugSlug[] }) {
  const liste = slugs.map((s) => werkzeuge.find((w) => w.slug === s)).filter((w) => w !== undefined);
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {liste.map((w) => (
        <li key={w.slug}>
          <Link
            href={werkzeugHref(w.slug)}
            className="group flex h-full items-start gap-3 rounded-lg border border-line bg-white p-4 transition hover:border-ink/30"
          >
            <IconTile name="calculator" tone="moss" className="size-10" />
            <span>
              <span className="block font-semibold leading-snug group-hover:text-signal-dark">{w.titel}</span>
              <span className="mt-0.5 block text-sm text-muted">{w.kurz}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Abhakliste (nur Darstellung). */
export function Abhakliste({ punkte }: { punkte: string[] }) {
  return (
    <ul className="grid gap-2.5 sm:grid-cols-2">
      {punkte.map((p) => (
        <li key={p} className="flex items-start gap-3 rounded-md bg-white px-3 py-2.5 ring-1 ring-line">
          <span className="mt-0.5 inline-block size-4.5 shrink-0 rounded-[4px] border-2 border-moss" aria-hidden />
          <span className="leading-snug">{p}</span>
        </li>
      ))}
    </ul>
  );
}
