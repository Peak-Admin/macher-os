/**
 * Modul „start“ (First Value): „Was willst du als Erstes erledigen?“ unter /start,
 * Angebot in drei Minuten (/start/angebot), Rechnung in einer Minute (/start/rechnung)
 * und die „Dein Start“-Karte auf Heute.
 */
import { defineModul } from '@core/modul';
import { on } from '@core/events';
import { setzeEinstellung } from '@core/einstellungen';
import { serverVersandEinrichten } from '@core/cloud-versand';
import { AngebotSchnell } from '@modules/angebote/AngebotSchnell';
import { RechnungSchnell } from '@modules/rechnungen/RechnungSchnell';
import { StartSeite } from './StartSeite';
import { TEAM_EINGELADEN } from './daten';

export default defineModul({
  id: 'start',
  titel: 'Start',
  bereich: 'heute',
  beschreibung: 'Das erste Angebot oder die erste Rechnung in wenigen Minuten beim Kunden.',
  icon: 'start',
  gewicht: 88,
  navigation: 'versteckt',
  routen: [
    { pfad: '/start', element: StartSeite },
    { pfad: '/start/angebot', element: AngebotSchnell },
    { pfad: '/start/rechnung', element: RechnungSchnell },
  ],
  erstellen: [
    { label: 'Angebot in 3 Minuten', pfad: '/start/angebot', gewicht: 80 },
    { label: 'Rechnung in 1 Minute', pfad: '/start/rechnung', gewicht: 60 },
  ],
  init: () => {
    // E-Mails über Resend (/api/senden), solange kein vollständiges Backend verbunden ist
    serverVersandEinrichten();
    // „Team eingeladen“-Haken: Einladen meldet das Paket Setup/Fundament über dieses Event
    on('team.eingeladen', () => setzeEinstellung(TEAM_EINGELADEN, true));
  },
});
