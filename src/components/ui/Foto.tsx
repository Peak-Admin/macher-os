import { existsSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";
import type { ReactNode } from "react";

/** Prüft beim statischen Erzeugen, ob ein Bild unter `public/` liegt. */
export function bildVorhanden(src: string) {
  return existsSync(join(process.cwd(), "public", src));
}

/**
 * Echtes Foto aus `public/`. Fehlt die Datei noch, erscheint `ersatz`,
 * damit die Seite trotzdem gestaltet aussieht und der Build nicht bricht.
 */
export function Foto({
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
