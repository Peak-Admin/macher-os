import { defineModul } from '@core/modul';
import { Willkommen } from './Willkommen';

export default defineModul({
  id: 'onboarding',
  titel: 'Onboarding',
  bereich: 'macher',
  beschreibung: 'Richtet Macher OS in zwei Minuten nach Gewerk, Leistungen und Arbeitsweise ein.',
  icon: 'start',
  gewicht: 40,
  navigation: 'versteckt',
  vollbildRouten: [{ pfad: '/willkommen', element: Willkommen }],
});
