import { notFound } from "next/navigation";
import { ClusterSeite } from "@/components/gewerke/ClusterSeite";
import { TopGewerkSeite } from "@/components/gewerke/TopGewerkSeite";
import { clusterInhalte, isGewerkCluster, isTopGewerk, topGewerkInhalte } from "@/content/gewerke";
import { gewerkCluster, topGewerke } from "@/content/registry";
import { pageMeta } from "@/lib/metadata";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return [...topGewerke, ...gewerkCluster].map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  if (isTopGewerk(slug)) {
    const g = topGewerkInhalte[slug];
    return pageMeta({ title: g.seoTitel, description: g.beschreibung, path: `/gewerke/${slug}` });
  }
  if (isGewerkCluster(slug)) {
    const c = clusterInhalte[slug];
    return pageMeta({ title: c.seoTitel, description: c.beschreibung, path: `/gewerke/${slug}` });
  }
  return {};
}

export default async function GewerkPage({ params }: Props) {
  const { slug } = await params;
  if (isTopGewerk(slug)) return <TopGewerkSeite slug={slug} />;
  if (isGewerkCluster(slug)) return <ClusterSeite slug={slug} />;
  notFound();
}
