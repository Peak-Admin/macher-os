import { darf } from '@core/session';
import { defineModul } from '@core/modul';
import { db } from '@core/db';
import { passt } from '@core/format';
import type { ID } from '@core/objects';
import { KalkulationListe, KalkulationTab } from './KalkulationListe';
import { KalkulationEditor, kalkulationAnlegen } from './KalkulationEditor';
import { kalkulationen, zeileAusLeistung } from './daten';
import { aufmasse } from '@modules/aufmass/daten';

export default defineModul({
  id: 'kalkulation',
  titel: 'Kalkulation',
  bereich: 'auftraege',
  beschreibung: 'Stunden, Material und Zuschläge durchrechnen – Preis geht direkt ins Angebot.',
  icon: 'euro',
  gewicht: 55,
  rollen: ['chef', 'buero'],
  routen: [
    { pfad: '', element: KalkulationListe },
    { pfad: ':id', element: KalkulationEditor },
  ],
  tabs: [
    {
      objekt: 'auftraege',
      titel: 'Kalkulation',
      component: KalkulationTab,
      gewicht: 60,
      zaehler: (id) => kalkulationen.where((k) => k.auftragId === id).length || undefined,
      sichtbar: (id) => {
        const a = db.auftraege.get(id);
        // Progressive Disclosure: bei Projekten in der Angebotsphase, nach einem Aufmaß oder wenn schon kalkuliert
        const vorAngebot = !!a && ['besichtigung', 'angebot'].includes(a.phase);
        return !!a && darf('geld') && ((vorAngebot && (a.art === 'projekt' || aufmasse.all().some((x) => x.auftragId === id))) || kalkulationen.all().some((k) => k.auftragId === id));
      },
    },
  ],
  aktionen: {
    'kalkulation.anlegen': (p) => `/auftraege/kalkulation/${kalkulationAnlegen((p as { auftragId: ID }).auftragId).id}`,
  },
  suche: (q) =>
    kalkulationen
      .where((k) => passt(q, k.titel))
      .slice(0, 4)
      .map((k) => ({ typ: 'Kalkulation', titel: k.titel, untertitel: db.kunden.get(db.auftraege.get(k.auftragId)?.kundeId)?.name, pfad: `/auftraege/kalkulation/${k.id}`, relevanz: 30 })),
  seed: () => {
    // Beispiel-Kalkulation für den Auftrag in Phase Angebot
    const auftrag = db.auftraege.all().find((a) => a.beispiel && a.phase === 'angebot');
    if (!auftrag) return;
    const k = kalkulationAnlegen(auftrag.id);
    const artikel = db.artikel.all();
    const zeilen = db.leistungen
      .all()
      .slice(0, 3)
      .map((l, i) => zeileAusLeistung(l, artikel, l.einheit === 'h' ? 16 : l.einheit === 'Psch' ? 1 : [1, 6, 20][i]));
    kalkulationen.update(k.id, { zeilen, beispiel: true }, { leise: true });
  },
});
