import { useNavigate } from 'react-router-dom';
import { istBuero, useDarf, useIch } from '@core/session';
import { Auswahl, Tabs } from '@ui/index';
import { useSchmal } from '@modules/kalender/hooks';

const ANSICHTEN = [
  { id: 'stempeluhr', titel: 'Stempeluhr', pfad: '/betrieb/arbeitszeiten' },
  { id: 'woche', titel: 'Woche', pfad: '/betrieb/arbeitszeiten/woche' },
  { id: 'alle', titel: 'Alle Zeiten', pfad: '/betrieb/arbeitszeiten/alle', nurBuero: true },
  { id: 'konto', titel: 'Stundenkonto', pfad: '/betrieb/arbeitszeiten/konto' },
  { id: 'monat', titel: 'Monat & Lohn', pfad: '/betrieb/arbeitszeiten/monat', nurBuero: true },
];

export function ZeitenNav({ aktiv }: { aktiv: 'stempeluhr' | 'woche' | 'alle' | 'konto' | 'monat' }) {
  const navigate = useNavigate();
  const ich = useIch();
  const personal = useDarf('personal');
  const buero = istBuero(ich) || personal;
  const schmal = useSchmal();
  const tabs = ANSICHTEN.filter((a) => buero || !a.nurBuero);
  const wechsel = (id: string) => navigate(ANSICHTEN.find((a) => a.id === id)!.pfad);
  // Mehr als drei Ansichten passen auf dem Handy nicht nebeneinander → beschriftete Auswahl (UX-Spezifikation 5.2)
  if (schmal && tabs.length > 3)
    return (
      <div style={{ maxWidth: 360 }}>
        <Auswahl label="Ansicht" value={aktiv} onChange={(e) => wechsel(e.target.value)} optionen={tabs.map((a) => ({ wert: a.id, label: a.titel }))} />
      </div>
    );
  return <Tabs tabs={tabs} aktiv={aktiv} onWechsel={wechsel} />;
}
