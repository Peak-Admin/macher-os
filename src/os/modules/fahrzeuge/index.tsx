import { defineModul } from '@core/modul';
import { kurzinfoFuer } from '../werkzeuge/daten';
import { FahrzeugListe } from './FahrzeugListe';

export default defineModul({
  id: 'fahrzeuge',
  titel: 'Fahrzeuge',
  bereich: 'betrieb',
  gruppe: 'werkzeuge',
  beschreibung: 'Fahrzeuge mit Fahrer, Kennzeichen, Ampel (frei, im Einsatz, nicht fahren) und TÜV.',
  icon: 'auto',
  gewicht: 48,
  routen: [{ pfad: '', element: FahrzeugListe }],
  kurzinfo: () => kurzinfoFuer('fahrzeug'),
  erstellen: [{ label: 'Fahrzeug anlegen', pfad: '/betrieb/werkzeuge/neu?art=fahrzeug', gewicht: 15 }],
});
