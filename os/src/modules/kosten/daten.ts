/**
 * Tatsächliche Kosten je Auftrag – reine Berechnung aus Kernobjekten.
 *
 * Kosten = Zeiten (Dauer × Kostensatz des Mitarbeiters)
 *        + Material (verbrauchte Buchungen × EK)
 *        + Belege mit Auftragsbezug (netto).
 */
import { isoDatum, minutenAusStreng, minutenVon } from '@core/format';
import type { Cent, ID, Zeiteintrag } from '@core/objects';
import type { Basisdaten } from './basis';

/**
 * Netto-Arbeitsminuten eines Zeiteintrags.
 * Läuft der Eintrag noch (kein Ende) und ist er von heute, zählt die Zeit bis `jetzt`.
 * Unvollständige Einträge aus der Vergangenheit liefern `undefined`.
 */
export function zeitMinuten(z: Pick<Zeiteintrag, 'datum' | 'start' | 'ende' | 'pauseMinuten'>, jetzt?: Date): number | undefined {
  const start = minutenAusStreng(z.start);
  if (start == null) return undefined;
  let ende: number | undefined;
  if (z.ende) {
    ende = minutenAusStreng(z.ende);
    if (ende == null) return undefined;
    if (ende < start) ende += 24 * 60; // über Mitternacht
  } else {
    if (!jetzt || isoDatum(jetzt) !== z.datum) return undefined;
    ende = minutenVon(jetzt);
    if (ende < start) return 0;
  }
  return Math.max(0, ende - start - (z.pauseMinuten || 0));
}

export interface LohnZeile {
  mitarbeiterId: ID;
  minuten: number;
  /** davon Fahrtzeit */
  fahrtMinuten: number;
  kostensatz: Cent;
  betrag: Cent;
}

export interface MaterialZeile {
  id: ID;
  text: string;
  menge: number;
  einheit: string;
  ek: Cent;
  betrag: Cent;
}

export interface BelegZeile {
  id: ID;
  text: string;
  datum: string;
  netto: Cent;
}

export interface AuftragKosten {
  auftragId: ID;
  lohn: Cent;
  material: Cent;
  belege: Cent;
  gesamt: Cent;
  /** erfasste Arbeitsminuten (inkl. Fahrt) */
  minuten: number;
  fahrtMinuten: number;
  lohnZeilen: LohnZeile[];
  materialZeilen: MaterialZeile[];
  belegZeilen: BelegZeile[];
  /** geplantes, noch nicht verbrauchtes Material (EK) – nicht in `gesamt` */
  materialOffen: Cent;
  /** Zeiten, die gerade laufen (bis jetzt gezählt) */
  laufend: number;
  /** Zeiten ohne Ende aus der Vergangenheit – nicht gezählt */
  unvollstaendig: number;
  /** Mitarbeiter mit Zeiten, aber ohne Kostensatz */
  ohneKostensatz: ID[];
  hatDaten: boolean;
}

export function auftragKosten(auftragId: ID, b: Basisdaten, jetzt: Date = new Date()): AuftragKosten {
  const satz = new Map(b.mitarbeiter.map((m) => [m.id, m.kostensatz || 0]));
  const lohnJe = new Map<ID, LohnZeile>();
  let laufend = 0;
  let unvollstaendig = 0;

  for (const z of b.zeiten) {
    if (z.auftragId !== auftragId) continue;
    const min = zeitMinuten(z, jetzt);
    if (min == null) {
      unvollstaendig++;
      continue;
    }
    if (!z.ende) laufend++;
    const zeile = lohnJe.get(z.mitarbeiterId) ?? {
      mitarbeiterId: z.mitarbeiterId,
      minuten: 0,
      fahrtMinuten: 0,
      kostensatz: satz.get(z.mitarbeiterId) ?? 0,
      betrag: 0,
    };
    zeile.minuten += min;
    if (z.art === 'fahrt') zeile.fahrtMinuten += min;
    lohnJe.set(z.mitarbeiterId, zeile);
  }
  const lohnZeilen = [...lohnJe.values()].map((z) => ({ ...z, betrag: Math.round((z.minuten / 60) * z.kostensatz) }));

  const materialZeilen: MaterialZeile[] = [];
  let materialOffen = 0;
  for (const m of b.material) {
    if (m.auftragId !== auftragId) continue;
    const betrag = Math.round(m.menge * m.ek);
    if (m.status === 'verbraucht') {
      materialZeilen.push({ id: m.id, text: m.text, menge: m.menge, einheit: m.einheit, ek: m.ek, betrag });
    } else {
      materialOffen += betrag;
    }
  }

  const belegZeilen: BelegZeile[] = b.belege
    .filter((x) => x.auftragId === auftragId)
    .map((x) => ({
      id: x.id,
      text: [x.lieferantName ?? b.lieferanten.find((l) => l.id === x.lieferantId)?.name, x.kategorie, x.nummer].filter(Boolean).join(' · ') || 'Beleg',
      datum: x.datum,
      netto: x.netto,
    }));

  const lohn = lohnZeilen.reduce((s, z) => s + z.betrag, 0);
  const material = materialZeilen.reduce((s, z) => s + z.betrag, 0);
  const belege = belegZeilen.reduce((s, z) => s + z.netto, 0);

  return {
    auftragId,
    lohn,
    material,
    belege,
    gesamt: lohn + material + belege,
    minuten: lohnZeilen.reduce((s, z) => s + z.minuten, 0),
    fahrtMinuten: lohnZeilen.reduce((s, z) => s + z.fahrtMinuten, 0),
    lohnZeilen,
    materialZeilen,
    belegZeilen,
    materialOffen,
    laufend,
    unvollstaendig,
    ohneKostensatz: lohnZeilen.filter((z) => z.minuten > 0 && !z.kostensatz).map((z) => z.mitarbeiterId),
    hatDaten: lohnZeilen.length + materialZeilen.length + belegZeilen.length > 0,
  };
}

/** Kosten aller Aufträge, die überhaupt Kosten haben – teuerste zuerst */
export function kostenUebersicht(b: Basisdaten, jetzt: Date = new Date(), filter?: (auftragId: ID) => boolean): AuftragKosten[] {
  return b.auftraege
    .filter((a) => !filter || filter(a.id))
    .map((a) => auftragKosten(a.id, b, jetzt))
    .filter((k) => k.hatDaten)
    .sort((x, y) => y.gesamt - x.gesamt);
}
