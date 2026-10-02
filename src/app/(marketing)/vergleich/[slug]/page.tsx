import { Landingseite, landingMeta } from "@/components/sections/Landingseite";
import { vergleichsSeiten, type VergleichSlug } from "@/content/landing/vergleich";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(vergleichsSeiten).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return landingMeta(vergleichsSeiten[slug as VergleichSlug]);
}

export default async function VergleichDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <Landingseite seite={vergleichsSeiten[slug as VergleichSlug]} />;
}
