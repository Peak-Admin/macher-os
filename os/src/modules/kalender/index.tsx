import { defineModul } from '@core/modul';
import { db } from '@core/db';
import { on } from '@core/events';
import { erledigt } from '@core/macher';
import { datumKurz, heute, passt, plusTage, uhrzeit } from '@core/format';
import type { Auftrag, Termin } from '@core/objects';
import { Kalender, terminPfad } from './Kalender';
import { TerminDetail } from './TerminDetail';
import { AuftragTermine } from './AuftragTermine';
import { kuenftigeTermine } from './daten';

/** Künftige, noch offene Termine eines Auftrags absagen (Auftrag verloren) */
export function termineAbsagenFuer(auftragId: string, jetzt = new Date()): Termin[] {
  const betroffen = kuenftigeTermine(db.termine.all(), auftragId, jetzt).filter((t) => t.start > jetzt.toISOString() && (t.status === 'geplant' || t.status === 'bestaetigt'));
  betroffen.forEach((t) => db.termine.update(t.id, { status: 'abgesagt' }, { text: 'Automatisch abgesagt: Auftrag nicht zustande gekommen' }));
  return betroffen;
}

export default defineModul({
  id: 'kalender',
  titel: 'Kalender',
  bereich: 'plan',
  beschreibung: 'Alle Termine, Einsätze, Besichtigungen und internen Termine – am Rechner und am Handy.',
  icon: 'kalender',
  gewicht: 88,
  routen: [
    { pfad: '', element: Kalender },
    { pfad: 'termin/:id', element: TerminDetail },
  ],
  detail: [{ objekt: 'termine', pfad: terminPfad }],
  tabs: [
    {
      objekt: 'auftraege',
      titel: 'Termine',
      component: AuftragTermine,
      gewicht: 78,
      zaehler: (id) => kuenftigeTermine(db.termine.all(), id).length || undefined,
      sichtbar: (id) => db.auftraege.get(id)?.phase !== 'verloren' || db.termine.where((t) => t.auftragId === id).length > 0,
    },
  ],
  erstellen: [{ label: 'Termin anlegen', pfad: '/plan/kalender?neu=1', gewicht: 70 }],
  suche: (q) =>
    db.termine
      .where((t) => t.status !== 'abgesagt' && passt(q, t.titel, db.kunden.get(t.kundeId)?.name, db.orte.get(t.ortId)?.adresse.ort))
      .sort((a, b) => b.start.localeCompare(a.start))
      .slice(0, 6)
      .map((t) => ({
        typ: 'Termin',
        titel: t.titel,
        untertitel: `${datumKurz(t.start)}, ${uhrzeit(t.start)} · ${db.kunden.get(t.kundeId)?.name ?? ''}`,
        pfad: terminPfad(t.id),
        relevanz: t.start >= new Date().toISOString() ? 55 : 35,
      })),
  hinweise: () => {
    const bis = plusTage(heute(), 2);
    return db.termine
      .where((t) => (t.status === 'geplant' || t.status === 'bestaetigt') && !t.mitarbeiterIds.length && t.start >= new Date().toISOString() && t.start.slice(0, 10) <= bis)
      .map((t) => ({
        schluessel: `termin-ohne-mitarbeiter:${t.id}`,
        art: 'problem' as const,
        titel: `Niemand eingeplant: ${t.titel}`,
        text: `${datumKurz(t.start)}, ${t.ganztags ? 'ganztägig' : uhrzeit(t.start) + ' Uhr'} – wer fährt hin?`,
        bezug: { typ: 'termine' as const, id: t.id },
        gewicht: 74,
        faellig: t.start.slice(0, 10),
        pfad: terminPfad(t.id),
      }));
  },
  aktionen: {
    'termin.bestaetigen': (payload) => {
      const { terminId } = (payload ?? {}) as { terminId?: string };
      if (terminId) db.termine.update(terminId, { status: 'bestaetigt' }, { text: 'Bestätigt' });
      return terminId ? terminPfad(terminId) : undefined;
    },
    'plan.termine-wiederherstellen': (payload) => {
      const { ids = [] } = (payload ?? {}) as { ids?: string[] };
      ids.forEach((id) => db.termine.update(id, { status: 'geplant' }, { text: 'Wiederhergestellt' }));
    },
  },
  automationen: [
    {
      id: 'kalender.verloren-absagen',
      titel: 'Termine absagen, wenn ein Auftrag platzt',
      beschreibung: 'Wird ein Auftrag auf „Nicht zustande gekommen“ gesetzt, sagt Macher seine künftigen Termine ab und gibt die Leute wieder frei.',
      standardAn: true,
      minuten: 5,
      start: () =>
        on('auftraege.updated', (e) => {
          const a = e.objekt as Auftrag;
          const vorher = e.vorher as Auftrag | undefined;
          if (a.phase !== 'verloren' || vorher?.phase === 'verloren') return;
          const abgesagt = termineAbsagenFuer(a.id);
          if (!abgesagt.length) return;
          erledigt('kalender.verloren-absagen', `${abgesagt.length === 1 ? '1 Termin' : `${abgesagt.length} Termine`} abgesagt: ${a.titel}`, {
            text: 'Der Auftrag ist nicht zustande gekommen. Die Mitarbeiter sind wieder frei.',
            bezug: { typ: 'auftraege', id: a.id },
            rueckgaengig: { aktion: 'plan.termine-wiederherstellen', payload: { ids: abgesagt.map((t) => t.id) } },
          });
        }),
    },
  ],
});
