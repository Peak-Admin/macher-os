import { defineModul } from '@core/modul';
import { db } from '@core/db';
import { darf } from '@core/session';
import { datumVon, plusTage } from '@core/format';
import type { ID } from '@core/objects';
import { basisAusDb, stundenText } from '../kosten/basis';
import { lerneffekte, lerneffektSatz, ueberPlan } from './daten';
import { kalkulationFuer } from './kalkulation';
import { AUTOMATION_ERLEDIGT, minutenAnpassen, starteNachkalkulationsAutomation } from './aktionen';
import { NachkalkulationDetail, NachkalkulationListe } from './NachkalkulationSeiten';

export default defineModul({
  id: 'nachkalkulation',
  titel: 'Nachkalkulation',
  bereich: 'betrieb',
  gruppe: 'geld',
  beschreibung: 'Vergleicht geplante mit tatsächlichen Stunden, Material- und Gesamtkosten.',
  icon: 'diagramm',
  gewicht: 56,
  routen: [
    { pfad: '', element: NachkalkulationListe },
    { pfad: ':id', element: NachkalkulationDetail },
  ],
  kurzinfo: () => {
    if (!darf('geld')) return undefined;
    const n = ueberPlan(basisAusDb(), kalkulationFuer).length;
    return n ? { text: n === 1 ? '1 laufender Auftrag über Plan' : `${n} laufende Aufträge über Plan`, ton: 'achtung' } : undefined;
  },
  hinweise: () => {
    const b = basisAusDb();
    const lernen = lerneffekte(b).map((l) => ({
      schluessel: `nachkalkulation-lernen:${l.leistungId}:${l.minutenNeu}`,
      art: 'entscheidung' as const,
      titel: lerneffektSatz(l),
      text: `Aus ${l.auftraege} abgeschlossenen Aufträgen: kalkuliert ${l.minutenAlt} min je Einheit, tatsächlich etwa ${l.minutenNeu} min. Passt du die Zeit an, stimmen deine nächsten Angebote besser.`,
      bezug: { typ: 'leistungen' as const, id: l.leistungId },
      gewicht: 40,
      fuerRollen: ['chef' as const],
      pfad: '/betrieb/nachkalkulation',
      aktionen: [{ aktion: 'nachkalkulation.minutenAnpassen', label: `Auf ${l.minutenNeu} min anpassen`, primaer: true, payload: { leistungId: l.leistungId, minuten: l.minutenNeu } }],
    }));
    const ueber = ueberPlan(b, kalkulationFuer).map((n) => {
      const a = b.auftraege.find((x) => x.id === n.auftragId)!;
      return {
        schluessel: `nachkalkulation-ueber-plan:${a.id}`,
        art: 'problem' as const,
        titel: `${a.nummer}: schon ${stundenText(n.ist.minuten)} von ${stundenText(n.soll.minuten!)} geplant`,
        text: `${a.titel} läuft über Plan. Prüf, ob Zusatzleistungen abgerechnet werden können oder der Kunde informiert werden sollte.`,
        bezug: { typ: 'auftraege' as const, id: a.id },
        gewicht: 56,
        fuerRollen: ['chef' as const, 'buero' as const],
        pfad: `/betrieb/nachkalkulation/${a.id}`,
      };
    });
    return [...ueber, ...lernen];
  },
  aktionen: {
    'nachkalkulation.minutenAnpassen': (p) => minutenAnpassen(p),
    'nachkalkulation.oeffnen': (p) => `/betrieb/nachkalkulation/${(p as { auftragId: ID }).auftragId}`,
  },
  automationen: [
    {
      id: AUTOMATION_ERLEDIGT,
      titel: 'Nachkalkulation bei erledigten Aufträgen',
      beschreibung: 'Sobald ein Auftrag erledigt ist, vergleicht Macher Soll und Ist und legt dir das Ergebnis in „Braucht dich“.',
      standardAn: true,
      minuten: 15,
      start: starteNachkalkulationsAutomation,
    },
  ],
  /** Beispiel: Zeiten für den bereits erledigten Beispielauftrag, damit die Nachkalkulation etwas zeigt */
  seed: () => {
    const fertig = db.auftraege.where((a) => !!a.beispiel && a.phase === 'erledigt');
    const team = db.mitarbeiter.where((m) => !!m.beispiel && m.rolle === 'monteur');
    if (!team.length) return;
    for (const a of fertig) {
      if (db.zeiten.where((z) => z.auftragId === a.id).length) continue;
      const ende = a.abgeschlossenAm ? datumVon(a.abgeschlossenAm) : plusTage(datumVon(new Date().toISOString()), -40);
      const tage = [plusTage(ende, -1), ende];
      tage.forEach((datum, i) => {
        db.zeiten.create({ mitarbeiterId: team[0].id, auftragId: a.id, datum, start: '07:00', ende: i ? '15:30' : '16:00', pauseMinuten: 30, art: 'arbeit', freigegeben: true, beispiel: true });
        db.zeiten.create({ mitarbeiterId: team[0].id, auftragId: a.id, datum, start: '06:30', ende: '07:00', pauseMinuten: 0, art: 'fahrt', freigegeben: true, beispiel: true });
      });
    }
  },
});
