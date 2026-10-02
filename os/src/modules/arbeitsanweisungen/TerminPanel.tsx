import { db } from '@core/db';
import type { ID } from '@core/objects';
import { Button, Karte, Stapel } from '@ui/index';
import { anweisungPfad, anweisungenFuerTermin, arbeitsanweisungen } from './daten';
import { AnweisungAnsicht } from './AnweisungAnsicht';

/** Für den Monteur am Termin: was ist hier zu tun? */
export function AnweisungTerminPanel({ id }: { id: ID }) {
  const t = db.termine.useOne(id);
  const alle = arbeitsanweisungen.use();
  if (!t) return null;
  const liste = anweisungenFuerTermin(alle, t);
  if (!liste.length) return null;
  return (
    <Stapel abstand={16}>
      {liste.map((x) => (
        <Karte key={x.id} oberzeile="Arbeitsanweisung" titel={x.titel} kompakt>
          <Stapel abstand={12}>
            <AnweisungAnsicht x={x} kurz />
            <div>
              <Button variante="tertiaer" klein to={anweisungPfad(x.id)}>
                Ganz ansehen
              </Button>
            </div>
          </Stapel>
        </Karte>
      ))}
    </Stapel>
  );
}
