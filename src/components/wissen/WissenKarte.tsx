import Link from "next/link";
import { Icon, type IconName } from "@/components/ui";
import type { WissenEintrag, WissenTyp } from "@/content/wissen";

export const typIcons: Record<WissenTyp, IconName> = {
  Artikel: "book",
  Webinar: "play",
  Vorlage: "file",
  Checkliste: "clipboard",
  Formular: "pen",
  Kurs: "award",
};

const typTon: Record<WissenTyp, string> = {
  Artikel: "bg-sky-soft text-sky",
  Webinar: "bg-signal-soft text-signal-dark",
  Vorlage: "bg-moss-soft text-moss",
  Checkliste: "bg-moss-soft text-moss",
  Formular: "bg-moss-soft text-moss",
  Kurs: "bg-sand text-ink-soft",
};

/** Kleines Typ-Label mit Icon, z. B. „Artikel“ oder „Webinar“. */
export function TypLabel({ typ }: { typ: WissenTyp }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-sm font-semibold ${typTon[typ]}`}>
      <Icon name={typIcons[typ]} className="size-3.5" />
      {typ}
    </span>
  );
}

/** Karte für einen beliebigen Wissensinhalt. */
export function WissenKarte({ eintrag, kompakt = false }: { eintrag: WissenEintrag; kompakt?: boolean }) {
  return (
    <Link
      href={eintrag.href}
      className="group flex h-full flex-col rounded-lg border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:border-ink/30 hover:shadow-lg hover:shadow-ink/5"
    >
      <div className="flex flex-wrap items-center gap-2">
        <TypLabel typ={eintrag.typ} />
        {eintrag.meta && <span className="text-sm font-medium text-muted">{eintrag.meta}</span>}
      </div>
      <h3 className="mt-3 font-display text-lg font-bold leading-snug text-balance group-hover:text-signal-dark">
        {eintrag.titel}
      </h3>
      {!kompakt && <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{eintrag.text}</p>}
      <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-ink">
        Ansehen
        <Icon name="arrow-right" className="size-4 text-signal-dark transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

/** Schlichte Linkliste für Wissensinhalte (z. B. in Gewerk-Kacheln). */
export function WissenLinkListe({ eintraege }: { eintraege: WissenEintrag[] }) {
  return (
    <ul className="divide-y divide-line">
      {eintraege.map((e) => (
        <li key={e.href}>
          <Link href={e.href} className="group flex items-start gap-3 py-2.5 text-[0.95rem] hover:text-signal-dark">
            <Icon name={typIcons[e.typ]} className="mt-0.5 size-4 shrink-0 text-muted group-hover:text-signal-dark" />
            <span className="leading-snug">{e.titel}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
