import Image from "next/image";
import { Container } from "@/components/ui";
import { bildVorhanden } from "@/components/ui/Foto";
import { gewerkBilder } from "@/content/bilder";
import type { GewerkClusterSlug, TopGewerkSlug } from "@/content/registry";

/** Foto-Band unter dem Seitenkopf. Erscheint nur, wenn ein Bild mit Nachweis hinterlegt ist. */
export function GewerkFoto({ slug }: { slug: TopGewerkSlug | GewerkClusterSlug }) {
  const bild = gewerkBilder[slug];
  if (!bild || !bildVorhanden(bild.src)) return null;
  return (
    <section className="bg-paper py-8 sm:py-12">
      <Container>
        <figure>
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-ink sm:aspect-[21/9]">
            <Image src={bild.src} alt={bild.alt} fill sizes="(min-width: 1280px) 1216px, 100vw" className="object-cover" />
          </div>
          <figcaption className="mt-2 text-xs text-muted">
            Foto: {bild.fotograf} / {bild.quelle}
          </figcaption>
        </figure>
      </Container>
    </section>
  );
}
