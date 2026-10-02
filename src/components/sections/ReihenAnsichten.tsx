import Image from "next/image";
import { Icon, IconTile, type IconName } from "@/components/ui/Icon";
import { objekte, type ObjektSchluessel } from "@/lib/objekte";

/**
 * Ansichten für den oberen Teil einer `ReihenKarte`. Jede Karte einer Reihe nimmt eine andere, damit die Reihe
 * lebendig bleibt (Vorbild Feather: Handy-Ausschnitt, Foto mit Hinweis, Objekt mit runder Marke, dunkle Fläche).
 * Alles hier ist Illustration (`aria-hidden`): Die Bedeutung tragen Titel und Details der Karte.
 */

type Zeile = { text: string; icon: IconName; status?: string };

/** Oberer Teil eines Handys mit einer kurzen Liste; läuft unten weich aus. */
export function HandyAusschnitt({ kopf, zeilen }: { kopf: string; zeilen: Zeile[] }) {
  return (
    <div aria-hidden className="absolute inset-x-8 top-8 bottom-0 [mask-image:linear-gradient(to_bottom,#000_70%,transparent)]">
      <div className="h-full rounded-t-[2.25rem] border-[6px] border-b-0 border-ink/85 bg-white px-4 pt-6 shadow-[0_20px_40px_-20px_rgb(16_44_33/0.35)] transition-transform duration-300 ease-out group-hover:-translate-y-1">
        <div className="flex items-center justify-between">
          <span className="font-display text-lg font-bold text-ink">{kopf}</span>
          <span className="flex size-8 items-center justify-center rounded-full bg-sand text-sm font-bold text-ink">M</span>
        </div>
        <ul className="mt-4 space-y-2.5">
          {zeilen.map((z) => (
            <li key={z.text} className="flex items-center gap-3 rounded-xl bg-paper p-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-signal-dark ring-1 ring-line">
                <Icon name={z.icon} className="size-4.5" />
              </span>
              <span className="min-w-0 flex-1 text-sm font-semibold leading-tight text-ink">{z.text}</span>
              {z.status && (
                <span className="shrink-0 rounded-full bg-signal-soft px-2 py-0.5 text-xs font-semibold text-signal-dark">
                  {z.status}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Weißer Hinweis mit grünem Haken – liegt z. B. auf einem Foto („Angebot angenommen“). */
export function Hinweis({ text, icon = "check", className = "" }: { text: string; icon?: IconName; className?: string }) {
  return (
    <div aria-hidden className={`absolute ${className}`}>
      <div className="flex items-center gap-3 rounded-2xl bg-white/95 py-3 pl-3 pr-5 text-ink shadow-[0_16px_32px_-12px_rgb(16_44_33/0.45)] transition-transform duration-300 ease-out group-hover:-translate-y-1">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-white">
          <Icon name={icon} className="size-4.5 stroke-[2.5]" />
        </span>
        <span className="font-display text-lg font-semibold leading-tight">{text}</span>
      </div>
    </div>
  );
}

/** Ausschnitt einer Plantafel, der rechts aus der Karte läuft; oben links ein rundes Objektfoto als Marke. */
export function PlanAusschnitt({
  objekt,
  kopf,
  zeilen,
}: {
  objekt: ObjektSchluessel;
  kopf: string;
  zeilen: { name: string; balken: [start: number, laenge: number, ton: "voll" | "hell"][] }[];
}) {
  return (
    <div aria-hidden className="absolute inset-0">
      <div className="absolute -right-6 bottom-2 left-8 top-14 rounded-l-2xl bg-white p-5 shadow-[0_20px_40px_-24px_rgb(16_44_33/0.4)] transition-transform duration-300 ease-out group-hover:-translate-y-1">
        <p className="pl-20 font-display text-xl font-bold text-ink">{kopf}</p>
        <div className="mt-6 space-y-3">
          {zeilen.map((z) => (
            <div key={z.name} className="flex items-center gap-3">
              <span className="w-14 shrink-0 text-xs font-semibold text-muted">{z.name}</span>
              <span className="relative h-7 flex-1 rounded-md bg-paper">
                {z.balken.map(([start, laenge, ton]) => (
                  <span
                    key={start}
                    className={`absolute inset-y-0 rounded-md ${ton === "voll" ? "bg-primary" : "bg-signal-soft ring-1 ring-inset ring-primary/30"}`}
                    style={{ left: `${start}%`, width: `${laenge}%` }}
                  />
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>
      <span className="absolute left-5 top-6 block size-24 overflow-hidden rounded-full bg-white shadow-[0_12px_28px_-10px_rgb(16_44_33/0.45)] ring-4 ring-white">
        <Image src={objekte[objekt].src} alt="" fill sizes="96px" className="object-cover" />
      </span>
    </div>
  );
}

/** Kleiner Stapel heller Belege auf dunkler Fläche – leicht versetzt. */
export function BelegStapel({ eintraege }: { eintraege: { titel: string; text: string; icon: IconName }[] }) {
  return (
    <div aria-hidden className="absolute inset-x-6 top-10 space-y-3">
      {eintraege.map((e, n) => (
        <div
          key={e.titel}
          className="flex items-center gap-3 rounded-2xl bg-white p-3.5 text-ink shadow-[0_16px_32px_-16px_rgb(0_0_0/0.6)] transition-transform duration-300 ease-out group-hover:-translate-y-1"
          style={{ marginLeft: `${n * 1.25}rem`, marginRight: `${(eintraege.length - 1 - n) * 1.25}rem` }}
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-signal-soft text-signal-dark">
            <Icon name={e.icon} className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block font-semibold leading-tight">{e.titel}</span>
            <span className="block text-sm text-muted">{e.text}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

/** Großes Glas-Icon und eine kurze Aussage – für Karten ohne Foto. */
export function IconAussage({ icon, text, dunkel = false }: { icon: IconName; text: string; dunkel?: boolean }) {
  return (
    <div className="flex h-full flex-col justify-between p-6 pt-8">
      <IconTile name={icon} className="size-28 transition-transform duration-300 ease-out group-hover:-translate-y-1" />
      <p className={`font-display text-2xl font-semibold leading-snug text-pretty ${dunkel ? "text-on-dark" : "text-ink-soft"}`}>{text}</p>
    </div>
  );
}

/** Zitat groß gesetzt, darunter die Rolle. */
export function ZitatAnsicht({ text, rolle, dunkel = false }: { text: string; rolle: string; dunkel?: boolean }) {
  return (
    <figure className="flex h-full flex-col justify-end p-6 pt-16">
      <Icon name="chat" className={`mb-4 size-10 ${dunkel ? "text-accent" : "text-primary"}`} />
      <blockquote className="font-display text-2xl font-semibold leading-snug text-pretty">„{text}“</blockquote>
      <figcaption className={`mt-3 text-sm ${dunkel ? "text-white/70" : "text-muted"}`}>{rolle}</figcaption>
    </figure>
  );
}
