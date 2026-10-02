/** Aktionen der Arbeitszeiten für den Macher AI Gateway (`@core/gateway`). */
import { db } from '@core/db';
import { minutenAus, uhrAus } from '@core/format';
import type { AktionDef } from '@core/gateway';
import type { Datum, ID } from '@core/objects';

export interface ZeitErfassenDaten {
  mitarbeiterId: ID;
  auftragId?: ID;
  datum: Datum;
  minuten: number;
  /** „07:30“ – ohne Angabe ab Arbeitsbeginn des Betriebs */
  start?: string;
  notiz?: string;
}

export const ZEIT_AKTIONEN: AktionDef<ZeitErfassenDaten>[] = [
  {
    id: 'time.track',
    titel: 'Zeit erfasst',
    risiko: 'schreiben',
    rechte: ['schreiben'],
    pruefe: (d, k) => {
      if (!db.mitarbeiter.get(d.mitarbeiterId)) return 'Für wen soll die Zeit erfasst werden?';
      // Zeiten für andere erfassen nur mit Planungsrecht
      if (d.mitarbeiterId !== k.ich?.id && k.ich && !k.darf('planen')) return 'Du kannst nur deine eigenen Zeiten erfassen.';
      if (!(d.minuten > 0 && d.minuten <= 12 * 60)) return 'Gib eine Dauer zwischen einer Minute und zwölf Stunden an.';
      if (d.auftragId && !db.auftraege.get(d.auftragId)) return 'Den Auftrag gibt es nicht mehr.';
      return undefined;
    },
    fuehreAus: (d) => {
      const start = d.start ?? db.betrieb.get('betrieb')?.arbeitsbeginn ?? '07:00';
      const ende = uhrAus(Math.min(minutenAus(start) + d.minuten, 23 * 60 + 59));
      db.zeiten.create({
        mitarbeiterId: d.mitarbeiterId,
        auftragId: d.auftragId,
        datum: d.datum,
        start,
        ende,
        pauseMinuten: 0,
        art: d.auftragId ? 'arbeit' : 'werkstatt',
        notiz: d.notiz,
        freigegeben: false,
      });
      return d.auftragId ? { bezug: { typ: 'auftraege', id: d.auftragId } } : undefined;
    },
  },
];
