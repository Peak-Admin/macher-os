import { useNavigate } from 'react-router-dom';
import { defineModul } from '@core/modul';
import { useOverlay } from '@core/overlay';
import { Button, Dialog, Seite } from '@ui/index';
import { ZEITEN_BESTAETIGEN, zeitenBestaetigen } from '@modules/takte/aktionen';
import { TaktSeite } from '@modules/takte/Ansicht';
import { taktPfad } from '@modules/takte/zustellung';
import { beispielBenachrichtigungen, benachrichtigenAutomation, takteAutomation } from './daten';
import { EinstellungenSeite } from './Einstellungen';
import { BenachrichtigungsListe } from './Liste';

/** Overlay „Benachrichtigungen“ – die Glocke in der Topbar */
function GlockenOverlay() {
  const { offen, schliessen } = useOverlay('benachrichtigungen');
  const navigate = useNavigate();
  const gehe = (pfad: string) => (schliessen(), navigate(pfad));
  return (
    <Dialog
      offen={offen}
      onSchliessen={schliessen}
      titel="Benachrichtigungen"
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
      <BenachrichtigungsListe onNavigiert={schliessen} />
    </Dialog>
  );
}

function Seitenansicht() {
  return (
    <Seite
      titel="Benachrichtigungen"
      untertitel="Nur das, worauf du reagieren solltest."
      aktion={
        <Button variante="sekundaer" icon="einstellungen" to="/macher/benachrichtigungen/einstellungen">
          Takte & Ruhezeiten
        </Button>
      }
    >
      <BenachrichtigungsListe />
    </Seite>
  );
}

export default defineModul({
  id: 'benachrichtigungen',
  titel: 'Benachrichtigungen',
  bereich: 'macher',
  beschreibung: 'Informiert nur über relevante Änderungen, Termine und Probleme – mit festen Takten am Morgen und am Nachmittag.',
  icon: 'glocke',
  gewicht: 55,
  navigation: 'versteckt',
  routen: [
    { pfad: '', element: Seitenansicht },
    { pfad: 'einstellungen', element: EinstellungenSeite },
    // Takte (Modul-Ordner `takte`): Ziel jeder Takt-Benachrichtigung
    { pfad: '/macher/takte/:takt', element: TaktSeite },
  ],
  // Takt-Benachrichtigungen verweisen auf `{ typ: 'takte', id: <takt> }` → Takt-Ansicht
  detail: [{ objekt: 'takte', pfad: (id) => `${taktPfad(id)}?quelle=benachrichtigung` }],
  global: GlockenOverlay,
  automationen: [benachrichtigenAutomation, takteAutomation],
  aktionen: {
    [ZEITEN_BESTAETIGEN]: (p) => {
      zeitenBestaetigen(p as { mitarbeiterId: string; datum: string });
    },
  },
  seed: beispielBenachrichtigungen,
});
