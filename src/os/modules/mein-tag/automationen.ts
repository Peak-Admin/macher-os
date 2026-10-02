/**
 * Automation „Tagesplan verschicken“: Jeder, der heute Termine hat, bekommt morgens
 * eine Benachrichtigung mit seinem Tag. Ersetzt die WhatsApp-Runde vom Chef.
 */
import { db } from '@core/db';
import { einstellung, setzeEinstellung } from '@core/einstellungen';
import { benachrichtigen, erledigt } from '@core/macher';
import { isoDatum } from '@core/format';
import type { Automation } from '@core/modul';
import { ortKurz, termineAm, zeitText } from './logik';

export const TAGESPLAN_ID = 'heute.tagesplan';
/** Schätzung: eine Nachricht mit dem Tagesplan tippen ≈ 2 Minuten je Person */
export const TAGESPLAN_MINUTEN_JE_PERSON = 2;
/** frühestens ab dieser Stunde verschicken */
export const TAGESPLAN_AB_STUNDE = 5;

/** Verschickt den Tagesplan einmal pro Tag. Gibt die Anzahl der Empfänger zurück. */
export function tagesplanVerschicken(jetzt = new Date()): number {
  const tag = isoDatum(jetzt);
  if (jetzt.getHours() < TAGESPLAN_AB_STUNDE) return 0;
  if (!db.betrieb.get('betrieb')?.onboardingFertig) return 0;
  if (einstellung<string | undefined>(`${TAGESPLAN_ID}.zuletzt`, undefined) === tag) return 0;
  setzeEinstellung(`${TAGESPLAN_ID}.zuletzt`, tag);

  let n = 0;
  for (const m of db.mitarbeiter.where((x) => x.aktiv)) {
    const termine = termineAm(tag, m.id);
    if (!termine.length) continue;
    const erster = termine[0];
    const wo = ortKurz(erster);
    benachrichtigen(termine.length === 1 ? 'Dein Tag: 1 Termin' : `Dein Tag: ${termine.length} Termine`, {
      text: `Los geht's ${zeitText(erster).split('–')[0]} mit „${erster.titel}“${wo ? ` (${wo})` : ''}.`,
      bezug: { typ: 'termine', id: erster.id },
      fuer: m.id,
    });
    n++;
  }
  if (n > 0) {
    erledigt(TAGESPLAN_ID, n === 1 ? 'Tagesplan an 1 Person geschickt' : `Tagesplan an ${n} Personen geschickt`, {
      text: 'Jeder mit Terminen heute hat seinen Tag als Benachrichtigung bekommen.',
      minuten: n * TAGESPLAN_MINUTEN_JE_PERSON,
    });
  }
  return n;
}

export const tagesplanAutomation: Automation = {
  id: TAGESPLAN_ID,
  titel: 'Tagesplan an das Team schicken',
  beschreibung: 'Jeden Morgen bekommt jeder mit Terminen seinen Tag als Benachrichtigung.',
  standardAn: true,
  minuten: TAGESPLAN_MINUTEN_JE_PERSON,
  start: () => {
    const t = setInterval(() => tagesplanVerschicken(), 15 * 60_000);
    return () => clearInterval(t);
  },
  pruefen: () => void tagesplanVerschicken(),
};
