import { useState } from 'react';
import { db } from '@core/db';
import type { ID } from '@core/objects';
import { Abschnitt, Button, Karte, Liste, Meta, Stapel } from '@ui/index';
import { ChecklistenAmAuftrag } from '../checklisten/ChecklistenAmAuftrag';
import { AufgabeFormular } from './AufgabeFormular';
import { AufgabeZeile } from './AufgabeZeile';
import { sortiere } from './logik';

/** Tab „Aufgaben & Checklisten“ in der Auftragsakte */
export function AufgabenAmAuftrag({ id }: { id: ID }) {
  const [neu, setNeu] = useState(false);
  const [erledigteZeigen, setErledigteZeigen] = useState(false);
  const alle = db.aufgaben.use((a) => a.auftragId === id, [id]);
  const offen = sortiere(alle.filter((a) => !a.erledigt));
  const erledigt = alle.filter((a) => a.erledigt);
  return (
    <Stapel abstand={32}>
      <Abschnitt
        titel="Aufgaben"
        aktion={
          !neu && (
            <Button variante="sekundaer" klein icon="plus" onClick={() => setNeu(true)}>
              Aufgabe
            </Button>
          )
        }
      >
        {neu && (
          <Karte kompakt>
            <AufgabeFormular auftragId={id} kompakt onFertig={() => setNeu(false)} />
          </Karte>
        )}
        <Liste leer={!neu && <Meta>Keine offenen Aufgaben an diesem Auftrag.</Meta>}>
          {offen.map((a) => (
            <AufgabeZeile key={a.id} a={a} ohneAuftrag />
          ))}
        </Liste>
        {erledigt.length > 0 && (
          <>
            <div>
              <Button variante="tertiaer" klein onClick={() => setErledigteZeigen(!erledigteZeigen)}>
                {erledigteZeigen ? 'Erledigte ausblenden' : `${erledigt.length} erledigte zeigen`}
              </Button>
            </div>
            {erledigteZeigen && (
              <Liste>
                {erledigt.map((a) => (
                  <AufgabeZeile key={a.id} a={a} ohneAuftrag />
                ))}
              </Liste>
            )}
          </>
        )}
      </Abschnitt>
      <Abschnitt titel="Checklisten">
        <ChecklistenAmAuftrag auftragId={id} />
      </Abschnitt>
    </Stapel>
  );
}
