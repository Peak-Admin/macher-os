import { datum } from '@core/format';
import { Meldung } from '@ui/index';
import type { Pruefung } from './daten';

/** Ergebnis der automatischen Gewährleistungsprüfung – Text, nicht nur Farbe */
export function Pruefbox({ p }: { p: Pruefung }) {
  if (p.ergebnis === 'unklar')
    return (
      <Meldung ton="achtung" titel="Gewährleistung unklar">
        {p.quelle}. Trag das Abnahme- oder Abschlussdatum ein, dann prüft Macher automatisch.
      </Meldung>
    );
  if (p.ergebnis === 'gewaehrleistung')
    return (
      <Meldung ton="erfolg" titel={`Auf Gewährleistung – bis ${datum(p.bis)}`}>
        {p.quelle}. Noch {p.restTage} Tage. Die Nacharbeit wird nicht berechnet.
      </Meldung>
    );
  return (
    <Meldung ton="neutral" titel={`Gewährleistung abgelaufen am ${datum(p.bis)}`}>
      {p.quelle}. Die Arbeit ist kostenpflichtig – oder du entscheidest dich für Kulanz.
    </Meldung>
  );
}
