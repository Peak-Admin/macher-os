import { defineModul } from '@core/modul';
import { db } from '@core/db';
import { on } from '@core/events';
import { heute, passt, personName } from '@core/format';
import type { Auftrag } from '@core/objects';
import { checklisten, stand } from '../checklisten/daten';
import { AufgabenSeite } from './AufgabenSeite';
import { AufgabeDetail } from './AufgabeDetail';
import { AufgabenAmAuftrag } from './AufgabenAmAuftrag';
import { AufgabeFormular } from './AufgabeFormular';
import { abhaken, aufgabePfad, aufgabenZumAuftragSchliessen } from './daten';

export default defineModul({
  id: 'aufgaben',
  titel: 'Aufgaben',
  bereich: 'auftraege',
  beschreibung: 'Einzelne Arbeiten festhalten, verteilen und abhaken – am Auftrag oder für sich.',
  icon: 'check',
  gewicht: 78,
  routen: [
    { pfad: '', element: AufgabenSeite },
    { pfad: ':id', element: AufgabeDetail },
  ],
  detail: [{ objekt: 'aufgaben', pfad: aufgabePfad }],
  kurzinfo: () => {
    const t = heute();
    const ueber = db.aufgaben.where((a) => !a.erledigt && !!a.faellig && a.faellig < t).length;
    return ueber ? { text: `${ueber} überfällig`, ton: 'gefahr' } : undefined;
  },
  tabs: [
    {
      objekt: 'auftraege',
      titel: 'Aufgaben & Checklisten',
      component: AufgabenAmAuftrag,
      gewicht: 85,
      zaehler: (id) => db.aufgaben.where((a) => a.auftragId === id && !a.erledigt).length + checklisten.where((c) => c.auftragId === id && !stand(c).fertig).length,
    },
  ],
  schnell: [
    {
      id: 'aufgabe',
      label: 'Aufgabe',
      icon: 'check',
      gewicht: 60,
      component: ({ fertig, auftragId }) => <AufgabeFormular auftragId={auftragId} onFertig={fertig} />,
    },
  ],
  erstellen: [{ label: 'Aufgabe anlegen', pfad: '/auftraege/aufgaben?neu=1', gewicht: 70 }],
  suche: (q) =>
    db.aufgaben
      .where((a) => passt(q, a.titel, a.notiz))
      .sort((x, y) => Number(x.erledigt) - Number(y.erledigt))
      .slice(0, 6)
      .map((a) => ({
        typ: 'Aufgabe',
        titel: a.titel,
        untertitel: [a.erledigt ? 'Erledigt' : 'Offen', db.auftraege.get(a.auftragId)?.nummer, personName(db.mitarbeiter.get(a.zustaendigId))].filter((x) => x && x !== '–').join(' · '),
        pfad: aufgabePfad(a.id),
        relevanz: a.erledigt ? 30 : 55,
      })),
  hinweise: () => {
    const t = heute();
    return db.aufgaben
      .where((a) => !a.erledigt && !!a.faellig && a.faellig < t)
      .map((a) => ({
        schluessel: `aufgabe-ueberfaellig:${a.id}`,
        art: 'problem' as const,
        titel: `Überfällig: ${a.titel}`,
        text: [db.auftraege.get(a.auftragId)?.titel, a.zustaendigId ? `bei ${personName(db.mitarbeiter.get(a.zustaendigId))}` : 'niemand zuständig'].filter(Boolean).join(' · '),
        bezug: { typ: 'aufgaben' as const, id: a.id },
        gewicht: a.prioritaet === 'hoch' ? 55 : 36,
        fuerMitarbeiterId: a.zustaendigId,
        faellig: a.faellig,
        aktionen: [{ aktion: 'aufgabe.erledigen', label: 'Erledigt', primaer: true, payload: { aufgabeId: a.id } }],
        pfad: aufgabePfad(a.id),
      }));
  },
  aktionen: {
    'aufgabe.erledigen': (p) => {
      const id = (p as { aufgabeId?: string })?.aufgabeId;
      if (id) abhaken(id, true);
    },
    /** Für andere Pakete: Aufgabe am Auftrag anlegen. Payload `{ titel, auftragId?, zustaendigId?, faellig? }` */
    'aufgabe.anlegen': (p) => {
      const x = (p ?? {}) as { titel?: string; auftragId?: string; zustaendigId?: string; faellig?: string };
      if (!x.titel) return '/auftraege/aufgaben?neu=1';
      const a = db.aufgaben.create({ titel: x.titel, auftragId: x.auftragId, zustaendigId: x.zustaendigId, faellig: x.faellig, erledigt: false, prioritaet: 'normal', quelle: 'macher' });
      return aufgabePfad(a.id);
    },
  },
  automationen: [
    {
      id: 'aufgaben.auftrag-abgeschlossen',
      titel: 'Automatische Aufgaben mit dem Auftrag schließen',
      beschreibung: 'Ist ein Auftrag erledigt oder verloren, schließt Macher die Aufgaben, die er selbst angelegt hat. Deine eigenen bleiben stehen.',
      standardAn: true,
      minuten: 1,
      start: () =>
        on('auftraege.updated', (e) => {
          const a = e.objekt as Auftrag;
          if ((a.phase === 'erledigt' || a.phase === 'verloren') && (e.vorher as Auftrag | undefined)?.phase !== a.phase) aufgabenZumAuftragSchliessen(a.id);
        }),
    },
  ],
});
