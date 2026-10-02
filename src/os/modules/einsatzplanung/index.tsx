import { defineModul, type HinweisVorschlag } from '@core/modul';
import { db } from '@core/db';
import { on } from '@core/events';
import { benachrichtigen, erledigt } from '@core/macher';
import { datum, datumKurz, heute, isoDatum, personName, plusTage, uhrzeit } from '@core/format';
import type { Abwesenheit } from '@core/objects';
import { kontextAusDb, terminKonflikte, ABWESENHEIT_LABEL } from '../verfuegbarkeit/daten';
import { termineIm } from '../kalender/daten';
import { Plantafel } from './Plantafel';
import { PLAN_AKTIONEN } from './gateway';

const terminPfad = (id: string) => `/plan/kalender/termin/${id}`;
export const einplanenPfad = (auftragId?: string) => (auftragId ? `/plan/einsatzplanung?auftrag=${encodeURIComponent(auftragId)}` : '/plan/einsatzplanung');

export default defineModul({
  id: 'einsatzplanung',
  titel: 'Einsatzplanung',
  bereich: 'plan',
  beschreibung: 'Plantafel: Mitarbeiter und Teams auf Aufträge und Baustellen verteilen.',
  icon: 'team',
  gewicht: 86,
  routen: [{ pfad: '', element: Plantafel }],
  gateway: { aktionen: [...PLAN_AKTIONEN] },
  aktionen: {
    'plan.einplanen': (payload) => einplanenPfad((payload as { auftragId?: string } | undefined)?.auftragId),
  },
  hinweise: () => {
    const k = kontextAusDb();
    const jetzt = new Date().toISOString();
    const liste: HinweisVorschlag[] = [];
    for (const t of termineIm(k.termine, heute(), plusTage(heute(), 14))) {
      if (t.ende < jetzt || (t.status !== 'geplant' && t.status !== 'bestaetigt')) continue;
      for (const x of terminKonflikte(t, k)) {
        const blockiert = x.gruende.filter((g) => g.blockiert);
        if (!blockiert.length) continue;
        const m = k.mitarbeiter.find((y) => y.id === x.mitarbeiterId);
        const hart = blockiert.some((g) => g.art === 'abwesend' || g.art === 'termin' || g.art === 'inaktiv');
        liste.push({
          schluessel: `plan-konflikt:${t.id}:${x.mitarbeiterId}`,
          art: 'problem',
          titel: `Konflikt: ${personName(m)} – ${blockiert.map((g) => g.text).join(', ')}`,
          text: `${t.titel} · ${datumKurz(t.start)}, ${t.ganztags ? 'ganztägig' : uhrzeit(t.start) + ' Uhr'}`,
          bezug: { typ: 'termine', id: t.id },
          gewicht: hart ? 82 : 48,
          fuerRollen: ['chef', 'buero'],
          faellig: isoDatum(new Date(t.start)),
          pfad: terminPfad(t.id),
        });
      }
    }
    return liste;
  },
  automationen: [
    {
      id: 'einsatzplanung.abwesenheit-pruefen',
      titel: 'Termine prüfen, wenn jemand ausfällt',
      beschreibung: 'Wird Urlaub genehmigt oder jemand krank gemeldet, prüft Macher dessen Termine und sagt dir, was umgeplant werden muss.',
      standardAn: true,
      minuten: 10,
      start: () => {
        const pruefen = (e: { objekt?: unknown; vorher?: unknown }) => {
          const a = e.objekt as Abwesenheit;
          const vorher = e.vorher as Abwesenheit | undefined;
          if (a.status !== 'genehmigt' || (vorher?.status === 'genehmigt' && vorher.von === a.von && vorher.bis === a.bis)) return;
          const betroffen = termineIm(db.termine.all(), a.von < heute() ? heute() : a.von, a.bis, { mitarbeiterId: a.mitarbeiterId }).filter(
            (t) => t.status === 'geplant' || t.status === 'bestaetigt',
          );
          if (!betroffen.length) return;
          const m = db.mitarbeiter.get(a.mitarbeiterId);
          const titel = `${personName(m)}: ${ABWESENHEIT_LABEL[a.art]} – ${betroffen.length === 1 ? '1 Termin' : `${betroffen.length} Termine`} umplanen`;
          benachrichtigen(titel, { text: `${datum(a.von)} bis ${datum(a.bis)}. Die Termine stehen unter „Braucht dich“.`, bezug: { typ: 'termine', id: betroffen[0].id }, art: 'termine.umplanen', grund: 'Du planst die Einsätze.' });
          erledigt('einsatzplanung.abwesenheit-pruefen', `Betroffene Termine gefunden: ${personName(m)}`, {
            text: betroffen.map((t) => `${t.titel} (${datumKurz(t.start)})`).join(', '),
            bezug: { typ: 'abwesenheiten', id: a.id },
          });
        };
        const aus1 = on('abwesenheiten.created', pruefen);
        const aus2 = on('abwesenheiten.updated', pruefen);
        return () => {
          aus1();
          aus2();
        };
      },
    },
  ],
});
