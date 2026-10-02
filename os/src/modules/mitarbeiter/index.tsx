import { defineModul } from '@core/modul';
import { db } from '@core/db';
import { erledigt } from '@core/macher';
import { datum, datumVon, heute, passt, personName } from '@core/format';
import { MitarbeiterListe } from './MitarbeiterListe';
import { MitarbeiterDetail } from './MitarbeiterDetail';
import { MitarbeiterForm } from './MitarbeiterForm';
import { ROLLE_LABEL, istAktiv } from './team';

/** Ausgetretene, die noch in kommenden Terminen stehen */
export function termineNachAustritt(t = heute()) {
  return db.mitarbeiter
    .where((m) => !!m.austritt)
    .map((m) => ({
      m,
      termine: db.termine.where(
        (x) => x.mitarbeiterIds.includes(m.id) && datumVon(x.start) > m.austritt! && datumVon(x.start) >= t && x.status !== 'abgesagt' && x.status !== 'erledigt',
      ),
    }))
    .filter((x) => x.termine.length);
}

/** Austritt erreicht → Mitarbeiter auf „ausgetreten“ stellen. Gibt die Anzahl zurück. */
export function austritteAbschliessen(t = heute()): number {
  const faellig = db.mitarbeiter.where((m) => m.aktiv && !!m.austritt && m.austritt < t);
  for (const m of faellig) {
    db.mitarbeiter.update(m.id, { aktiv: false }, { text: 'Automatisch auf ausgetreten gestellt' });
    erledigt('mitarbeiter.austritt', `${personName(m)} auf ausgetreten gestellt`, { bezug: { typ: 'mitarbeiter', id: m.id }, text: `Letzter Arbeitstag war der ${datum(m.austritt)}.` });
  }
  return faellig.length;
}

export default defineModul({
  id: 'mitarbeiter',
  titel: 'Mitarbeiter',
  bereich: 'betrieb',
  gruppe: 'team',
  beschreibung: 'Dein Team: Rollen, Kontakt, Wochenstunden und alles rund um jeden Mitarbeiter.',
  icon: 'team',
  gewicht: 80,
  routen: [
    { pfad: '', element: MitarbeiterListe },
    { pfad: 'neu', element: MitarbeiterForm },
    { pfad: ':id', element: MitarbeiterDetail },
    { pfad: ':id/bearbeiten', element: MitarbeiterForm },
  ],
  detail: [{ objekt: 'mitarbeiter', pfad: (id) => `/betrieb/mitarbeiter/${id}` }],
  erstellen: [{ label: 'Mitarbeiter anlegen', pfad: '/betrieb/mitarbeiter/neu', gewicht: 20 }],
  kurzinfo: () => {
    const n = db.mitarbeiter.where((m) => istAktiv(m)).length;
    return n ? { text: n === 1 ? '1 Person im Team' : `${n} Personen im Team` } : undefined;
  },
  suche: (q) =>
    db.mitarbeiter
      .where((m) => passt(q, m.vorname, m.nachname, m.telefon, m.email, m.team, ROLLE_LABEL[m.rolle]))
      .slice(0, 6)
      .map((m) => ({
        typ: 'Mitarbeiter',
        titel: personName(m),
        untertitel: [ROLLE_LABEL[m.rolle], m.telefon, istAktiv(m) ? undefined : 'ausgetreten'].filter(Boolean).join(' · '),
        pfad: `/betrieb/mitarbeiter/${m.id}`,
        relevanz: istAktiv(m) ? 55 : 20,
      })),
  hinweise: () =>
    termineNachAustritt().map(({ m, termine }) => ({
      schluessel: `mitarbeiter-austritt-termine:${m.id}`,
      art: 'problem' as const,
      titel: `${personName(m)} ist ab ${datum(m.austritt)} nicht mehr da – ${termine.length === 1 ? '1 Termin' : `${termine.length} Termine`} umplanen`,
      text: termine
        .slice(0, 3)
        .map((t) => `${datum(t.start)}: ${t.titel}`)
        .join(' · '),
      bezug: { typ: 'mitarbeiter' as const, id: m.id },
      gewicht: 70,
      fuerRollen: ['chef', 'buero'],
      aktionen: termine[0].auftragId ? [{ aktion: 'plan.einplanen', label: 'Umplanen', primaer: true, payload: { auftragId: termine[0].auftragId } }] : undefined,
      pfad: `/betrieb/mitarbeiter/${m.id}`,
    })),
  automationen: [
    {
      id: 'mitarbeiter.austritt',
      titel: 'Austritt automatisch abschließen',
      beschreibung: 'Ist der letzte Arbeitstag vorbei, stellt Macher den Mitarbeiter auf „ausgetreten“. Er verschwindet aus Planung und Auswahllisten, seine Daten bleiben erhalten.',
      standardAn: true,
      minuten: 2,
      start: () => () => {},
      pruefen: () => {
        austritteAbschliessen();
      },
    },
  ],
});
