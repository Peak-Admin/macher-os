import { Badge, Card } from "@/components/ui";
import { werkzeuge, werkzeugHref, type WerkzeugSlug } from "@/content/registry";
import { werkzeugInhalte } from "@/content/werkzeuge/inhalte";

/** Karte für einen Rechner – im Hub und unter „Weitere Rechner“. */
export function WerkzeugKarte({ slug, mitLabel = false }: { slug: WerkzeugSlug; mitLabel?: boolean }) {
  const w = werkzeuge.find((x) => x.slug === slug)!;
  const inhalt = werkzeugInhalte[slug];
  return (
    <Card
      title={w.titel}
      icon={inhalt.icon}
      href={werkzeugHref(slug)}
      eyebrow={
        mitLabel && inhalt.label ? (
          <Badge tone={inhalt.label === "Neu" ? "moss" : "signal"}>{inhalt.label}</Badge>
        ) : undefined
      }
      className="h-full"
    >
      {w.kurz}
    </Card>
  );
}
