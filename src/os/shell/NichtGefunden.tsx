import { Button, Leer, Seite } from '@ui/index';

export function NichtGefunden() {
  return (
    <Seite titel="Seite nicht gefunden">
      <Leer titel="Diese Seite gibt es nicht (mehr)." text="Vielleicht wurde der Eintrag verschoben oder gelöscht." aktion={<Button to="/heute">Zu Heute</Button>} icon="achtung" />
    </Seite>
  );
}
