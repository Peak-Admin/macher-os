/** Layout je Nutzer laden und speichern (Einstellung `home.layout.<mitarbeiterId>`). */
import { useMemo } from 'react';
import { useEinstellung } from '@core/einstellungen';
import type { Mitarbeiter } from '@core/objects';
import { useDatenstand } from '@core/db';
import { normalisieren, zumSpeichern } from './layout';
import { erlaubteWidgets } from './registry';
import type { HomeLayout } from './typen';

export const layoutSchluessel = (mitarbeiterId: string) => `home.layout.${mitarbeiterId}`;

export function useHomeLayout(ich: Mitarbeiter) {
  useDatenstand(); // Rechte oder Module können sich ändern
  const defs = erlaubteWidgets(ich);
  const [gespeichert, setzen] = useEinstellung<HomeLayout | null>(layoutSchluessel(ich.id), null);
  const ids = defs.map((d) => d.id).join(',');
  const layout = useMemo(
    () => normalisieren(gespeichert ?? undefined, defs, ich.rolle, ich.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gespeichert, ids, ich.rolle, ich.id],
  );
  return {
    defs,
    layout,
    speichern: (l: HomeLayout) => setzen(zumSpeichern(l)),
    zuruecksetzen: () => setzen(null),
  };
}
