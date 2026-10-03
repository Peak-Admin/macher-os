/** Aktionen der Einsatzplanung für den Macher AI Gateway (`@core/gateway`). */
import { db } from '@core/db';
import type { AktionDef } from '@core/gateway';
import type { ID } from '@core/objects';

/** Künftige, noch nicht begonnene Einsätze eines Auftrags */
export function offeneEinsaetze(auftragId: ID, jetzt = new Date()) {
  const ab = jetzt.toISOString();
  return db.termine.where((t) => t.auftragId === auftragId && t.art !== 'besichtigung' && t.start > ab && (t.status === 'geplant' || t.status === 'bestaetigt'));
}

export const PLAN_AKTIONEN: AktionDef<{ auftragId: ID }>[] = [
  {
    // „Baustelle aus der Einsatzplanung nehmen“ – das Team wird für andere Aufträge frei.
    id: 'job.release_plan',
    titel: 'Einsätze aus dem Plan genommen',
    risiko: 'schreiben',
    rechte: ['planen'],
    pruefe: (d, k) => (offeneEinsaetze(d.auftragId, k.jetzt).length ? undefined : 'Für diesen Auftrag sind keine weiteren Einsätze geplant.'),
    fuehreAus: (d, k) => {
      const liste = offeneEinsaetze(d.auftragId, k.jetzt);
      for (const t of liste) db.termine.update(t.id, { status: 'abgesagt' }, { text: 'Abgesagt: Auftrag fertig (über Lotte)' });
      return { bezug: { typ: 'auftraege', id: d.auftragId }, text: liste.length === 1 ? '1 Einsatz abgesagt' : `${liste.length} Einsätze abgesagt` };
    },
  },
];
