/**
 * Lager: Bestände je Lagerort (Hauptlager + Fahrzeuglager je Fahrzeug).
 *
 * `artikel.bestand` bleibt die EINE Summe über alle Lagerorte.
 * `lagerbewegungen` sind das Protokoll (Zugang, Entnahme, Umbuchung, Inventur).
 * Bestand je Ort = Bewegungen an diesem Ort; was die Summe darüber hinaus hat
 * (Altbestand ohne Bewegung), liegt am Standard-Lagerort des Artikels.
 */
import { batch, db, defineCollection } from '@core/db';
import { heute } from '@core/format';
import type { Artikel, Basis, Datum, ID } from '@core/objects';
import type { TypTon } from '@core/zeichen';
import type { IconName } from '@ui/index';
import { fahrzeuge, fahrzeugText, fahrzeugVon } from '../werkzeuge/daten';

export type LagerortId = string;
export const HAUPTLAGER: LagerortId = 'haupt';
const FZ = 'fz:';

export interface Lagerbewegung extends Basis {
  art: 'zugang' | 'entnahme' | 'umbuchung' | 'inventur';
  artikelId: ID;
  /** immer positiv; Richtung über `von`/`nach` */
  menge: number;
  von?: LagerortId;
  nach?: LagerortId;
  datum: Datum;
  mitarbeiterId?: ID;
  auftragId?: ID;
  /** Materialbuchung, die diese Entnahme ausgelöst hat */
  materialId?: ID;
  bestellungId?: ID;
  notiz?: string;
}

export const lagerbewegungen = defineCollection<Lagerbewegung>('lagerbewegungen');

export const ART_LABEL: Record<Lagerbewegung['art'], string> = {
  zugang: 'Zugang',
  entnahme: 'Entnahme',
  umbuchung: 'Umbuchung',
  inventur: 'Inventur',
};

/** Strich-Icon je Buchungsart (Umschalter im Buchen-Dialog, Typ-Kachel in den Bewegungen) */
export const ART_ICON: Record<Lagerbewegung['art'], IconName> = {
  zugang: 'plus',
  entnahme: 'minus',
  umbuchung: 'pfeil',
  inventur: 'liste',
};

/** Farbton der Typ-Kachel je Buchungsart – unterscheidet Arten, kein Status */
export const ART_TON: Record<Lagerbewegung['art'], TypTon> = {
  zugang: 'gruen',
  entnahme: 'sand',
  umbuchung: 'blau',
  inventur: 'lila',
};

export interface Lagerort {
  id: LagerortId;
  name: string;
  fahrzeugId?: ID;
}

export function fahrzeugOrt(fahrzeugId: ID): LagerortId {
  return FZ + fahrzeugId;
}

export function lagerorte(): Lagerort[] {
  return [
    { id: HAUPTLAGER, name: 'Hauptlager' },
    ...fahrzeuge().map((f) => ({ id: fahrzeugOrt(f.id), name: fahrzeugText(f), fahrzeugId: f.id })),
  ];
}

export function lagerortName(id: LagerortId | undefined): string {
  if (!id) return '–';
  if (id === HAUPTLAGER) return 'Hauptlager';
  if (id.startsWith(FZ)) return fahrzeugText(db.betriebsmittel.get(id.slice(FZ.length)));
  return id;
}

/** Standard-Lagerort: `artikel.lagerort` kann ein Fahrzeug (Kennzeichen/Name) sein, sonst Hauptlager. */
export function standardOrt(a: Artikel): LagerortId {
  const f = fahrzeugVon(a.lagerort);
  return f ? fahrzeugOrt(f.id) : HAUPTLAGER;
}

/** Lagerartikel = Bestand wird gepflegt (Feld gesetzt) */
export function istLagerartikel(a: Artikel): boolean {
  return a.bestand != null;
}

export function unterMindestbestand(a: Artikel): boolean {
  return a.mindestbestand != null && a.mindestbestand > 0 && (a.bestand ?? 0) < a.mindestbestand;
}

/** Netto-Wirkung auf die Gesamtsumme (Umbuchung = 0) */
export function summenWirkung(b: Pick<Lagerbewegung, 'menge' | 'von' | 'nach'>): number {
  return (b.nach ? b.menge : 0) - (b.von ? b.menge : 0);
}

export function bewegungenNachArtikel(): Map<ID, Lagerbewegung[]> {
  const m = new Map<ID, Lagerbewegung[]>();
  for (const b of lagerbewegungen.all()) {
    const l = m.get(b.artikelId);
    if (l) l.push(b);
    else m.set(b.artikelId, [b]);
  }
  return m;
}

/** Bestand je Lagerort. Summe aller Werte = `artikel.bestand`. Orte mit 0 werden weggelassen. */
export function bestandJeOrt(a: Artikel, bewegungen = lagerbewegungen.where((b) => b.artikelId === a.id)): Record<LagerortId, number> {
  const r: Record<LagerortId, number> = {};
  let netto = 0;
  for (const b of bewegungen) {
    if (b.nach) r[b.nach] = (r[b.nach] ?? 0) + b.menge;
    if (b.von) r[b.von] = (r[b.von] ?? 0) - b.menge;
    netto += summenWirkung(b);
  }
  const rest = (a.bestand ?? 0) - netto;
  if (rest !== 0) {
    const s = standardOrt(a);
    r[s] = (r[s] ?? 0) + rest;
  }
  for (const k of Object.keys(r)) {
    r[k] = runden(r[k]);
    if (r[k] === 0) delete r[k];
  }
  return r;
}

export function bestandAm(a: Artikel, ort: LagerortId, bewegungen?: Lagerbewegung[]): number {
  return bestandJeOrt(a, bewegungen)[ort] ?? 0;
}

const runden = (n: number) => Math.round(n * 1000) / 1000;

export interface BuchungEingabe {
  art: Lagerbewegung['art'];
  artikelId: ID;
  menge: number;
  von?: LagerortId;
  nach?: LagerortId;
  datum?: Datum;
  mitarbeiterId?: ID;
  auftragId?: ID;
  materialId?: ID;
  bestellungId?: ID;
  notiz?: string;
}

/** Prüft eine Buchung. Rückgabe: Fehlertext oder undefined. */
export function pruefeBuchung(e: BuchungEingabe): string | undefined {
  if (!db.artikel.get(e.artikelId)) return 'Wähle einen Artikel.';
  if (!(e.menge > 0)) return 'Trage eine Menge größer 0 ein.';
  if (e.art === 'zugang' && !e.nach) return 'Wohin kommt das Material?';
  if (e.art === 'entnahme' && !e.von) return 'Woher wird entnommen?';
  if (e.art === 'umbuchung') {
    if (!e.von || !e.nach) return 'Wähle Von- und Nach-Lagerort.';
    if (e.von === e.nach) return 'Von und Nach sind gleich.';
  }
  return undefined;
}

/** Bucht eine Bewegung und hält `artikel.bestand` als Summe nach. */
export function buchen(e: BuchungEingabe): Lagerbewegung {
  const fehler = pruefeBuchung(e);
  if (fehler) throw new Error(fehler);
  const a = db.artikel.get(e.artikelId)!;
  const von = e.art === 'zugang' ? undefined : e.von;
  const nach = e.art === 'entnahme' ? undefined : e.nach;
  let bewegung!: Lagerbewegung;
  batch(() => {
    bewegung = lagerbewegungen.create({
      art: e.art,
      artikelId: e.artikelId,
      menge: runden(e.menge),
      von,
      nach,
      datum: e.datum ?? heute(),
      mitarbeiterId: e.mitarbeiterId,
      auftragId: e.auftragId,
      materialId: e.materialId,
      bestellungId: e.bestellungId,
      notiz: e.notiz,
    });
    const delta = summenWirkung({ menge: e.menge, von, nach });
    if (delta !== 0 || a.bestand == null) {
      db.artikel.update(a.id, { bestand: runden((a.bestand ?? 0) + delta) }, { text: `${ART_LABEL[e.art]}: ${delta > 0 ? '+' : ''}${runden(delta)} ${a.einheit}` });
    }
  });
  return bewegung;
}

/** Inventur: gezählte Mengen je Artikel an einem Ort → Differenzen buchen. Gibt die Anzahl Buchungen zurück. */
export function inventurBuchen(ort: LagerortId, zaehlung: Record<ID, number>, mitarbeiterId?: ID): number {
  const diff = inventurDifferenzen(ort, zaehlung);
  batch(() => {
    for (const d of diff) {
      buchen({
        art: 'inventur',
        artikelId: d.artikelId,
        menge: Math.abs(d.differenz),
        von: d.differenz < 0 ? ort : undefined,
        nach: d.differenz > 0 ? ort : undefined,
        mitarbeiterId,
        notiz: `Inventur: ${d.soll} → ${d.ist}`,
      });
    }
  });
  return diff.length;
}

export function inventurDifferenzen(ort: LagerortId, zaehlung: Record<ID, number>) {
  const nach = bewegungenNachArtikel();
  return Object.entries(zaehlung)
    .map(([artikelId, ist]) => {
      const a = db.artikel.get(artikelId);
      if (!a || !Number.isFinite(ist)) return undefined;
      const soll = bestandAm(a, ort, nach.get(a.id) ?? []);
      return { artikelId, soll, ist, differenz: runden(ist - soll) };
    })
    .filter((d): d is NonNullable<typeof d> => !!d && d.differenz !== 0);
}

/** Artikel, die an einem Ort geführt werden (für Inventur & Ansicht) */
export function artikelAmOrt(ort: LagerortId | 'alle'): Artikel[] {
  const nach = bewegungenNachArtikel();
  return db.artikel.where((a) => {
    if (!a.aktiv && !a.bestand) return false;
    if (ort === 'alle') return istLagerartikel(a) || nach.has(a.id);
    const je = bestandJeOrt(a, nach.get(a.id) ?? []);
    return ort in je || (istLagerartikel(a) && standardOrt(a) === ort) || !!nach.get(a.id)?.some((b) => b.von === ort || b.nach === ort);
  });
}

/** Lagerort eines Mitarbeiters: sein Fahrzeug, falls er eines fährt */
export function ortVonMitarbeiter(mitarbeiterId: ID | undefined): LagerortId | undefined {
  if (!mitarbeiterId) return undefined;
  const f = fahrzeuge().find((x) => x.mitarbeiterId === mitarbeiterId);
  return f ? fahrzeugOrt(f.id) : undefined;
}
