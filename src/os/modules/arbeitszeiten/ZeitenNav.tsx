import { useNavigate } from 'react-router-dom';
import { istBuero, useDarf, useIch } from '@core/session';
import { Tabs } from '@ui/index';

const ANSICHTEN = [
  { id: 'stempeluhr', titel: 'Stempeluhr', pfad: '/betrieb/arbeitszeiten' },
  { id: 'woche', titel: 'Woche', pfad: '/betrieb/arbeitszeiten/woche' },
  { id: 'konto', titel: 'Stundenkonto', pfad: '/betrieb/arbeitszeiten/konto' },
  { id: 'monat', titel: 'Monat & Lohn', pfad: '/betrieb/arbeitszeiten/monat', nurBuero: true },
];

export function ZeitenNav({ aktiv }: { aktiv: 'stempeluhr' | 'woche' | 'konto' | 'monat' }) {
  const navigate = useNavigate();
  const ich = useIch();
  const personal = useDarf('personal');
  const buero = istBuero(ich) || personal;
  const tabs = ANSICHTEN.filter((a) => buero || !a.nurBuero);
  return <Tabs tabs={tabs} aktiv={aktiv} onWechsel={(id) => navigate(ANSICHTEN.find((a) => a.id === id)!.pfad)} />;
}
