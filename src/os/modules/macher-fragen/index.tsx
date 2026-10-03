import { defineModul } from '@core/modul';
import { useOverlay } from '@core/overlay';
import { Dialog, Seite } from '@ui/index';
import { ABSICHTEN, AKTIONEN } from './assistent';
import { verbindeModelle } from '@core/ki-modelle';
import { MacherChat } from './Chat';
import type { MacherStart } from './vorbereiten';

/**
 * Overlay „Frag Lotte“ – geöffnet aus „Suchen oder fragen“ (`oeffne('macher', { frage })`) oder aus
 * „Mit Lotte vorbereiten“ am Objekt (`oeffne('macher', { frage, absicht, bezug })`, siehe `vorbereiten.ts`).
 */
function MacherOverlay() {
  const { offen, schliessen, payload } = useOverlay('macher');
  return (
    <Dialog offen={offen} onSchliessen={schliessen} titel="Frag Lotte" breit>
      <MacherChat onNavigiert={schliessen} start={payload as MacherStart | undefined} />
    </Dialog>
  );
}

function MacherSeite() {
  return (
    <Seite titel="Frag Lotte" untertitel="Antworten aus deinen Daten – Aufgaben legt Lotte erst an, wenn du bestätigst.">
      <MacherChat />
    </Seite>
  );
}

export default defineModul({
  id: 'macher-fragen',
  titel: 'Frag Lotte',
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
