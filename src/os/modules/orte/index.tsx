import { defineModul, type HinweisVorschlag } from '@core/modul';
import { db } from '@core/db';
import { on } from '@core/events';
import { erledigt } from '@core/macher';
import { datumKurz, passt, uhrzeit } from '@core/format';
import type { Auftrag, Termin } from '@core/objects';
import { OrteListe } from './OrteListe';
import { OrtDetail, OrteAmKunden } from './OrtDetail';
import { OrtPanelAuftrag, OrtPanelTermin } from './OrtPanel';
import { orteOhneInfosVorTermin, passenderOrt } from './daten';

const REGEL = 'orte.zuordnen';
const AKTIV = (a: Auftrag) => !['erledigt', 'verloren'].includes(a.phase);

/** Auftrag ohne Ort: einzigen Ort des Kunden nehmen oder aus der Kundenadresse anlegen */
function ortZuordnen(a: Auftrag) {
  if (a.ortId || !AKTIV(a)) return;
  const orte = db.orte.all();
  let ort = passenderOrt(a, orte);
  const kunde = db.kunden.get(a.kundeId);
  if (!ort && kunde?.adresse?.strasse && !orte.some((o) => o.kundeId === a.kundeId)) {
    ort = db.orte.create({
      kundeId: kunde.id,
      bezeichnung: kunde.art === 'privat' ? 'Wohnhaus' : 'Hauptstandort',
      art: kunde.art === 'privat' ? 'haus' : 'gewerbe',
      adresse: kunde.adresse,
      beispiel: a.beispiel,
    });
  }
  if (!ort) return;
  db.auftraege.update(a.id, { ortId: ort.id }, { text: `Einsatzort ${ort.bezeichnung} zugeordnet` });
  erledigt(REGEL, `Einsatzort für ${a.nummer} zugeordnet`, { text: `${ort.bezeichnung}, ${ort.adresse.strasse}`, bezug: { typ: 'auftraege', id: a.id } });
}

export default defineModul({
  id: 'orte',
  titel: 'Orte & Baustellen',
  bereich: 'auftraege',
  beschreibung: 'Häuser, Wohnungen, Baustellen – mit Zugang, Parken, Schlüssel und Ansprechpartner vor Ort.',
  icon: 'ort',
  gewicht: 56,
  navigation: 'haupt',
  routen: [
    { pfad: '', element: OrteListe },
    { pfad: ':id', element: OrtDetail },
  ],
  detail: [{ objekt: 'orte', pfad: (id) => `/auftraege/orte/${id}` }],
  tabs: [{ objekt: 'kunden', titel: 'Orte', component: OrteAmKunden, gewicht: 80, zaehler: (id) => db.orte.where((o) => o.kundeId === id).length }],
  panels: [
    { objekt: 'auftraege', component: OrtPanelAuftrag, gewicht: 90 },
    { objekt: 'termine', component: OrtPanelTermin, gewicht: 90 },
  ],

  hinweise: () => {
    const liste: HinweisVorschlag[] = [];
    for (const { ort, termin } of orteOhneInfosVorTermin(db.orte.all(), db.termine.all())) {
      liste.push({
        schluessel: `ort-zugang:${ort.id}`,
        art: 'problem',
        titel: `Zugang klären: ${ort.adresse.strasse}`,
        text: `Einsatz ${datumKurz(termin.start)} um ${uhrzeit(termin.start)}. Es fehlt, wie das Team reinkommt, wo es parkt und wen es anruft.`,
        bezug: { typ: 'orte', id: ort.id },
        gewicht: 42,
        faellig: termin.start.slice(0, 10),
        pfad: `/auftraege/orte/${ort.id}`,
      });
    }
    for (const a of db.auftraege.where((a) => !a.ortId && ['beauftragt', 'in_arbeit'].includes(a.phase))) {
      liste.push({
        schluessel: `auftrag-ohne-ort:${a.id}`,
        art: 'problem',
        titel: `Einsatzort fehlt: ${a.titel || a.nummer}`,
        text: 'Der Auftrag ist beauftragt, aber ohne Adresse findet niemand hin.',
        bezug: { typ: 'auftraege', id: a.id },
        gewicht: 48,
      });
    }
    return liste;
  },

  automationen: [
    {
      id: REGEL,
      titel: 'Einsatzort automatisch zuordnen',
      beschreibung: 'Hat ein Kunde genau einen Ort, bekommt jeder neue Auftrag ihn automatisch. Ohne Ort wird er aus der Kundenadresse angelegt. Termine übernehmen den Ort ihres Auftrags.',
      standardAn: true,
      minuten: 2,
      start: () => {
        const aus1 = on('auftraege.created', (e) => ortZuordnen(e.objekt as Auftrag));
        const aus2 = on('termine.created', (e) => {
          const t = e.objekt as Termin;
          if (t.ortId || !t.auftragId) return;
          const a = db.auftraege.get(t.auftragId);
          if (a?.ortId) db.termine.update(t.id, { ortId: a.ortId }, { text: 'Einsatzort vom Auftrag übernommen' });
        });
        return () => {
          aus1();
          aus2();
        };
      },
      pruefen: () => db.auftraege.where((a) => !a.ortId && AKTIV(a)).forEach(ortZuordnen),
    },
  ],

  suche: (q) => {
    const kunden = db.kunden.all();
    return db.orte
      .where((o) => passt(q, o.bezeichnung, o.adresse.strasse, o.adresse.plz, o.adresse.ort, o.ansprechpartnerVorOrt, kunden.find((k) => k.id === o.kundeId)?.name))
      .slice(0, 6)
      .map((o) => ({
        typ: 'Ort',
        titel: `${o.adresse.strasse}, ${o.adresse.ort}`,
        untertitel: [o.bezeichnung, kunden.find((k) => k.id === o.kundeId)?.name].filter(Boolean).join(' · '),
        pfad: `/auftraege/orte/${o.id}`,
        relevanz: 50,
      }));
  },
});
