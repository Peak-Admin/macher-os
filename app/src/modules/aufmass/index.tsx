import { defineModul } from '@core/modul';
import { db } from '@core/db';
import { heute, passt, tageZwischen } from '@core/format';
import type { ID } from '@core/objects';
import { AufmassListe, AufmassTab } from './AufmassListe';
import { AufmassEditor, aufmassAnlegen } from './AufmassEditor';
import { aufmasse, neueZeile, zusammenfassen, type MassZeile } from './daten';

export default defineModul({
  id: 'aufmass',
  titel: 'Aufmaß',
  bereich: 'auftraege',
  beschreibung: 'Räume und Bauteile messen – Mengen gehen direkt ins Angebot.',
  icon: 'liste',
  gewicht: 60,
  routen: [
    { pfad: '', element: AufmassListe },
    { pfad: ':id', element: AufmassEditor },
  ],
  tabs: [
    {
      objekt: 'auftraege',
      titel: 'Aufmaß',
      component: AufmassTab,
      gewicht: 65,
      zaehler: (id) => aufmasse.where((a) => a.auftragId === id).length || undefined,
      sichtbar: (id) => {
        const a = db.auftraege.get(id);
        return !!a && (['anfrage', 'besichtigung', 'angebot'].includes(a.phase) || aufmasse.all().some((x) => x.auftragId === id));
      },
    },
  ],
  aktionen: {
    'aufmass.anlegen': (p) => `/auftraege/aufmass/${aufmassAnlegen((p as { auftragId: ID }).auftragId).id}`,
  },
  hinweise: () =>
    aufmasse
      .all()
      .filter((a) => !a.angebotId && zusammenfassen(a).length > 0 && tageZwischen(a.geaendertAm.slice(0, 10), heute()) >= 2)
      .filter((a) => db.auftraege.get(a.auftragId)?.phase === 'angebot' || db.auftraege.get(a.auftragId)?.phase === 'besichtigung')
      .map((a) => ({
        schluessel: `aufmass-offen:${a.id}`,
        art: 'entscheidung' as const,
        titel: `Aufmaß liegt bereit: ${db.kunden.get(db.auftraege.get(a.auftragId)?.kundeId)?.name ?? a.titel}`,
        text: 'Die Mengen sind gemessen, aber noch nicht im Angebot.',
        bezug: { typ: 'auftraege' as const, id: a.auftragId },
        gewicht: 56,
        fuerRollen: ['chef' as const, 'buero' as const],
        pfad: `/auftraege/aufmass/${a.id}`,
      })),
  suche: (q) =>
    aufmasse
      .where((a) => passt(q, a.titel, a.raeume.map((r) => r.name).join(' ')))
      .slice(0, 4)
      .map((a) => ({ typ: 'Aufmaß', titel: a.titel, untertitel: db.kunden.get(db.auftraege.get(a.auftragId)?.kundeId)?.name, pfad: `/auftraege/aufmass/${a.id}`, relevanz: 35 })),
  seed: () => {
    // Beispiel-Aufmaß für den Auftrag in Phase Besichtigung (falls Beispieldaten an sind)
    const auftrag = db.auftraege.all().find((a) => a.beispiel && a.phase === 'besichtigung');
    if (!auftrag) return;
    const leistungen = db.leistungen.all();
    const zu = (z: MassZeile) => {
      const l = leistungen.find((x) => x.einheit === (z.art === 'stueck' ? 'Stk' : z.art === 'laenge' ? 'm' : 'm²'));
      return { ...z, leistungId: l?.id, text: z.text || l?.name || '' };
    };
    aufmasse.create(
      {
        auftragId: auftrag.id,
        titel: `Aufmaß ${auftrag.titel}`,
        datum: heute(),
        raeume: [
          { id: 'r1', name: 'Wohnzimmer', zeilen: [{ ...neueZeile('flaeche', 'Boden'), laenge: 5.2, breite: 4.1 }, zu({ ...neueZeile('stueck', ''), anzahl: 6 })] },
          { id: 'r2', name: 'Küche', zeilen: [zu({ ...neueZeile('laenge', ''), laenge: 12.5 }), zu({ ...neueZeile('stueck', ''), anzahl: 4 })] },
        ],
        beispiel: true,
      },
      { leise: true },
    );
  },
});
