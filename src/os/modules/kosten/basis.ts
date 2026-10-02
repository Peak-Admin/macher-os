/**
 * Rechengrundlage des Pakets „zahlen“: ein Schnappschuss der Kernobjekte.
 *
 * Alle Berechnungen (Kosten, Nachkalkulation, Ertrag, Auswertung, DATEV) sind reine
 * Funktionen auf diesem Schnappschuss – dadurch testbar und ohne Seiteneffekte.
 * In der App liefert `basisAusDb()` die aktuellen Daten.
 */
import { db } from '@core/db';
import type {
  Angebot,
  Artikel,
  Auftrag,
  Beleg,
  Betrieb,
  Kunde,
  Leistung,
  Lieferant,
  Materialbuchung,
  Mitarbeiter,
  Rechnung,
  Termin,
  Zahlung,
  Zeiteintrag,
} from '@core/objects';

export interface Basisdaten {
  betrieb?: Betrieb;
  auftraege: Auftrag[];
  zeiten: Zeiteintrag[];
  mitarbeiter: Mitarbeiter[];
  material: Materialbuchung[];
  belege: Beleg[];
  angebote: Angebot[];
  leistungen: Leistung[];
  artikel: Artikel[];
  rechnungen: Rechnung[];
  zahlungen: Zahlung[];
  termine: Termin[];
  kunden: Kunde[];
  lieferanten: Lieferant[];
}

export function leereBasis(teil: Partial<Basisdaten> = {}): Basisdaten {
  return {
    auftraege: [],
    zeiten: [],
    mitarbeiter: [],
    material: [],
    belege: [],
    angebote: [],
    leistungen: [],
    artikel: [],
    rechnungen: [],
    zahlungen: [],
    termine: [],
    kunden: [],
    lieferanten: [],
    ...teil,
  };
}

export function basisAusDb(): Basisdaten {
  return {
    betrieb: db.betrieb.get('betrieb'),
    auftraege: db.auftraege.all(),
    zeiten: db.zeiten.all(),
    mitarbeiter: db.mitarbeiter.all(),
    material: db.material.all(),
    belege: db.belege.all(),
    angebote: db.angebote.all(),
    leistungen: db.leistungen.all(),
    artikel: db.artikel.all(),
    rechnungen: db.rechnungen.all(),
    zahlungen: db.zahlungen.all(),
    termine: db.termine.all(),
    kunden: db.kunden.all(),
    lieferanten: db.lieferanten.all(),
  };
}

/** Prozent mit Vorzeichen, ganzzahlig: 0.234 → "+23 %" */
export function prozentText(anteil: number): string {
  const p = Math.round(anteil * 100);
  return `${p > 0 ? '+' : p < 0 ? '−' : '±'}${Math.abs(p)} %`;
}

/** Stunden mit höchstens einer Nachkommastelle: 12.25 → "12,3 h" */
export function stundenText(minuten: number): string {
  const h = Math.round((minuten / 60) * 10) / 10;
  return `${h.toLocaleString('de-DE', { maximumFractionDigits: 1 })} h`;
}
