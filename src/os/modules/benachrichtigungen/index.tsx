import { useNavigate } from 'react-router-dom';
import { defineModul } from '@core/modul';
import { useOverlay } from '@core/overlay';
import { Button, Dialog, Seite } from '@ui/index';
import { beispielBenachrichtigungen, benachrichtigenAutomation } from './daten';
import { EinstellungenSeite } from './Einstellungen';
import { InboxListe } from './Inbox';

/** Overlay „Benachrichtigungen“ – in der Seitenleiste unter „Suchen oder fragen“ */
function GlockenOverlay() {
  const { offen, schliessen } = useOverlay('benachrichtigungen');
  const navigate = useNavigate();
  const gehe = (pfad: string) => (schliessen(), navigate(pfad));
  return (
    <Dialog
      offen={offen}
      onSchliessen={schliessen}
      titel="Benachrichtigungen"
      breit
      aktionen={
        <>
          <Button variante="tertiaer" klein onClick={() => gehe('/macher/benachrichtigungen/einstellungen')}>
            Takte & Ruhezeiten
          </Button>
          <Button variante="sekundaer" klein onClick={() => gehe('/macher/hinweise')}>
            Hinweise & Freigaben
          </Button>
        </>
      }
    >
      <InboxListe onNavigiert={schliessen} />
    </Dialog>
  );
}

function Seitenansicht() {
  return (
    <Seite
      titel="Benachrichtigungen"
      untertitel="Was gerade deine Aufmerksamkeit braucht. Erledigtes verschwindet von selbst."
      aktion={
        <Button variante="sekundaer" icon="einstellungen" to="/macher/benachrichtigungen/einstellungen">
          Takte & Ruhezeiten
        </Button>
      }
    >
      <InboxListe />
    </Seite>
  );
}

export default defineModul({
  id: 'benachrichtigungen',
  titel: 'Benachrichtigungen',
  bereich: 'macher',
  beschreibung: 'Deine Aufmerksamkeit in einer Liste: Jetzt, Aktion nötig, Zur Kenntnis. Erledigtes verschwindet von selbst, Infos verfallen.',
  icon: 'glocke',
  gewicht: 55,
  navigation: 'versteckt',
  routen: [
    { pfad: '', element: Seitenansicht },
    { pfad: 'einstellungen', element: EinstellungenSeite },
  ],
  global: GlockenOverlay,
  automationen: [benachrichtigenAutomation],
  seed: beispielBenachrichtigungen,
});
