import { defineModul, type HinweisVorschlag } from '@core/modul';
import { db } from '@core/db';
import { on } from '@core/events';
import { erledigt } from '@core/macher';
import { datum, datumVon, heute, passt, plusTage, zeitpunkt } from '@core/format';
import type { ID } from '@core/objects';
import { schulungen, nachweiseErzeugen, type Schulung } from './daten';
import { MitarbeiterSchulungenTab, SchulungDetail, SchulungNeu, SchulungenSeite } from './Ansichten';

export function schulungenHinweise(t = heute()): HinweisVorschlag[] {
  return schulungen
    .where((s) => s.status === 'geplant')
    .map((s) => ({ s, termin: db.termine.get(s.terminId) }))
    .filter((x) => x.termin && datumVon(x.termin.ende) < t)
    .map(({ s, termin }) => ({
      schluessel: `schulung-abschliessen:${s.id}`,
      art: 'entscheidung' as const,
      titel: `Schulung „${termin!.titel}“ abschließen`,
      text: `War am ${datum(termin!.start)}. Hak ab, wer dabei war${s.qualifikationId ? ' – der Nachweis kommt dann automatisch' : ''}.`,
      bezug: { typ: 'termine' as const, id: termin!.id },
      gewicht: 45,
      fuerRollen: ['chef' as const, 'buero' as const],
      pfad: `/betrieb/schulungen/${s.id}`,
    }));
}

export default defineModul({
  id: 'schulungen',
  titel: 'Schulungen',
  bereich: 'betrieb',
  gruppe: 'team',
  beschreibung: 'Schulungen planen, Teilnahme bestätigen – der Nachweis kommt automatisch.',
  icon: 'wissen',
  gewicht: 50,
  routen: [
    { pfad: '', element: SchulungenSeite },
    { pfad: 'neu', element: SchulungNeu },
    { pfad: ':id', element: SchulungDetail },
  ],
  erstellen: [{ label: 'Schulung planen', pfad: '/betrieb/schulungen/neu', gewicht: 10 }],
  kurzinfo: () => {
    const t = heute();
    const naechste = schulungen
      .where((s) => s.status === 'geplant')
      .map((s) => db.termine.get(s.terminId))
      .filter((x) => x && datumVon(x.start) >= t)
      .sort((a, b) => a!.start.localeCompare(b!.start))[0];
    return naechste ? { text: `Nächste: ${datum(naechste.start)}`, ton: 'aktiv' } : undefined;
  },
  tabs: [
    {
      objekt: 'mitarbeiter',
      titel: 'Schulungen',
      component: MitarbeiterSchulungenTab,
      gewicht: 50,
      zaehler: (id) => schulungen.where((s) => s.status === 'geplant' && !!db.termine.get(s.terminId)?.mitarbeiterIds.includes(id)).length || undefined,
    },
  ],
  suche: (q) =>
    schulungen
      .all()
      .map((s) => ({ s, t: db.termine.get(s.terminId) }))
      .filter(({ s, t }) => t && passt(q, t.titel, s.anbieter, s.inhalte, 'schulung'))
      .slice(0, 5)
      .map(({ s, t }) => ({ typ: 'Schulung', titel: t!.titel, untertitel: datum(t!.start), pfad: `/betrieb/schulungen/${s.id}`, relevanz: 30 })),
  hinweise: () => schulungenHinweise(),
  aktionen: {
    'schulung.planen': (p) => {
      const { qualifikationId, mitarbeiterIds } = (p ?? {}) as { qualifikationId?: ID; mitarbeiterIds?: ID[] };
      const q = new URLSearchParams();
      if (qualifikationId) q.set('quali', qualifikationId);
      if (mitarbeiterIds?.length) q.set('ma', mitarbeiterIds.join(','));
      return `/betrieb/schulungen/neu${q.size ? `?${q}` : ''}`;
    },
  },
  automationen: [
    {
      id: 'schulungen.nachweise',
      titel: 'Nachweis nach der Schulung',
      beschreibung: 'Schließt du eine Schulung ab, trägt Macher für alle Teilnehmer den Nachweis mit dem richtigen Ablaufdatum ein.',
      standardAn: true,
      minuten: 3,
      start: () =>
        on('schulungen.updated', (e) => {
          const s = e.objekt as Schulung;
          const vorher = e.vorher as Schulung | undefined;
          if (s.status !== 'abgeschlossen' || vorher?.status === 'abgeschlossen') return;
          const n = nachweiseErzeugen(s);
          if (n) erledigt('schulungen.nachweise', `${n === 1 ? '1 Nachweis' : `${n} Nachweise`} nach Schulung eingetragen`, { bezug: { typ: 'termine', id: s.terminId }, text: db.termine.get(s.terminId)?.titel });
        }),
    },
  ],
  seed: () => {
    const beispielTeam = db.mitarbeiter.where((m) => !!m.beispiel && m.rolle === 'monteur');
    if (!beispielTeam.length) return;
    const t = heute();
    const ersteHilfe = db.qualifikationen.all().find((q) => q.name === 'Erste Hilfe');
    const zertifikat = db.qualifikationen.all().find((q) => q.kategorie === 'zertifikat' && q.gueltigMonate);
    if (zertifikat) {
      const termin = db.termine.create({
        art: 'schulung',
        titel: zertifikat.name,
        start: zeitpunkt(plusTage(t, 21), '08:00'),
        ende: zeitpunkt(plusTage(t, 21), '15:00'),
        mitarbeiterIds: [beispielTeam[0].id],
        status: 'geplant',
        beispiel: true,
      });
      schulungen.create({ terminId: termin.id, qualifikationId: zertifikat.id, anbieter: 'Hersteller (bitte anpassen)', inhalte: 'Neuerungen und Sicherheitsregeln\nPraktische Übung\nAbschlusstest', status: 'geplant', beispiel: true });
    }
    if (ersteHilfe && beispielTeam[1]) {
      const termin = db.termine.create({
        art: 'schulung',
        titel: 'Erste Hilfe – Auffrischung',
        start: zeitpunkt(plusTage(t, -35), '08:00'),
        ende: zeitpunkt(plusTage(t, -35), '16:00'),
        mitarbeiterIds: [beispielTeam[1].id],
        status: 'erledigt',
        beispiel: true,
      });
      schulungen.create({
        terminId: termin.id,
        qualifikationId: ersteHilfe.id,
        anbieter: 'Erste-Hilfe-Anbieter vor Ort',
        status: 'abgeschlossen',
        teilgenommenIds: [beispielTeam[1].id],
        abgeschlossenAm: zeitpunkt(plusTage(t, -35), '16:30'),
        beispiel: true,
      });
    }
  },
});
