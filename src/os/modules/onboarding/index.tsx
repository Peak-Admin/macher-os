import { defineModul } from '@core/modul';
import { SpielwieseLeiste } from './Spielwiese';
import { Willkommen } from './Willkommen';

export default defineModul({
  id: 'onboarding',
  titel: 'Onboarding',
  bereich: 'macher',
  beschreibung: 'Richtet Macher OS in unter fünf Minuten mit deinen eigenen Daten ein: Briefkopf, Kunden, Preise, Team.',
  icon: 'start',
  gewicht: 40,
  navigation: 'versteckt',
  vollbildRouten: [{ pfad: '/willkommen', element: Willkommen }],
  global: SpielwieseLeiste,
});
