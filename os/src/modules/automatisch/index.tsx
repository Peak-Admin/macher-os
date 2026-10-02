import { defineModul } from '@core/modul';
import { pruefungAutomation } from './daten';
import { Uebersicht } from './Uebersicht';

export default defineModul({
  id: 'automatisch',
  titel: 'Automatisch erledigen',
  bereich: 'macher',
  beschreibung: 'Führt wiederkehrende Verwaltungsarbeit nach festen Regeln automatisch aus.',
  icon: 'wiederholen',
  gewicht: 60,
  navigation: 'haupt',
  routen: [{ pfad: '', element: Uebersicht }],
  automationen: [pruefungAutomation],
});
