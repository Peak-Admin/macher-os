import { defineModul, type HinweisVorschlag } from '@core/modul';
import { db } from '@core/db';
import { on } from '@core/events';
import { benachrichtigen, erledigt } from '@core/macher';
import { heute, passt, plusTage } from '@core/format';
import { darf, istBuero } from '@core/session';
import { STELLE_LABEL, STATUS_LABEL, bewerber, offen, unbeantwortetTage, wartetZuLange, type Bewerber } from './daten';
import { BewerberDetail, BewerberNeu, BewerberSeite } from './Ansichten';

export function bewerberHinweise(t = heute()): HinweisVorschlag[] {
  return bewerber
    .where((b) => wartetZuLange(b, t))
    .map((b) => ({
      schluessel: `bewerber-antwort:${b.id}`,
      art: 'problem' as const,
      titel: `Bewerbung von ${b.vorname} ${b.nachname} seit ${unbeantwortetTage(b, t)} Tagen unbeantwortet`,
      text: `${STELLE_LABEL[b.stelle]} – gute Leute sind schnell bei der Konkurrenz. Antwort mit Vorlage dauert eine Minute.`,
      gewicht: 70,
      fuerRollen: ['chef' as const, 'buero' as const],
      pfad: `/betrieb/bewerber/${b.id}`,
    }));
}

export default defineModul({
  id: 'bewerber',
  titel: 'Bewerber',
  bereich: 'betrieb',
  gruppe: 'team',
  beschreibung: 'Bewerbungen schnell erfassen, mit Vorlagen antworten, bei Zusage direkt einstellen.',
  icon: 'person',
  gewicht: 45,
  rollen: ['chef', 'buero'],
  routen: [
    { pfad: '', element: BewerberSeite },
    { pfad: 'neu', element: BewerberNeu },
    { pfad: ':id', element: BewerberDetail },
  ],
  erstellen: [{ label: 'Bewerbung erfassen', pfad: '/betrieb/bewerber/neu', gewicht: 5 }],
  kurzinfo: () => {
    const t = heute();
    const warten = bewerber.where((b) => wartetZuLange(b, t)).length;
    if (warten) return { text: `${warten} warten auf Antwort`, ton: 'achtung' };
    const n = bewerber.where(offen).length;
    return n ? { text: n === 1 ? '1 offene Bewerbung' : `${n} offene Bewerbungen`, ton: 'aktiv' } : undefined;
  },
  suche: (q) =>
    darf('personal') || istBuero()
      ? bewerber
          .where((b) => passt(q, b.vorname, b.nachname, b.email, b.telefon, 'bewerber bewerbung'))
          .slice(0, 5)
          .map((b) => ({ typ: 'Bewerber', titel: `${b.vorname} ${b.nachname}`, untertitel: `${STELLE_LABEL[b.stelle]} · ${STATUS_LABEL[b.status]}`, pfad: `/betrieb/bewerber/${b.id}`, relevanz: 25 }))
      : [],
  hinweise: () => bewerberHinweise(),
  automationen: [
    {
      id: 'bewerber.eingang',
      titel: 'Neue Bewerbung melden',
      beschreibung: 'Kommt eine Bewerbung rein, bekommt der Chef sofort Bescheid – damit niemand zu lange wartet.',
      standardAn: true,
      minuten: 2,
      start: () =>
        on('bewerber.created', (e) => {
          const b = e.objekt as Bewerber;
          if (b.beispiel) return;
          const chefs = db.mitarbeiter.where((m) => m.aktiv && m.rolle === 'chef' && m.id !== b.erstelltVon);
          for (const c of chefs) benachrichtigen(`Neue Bewerbung: ${b.vorname} ${b.nachname}`, { text: STELLE_LABEL[b.stelle], fuer: c.id, art: 'bewerbung.neu', grund: 'Du entscheidest über Bewerbungen.' });
          if (chefs.length) erledigt('bewerber.eingang', `Chef über Bewerbung von ${b.vorname} informiert`);
        }),
    },
  ],
  seed: () => {
    if (!db.mitarbeiter.all().some((m) => m.beispiel)) return;
    const t = heute();
    bewerber.create({ vorname: 'Kevin', nachname: 'Brandt', telefon: '0176 0000000', email: 'kevin.brandt@example.de', stelle: 'monteur', quelle: 'jobportal', status: 'neu', eingegangenAm: plusTage(t, -5), notiz: 'Geselle, sucht Betrieb in der Nähe.', beispiel: true });
    bewerber.create({ vorname: 'Laura', nachname: 'Meier', telefon: '0157 0000000', stelle: 'azubi', quelle: 'aushang', status: 'gespraech', eingegangenAm: plusTage(t, -9), beantwortetAm: new Date(Date.now() - 6 * 86_400_000).toISOString(), beispiel: true });
    bewerber.create({ vorname: 'Tobias', nachname: 'Schäfer', email: 'tobias.schaefer@example.de', stelle: 'monteur', quelle: 'empfehlung', status: 'probearbeiten', eingegangenAm: plusTage(t, -16), beantwortetAm: new Date(Date.now() - 10 * 86_400_000).toISOString(), notiz: 'Empfohlen von Jonas.', beispiel: true });
  },
});
