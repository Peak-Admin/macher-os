/** Aktionen des Kalenders für den Macher AI Gateway (`@core/gateway`). */
import { db, vermerken } from '@core/db';
import { datumKurz, uhrzeit } from '@core/format';
import type { AktionDef } from '@core/gateway';
import type { Datum, ID } from '@core/objects';
import { kontextAusDb, terminKonflikte } from '../verfuegbarkeit/daten';
import { verschoben } from './daten';

export interface VerschiebenDaten {
  terminId: ID;
  tag: Datum;
  /** „08:00“ – ohne Angabe bleibt die Uhrzeit */
  uhr?: string;
}

export const KALENDER_AKTIONEN: AktionDef<VerschiebenDaten>[] = [
  {
    // Ein Termin mit Kunde ist kritisch: Der Kunde rechnet mit dem alten Termin.
    id: 'appointment.reschedule',
    titel: 'Termin verschoben',
    risiko: 'kritisch',
    rechte: ['planen'],
    pruefe: (d, k) => {
      const t = db.termine.get(d.terminId);
      if (!t || t.status === 'abgesagt') return 'Den Termin gibt es nicht mehr.';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d.tag)) return 'Wähle ein Datum.';
      if (d.tag < k.heute) return 'Das Datum liegt in der Vergangenheit.';
      const neu = verschoben(t, d.tag, t.ganztags ? undefined : d.uhr);
      if (neu.start === t.start) return 'Der Termin liegt schon dort.';
      const konflikte = terminKonflikte({ ...t, ...neu }, kontextAusDb());
      if (konflikte.length) return `Am neuen Termin gibt es Konflikte: ${konflikte.map((x) => `${db.mitarbeiter.get(x.mitarbeiterId)?.vorname ?? 'jemand'} (${x.gruende.map((g) => g.text).join(', ')})`).join('; ')}.`;
      return undefined;
    },
    fuehreAus: (d) => {
      const t = db.termine.get(d.terminId)!;
      const neu = verschoben(t, d.tag, t.ganztags ? undefined : d.uhr);
      db.termine.update(t.id, neu, { text: `Verschoben auf ${datumKurz(neu.start)}, ${uhrzeit(neu.start)} Uhr (über Macher)` });
      if (t.auftragId) vermerken({ typ: 'auftraege', id: t.auftragId }, 'termin.verschoben', `Termin „${t.titel}“ verschoben auf ${datumKurz(neu.start)}`);
      return { bezug: { typ: 'termine', id: t.id }, text: `Neu: ${datumKurz(neu.start)}, ${uhrzeit(neu.start)} Uhr` };
    },
  },
];
