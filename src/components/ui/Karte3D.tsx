"use client";

import Link from "next/link";
import { useRef, type CSSProperties, type PointerEvent, type ReactNode } from "react";

/**
 * Karte mit leichtem 3D-Effekt: Sie neigt sich zum Mauszeiger (höchstens 6°), ein heller Lichtfleck folgt ihm.
 * Nur mit Maus/Stift – auf Touch-Geräten und bei `prefers-reduced-motion` bleibt sie flach (Styles in globals.css).
 * Inhalt und Link funktionieren ohne Effekt genauso: Der Effekt ist Dekoration, nie Voraussetzung.
 */
export function Karte3D({
  children,
  href,
  className = "",
  innen = "",
  stark = 6,
}: {
  children: ReactNode;
  href?: string;
  className?: string;
  /** Klassen für die geneigte Fläche (Hintergrund, Rand, Innenabstand) */
  innen?: string;
  /** größte Neigung in Grad */
  stark?: number;
}) {
  const flaeche = useRef<HTMLDivElement>(null);

  const bewegen = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType === "touch") return;
    const el = flaeche.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${((0.5 - y) * stark * 2).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${((x - 0.5) * stark * 2).toFixed(2)}deg`);
    el.style.setProperty("--lx", `${(x * 100).toFixed(1)}%`);
    el.style.setProperty("--ly", `${(y * 100).toFixed(1)}%`);
    el.dataset.aktiv = "";
  };
  const verlassen = () => {
    const el = flaeche.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    delete el.dataset.aktiv;
  };

  const inhalt = (
    <div ref={flaeche} className={`karte-3d-flaeche ${innen}`} style={{ "--rx": "0deg", "--ry": "0deg" } as CSSProperties}>
      {children}
      <span aria-hidden className="karte-3d-licht" />
    </div>
  );

  const huelle = `karte-3d group block h-full ${className}`;
  if (href) {
    return (
      <Link href={href} className={huelle} onPointerMove={bewegen} onPointerLeave={verlassen}>
        {inhalt}
      </Link>
    );
  }
  return (
    <div className={huelle} onPointerMove={bewegen} onPointerLeave={verlassen}>
      {inhalt}
    </div>
  );
}
