import Image from "next/image";
import { lottePosen, type LottePose } from "@/content/lotte";

/**
 * Lotte, die KI in Handwerk OS, als Figur (freigestellt, ohne Hintergrund).
 * Steht auf ruhigen Flächen neben Text – nie hinter Daten oder Formularen.
 * `dekorativ`: wenn der Text daneben Lotte schon benennt (alt="").
 */
export function Lotte({
  pose,
  className = "",
  sizes = "(min-width: 1024px) 320px, 60vw",
  dekorativ = false,
  preload = false,
}: {
  pose: LottePose;
  className?: string;
  sizes?: string;
  dekorativ?: boolean;
  preload?: boolean;
}) {
  const p = lottePosen[pose];
  return (
    <Image
      src={p.src}
      alt={dekorativ ? "" : p.alt}
      width={p.breite}
      height={p.hoehe}
      sizes={sizes}
      preload={preload}
      className={`h-auto select-none ${className}`}
      draggable={false}
    />
  );
}
