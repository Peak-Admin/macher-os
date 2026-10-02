import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

/**
 * Kleine Bildchen für die Wissen-Kacheln der Startseite: eine abstrakte UI-Andeutung je Angebot
 * (Webinar-Player, Kursfortschritt, Vorlagen, Rechner, Checkliste). Rein dekorativ – die Bedeutung trägt der Text der Kachel.
 * Keine Zahlen, keine Termine: nur Formen.
 */
export type WissenMotiv = "webinare" | "akademie" | "vorlagen" | "rechner" | "checklisten";

const sanft = "transition-transform duration-200 ease-out motion-safe:group-hover:-translate-y-1";

function Strich({ b, dunkel }: { b: string; dunkel?: boolean }) {
  return <span className={`block h-1.5 rounded-full ${dunkel ? "bg-ink/25" : "bg-line"} ${b}`} />;
}

function Haken({ an }: { an?: boolean }) {
  return an ? (
    <span className="grid size-4 shrink-0 place-items-center rounded-[5px] bg-primary text-white">
      <Icon name="check" className="size-3" />
    </span>
  ) : (
    <span className="size-4 shrink-0 rounded-[5px] border-[1.5px] border-line-dark/60 bg-white" />
  );
}

const motive: Record<WissenMotiv, ReactNode> = {
  webinare: (
    <span className={`relative flex h-full flex-col overflow-hidden rounded-lg bg-ink p-2.5 shadow-[0_10px_20px_-12px_color-mix(in_srgb,var(--color-ink)_60%,transparent)] ${sanft}`}>
      <span className="absolute inset-0 bg-[radial-gradient(80%_70%_at_70%_30%,color-mix(in_srgb,var(--color-accent)_22%,transparent),transparent_70%)]" />
      <span className="relative inline-flex items-center gap-1.5 self-start rounded-full bg-white/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
        <span className="size-1.5 rounded-full bg-accent motion-safe:animate-pulse" />
        Live
      </span>
      <span className="relative m-auto grid size-9 place-items-center rounded-full bg-white text-ink shadow-md">
        <Icon name="play" className="ml-0.5 size-4" />
      </span>
      <span className="relative flex items-center gap-2">
        <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
          <span className="block h-full w-2/5 rounded-full bg-accent" />
        </span>
      </span>
    </span>
  ),
  akademie: (
    <span className={`flex h-full flex-col justify-center gap-1.5 rounded-lg bg-white p-3 shadow-[0_10px_20px_-14px_color-mix(in_srgb,var(--color-ink)_45%,transparent)] ring-1 ring-line ${sanft}`}>
      {[true, true, false].map((an, i) => (
        <span key={i} className="flex items-center gap-2">
          <span className={`grid size-4 shrink-0 place-items-center rounded-full ${an ? "bg-primary text-white" : "border-[1.5px] border-primary/50 bg-signal-soft"}`}>
            {an && <Icon name="check" className="size-2.5" />}
          </span>
          <Strich b={["w-4/5", "w-3/5", "w-2/3"][i]} />
        </span>
      ))}
      <span className="mt-0.5 h-1.5 shrink-0 overflow-hidden rounded-full bg-signal-soft">
        <span className="block h-full w-2/3 rounded-full bg-primary" />
      </span>
    </span>
  ),
  vorlagen: (
    <span className="relative block h-full">
      <span className="absolute inset-y-1 left-[18%] right-[22%] rotate-[-7deg] rounded-md bg-white ring-1 ring-line" />
      <span className={`absolute inset-y-0 left-[26%] right-[14%] flex flex-col gap-1.5 rounded-md bg-white p-2.5 shadow-[0_10px_20px_-12px_color-mix(in_srgb,var(--color-ink)_45%,transparent)] ring-1 ring-line ${sanft}`}>
        <span className="h-2 w-1/2 rounded-full bg-primary" />
        <Strich b="w-full" />
        <Strich b="w-4/5" />
        <Strich b="w-11/12" />
        <svg viewBox="0 0 60 14" className="mt-auto h-3 w-1/2 text-ink/60" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M2 10c5-8 8 4 12-2s6-6 9 1 7 2 10-3 8 3 12 1 6-4 13-2" />
        </svg>
      </span>
    </span>
  ),
  rechner: (
    <span className={`flex h-full flex-col gap-1.5 rounded-lg bg-white p-2 shadow-[0_10px_20px_-14px_color-mix(in_srgb,var(--color-ink)_45%,transparent)] ring-1 ring-line ${sanft}`}>
      <span className="flex h-6 items-center justify-end gap-1 rounded-md bg-ink px-2">
        <span className="h-1.5 w-8 rounded-full bg-white/80" />
        <span className="text-[10px] font-bold text-accent">€</span>
      </span>
      <span className="grid flex-1 grid-cols-4 gap-1">
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} className={`rounded-[4px] ${i === 7 ? "bg-primary" : i % 4 === 3 ? "bg-signal-soft" : "bg-sand"}`} />
        ))}
      </span>
    </span>
  ),
  checklisten: (
    <span className={`flex h-full flex-col justify-center gap-2 rounded-lg bg-white p-3 shadow-[0_10px_20px_-14px_color-mix(in_srgb,var(--color-ink)_45%,transparent)] ring-1 ring-line ${sanft}`}>
      {[true, true, false].map((an, i) => (
        <span key={i} className="flex items-center gap-2">
          <Haken an={an} />
          <span className={`block h-1.5 rounded-full ${an ? "bg-line" : "bg-ink/25"} ${["w-3/4", "w-1/2", "w-2/3"][i]}`} />
        </span>
      ))}
    </span>
  ),
};

export function WissenVignette({ motiv }: { motiv: WissenMotiv }) {
  return (
    <span aria-hidden className="block h-24">
      {motive[motiv]}
    </span>
  );
}
