/** Rundes Kundenbild: Logo der Kunden-Website, sonst Initialen in einer ruhigen Kennfarbe (Logik: `kundenbild-logik.ts`). */
import { useState } from 'react';
import type { Kunde } from '@core/objects';
import { kundenDomain, kundenFarbe, kundenInitialen } from './kundenbild-logik';

const kaputt = new Set<string>();

export function Kundenbild({ k, groesse = 36 }: { k: Pick<Kunde, 'name' | 'email' | 'art'> & { website?: string }; groesse?: number }) {
  const domain = kundenDomain(k);
  const [, neu] = useState(0);
  const logo = domain && !kaputt.has(domain) ? `https://${domain}/favicon.ico` : undefined;
  return (
    <span className="mm-kundenbild" style={{ width: groesse, height: groesse, fontSize: groesse * 0.38, background: logo ? 'var(--mm-surface)' : kundenFarbe(k.name) }} aria-hidden="true">
      {logo ? (
        <img
          src={logo}
          alt=""
          width={Math.round(groesse * 0.6)}
          height={Math.round(groesse * 0.6)}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => {
            kaputt.add(domain!);
            neu((n) => n + 1);
          }}
        />
      ) : (
        kundenInitialen(k.name)
      )}
    </span>
  );
}
