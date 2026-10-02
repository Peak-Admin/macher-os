import type { Automation } from '@core/modul';
import { taktePruefen } from './browser';

/**
 * Lokaler Planer für die Takte. Läuft nur ohne Backend – mit Backend stellt der Server-Takt
 * (`os/api/takte/cron.ts`) zu, auch wenn niemand die App offen hat.
 */
export const takteAutomation: Automation = {
  id: 'macher.takte',
  titel: 'Feste Takte statt Dauerbeschallung',
  beschreibung: 'Dein Tag um 6:30, Tagesbrief um 7:00, Zeiten bestätigen um 16:30, Wochenbilanz freitags um 15:00 – mit Ruhezeiten je Person.',
  standardAn: true,
  start: () => {
    const t = setInterval(() => void taktePruefen().catch(() => {}), 60_000);
    return () => clearInterval(t);
  },
  pruefen: () => void taktePruefen().catch(() => {}),
};
