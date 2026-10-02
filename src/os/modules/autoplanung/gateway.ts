/** Aktionen der Autoplanung für den Macher AI Gateway (`@core/gateway`). */
import { db } from '@core/db';
import { AktionsFehler, type AktionDef } from '@core/gateway';
import { vorschlagUebernehmen, type Vorschlag } from './daten';

export interface EinplanenDaten {
  /** fertiger Vorschlag (ein Mitarbeiter, ein Block) – so wie ihn auch die Autoplanung übernimmt */
  vorschlag: Vorschlag;
}

export const EINPLANEN_AKTIONEN: AktionDef<EinplanenDaten>[] = [
  {
    // „Plane Jonas morgen bei Schneider ein“ – legt den Einsatz an; prüft vorher, ob die Zeit noch frei ist
    id: 'employee.schedule',
    titel: 'Mitarbeiter eingeplant',
    risiko: 'schreiben',
    rechte: ['planen'],
    pruefe: (d) => {
      const a = db.auftraege.get(d.vorschlag?.auftragId);
      if (!a || a.geloeschtAm) return 'Den Auftrag gibt es nicht mehr.';
      if (!d.vorschlag.mitarbeiterIds.length || !d.vorschlag.bloecke.length) return 'Wen und wann? Es fehlt der Mitarbeiter oder die Zeit.';
      return undefined;
    },
    fuehreAus: (d) => {
      const r = vorschlagUebernehmen(d.vorschlag);
      if (!r.ok) throw new AktionsFehler(r.grund);
      return { bezug: { typ: 'termine', id: r.termine[0].id } };
    },
  },
];
