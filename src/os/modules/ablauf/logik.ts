/**
 * Ablauf-Engine – reine Regeln (ohne Speicher, ohne UI):
 * Welcher Schritt eines Ablaufs gilt für einen Auftrag? Wann ist eine Frist überschritten?
 *
 * Die Phase des Auftrags bleibt die Quelle der Wahrheit. Ein Schritt ist eine feinere Stufe innerhalb
 * einer Phase. Gespeichert wird nur, welcher Schritt zuletzt galt (für „seit wann“ und manuelle Schritte).
 */
import { PHASEN } from '@core/objects';
import type { Auftragsart, Phase } from '@core/objects';
import type { SchrittBedingung, SchrittVorlage, SchrittZustaendig } from '@core/gewerke';

export interface AblaufDef {
  id: string;
  name: string;
  arten: Auftragsart[];
  schritte: SchrittVorlage[];
}

/** Was über den Auftrag gerade stimmt – Grundlage für automatische Schrittwechsel */
export type Fakten = Partial<Record<SchrittBedingung, boolean>>;

export interface AktuellerSchritt {
  schritt: SchrittVorlage;
  /** Index im Ablauf; -1 = kein passender Schritt (Phase ohne Schritte, „verloren“) */
  index: number;
  /** alle Schritte des Ablaufs sind erledigt (Auftrag erledigt) */
  fertig: boolean;
}

/** Fortschritt ohne „verloren“ */
const REIHE: Phase[] = ['anfrage', 'besichtigung', 'angebot', 'beauftragt', 'in_arbeit', 'abnahme', 'abrechnung', 'erledigt'];
export const phasenIndex = (p: Phase) => REIHE.indexOf(p);
export const phasenLabel = (p: Phase) => PHASEN.find((x) => x.id === p)?.label ?? p;

/**
 * Der aktuelle Schritt: innerhalb der Phase des Auftrags der zuletzt gespeicherte Schritt
 * oder – wenn ein späterer Schritt seine Bedingung erfüllt – dieser (automatischer Statuswechsel).
 */
export function aktuellerSchritt(ablauf: AblaufDef, phase: Phase, gespeichert: string | undefined, fakten: Fakten): AktuellerSchritt {
  const inPhase = ablauf.schritte.map((schritt, index) => ({ schritt, index })).filter((x) => x.schritt.phase === phase);
  if (!inPhase.length) {
    return {
      schritt: { id: `phase:${phase}`, label: phase === 'verloren' ? 'Nicht zustande gekommen' : phasenLabel(phase), phase },
      index: phase === 'erledigt' ? ablauf.schritte.length : -1,
      fertig: phase === 'erledigt',
    };
  }
  let pos = Math.max(0, inPhase.findIndex((x) => x.schritt.id === gespeichert));
  inPhase.forEach((x, i) => {
    if (i > pos && x.schritt.automatisch && fakten[x.schritt.automatisch]) pos = i;
  });
  const { schritt, index } = inPhase[pos];
  return { schritt, index, fertig: phase === 'erledigt' };
}

/** Nächster Schritt im Ablauf (oder undefined am Ende) */
export function naechsterSchrittIm(ablauf: AblaufDef, index: number): SchrittVorlage | undefined {
  return index >= 0 ? ablauf.schritte[index + 1] : undefined;
}

/**
 * Darf man von Hand „weiter“ gehen? Nur innerhalb derselben Phase – Phasenwechsel laufen wie bisher
 * über die Hauptaktion des Auftrags und die Automationen.
 */
export function weiterMoeglich(ablauf: AblaufDef, aktuell: AktuellerSchritt): SchrittVorlage | undefined {
  const n = naechsterSchrittIm(ablauf, aktuell.index);
  return n && n.phase === aktuell.schritt.phase ? n : undefined;
}

/**
 * Soll der Mensch „weiter“ angeboten bekommen? Nur, wenn der nächste Schritt nicht von selbst kommt
 * (z. B. „Eingeplant“ kommt mit dem Termin – da wäre ein Knopf irreführend).
 */
export function weiterVonHand(ablauf: AblaufDef, aktuell: AktuellerSchritt): SchrittVorlage | undefined {
  const n = weiterMoeglich(ablauf, aktuell);
  return n && !n.automatisch ? n : undefined;
}

/** Schritte stabil nach Phase sortieren (die Reihenfolge innerhalb einer Phase bleibt) */
export function nachPhaseSortiert(schritte: SchrittVorlage[]): SchrittVorlage[] {
  return schritte
    .map((s, i) => ({ s, i }))
    .sort((a, b) => phasenIndex(a.s.phase) - phasenIndex(b.s.phase) || a.i - b.i)
    .map((x) => x.s);
}

/** Prüft einen Ablauf vor dem Speichern. Rückgabe: Fehlertext oder undefined */
export function ablaufPruefen(a: Pick<AblaufDef, 'name' | 'arten' | 'schritte'>): string | undefined {
  if (!a.name.trim()) return 'Gib dem Ablauf einen Namen.';
  if (!a.arten.length) return 'Wähle mindestens eine Auftragsart.';
  if (!a.schritte.length) return 'Ein Ablauf braucht mindestens einen Schritt.';
  if (a.schritte.some((s) => !s.label.trim())) return 'Jeder Schritt braucht einen Namen.';
  if (a.schritte.some((s) => s.phase === 'verloren')) return '„Nicht zustande gekommen“ ist kein Schritt, sondern das Ende eines Auftrags.';
  const ids = new Set(a.schritte.map((s) => s.id));
  if (ids.size !== a.schritte.length) return 'Zwei Schritte haben dieselbe Kennung.';
  if (a.schritte.some((s) => s.fristTage != null && (!Number.isInteger(s.fristTage) || s.fristTage < 1 || s.fristTage > 365))) return 'Fristen bitte als ganze Tage zwischen 1 und 365.';
  return undefined;
}

/** Fälligkeit eines Schritts (YYYY-MM-DD) aus Beginn und Frist */
export function faelligAm(seit: string | undefined, fristTage: number | undefined, plusTage: (d: string, n: number) => string): string | undefined {
  if (!seit || !fristTage) return undefined;
  return plusTage(seit.slice(0, 10), fristTage);
}

export const ZUSTAENDIG_LABEL: Record<SchrittZustaendig, string> = {
  verantwortlich: 'Verantwortlich am Auftrag',
  buero: 'Büro',
  chef: 'Chef',
  eingeplant: 'Wer eingeplant ist',
};

export const BEDINGUNG_LABEL: Record<SchrittBedingung, string> = {
  besichtigung_geplant: 'eine Besichtigung geplant ist',
  angebot_versendet: 'das Angebot verschickt ist',
  material_bestellt: 'Material bestellt ist',
  material_bereit: 'das Material bereitliegt',
  termin_geplant: 'ein Einsatz geplant ist',
  rechnung_versendet: 'die Rechnung verschickt ist',
};
