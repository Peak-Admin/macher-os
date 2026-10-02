import Link from "next/link";
import { Badge, Icon } from "@/components/ui";
import { Foto } from "@/components/ui/Foto";
import { kundenBild } from "@/content/bilder";
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
      className="group flex flex-col overflow-hidden rounded-lg border border-line bg-white transition duration-150 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-ink/5"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-ink">
        <Foto
          bild={kundenBild(k.slug)}
          sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
          className="transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          ersatz={<span className="font-display text-5xl font-extrabold text-white/80">{initialen}</span>}
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
        <span className="absolute right-3 top-3">
          <Badge>Beispiel</Badge>
        </span>
        <span className="absolute bottom-3 left-4 text-sm font-semibold text-white/80">Symbolbild</span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-sm font-semibold font-tagline uppercase tracking-wider text-muted">
          {gewerk.kurz} · {k.mitarbeiter} Mitarbeiter · {k.ort}
        </p>
        <p className="mt-1 font-display text-lg font-bold">{k.betrieb}</p>
        <p className="mt-3 flex-1 text-[1.05rem] font-semibold leading-snug text-ink-soft">{k.ergebnis}</p>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-signal-dark">
          Story lesen <Icon name="arrow-right" className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
