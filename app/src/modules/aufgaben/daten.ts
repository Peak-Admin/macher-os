import { db } from '@core/db';
import { erledigt } from '@core/macher';
import type { Aufgabe, ID } from '@core/objects';

export const aufgabePfad = (id: ID) => `/auftraege/aufgaben/${id}`;

export function abhaken(id: ID, wert: boolean) {
  return db.aufgaben.update(id, { erledigt: wert, erledigtAm: wert ? new Date().toISOString() : undefined }, { text: wert ? 'Erledigt' : 'Wieder geöffnet' });
}

/** Automatisch angelegte Aufgaben schließen, wenn der Auftrag abgeschlossen ist */
export function aufgabenZumAuftragSchliessen(auftragId: ID): Aufgabe[] {
  const a = db.auftraege.get(auftragId);
  if (!a || (a.phase !== 'erledigt' && a.phase !== 'verloren')) return [];
  const offen = db.aufgaben.where((x) => x.auftragId === auftragId && !x.erledigt && x.quelle !== 'manuell' && !!x.quelle);
  offen.forEach((x) => abhaken(x.id, true));
  if (offen.length)
    erledigt('aufgaben.auftrag-abgeschlossen', `${a.nummer}: ${offen.length === 1 ? '1 automatische Aufgabe' : `${offen.length} automatische Aufgaben`} geschlossen`, {
      bezug: { typ: 'auftraege', id: a.id },
    });
  return offen;
}
