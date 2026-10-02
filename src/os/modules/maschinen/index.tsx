import { defineModul } from '@core/modul';
import { BetriebsmittelListe } from '../werkzeuge/BetriebsmittelListe';
import { kurzinfoFuer } from '../werkzeuge/daten';

const Liste = () => <BetriebsmittelListe art="maschine" />;

export default defineModul({
  id: 'maschinen',
  titel: 'Maschinen & Geräte',
  bereich: 'betrieb',
  gruppe: 'werkzeuge',
  beschreibung: 'Größere Geräte und Maschinen: wo sie sind, wer sie hat, wann sie geprüft werden.',
  icon: 'stecker',
  gewicht: 40,
  routen: [{ pfad: '', element: Liste }],
  kurzinfo: () => kurzinfoFuer('maschine'),
  erstellen: [{ label: 'Maschine anlegen', pfad: '/betrieb/werkzeuge/neu?art=maschine', gewicht: 15 }],
});
