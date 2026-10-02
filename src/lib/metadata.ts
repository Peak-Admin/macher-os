import type { Metadata } from "next";

/** Einheitliche Metadaten pro Seite inkl. Canonical-URL. */
export function pageMeta({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path },
  };
}
