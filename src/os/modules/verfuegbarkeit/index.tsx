import { defineModul } from '@core/modul';
import { heute } from '@core/format';
import { anwesenheit, kontextAusDb } from './daten';
import { WerIstDa } from './WerIstDa';

export default defineModul({
  id: 'verfuegbarkeit',
  titel: 'Verfügbarkeit',
  bereich: 'plan',
  beschreibung: 'Wer ist wann da – Arbeitszeiten, Urlaub, Krankheit und Berufsschule auf einen Blick.',
  icon: 'uhr',
  gewicht: 64,
  routen: [{ pfad: '', element: WerIstDa }],
  kurzinfo: () => {
    const k = kontextAusDb();
    const aktiv = k.mitarbeiter.filter((m) => m.aktiv);
    if (!aktiv.length) return undefined;
    const da = aktiv.filter((m) => anwesenheit(m.id, heute(), k).status === 'da').length;
    return { text: `Heute ${da} von ${aktiv.length} da`, ton: da < aktiv.length ? 'aktiv' : 'erfolg' };
  },
});
