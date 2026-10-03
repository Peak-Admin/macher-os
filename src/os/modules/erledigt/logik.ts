/**
 * Erledigt: was Lotte selbst erledigt hat – Zeiträume, Zusammenfassung, Rückgängig.
 */
import { aufloesen, db } from '@core/db';
import { einstellung, setzeEinstellung } from '@core/einstellungen';
import { aktionAusfuehren } from '@core/modul';
import { aktionVorhanden } from '@core/modul';
import { isoDatum, plusTage, wochenStart } from '@core/format';
import type { Aufgabe, Erledigung, ID, Mitarbeiter, Termin, Zeiteintrag } from '@core/objects';

export type Zeitraum = 'heute' | 'woche' | 'monat';

export const ZEITRAUM_LABEL: Record<Zeitraum, string> = { heute: 'Heute', woche: 'Diese Woche', monat: 'Letzte 30 Tage' };

/** Erster Tag des Zeitraums (Woche = ab Montag) */
export function zeitraumStart(z: Zeitraum, jetzt = new Date()): string {
  const tag = isoDatum(jetzt);
  if (z === 'heute') return tag;
  if (z === 'woche') return wochenStart(tag);
  return plusTage(tag, -29);
}

/** Lokales Datum eines ISO-Zeitpunkts */
const lokalTag = (iso: string) => isoDatum(new Date(iso));

/**
 * Betrifft eine Erledigung diesen Mitarbeiter? Monteure sehen nur, was sie selbst angeht
 * (ihre Termine, Aufgaben, Zeiten oder Benachrichtigungen an sie).
 */
export function betrifft(e: Erledigung, m: Mitarbeiter | undefined): boolean {
  if (!m || m.rolle === 'chef' || m.rolle === 'buero') return true;
  if (e.erstelltVon === m.id) return true;
  const b = e.bezug;
  if (!b) return false;
  if (b.typ === 'mitarbeiter') return b.id === m.id;
  const o = aufloesen(b);
  if (!o) return false;
  if (b.typ === 'termine') return (o as Termin).mitarbeiterIds?.includes(m.id) ?? false;
  if (b.typ === 'aufgaben') return (o as Aufgabe).zustaendigId === m.id;
  if (b.typ === 'zeiten') return (o as Zeiteintrag).mitarbeiterId === m.id;
  if (b.typ === 'benachrichtigungen') return (o as { fuerMitarbeiterId?: ID }).fuerMitarbeiterId === m.id;
  return false;
}

export function erledigungenIm(z: Zeitraum, m: Mitarbeiter | undefined, jetzt = new Date()): Erledigung[] {
  const ab = zeitraumStart(z, jetzt);
  const bis = isoDatum(jetzt);
  return db.erledigungen
    .where((e) => {
      const t = lokalTag(e.erstelltAm);
      return t >= ab && t <= bis && betrifft(e, m);
    })
    .sort((a, b) => b.erstelltAm.localeCompare(a.erstelltAm));
}

export interface Zusammenfassung {
  anzahl: number;
  /** Summe der geschätzten Minuten (nur Einträge mit Schätzung) */
  minuten: number;
  /** wie viele Einträge eine Schätzung haben */
  mitSchaetzung: number;
}

export function zusammenfassen(liste: Erledigung[]): Zusammenfassung {
  const mit = liste.filter((e) => typeof e.minutenGespart === 'number' && e.minutenGespart > 0 && !rueckgaengigAm(e.id));
  return {
    anzahl: liste.filter((e) => !rueckgaengigAm(e.id)).length,
    minuten: mit.reduce((s, e) => s + (e.minutenGespart ?? 0), 0),
    mitSchaetzung: mit.length,
  };
}

/** „ca. 1 Std. 20 Min.“ – immer als Schätzung formuliert */
export function minutenText(min: number): string {
  if (min <= 0) return '–';
  const m = Math.round(min);
  if (m < 60) return `ca. ${m} Min.`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `ca. ${h} Std. ${r} Min.` : `ca. ${h} Std.`;
}

// ------------------------------------------------------------------ Rückgängig
// Kernwunsch: `Erledigung.rueckgaengigAm`. Bis dahin merken wir uns das als Einstellung.

const key = (id: ID) => `erledigt.rueckgaengig.${id}`;

export function rueckgaengigAm(id: ID): string | undefined {
  return einstellung<string | undefined>(key(id), undefined);
}

export function kannRueckgaengig(e: Erledigung): boolean {
  return !!e.rueckgaengig && !rueckgaengigAm(e.id);
}

/** Führt die hinterlegte Gegen-Aktion aus. Wirft, wenn die Aktion fehlt oder scheitert. */
export function rueckgaengigMachen(e: Erledigung): string | void {
  if (!kannRueckgaengig(e)) throw new Error('Diese Erledigung kann nicht rückgängig gemacht werden.');
  if (!aktionVorhanden(e.rueckgaengig!.aktion)) throw new Error('Das Modul für diese Aktion ist gerade nicht verfügbar.');
  const ziel = aktionAusfuehren(e.rueckgaengig!.aktion, e.rueckgaengig!.payload);
  setzeEinstellung(key(e.id), new Date().toISOString());
  return ziel;
}
