import Link from "next/link";
import { Badge, Icon } from "@/components/ui";
import { kunden, topGewerke, type KundeSlug } from "@/content/registry";

/** Karte für eine Kundenstory. Solange Stories Beispiele sind, wird das sichtbar markiert. */
export function KundenCard({ slug }: { slug: KundeSlug }) {
  const k = kunden.find((x) => x.slug === slug)!;
  const gewerk = topGewerke.find((g) => g.slug === k.gewerk)!;
  const initialen = k.betrieb
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
  return (
    <Link
      href={`/kunden/${k.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-ink/5"
    >
      <div className="relative flex h-36 items-end bg-[linear-gradient(135deg,var(--color-ink),var(--color-ink-soft))] p-5">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(47,146,80,0.5),transparent_55%)]"
        />
        <span className="relative font-display text-4xl font-extrabold text-white/90">{initialen}</span>
        <span className="absolute right-4 top-4">
          <Badge>Beispiel</Badge>
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold font-tagline uppercase tracking-wider text-muted">
          {gewerk.kurz} · {k.mitarbeiter} Mitarbeiter · {k.ort}
        </p>
        <p className="mt-1 font-display text-lg font-bold">{k.betrieb}</p>
        <p className="mt-3 flex-1 text-[1.05rem] font-semibold leading-snug text-ink-soft">„{k.ergebnis}“</p>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-signal-dark">
          Story lesen <Icon name="arrow-right" className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
