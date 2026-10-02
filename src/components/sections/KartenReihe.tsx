"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { BtnPfeil } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

/**
 * Kartenreihe (Vorbild: Kartenreihen mit „+“ wie bei Feather): Überschrift in zwei Zeilen – Aussage dunkel,
 * Nachsatz grau –, rechts zwei runde Knöpfe ‹ ›, darunter eine waagerecht scrollende Reihe hoher Karten.
 * Kein Auto-Carousel: Nichts bewegt sich von allein. Weiterkommen geht per Knopf, Tastatur (Tab, Pfeiltasten im
 * Bereich), Wischen oder Scrollrad – nie nur per Wischen. Die Karten rasten an ihrer linken Kante ein.
 * Karten: `ReihenKarte` (src/components/sections/ReihenKarte.tsx).
 */
export function KartenReihe({
  titel,
  nachsatz,
  eyebrow,
  dunkel = false,
  children,
}: {
  titel: ReactNode;
  /** zweite Zeile der Überschrift, grau */
  nachsatz?: ReactNode;
  eyebrow?: string;
  /** auf dunkler Markenfläche */
  dunkel?: boolean;
  /** `ReihenKarte`-Elemente */
  children: ReactNode;
}) {
  const reihe = useRef<HTMLUListElement>(null);
  const titelId = useId();
  const [anfang, setAnfang] = useState(true);
  const [ende, setEnde] = useState(false);

  const messen = useCallback(() => {
    const el = reihe.current;
    if (!el) return;
    setAnfang(el.scrollLeft <= 2);
    setEnde(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = reihe.current;
    if (!el) return;
    messen();
    const ro = new ResizeObserver(messen);
    ro.observe(el);
    el.addEventListener("scroll", messen, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", messen);
    };
  }, [messen]);

  /** Blättert um so viele Karten, wie ganz zu sehen sind (mindestens eine). */
  const blaettern = (richtung: 1 | -1) => {
    const el = reihe.current;
    if (!el) return;
    const karten = el.children;
    const schritt =
      karten.length > 1
        ? (karten[1] as HTMLElement).offsetLeft - (karten[0] as HTMLElement).offsetLeft
        : el.clientWidth;
    const anzahl = Math.max(1, Math.floor(el.clientWidth / schritt));
    const ruhig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: richtung * anzahl * schritt, behavior: ruhig ? "auto" : "smooth" });
  };

  const knopf = dunkel
    ? "bg-white/10 text-white ring-1 ring-inset ring-white/25 hover:bg-white/20"
    : "bg-sand text-ink hover:bg-line";

  return (
    <div role="region" aria-labelledby={titelId}>
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
        <div className="max-w-3xl">
          {eyebrow && (
            <p
              className={`mb-3 text-sm font-semibold font-tagline uppercase tracking-[0.06em] ${dunkel ? "text-accent" : "text-signal-dark"}`}
            >
              {eyebrow}
            </p>
          )}
          <h2
            id={titelId}
            className="font-display text-3xl font-bold leading-[1.1] tracking-tight text-balance sm:text-4xl lg:text-[2.75rem]"
          >
            <span className="block">{titel}</span>
            {nachsatz && <span className={`block ${dunkel ? "text-white/65" : "text-muted"}`}>{nachsatz}</span>}
          </h2>
        </div>
        {!(anfang && ende) && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => blaettern(-1)}
              disabled={anfang}
              aria-label="Zurück blättern"
              className={`flex size-12 items-center justify-center rounded-full transition-colors duration-150 ease-out disabled:cursor-default disabled:opacity-40 ${knopf}`}
            >
              <Icon name="chevron-left" className="size-6" />
            </button>
            <button
              type="button"
              onClick={() => blaettern(1)}
              disabled={ende}
              aria-label="Weiter blättern"
              className={`flex size-12 items-center justify-center rounded-full transition-colors duration-150 ease-out disabled:cursor-default disabled:opacity-40 ${knopf}`}
            >
              <Icon name="chevron-right" className="size-6" />
            </button>
          </div>
        )}
      </div>
      {/* Läuft bis an den Rand der Box; py gibt den Fokusringen Platz, die der Scrollbereich sonst abschneidet. */}
      <ul
        ref={reihe}
        className="karten-reihe -mx-4 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 py-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:-mx-8 lg:mt-12 lg:gap-6 lg:scroll-px-8 lg:px-8"
      >
        {children}
      </ul>
    </div>
  );
}

/**
 * Runder „+“-Knopf einer Karte: öffnet die Details als modales `<dialog>` (Escape, Klick daneben und „Schließen“
 * schließen es, der Fokus kehrt zum Knopf zurück).
 */
export function KartenDetails({
  titel,
  href,
  linkText,
  hell,
  children,
}: {
  titel: string;
  href: string;
  linkText: string;
  /** Knopf liegt auf einem Foto (weiß statt grau) */
  hell: boolean;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titelId = useId();
  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-haspopup="dialog"
        aria-label={`Mehr zu ${titel}`}
        className={`relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full shadow-sm transition-transform duration-150 ease-out hover:scale-105 ${
          hell ? "bg-white text-ink" : "bg-white text-ink ring-1 ring-line"
        }`}
      >
        <Icon name="plus" className="size-6" />
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={titelId}
        onClick={(e) => {
          // Klick auf den Hintergrund (das Dialog-Element selbst, nicht sein Inhalt) schließt.
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="karten-dialog m-auto w-[calc(100%-2rem)] max-w-lg rounded-3xl border-0 bg-white p-0 text-ink shadow-popover"
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <h3 id={titelId} className="font-display text-2xl font-bold leading-tight">
              {titel}
            </h3>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="-mr-2 -mt-1 flex min-h-12 shrink-0 items-center gap-2 rounded-md px-3 font-semibold text-signal-dark hover:bg-hover"
            >
              <Icon name="x" className="size-5" />
              Schließen
            </button>
          </div>
          <div className="mt-4 leading-relaxed text-ink-soft">{children}</div>
          <Link
            href={href}
            className="btn-primaer mt-6 inline-flex min-h-12 items-center justify-center px-5"
          >
            <BtnPfeil>{linkText}</BtnPfeil>
          </Link>
        </div>
      </dialog>
    </>
  );
}
