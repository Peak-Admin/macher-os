import { defineModul } from '@core/modul';
import { db } from '@core/db';
import { on } from '@core/events';
import { erledigt } from '@core/macher';
import { heute, passt, personName } from '@core/format';
import type { Abwesenheit, ID } from '@core/objects';
import { darfTeamDaten } from '@modules/mitarbeiter/team';
import { ART_LABEL, abwesenheitAm, zeitraumText } from './daten';
import { abwesenheitenHinweise, bescheidSenden, entscheiden, krankInfo } from './logik';
import { AbwesenheitDetail, AbwesenheitenSeite, JahrSeite, MitarbeiterAbwesenheitenTab } from './Ansichten';
import { AbwesenheitForm } from './AbwesenheitForm';
import { URLAUB_EINTRAGEN, URLAUB_ENTSCHEIDEN } from './gateway';

export default defineModul({
  id: 'abwesenheiten',
  titel: 'Urlaub & Krankheit',
  bereich: 'betrieb',
  gruppe: 'team',
  beschreibung: 'Urlaub beantragen und genehmigen, krank melden, Resturlaub und Jahresübersicht.',
  icon: 'kalender',
  gewicht: 75,
  routen: [
    { pfad: '', element: AbwesenheitenSeite },
    { pfad: 'jahr', element: JahrSeite },
    { pfad: ':id', element: AbwesenheitDetail },
  ],
  detail: [{ objekt: 'abwesenheiten', pfad: (id) => `/betrieb/abwesenheiten/${id}` }],
  erstellen: [
    { label: 'Urlaub beantragen', pfad: '/betrieb/abwesenheiten', gewicht: 25 },
    { label: 'Krank melden', pfad: '/betrieb/abwesenheiten?art=krank', gewicht: 24 },
  ],
  kurzinfo: () => {
    const t = heute();
    const offen = db.abwesenheiten.where((a) => a.status === 'beantragt' && a.bis >= t).length;
    if (offen) return { text: offen === 1 ? '1 Antrag offen' : `${offen} Anträge offen`, ton: 'achtung' };
    const weg = db.mitarbeiter.where((m) => m.aktiv && !!abwesenheitAm(m.id, t, db.abwesenheiten.all())).length;
    return weg ? { text: weg === 1 ? 'Heute 1 Person abwesend' : `Heute ${weg} Personen abwesend`, ton: 'aktiv' } : { text: 'Heute alle da', ton: 'erfolg' };
  },
  tabs: [{ objekt: 'mitarbeiter', titel: 'Abwesenheiten', component: MitarbeiterAbwesenheitenTab, gewicht: 70, sichtbar: (id) => darfTeamDaten(id) }],
  schnell: [
    {
      id: 'abwesenheit',
      label: 'Urlaub / krank melden',
      icon: 'kalender',
      gewicht: 30,
      component: ({ fertig }) => <AbwesenheitForm fertig={() => fertig()} />,
    },
  ],
  suche: (q) =>
    db.abwesenheiten
      .where((a) => darfTeamDaten(a.mitarbeiterId) && passt(q, ART_LABEL[a.art], personName(db.mitarbeiter.get(a.mitarbeiterId)), a.notiz))
      .slice(0, 5)
      .map((a) => ({
        typ: 'Abwesenheit',
        titel: `${ART_LABEL[a.art]} · ${personName(db.mitarbeiter.get(a.mitarbeiterId))}`,
        untertitel: zeitraumText(a),
        pfad: `/betrieb/abwesenheiten/${a.id}`,
        relevanz: 30,
      })),
  hinweise: () => abwesenheitenHinweise(),
  gateway: { aktionen: [...URLAUB_EINTRAGEN, ...URLAUB_ENTSCHEIDEN] },
  aktionen: {
    'abwesenheit.genehmigen': (p) => {
      entscheiden((p as { id: ID }).id, true);
    },
    'abwesenheit.ablehnen': (p) => {
      entscheiden((p as { id: ID }).id, false);
    },
  },
  automationen: [
    {
      id: 'abwesenheiten.krank-info',
      titel: 'Krankmeldung sofort weitergeben',
      beschreibung: 'Meldet sich jemand krank, bekommen Chef und Büro sofort Bescheid – mit den Terminen, die umgeplant werden müssen.',
      standardAn: true,
      minuten: 5,
      start: () =>
        on('abwesenheiten.created', (e) => {
          const a = e.objekt as Abwesenheit;
          if (a.art !== 'krank' || a.beispiel) return;
          const n = krankInfo(a);
          if (n) erledigt('abwesenheiten.krank-info', `Krankmeldung von ${personName(db.mitarbeiter.get(a.mitarbeiterId))} weitergegeben`, { bezug: { typ: 'abwesenheiten', id: a.id }, text: zeitraumText(a) });
        }),
    },
    {
      id: 'abwesenheiten.bescheid',
      titel: 'Bescheid an den Mitarbeiter',
      beschreibung: 'Wird ein Antrag genehmigt oder abgelehnt, bekommt der Mitarbeiter sofort eine Benachrichtigung aufs Handy.',
      standardAn: true,
      minuten: 2,
      start: () =>
        on('abwesenheiten.updated', (e) => {
          const a = e.objekt as Abwesenheit;
          const vorher = e.vorher as Abwesenheit | undefined;
          if (vorher?.status !== 'beantragt' || a.status === 'beantragt') return;
          bescheidSenden(a);
          erledigt('abwesenheiten.bescheid', `${personName(db.mitarbeiter.get(a.mitarbeiterId))} über ${a.status === 'genehmigt' ? 'Genehmigung' : 'Ablehnung'} informiert`, {
            bezug: { typ: 'abwesenheiten', id: a.id },
            text: `${ART_LABEL[a.art]} ${zeitraumText(a)}`,
          });
        }),
    },
  ],
});
