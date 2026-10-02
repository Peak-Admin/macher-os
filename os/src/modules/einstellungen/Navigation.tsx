import { useNavigate } from 'react-router-dom';
import { Tabs } from '@ui/index';

const TABS = [
  { id: '', titel: 'Betriebsdaten' },
  { id: 'daten', titel: 'Daten & Sicherung' },
  { id: 'papierkorb', titel: 'Papierkorb' },
];

export function EinstellungenTabs({ aktiv, papierkorb }: { aktiv: '' | 'daten' | 'papierkorb'; papierkorb?: number }) {
  const navigate = useNavigate();
  return (
    <Tabs
      aktiv={aktiv}
      onWechsel={(id) => navigate(id ? `/betrieb/einstellungen/${id}` : '/betrieb/einstellungen')}
      tabs={TABS.map((t) => ({ ...t, zaehler: t.id === 'papierkorb' ? papierkorb : undefined }))}
    />
  );
}
