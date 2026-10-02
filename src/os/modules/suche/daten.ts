/** Suche: eigene Provider für Kernobjekte ohne Besitzer-Suche, Duplikate entfernen, gruppieren. */
import { db, sammlung } from '@core/db';
import { datumKurz, euro, passt, summen, uhrzeit } from '@core/format';
import { pfadZu, type Treffer } from '@core/modul';
import { OBJEKT_LABEL, type Bezug, type ObjektTyp } from '@core/objects';
import type { IconName } from '@ui/index';

/** Termine, Rechnungsnummern und Dokumente – deckt sonst niemand ab. */
export function eigeneTreffer(q: string, opts: { geld: boolean } = { geld: true }): Treffer[] {
  if (!q.trim()) return [];
  const t: Treffer[] = [];

  for (const x of db.termine.where((x) => passt(q, x.titel, x.notiz, db.kunden.get(x.kundeId)?.name, db.orte.get(x.ortId)?.adresse?.ort)).slice(0, 6)) {
    const pfad = pfadZu({ typ: 'termine', id: x.id }) ?? (x.auftragId ? pfadZu({ typ: 'auftraege', id: x.auftragId }) : undefined);
    if (!pfad) continue;
    t.push({ typ: 'Termin', titel: x.titel || 'Termin', untertitel: `${datumKurz(x.start)}, ${uhrzeit(x.start)} Uhr${x.kundeId ? ' · ' + (db.kunden.get(x.kundeId)?.name ?? '') : ''}`, pfad, relevanz: 40 });
  }

  // Rechnungsnummer: exakter Treffer zuerst, auch ohne Geld-Recht (Nummer ist kein Betrag)
  const nq = q.trim().toLowerCase();
  const ust = db.betrieb.get('betrieb')?.ustSatz ?? 19;
  for (const r of db.rechnungen.where((r) => r.nummer.toLowerCase().includes(nq) || passt(q, r.nummer, r.titel, db.kunden.get(r.kundeId)?.name)).slice(0, 6)) {
    const pfad = pfadZu({ typ: 'rechnungen', id: r.id });
    if (!pfad) continue;
    t.push({
      typ: 'Rechnung',
      titel: `${r.nummer} · ${r.titel}`,
      untertitel: [db.kunden.get(r.kundeId)?.name, opts.geld ? euro(summen(r.positionen, ust).brutto) : undefined].filter(Boolean).join(' · '),
      pfad,
      relevanz: r.nummer.toLowerCase() === nq ? 95 : 50,
    });
  }

  for (const d of db.dokumente.where((d) => passt(q, d.titel, d.text, ...(d.tags ?? []))).slice(0, 6)) {
    const pfad = pfadZu({ typ: 'dokumente', id: d.id }) ?? (d.auftragId ? pfadZu({ typ: 'auftraege', id: d.auftragId }) : undefined);
    if (!pfad) continue;
    t.push({ typ: 'Dokument', titel: d.titel, untertitel: d.auftragId ? db.auftraege.get(d.auftragId)?.titel : OBJEKT_LABEL.dokumente, pfad, relevanz: 30 });
  }
  return t;
}

/** Gleicher Pfad = gleiches Objekt → nur der relevanteste Treffer bleibt. */
export function ohneDoppelte(liste: Treffer[]): Treffer[] {
  const best = new Map<string, Treffer>();
  for (const t of liste) {
    const vorher = best.get(t.pfad);
    if (!vorher || (t.relevanz ?? 0) > (vorher.relevanz ?? 0)) best.set(t.pfad, t);
  }
  return [...best.values()].sort((a, b) => (b.relevanz ?? 0) - (a.relevanz ?? 0));
}

export interface Gruppe {
  typ: string;
  treffer: Treffer[];
}

/** Nach Typ gruppieren – Gruppe mit dem besten Treffer zuerst, je Gruppe höchstens `max`. */
export function gruppieren(liste: Treffer[], max = 5): Gruppe[] {
  const gruppen: Gruppe[] = [];
  for (const t of liste) {
    let g = gruppen.find((x) => x.typ === t.typ);
    if (!g) gruppen.push((g = { typ: t.typ, treffer: [] }));
    if (g.treffer.length < max) g.treffer.push(t);
  }
  return gruppen;
}

/** Letzte Suchbegriffe: neuester zuerst, ohne Doppelte, höchstens 6 */
export function merkeSuche(liste: string[], q: string): string[] {
  const s = q.trim();
  if (s.length < 2) return liste;
  return [s, ...liste.filter((x) => x.toLowerCase() !== s.toLowerCase())].slice(0, 6);
}

// ------------------------------------------------------------------ Filter nach Art, Sortierung

/** Mehrzahl für die Filter-Chips; unbekannte Arten behalten ihren Namen */
const MEHRZAHL: Record<string, string> = {
  Kunde: 'Kunden',
  Auftrag: 'Aufträge',
  Angebot: 'Angebote',
  Rechnung: 'Rechnungen',
  Termin: 'Termine',
  Dokument: 'Dokumente',
  Aufgabe: 'Aufgaben',
  Nachricht: 'Nachrichten',
  Funktion: 'Funktionen',
  Einstellung: 'Einstellungen',
  Leistung: 'Leistungen',
  Artikel: 'Artikel',
  Anlage: 'Anlagen',
  Ort: 'Orte',
  Zahlung: 'Zahlungen',
  Beleg: 'Belege',
  Vorlage: 'Vorlagen',
  Lieferant: 'Lieferanten',
  Bestellung: 'Bestellungen',
};

export const artLabel = (typ: string) => MEHRZAHL[typ] ?? typ;

export const ALLE = 'alle';

/**
 * Chips „Alle“ + Arten mit Treffern (mit Zähler), Reihenfolge wie die Treffer (beste zuerst).
 * Höchstens `max` Arten – seltene Arten bleiben unter „Alle“ erreichbar.
 */
export function artFilter(liste: Treffer[], max = 5): { wert: string; label: string; zaehler: number }[] {
  const zaehler = new Map<string, number>();
  for (const t of liste) zaehler.set(t.typ, (zaehler.get(t.typ) ?? 0) + 1);
  const arten = [...zaehler].slice(0, max).map(([typ, n]) => ({ wert: typ, label: artLabel(typ), zaehler: n }));
  return [{ wert: ALLE, label: 'Alle', zaehler: liste.length }, ...arten];
}

export type Sortierung = 'relevanz' | 'neueste';

/**
 * Relevanz (Standard): wie geliefert. Neueste: zuletzt geänderte Objekte zuerst –
 * Treffer ohne Datum (Funktionen, Einstellungen) stehen danach in ihrer Relevanz-Reihenfolge.
 */
export function sortieren(liste: Treffer[], art: Sortierung, zeit: (t: Treffer) => string | undefined): Treffer[] {
  if (art === 'relevanz') return liste;
  return liste
    .map((t, i) => ({ t, i, z: zeit(t) ?? '' }))
    .sort((a, b) => (a.z === b.z ? a.i - b.i : !a.z ? 1 : !b.z ? -1 : b.z.localeCompare(a.z)))
    .map((x) => x.t);
}

/** Welche Sammlung steckt hinter einer Trefferart? */
const SAMMLUNG: Record<string, ObjektTyp> = {
  Kunde: 'kunden',
  Auftrag: 'auftraege',
  Angebot: 'angebote',
  Rechnung: 'rechnungen',
  Termin: 'termine',
  Dokument: 'dokumente',
  Aufgabe: 'aufgaben',
  Nachricht: 'nachrichten',
  Mitarbeiter: 'mitarbeiter',
};

/** Das Objekt hinter einem Treffer: Art + letzte Pfadstelle als ID – nur wenn es das Objekt wirklich gibt */
export function bezugAus(t: Treffer): Bezug | undefined {
  const typ = SAMMLUNG[t.typ];
  const id = t.pfad.split(/[?#]/)[0].split('/').filter(Boolean).pop();
  if (!typ || !id) return undefined;
  return sammlung(typ)?.get(id) ? { typ, id } : undefined;
}

/** Zeitpunkt der letzten Änderung des Objekts hinter dem Treffer */
export function trefferZeit(t: Treffer): string | undefined {
  const b = bezugAus(t);
  const o = b && sammlung(b.typ)?.get(b.id);
  return o ? o.geaendertAm || o.erstelltAm : undefined;
}

// ------------------------------------------------------------------ Schnellaktionen

export interface Schnellaktion {
  label: string;
  icon: IconName;
  /** App-Pfad */
  to?: string;
  /** tel:, mailto: … */
  href?: string;
  /** Druckansicht (App-Pfad, öffnet im neuen Fenster) */
  fenster?: string;
  /** Erfassen-Dialog am Auftrag */
  erfassen?: { aktion: string; auftragId: string };
}

/**
 * Eine dezente Nebenaktion je Trefferart – nur, wenn sie wirklich geht:
 * Kunde → Anrufen (mit Nummer), sonst Auftrag anlegen · Auftrag → Zeit erfassen · Rechnung/Angebot → PDF.
 */
export function schnellaktion(b: Bezug | undefined, k: { geld: boolean; schreiben: boolean; zeit: boolean }): Schnellaktion | undefined {
  if (!b) return undefined;
  if (b.typ === 'kunden') {
    const tel = db.kunden.get(b.id)?.telefon?.trim();
    if (tel) return { label: 'Anrufen', icon: 'telefon', href: `tel:${tel.replace(/[^+\d]/g, '')}` };
    return k.schreiben ? { label: 'Auftrag anlegen', icon: 'auftraege', to: `/auftraege/auftraege/neu?kunde=${b.id}` } : undefined;
  }
  if (b.typ === 'auftraege') return k.zeit ? { label: 'Zeit erfassen', icon: 'uhr', erfassen: { aktion: 'zeit', auftragId: b.id } } : undefined;
  if (b.typ === 'rechnungen' && k.geld) return { label: 'PDF', icon: 'download', fenster: `/druck/rechnung/${b.id}` };
  if (b.typ === 'angebote' && k.geld) return { label: 'PDF', icon: 'download', fenster: `/druck/angebot/${b.id}` };
  return undefined;
}

// ------------------------------------------------------------------ Zuletzt geöffnet

export interface Geoeffnet {
  titel: string;
  typ: string;
  pfad: string;
}

/** Zuletzt geöffnete Treffer: neuester zuerst, ohne Doppelte, höchstens 5 */
export function merkeGeoeffnet(liste: Geoeffnet[], t: Geoeffnet): Geoeffnet[] {
  return [{ titel: t.titel, typ: t.typ, pfad: t.pfad }, ...liste.filter((x) => x.pfad !== t.pfad)].slice(0, 5);
}
