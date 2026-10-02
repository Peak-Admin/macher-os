/** Dokumenthistorie: Versionen (was ging wann an wen raus) und Zeitstrahl in einer Liste */
import { relativ, uhrzeit } from '@core/format';
import type { Bezug } from '@core/objects';
import { useDatenstand } from '@core/db';
import { Leer, Liste, ListenZeile, Status } from '@ui/index';
import { historie } from './historie';

export function DokumentHistorie({ bezug, max = 30 }: { bezug: Bezug; max?: number }) {
  useDatenstand();
  const liste = historie(bezug).slice(0, max);
  if (!liste.length) return <Leer titel="Noch nichts passiert" text="Hier steht, wann das Dokument erstellt, geändert und verschickt wurde." icon="uhr" />;
  return (
    <Liste>
      {liste.map((e) => (
        <ListenZeile key={e.id} titel={e.text} untertitel={`${relativ(e.zeitpunkt)}, ${uhrzeit(e.zeitpunkt)} Uhr`} rechts={e.version ? <Status ton="aktiv">{`Version ${e.version}`}</Status> : undefined} />
      ))}
    </Liste>
  );
}
