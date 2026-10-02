/**
 * Mehrere Betriebe in einem Browser – der Wechsler oben in der Seitenleiste.
 *
 * Jeder Betrieb hat einen vollständig getrennten Datenstand (eigene Speicherschlüssel, keine gemischten Daten).
 * Der erste Betrieb behält die bisherigen Schlüssel – vorhandene Daten bleiben ohne Umzug erhalten.
 * Das Verzeichnis selbst liegt im localStorage und kennt nur ID, Name und ein paar Angaben für die Anzeige;
 * die Source of Truth eines Betriebs ist sein eigener Datenstand. Später: Organization/Workspace in Supabase (RLS je Betrieb).
 *
 * Bewusst ohne Import von `db.ts`: die Datenschicht fragt hier beim Laden nach ihrem Schlüssel.
 */
import { useSyncExternalStore } from 'react';

export interface BetriebEintrag {
  id: string;
  name: string;
  /** Anzeige im Wechsler, z. B. „Elektro“ */
  gewerk?: string;
  /** aktive Mitarbeiter (Anzeige) */
  personen?: number;
  /** Setup abgeschlossen? */
  eingerichtet?: boolean;
}

interface Verzeichnis {
  aktiv: string;
  liste: BetriebEintrag[];
}

const VERZEICHNIS_KEY = 'macher-os:betriebe';
/** Der erste Betrieb – nutzt die bisherigen Schlüssel ohne Zusatz */
export const ERSTER_BETRIEB = 'haupt';
export const NEUER_BETRIEB_NAME = 'Neuer Betrieb';

const standard = (): Verzeichnis => ({ aktiv: ERSTER_BETRIEB, liste: [{ id: ERSTER_BETRIEB, name: 'Mein Betrieb' }] });

let zwischenspeicher: Verzeichnis | undefined;
const listener = new Set<() => void>();

function lesen(): Verzeichnis {
  if (zwischenspeicher) return zwischenspeicher;
  let v = standard();
  try {
    const roh = globalThis.localStorage?.getItem(VERZEICHNIS_KEY);
    const g = roh ? (JSON.parse(roh) as Partial<Verzeichnis>) : undefined;
    if (g && Array.isArray(g.liste) && g.liste.length) v = { aktiv: g.aktiv ?? g.liste[0].id, liste: g.liste };
  } catch {
    /* Standard */
  }
  if (!v.liste.some((b) => b.id === v.aktiv)) v.aktiv = v.liste[0].id;
  return (zwischenspeicher = v);
}

function schreiben(v: Verzeichnis) {
  zwischenspeicher = v;
  try {
    globalThis.localStorage?.setItem(VERZEICHNIS_KEY, JSON.stringify(v));
  } catch {
    /* nur in diesem Tab */
  }
  listener.forEach((l) => l());
}

/** Der Betrieb, mit dem diese Seite geladen wurde – bleibt bis zum Neuladen fest */
const geladen = lesen().aktiv;

export function aktiverBetrieb(): string {
  return geladen;
}

export function betriebe(): BetriebEintrag[] {
  return lesen().liste;
}

/** Speicherschlüssel für den aktiven Betrieb: der erste Betrieb behält `basis`, alle weiteren bekommen ihre ID angehängt */
export function betriebsSchluessel(basis: string, betrieb: string = geladen): string {
  return betrieb === ERSTER_BETRIEB ? basis : `${basis}:${betrieb}`;
}

/** Anzeige-Angaben des aktiven Betriebs nachziehen (Name, Gewerk …) – nur schreiben, wenn sich etwas geändert hat */
export function betriebMerken(angaben: Omit<BetriebEintrag, 'id'>, id: string = geladen) {
  const v = lesen();
  const alt = v.liste.find((b) => b.id === id);
  if (!alt) return;
  const neu = { ...alt, ...angaben };
  if (JSON.stringify(neu) === JSON.stringify(alt)) return;
  schreiben({ ...v, liste: v.liste.map((b) => (b.id === id ? neu : b)) });
}

/** Neuen, leeren Betrieb anlegen und als aktiv markieren (danach neu laden → Setup) */
export function betriebAnlegen(): string {
  const v = lesen();
  const id = `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  schreiben({ aktiv: id, liste: [...v.liste, { id, name: NEUER_BETRIEB_NAME }] });
  return id;
}

/** Betrieb als aktiv markieren (danach neu laden) */
export function betriebWaehlen(id: string) {
  const v = lesen();
  if (!v.liste.some((b) => b.id === id)) return;
  schreiben({ ...v, aktiv: id });
}

/**
 * Noch nicht eingerichteten Betrieb aus dem Verzeichnis nehmen (Setup abgebrochen).
 * Eingerichtete Betriebe werden hier nie entfernt – deren Daten bleiben.
 */
export function leerenBetriebVerwerfen(id: string, weiterZu: string) {
  const v = lesen();
  const b = v.liste.find((x) => x.id === id);
  if (!b || b.eingerichtet || id === ERSTER_BETRIEB || !v.liste.some((x) => x.id === weiterZu)) return;
  schreiben({ aktiv: weiterZu, liste: v.liste.filter((x) => x.id !== id) });
}

function abonnieren(l: () => void) {
  listener.add(l);
  const fremd = (e: StorageEvent) => {
    if (e.key !== VERZEICHNIS_KEY) return;
    zwischenspeicher = undefined;
    l();
  };
  globalThis.addEventListener?.('storage', fremd);
  return () => {
    listener.delete(l);
    globalThis.removeEventListener?.('storage', fremd);
  };
}

export function useBetriebe(): BetriebEintrag[] {
  return useSyncExternalStore(abonnieren, betriebe, betriebe);
}

/** Nur für Tests */
export function _verzeichnisZuruecksetzen() {
  zwischenspeicher = undefined;
}
