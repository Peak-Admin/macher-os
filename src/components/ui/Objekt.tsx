import Image from "next/image";
import { objekte, type ObjektSchluessel } from "@/lib/objekte";

/**
 * Objektbild der Handwerk-OS-Bildsprache („das digitale Werkzeug“, docs/design/visual-assets.md):
 * ein echtes Foto eines Handwerksobjekts, ruhig gerahmt. Dekorativ (alt="") – die Bedeutung trägt immer der Text daneben.
 */
export function Objekt({
  objekt,
  className = "",
  sizes = "(min-width: 1024px) 320px, 50vw",
  seitenverhaeltnis = "aspect-[4/3]",
}: {
  objekt: ObjektSchluessel;
  className?: string;
  sizes?: string;
  seitenverhaeltnis?: string;
}) {
  const o = objekte[objekt];
  return (
    <span className={`relative block overflow-hidden rounded-xl bg-sand ${seitenverhaeltnis} ${className}`}>
      <Image src={o.src} alt="" fill sizes={sizes} className="object-cover" />
    </span>
  );
}
