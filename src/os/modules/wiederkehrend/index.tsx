import { defineModul } from '@core/modul';
import { db } from '@core/db';
import { erledigt } from '@core/macher';
import { automationAn } from '@core/macher';
import { datumKurz, heute, passt, personName, plusTage } from '@core/format';
import { gewerkVorlage } from '@core/gewerke';
import { SerienListe } from './SerienListe';
import { SerieForm } from './SerieForm';
import { SerieDetail } from './SerieDetail';
import { AnlageSerienPanel, TerminSeriePanel } from './Panels';
import { regelText } from './regel';
import { abwesenheitsKonflikte, serieAktiv, serien, serienTermine, termineErzeugen, terminDatum, HORIZONT_MONATE } from './daten';

const REGEL = 'wiederkehrend.termine';

function termineNachziehen(protokollieren = true) {
  for (const s of serien.all()) {
    const n = termineErzeugen(s);
    if (n && protokollieren) {
      erledigt(REGEL, `${n === 1 ? '1 Serientermin' : `${n} Serientermine`} für „${s.titel}“ eingetragen`, {
        text: `Bis ${HORIZONT_MONATE} Monate im Voraus.`,
        bezug: s.kundeId ? { typ: 'kunden', id: s.kundeId } : undefined,
        minuten: 2 * n,
      });
    }
  }
}

export default defineModul({
  id: 'wiederkehrend',
  titel: 'Wiederkehrende Termine',
  bereich: 'plan',
  beschreibung: 'Wartungen, Prüfungen und regelmäßige Einsätze als Serie – Termine kommen automatisch.',
  icon: 'wiederholen',
  gewicht: 45,
  routen: [
    { pfad: '', element: SerienListe },
    { pfad: 'neu', element: SerieForm },
    { pfad: ':id', element: SerieDetail },
    { pfad: ':id/bearbeiten', element: SerieForm },
  ],
  erstellen: [{ label: 'Wiederkehrenden Termin anlegen', pfad: '/plan/wiederkehrend/neu', gewicht: 30 }],
  panels: [
    { objekt: 'anlagen', component: AnlageSerienPanel, gewicht: 55 },
    { objekt: 'termine', component: TerminSeriePanel, gewicht: 60 },
  ],
  kurzinfo: () => {
    const n = serien.where((s) => serieAktiv(s)).length;
    return n ? { text: n === 1 ? '1 laufende Serie' : `${n} laufende Serien`, ton: 'neutral' } : undefined;
  },
  automationen: [
    {
      id: REGEL,
      titel: 'Serientermine eintragen',
      beschreibung: `Trägt die Termine aller Serien immer ${HORIZONT_MONATE} Monate im Voraus in den Kalender ein.`,
      standardAn: true,
      minuten: 2,
      start: () => {
        const t = setInterval(() => termineNachziehen(), 6 * 60 * 60 * 1000);
        return () => clearInterval(t);
      },
      pruefen: () => termineNachziehen(),
    },
  ],
  hinweise: () => {
    const out = abwesenheitsKonflikte(heute(), 21).map((k) => {
      const s = serien.get(k.serieId);
      const m = db.mitarbeiter.get(k.mitarbeiterId);
      return {
        schluessel: `serie-abwesend:${k.terminId}:${k.mitarbeiterId}`,
        art: 'problem' as const,
        titel: `Serientermin ${datumKurz(k.datum)}: ${personName(m)} ist nicht da`,
        text: `${s?.titel ?? 'Serie'} – Abwesenheit ${k.beantragt ? 'beantragt' : 'genehmigt'}. Verschieb den Termin oder teile jemand anderen ein.`,
        bezug: { typ: 'termine' as const, id: k.terminId },
        gewicht: 56,
        faellig: k.datum,
        pfad: `/plan/wiederkehrend/${k.serieId}`,
      };
    });
    // Serien ohne eingeteilte Leute, deren nächster Termin in 14 Tagen ansteht
    for (const s of serien.where((x) => serieAktiv(x) && x.mitarbeiterIds.length === 0)) {
      const n = serienTermine(s.id).find((t) => terminDatum(t.start) >= heute() && t.mitarbeiterIds.length === 0 && ['geplant', 'bestaetigt'].includes(t.status));
      if (n && terminDatum(n.start) <= plusTage(heute(), 14)) {
        out.push({
          schluessel: `serie-unbesetzt:${n.id}`,
          art: 'problem',
          titel: `Serientermin ${datumKurz(n.start)} ohne Mitarbeiter`,
          text: `${s.titel}: Niemand ist eingeteilt. Teil in der Serie jemanden ein.`,
          bezug: { typ: 'termine', id: n.id },
          gewicht: 42,
          faellig: terminDatum(n.start),
          pfad: `/plan/wiederkehrend/${s.id}/bearbeiten`,
        });
      }
    }
    return out;
  },
  suche: (q) =>
    serien
      .where((s) => passt(q, s.titel, s.notiz, db.kunden.get(s.kundeId)?.name, 'serie wiederkehrend'))
      .slice(0, 6)
      .map((s) => ({ typ: 'Serie', titel: s.titel, untertitel: regelText(s.start, s.regel), pfad: `/plan/wiederkehrend/${s.id}`, relevanz: 40 })),
  seed: () => {
    // Beispiel: monatliche Sichtprüfung bei einer gewerblichen Anlage
    const ort = db.orte.all().find((o) => o.beispiel && o.art === 'gewerbe' && o.bezeichnung === 'Backstube') ?? db.orte.all().find((o) => o.beispiel && o.art === 'gewerbe');
    if (!ort || serien.all().some((s) => s.beispiel)) return;
    const monteur = db.mitarbeiter.all().find((m) => m.beispiel && m.vorname === 'Mehmet') ?? db.mitarbeiter.all().find((m) => m.rolle === 'monteur');
    const typ = gewerkVorlage(db.betrieb.get('betrieb')?.gewerk ?? 'sonstiges').anlagentypen[0] ?? 'Anlage';
    const s = serien.create({
      titel: `Sichtprüfung ${typ}`,
      regel: { art: 'monatlich', alle: 1 },
      start: plusTage(heute(), 18),
      uhrzeit: '13:30',
      dauerMinuten: 60,
      terminArt: 'wartung',
      mitarbeiterIds: monteur ? [monteur.id] : [],
      kundeId: ort.kundeId,
      ortId: ort.id,
      ausnahmen: [],
      erzeugt: [],
      notiz: 'Erst ab 13 Uhr – vorher läuft der Ofen.',
      werktags: true,
      beispiel: true,
    });
    if (automationAn(REGEL)) termineNachziehen();
    else termineErzeugen(s);
  },
});
