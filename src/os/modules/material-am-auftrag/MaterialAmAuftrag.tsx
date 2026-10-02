import { useState } from 'react';
import { db } from '@core/db';
import { euro } from '@core/format';
import { useDarf } from '@core/session';
import type { ID } from '@core/objects';
import { Abschnitt, Button, Karte, Kennzahl, Leer, Liste, Raster, Stapel } from '@ui/index';
import { MaterialFormular } from './MaterialFormular';
import { MaterialZeile } from './MaterialZeile';
import { STATUS_LABEL, STATUS_REIHE, offenFuerRechnung, summeEk } from './logik';

/** Tab „Material“ in der Auftragsakte */
export function MaterialAmAuftrag({ id }: { id: ID }) {
  const darfGeld = useDarf('geld');
  const [neu, setNeu] = useState(false);
  const liste = db.material.use((b) => b.auftragId === id, [id]);
  const offen = liste.filter(offenFuerRechnung);
  const neuKnopf = (
    <Button variante={liste.length ? 'sekundaer' : 'primaer'} klein={!!liste.length} icon="plus" onClick={() => setNeu(true)}>
      Material buchen
    </Button>
  );
  return (
    <Stapel abstand={24}>
      {darfGeld && liste.length > 0 && (
        <Raster min={160}>
          <Kennzahl label="Material EK gesamt" wert={euro(summeEk(liste))} />
          <Kennzahl label="Davon verbraucht" wert={euro(summeEk(liste, 'verbraucht'))} />
          <Kennzahl label="Noch nicht abgerechnet" wert={offen.length ? euro(summeEk(offen)) : 'Nichts offen'} ton={offen.length ? 'achtung' : 'erfolg'} hinweis={offen.length ? (offen.length === 1 ? '1 Position' : `${offen.length} Positionen`) : undefined} />
        </Raster>
      )}
      {neu ? (
        <Karte titel="Material buchen" kompakt aktion={<Button variante="tertiaer" klein onClick={() => setNeu(false)}>Schließen</Button>}>
          <MaterialFormular auftragId={id} onFertig={() => setNeu(false)} />
        </Karte>
      ) : liste.length ? (
        <div>{neuKnopf}</div>
      ) : (
        <Leer titel="Noch kein Material" text="Buch Material, das du brauchst oder verbaut hast. Verbrauchtes Material landet später automatisch auf der Rechnung." icon="paket" aktion={neuKnopf} />
      )}
      {STATUS_REIHE.map((s) => {
        const teil = liste.filter((b) => b.status === s);
        if (!teil.length) return null;
        return (
          <Abschnitt key={s} titel={`${STATUS_LABEL[s]} · ${teil.length}`}>
            <Liste>
              {teil.map((b) => (
                <MaterialZeile key={b.id} b={b} />
              ))}
            </Liste>
          </Abschnitt>
        );
      })}
    </Stapel>
  );
}
