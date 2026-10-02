import { defineModul } from '@core/modul';
import { db } from '@core/db';
import { on } from '@core/events';
import { erledigt } from '@core/macher';
import { datum, heute, passt, personName } from '@core/format';
import type { Nachweis } from '@core/objects';
import { istAktiv } from '@modules/mitarbeiter/team';
import { KATEGORIE_LABEL, aktuellerNachweis, nachweisStatus } from './daten';
import { gueltigkeitErgaenzen, qualiHinweise } from './logik';
import { MitarbeiterQualiTab, QualifikationDetail, QualifikationenSeite } from './Ansichten';

export default defineModul({
  id: 'qualifikationen',
  titel: 'Qualifikationen',
  bereich: 'betrieb',
  gruppe: 'team',
  beschreibung: 'Wer kann und darf was: Fachkraft, Führerschein, Zertifikate – mit Ablauf-Warnung.',
  icon: 'schild',
  gewicht: 65,
  routen: [
    { pfad: '', element: QualifikationenSeite },
    { pfad: ':id', element: QualifikationDetail },
  ],
  detail: [{ objekt: 'qualifikationen', pfad: (id) => `/betrieb/qualifikationen/${id}` }],
  kurzinfo: () => {
    const t = heute();
    const alle = db.nachweise.all();
    const warn = alle.filter((n) => {
      const m = db.mitarbeiter.get(n.mitarbeiterId);
      return m && istAktiv(m, t) && aktuellerNachweis(alle, n.mitarbeiterId, n.qualifikationId)?.id === n.id && ['laeuft_ab', 'abgelaufen'].includes(nachweisStatus(n, t));
    }).length;
    return warn ? { text: warn === 1 ? '1 Nachweis läuft ab' : `${warn} Nachweise laufen ab`, ton: 'achtung' } : { text: 'Alle Nachweise gültig', ton: 'erfolg' };
  },
  tabs: [{ objekt: 'mitarbeiter', titel: 'Qualifikationen', component: MitarbeiterQualiTab, gewicht: 60, zaehler: (id) => db.nachweise.where((n) => n.mitarbeiterId === id).length || undefined }],
  suche: (q) =>
    db.qualifikationen
      .where((x) => passt(q, x.name, KATEGORIE_LABEL[x.kategorie], x.beschreibung))
      .slice(0, 5)
      .map((x) => ({ typ: 'Qualifikation', titel: x.name, untertitel: KATEGORIE_LABEL[x.kategorie], pfad: `/betrieb/qualifikationen/${x.id}`, relevanz: 35 })),
  hinweise: () => qualiHinweise(),
  automationen: [
    {
      id: 'qualifikationen.gueltigkeit',
      titel: 'Gültigkeit automatisch berechnen',
      beschreibung: 'Trägst du einen Nachweis mit Erwerbsdatum ein, rechnet Macher das Ablaufdatum aus der Gültigkeit der Qualifikation aus.',
      standardAn: true,
      minuten: 1,
      start: () =>
        on('nachweise.created', (e) => {
          const n = e.objekt as Nachweis;
          if (gueltigkeitErgaenzen(n)) {
            const neu = db.nachweise.get(n.id);
            erledigt('qualifikationen.gueltigkeit', `Ablaufdatum für ${db.qualifikationen.get(n.qualifikationId)?.name ?? 'Nachweis'} berechnet`, {
              bezug: { typ: 'mitarbeiter', id: n.mitarbeiterId },
              text: `${personName(db.mitarbeiter.get(n.mitarbeiterId))}: gültig bis ${datum(neu?.gueltigBis)}`,
            });
          }
        }),
    },
  ],
});
