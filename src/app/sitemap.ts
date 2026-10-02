import type { MetadataRoute } from "next";
import { hilfeArtikel } from "@/content/hilfe/artikel";
import { funktionen, gewerkCluster, kunden, topGewerke, werkzeuge } from "@/content/registry";
import { blogArtikel } from "@/content/wissen/blog";
import { vorlagen } from "@/content/wissen/vorlagen";
import { webinare } from "@/content/wissen/webinare";
import { site } from "@/lib/site";

/** Rechtsseiten sind bewusst nicht enthalten (noindex). */
const statisch = [
  "/",
  "/funktionen",
  "/gewerke",
  "/wissen",
  "/wissen/blog",
  "/wissen/webinare",
  "/wissen/akademie",
  "/wissen/vorlagen",
  "/hilfe",
  "/hilfe/schnellstart",
  "/hilfe/daten-uebernehmen",
  "/hilfe/kontakt",
  "/hilfe-center",
  "/werkzeuge",
  "/kunden",
  "/preise",
  "/demo",
  "/app",
  "/ueber-uns",
  "/kontakt",
  "/partner",
  "/karriere",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const pfade = [
    ...statisch,
    ...funktionen.map((f) => `/funktionen/${f.slug}`),
    ...topGewerke.map((g) => `/gewerke/${g.slug}`),
    ...gewerkCluster.map((g) => `/gewerke/${g.slug}`),
    ...werkzeuge.map((w) => `/werkzeuge/${w.slug}`),
    ...kunden.map((k) => `/kunden/${k.slug}`),
    ...blogArtikel.map((a) => `/wissen/blog/${a.slug}`),
    ...webinare.map((w) => `/wissen/webinare/${w.slug}`),
    ...vorlagen.map((v) => `/wissen/vorlagen/${v.slug}`),
    ...hilfeArtikel.map((a) => `/hilfe-center/${a.slug}`),
  ];
  return pfade.map((p) => ({ url: `${site.url}${p === "/" ? "" : p}` }));
}
