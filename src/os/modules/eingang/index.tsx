import { defineModul } from '@core/modul';
import { db } from '@core/db';
import { einstellung, setzeEinstellung } from '@core/einstellungen';
import { on } from '@core/events';
import { messen } from '@core/messung';
import { ich } from '@core/session';
import { EingangSeite } from './Eingang';
import { eingangsAnzahl } from './daten';
import { aktivierung } from './aktivierung';

const GEMESSEN = 'messung.aktivierung.erreicht';

/** Einmal messen, sobald der Betrieb aktiviert ist (Definition im PRD, Abschnitt 3) */
function aktivierungPruefen() {
  if (einstellung(GEMESSEN, false)) return;
  const betrieb = db.betrieb.get('betrieb');
  if (!betrieb?.onboardingFertig) return;
  const a = aktivierung({
    start: betrieb.erstelltAm,
    auftraege: db.auftraege.allMitGeloeschten(),
    rechnungen: db.rechnungen.allMitGeloeschten(),
    zeiten: db.zeiten.allMitGeloeschten(),
    dokumente: db.dokumente.allMitGeloeschten(),
    mitarbeiter: db.mitarbeiter.all(),
  });
  if (!a.erreicht) return;
  setzeEinstellung(GEMESSEN, a.erreichtAm);
  messen('aktivierung.erreicht', { tage: a.tage ?? 0, auftraege: a.kriterien.auftraege });
}

export default defineModul({
  id: 'eingang',
  titel: 'Eingang',
  bereich: 'auftraege',
  beschreibung: 'Anfragen, Kundennachrichten und Freigaben an einem Ort – neueste oben, je Eintrag ein Klick.',
  icon: 'mail',
  gewicht: 92,
  rollen: ['chef', 'buero'],
  routen: [{ pfad: '', element: EingangSeite }],
  kurzinfo: () => {
    const n = eingangsAnzahl(ich());
    return n ? { text: n === 1 ? '1 neuer Eintrag im Eingang' : `${n} neue Einträge im Eingang`, ton: 'achtung' } : { text: 'Eingang leer' };
  },
  init: () => {
    let t: ReturnType<typeof setTimeout> | undefined;
    on('*', (e) => {
      if (t || !/^(auftraege|rechnungen|zeiten|dokumente)\./.test(e.typ)) return;
      t = setTimeout(() => ((t = undefined), aktivierungPruefen()), 1500);
    });
    setTimeout(aktivierungPruefen, 0);
  },
});
