/** Anlagen: Wartungs- und Gewährleistungsregeln (reine Logik). */
import { heute, tageZwischen, plusMonate } from '@core/format';
import type { Anlage, Auftrag, Datum, ID } from '@core/objects';

export const BALD_TAGE = 30;

/** Nächste Wartung = letzte Wartung (oder Einbau) + Intervall */
export function naechsteWartungBerechnen(a: Pick<Anlage, 'letzteWartung' | 'eingebautAm' | 'wartungMonate'>): Datum | undefined {
  const basis = a.letzteWartung ?? a.eingebautAm;
  if (!basis || !a.wartungMonate) return undefined;
  return plusMonate(basis, a.wartungMonate);
}

export type WartungsStatus = 'ueberfaellig' | 'bald' | 'ok' | 'keine';

export function wartungsStatus(a: Pick<Anlage, 'naechsteWartung' | 'letzteWartung' | 'eingebautAm' | 'wartungMonate'>, stichtag = heute()): WartungsStatus {
  const n = a.naechsteWartung ?? naechsteWartungBerechnen(a);
  if (!n) return 'keine';
  const t = tageZwischen(stichtag, n);
  if (t < 0) return 'ueberfaellig';
  if (t <= BALD_TAGE) return 'bald';
  return 'ok';
}

export type GewaehrleistungsStatus = 'laeuft' | 'endet_bald' | 'abgelaufen' | 'keine';

export function gewaehrleistungStatus(a: Pick<Anlage, 'gewaehrleistungBis'>, stichtag = heute()): GewaehrleistungsStatus {
  if (!a.gewaehrleistungBis) return 'keine';
  const t = tageZwischen(stichtag, a.gewaehrleistungBis);
  if (t < 0) return 'abgelaufen';
  if (t <= BALD_TAGE) return 'endet_bald';
  return 'laeuft';
}

/** Alle Aufträge, in denen die Anlage vorkommt – neueste zuerst */
export function historie(anlageId: ID, auftraege: Auftrag[]): Auftrag[] {
  return auftraege.filter((a) => a.anlageIds?.includes(anlageId)).sort((a, b) => (b.abgeschlossenAm ?? b.erstelltAm).localeCompare(a.abgeschlossenAm ?? a.erstelltAm));
}

/** Gibt es schon einen offenen Wartungsauftrag für diese Anlage? */
export function offenerWartungsauftrag(anlageId: ID, auftraege: Auftrag[]): Auftrag | undefined {
  return auftraege.find((a) => a.art === 'wartung' && a.anlageIds?.includes(anlageId) && !['erledigt', 'verloren'].includes(a.phase) && !a.geloeschtAm);
}

/**
 * Nach erledigter Wartung: letzte Wartung = Abschlussdatum, nächste = + Intervall.
 * Gibt den Patch zurück oder undefined, wenn nichts zu tun ist.
 */
export function wartungFortschreiben(a: Anlage, erledigtAm: Datum): Partial<Anlage> | undefined {
  if (a.letzteWartung && a.letzteWartung >= erledigtAm) return undefined;
  const patch: Partial<Anlage> = { letzteWartung: erledigtAm };
  if (a.wartungMonate) patch.naechsteWartung = plusMonate(erledigtAm, a.wartungMonate);
  return patch;
}

export const WARTUNG_TEXT: Record<WartungsStatus, { text: string; ton: 'gefahr' | 'achtung' | 'aktiv' | 'erfolg' | 'neutral' }> = {
  ueberfaellig: { text: 'Wartung überfällig', ton: 'gefahr' },
  bald: { text: 'Wartung bald fällig', ton: 'aktiv' },
  ok: { text: 'Wartung im Plan', ton: 'erfolg' },
  keine: { text: 'Kein Wartungsintervall', ton: 'neutral' },
};

export const GEWAEHRLEISTUNG_TEXT: Record<GewaehrleistungsStatus, { text: string; ton: 'gefahr' | 'achtung' | 'aktiv' | 'erfolg' | 'neutral' }> = {
  laeuft: { text: 'In Gewährleistung', ton: 'erfolg' },
  endet_bald: { text: 'Gewährleistung endet bald', ton: 'achtung' },
  abgelaufen: { text: 'Gewährleistung abgelaufen', ton: 'neutral' },
  keine: { text: 'Gewährleistung unbekannt', ton: 'neutral' },
};
