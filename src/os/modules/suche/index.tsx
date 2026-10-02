import { defineModul } from '@core/modul';
import { useOverlay } from '@core/overlay';
import { darf } from '@core/session';
import { Dialog, Seite } from '@ui/index';
import { eigeneTreffer } from './daten';
import { SuchKern } from './Suche';

/** Overlay „Suche“ – Strg+K oder Suchfeld in der Topbar */
function SucheOverlay() {
  const { offen, schliessen } = useOverlay('suche');
  return (
    <Dialog offen={offen} onSchliessen={schliessen} titel="Suchen" breit>
      <SuchKern onFertig={schliessen} />
    </Dialog>
  );
}

function SucheSeite() {
  return (
    <Seite titel="Suche" untertitel="Findet Kunden, Aufträge, Rechnungen, Termine, Dokumente und mehr.">
      <SuchKern />
    </Seite>
  );
}

export default defineModul({
  id: 'suche',
  titel: 'Suche',
  bereich: 'macher',
  beschreibung: 'Findet Kunden, Aufträge, Rechnungen, Mitarbeiter, Dokumente und andere Inhalte zentral.',
  icon: 'suche',
  gewicht: 80,
  navigation: 'versteckt',
  routen: [{ pfad: '', element: SucheSeite }],
  global: SucheOverlay,
  suche: (q) => eigeneTreffer(q, { geld: darf('geld') }),
});
