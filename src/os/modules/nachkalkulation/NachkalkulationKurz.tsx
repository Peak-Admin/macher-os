/** Kompakter Soll-Ist-Block für den Kosten-Tab am Auftrag */
import { useMemo } from 'react';
import type { ID } from '@core/objects';
import { Button, Karte, Stapel, Status } from '@ui/index';
import { useBasis } from '../kosten/gemeinsam';
import { nachkalkulation } from './daten';
import { kalkulationFuer } from './kalkulation';

export function useNachkalkulation(id: ID) {
  const b = useBasis();
  return useMemo(() => {
    const a = b.auftraege.find((x) => x.id === id);
    return a ? nachkalkulation(a, b, kalkulationFuer(id)) : undefined;
  }, [id, b]);
}

export function NachkalkulationKurz({ id }: { id: ID }) {
  const n = useNachkalkulation(id);
  if (!n || (!n.hatSoll && n.umsatz == null)) return null;
  return (
    <Karte
      titel="Soll und Ist"
      icon="diagramm"
      aktion={<Status ton={n.bewertung.ton}>{n.bewertung.text}</Status>}
    >
      <Stapel abstand={8}>
        {n.saetze.slice(0, 4).map((s) => (
          <p key={s} style={{ margin: 0 }}>
            {s}
          </p>
        ))}
        <div>
          <Button variante="tertiaer" klein icon="weiter" to={`/betrieb/nachkalkulation/${id}`}>
            Ganze Nachkalkulation
          </Button>
        </div>
      </Stapel>
    </Karte>
  );
}
