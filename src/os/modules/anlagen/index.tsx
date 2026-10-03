import { defineModul, modul, pfadZu, type HinweisVorschlag } from '@core/modul';
import { db } from '@core/db';
import { on } from '@core/events';
import { erledigt } from '@core/macher';
import { datum, heute, passt } from '@core/format';
import type { Auftrag, ID } from '@core/objects';
import { AnlagenListe } from './AnlagenListe';
import { AnlageDetail, AnlagenAmAuftrag, AnlagenAmKunden, AnlagenAmOrt } from './AnlageDetail';
import { anlageName, wartungsauftragAnlegen } from './AnlageBausteine';
import { gewaehrleistungStatus, offenerWartungsauftrag, wartungFortschreiben, wartungsStatus } from './daten';

const REGEL = 'anlagen.wartung';

export default defineModul({
  id: 'anlagen',
  titel: 'Anlagen',
  bereich: 'auftraege',
  beschreibung: 'Heizungen, Wallboxen, Maschinen – mit Seriennummer, Wartung, Gewährleistung und Historie.',
  icon: 'werkzeug',
  gewicht: 45,
  navigation: 'haupt',
  routen: [
    { pfad: '', element: AnlagenListe },
    { pfad: ':id', element: AnlageDetail },
  ],
  detail: [{ objekt: 'anlagen', pfad: (id) => `/auftraege/anlagen/${id}` }],
  tabs: [
    { objekt: 'kunden', titel: 'Anlagen', component: AnlagenAmKunden, gewicht: 70, zaehler: (id) => db.anlagen.where((a) => a.kundeId === id).length },
    { objekt: 'orte', titel: 'Anlagen', component: AnlagenAmOrt, gewicht: 80, zaehler: (id) => db.anlagen.where((a) => a.ortId === id).length },
    {
      objekt: 'auftraege',
      titel: 'Anlagen',
      component: AnlagenAmAuftrag,
      gewicht: 45,
      zaehler: (id) => db.auftraege.get(id)?.anlageIds?.length,
      sichtbar: (id) => {
        const a = db.auftraege.get(id);
        if (!a) return false;
        return !!a.anlageIds?.length || a.art === 'wartung' || db.anlagen.where((x) => (a.ortId ? x.ortId === a.ortId : x.kundeId === a.kundeId)).length > 0;
      },
    },
  ],

  hinweise: () => {
    const liste: HinweisVorschlag[] = [];
    const auftraege = db.auftraege.all();
    for (const a of db.anlagen.all()) {
      if (gewaehrleistungStatus(a) === 'endet_bald') {
        const kunde = db.kunden.get(a.kundeId);
        liste.push({
          schluessel: `anlage-gewaehrleistung:${a.id}`,
          art: 'info',
          titel: `Gewährleistung endet am ${datum(a.gewaehrleistungBis)}: ${a.typ}`,
          text: `${kunde?.name ?? 'Kunde'}. Jetzt ist ein guter Zeitpunkt für einen Check oder einen Wartungsvertrag.`,
          bezug: { typ: 'anlagen', id: a.id },
          gewicht: 20,
          faellig: a.gewaehrleistungBis,
          pfad: `/auftraege/anlagen/${a.id}`,
        });
      }
      // Wartungen plant eigentlich das Modul „Wartung & Service“. Fehlt es, erinnern wir selbst.
      if (!modul('wartung') && wartungsStatus(a) === 'ueberfaellig' && !offenerWartungsauftrag(a.id, auftraege)) {
        liste.push({
          schluessel: `anlage-wartung:${a.id}`,
          art: 'entscheidung',
          titel: `Wartung überfällig: ${anlageName(a)}`,
          text: `${db.kunden.get(a.kundeId)?.name ?? 'Kunde'} · fällig seit ${datum(a.naechsteWartung)}`,
          bezug: { typ: 'anlagen', id: a.id },
          gewicht: 36,
          faellig: a.naechsteWartung,
          aktionen: [{ aktion: 'anlage.wartungsauftrag', label: 'Wartungsauftrag anlegen', primaer: true, payload: { anlageId: a.id } }],
          pfad: `/auftraege/anlagen/${a.id}`,
        });
      }
    }
    return liste;
  },

  aktionen: {
    'anlage.wartungsauftrag': (payload) => {
      const a = db.anlagen.get((payload as { anlageId?: ID })?.anlageId);
      if (!a) return;
      const vorhanden = offenerWartungsauftrag(a.id, db.auftraege.all());
      const auftrag = vorhanden ?? wartungsauftragAnlegen(a);
      return pfadZu({ typ: 'auftraege', id: auftrag.id });
    },
  },

  automationen: [
    {
      id: REGEL,
      titel: 'Wartung an der Anlage fortschreiben',
      beschreibung: 'Ist ein Wartungsauftrag erledigt, trägt Lotte die letzte Wartung an der Anlage ein und berechnet die nächste aus dem Intervall.',
      standardAn: true,
      minuten: 3,
      start: () =>
        on('auftraege.updated', (e) => {
          const a = e.objekt as Auftrag;
          const vorher = e.vorher as Auftrag | undefined;
          if (a.phase !== 'erledigt' || vorher?.phase === 'erledigt' || a.art !== 'wartung' || !a.anlageIds?.length) return;
          const am = (a.abgeschlossenAm ?? new Date().toISOString()).slice(0, 10) || heute();
          for (const id of a.anlageIds) {
            const anlage = db.anlagen.get(id);
            if (!anlage) continue;
            const patch = wartungFortschreiben(anlage, am);
            if (!patch) continue;
            db.anlagen.update(id, patch, { text: `Wartung am ${datum(am)} erledigt (${a.nummer})` });
            erledigt(REGEL, `Wartung an ${anlage.typ} eingetragen`, {
              text: patch.naechsteWartung ? `Nächste Wartung: ${datum(patch.naechsteWartung)}` : undefined,
              bezug: { typ: 'anlagen', id },
            });
          }
        }),
    },
  ],

  suche: (q) =>
    db.anlagen
      .where((a) => passt(q, a.typ, a.hersteller, a.modell, a.seriennummer, db.kunden.get(a.kundeId)?.name))
      .slice(0, 6)
      .map((a) => ({
        typ: 'Anlage',
        titel: anlageName(a),
        untertitel: [a.seriennummer && `SN ${a.seriennummer}`, db.kunden.get(a.kundeId)?.name].filter(Boolean).join(' · '),
        pfad: `/auftraege/anlagen/${a.id}`,
        relevanz: a.seriennummer && passt(q, a.seriennummer) ? 70 : 45,
      })),
});
