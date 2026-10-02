/** „Macher fertig machen“: die vier optionalen Haken aus den echten Daten (Home zeigt sie im nächsten Schritt). */
import { db } from '@core/db';
import { useEinstellung } from '@core/einstellungen';
import { DATEN_UEBERNOMMEN, START_AUS, startHaken, TEAM_EINGELADEN, type Haken } from './daten';

export function useStartHaken(): Haken[] {
  const betrieb = db.betrieb.useOne('betrieb');
  const kunden = db.kunden.use();
  const mitarbeiter = db.mitarbeiter.use();
  const [teamEingeladen] = useEinstellung(TEAM_EINGELADEN, false);
  const [datenUebernommen] = useEinstellung(DATEN_UEBERNOMMEN, false);
  const [aus] = useEinstellung(START_AUS, false);
  if (aus) return [];
  return startHaken({ betrieb, kunden, mitarbeiter, teamEingeladen, datenUebernommen });
}
