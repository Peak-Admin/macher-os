import { useNavigate } from 'react-router-dom';
import { Tabs } from '@ui/index';

const ANSICHTEN = [
  { id: 'stempeluhr', titel: 'Stempeluhr', pfad: '/betrieb/arbeitszeiten' },
  { id: 'woche', titel: 'Woche', pfad: '/betrieb/arbeitszeiten/woche' },
  { id: 'konto', titel: 'Stundenkonto', pfad: '/betrieb/arbeitszeiten/konto' },
];

export function ZeitenNav({ aktiv }: { aktiv: 'stempeluhr' | 'woche' | 'konto' }) {
  const navigate = useNavigate();
  return <Tabs tabs={ANSICHTEN} aktiv={aktiv} onWechsel={(id) => navigate(ANSICHTEN.find((a) => a.id === id)!.pfad)} />;
}
