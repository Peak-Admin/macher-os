/**
 * Ertrag: Deckungsbeitrag = Umsatz netto (aus Rechnungen) − tatsächliche Kosten.
 *
 * Berücksichtigt werden nur Aufträge in Abrechnung oder erledigt und nur Rechnungen, die raus sind (versendet, teilbezahlt, bezahlt).
 * Entwürfe und Stornos zählen nicht. Abschläge, die in einer Schlussrechnung abgezogen werden,
 * werden dort herausgerechnet (nicht doppelt gezählt). Gutschriften mindern den Umsatz.
 */
import { summen } from '@core/format';
import type { Auftrag, Auftragsart, Cent, Datum, ID, Rechnung } from '@core/objects';
import type { Basisdaten } from '../kosten/basis';
import { auftragKosten, type AuftragKosten } from '../kosten/daten';

/** Nur abgeschlossene Aufträge haben einen aussagekräftigen Ertrag */
export const ABGESCHLOSSEN: Auftrag['phase'][] = ['abrechnung', 'erledigt'];

export const ZAEHLT: Rechnung['status'][] = ['versendet', 'teilbezahlt', 'bezahlt'];

export function rechnungZaehlt(r: Rechnung): boolean {
  return ZAEHLT.includes(r.status);
}

/** Netto-Umsatz einer Rechnung (Gutschrift negativ, abgezogene Abschläge herausgerechnet) */
export function rechnungNetto(r: Rechnung, alle: Rechnung[]): Cent {
  if (!rechnungZaehlt(r)) return 0;
  let netto = summen(r.positionen).netto;
  for (const id of r.abzugRechnungIds ?? []) {
    const ab = alle.find((x) => x.id === id);
    if (ab && rechnungZaehlt(ab)) netto -= summen(ab.positionen).netto;
  }
  return r.art === 'gutschrift' ? -Math.abs(netto) : netto;
}

/** Brutto-Forderung einer Rechnung (für Offene Posten und DATEV) */
export function rechnungBrutto(r: Rechnung, alle: Rechnung[], ustSatz: number): Cent {
  let brutto = summen(r.positionen, ustSatz).brutto;
  for (const id of r.abzugRechnungIds ?? []) {
    const ab = alle.find((x) => x.id === id);
    if (ab && rechnungZaehlt(ab)) brutto -= summen(ab.positionen, ustSatz).brutto;
  }
  return r.art === 'gutschrift' ? -Math.abs(brutto) : brutto;
}

export function ustSatzVon(b: Basisdaten): number {
  if (b.betrieb?.kleinunternehmer) return 0;
  return b.betrieb?.ustSatz ?? 19;
}

export interface Umsatz {
  netto: Cent;
  rechnungIds: ID[];
  letztesDatum?: Datum;
}

export function umsatzJeAuftrag(b: Basisdaten): Map<ID, Umsatz> {
  const m = new Map<ID, Umsatz>();
  for (const r of b.rechnungen) {
    if (!r.auftragId || !rechnungZaehlt(r)) continue;
    const u = m.get(r.auftragId) ?? { netto: 0, rechnungIds: [] };
    u.netto += rechnungNetto(r, b.rechnungen);
    u.rechnungIds.push(r.id);
    if (!u.letztesDatum || r.datum > u.letztesDatum) u.letztesDatum = r.datum;
    m.set(r.auftragId, u);
  }
  return m;
}

export interface ErtragZeile {
  auftragId: ID;
  kundeId: ID;
  art: Auftragsart;
  umsatz: Cent;
  kosten: AuftragKosten;
  db: Cent;
  /** Deckungsbeitrag im Verhältnis zum Umsatz (0.25 = 25 %) */
  marge?: number;
  datum?: Datum;
}

export interface ErtragErgebnis {
  zeilen: ErtragZeile[];
  /** abgeschlossene Aufträge mit Kosten, aber ohne Rechnung – nicht im Ertrag */
  ohneRechnung: number;
  /** laufende Aufträge (noch nicht in Abrechnung) – Teilrechnungen würden den Ertrag verzerren */
  laufend: number;
  /** Rechnungen ohne Auftragsbezug – nicht zuordenbar */
  rechnungenOhneAuftrag: number;
  /** Aufträge ohne erfasste Kosten (Ertrag wäre geschönt) */
  ohneKosten: number;
}

export function ertraege(b: Basisdaten, zeitraum: { von?: Datum; bis?: Datum } = {}, jetzt = new Date()): ErtragErgebnis {
  const umsaetze = umsatzJeAuftrag(b);
  const zeilen: ErtragZeile[] = [];
  let ohneRechnung = 0;
  let laufend = 0;
  for (const a of b.auftraege) {
    const u = umsaetze.get(a.id);
    if (!ABGESCHLOSSEN.includes(a.phase)) {
      if (a.phase !== 'verloren' && (u || auftragKosten(a.id, b, jetzt).hatDaten)) laufend++;
      continue;
    }
    if (!u) {
      if (auftragKosten(a.id, b, jetzt).hatDaten) ohneRechnung++;
      continue;
    }
    if (zeitraum.von && (!u.letztesDatum || u.letztesDatum < zeitraum.von)) continue;
    if (zeitraum.bis && (!u.letztesDatum || u.letztesDatum > zeitraum.bis)) continue;
    const kosten = auftragKosten(a.id, b, jetzt);
    const db = u.netto - kosten.gesamt;
    zeilen.push({
      auftragId: a.id,
      kundeId: a.kundeId,
      art: a.art,
      umsatz: u.netto,
      kosten,
      db,
      marge: u.netto > 0 ? db / u.netto : undefined,
      datum: u.letztesDatum,
    });
  }
  return {
    zeilen: zeilen.sort((x, y) => y.db - x.db),
    ohneRechnung,
    laufend,
    rechnungenOhneAuftrag: b.rechnungen.filter((r) => !r.auftragId && rechnungZaehlt(r)).length,
    ohneKosten: zeilen.filter((z) => !z.kosten.hatDaten).length,
  };
}

export interface Gruppe {
  schluessel: string;
  umsatz: Cent;
  kosten: Cent;
  db: Cent;
  marge?: number;
  anzahl: number;
}

function fertig(g: Omit<Gruppe, 'marge'>): Gruppe {
  return { ...g, marge: g.umsatz > 0 ? g.db / g.umsatz : undefined };
}

export function gruppieren(zeilen: ErtragZeile[], schluessel: (z: ErtragZeile) => string): Gruppe[] {
  const m = new Map<string, Omit<Gruppe, 'marge'>>();
  for (const z of zeilen) {
    const k = schluessel(z);
    const g = m.get(k) ?? { schluessel: k, umsatz: 0, kosten: 0, db: 0, anzahl: 0 };
    g.umsatz += z.umsatz;
    g.kosten += z.kosten.gesamt;
    g.db += z.db;
    g.anzahl++;
    m.set(k, g);
  }
  return [...m.values()].map(fertig).sort((x, y) => y.db - x.db);
}

/** Schlüssel für Positionen ohne Leistung aus dem Katalog */
export const OHNE_LEISTUNG = '__ohne__';

/**
 * Ertrag je Leistung: Umsatz aus den Rechnungspositionen mit `leistungId`.
 * Die Kosten eines Auftrags werden anteilig nach Umsatzanteil auf seine Positionen verteilt
 * (Zeiten sind nicht je Leistung erfasst).
 */
export function ertragJeLeistung(zeilen: ErtragZeile[], b: Basisdaten): Gruppe[] {
  const m = new Map<string, Omit<Gruppe, 'marge'> & { auftraege: Set<ID> }>();
  for (const z of zeilen) {
    const rechnungen = b.rechnungen.filter((r) => r.auftragId === z.auftragId && rechnungZaehlt(r) && r.art !== 'gutschrift');
    const anteile = new Map<string, Cent>();
    for (const r of rechnungen) {
      for (const p of r.positionen) {
        const betrag = summen([p]).netto;
        if (!betrag) continue;
        const k = p.leistungId ?? OHNE_LEISTUNG;
        anteile.set(k, (anteile.get(k) ?? 0) + betrag);
      }
    }
    const summe = [...anteile.values()].reduce((s, x) => s + x, 0);
    if (!summe) continue;
    for (const [k, betrag] of anteile) {
      const quote = betrag / summe;
      const umsatz = Math.round(z.umsatz * quote);
      const kosten = Math.round(z.kosten.gesamt * quote);
      const g = m.get(k) ?? { schluessel: k, umsatz: 0, kosten: 0, db: 0, anzahl: 0, auftraege: new Set<ID>() };
      g.umsatz += umsatz;
      g.kosten += kosten;
      g.db += umsatz - kosten;
      g.auftraege.add(z.auftragId);
      g.anzahl = g.auftraege.size;
      m.set(k, g);
    }
  }
  return [...m.values()].map(({ auftraege: _, ...g }) => fertig(g)).sort((x, y) => y.db - x.db);
}
