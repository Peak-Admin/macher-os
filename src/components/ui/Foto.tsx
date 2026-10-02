import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import type { ReactNode } from "react";
import { bilder, type BildKey } from "@/content/bilder";
import { Icon } from "./Icon";

/** Prüft beim statischen Erzeugen, ob ein Bild unter `public/` liegt. */
export function bildVorhanden(src: string) {
  return existsSync(path.join(process.cwd(), "public", src));
}

/**
 * Foto aus dem Bildregister (`src/content/bilder.ts`). Füllt den Eltern-Container
 * (`relative` + Größe/Seitenverhältnis kommen vom Aufrufer).
 *
 * Fehlt die Datei noch, erscheint eine gestaltete Markenfläche mit Pfeilmotiv
 * und Icon – nie ein kaputtes Bild.
 */
export function Foto({
  bild,
  sizes = "100vw",
  preload = false,
  className = "",
  ersatz,
}: {
  bild: BildKey;
  sizes?: string;
  preload?: boolean;
  className?: string;
  /** Eigener Inhalt für die Ersatzfläche, z. B. Initialen. `null` = nur Fläche (für Hintergründe hinter Text). */
  ersatz?: ReactNode;
}) {
  const b = bilder[bild];

  if (bildVorhanden(b.src)) {
    return (
      <Image
        src={b.src}
        alt={b.alt}
        fill
        sizes={sizes}
        preload={preload}
        className={`object-cover ${className}`}
        style={b.position ? { objectPosition: b.position } : undefined}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={b.alt}
      className={`absolute inset-0 overflow-hidden bg-[linear-gradient(150deg,var(--color-ink-soft)_0%,var(--color-ink)_45%,color-mix(in_oklab,var(--color-signal)_70%,var(--color-ink))_100%)] ${className}`}
    >
      <Chevrons className="absolute -bottom-[10%] -right-[8%] h-[85%] text-brand/35" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,color-mix(in_oklab,var(--color-accent)_22%,transparent),transparent_55%)]" />
      <div className="absolute inset-0 flex items-center justify-center text-white/25">
        {ersatz === undefined ? <Icon name={b.icon} className="size-[28%] max-h-28 min-h-10" /> : ersatz}
      </div>
      {process.env.NODE_ENV === "development" && (
        <span className="absolute left-2 top-2 rounded-sm bg-black/50 px-1.5 py-0.5 font-mono text-[10px] text-white/80">
          public{b.src}
        </span>
      )}
    </div>
  );
}

/**
 * Echtes Foto aus `public/` ohne Eintrag im Bildregister (z. B. Herausgeber-Fotos).
 * Fehlt die Datei noch, erscheint `ersatz`, damit die Seite gestaltet bleibt.
 */
export function FotoDatei({
  src,
  alt,
  sizes,
  ersatz,
  className = "",
  preload = false,
}: {
  src: string;
  alt: string;
  sizes: string;
  ersatz: ReactNode;
  className?: string;
  preload?: boolean;
}) {
  if (!bildVorhanden(src)) return <>{ersatz}</>;
  return <Image src={src} alt={alt} fill sizes={sizes} preload={preload} className={className} />;
}

/**
 * Pfeilmotiv (große Chevrons „›“) aus dem Mission-Mittelstand-Hero.
 * Rein dekorativ – Farbe über `text-*`.
 */
export function Chevrons({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 200" aria-hidden="true" className={`pointer-events-none ${className}`} fill="currentColor">
      <path d="M0 0h52l70 100-70 100H0l70-100Z" />
      <path d="M90 0h52l70 100-70 100H90l70-100Z" opacity=".55" />
    </svg>
  );
}
