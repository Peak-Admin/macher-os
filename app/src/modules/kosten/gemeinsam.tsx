/** Gemeinsame Bausteine der Zahlen-Module (Kosten, Nachkalkulation, Ertrag, Auswertung, DATEV). */
import { useMemo, type ReactNode } from 'react';
import { useDatenstand } from '@core/db';
import { useDarf } from '@core/session';
import { Meldung, Seite } from '@ui/index';
import { basisAusDb, type Basisdaten } from './basis';

/** Aktueller Datenschnappschuss – rechnet bei jeder Änderung neu */
export function useBasis(): Basisdaten {
  const v = useDatenstand();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => basisAusDb(), [v]);
}

export function KeinGeldRecht() {
  return (
    <Meldung titel="Nur mit dem Recht „Preise & Geld“">
      Kosten, Erträge und Auswertungen sehen Chef und Büro. Wenn du sie brauchst, frag deinen Chef – er kann dir das Recht unter Rollen &amp; Rechte geben.
    </Meldung>
  );
}

/** Seite, die nur mit dem Recht „geld“ Inhalte zeigt */
export function GeldSeite({ titel, untertitel, aktion, zurueck, status, children }: { titel: ReactNode; untertitel?: ReactNode; aktion?: ReactNode; zurueck?: { to: string; label: string }; status?: ReactNode; children: ReactNode }) {
  const darf = useDarf('geld');
  return (
    <Seite titel={titel} untertitel={darf ? untertitel : undefined} aktion={darf ? aktion : undefined} zurueck={zurueck} status={darf ? status : undefined} breit>
      {darf ? children : <KeinGeldRecht />}
    </Seite>
  );
}

/** Nur den Inhalt schützen (z. B. in Tabs fremder Detailansichten) */
export function NurMitGeld({ children }: { children: ReactNode }) {
  return useDarf('geld') ? <>{children}</> : <KeinGeldRecht />;
}
