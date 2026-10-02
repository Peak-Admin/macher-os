import { defineModul } from '@core/modul';
import { db } from '@core/db';
import { passt, relativ } from '@core/format';
import { DateiDetail, DateienListe, DateienTab } from './Ansichten';
import { ART_LABEL, istDatei } from './daten';
import { beispielBild } from '@modules/fotos/beispiel';

export default defineModul({
  id: 'dateien',
  titel: 'Dateien',
  bereich: 'auftraege',
  beschreibung: 'Speichert Pläne, PDFs, Zeichnungen und sonstige Unterlagen am Auftrag.',
  icon: 'ordner',
  gewicht: 45,
  navigation: 'hub',
  routen: [
    { pfad: '', element: DateienListe },
    { pfad: ':id', element: DateiDetail },
  ],
  detail: [{ objekt: 'dokumente', pfad: (id) => `/auftraege/dateien/${id}` }],
  tabs: [
    {
      objekt: 'auftraege',
      titel: 'Dateien',
      component: DateienTab,
      gewicht: 40,
      zaehler: (id) => db.dokumente.where((d) => d.auftragId === id && istDatei(d)).length || undefined,
    },
  ],
  erstellen: [{ label: 'Datei hochladen', pfad: '/auftraege/dateien', gewicht: 10 }],
  suche: (q) =>
    db.dokumente
      .where((d) => istDatei(d) && passt(q, d.titel, ART_LABEL[d.art]))
      .slice(0, 6)
      .map((d) => ({ typ: ART_LABEL[d.art] ?? 'Datei', titel: d.titel, untertitel: [db.auftraege.get(d.auftragId)?.nummer, relativ(d.erstelltAm)].filter(Boolean).join(' · '), pfad: `/auftraege/dateien/${d.id}`, relevanz: 30 })),
  seed: () => {
    const a4 = db.auftraege.all().find((a) => a.beispiel && a.titel === 'Sanierung Wohnanlage, Haus 24');
    if (!a4) return;
    db.dokumente.create({ art: 'plan', titel: 'Grundriss Haus 24, Keller', url: beispielBild('Grundriss Haus 24, Keller', 'Beispielplan'), mime: 'image/svg+xml', auftragId: a4.id, tags: [], fuerKunde: false, beispiel: true });
  },
});
