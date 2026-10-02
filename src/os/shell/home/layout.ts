/**
 * Layout des Home-Screens: reine Regeln, ohne React und ohne Datenbank testbar.
 *
 * Das Home ist eine Folge von Bändern. Kleine Widgets stehen in zwei Spalten (links breiter, rechts schmaler),
 * große Widgets gehen über die volle Breite und beginnen ein neues Band. Auf dem Handy werden die Bänder
 * untereinander gelesen: erst die linke, dann die rechte Spalte – so steht das Wichtigste oben.
 *
 * Kein freies Raster, keine Pixelpositionen: nur Reihenfolge, Spalte, Größe, sichtbar.
 */
import type { Rolle } from '@core/objects';
import type { HomeLayout, Spalte, WidgetDefinition, WidgetEintrag, WidgetGroesse } from './typen';

/** Standard-Home je Rolle: höchstens vier Widgets. Reihenfolge = Lesereihenfolge auf dem Desktop. */
export const STANDARD_HOME: Record<Rolle, { id: string; spalte: Spalte; size?: WidgetGroesse }[]> = {
  chef: [
    { id: 'naechster-schritt', spalte: 'links' },
    { id: 'ansprechpartner', spalte: 'rechts' },
    { id: 'arbeit', spalte: 'links' },
    { id: 'neu', spalte: 'rechts' },
  ],
  buero: [
    { id: 'naechster-schritt', spalte: 'links' },
    { id: 'ansprechpartner', spalte: 'rechts' },
    { id: 'arbeit', spalte: 'links' },
    { id: 'neu', spalte: 'rechts' },
  ],
  // Monteur: später „Mein Tag“ – heute schon der nächste Einsatz als nächster Schritt
  monteur: [
    { id: 'naechster-schritt', spalte: 'links' },
    { id: 'dein-tag', spalte: 'rechts' },
    { id: 'arbeit', spalte: 'links' },
    { id: 'neu', spalte: 'rechts' },
  ],
  azubi: [
    { id: 'naechster-schritt', spalte: 'links' },
    { id: 'dein-tag', spalte: 'rechts' },
    { id: 'arbeit', spalte: 'links' },
    { id: 'neu', spalte: 'rechts' },
  ],
};

const nummerieren = (liste: WidgetEintrag[]): WidgetEintrag[] => liste.map((e, i) => (e.order === i ? e : { ...e, order: i }));
const sortiert = (liste: WidgetEintrag[]) => [...liste].sort((a, b) => a.order - b.order);

function eintragFuer(def: WidgetDefinition, visible: boolean, order: number, vorgabe?: { spalte?: Spalte; size?: WidgetGroesse }): WidgetEintrag {
  const size = vorgabe?.size && def.availableSizes.includes(vorgabe.size) ? vorgabe.size : def.defaultSize;
  return { widgetId: def.id, visible, order, size, spalte: vorgabe?.spalte ?? def.defaultSpalte ?? 'links' };
}

/** Standard für eine Rolle: die vier Standard-Widgets sichtbar, alle weiteren erlaubten verborgen dahinter. */
export function standardLayout(rolle: Rolle, defs: WidgetDefinition[], userId = ''): HomeLayout {
  const verfuegbar = new Map(defs.map((d) => [d.id, d]));
  const sichtbar = STANDARD_HOME[rolle].filter((s) => verfuegbar.has(s.id));
  const widgets: WidgetEintrag[] = sichtbar.map((s, i) => eintragFuer(verfuegbar.get(s.id)!, true, i, s));
  for (const d of defs) if (!widgets.some((w) => w.widgetId === d.id)) widgets.push(eintragFuer(d, false, widgets.length));
  return { userId, version: 1, widgets };
}

/**
 * Gespeichertes Layout gegen die aktuell erlaubten Widgets abgleichen: Unbekannte und nicht erlaubte fallen weg,
 * Doppelte werden entfernt, neue Widgets kommen verborgen ans Ende, ungültige Größen/Spalten werden korrigiert.
 * Ohne gespeichertes Layout gilt der Standard der Rolle.
 */
export function normalisieren(gespeichert: Partial<HomeLayout> | undefined, defs: WidgetDefinition[], rolle: Rolle, userId = ''): HomeLayout {
  if (!gespeichert || !Array.isArray(gespeichert.widgets)) return standardLayout(rolle, defs, userId);
  const verfuegbar = new Map(defs.map((d) => [d.id, d]));
  const gesehen = new Set<string>();
  const widgets: WidgetEintrag[] = [];
  for (const w of sortiert(gespeichert.widgets.filter((w) => w && typeof w.widgetId === 'string'))) {
    const def = verfuegbar.get(w.widgetId);
    if (!def || gesehen.has(w.widgetId)) continue;
    gesehen.add(w.widgetId);
    widgets.push({
      widgetId: w.widgetId,
      visible: !!w.visible,
      order: widgets.length,
      size: def.availableSizes.includes(w.size) ? w.size : def.defaultSize,
      spalte: w.spalte === 'rechts' ? 'rechts' : 'links',
    });
  }
  for (const d of defs) if (!gesehen.has(d.id)) widgets.push(eintragFuer(d, false, widgets.length));
  return { userId, version: 1, widgets, angepasst: gespeichert.angepasst ?? true };
}

export function sichtbare(layout: HomeLayout): WidgetEintrag[] {
  return sortiert(layout.widgets).filter((w) => w.visible);
}

// ------------------------------------------------------------------ Bänder

export type Band = { typ: 'breit'; eintrag: WidgetEintrag } | { typ: 'spalten'; links: WidgetEintrag[]; rechts: WidgetEintrag[]; letzte: string };

/** Sichtbare Widgets in Bänder teilen: aufeinanderfolgende kleine Widgets teilen sich zwei Spalten. */
export function baender(layout: HomeLayout): Band[] {
  const out: Band[] = [];
  let offen: Extract<Band, { typ: 'spalten' }> | undefined;
  for (const w of sichtbare(layout)) {
    if (w.size === 'gross') {
      offen = undefined;
      out.push({ typ: 'breit', eintrag: w });
      continue;
    }
    if (!offen) {
      offen = { typ: 'spalten', links: [], rechts: [], letzte: w.widgetId };
      out.push(offen);
    }
    offen[w.spalte].push(w);
    offen.letzte = w.widgetId;
  }
  return out;
}

/** Lesereihenfolge auf dem Handy: Band für Band, erst links, dann rechts */
export function mobileReihenfolge(layout: HomeLayout): string[] {
  return baender(layout).flatMap((b) => (b.typ === 'breit' ? [b.eintrag.widgetId] : [...b.links, ...b.rechts].map((w) => w.widgetId)));
}

// ------------------------------------------------------------------ Ändern

export interface Ziel {
  /** vor diesem Widget einfügen */
  vor?: string;
  /** nach diesem Widget einfügen (wenn `vor` fehlt) */
  nach?: string;
  spalte?: Spalte;
}

/** Widget an eine neue Stelle setzen (und dabei sichtbar machen). Ohne `vor`/`nach` ans Ende. */
export function verschieben(layout: HomeLayout, id: string, ziel: Ziel): HomeLayout {
  const liste = sortiert(layout.widgets);
  const i = liste.findIndex((w) => w.widgetId === id);
  if (i < 0) return layout;
  if (ziel.vor === id || ziel.nach === id) return setze(layout, id, { visible: true, ...(ziel.spalte ? { spalte: ziel.spalte } : {}) });
  const [w] = liste.splice(i, 1);
  const neu: WidgetEintrag = { ...w, visible: true, spalte: ziel.spalte ?? w.spalte };
  let pos = liste.length;
  if (ziel.vor) {
    const v = liste.findIndex((x) => x.widgetId === ziel.vor);
    if (v >= 0) pos = v;
  } else if (ziel.nach) {
    const n = liste.findIndex((x) => x.widgetId === ziel.nach);
    if (n >= 0) pos = n + 1;
  } else {
    // ans Ende der sichtbaren Widgets, nicht hinter die verborgenen
    const letzteSichtbare = liste.map((x) => x.visible).lastIndexOf(true);
    pos = letzteSichtbare + 1;
  }
  liste.splice(pos, 0, neu);
  return { ...layout, widgets: nummerieren(liste), angepasst: true };
}

function setze(layout: HomeLayout, id: string, teil: Partial<WidgetEintrag>): HomeLayout {
  return { ...layout, widgets: layout.widgets.map((w) => (w.widgetId === id ? { ...w, ...teil } : w)), angepasst: true };
}

export function sichtbarSetzen(layout: HomeLayout, id: string, visible: boolean): HomeLayout {
  if (visible) return verschieben(layout, id, {});
  return setze(layout, id, { visible: false });
}

export function groesseSetzen(layout: HomeLayout, id: string, size: WidgetGroesse, defs?: WidgetDefinition[]): HomeLayout {
  const def = defs?.find((d) => d.id === id);
  if (def && !def.availableSizes.includes(size)) return layout;
  return setze(layout, id, { size });
}

export function spalteSetzen(layout: HomeLayout, id: string, spalte: Spalte): HomeLayout {
  return setze(layout, id, { spalte, size: 'klein' });
}

/**
 * Tastatur und Menü: ein Widget eine Stelle nach oben/unten. Kleine Widgets bleiben dabei in ihrer Spalte
 * (und wandern über breite Widgets hinweg ins Band davor/danach), breite Widgets springen um ein ganzes Band.
 */
function schrittZiel(layout: HomeLayout, id: string, richtung: -1 | 1): Ziel | undefined {
  const w = layout.widgets.find((x) => x.widgetId === id);
  if (!w || !w.visible) return undefined;
  if (w.size === 'gross') {
    const b = baender(layout);
    const i = b.findIndex((x) => x.typ === 'breit' && x.eintrag.widgetId === id);
    const n = b[i + richtung];
    if (!n) return undefined;
    if (n.typ === 'breit') return richtung < 0 ? { vor: n.eintrag.widgetId } : { nach: n.eintrag.widgetId };
    const flach = sichtbare(layout).filter((x) => [...n.links, ...n.rechts].includes(x));
    return richtung < 0 ? { vor: flach[0].widgetId } : { nach: flach[flach.length - 1].widgetId };
  }
  const kette = sichtbare(layout).filter((x) => x.size === 'gross' || x.spalte === w.spalte);
  const i = kette.findIndex((x) => x.widgetId === id);
  const n = kette[i + richtung];
  if (!n) return undefined;
  return richtung < 0 ? { vor: n.widgetId, spalte: w.spalte } : { nach: n.widgetId, spalte: w.spalte };
}

export function schritt(layout: HomeLayout, id: string, richtung: -1 | 1): HomeLayout {
  const z = schrittZiel(layout, id, richtung);
  return z ? verschieben(layout, id, z) : layout;
}

export function kannSchritt(layout: HomeLayout, id: string, richtung: -1 | 1): boolean {
  return !!schrittZiel(layout, id, richtung);
}

/** Für Speichern: nur das Nötige, stabil sortiert */
export function zumSpeichern(layout: HomeLayout): HomeLayout {
  return { userId: layout.userId, version: 1, angepasst: true, widgets: nummerieren(sortiert(layout.widgets)) };
}
