/** Offen einzuplanen: Welche Aufträge und Besichtigungen haben noch keinen Termin? Reine Logik. */
import { alleModule } from '@core/modul';
import { tageZwischen, isoDatum } from '@core/format';
import type { Auftrag, Termin } from '@core/objects';
import { kuenftigeTermine } from '../kalender/daten';

export interface OffenerEintrag {
  auftrag: Auftrag;
  /** was fehlt: Einsatz für beauftragte Arbeit oder Besichtigung für eine Anfrage */
  grund: 'einsatz' | 'besichtigung';
  /** Tage seit Anlage */
  alterTage: number;
  /** höher = zuerst einplanen */
  dringlichkeit: number;
}

/**
 * Beauftragte Aufträge ohne künftigen Termin + Anfragen mit Besichtigungswunsch ohne Termin.
 * Sortiert nach Dringlichkeit: dringend vor Wunschtermin vor Alter.
 */
export function offenEinzuplanen(auftraege: Auftrag[], termine: Termin[], jetzt = new Date()): OffenerEintrag[] {
  const heute = isoDatum(jetzt);
  const eintraege: OffenerEintrag[] = [];
  for (const a of auftraege) {
    if (a.geloeschtAm) continue;
    let grund: OffenerEintrag['grund'] | undefined;
    if (a.phase === 'beauftragt') grund = 'einsatz';
    else if (a.phase === 'besichtigung') grund = 'besichtigung';
    else if (a.phase === 'anfrage' && (a.wunschtermin?.trim() || a.dringend)) grund = 'besichtigung';
    if (!grund) continue;
    if (kuenftigeTermine(termine, a.id, jetzt).length) continue;
    const alterTage = Math.max(0, tageZwischen(isoDatum(new Date(a.erstelltAm)), heute));
    const dringlichkeit = (a.dringend ? 1000 : 0) + (a.wunschtermin?.trim() ? 200 : 0) + (grund === 'einsatz' ? 50 : 0) + Math.min(alterTage, 90);
    eintraege.push({ auftrag: a, grund, alterTage, dringlichkeit });
  }
  return eintraege.sort((x, y) => y.dringlichkeit - x.dringlichkeit || x.auftrag.erstelltAm.localeCompare(y.auftrag.erstelltAm));
}

/** Gibt es ein Modul, das automatische Planvorschläge macht (Paket planpruefung)? */
export function vorschlagVerfuegbar(): boolean {
  return alleModule().some((m) => !!m.aktionen?.['plan.vorschlag']);
}
