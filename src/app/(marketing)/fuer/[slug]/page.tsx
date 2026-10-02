import { Landingseite, landingMeta } from "@/components/sections/Landingseite";
import { zielgruppenSeiten, type ZielgruppeSlug } from "@/content/landing/zielgruppen";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(zielgruppenSeiten).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return landingMeta(zielgruppenSeiten[slug as ZielgruppeSlug]);
}

export default async function ZielgruppePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <Landingseite seite={zielgruppenSeiten[slug as ZielgruppeSlug]} />;
}
