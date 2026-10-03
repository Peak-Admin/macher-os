import { defineModul } from '@core/modul';
import { db } from '@core/db';
import { on } from '@core/events';
import { automationAn, erledigt, hinweis, hinweisErledigen } from '@core/macher';
import { pfadZu } from '@core/modul';
import type { Auftrag, ID, Termin } from '@core/objects';
import { datumVon } from '@core/format';
import { kontextAusDb } from './basis';
import { einzuplanen, vorschlaege, vorschlagKurz, vorschlagUebernehmen, type Vorschlag } from './daten';
import { Autoplanung } from './Autoplanung';
import { AuftragPlanen } from './AuftragPlanen';
import { AuftragCheck, TerminCheck } from './EinsatzCheck';
import { EinplanenPanel } from './EinplanenPanel';
import { EINPLANEN_AKTIONEN } from './gateway';

const AUTOMATION = 'autoplanung.dringend-vorschlagen';
const schluessel = (id: ID) => `autoplanung-dringend:${id}`;

/** dringender Auftrag ohne künftigen Termin? */
function dringendOhneTermin(a: Auftrag) {
  if (!a.dringend) return false;
  const ctx = kontextAusDb();
  return einzuplanen(ctx, a) && !ctx.termine.some((t) => t.auftragId === a.id && t.status !== 'abgesagt' && datumVon(t.start) >= ctx.heute);
}

/** Lotte legt für dringende Aufträge einen Planvorschlag zur Freigabe in „Braucht dich“ */
function dringendVorschlagen(a: Auftrag) {
  if (!dringendOhneTermin(a)) return;
  // offen – oder in den letzten 7 Tagen von dir erledigt/verworfen: nicht sofort wieder vorlegen
  const seit = new Date(Date.now() - 7 * 86_400_000).toISOString();
  if (db.hinweise.all().some((h) => h.schluessel === schluessel(a.id) && (h.status === 'offen' || (h.erledigtAm ?? h.geaendertAm) >= seit))) return;
  const ctx = kontextAusDb();
  const vs = vorschlaege(ctx, a.id, { anzahl: 1 }).vorschlaege[0];
  if (!vs) return;
  hinweis({
    art: 'freigabe',
    titel: `Dringend einplanen: ${a.titel}`,
    text: `Vorschlag: ${vorschlagKurz(ctx, vs)}. ${vs.gruende.slice(1, 3).join(' · ')}`,
    bezug: { typ: 'auftraege', id: a.id },
    gewicht: 80,
    schluessel: schluessel(a.id),
    aktionen: [
      { id: 'autoplanung.uebernehmen', label: 'So einplanen', primaer: true, payload: { vorschlag: vs } },
      { id: 'plan.vorschlag', label: 'Andere Vorschläge', payload: { auftragId: a.id } },
    ],
  });
  erledigt(AUTOMATION, `Planvorschlag erstellt: ${a.titel}`, { text: vorschlagKurz(ctx, vs), bezug: { typ: 'auftraege', id: a.id } });
}

export default defineModul({
  id: 'autoplanung',
  titel: 'Automatische Planung',
  bereich: 'plan',
  beschreibung: 'Lotte schlägt Termin und Team vor – nach Verfügbarkeit, Qualifikation, Fahrweg, Auslastung und Kundenwunsch.',
  icon: 'macher',
  gewicht: 75,
  navigation: 'haupt',
  routen: [
    { pfad: '', element: Autoplanung },
    { pfad: ':auftragId', element: AuftragPlanen },
  ],
  panels: [
    { objekt: 'termine', component: TerminCheck, gewicht: 80 },
    { objekt: 'auftraege', component: EinplanenPanel, gewicht: 75 },
    { objekt: 'auftraege', component: AuftragCheck, gewicht: 70 },
  ],
  gateway: { aktionen: [...EINPLANEN_AKTIONEN] },
  aktionen: {
    'plan.vorschlag': (payload) => {
      const { auftragId } = (payload ?? {}) as { auftragId?: ID };
      return auftragId ? `/plan/autoplanung/${auftragId}` : '/plan/autoplanung';
    },
    'autoplanung.uebernehmen': (payload) => {
      const { vorschlag } = (payload ?? {}) as { vorschlag?: Vorschlag };
      if (!vorschlag) return;
      const r = vorschlagUebernehmen(vorschlag);
      // Zeit inzwischen belegt → neu vorschlagen lassen
      if (!r.ok) return `/plan/autoplanung/${vorschlag.auftragId}`;
      const a = db.auftraege.get(vorschlag.auftragId);
      erledigt('autoplanung.uebernommen', `Eingeplant: ${a?.titel ?? 'Auftrag'}`, { bezug: { typ: 'auftraege', id: vorschlag.auftragId }, minuten: 10 });
      return pfadZu({ typ: 'termine', id: r.termine[0].id });
    },
  },
  hinweise: () => {
    // Nur, wenn die Automation aus ist – sonst liegt der Vorschlag schon als Freigabe in „Braucht dich“.
    if (automationAn(AUTOMATION)) return [];
    return db.auftraege
      .where((a) => !!a.dringend && dringendOhneTermin(a))
      .map((a) => ({
        schluessel: schluessel(a.id),
        art: 'entscheidung' as const,
        titel: `Dringend, aber ohne Termin: ${a.titel}`,
        text: 'Lass dir einen Termin mit passendem Team vorschlagen.',
        bezug: { typ: 'auftraege' as const, id: a.id },
        gewicht: 75,
        aktionen: [{ aktion: 'plan.vorschlag', label: 'Termin vorschlagen', primaer: true, payload: { auftragId: a.id } }],
        pfad: `/plan/autoplanung/${a.id}`,
      }));
  },
  automationen: [
    {
      id: AUTOMATION,
      titel: 'Dringende Aufträge sofort vorplanen',
      beschreibung: 'Kommt ein dringender Auftrag rein, sucht Lotte Team und Termin und legt dir den Vorschlag zur Freigabe hin.',
      standardAn: true,
      minuten: 10,
      start: () => {
        const aus1 = on('auftraege.created', (e) => dringendVorschlagen(e.objekt as Auftrag));
        const aus2 = on('auftraege.updated', (e) => {
          const a = e.objekt as Auftrag;
          const vorher = e.vorher as Auftrag | undefined;
          if (a.dringend && (!vorher?.dringend || vorher.phase !== a.phase)) dringendVorschlagen(a);
        });
        // Termin angelegt → offene Freigabe schließen
        const aus3 = on('termine.created', (e) => {
          const t = e.objekt as Termin;
          if (!t.auftragId) return;
          db.hinweise
            .where((h) => h.schluessel === schluessel(t.auftragId!) && h.status === 'offen')
            .forEach((h) => hinweisErledigen(h.id));
        });
        return () => {
          aus1();
          aus2();
          aus3();
        };
      },
      pruefen: () => db.auftraege.where((a) => !!a.dringend).forEach(dringendVorschlagen),
    },
  ],
});
