import { defineModul } from '@core/modul';
import { Demo } from './Demo';
import { SpielwieseLeiste } from './Spielwiese';
import { Willkommen } from './Willkommen';

export default defineModul({
  id: 'onboarding',
  titel: 'Onboarding',
  bereich: 'macher',
  beschreibung: 'Magic Setup: eine Frage, Website angeben – Lotte richtet Betrieb, Gewerk und Leistungen ein. Ohne Website ein Tipp aufs Gewerk.',
  icon: 'start',
  gewicht: 40,
  navigation: 'versteckt',
  vollbildRouten: [
    { pfad: '/willkommen', element: Willkommen },
    { pfad: '/demo', element: Demo },
  ],
  leiste: SpielwieseLeiste,
});
