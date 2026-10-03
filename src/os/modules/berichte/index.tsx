import { defineModul } from '@core/modul';
import { db } from '@core/db';
import { on } from '@core/events';
import { erledigt } from '@core/macher';
import { datum, datumVon, heute, passt, plusTage } from '@core/format';
import type { Termin } from '@core/objects';
import { BerichtDetail, BerichtNeu, BerichteListe, BerichteTab } from './BerichtDetail';
import { BerichtDruck } from './BerichtDruck';
import { artLabel, berichtErstellen, berichtHinweise, berichte, einsaetzeOhneBericht } from './daten';

/** Nach einem beendeten Einsatz einen Bericht vorbereiten (einmal je Termin) */
function vorbereiten(t: Termin | undefined) {
  if (!t || !t.auftragId || t.status !== 'erledigt' || (t.art !== 'einsatz' && t.art !== 'wartung')) return;
  if (berichte.all().some((b) => b.terminId === t.id)) return;
  const b = berichtErstellen({ auftragId: t.auftragId, terminId: t.id, automatisch: true });
  erledigt('berichte.vorbereiten', `${artLabel(b.art)} ${b.nummer} vorbereitet`, {
    text: 'Zeiten, Material, Fotos und erledigte Aufgaben des Einsatzes sind schon eingetragen.',
    bezug: { typ: 'auftraege', id: t.auftragId },
  });
}

export default defineModul({
  id: 'berichte',
  titel: 'Berichte & Protokolle',
  bereich: 'auftraege',
  beschreibung: 'Erstellt Baustellenberichte, Arbeitsberichte, Rapporte, Prüfprotokolle und andere Nachweise.',
  icon: 'notiz',
  gewicht: 55,
  navigation: 'hub',
  routen: [
    { pfad: '', element: BerichteListe },
    { pfad: 'neu', element: BerichtNeu },
    { pfad: ':id', element: BerichtDetail },
  ],
  vollbildRouten: [{ pfad: '/druck/bericht/:id', element: BerichtDruck }],
  tabs: [
    {
      objekt: 'auftraege',
      titel: 'Berichte',
      component: BerichteTab,
      gewicht: 58,
      zaehler: (id) => berichte.where((b) => b.auftragId === id).length || undefined,
      sichtbar: (id) => {
        const a = db.auftraege.get(id);
        return !!a && (['beauftragt', 'in_arbeit', 'abnahme', 'abrechnung', 'erledigt'].includes(a.phase) || berichte.all().some((b) => b.auftragId === id));
      },
    },
  ],
  erstellen: [{ label: 'Bericht erstellen', pfad: '/auftraege/berichte/neu', gewicht: 32 }],
  kurzinfo: () => {
    const n = einsaetzeOhneBericht(db.termine.all(), berichte.all(), heute()).length;
    return n ? { text: n === 1 ? '1 Bericht offen' : `${n} Berichte offen`, ton: 'achtung' } : undefined;
  },
  hinweise: () => berichtHinweise(db.termine.all(), berichte.all(), heute()),
  aktionen: {
    'bericht.erstellen': (payload) => {
      const { auftragId, terminId } = (payload ?? {}) as { auftragId?: string; terminId?: string };
      if (!auftragId || !db.auftraege.get(auftragId)) return '/auftraege/berichte/neu';
      return `/auftraege/berichte/${berichtErstellen({ auftragId, terminId }).id}`;
    },
  },
  automationen: [
    {
      id: 'berichte.vorbereiten',
      titel: 'Bericht nach dem Einsatz vorbereiten',
      beschreibung: 'Ist ein Einsatz beendet, legt Lotte den Bericht an – mit Zeiten, Material, Fotos, erledigten Aufgaben und deinen Notizen des Tages.',
      standardAn: true,
      minuten: 10,
      start: () => {
        const aus1 = on('termine.updated', (e) => {
          const t = e.objekt as Termin | undefined;
          const vorher = e.vorher as Termin | undefined;
          if (t?.status === 'erledigt' && vorher?.status !== 'erledigt') vorbereiten(t);
        });
        const aus2 = on('einsatz.beendet', (e) => {
          const { terminId } = (e.daten ?? {}) as { terminId?: string };
          vorbereiten(db.termine.get(terminId ?? e.objekt?.id));
        });
        return () => {
          aus1();
          aus2();
        };
      },
    },
  ],
  suche: (q) =>
    berichte
      .where((b) => {
        const a = db.auftraege.get(b.auftragId);
        return passt(q, b.nummer, artLabel(b.art), 'bericht', a?.titel, a?.nummer, b.taetigkeiten);
      })
      .slice(0, 5)
      .map((b) => ({ typ: artLabel(b.art), titel: `${artLabel(b.art)} vom ${datum(b.datum)}`, untertitel: [b.nummer, db.auftraege.get(b.auftragId)?.titel].filter(Boolean).join(' · '), pfad: `/auftraege/berichte/${b.id}`, relevanz: 35 })),
  seed: () => {
    // Der gestrige Einsatz in Haus 24 ist beendet – Lotte hat den Bericht schon vorbereitet.
    const gestern = plusTage(heute(), -1);
    const t = db.termine.all().find((x) => x.beispiel && x.status === 'erledigt' && x.auftragId && datumVon(x.start) === gestern && x.art === 'einsatz');
    if (!t?.auftragId) return;
    berichtErstellen({ auftragId: t.auftragId, terminId: t.id, automatisch: true, beispiel: true });
  },
});
