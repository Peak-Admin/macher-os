import { Button, Seite } from '@ui/index';
import { Archiv, Pipeline } from './Pipeline';

/** Startansicht: laufende Aufträge als Pipeline, darunter das Archiv */
export function AuftraegeSeite() {
  return (
    <Seite titel="Aufträge" untertitel="Jeder Auftrag vom ersten Anruf bis zur bezahlten Rechnung." breit aktion={<Button icon="plus" to="/auftraege/auftraege/neu">Auftrag anlegen</Button>}>
      <Pipeline />
      <Archiv />
    </Seite>
  );
}

export function PipelineWidget() {
  return <Pipeline imHub />;
}
