import Image from "next/image";
import type { Integration } from "@/content/integrationen";

const kachel = {
  sm: "size-10 rounded-lg",
  md: "size-12 rounded-lg",
  lg: "size-16 rounded-xl",
} as const;
const marke = { sm: 22, md: 28, lg: 36 } as const;
const schrift = { sm: "text-[0.65rem]", md: "text-xs", lg: "text-sm" } as const;

/**
 * Logo-Kachel einer Integration: weißer Stein mit feiner Linie. Marken zeigen ihr echtes Logo aus
 * `public/logos/integrationen/`; Formate und Standards ohne eigenes Logo ein Kürzel in Dateikarten-Optik.
 * Rein dekorativ – der Name steht immer daneben.
 */
export function IntegrationLogo({
  integration,
  groesse = "md",
  className = "",
}: {
  integration: Pick<Integration, "name" | "logo" | "kuerzel">;
  groesse?: keyof typeof kachel;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center border border-line bg-white ${kachel[groesse]} ${className}`}
    >
      {integration.logo ? (
        <Image
          src={`/logos/integrationen/${integration.logo}`}
          alt=""
          width={marke[groesse]}
          height={marke[groesse]}
          unoptimized
          className="object-contain"
          style={{ width: marke[groesse], height: marke[groesse] }}
        />
      ) : (
        <span
          className={`max-w-full truncate px-1 font-display font-bold leading-none tracking-tight text-signal-dark ${schrift[groesse]}`}
        >
          {integration.kuerzel ?? integration.name.slice(0, 3)}
        </span>
      )}
    </span>
  );
}
