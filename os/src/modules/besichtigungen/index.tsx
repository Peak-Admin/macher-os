import { defineModul, type HinweisVorschlag } from '@core/modul';
import { db } from '@core/db';
import { datumKurz, passt, uhrzeit } from '@core/format';
import type { ID } from '@core/objects';
import { BesichtigungenListe, auftraegeOhneBesichtigung } from './BesichtigungenListe';
import { BesichtigungPlanen } from './BesichtigungPlanen';
import { BesichtigungVorOrt } from './BesichtigungVorOrt';
import { istBesichtigung } from './daten';

export default defineModul({
  id: 'besichtigungen',
  titel: 'Besichtigungen',
  bereich: 'auftraege',
  beschreibung: 'Vor-Ort-Termine planen und mit Fotos und Notizen dokumentieren.',
  icon: 'ort',
  gewicht: 65,
  routen: [
    { pfad: '', element: BesichtigungenListe },
    { pfad: 'neu', element: BesichtigungPlanen },
    { pfad: ':id', element: BesichtigungVorOrt },
  ],
  erstellen: [{ label: 'Besichtigung planen', pfad: '/auftraege/besichtigungen/neu', gewicht: 55 }],
  aktionen: {
    'besichtigung.planen': (p) => `/auftraege/besichtigungen/neu?auftrag=${(p as { auftragId: ID }).auftragId}`,
  },
  hinweise: () => {
    const liste: HinweisVorschlag[] = [];
    const jetzt = new Date().toISOString();
    for (const a of auftraegeOhneBesichtigung()) {
      liste.push({
        schluessel: `besichtigung-fehlt:${a.id}`,
        art: 'entscheidung',
        titel: `Besichtigung einplanen: ${db.kunden.get(a.kundeId)?.name ?? a.titel}`,
        text: `${a.titel}${a.wunschtermin ? ` · Wunsch: ${a.wunschtermin}` : ''}`,
        bezug: { typ: 'auftraege', id: a.id },
        gewicht: 60,
        aktionen: [{ aktion: 'besichtigung.planen', label: 'Termin planen', primaer: true, payload: { auftragId: a.id } }],
        pfad: `/auftraege/besichtigungen/neu?auftrag=${a.id}`,
      });
    }
    for (const t of db.termine.where((x) => istBesichtigung(x) && x.status !== 'erledigt' && x.status !== 'abgesagt' && x.ende < jetzt)) {
      liste.push({
        schluessel: `besichtigung-ergebnis:${t.id}`,
        art: 'entscheidung',
        titel: `Besichtigung auswerten: ${db.kunden.get(t.kundeId)?.name ?? t.titel}`,
        text: `War am ${datumKurz(t.start)} um ${uhrzeit(t.start)} Uhr. Aufmaß, Angebot oder kein Auftrag?`,
        bezug: t.auftragId ? { typ: 'auftraege', id: t.auftragId } : { typ: 'termine', id: t.id },
        fuerMitarbeiterId: t.mitarbeiterIds[0],
        gewicht: 58,
        pfad: `/auftraege/besichtigungen/${t.id}`,
      });
    }
    return liste;
  },
  suche: (q) =>
    db.termine
      .where((t) => istBesichtigung(t) && passt(q, t.titel, db.kunden.get(t.kundeId)?.name))
      .slice(0, 4)
      .map((t) => ({ typ: 'Besichtigung', titel: t.titel, untertitel: `${datumKurz(t.start)}, ${uhrzeit(t.start)} Uhr`, pfad: `/auftraege/besichtigungen/${t.id}`, relevanz: 40 })),
});
