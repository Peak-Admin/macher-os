import type { MetadataRoute } from "next";
import { hilfeArtikel } from "@/content/hilfe/artikel";
import { vergleichsSeiten } from "@/content/landing/vergleich";
import { zielgruppenSeiten } from "@/content/landing/zielgruppen";
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
  "/wissen/videos",
  "/hilfe",
  "/bedenken",
  "/hilfe/schnellstart",
  "/hilfe/daten-uebernehmen",
  "/hilfe/kontakt",
  "/hilfe-center",
  "/werkzeuge",
  "/kunden",
  "/preise",
  "/demo",
  "/app",
  "/neu",
  "/ueber-uns",
  "/kontakt",
  "/partner",
  "/karriere",
  "/vergleich",
  "/wechseln",
  "/wechselbonus",
  "/handwerker-app",
  "/buerosoftware-handwerk",
  "/cloud-handwerkersoftware",
  "/schnittstellen",
  "/empfehlen",
  "/botschafter",
  "/partnerbetriebe",
  "/neuigkeiten",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const pfade = [
    ...statisch,
    ...Object.values(vergleichsSeiten).map((s) => s.pfad),
    ...Object.values(zielgruppenSeiten).map((s) => s.pfad),
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
