import { Icon } from "@/components/ui";
import { beispielHinweis } from "@/content/kunden";

/** Deutlicher Hinweis, dass eine Kundenstory ein fiktives Beispiel ist. */
export function BeispielHinweis({ className = "" }: { className?: string }) {
  return (
    <div
      role="note"
      className={`flex items-start gap-3 rounded-xl border border-signal/40 bg-signal-soft px-4 py-3 text-sm font-semibold text-ink ${className}`}
    >
      <Icon name="bell" className="mt-0.5 size-4.5 shrink-0 text-signal-dark" />
      <p>{beispielHinweis}</p>
    </div>
  );
}
