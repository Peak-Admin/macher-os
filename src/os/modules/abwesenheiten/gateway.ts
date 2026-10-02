/** Aktionen der Abwesenheiten für den Macher AI Gateway (`@core/gateway`). */
import { db } from '@core/db';
import type { AktionDef } from '@core/gateway';
import type { Datum, ID } from '@core/objects';
import { ueberschneidung } from './daten';
import { bescheidSenden, eintragen, entscheiden } from './logik';

export interface UrlaubDaten {
  mitarbeiterId: ID;
  von: Datum;
  bis: Datum;
  notiz?: string;
}

const datumOk = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d);

export const URLAUB_EINTRAGEN: AktionDef<UrlaubDaten>[] = [
  {
    // Eigener Urlaub wird beantragt; mit Personalrecht (Chef) direkt genehmigt eingetragen.
    id: 'vacation.create',
    titel: 'Urlaub eingetragen',
    risiko: 'schreiben',
    rechte: ['schreiben'],
    pruefe: (d, k) => {
      if (!db.mitarbeiter.get(d.mitarbeiterId)) return 'Für wen ist der Urlaub?';
      if (d.mitarbeiterId !== k.ich?.id && k.ich && !k.darf('personal')) return 'Du kannst nur deinen eigenen Urlaub beantragen.';
      if (!datumOk(d.von) || !datumOk(d.bis)) return 'Gib an, von wann bis wann.';
      if (d.bis < d.von) return 'Das Ende liegt vor dem Anfang.';
      const x = ueberschneidung(d.mitarbeiterId, d.von, d.bis, db.abwesenheiten.all());
      if (x) return 'In diesem Zeitraum ist schon eine Abwesenheit eingetragen.';
      return undefined;
    },
    fuehreAus: (d, k) => {
      const a = eintragen({ mitarbeiterId: d.mitarbeiterId, art: 'urlaub', von: d.von, bis: d.bis, notiz: d.notiz }, { direktGenehmigt: k.darf('personal') });
      return { bezug: { typ: 'abwesenheiten', id: a.id }, text: a.status === 'genehmigt' ? 'Eingetragen und genehmigt' : 'Beantragt – der Chef entscheidet' };
    },
  },
];

export const URLAUB_ENTSCHEIDEN: AktionDef<{ abwesenheitId: ID }>[] = [
  {
    id: 'vacation.approve',
    titel: 'Urlaub genehmigt',
    risiko: 'kritisch',
    rechte: ['personal'],
    pruefe: (d) => {
      const a = db.abwesenheiten.get(d.abwesenheitId);
      if (!a) return 'Den Antrag gibt es nicht mehr.';
      if (a.status !== 'beantragt') return 'Über diesen Antrag ist schon entschieden.';
      return undefined;
    },
    fuehreAus: (d) => {
      const a = entscheiden(d.abwesenheitId, true);
      if (a) bescheidSenden(a);
      return { bezug: { typ: 'abwesenheiten', id: d.abwesenheitId } };
    },
  },
];
