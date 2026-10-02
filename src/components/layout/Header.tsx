"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BtnPfeil } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cta, mainNav, type NavItem } from "@/lib/site";
import { Logo } from "./Logo";

export function Header() {
  const [open, setOpen] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Menüs bei Seitenwechsel schließen.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(null);
    setMobileOpen(false);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(null);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const openMenu = (label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(label);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(null), 120);
  };

  const active = mainNav.find((n) => n.label === open && n.mega);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur-md supports-[backdrop-filter]:bg-paper/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 lg:gap-6 sm:px-6 lg:px-8">
        <Logo />

        <nav aria-label="Hauptnavigation" className="hidden flex-1 lg:block" onMouseLeave={scheduleClose}>
          <ul className="flex items-center gap-1">
            {mainNav.map((item) => (
              <li key={item.label} onMouseEnter={() => (item.mega ? openMenu(item.label) : scheduleClose())}>
                {item.mega ? (
                  <button
                    type="button"
                    aria-expanded={open === item.label}
                    aria-controls={`mega-${item.label}`}
                    onClick={() => setOpen(open === item.label ? null : item.label)}
                    className={`flex items-center gap-1 rounded-lg px-3 py-2 text-[0.95rem] font-semibold transition-colors hover:bg-sand ${
                      open === item.label || pathname.startsWith(item.href) ? "text-ink" : "text-ink-soft"
                    }`}
                  >
                    {item.label}
                    <Icon
                      name="chevron-down"
                      className={`size-4 transition-transform ${open === item.label ? "rotate-180" : ""}`}
                    />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className="block rounded-lg px-3 py-2 text-[0.95rem] font-semibold text-ink-soft transition-colors hover:bg-sand hover:text-ink"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
          {active?.mega && (
            <div
              id={`mega-${active.label}`}
              onMouseEnter={() => openMenu(active.label)}
              className="absolute inset-x-0 top-16 border-b border-line bg-white shadow-2xl shadow-ink/10"
            >
              <MegaPanel item={active} />
            </div>
          )}
        </nav>

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <Link href={cta.login.href} className="px-3 py-2 text-[0.95rem] font-semibold text-ink-soft hover:text-ink">
            {cta.login.label}
          </Link>
          <Link
            href={cta.secondary.href}
            className="inline-flex h-11 items-center rounded-2xl px-4 text-[0.95rem] font-semibold text-ink ring-1 ring-inset ring-line hover:ring-ink/40"
          >
            {cta.secondary.label}
          </Link>
          <Link
            href={cta.primary.href}
            className="btn-primaer inline-flex h-11 items-center px-5"
          >
            <BtnPfeil>{cta.primary.label}</BtnPfeil>
          </Link>
        </div>

        {/* Mobil: primärer CTA bleibt sichtbar */}
        <div className="ml-auto flex items-center gap-1 lg:hidden">
          <Link href={cta.primary.href} className="inline-flex h-10 items-center whitespace-nowrap btn-primaer px-2.5">
            {cta.primary.label}
          </Link>
          <button
            type="button"
            aria-label={mobileOpen ? "Menü schließen" : "Menü öffnen"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-1.5 hover:bg-sand"
          >
            <Icon name={mobileOpen ? "x" : "menu"} className="size-6" />
          </button>
        </div>
      </div>

      {mobileOpen && <MobileMenu />}
    </header>
  );
}

function MegaPanel({ item }: { item: Extract<NavItem, { mega: object }> }) {
  const { columns, footer, cta: megaCta } = item.mega;
  const gridCols = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" }[columns.length] ?? "grid-cols-4";
  const wide = columns.length > 2;
  return (
    <div className="mx-auto max-w-7xl px-8 py-8">
      <div className={`grid gap-8 ${gridCols} ${wide ? "" : "max-w-3xl"}`}>
        {columns.map((col) => (
          <div key={col.titel}>
            <p className="text-sm font-bold font-tagline uppercase tracking-wider text-signal-dark">{col.titel}</p>
            {col.beschreibung && <p className="mt-1 text-sm text-muted">{col.beschreibung}</p>}
            <ul className="mt-4 space-y-0.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="block rounded-md px-2 py-1.5 -mx-2 hover:bg-sand">
                    <span className="text-[0.95rem] font-semibold">{l.label}</span>
                    {l.beschreibung && <span className="block text-xs text-muted">{l.beschreibung}</span>}
                  </Link>
                </li>
              ))}
            </ul>
            {col.cta && (
              <Link href={col.cta.href} className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-signal-dark hover:text-ink">
                {col.cta.label} <Icon name="arrow-right" className="size-4" />
              </Link>
            )}
          </div>
        ))}
      </div>
      {(megaCta || footer) && (
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-5">
          {megaCta && (
            <Link href={megaCta.href} className="inline-flex items-center gap-1.5 font-bold hover:text-signal-dark">
              {megaCta.label} <Icon name="arrow-right" className="size-4" />
            </Link>
          )}
          {footer?.map((l) => (
            <Link key={l.label} href={l.href} className="text-sm font-semibold text-muted hover:text-ink">
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function MobileMenu() {
  return (
    <div className="fixed inset-x-0 bottom-0 top-16 overflow-y-auto border-t border-line bg-paper lg:hidden">
      <nav aria-label="Mobile Navigation" className="px-4 py-4">
        <ul className="divide-y divide-line">
          {mainNav.map((item) =>
            item.mega ? (
              <li key={item.label}>
                <details className="group py-1">
                  <summary className="flex cursor-pointer items-center justify-between py-3 text-lg font-bold">
                    {item.label}
                    <Icon name="chevron-down" className="size-5 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="space-y-5 pb-4">
                    {item.mega.columns.map((col) => (
                      <div key={col.titel}>
                        <p className="text-xs font-bold font-tagline uppercase tracking-wider text-signal-dark">{col.titel}</p>
                        <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                          {col.links.map((l) => (
                            <li key={l.label}>
                              <Link href={l.href} className="block py-1.5 text-[0.95rem] font-medium">
                                {l.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    <Link href={item.href} className="inline-flex items-center gap-1 font-bold text-signal-dark">
                      {item.label === "Wissen" ? "Wissen entdecken" : `Alle ${item.label}`}{" "}
                      <Icon name="arrow-right" className="size-4" />
                    </Link>
                  </div>
                </details>
              </li>
            ) : (
              <li key={item.label}>
                <Link href={item.href} className="block py-4 text-lg font-bold">
                  {item.label}
                </Link>
              </li>
            ),
          )}
        </ul>
        <div className="mt-6 grid gap-3">
          <Link href={cta.primary.href} className="btn-primaer inline-flex h-13 items-center justify-center">
            <BtnPfeil>{cta.primary.label}</BtnPfeil>
          </Link>
          <Link href={cta.secondary.href} className="inline-flex h-13 items-center justify-center rounded-2xl bg-white font-semibold ring-1 ring-line">
            {cta.secondary.label}
          </Link>
          <Link href={cta.login.href} className="py-2 text-center font-semibold text-muted">
            {cta.login.label}
          </Link>
        </div>
      </nav>
    </div>
  );
}
