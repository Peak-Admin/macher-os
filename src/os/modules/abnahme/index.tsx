import { defineModul } from '@core/modul';
import { db } from '@core/db';
import { on } from '@core/events';
import { benachrichtigen, erledigt } from '@core/macher';
import { heute, passt, plusTage } from '@core/format';
import { AbnahmeDetail } from './AbnahmeDetail';
import { AbnahmeListe, AbnahmeNeu, AbnahmeTab } from './AbnahmeListe';
import { AbnahmeDruck } from './AbnahmeDruck';
import { abnahmeHinweise, abnahmeStarten, abnahmen, type Abnahme } from './daten';
import { beispielUnterschriftBild, unterschriftSpeichern } from './unterschrift';

export default defineModul({
  id: 'abnahme',
  titel: 'Abnahme & Unterschrift',
  bereich: 'auftraege',
  beschreibung: 'Dokumentiert Fertigstellung, Mängel und die Unterschrift des Kunden.',
  icon: 'unterschrift',
  gewicht: 62,
  navigation: 'hub',
  routen: [
    { pfad: '', element: AbnahmeListe },
    { pfad: 'neu', element: AbnahmeNeu },
    { pfad: ':id', element: AbnahmeDetail },
  ],
  vollbildRouten: [{ pfad: '/druck/abnahme/:id', element: AbnahmeDruck }],
  tabs: [
    {
      objekt: 'auftraege',
      titel: 'Abnahme',
      component: AbnahmeTab,
      gewicht: 60,
      sichtbar: (id) => {
        const a = db.auftraege.get(id);
        return !!a && (['in_arbeit', 'abnahme', 'abrechnung', 'erledigt'].includes(a.phase) || abnahmen.all().some((x) => x.auftragId === id));
      },
    },
  ],
  erstellen: [{ label: 'Abnahme starten', pfad: '/auftraege/abnahme/neu', gewicht: 30 }],
  kurzinfo: () => {
    const n = db.auftraege.where((x) => x.phase === 'abnahme' && !abnahmen.all().some((a) => a.auftragId === x.id && a.status === 'unterschrieben')).length;
    return n ? { text: n === 1 ? '1 Auftrag wartet auf Abnahme' : `${n} Aufträge warten auf Abnahme`, ton: 'achtung' } : undefined;
  },
  hinweise: () => abnahmeHinweise(db.auftraege.all(), abnahmen.all(), db.aufgaben.all(), heute()),
  aktionen: {
    'abnahme.starten': (payload) => {
      const { auftragId } = (payload ?? {}) as { auftragId?: string };
      if (!auftragId || !db.auftraege.get(auftragId)) return '/auftraege/abnahme/neu';
      return `/auftraege/abnahme/${abnahmeStarten(auftragId).id}`;
    },
  },
  automationen: [
    {
      id: 'abnahme.abrechnung',
      titel: 'Nach der Abnahme zur Abrechnung',
      beschreibung: 'Ist die Abnahme unterschrieben, rückt der Auftrag in die Phase „Abrechnung“ und das Büro bekommt Bescheid.',
      standardAn: true,
      minuten: 3,
      start: () =>
        on('abnahme.unterschrieben', (e) => {
          const ab = e.objekt as Abnahme | undefined;
          const a = db.auftraege.get(ab?.auftragId);
          if (!ab || !a) return;
          if (['beauftragt', 'in_arbeit', 'abnahme'].includes(a.phase)) {
            db.auftraege.update(a.id, { phase: 'abrechnung' }, { text: 'Nach Abnahme in Abrechnung' });
            erledigt('abnahme.abrechnung', `${a.nummer} nach der Abnahme in „Abrechnung“ verschoben`, { bezug: { typ: 'auftraege', id: a.id } });
          }
          for (const m of db.mitarbeiter.where((x) => x.aktiv && x.rolle === 'buero'))
            benachrichtigen(`Abnahme unterschrieben: ${a.titel}`, { text: 'Die Schlussrechnung kann raus.', bezug: { typ: 'auftraege', id: a.id }, fuer: m.id });
        }),
    },
  ],
  suche: (q) =>
    abnahmen
      .where((x) => {
        const a = db.auftraege.get(x.auftragId);
        return passt(q, 'abnahme', a?.titel, a?.nummer, x.teilnehmer, x.ort);
      })
      .slice(0, 5)
      .map((x) => {
        const a = db.auftraege.get(x.auftragId);
        return { typ: 'Abnahme', titel: `Abnahme ${a?.titel ?? ''}`, untertitel: a?.nummer, pfad: `/auftraege/abnahme/${x.id}`, relevanz: 35 };
      }),
  seed: () => {
    const a6 = db.auftraege.all().find((a) => a.beispiel && a.titel === 'Kleinreparatur Treppenhaus');
    if (!a6) return;
    const datum = plusTage(heute(), -3);
    const sig = unterschriftSpeichern(a6.id, 'Unterschrift Abnahme – Beispiel', { bild: beispielUnterschriftBild(), name: 'Frau Neumann', ort: 'Kassel' }, true);
    abnahmen.create({ auftragId: a6.id, datum, ort: 'Kassel', teilnehmer: 'Frau Neumann, Hausverwaltung Nord', mangelAufgabeIds: [], fotoIds: [], status: 'unterschrieben', unterschriftKunde: { ...sig, zeitpunkt: new Date(datum + 'T15:00:00').toISOString() }, abgeschlossenAm: new Date(datum + 'T15:00:00').toISOString(), beispiel: true });
  },
});
