import { artikelTeil1 } from "./blog-artikel-1";
import { artikelTeil2 } from "./blog-artikel-2";
import type { BlogArtikel, BlogBlock } from "./blog-typen";

export type { BlogArtikel, BlogBlock } from "./blog-typen";

/** Alle Blog-Artikel, neueste zuerst. */
export const blogArtikel: BlogArtikel[] = [...artikelTeil1, ...artikelTeil2].sort((a, b) =>
  b.datum.localeCompare(a.datum),
);

export function getArtikel(slug: string) {
  return blogArtikel.find((a) => a.slug === slug);
}

export function blogHref(slug: string) {
  return `/wissen/blog/${slug}`;
}

function blockText(b: BlogBlock): string {
  switch (b.typ) {
    case "liste":
      return b.punkte.join(" ");
    case "beispiel":
      return [b.titel, b.text, b.fazit, ...(b.zeilen ?? []).map((z) => `${z.label} ${z.wert}`)].join(" ");
    case "tabelle":
      return [...b.kopf, ...b.zeilen.flat()].join(" ");
    case "hinweis":
      return `${b.titel ?? ""} ${b.text}`;
    default:
      return b.text;
  }
}

/** Anzahl Wörter im Artikel (Kurzantwort, Inhalt, Checkliste). */
export function wortzahl(a: BlogArtikel) {
  const text = [a.kurzantwort, ...a.inhalt.map(blockText), ...a.checkliste.punkte].join(" ");
  return text.split(/\s+/).filter(Boolean).length;
}

/** Lesezeit in Minuten (ca. 200 Wörter pro Minute). */
export function lesezeit(a: BlogArtikel) {
  return Math.max(1, Math.round(wortzahl(a) / 200));
}

/** Weitere Artikel: zuerst gleiche Themen, dann die neuesten. */
export function weitereArtikel(a: BlogArtikel, anzahl = 3) {
  const andere = blogArtikel.filter((x) => x.slug !== a.slug);
  const score = (x: BlogArtikel) => x.themen.filter((t) => a.themen.includes(t)).length;
  return [...andere].sort((x, y) => score(y) - score(x)).slice(0, anzahl);
}
