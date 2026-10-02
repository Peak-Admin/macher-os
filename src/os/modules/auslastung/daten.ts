/** Auslastung: geplante vs. verfügbare Stunden je Mitarbeiter und Woche. Reine Logik. */
import { plusTage, wochenStart } from '@core/format';
import type { Datum, ID } from '@core/objects';
import type { Ton } from '@core/modul';
import { geplanteStunden, verfuegbareStunden, type PlanKontext } from '../verfuegbarkeit/daten';

export type Bewertung = 'ueberlast' | 'voll' | 'gut' | 'freiraum' | 'nicht_da';

export interface WochenWert {
  wochenStart: Datum;
  geplant: number;
  verfuegbar: number;
  /** geplant / verfügbar, 0 wenn nichts verfügbar */
  quote: number;
  bewertung: Bewertung;
  text: string;
  ton: Ton;
}

export interface MitarbeiterAuslastung {
  mitarbeiterId: ID;
  wochen: WochenWert[];
}

const h = (n: number) => `${new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(n)} h`;

/** Text-Status für eine Woche */
export function bewerte(geplant: number, verfuegbar: number): Pick<WochenWert, 'bewertung' | 'text' | 'ton' | 'quote'> {
  if (verfuegbar <= 0)
    return geplant > 0
      ? { bewertung: 'ueberlast', text: `Verplant, aber nicht da (${h(geplant)})`, ton: 'achtung', quote: 0 }
      : { bewertung: 'nicht_da', text: 'Nicht da', ton: 'neutral', quote: 0 };
  const quote = geplant / verfuegbar;
  if (quote > 1.05) return { bewertung: 'ueberlast', text: `Überlast: ${h(geplant - verfuegbar)} zu viel`, ton: 'achtung', quote };
  if (quote >= 0.85) return { bewertung: 'voll', text: 'Voll', ton: 'aktiv', quote };
  if (quote >= 0.5) return { bewertung: 'gut', text: `Gut ausgelastet, ${h(verfuegbar - geplant)} frei`, ton: 'erfolg', quote };
  return { bewertung: 'freiraum', text: `Freiraum: ${h(verfuegbar - geplant)} frei`, ton: 'neutral', quote };
}

/** Auslastung aller aktiven Mitarbeiter für `anzahl` Wochen ab der Woche von `ab` */
export function auslastung(k: PlanKontext, ab: Datum, anzahl = 4): MitarbeiterAuslastung[] {
  const start = wochenStart(ab);
  const wochen = Array.from({ length: anzahl }, (_, i) => plusTage(start, i * 7));
  return k.mitarbeiter
    .filter((m) => m.aktiv)
    .map((m) => ({
      mitarbeiterId: m.id,
      wochen: wochen.map((w) => {
        const geplant = geplanteStunden(m.id, w, plusTage(w, 6), k);
        const verfuegbar = verfuegbareStunden(m.id, w, plusTage(w, 6), k);
        return { wochenStart: w, geplant, verfuegbar, ...bewerte(geplant, verfuegbar) };
      }),
    }));
}

/** Summe über alle Mitarbeiter einer Woche (für die Kennzahl im Plan-Hub) */
export function teamWoche(liste: MitarbeiterAuslastung[], index = 0): { geplant: number; verfuegbar: number; quote: number } {
  const geplant = liste.reduce((s, m) => s + (m.wochen[index]?.geplant ?? 0), 0);
  const verfuegbar = liste.reduce((s, m) => s + (m.wochen[index]?.verfuegbar ?? 0), 0);
  return { geplant: Math.round(geplant * 10) / 10, verfuegbar: Math.round(verfuegbar * 10) / 10, quote: verfuegbar ? geplant / verfuegbar : 0 };
}
