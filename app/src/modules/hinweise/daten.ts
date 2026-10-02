/** Hinweise & Freigaben: Filter, Zähler und Hilfen über `offeneHinweise()`. */
import { db } from '@core/db';
import { alleModule, pfadZu, type Ton } from '@core/modul';
import type { OffenerHinweis } from '@core/macher';
import type { Hinweis } from '@core/objects';

export type Art = OffenerHinweis['art'];
export type ArtFilter = Art | 'alle';

export const ARTEN: { wert: Art; label: string; ton: Ton }[] = [
  { wert: 'problem', label: 'Problem', ton: 'achtung' },
  { wert: 'entscheidung', label: 'Entscheidung', ton: 'aktiv' },
  { wert: 'freigabe', label: 'Freigabe', ton: 'aktiv' },
  { wert: 'info', label: 'Info', ton: 'neutral' },
];

export const artInfo = (a: Art) => ARTEN.find((x) => x.wert === a) ?? ARTEN[3];

export function filtern(liste: OffenerHinweis[], art: ArtFilter): OffenerHinweis[] {
  return art === 'alle' ? liste : liste.filter((h) => h.art === art);
}

export function zaehlen(liste: OffenerHinweis[]): Record<ArtFilter, number> {
  const z = { alle: liste.length, problem: 0, entscheidung: 0, freigabe: 0, info: 0 };
  for (const h of liste) z[h.art]++;
  return z;
}

/** Nur Aktionen anbieten, die ein Modul wirklich registriert hat */
export function aktionVerfuegbar(id: string): boolean {
  return alleModule().some((m) => !!m.aktionen?.[id]);
}

export function zielPfad(h: Pick<OffenerHinweis, 'pfad' | 'bezug'>): string | undefined {
  return h.pfad ?? pfadZu(h.bezug);
}

/** Erledigte gespeicherte Hinweise der letzten `tage` Tage, neueste zuerst */
export function erledigteSeit(tage: number, jetzt = Date.now()): Hinweis[] {
  const seit = new Date(jetzt - tage * 86_400_000).toISOString();
  return db.hinweise
    .where((h) => h.status === 'erledigt' && (h.erledigtAm ?? h.geaendertAm) >= seit)
    .sort((a, b) => (b.erledigtAm ?? b.geaendertAm).localeCompare(a.erledigtAm ?? a.geaendertAm));
}
