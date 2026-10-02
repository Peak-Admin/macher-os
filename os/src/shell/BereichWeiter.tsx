import { Navigate } from 'react-router-dom';
import { useIch } from '@core/session';
import { STRUKTUR, sichtbareZiele, zielPfad, zieleVon, type HauptId } from './struktur';

/** `/auftraege` und `/plan` öffnen direkt die erste Arbeitsansicht (Übersicht bzw. Kalender) */
export function BereichWeiter({ bereich }: { bereich: HauptId }) {
  const ich = useIch();
  const h = STRUKTUR.find((x) => x.id === bereich)!;
  const z = sichtbareZiele(zieleVon(h), ich)[0];
  return <Navigate to={z ? zielPfad(z, ich) : '/heute'} replace />;
}
