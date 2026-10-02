import { defineModul } from '@core/modul';
import { db } from '@core/db';
import { on } from '@core/events';
import { erledigt } from '@core/macher';
import { heute, personName } from '@core/format';
import type { ID, Termin } from '@core/objects';
import { ich } from '@core/session';
import { darfTeamDaten } from '@modules/mitarbeiter/team';
import { ART_LABEL, laufende, starten, stoppen } from './daten';
import { einsatzBeenden, einsatzStarten, vergesseneBeenden, zeitenFreigeben, zeitenHinweise } from './einsatz';
import { MitarbeiterZeitenTab, StempeluhrSeite, StundenkontoSeite } from './Ansichten';
import { ZeitenWoche } from './ZeitenWoche';
import { Stempeluhr } from './Stempeluhr';

export default defineModul({
  id: 'arbeitszeiten',
  titel: 'Arbeitszeiten',
  bereich: 'betrieb',
  gruppe: 'team',
  beschreibung: 'Stempeluhr mit einem Tap, Wochenübersicht, Stundenkonto und Export für den Lohn.',
  icon: 'uhr',
  gewicht: 85,
  routen: [
    { pfad: '', element: StempeluhrSeite },
    { pfad: 'woche', element: ZeitenWoche },
    { pfad: 'konto', element: StundenkontoSeite },
  ],
  kurzinfo: () => {
    const laeuft = db.zeiten.where((z) => !z.ende && z.datum === heute()).length;
    const offen = db.zeiten.where((z) => !!z.ende && !z.freigegeben && z.datum < heute()).length;
    if (offen) return { text: `${offen} Zeiten zur Freigabe`, ton: 'achtung' };
    if (laeuft) return { text: laeuft === 1 ? '1 Person stempelt gerade' : `${laeuft} Personen stempeln gerade`, ton: 'aktiv' };
    return undefined;
  },
  tabs: [
    {
      objekt: 'mitarbeiter',
      titel: 'Zeiten',
      component: MitarbeiterZeitenTab,
      gewicht: 80,
      sichtbar: (id) => darfTeamDaten(id),
    },
  ],
  schnell: [
    {
      id: 'zeit',
      label: 'Zeit starten/stoppen',
      icon: 'uhr',
      gewicht: 90,
      component: ({ fertig, auftragId }) => <Stempeluhr fertig={fertig} auftragId={auftragId} />,
    },
  ],
  hinweise: () => zeitenHinweise(),
  aktionen: {
    'einsatz.starten': (p) => {
      einsatzStarten(p);
    },
    'einsatz.beenden': (p) => {
      einsatzBeenden(p);
    },
    'zeiten.beenden': (p) => {
      const { zeitId, ende } = p as { zeitId: ID; ende: string };
      const z = db.zeiten.get(zeitId);
      if (z && !z.ende) stoppen(z, ende, `Beendet um ${ende} (über Braucht dich)`);
    },
    'zeiten.nachtragen': (p) => {
      const { datum } = p as { datum: string };
      return `/betrieb/arbeitszeiten/woche?nachtrag=${datum}`;
    },
    'zeiten.freigeben': (p) => {
      const { bis } = p as { bis: string };
      zeitenFreigeben(bis);
      return `/betrieb/arbeitszeiten/woche?datum=${bis}`;
    },
  },
  automationen: [
    {
      id: 'arbeitszeiten.termin-status',
      titel: 'Stempeln über den Terminstatus',
      beschreibung: 'Tippst du am Termin auf „Unterwegs“, läuft deine Fahrtzeit. Bei „Vor Ort“ wechselt sie auf Arbeit, bei „Erledigt“ stoppt sie.',
      standardAn: true,
      minuten: 1,
      start: () =>
        on('termine.updated', (e) => {
          const t = e.objekt as Termin;
          const vorher = e.vorher as Termin | undefined;
          const m = ich();
          if (!t || !m || vorher?.status === t.status || !t.mitarbeiterIds.includes(m.id)) return;
          const lauf = laufende(m.id).find((z) => z.terminId === t.id);
          if (t.status === 'unterwegs' && !lauf) {
            starten(m.id, { art: 'fahrt', terminId: t.id, auftragId: t.auftragId });
            erledigt('arbeitszeiten.termin-status', `Fahrtzeit für ${personName(m)} gestartet`, { bezug: { typ: 'termine', id: t.id }, text: t.titel });
          } else if (t.status === 'vor_ort' && (!lauf || lauf.art === 'fahrt')) {
            starten(m.id, { art: 'arbeit', terminId: t.id, auftragId: t.auftragId });
            erledigt('arbeitszeiten.termin-status', `Arbeitszeit für ${personName(m)} gestartet`, { bezug: { typ: 'termine', id: t.id }, text: t.titel });
          } else if (t.status === 'erledigt' && lauf) {
            stoppen(lauf);
            erledigt('arbeitszeiten.termin-status', `${ART_LABEL[lauf.art]} von ${personName(m)} gestoppt`, { bezug: { typ: 'termine', id: t.id }, text: t.titel });
          }
        }),
    },
    {
      id: 'arbeitszeiten.vergessen',
      titel: 'Vergessenes Stoppen zum Terminende',
      beschreibung: 'Läuft eine Zeit auf einem Termin über Nacht weiter, beendet Macher sie zum geplanten Terminende und markiert sie zur Prüfung.',
      standardAn: true,
      minuten: 3,
      start: () => () => {},
      pruefen: () => {
        vergesseneBeenden();
      },
    },
  ],
});
