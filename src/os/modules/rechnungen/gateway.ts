/** Aktionen der Rechnungen für den Macher AI Gateway (`@core/gateway`). */
import { db } from '@core/db';
import { AktionsFehler, type AktionDef } from '@core/gateway';
import type { ID } from '@core/objects';
import { rechnungErstellen } from './logik';

export const RECHNUNG_AKTIONEN: AktionDef<{ auftragId: ID }>[] = [
  {
    id: 'invoice.create_draft',
    titel: 'Rechnungsentwurf vorbereitet',
    risiko: 'schreiben',
    rechte: ['schreiben', 'geld'],
    pruefe: (d) => {
      const a = db.auftraege.get(d.auftragId);
      if (!a) return 'Den Auftrag gibt es nicht mehr.';
      if (a.phase === 'verloren') return 'Der Auftrag ist nicht zustande gekommen.';
      return undefined;
    },
    // Nur ein Entwurf: versendet wird die Rechnung erst in der Rechnung selbst.
    fuehreAus: (d) => {
      const r = rechnungErstellen(d.auftragId, 'rechnung', { vonMacher: true });
      if (!r) throw new AktionsFehler('Der Rechnungsentwurf konnte nicht angelegt werden.');
      return { bezug: { typ: 'rechnungen', id: r.id } };
    },
  },
];
