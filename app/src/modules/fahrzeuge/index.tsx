import { defineModul } from '@core/modul';
import { BetriebsmittelListe } from '../werkzeuge/BetriebsmittelListe';
import { kurzinfoFuer } from '../werkzeuge/daten';

const Liste = () => <BetriebsmittelListe art="fahrzeug" />;

export default defineModul({
  id: 'fahrzeuge',
  titel: 'Fahrzeuge',
  bereich: 'betrieb',
  gruppe: 'werkzeuge',
  beschreibung: 'Fahrzeuge mit Fahrer, Kennzeichen, Ausstattung und TÜV.',
  icon: 'auto',
  gewicht: 48,
  routen: [{ pfad: '', element: Liste }],
  kurzinfo: () => kurzinfoFuer('fahrzeug'),
  erstellen: [{ label: 'Fahrzeug anlegen', pfad: '/betrieb/werkzeuge/neu?art=fahrzeug', gewicht: 15 }],
});
