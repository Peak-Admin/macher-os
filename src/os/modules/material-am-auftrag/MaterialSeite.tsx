import { useState } from 'react';
import { db } from '@core/db';
import { euro } from '@core/format';
import { useDarf } from '@core/session';
import { Button, Dialog, Filter, Leer, Liste, Meta, Seite, Stapel } from '@ui/index';
import { MaterialFormular } from './MaterialFormular';
import { MaterialZeile } from './MaterialZeile';
import { STATUS_LABEL, offenFuerRechnung, summeEk, type MaterialStatus } from './logik';

type Sicht = 'geplant' | 'bestellt' | 'bereit' | 'abrechnen';

/** Material über alle laufenden Aufträge: was fehlt, was kommt, was muss auf die Rechnung */
export function MaterialSeite() {
  const darfGeld = useDarf('geld');
  const [sicht, setSicht] = useState<Sicht>('geplant');
  const [neu, setNeu] = useState(false);
  const alle = db.material.use((b) => {
    const a = db.auftraege.get(b.auftragId);
    return !!a && !a.geloeschtAm && a.phase !== 'verloren';
  });
  const laufend = alle.filter((b) => db.auftraege.get(b.auftragId)?.phase !== 'erledigt');
  const nach = (s: MaterialStatus) => laufend.filter((b) => b.status === s);
  const abrechnen = alle.filter(offenFuerRechnung);
  const liste = (sicht === 'abrechnen' ? abrechnen : nach(sicht)).sort((a, b) => a.auftragId.localeCompare(b.auftragId) || a.text.localeCompare(b.text, 'de'));
  const leerText: Record<Sicht, string> = {
    geplant: 'Nichts geplant, das noch bestellt werden muss.',
    bestellt: 'Keine offenen Bestellungen an Aufträgen.',
    bereit: 'Kein Material liegt bereit.',
    abrechnen: 'Alles verbrauchte Material ist abgerechnet.',
  };
  return (
    <Seite titel="Material am Auftrag" untertitel="Was gebraucht, bestellt, bereitgelegt und verbaut wird." aktion={<Button icon="plus" onClick={() => setNeu(true)}>Material buchen</Button>}>
      <Stapel abstand={12}>
        <Filter<Sicht>
          label="Status"
          wert={sicht}
          onChange={setSicht}
          optionen={[
            { wert: 'geplant', label: STATUS_LABEL.geplant, zaehler: nach('geplant').length },
            { wert: 'bestellt', label: STATUS_LABEL.bestellt, zaehler: nach('bestellt').length },
            { wert: 'bereit', label: STATUS_LABEL.bereit, zaehler: nach('bereit').length },
            { wert: 'abrechnen', label: 'Noch abzurechnen', zaehler: abrechnen.length },
          ]}
        />
        {darfGeld && liste.length > 0 && <Meta>Summe EK: {euro(summeEk(liste))}</Meta>}
      </Stapel>
      <Liste leer={<Leer titel="Hier ist nichts offen" text={leerText[sicht]} icon="paket" />}>
        {liste.map((b) => (
          <MaterialZeile key={b.id} b={b} mitAuftrag />
        ))}
      </Liste>
      <Dialog offen={neu} onSchliessen={() => setNeu(false)} titel="Material buchen" icon="paket">
        <MaterialFormular onFertig={() => setNeu(false)} />
      </Dialog>
    </Seite>
  );
}
