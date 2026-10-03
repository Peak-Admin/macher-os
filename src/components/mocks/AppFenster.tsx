import Image from "next/image";
import type { ReactNode } from "react";
import { GlasIcon, type GlasIconName } from "@/os/ui/glas";
import { Icon, type IconName } from "@/components/ui/Icon";

/**
 * Gemeinsamer Rahmen aller Produktansichten auf der Website – nachgebaut nach der echten Software (Spielwiese,
 * Oktober 2026): schwebende weiße Seitenleiste auf beigem Canvas mit Logo, Betrieb, „Suchen“ mit Kürzel,
 * Benachrichtigungen, den vier Bereichen und Favoriten – Navigation mit Glas-Icons wie in der Software.
 * Neue Vorschauen bauen auf diesem Rahmen auf, damit die Website nie eine ältere Oberfläche zeigt.
 */

export type VorschauBereich = "heute" | "auftraege" | "planen" | "betrieb";

export type NavEintrag<T extends string = string> = { id: T; label: string; glas: GlasIconName; zahl?: string };

export const BEREICHE: NavEintrag<VorschauBereich>[] = [
  { id: "heute", label: "Heute", glas: "sonne" },
  { id: "auftraege", label: "Aufträge", glas: "auftrag", zahl: "9+" },
  { id: "planen", label: "Planen", glas: "kalender" },
  { id: "betrieb", label: "Betrieb", glas: "haus" },
];

export const FAVORITEN: NavEintrag[] = [
  { id: "angebote", label: "Angebote", glas: "dokument" },
  { id: "rechnungen", label: "Rechnungen", glas: "rechnung" },
  { id: "auswertung", label: "Auswertung", glas: "auswertung" },
];

/** Bezeichnung des Bereichs aus der Website-Sprache („Heute“, „Aufträge“ …) → Bereichs-ID */
export const bereichAusLabel = (label: string): VorschauBereich =>
  BEREICHE.find((b) => b.label === label)?.id ?? "heute";

function NavZeile({
  e,
  aktiv,
  klein,
  onClick,
}: {
  e: NavEintrag;
  aktiv: boolean;
  klein?: boolean;
  onClick?: () => void;
}) {
  const klasse = `flex w-full shrink-0 items-center gap-2 rounded-lg px-2 text-left transition-colors duration-150 ${
    klein ? "py-1 text-[12px]" : "py-1.5 text-[13px]"
  } ${aktiv ? "bg-signal-soft font-semibold text-signal-dark" : "font-medium text-ink"} ${onClick && !aktiv ? "hover:bg-hover" : ""}`;
  const inhalt = (
    <>
      <GlasIcon name={e.glas} size={klein ? 18 : 22} className="shrink-0" />
      <span className="min-w-0 flex-1 truncate">{e.label}</span>
      {e.zahl && <span className="rounded bg-ink px-1.5 text-[10px] font-bold text-white">{e.zahl}</span>}
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} aria-current={aktiv ? "page" : undefined} className={klasse}>
      {inhalt}
    </button>
  ) : (
    <span className={klasse}>{inhalt}</span>
  );
}

/**
 * Seitenleiste wie in der Software. Ohne `waehle` ist sie reine Ansicht (für `role="img"`-Vorschauen),
 * mit `waehle` sind Bereiche und Favoriten klickbar.
 */
export function AppSeitenleiste<F extends string = string>({
  aktiv,
  favoriten = FAVORITEN as NavEintrag<F>[],
  aktivFavorit,
  waehle,
  waehleFavorit,
  suche,
  navLabel = "Bereiche der Vorschau",
}: {
  aktiv?: VorschauBereich;
  favoriten?: NavEintrag<F>[];
  aktivFavorit?: F;
  waehle?: (b: VorschauBereich) => void;
  waehleFavorit?: (f: F) => void;
  /** Optional: „Suchen“ klickbar machen */
  suche?: { aktiv: boolean; oeffnen: () => void };
  navLabel?: string;
}) {
  const sucheKlasse = `app-lift flex w-full items-center gap-2 rounded-lg border bg-white px-2.5 py-1.5 text-[12px] text-ink transition-colors duration-150 ${
    suche?.aktiv ? "border-primary" : "border-app-linie"
  } ${suche ? "hover:border-primary" : ""}`;
  const sucheInhalt = (
    <>
      <Icon name="search" className="size-3.5" />
      <span className="flex-1 text-left">Suchen</span>
      <kbd className="rounded border border-app-linie bg-app-ruhig px-1 font-sans text-[10px] font-semibold text-muted">Strg K</kbd>
    </>
  );
  return (
    <aside className="flex min-w-0 flex-col gap-2 border-b border-app-linie bg-white p-2.5 sm:app-lift sm:rounded-2xl sm:border sm:border-app-linie">
      <div className="flex items-center gap-2 px-1">
        <Image src="/marke/zeichen.png" alt="" width={24} height={24} className="size-6 shrink-0" />
        <span className="whitespace-nowrap font-display text-[15px] text-ink">
          Handwerk <b className="font-black">OS</b>
        </span>
        <span className="ml-auto rounded-sm border border-dashed border-line-dark px-1 text-[10px] font-semibold text-muted sm:hidden">Beispiel</span>
      </div>
      <div className="app-lift hidden items-center gap-2 rounded-lg border border-app-linie bg-white px-2 py-1.5 sm:flex">
        <span className="inline-flex size-5 shrink-0 items-center justify-center rounded bg-signal-dark text-[10px] font-bold text-white">M</span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[12px] font-bold">Musterbetrieb</span>
          <span className="block truncate text-[10px] text-muted">Spielwiese</span>
        </span>
        <span className="shrink-0 rounded-sm border border-dashed border-line-dark px-1 text-[10px] font-semibold text-muted">Beispiel</span>
      </div>
      {/* Eine Fläche: Lupe, „Suchen“, Kürzel – die KI-Kugel erst in der KI-Leiste */}
      {suche ? (
        <button type="button" onClick={suche.oeffnen} className={sucheKlasse}>
          {sucheInhalt}
        </button>
      ) : (
        <span className={sucheKlasse}>{sucheInhalt}</span>
      )}
      <span className="hidden sm:block">
        <NavZeile e={{ id: "benachrichtigungen", label: "Benachrichtigungen", glas: "glocke", zahl: "3" }} aktiv={false} klein />
      </span>
      <nav aria-label={navLabel} className="grid grid-cols-2 gap-1 sm:mt-1 sm:grid-cols-1">
        {BEREICHE.map((b) => (
          <NavZeile key={b.id} e={b} aktiv={!aktivFavorit && aktiv === b.id} onClick={waehle && (() => waehle(b.id))} />
        ))}
      </nav>
      {favoriten.length > 0 && (
        <div className="hidden border-t border-app-linie pt-2 sm:block">
          <p className="flex items-center gap-1 px-2 pb-1 text-[11px] font-semibold text-muted">
            <Icon name="chevron-down" className="size-3" /> Favoriten
          </p>
          {favoriten.map((f) => (
            <NavZeile
              key={f.id}
              e={f}
              klein
              aktiv={aktivFavorit === f.id}
              onClick={waehleFavorit && (() => waehleFavorit(f.id))}
            />
          ))}
        </div>
      )}
      <div className="mt-auto hidden items-center gap-2 border-t border-app-linie px-1 pt-2 sm:flex">
        <Image src="/bilder/os/team/max-macher.webp" alt="" width={24} height={24} className="size-6 rounded-full object-cover" />
        <span className="text-[12px] font-semibold">Max Macher</span>
      </div>
    </aside>
  );
}

/** Fenster: beiger Canvas, Seitenleiste links, Inhalt rechts. */
export function AppFenster({
  seitenleiste,
  children,
  className = "",
  ...rest
}: {
  seitenleiste: ReactNode;
  children: ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <section {...rest} className={`vorschau-fenster overflow-hidden border border-line bg-app-canvas text-ink ${className}`}>
      <div className="grid h-full gap-0 sm:grid-cols-[11.5rem_1fr] sm:gap-2 sm:p-2">
        {seitenleiste}
        <div className="min-h-0 min-w-0 overflow-y-auto p-3 sm:p-4">{children}</div>
      </div>
    </section>
  );
}

/* ---------- Bausteine für den Inhalt, wie in der Software ---------- */

export type StatusTon = "neutral" | "erfolg" | "warnung" | "gefahr";
const statusKlassen: Record<StatusTon, string> = {
  warnung: "bg-warning-soft text-warning",
  neutral: "bg-app-ruhig text-muted",
  erfolg: "bg-signal-soft text-moss",
  gefahr: "bg-danger-soft text-danger",
};

/** Status immer mit Text und Icon – nie nur Farbe */
export function VorschauStatus({ ton, children }: { ton: StatusTon; children: ReactNode }) {
  const icon: IconName = ton === "erfolg" ? "check" : ton === "neutral" ? "clock" : "achtung";
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${statusKlassen[ton]}`}>
      <Icon name={icon} className="size-3" />
      {children}
    </span>
  );
}

/** Aufgelegtes weißes Blatt (Karte, Liste) */
export function Blatt({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`app-lift overflow-hidden rounded-xl border border-app-linie bg-white ${className}`}>{children}</div>;
}

/** Handy-Rahmen wie die Mitarbeiter-App (`PhoneMock`): dunkler Rahmen, beiger Canvas, Beispiel-Hinweis. */
export function HandyRahmen({
  kopf,
  zeit = "9:41",
  children,
  className = "",
  ...rest
}: {
  kopf: ReactNode;
  zeit?: string;
  children: ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest} className={`mx-auto w-[280px] max-w-full rounded-[2.5rem] border-[10px] border-ink bg-ink shadow-2xl shadow-ink/30 ${className}`}>
      <div className="overflow-hidden rounded-[1.8rem] bg-app-canvas">
        <div className="flex items-center justify-between bg-ink px-5 pb-3 pt-2 text-[0.65rem] text-white/80">
          <span>{zeit}</span>
          <span className="h-4 w-16 rounded-full bg-black" />
          <span>100%</span>
        </div>
        <div className="space-y-3 p-4">
          <p className="flex items-center justify-between gap-2 text-[0.7rem] font-semibold text-muted">
            <span className="min-w-0 truncate">{kopf}</span>
            <span className="shrink-0 rounded-sm border border-dashed border-line-dark px-1 text-[0.6rem]">Beispiel</span>
          </p>
          {children}
        </div>
      </div>
    </div>
  );
}
