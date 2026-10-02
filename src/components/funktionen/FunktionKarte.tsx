import Link from "next/link";
import { Icon, Skizze } from "@/components/ui";
import { funktionInhalte, funktionTitel } from "@/content/funktionen";
import { funktionHref, type FunktionSlug } from "@/content/registry";

/** Karte für eine Funktion – Skizze, Kurzbeschreibung und optional die enthaltenen Unterpunkte. */
export function FunktionKarte({ slug, mitUnterpunkten = false }: { slug: FunktionSlug; mitUnterpunkten?: boolean }) {
  const inhalt = funktionInhalte[slug];
  return (
    <Link
      href={funktionHref(slug)}
      className="group flex h-full flex-col rounded-lg border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:border-ink/30 hover:shadow-lg hover:shadow-ink/5"
    >
      <Skizze motiv={slug} className="-mx-1 -mt-1 mb-5" />
      <h3 className="font-display text-lg font-bold leading-snug">
        {funktionTitel(slug)}
        <Icon
          name="arrow-right"
          className="ml-1.5 inline size-4 -translate-y-px text-signal-dark transition-transform group-hover:translate-x-0.5"
        />
      </h3>
      <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{inhalt.kurz}</p>
      {mitUnterpunkten && inhalt.enthalten && (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {inhalt.enthalten.map((e) => (
            <li key={e} className="rounded-md bg-sand px-2.5 py-0.5 text-xs font-semibold text-ink-soft">
              {e}
            </li>
          ))}
        </ul>
      )}
    </Link>
  );
}
