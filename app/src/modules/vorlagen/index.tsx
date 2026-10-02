import { defineModul } from '@core/modul';
import { batch, db } from '@core/db';
import { passt } from '@core/format';
import { VorlagenListe } from './VorlagenListe';
import { VorlageBearbeiten } from './VorlageBearbeiten';
import { Briefkopf } from './Briefkopf';
import { startVorlagen, vorlagen } from './daten';

export default defineModul({
  id: 'vorlagen',
  titel: 'Vorlagen & Formulare',
  bereich: 'betrieb',
  gruppe: 'unternehmen',
  beschreibung: 'Texte für Angebot, Rechnung, Mahnung, E-Mail und Termin – mit Platzhaltern.',
  icon: 'dokument',
  gewicht: 56,
  routen: [
    { pfad: '', element: VorlagenListe },
    { pfad: 'briefkopf', element: Briefkopf },
    { pfad: ':id', element: VorlageBearbeiten },
  ],
  kurzinfo: () => {
    const n = vorlagen.all().length;
    return { text: n === 1 ? '1 Vorlage' : `${n} Vorlagen` };
  },
  suche: (q) =>
    vorlagen
      .where((v) => passt(q, v.titel, v.betreff, v.schluessel))
      .slice(0, 5)
      .map((v) => ({ typ: 'Vorlage', titel: v.titel, untertitel: v.betreff || undefined, pfad: `/betrieb/vorlagen/${v.id}`, relevanz: 20 })),
  seed: () => {
    if (vorlagen.allMitGeloeschten().length) return;
    const gewerk = db.betrieb.get('betrieb')?.gewerk ?? 'sonstiges';
    batch(() => startVorlagen(gewerk).forEach((v) => vorlagen.create(v, { leise: true })));
  },
});
