import { defineModul } from '@core/modul';
import { HinweiseAnsicht } from './HinweiseAnsicht';

export default defineModul({
  id: 'hinweise',
  titel: 'Hinweise & Freigaben',
  bereich: 'macher',
  beschreibung: 'Holt dich nur dann dazu, wenn eine Entscheidung oder Freigabe nötig ist.',
  icon: 'achtung',
  gewicht: 75,
  navigation: 'haupt',
  routen: [{ pfad: '', element: HinweiseAnsicht }],
});
