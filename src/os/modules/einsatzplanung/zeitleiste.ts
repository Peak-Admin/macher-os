/**
 * Zeitleiste der Plantafel: reine Logik für durchgehende Balken.
 * Tage werden als Index in der sichtbaren Tagesliste gerechnet (0 = erster sichtbarer Tag).
 */
import type { Datum } from '@core/objects';

export interface Spanne {
  von: number;
  bis: number;
}

/** Zoomstufen: wie viele Tage sichtbar sind und wie breit ein Tag mindestens ist (px) */
export const ZOOM = [
  { tage: 91, breite: 18 },
  { tage: 63, breite: 26 },
  { tage: 35, breite: 40 },
  { tage: 21, breite: 56 },
  { tage: 14, breite: 80 },
  { tage: 7, breite: 150 },
] as const;
export const ZOOM_STANDARD = 4;

/** Balken überlappungsfrei auf Spuren verteilen (gierig, nach Beginn sortiert). Ergebnis behält die Eingabereihenfolge. */
export function spuren<T extends Spanne>(liste: T[]): { eintrag: T; spur: number }[] {
  const ende: number[] = [];
  const zuordnung = new Map<T, number>();
  for (const e of [...liste].sort((a, b) => a.von - b.von || b.bis - a.bis)) {
    let s = ende.findIndex((bis) => bis < e.von);
    if (s < 0) s = ende.length;
    ende[s] = e.bis;
    zuordnung.set(e, s);
  }
  return liste.map((eintrag) => ({ eintrag, spur: zuordnung.get(eintrag) ?? 0 }));
}

/**
 * Einträge mit gleichem Schlüssel zu einem Balken zusammenfassen, wenn sie direkt aneinander anschließen
 * oder nur freie Tage (Wochenende, Feiertag) dazwischen liegen. Einträge ohne Schlüssel bleiben einzeln.
 */
export function zusammenfassen<T extends Spanne & { schluessel?: string }>(liste: T[], frei: (index: number) => boolean): (Spanne & { schluessel?: string; teile: T[] })[] {
  const ergebnis: (Spanne & { schluessel?: string; teile: T[] })[] = [];
  const sortiert = [...liste].sort((a, b) => a.von - b.von || a.bis - b.bis);
  for (const e of sortiert) {
    const passend = e.schluessel
      ? ergebnis.find((g) => {
          if (g.schluessel !== e.schluessel) return false;
          if (e.von <= g.bis + 1) return true;
          for (let i = g.bis + 1; i < e.von; i++) if (!frei(i)) return false;
          return true;
        })
      : undefined;
    if (passend) {
      passend.bis = Math.max(passend.bis, e.bis);
      passend.teile.push(e);
    } else ergebnis.push({ von: e.von, bis: e.bis, schluessel: e.schluessel, teile: [e] });
  }
  return ergebnis;
}

/** Tage gruppieren (z. B. nach Monat oder KW) für die Kopfzeilen: zusammenhängende Läufe mit gleichem Schlüssel */
export function laeufe(tage: Datum[], schluessel: (d: Datum) => string): { schluessel: string; von: number; bis: number }[] {
  const r: { schluessel: string; von: number; bis: number }[] = [];
  tage.forEach((d, i) => {
    const s = schluessel(d);
    const letzter = r[r.length - 1];
    if (letzter && letzter.schluessel === s) letzter.bis = i;
    else r.push({ schluessel: s, von: i, bis: i });
  });
  return r;
}
