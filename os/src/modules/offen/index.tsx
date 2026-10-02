import { defineModul, type HinweisVorschlag } from '@core/modul';
import { db } from '@core/db';
import { offenEinzuplanen, vorschlagVerfuegbar } from './daten';
import { OffenSeite, OffenWidget } from './OffenListe';

export default defineModul({
  id: 'offen',
  titel: 'Offen einzuplanen',
  bereich: 'plan',
  beschreibung: 'Aufträge, Besichtigungen und Arbeiten, die noch keinen Termin haben.',
  icon: 'liste',
  gewicht: 84,
  routen: [{ pfad: '', element: OffenSeite }],
  hubWidget: OffenWidget,
  kurzinfo: () => {
    const n = offenEinzuplanen(db.auftraege.all(), db.termine.all()).length;
    return n ? { text: n === 1 ? '1 Auftrag ohne Termin' : `${n} Aufträge ohne Termin`, ton: 'aktiv' } : { text: 'Alles eingeplant', ton: 'erfolg' };
  },
  hinweise: () => {
    const offen = offenEinzuplanen(db.auftraege.all(), db.termine.all());
    const mitVorschlag = vorschlagVerfuegbar();
    const liste: HinweisVorschlag[] = offen
      .filter((e) => e.auftrag.dringend)
      .map((e) => ({
        schluessel: `offen-dringend:${e.auftrag.id}`,
        art: 'problem',
        titel: `Dringend, aber noch kein Termin: ${e.auftrag.titel}`,
        text: [db.kunden.get(e.auftrag.kundeId)?.name, e.auftrag.wunschtermin ? `Wunsch: ${e.auftrag.wunschtermin}` : undefined].filter(Boolean).join(' · '),
        bezug: { typ: 'auftraege', id: e.auftrag.id },
        gewicht: 80,
        fuerRollen: ['chef', 'buero'],
        aktionen: [
          { aktion: 'plan.einplanen', label: 'Einplanen', primaer: true, payload: { auftragId: e.auftrag.id } },
          ...(mitVorschlag ? [{ aktion: 'plan.vorschlag', label: 'Vorschlag', payload: { auftragId: e.auftrag.id } }] : []),
        ],
      }));
    const lange = offen.filter((e) => !e.auftrag.dringend && e.grund === 'einsatz' && e.alterTage > 14);
    if (lange.length)
      liste.push({
        schluessel: 'offen-wartet-lange',
        art: 'entscheidung',
        titel: lange.length === 1 ? '1 beauftragter Auftrag wartet seit über 2 Wochen auf einen Termin' : `${lange.length} beauftragte Aufträge warten seit über 2 Wochen auf einen Termin`,
        text: 'Plane sie ein oder sag dem Kunden Bescheid, wann es losgeht.',
        gewicht: 52,
        fuerRollen: ['chef', 'buero'],
        pfad: '/plan/offen',
      });
    return liste;
  },
});
