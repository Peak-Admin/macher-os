/** Einsatzplanung: reine Logik für die Plantafel (Vorbelegung, Verschieben per Drag & Drop, Reststunden). */
import { isoDatum } from '@core/format';
import type { Auftrag, Datum, ID, Termin } from '@core/objects';
import { freieSlots, minutenAus, uhrAus, type PlanKontext } from '../verfuegbarkeit/daten';
import { verschoben } from '../kalender/daten';

const dauerH = (t: Pick<Termin, 'start' | 'ende'>) => (new Date(t.ende).getTime() - new Date(t.start).getTime()) / 3_600_000;

/** Bereits verplante Personenstunden eines Auftrags (Termine ohne abgesagte) */
export function verplanteStunden(auftragId: ID, termine: Termin[]): number {
  return termine
    .filter((t) => t.auftragId === auftragId && t.status !== 'abgesagt' && !t.geloeschtAm && !t.ganztags)
    .reduce((s, t) => s + dauerH(t) * Math.max(1, t.mitarbeiterIds.length), 0);
}

/** Noch einzuplanende Stunden (undefined, wenn nichts geschätzt ist) */
export function restStunden(a: Pick<Auftrag, 'id' | 'geplanteStunden'>, termine: Termin[]): number | undefined {
  if (!a.geplanteStunden) return undefined;
  return Math.max(0, Math.round((a.geplanteStunden - verplanteStunden(a.id, termine)) * 100) / 100);
}

/**
 * Vorbelegung, wenn man einen Auftrag in eine Zelle (Mitarbeiter × Tag) setzt:
 * erste freie Zeit an dem Tag, so lang wie die Reststunden (höchstens bis Feierabend).
 */
export function vorbelegung(
  a: Pick<Auftrag, 'id' | 'geplanteStunden'> | undefined,
  mitarbeiterId: ID,
  tag: Datum,
  k: PlanKontext,
): { von: string; bis: string; frei: boolean } {
  const beginn = minutenAus(k.arbeitsbeginn);
  const schluss = minutenAus(k.arbeitsende);
  const rest = a ? restStunden(a, k.termine) : undefined;
  const wunsch = Math.round(((rest && rest > 0 ? rest : a?.geplanteStunden) ?? 2) * 60);
  // längstes Stück, das an diesem Tag noch passt – erst die volle Dauer, dann kürzer
  for (let dauer = Math.min(wunsch, schluss - beginn); dauer >= 30; dauer -= 30) {
    const slot = freieSlots({ von: tag, bis: tag, dauerMinuten: dauer, mitarbeiterIds: [mitarbeiterId], kontext: k, ab: new Date(0), max: 1 })[0];
    if (slot) {
      const d = new Date(slot.start);
      const e = new Date(slot.ende);
      return { von: uhrAus(d.getHours() * 60 + d.getMinutes()), bis: uhrAus(e.getHours() * 60 + e.getMinutes()), frei: true };
    }
  }
  return { von: k.arbeitsbeginn, bis: uhrAus(Math.min(beginn + Math.max(60, Math.min(wunsch, schluss - beginn)), schluss)), frei: false };
}

/** Termin per Drag & Drop in eine andere Zelle ziehen: Tag wechselt, Uhrzeit bleibt, Mitarbeiter wird getauscht */
export function aufZelleVerschieben(t: Pick<Termin, 'start' | 'ende' | 'mitarbeiterIds'>, vonMitarbeiterId: ID, zuMitarbeiterId: ID, zuTag: Datum): { start: string; ende: string; mitarbeiterIds: ID[] } {
  const zeit = isoDatum(new Date(t.start)) === zuTag ? { start: t.start, ende: t.ende } : verschoben(t, zuTag);
  let ids = t.mitarbeiterIds;
  if (vonMitarbeiterId !== zuMitarbeiterId) {
    ids = ids.filter((x) => x !== vonMitarbeiterId);
    if (!ids.includes(zuMitarbeiterId)) ids = [...ids, zuMitarbeiterId];
  }
  return { ...zeit, mitarbeiterIds: ids };
}
