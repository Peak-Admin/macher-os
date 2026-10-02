"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type FocusEvent, type MouseEvent } from "react";
import { BtnPfeil } from "@/components/ui/Button";
import { GlasIcon } from "@/os/ui/glas";
import { Icon } from "@/components/ui/Icon";
import { cta, mainNav, type Mega, type MegaGewerk, type MegaGruppe, type MegaVorschau, type NavItem } from "@/lib/site";
import { Logo } from "./Logo";

type MegaItem = NavItem & { mega: Mega };
const megaItems = mainNav.filter((n): n is MegaItem => !!n.mega);
const panelId = (label: string) => `mega-${label.toLowerCase()}`;
/** Ab dieser Breite gilt die Desktop-Navigation (`--breakpoint-nav` in globals.css). */
const DESKTOP = "(min-width: 75rem)";

/**
 * Kopf der Website.
 * Desktop (ab 1200 px): fünf Punkte, Funktionen/Gewerke/Wissen öffnen per Klick ein Mega-Menü – immer nur eines.
 * Darunter: Logo, (ab 480 px) „Kostenlos testen“ und ein beschrifteter Menü-Knopf, der einen modalen Dialog öffnet.
 *
 * Der Kopf ist bewusst deckend und ohne `backdrop-filter`: Ein Filter macht den Kopf zum Bezugsrahmen für fest
 * positionierte Kinder – das frühere mobile Menü war dadurch nur 1 px hoch und unsichtbar.
 */
export function Header() {
  const pathname = usePathname();
  const [offen, setOffen] = useState<string | null>(null);
  const [mobil, setMobil] = useState(false);
  const [kopfUnten, setKopfUnten] = useState(64);
  const kopf = useRef<HTMLElement>(null);
  const ausloeser = useRef<Record<string, HTMLButtonElement | null>>({});
  const menueKnopf = useRef<HTMLButtonElement>(null);

  // Ein Seitenwechsel schließt alles.
  const [letzterPfad, setLetzterPfad] = useState(pathname);
  if (pathname !== letzterPfad) {
    setLetzterPfad(pathname);
    setOffen(null);
    setMobil(false);
  }

  // Wechsel zwischen Desktop und Handy/Tablet: offene Menüs schließen, damit nichts unsichtbar offen bleibt.
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP);
    const wechsel = () => {
      setOffen(null);
      setMobil(false);
    };
    mq.addEventListener("change", wechsel);
    return () => mq.removeEventListener("change", wechsel);
  }, []);

  // Desktop-Panel: Escape schließt (Fokus zurück zum Auslöser), Klick außerhalb schließt.
  // Die Unterkante des Kopfs wird gemessen, damit das Panel nie unter den Bildschirmrand reicht.
  useEffect(() => {
    if (!offen) return;
    const k = kopf.current;
    const taste = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOffen(null);
      ausloeser.current[offen]?.focus();
    };
    const zeiger = (e: PointerEvent) => {
      if (k && !k.contains(e.target as Node)) setOffen(null);
    };
    const messen = () => k && setKopfUnten(Math.max(0, k.getBoundingClientRect().bottom));
    const beobachter = new ResizeObserver(messen);
    if (k) beobachter.observe(k);
    document.addEventListener("keydown", taste);
    document.addEventListener("pointerdown", zeiger);
    return () => {
      beobachter.disconnect();
      document.removeEventListener("keydown", taste);
      document.removeEventListener("pointerdown", zeiger);
    };
  }, [offen]);

  const umschalten = (label: string) => setOffen((o) => (o === label ? null : label));

  /** Fokus verlässt den Menüpunkt samt Panel per Tastatur → Panel zu. Mausklicks regelt `pointerdown`. */
  const fokusWeg = (label: string) => (e: FocusEvent<HTMLLIElement>) => {
    const ziel = e.relatedTarget as Node | null;
    if (ziel && !e.currentTarget.contains(ziel)) setOffen((o) => (o === label ? null : o));
  };

  return (
    <header ref={kopf} className="sticky top-0 z-50 border-b border-line bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 nav:gap-6 lg:px-8">
        <Logo />

        <nav aria-label="Hauptnavigation" className="hidden min-w-0 flex-1 nav:block">
          <ul className="flex items-center gap-1">
            {mainNav.map((item) =>
              item.mega ? (
                <li key={item.label} onBlur={fokusWeg(item.label)}>
                  <button
                    type="button"
                    ref={(el) => {
                      ausloeser.current[item.label] = el;
                    }}
                    aria-expanded={offen === item.label}
                    aria-controls={panelId(item.label)}
                    onClick={() => umschalten(item.label)}
                    className={`flex min-h-11 items-center gap-1 rounded-md px-3 text-base font-semibold transition-colors duration-150 ease-out hover:bg-hover ${
                      offen === item.label ? "bg-signal-soft text-signal-dark" : pathname.startsWith(item.href) ? "text-ink" : "text-muted"
                    }`}
                  >
                    {item.label}
                    <Icon
                      name="chevron-down"
                      className={`size-4 transition-transform duration-150 ease-out ${offen === item.label ? "rotate-180" : ""}`}
                    />
                  </button>
                  {offen === item.label && <MegaPanel item={item as MegaItem} maxHoehe={`calc(100dvh - ${kopfUnten}px - 24px)`} />}
                </li>
              ) : (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    aria-current={pathname === item.href ? "page" : undefined}
                    className="flex min-h-11 items-center rounded-md px-3 text-base font-semibold text-muted transition-colors duration-150 ease-out hover:bg-hover hover:text-ink aria-[current=page]:text-ink"
                  >
                    {item.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="ml-auto hidden shrink-0 items-center gap-2 nav:flex">
          <Link href={cta.login.href} className="flex min-h-11 items-center px-3 text-base font-semibold text-muted hover:text-ink">
            {cta.login.label}
          </Link>
          <Link
            href={cta.secondary.href}
            className="flex min-h-11 items-center rounded-md px-4 text-base font-semibold text-signal-dark ring-1 ring-inset ring-signal-dark/60 hover:bg-hover"
          >
            {cta.secondary.label}
          </Link>
          <Link href={cta.primary.href} className="btn-primaer flex min-h-11 items-center px-5">
            <BtnPfeil>{cta.primary.label}</BtnPfeil>
          </Link>
        </div>

        {/* Handy und Tablet: Testen-Knopf nur, wenn Logo und Menü daneben noch Platz haben */}
        <div className="ml-auto flex shrink-0 items-center gap-2 nav:hidden">
          <Link
            href={cta.primary.href}
            className="btn-primaer hidden min-h-12 items-center whitespace-nowrap px-3 min-[480px]:flex"
          >
            {cta.primary.label}
          </Link>
          <button
            ref={menueKnopf}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={mobil}
            aria-controls="mobiles-menue"
            onClick={() => setMobil(true)}
            className="flex min-h-12 items-center gap-2 rounded-md px-3 text-base font-semibold text-ink ring-1 ring-inset ring-line hover:bg-hover"
          >
            <Icon name="menu" className="size-6" />
            Menü
          </button>
        </div>
      </div>

      <MobilesMenue offen={mobil} schliessen={() => setMobil(false)} menueKnopf={menueKnopf} />
    </header>
  );
}

// ---------------------------------------------------------------- Desktop: Mega-Menü

function MegaPanel({ item, maxHoehe }: { item: MegaItem; maxHoehe: string }) {
  const { mega } = item;
  const titelId = `${panelId(item.label)}-titel`;
  return (
    // Der Rahmen reicht bis 24 px an den Rand; Klicks daneben gehen an die Seite (pointer-events).
    <div className="pointer-events-none absolute inset-x-6 top-full z-10">
      <div
        id={panelId(item.label)}
        aria-labelledby={titelId}
        style={{ maxHeight: maxHoehe }}
        className={`mega-auf pointer-events-auto mx-auto w-full overflow-y-auto overscroll-contain rounded-b-3xl border border-t-0 border-line bg-white px-8 pb-5 pt-8 shadow-popover ${
          mega.art === "gewerke" ? "max-w-[920px]" : "max-w-[1200px]"
        }`}
      >
        <h2 id={titelId} className="sr-only">
          {item.label}
        </h2>
        {mega.art === "gewerke" ? (
          <ul className="grid grid-cols-2 gap-x-10 gap-y-3">
            {mega.gewerke.map((gw) => (
              <li key={gw.href}>
                <GewerkZeile gewerk={gw} />
              </li>
            ))}
          </ul>
        ) : (
          <div
            className={`grid items-start gap-8 ${
              mega.vorschau ? "grid-cols-[repeat(3,minmax(0,1fr))_minmax(240px,1.25fr)]" : "grid-cols-3"
            }`}
          >
            {mega.gruppen.map((gr) => (
              <Gruppe key={gr.titel} gruppe={gr} />
            ))}
            {mega.vorschau && <Vorschau vorschau={mega.vorschau} />}
          </div>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-line pt-4">
          {mega.abschluss.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="inline-flex min-h-11 items-center gap-1.5 text-base font-semibold text-signal-dark underline-offset-4 hover:underline"
            >
              {l.label}
              <Icon name="arrow-right" className="size-4" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function Gruppe({ gruppe }: { gruppe: MegaGruppe }) {
  return (
    <div className="min-w-0">
      <h3 className="mb-3 text-lg font-semibold leading-snug text-ink">{gruppe.titel}</h3>
      <ul>
        {gruppe.links.map((l) => (
          <li key={l.href + l.label}>
            <Link
              href={l.href}
              className="-mx-2 flex min-h-12 items-center gap-3 rounded-md px-2 py-1.5 text-base font-medium leading-snug text-ink transition-colors duration-150 ease-out hover:bg-signal-soft hover:text-signal-dark hover:underline hover:underline-offset-4 focus-visible:bg-signal-soft"
            >
              <GlasIcon name={l.icon} className="size-9 shrink-0" />
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Vorschau({ vorschau }: { vorschau: MegaVorschau }) {
  return (
    <Link
      href={vorschau.href}
      className="group flex min-w-0 flex-col self-stretch rounded-xl bg-signal-soft p-4 text-ink"
    >
      <Image
        src={vorschau.bild.src}
        alt={vorschau.bild.alt}
        width={vorschau.bild.breite}
        height={vorschau.bild.hoehe}
        sizes="320px"
        className="h-auto w-full rounded-lg border border-line bg-white"
      />
      <span className="mt-4 mb-2 block text-xl font-semibold leading-tight">{vorschau.titel}</span>
      <span className="mb-4 block text-sm leading-normal text-muted">{vorschau.text}</span>
      <span className="mt-auto text-base font-semibold text-signal-dark underline underline-offset-4 group-hover:text-ink">
        {vorschau.aktion}
      </span>
    </Link>
  );
}

function GewerkZeile({ gewerk, klein = false }: { gewerk: MegaGewerk; klein?: boolean }) {
  return (
    <Link
      href={gewerk.href}
      className={`flex items-center gap-4 rounded-lg text-base font-semibold text-ink transition-colors duration-150 ease-out hover:bg-signal-soft hover:text-signal-dark focus-visible:bg-signal-soft ${
        klein ? "min-h-18 py-2" : "min-h-22 p-3"
      }`}
    >
      <Image
        src={gewerk.bild}
        alt=""
        width={80}
        height={60}
        sizes="80px"
        className="h-[60px] w-20 shrink-0 rounded-[6px] object-cover"
      />
      {gewerk.label}
    </Link>
  );
}

// ---------------------------------------------------------------- Handy/Tablet: Menü als modaler Dialog

/**
 * Natives `<dialog>` mit `showModal()`: liegt in der obersten Ebene über der ganzen Seite, macht den Hintergrund inert
 * und schließt mit Escape. Ebenen: Start → Funktionen | Gewerke | Wissen (keine tiefere Ebene).
 */
function MobilesMenue({
  offen,
  schliessen,
  menueKnopf,
}: {
  offen: boolean;
  schliessen: () => void;
  menueKnopf: React.RefObject<HTMLButtonElement | null>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [ansicht, setAnsicht] = useState<string | null>(null);
  const [vorherOffen, setVorherOffen] = useState(offen);
  const ersteZeile = useRef<HTMLButtonElement>(null);
  const ansichtTitel = useRef<HTMLHeadingElement>(null);
  const gruppenKnoepfe = useRef<Record<string, HTMLButtonElement | null>>({});
  const zurueckZu = useRef<string | null>(null);
  /** Schließen per Link: Fokus regelt danach der Router, nicht der Menü-Knopf. */
  const perLink = useRef(false);

  // Jedes Öffnen beginnt auf der Startebene.
  if (offen !== vorherOffen) {
    setVorherOffen(offen);
    if (offen) setAnsicht(null);
  }

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (offen && !d.open) {
      perLink.current = false;
      d.showModal();
      ersteZeile.current?.focus();
    } else if (!offen && d.open) d.close();
  }, [offen]);

  // Hintergrund nicht scrollbar, solange das Menü offen ist. Die Scrollposition bleibt dabei erhalten.
  useEffect(() => {
    if (!offen) return;
    const html = document.documentElement;
    const vorher = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = vorher;
    };
  }, [offen]);

  // Nach dem Ebenenwechsel: Fokus auf den Titel der Unteransicht bzw. zurück auf den Gruppenknopf.
  useEffect(() => {
    if (!offen) return;
    if (ansicht) ansichtTitel.current?.focus();
    else if (zurueckZu.current) gruppenKnoepfe.current[zurueckZu.current]?.focus();
  }, [ansicht, offen]);

  const zu = () => {
    schliessen();
    if (!perLink.current) requestAnimationFrame(() => menueKnopf.current?.focus());
  };

  // Jeder Link im Menü schließt Dialog und Scroll-Sperre – auch wenn er auf die aktuelle Seite zeigt.
  const klick = (e: MouseEvent<HTMLDialogElement>) => {
    if ((e.target as HTMLElement).closest("a")) {
      perLink.current = true;
      schliessen();
    }
  };

  const aktiv = megaItems.find((m) => m.label === ansicht);

  return (
    <dialog
      ref={dialog}
      id="mobiles-menue"
      aria-labelledby="mobiles-menue-titel"
      onClose={zu}
      onClick={klick}
      className="mobiles-menue fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none border-0 bg-white p-0 text-ink"
    >
      <div className="mobiles-menue-kopf flex items-center justify-between gap-4 border-b border-line bg-white px-5 pb-3 pt-[calc(12px+env(safe-area-inset-top,0px))]">
        <h2 id="mobiles-menue-titel" className="text-xl font-bold">
          Menü
        </h2>
        <button
          type="button"
          onClick={() => dialog.current?.close()}
          className="flex min-h-12 items-center gap-2 rounded-md px-3 text-base font-semibold text-signal-dark hover:bg-hover"
        >
          <Icon name="x" className="size-5" />
          Schließen
        </button>
      </div>

      <nav aria-label="Hauptnavigation" className="mobiles-menue-inhalt min-h-0 overflow-y-auto overscroll-contain px-5 pb-6 pt-4">
        {aktiv ? (
          <div>
            <button
              type="button"
              onClick={() => {
                zurueckZu.current = aktiv.label;
                setAnsicht(null);
              }}
              className="-ml-2 flex min-h-12 items-center gap-1 rounded-md px-2 text-base font-semibold text-signal-dark hover:bg-hover"
            >
              <Icon name="chevron-left" className="size-5" />
              Zurück zum Menü
            </button>
            <h3 ref={ansichtTitel} tabIndex={-1} className="mt-2 mb-4 text-2xl font-bold outline-none">
              {aktiv.label}
            </h3>
            <MobileUnteransicht mega={aktiv.mega} />
          </div>
        ) : (
          <ul>
            {mainNav.map((item, i) => (
              <li key={item.label}>
                {item.mega ? (
                  <button
                    type="button"
                    ref={(el) => {
                      gruppenKnoepfe.current[item.label] = el;
                      if (i === 0) ersteZeile.current = el;
                    }}
                    onClick={() => setAnsicht(item.label)}
                    className="flex min-h-14 w-full items-center justify-between gap-4 border-b border-line py-3.5 text-left text-lg font-semibold"
                  >
                    {item.label}
                    <Icon name="chevron-right" className="size-5 text-muted" />
                  </button>
                ) : (
                  <Link href={item.href} className="flex min-h-14 items-center border-b border-line py-3.5 text-lg font-semibold">
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </nav>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line bg-white px-5 pt-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))]">
        <Link href={cta.primary.href} className="btn-primaer flex min-h-12 w-full items-center justify-center px-4">
          <BtnPfeil>{cta.primary.label}</BtnPfeil>
        </Link>
        <Link href={cta.secondary.href} className="inline-flex min-h-11 items-center font-semibold text-signal-dark underline underline-offset-4">
          {cta.secondary.label}
        </Link>
        <Link href={cta.login.href} className="inline-flex min-h-11 items-center font-semibold text-signal-dark underline underline-offset-4">
          {cta.login.label}
        </Link>
      </div>
    </dialog>
  );
}

function MobileUnteransicht({ mega }: { mega: Mega }) {
  if (mega.art === "gewerke") {
    return (
      <>
        <ul className="grid gap-1">
          {mega.gewerke.map((gw) => (
            <li key={gw.href}>
              <GewerkZeile gewerk={gw} klein />
            </li>
          ))}
        </ul>
        <MobilerAbschluss links={mega.abschluss} />
      </>
    );
  }
  return (
    <>
      <div className="grid gap-6">
        {mega.gruppen.map((gr) => (
          <div key={gr.titel}>
            <h4 className="mb-1 text-base font-bold text-ink">{gr.titel}</h4>
            <ul>
              {gr.links.map((l) => (
                <li key={l.href + l.label}>
                  <Link href={l.href} className="flex min-h-14 items-center gap-3 border-b border-line py-2 text-base font-medium">
                    <GlasIcon name={l.icon} className="size-9 shrink-0" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {/* Die Vorschau folgt nur bei Wissen – nach den Links, damit sie den Zugang nicht verdrängt */}
      {mega.art === "wissen" && mega.vorschau && (
        <div className="mt-6 max-w-sm">
          <Vorschau vorschau={mega.vorschau} />
        </div>
      )}
      <MobilerAbschluss links={mega.abschluss} />
    </>
  );
}

function MobilerAbschluss({ links }: { links: { label: string; href: string }[] }) {
  return (
    <ul className="mt-4">
      {links.map((l) => (
        <li key={l.href}>
          <Link href={l.href} className="inline-flex min-h-12 items-center gap-1.5 font-semibold text-signal-dark">
            {l.label}
            <Icon name="arrow-right" className="size-4" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
