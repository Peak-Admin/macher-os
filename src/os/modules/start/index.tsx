/**
 * Modul „start“ (First Value): „Was möchtest du als Erstes erledigen?“ unter /start,
 * Angebot in drei Minuten (/start/angebot), Rechnung in einer Minute (/start/rechnung),
 * „Handwerk OS einrichten“ auf Home und die Messung des ersten echten Nutzens (drei Pfade).
 */
import { defineModul } from '@core/modul';
import { on } from '@core/events';
import { einstellung, setzeEinstellung } from '@core/einstellungen';
import { messen } from '@core/messung';
import { istSpielwiese } from '@core/seed';
import { serverVersandEinrichten } from '@core/cloud-versand';
import { AngebotSchnell } from '@modules/angebote/AngebotSchnell';
import { RechnungSchnell } from '@modules/rechnungen/RechnungSchnell';
import { StartSeite } from './StartSeite';
import { DATEN_UEBERNOMMEN, ERSTWERT_KEY, erstwertPfad, TEAM_EINGELADEN } from './daten';

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
    on('import.abgeschlossen', () => setzeEinstellung(DATEN_UEBERNOMMEN, true));
    // Erster echter Nutzen: Angebot vorbereitet · Auftrag angelegt · Daten übernommen – genau einmal gemessen
    const erstwert = (e: Parameters<typeof erstwertPfad>[0]) => {
      const pfad = erstwertPfad(e);
      if (!pfad || istSpielwiese() || einstellung<unknown>(ERSTWERT_KEY, undefined)) return;
      const fertigAm = einstellung<string | undefined>('setup.fertigAm', undefined);
      setzeEinstellung(ERSTWERT_KEY, { pfad, am: new Date().toISOString() });
      messen('erstwert.erreicht', { pfad, ...(fertigAm ? { sekundenNachSetup: Math.round((Date.now() - Date.parse(fertigAm)) / 1000) } : {}) });
    };
    for (const typ of ['angebot.erstellt', 'auftrag.angelegt', 'import.abgeschlossen']) on(typ, (e) => erstwert(e as Parameters<typeof erstwertPfad>[0]));
  },
});
