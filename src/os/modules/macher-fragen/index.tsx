import { defineModul } from '@core/modul';
import { useOverlay } from '@core/overlay';
import { Dialog, Seite } from '@ui/index';
import { ABSICHTEN, AKTIONEN } from './assistent';
import { verbindeModelle } from '@core/ki-modelle';
import { MacherChat } from './Chat';

/** Overlay „Macher fragen“ – geöffnet aus „Suchen oder fragen“ (`oeffne('macher', { frage })`). */
function MacherOverlay() {
  const { offen, schliessen, payload } = useOverlay('macher');
  return (
    <Dialog offen={offen} onSchliessen={schliessen} titel="Macher fragen" breit>
      <MacherChat onNavigiert={schliessen} startFrage={(payload as { frage?: string } | undefined)?.frage} />
    </Dialog>
  );
}

function MacherSeite() {
  return (
    <Seite titel="Macher fragen" untertitel="Antworten aus deinen Daten – Aufgaben legt Macher erst an, wenn du bestätigst.">
      <MacherChat />
    </Seite>
  );
}

export default defineModul({
  id: 'macher-fragen',
  titel: 'Macher fragen',
  bereich: 'macher',
  beschreibung: 'Findet Informationen, beantwortet Fragen und bereitet Aktionen vor.',
  icon: 'macher',
  gewicht: 70,
  navigation: 'versteckt',
  routen: [{ pfad: '', element: MacherSeite }],
  global: MacherOverlay,
  gateway: { absichten: ABSICHTEN, aktionen: AKTIONEN },
  // Jev/Luna anmelden, wenn auf dem Server eingerichtet – sonst bleibt alles bei Regeln
  init: () => void verbindeModelle(),
});
