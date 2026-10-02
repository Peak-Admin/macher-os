import type { Metadata } from "next";
import { AutomatischSeite, FunktionSeite } from "@/components/funktionen";
import { funktionInhalte } from "@/content/funktionen";
import { funktionen, type FunktionSlug } from "@/content/registry";
import { pageMeta } from "@/lib/metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return funktionen.map((f) => ({ slug: f.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const inhalt = funktionInhalte[slug as FunktionSlug];
  return pageMeta({
    title: inhalt.meta.title,
    description: inhalt.meta.description,
    path: `/funktionen/${slug}`,
  });
}

export default async function FunktionPage({ params }: Props) {
  const slug = (await params).slug as FunktionSlug;
  if (slug === "automatisch-erledigen") return <AutomatischSeite />;
  return <FunktionSeite slug={slug} />;
}
