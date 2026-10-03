import { lotteHerkunft } from "@/content/lotte";
import { ausgehend } from "@/lib/link/ausgehend";
import { Icon } from "./Icon";

/** Nennt, woher Lotte kommt: der KI-Agent „Hey Lotte“ und seine Entwickler. Auf hellen und dunklen Flächen. */
export function LotteHerkunft({ dunkel = false, className = "" }: { dunkel?: boolean; className?: string }) {
  return (
    <p className={`text-sm leading-relaxed ${dunkel ? "text-white/70" : "text-muted"} ${className}`}>
      {lotteHerkunft.text}{" "}
      <a
        href={ausgehend(lotteHerkunft.url)}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1 font-bold underline decoration-2 underline-offset-4 ${
          dunkel ? "text-accent hover:text-white" : "text-signal-dark hover:text-ink"
        }`}
      >
        Mehr zu Hey Lotte <Icon name="arrow-right" className="size-3.5" />
        <span className="sr-only">(öffnet in neuem Tab)</span>
      </a>
    </p>
  );
}
