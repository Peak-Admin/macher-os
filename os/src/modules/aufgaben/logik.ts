/** Reine Regeln für Aufgaben: Gruppierung nach Fälligkeit, Sortierung. */
import type { Aufgabe, Datum } from '@core/objects';

export type Gruppe = 'ueberfaellig' | 'heute' | 'demnaechst' | 'spaeter' | 'ohne' | 'erledigt';

export const GRUPPEN_LABEL: Record<Gruppe, string> = {
  ueberfaellig: 'Überfällig',
  heute: 'Heute',
  demnaechst: 'Nächste 7 Tage',
  spaeter: 'Später',
  ohne: 'Ohne Fälligkeit',
  erledigt: 'Erledigt',
};

const plus7 = (d: Datum) => {
  const x = new Date(d + 'T12:00:00');
  x.setDate(x.getDate() + 7);
  return x.toISOString().slice(0, 10);
};

export function gruppeVon(a: Pick<Aufgabe, 'erledigt' | 'faellig'>, heute: Datum): Gruppe {
  if (a.erledigt) return 'erledigt';
  if (!a.faellig) return 'ohne';
  if (a.faellig < heute) return 'ueberfaellig';
  if (a.faellig === heute) return 'heute';
  if (a.faellig <= plus7(heute)) return 'demnaechst';
  return 'spaeter';
}

/** Wichtiges zuerst: hohe Priorität, dann Fälligkeit, dann Reihenfolge/Anlage */
export function sortiere(liste: Aufgabe[]): Aufgabe[] {
  return [...liste].sort(
    (a, b) =>
      Number(a.erledigt) - Number(b.erledigt) ||
      Number(b.prioritaet === 'hoch') - Number(a.prioritaet === 'hoch') ||
      (a.faellig ?? '9999').localeCompare(b.faellig ?? '9999') ||
      (a.reihenfolge ?? 0) - (b.reihenfolge ?? 0) ||
      a.erstelltAm.localeCompare(b.erstelltAm),
  );
}

export function gruppiere(liste: Aufgabe[], heute: Datum): { gruppe: Gruppe; aufgaben: Aufgabe[] }[] {
  const reihen: Gruppe[] = ['ueberfaellig', 'heute', 'demnaechst', 'spaeter', 'ohne', 'erledigt'];
  return reihen
    .map((g) => ({ gruppe: g, aufgaben: sortiere(liste.filter((a) => gruppeVon(a, heute) === g)) }))
    .filter((g) => g.aufgaben.length);
}
