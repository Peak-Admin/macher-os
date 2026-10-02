import { defineModul } from '@core/modul';
import { einstellung } from '@core/einstellungen';
import { STANDARD_RECHTE } from '@core/session';
import { RollenRechte } from './RollenRechte';
import { gleich, type Matrix } from './daten';

export default defineModul({
  id: 'rollen',
  titel: 'Rollen & Rechte',
  bereich: 'betrieb',
  gruppe: 'unternehmen',
  beschreibung: 'Wer was sehen und ändern darf – Chef, Büro, Monteur, Azubi.',
  icon: 'schloss',
  gewicht: 30,
  navigation: 'hub',
  rollen: ['chef', 'buero'],
  routen: [{ pfad: '', element: RollenRechte }],
  kurzinfo: () => ({ text: gleich(einstellung<Matrix>('rollen.rechte', STANDARD_RECHTE), STANDARD_RECHTE) ? 'Standardrechte' : 'Angepasste Rechte' }),
  suche: (q) =>
    /recht|rolle|zugriff|monteur sieht|berechtig/i.test(q) ? [{ typ: 'Einstellung', titel: 'Rollen & Rechte', untertitel: 'Wer was sehen und ändern darf', pfad: '/betrieb/rollen', relevanz: 25 }] : [],
});
