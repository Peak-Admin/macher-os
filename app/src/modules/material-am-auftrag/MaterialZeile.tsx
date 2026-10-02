import { db } from '@core/db';
import { euro, zahl } from '@core/format';
import { useDarf } from '@core/session';
import type { Materialbuchung } from '@core/objects';
import { BeispielMarke, Button, IconButton, ListenZeile, Status, useToast } from '@ui/index';
import { STATUS_LABEL, WEITER_LABEL, naechsterStatus, wert } from './logik';
import { statusSetzen } from './daten';

export function MaterialZeile({ b, mitAuftrag }: { b: Materialbuchung; mitAuftrag?: boolean }) {
  const darfGeld = useDarf('geld');
  const darfSchreiben = useDarf('schreiben');
  const toast = useToast();
  const weiter = naechsterStatus(b.status);
  const a = mitAuftrag ? db.auftraege.get(b.auftragId) : undefined;
  const rechnung = db.rechnungen.get(b.abgerechnetIn);
  return (
    <ListenZeile
      titel={
        <>
          {b.text} <BeispielMarke zeigen={b.beispiel} />
        </>
      }
      untertitel={[`${zahl(b.menge)} ${b.einheit}`, darfGeld ? `EK ${euro(wert(b))}` : null, a ? `${a.nummer} · ${a.titel}` : null, rechnung ? `in ${rechnung.nummer}` : null].filter(Boolean).join(' · ')}
      rechts={
        <>
          <Status ton={b.status === 'verbraucht' ? (b.abgerechnetIn ? 'erfolg' : 'aktiv') : b.status === 'bereit' ? 'erfolg' : 'neutral'}>
            {b.status === 'verbraucht' && b.abgerechnetIn ? 'Abgerechnet' : STATUS_LABEL[b.status]}
          </Status>
          {darfSchreiben && weiter && (
            <Button
              variante="sekundaer"
              klein
              onClick={() => {
                statusSetzen(b.id, weiter);
                toast(`${b.text}: ${STATUS_LABEL[weiter]}.`, { aktion: { label: 'Rückgängig', onClick: () => statusSetzen(b.id, b.status) } });
              }}
            >
              {WEITER_LABEL[b.status]}
            </Button>
          )}
          {darfSchreiben && !b.abgerechnetIn && (
            <IconButton
              icon="muell"
              label={`${b.text} entfernen`}
              onClick={() => {
                db.material.remove(b.id);
                toast('Material entfernt.', { aktion: { label: 'Rückgängig', onClick: () => db.material.restore(b.id) } });
              }}
            />
          )}
        </>
      }
    />
  );
}
