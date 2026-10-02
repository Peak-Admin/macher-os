import Link from "next/link";
import { Icon } from "@/components/ui";
import { datenVertrauen } from "@/content/einwaende";

/**
 * Blauer Vertrauenskasten (EU-Blau, Token `eu`): DSGVO, Server in Frankfurt, KI nach EU AI Act.
 * Bewusst ohne EU-Sternenkranz – der würde wie ein offizielles Siegel wirken.
 */
export function DatenVertrauen({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-xl bg-eu p-5 text-white ${className}`}>
      <p className="flex items-center gap-2 font-display text-lg font-bold">
        <Icon name="shield" className="size-5 shrink-0" />
        Deine Daten sind sicher
      </p>
      <ul className="mt-4 grid gap-3">
        {datenVertrauen.map((v) => (
          <li key={v.titel} className="flex items-start gap-3">
            <Icon name="check" className="mt-0.5 size-4 shrink-0" />
            <span>
              <span className="block font-semibold">{v.titel}</span>
              <span className="block text-sm text-white/85">{v.text}</span>
            </span>
          </li>
        ))}
      </ul>
      <Link href="/datenschutz" className="mt-4 inline-block text-sm font-semibold underline underline-offset-4 hover:no-underline">
        Mehr zum Datenschutz
      </Link>
    </div>
  );
}
