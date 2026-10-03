"use client";

import Image from "next/image";
import { useState } from "react";
import { Icon, IconTile, type IconName } from "@/components/ui/Icon";
import { objekte, type ObjektSchluessel } from "@/lib/objekte";

/**
 * Ansichten für den oberen Teil einer `ReihenKarte`. Jede Karte einer Reihe nimmt eine andere, damit die Reihe
 * lebendig bleibt (Vorbild Feather: Handy-Ausschnitt, Foto mit Hinweis, Objekt mit runder Marke, dunkle Fläche).
 * Die Ausschnitte aus Handwerk OS lassen sich ausprobieren (Haken setzen, Einsatz bestätigen, Beleg erledigen) –
 * sie liegen über dem Link der Karte (`z-10`), der Titel führt weiter. Die Bedeutung tragen Titel und Details der Karte.
 */

type Zeile = { text: string; icon: IconName; status?: string };

/** Oberer Teil eines Handys mit einer kurzen Liste; läuft unten weich aus. Einträge lassen sich abhaken. */
export function HandyAusschnitt({ kopf, zeilen }: { kopf: string; zeilen: Zeile[] }) {
  const [erledigt, setErledigt] = useState<Record<string, boolean>>({});
  return (
    <div role="group" aria-label={`${kopf} zum Ausprobieren (Beispiel)`} className="absolute inset-x-8 top-8 bottom-0 z-10 [mask-image:linear-gradient(to_bottom,#000_70%,transparent)]">
      <div className="h-full rounded-t-[2.25rem] border-[6px] border-b-0 border-ink/85 bg-app-canvas px-4 pt-6 shadow-[0_20px_40px_-20px_rgb(16_44_33/0.35)] transition-transform duration-300 ease-out group-hover:-translate-y-1">
        <div className="flex items-center justify-between">
          <span className="font-display text-lg font-bold text-ink">{kopf}</span>
          <Image src="/bilder/os/team/max-macher.webp" alt="" width={32} height={32} className="size-8 rounded-full object-cover" />
        </div>
        <ul className="mt-4 space-y-2">
          {zeilen.map((z) => {
            const an = !!erledigt[z.text];
            return (
              <li key={z.text}>
                <button
                  type="button"
                  aria-pressed={an}
                  onClick={() => setErledigt((e) => ({ ...e, [z.text]: !an }))}
                  className="app-lift flex w-full items-center gap-3 rounded-xl border border-app-linie bg-white p-2.5 text-left transition-colors duration-150 hover:border-primary"
                >
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-150 ${an ? "bg-primary text-white" : "bg-app-ruhig text-signal-dark"}`}>
                    <Icon name={an ? "check" : z.icon} className="size-4.5" />
                  </span>
                  <span className={`min-w-0 flex-1 text-sm font-semibold leading-tight ${an ? "text-muted line-through" : "text-ink"}`}>{z.text}</span>
                  {an ? (
                    <span className="mini-ein shrink-0 rounded bg-signal-soft px-2 py-0.5 text-sm font-semibold text-moss">Erledigt</span>
                  ) : (
                    z.status && <span className="shrink-0 rounded bg-signal-soft px-2 py-0.5 text-sm font-semibold text-signal-dark">{z.status}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/**
 * Weißer Hinweis mit grünem Haken – liegt z. B. auf einem Foto („Angebot angenommen“).
 * Mit `schritte` ist er ein Knopf: Jeder Klick zeigt den nächsten Schritt (z. B. angenommen → Auftrag → Einsatz).
 */
export function Hinweis({ text, icon = "check", className = "", schritte }: { text: string; icon?: IconName; className?: string; schritte?: string[] }) {
  const [i, setI] = useState(0);
  const inhalt = (t: string) => (
    <>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-white">
        <Icon name={icon} className="size-4.5 stroke-[2.5]" />
      </span>
      <span key={t} className="mini-ein font-display text-lg font-semibold leading-tight">
        {t}
      </span>
    </>
  );
  const klasse =
    "flex items-center gap-3 rounded-2xl bg-white/95 py-3 pl-3 pr-5 text-left text-ink shadow-[0_16px_32px_-12px_rgb(16_44_33/0.45)] transition-transform duration-300 ease-out group-hover:-translate-y-1";
  if (!schritte?.length)
    return (
      <div aria-hidden className={`absolute ${className}`}>
        <div className={klasse}>{inhalt(text)}</div>
      </div>
    );
  const alle = [text, ...schritte];
  return (
    <div className={`absolute z-10 ${className}`}>
      <button type="button" onClick={() => setI((n) => (n + 1) % alle.length)} className={`${klasse} w-full`} aria-label={`${alle[i]} – weiter zum nächsten Schritt (Beispiel)`}>
        {inhalt(alle[i])}
        <span className="ml-auto text-xs font-semibold tabular-nums text-muted">
          {i + 1}/{alle.length}
        </span>
      </button>
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
    <div className="absolute inset-0">
      <div role="group" aria-label={`${kopf} zum Ausprobieren (Beispiel)`} className="absolute -right-6 bottom-2 left-8 top-14 z-10 rounded-l-2xl bg-white p-5 shadow-[0_20px_40px_-24px_rgb(16_44_33/0.4)] transition-transform duration-300 ease-out group-hover:-translate-y-1">
        <p className="pl-20 font-display text-xl font-bold text-ink">{kopf}</p>
        <div className="mt-6 space-y-3">
          {zeilen.map((z) => (
            <PlanZeile key={z.name} name={z.name} balken={z.balken} />
          ))}
        </div>
        <p className="mt-4 text-sm text-muted">Tipp auf einen hellen Einsatz bestätigt ihn.</p>
      </div>
      <span className="absolute left-5 top-6 block size-24 overflow-hidden rounded-full bg-white shadow-[0_12px_28px_-10px_rgb(16_44_33/0.45)] ring-4 ring-white">
        <Image src={objekte[objekt].src} alt="" fill sizes="96px" className="object-cover" />
      </span>
    </div>
  );
}

function PlanZeile({ name, balken }: { name: string; balken: [start: number, laenge: number, ton: "voll" | "hell"][] }) {
  const [bestaetigt, setBestaetigt] = useState<Record<number, boolean>>({});
  return (
    <div className="flex items-center gap-3">
      <span className="w-14 shrink-0 text-sm font-semibold text-muted">{name}</span>
      <span className="relative h-7 flex-1 rounded-md bg-app-ruhig">
        {balken.map(([start, laenge, ton]) => {
          const voll = ton === "voll" || bestaetigt[start];
          return (
            <button
              key={start}
              type="button"
              aria-label={`${name}: Einsatz ${voll ? "bestätigt" : "geplant – bestätigen"}`}
              aria-pressed={voll}
              disabled={ton === "voll"}
              onClick={() => setBestaetigt((b) => ({ ...b, [start]: !b[start] }))}
              className={`absolute inset-y-0 rounded-md transition-colors duration-200 ${voll ? "bg-primary" : "cursor-pointer bg-signal-soft ring-1 ring-inset ring-primary/30 hover:bg-primary/30"}`}
              style={{ left: `${start}%`, width: `${laenge}%` }}
            />
          );
        })}
      </span>
    </div>
  );
}

/** Kleiner Stapel heller Belege auf dunkler Fläche – leicht versetzt. Ein Tipp erledigt den Eintrag. */
export function BelegStapel({ eintraege }: { eintraege: { titel: string; text: string; icon: IconName }[] }) {
  const [erledigt, setErledigt] = useState<Record<string, boolean>>({});
  return (
    <div role="group" aria-label="Betrieb zum Ausprobieren (Beispiel)" className="absolute inset-x-6 top-10 z-10 space-y-3">
      {eintraege.map((e, n) => {
        const an = !!erledigt[e.titel];
        return (
          <button
            key={e.titel}
            type="button"
            aria-pressed={an}
            onClick={() => setErledigt((x) => ({ ...x, [e.titel]: !an }))}
            className="flex w-[calc(100%-2.5rem)] items-center gap-3 rounded-2xl bg-white p-3.5 text-left text-ink shadow-[0_16px_32px_-16px_rgb(0_0_0/0.6)] transition-transform duration-300 ease-out hover:-translate-y-0.5"
            style={{ marginLeft: `${n * 1.25}rem` }}
          >
            <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-150 ${an ? "bg-primary text-white" : "bg-signal-soft text-signal-dark"}`}>
              <Icon name={an ? "check" : e.icon} className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold leading-tight">{e.titel}</span>
              <span className="block text-sm text-muted">{an ? "Erledigt" : e.text}</span>
            </span>
          </button>
        );
      })}
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
