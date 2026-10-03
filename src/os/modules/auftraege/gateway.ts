/** Aktionen der Auftragsakte für den Macher AI Gateway (`@core/gateway`). */
import { db } from '@core/db';
import type { AktionDef } from '@core/gateway';
import type { ID } from '@core/objects';
import { setzePhase } from './daten';
import { istVor, phaseLabel } from './logik';

export const AUFTRAG_AKTIONEN: AktionDef<{ auftragId: ID }>[] = [
  {
    // „Der Auftrag ist fertig“: Arbeiten erledigt → Abnahme. Erledigt wird der Auftrag erst mit der Zahlung.
    id: 'job.complete',
    titel: 'Arbeiten als fertig gemeldet',
    risiko: 'schreiben',
    rechte: ['schreiben'],
    pruefe: (d) => {
      const a = db.auftraege.get(d.auftragId);
      if (!a) return 'Den Auftrag gibt es nicht mehr.';
      if (!istVor(a.phase, 'abnahme')) return `Der Auftrag steht schon auf „${phaseLabel(a.phase)}“.`;
      return undefined;
    },
    fuehreAus: (d) => {
      setzePhase(d.auftragId, 'abnahme', { grund: 'Arbeiten fertig (über Lotte)' });
      return { bezug: { typ: 'auftraege', id: d.auftragId } };
    },
  },
];
