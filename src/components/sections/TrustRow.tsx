import { Icon } from "@/components/ui";

const items = ["Kostenlos starten", "Keine Kreditkarte nötig", "In wenigen Minuten eingerichtet"];

export function TrustRow({ dark = false, className = "" }: { dark?: boolean; className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium ${dark ? "text-white/80" : "text-muted"} ${className}`}>
      {items.map((t) => (
        <li key={t} className="flex items-center gap-2">
          <Icon name="check" className={`size-4 ${dark ? "text-accent" : "text-moss"}`} />
          {t}
        </li>
      ))}
    </ul>
  );
}
