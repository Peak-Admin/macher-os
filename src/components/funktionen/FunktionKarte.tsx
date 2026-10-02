import Link from "next/link";
import { Icon, IconTile } from "@/components/ui";
import { funktionInhalte, funktionTitel } from "@/content/funktionen";
import { funktionHref, type FunktionSlug } from "@/content/registry";

/** Karte für eine Funktion – mit Kurzbeschreibung und optional den enthaltenen Unterpunkten. */
export function FunktionKarte({ slug, mitUnterpunkten = false }: { slug: FunktionSlug; mitUnterpunkten?: boolean }) {
  const inhalt = funktionInhalte[slug];
  return (
    <Link
      href={funktionHref(slug)}
      className="group flex h-full flex-col rounded-lg border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:border-ink/30 hover:shadow-lg hover:shadow-ink/5"
    >
      <div className="flex items-center gap-3">
        <IconTile name={inhalt.icon} className="size-10" />
        <h3 className="min-w-0 font-display text-lg font-bold leading-snug [overflow-wrap:anywhere]">
          {funktionTitel(slug)}
          <Icon
            name="arrow-right"
            className="ml-1.5 inline size-4 -translate-y-px text-signal-dark transition-transform group-hover:translate-x-0.5"
          />
        </h3>
      </div>
      {inhalt.aufAnfrage && (
        <p className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-md bg-signal-soft px-2.5 py-0.5 text-xs font-semibold text-signal-dark">
          <Icon name="chat" className="size-3.5" /> Auf Anfrage
        </p>
      )}
      <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">{inhalt.kurz}</p>
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
