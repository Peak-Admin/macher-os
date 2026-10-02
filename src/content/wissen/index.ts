import type { TopGewerkSlug } from "@/content/registry";
import { kursAnker, kurse } from "./akademie";
import { blogArtikel, blogHref } from "./blog";
import type { ThemaSlug } from "./themen";
import { vorlageHref, vorlagen } from "./vorlagen";
import { webinare, webinarHref, webinarStatusLabel } from "./webinare";

export type WissenTyp = "Artikel" | "Webinar" | "Vorlage" | "Checkliste" | "Formular" | "Kurs";

/** Einheitlicher Eintrag für Suche, Übersichten und Teaser. */
export type WissenEintrag = {
  typ: WissenTyp;
  titel: string;
  text: string;
  href: string;
  themen: ThemaSlug[];
  gewerke: TopGewerkSlug[];
  datum: string;
  beliebt: boolean;
  /** Zusatzinfo, z. B. Status oder Dauer. */
  meta?: string;
  /** Zusätzliche Suchbegriffe. */
  stichworte: string;
};

export const wissenIndex: WissenEintrag[] = [
  ...blogArtikel.map(
    (a): WissenEintrag => ({
      typ: "Artikel",
      titel: a.titel,
      text: a.beschreibung,
      href: blogHref(a.slug),
      themen: a.themen,
      gewerke: a.gewerke,
      datum: a.datum,
      beliebt: !!a.beliebt,
      stichworte: [a.kurzantwort, ...a.inhalt.flatMap((b) => (b.typ === "h2" || b.typ === "h3" ? [b.text] : []))].join(
        " ",
      ),
    }),
  ),
  ...webinare.map(
    (w): WissenEintrag => ({
      typ: "Webinar",
      titel: w.titel,
      text: w.kurz,
      href: webinarHref(w.slug),
      themen: w.themen,
      gewerke: w.gewerke,
      datum: w.datum,
      beliebt: !!w.beliebt,
      meta: webinarStatusLabel[w.status],
      stichworte: [w.fuerWen, ...w.agenda.map((x) => x.titel)].join(" "),
    }),
  ),
  ...vorlagen.map(
    (v): WissenEintrag => ({
      typ: v.art,
      titel: v.titel,
      text: v.kurz,
      href: vorlageHref(v.slug),
      themen: v.themen,
      gewerke: v.gewerke,
      datum: v.datum,
      beliebt: !!v.beliebt,
      stichworte: [v.wasIst, ...v.wofuer].join(" "),
    }),
  ),
  ...kurse.map(
    (k): WissenEintrag => ({
      typ: "Kurs",
      titel: k.titel,
      text: k.kurz,
      href: kursAnker(k.slug),
      themen: k.themen,
      gewerke: k.gewerke,
      datum: k.datum,
      beliebt: !!k.beliebt,
      meta: `ca. ${k.dauer} Min.`,
      stichworte: k.lektionen.join(" "),
    }),
  ),
];

/** Neueste Inhalte über alle Typen. */
export function neuesteInhalte(anzahl: number) {
  return [...wissenIndex].sort((a, b) => b.datum.localeCompare(a.datum)).slice(0, anzahl);
}

/** Beliebte Inhalte – je Typ abwechselnd, damit ein Mix entsteht. */
export function beliebteInhalte(anzahl: number) {
  const beliebt = wissenIndex.filter((e) => e.beliebt);
  const typen: WissenTyp[] = ["Artikel", "Webinar", "Vorlage", "Kurs", "Checkliste", "Formular"];
  const toepfe = typen.map((t) => beliebt.filter((e) => e.typ === t));
  const mix: WissenEintrag[] = [];
  for (let i = 0; mix.length < anzahl && i < 10; i++) {
    for (const topf of toepfe) {
      if (topf[i] && mix.length < anzahl) mix.push(topf[i]);
    }
  }
  return mix;
}

/** Inhalte für ein Gewerk: gewerkspezifische zuerst, dann allgemeine. */
export function inhalteFuerGewerk(gewerk: TopGewerkSlug, anzahl: number) {
  const spezifisch = wissenIndex.filter((e) => e.gewerke.includes(gewerk));
  const allgemein = wissenIndex.filter((e) => e.gewerke.length === 0 && e.beliebt);
  return [...spezifisch, ...allgemein].slice(0, anzahl);
}

export function inhalteZuThema(thema: ThemaSlug) {
  return wissenIndex.filter((e) => e.themen.includes(thema));
}
