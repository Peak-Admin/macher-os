/**
 * Rahmen für alles, was Endkunden des Betriebs sehen (Kundenbereich, Terminbuchung).
 * Absender, Logo und Kontakt kommen aus `db.betrieb` und dem Briefkopf – nichts wird kopiert.
 * Ansprache auf diesen Seiten: höflich mit „Sie“.
 */
import type { ReactNode } from 'react';
import { db } from '@core/db';
import { telLink } from '@core/format';
import { briefkopf } from './druck';
import { Icon } from './icons';

export function KundenRahmen({ children, breite = 880 }: { children: ReactNode; breite?: number }) {
  const b = db.betrieb.useOne('betrieb');
  const kopf = briefkopf();
  const tel = b?.telefon ? telLink(b.telefon) : undefined;
  return (
    <div className="mm-kunde">
      <header className="mm-kunde-kopf">
        <div className="mm-kunde-kopf-innen" style={{ maxWidth: breite }}>
          {kopf.logo ? <img className="mm-kunde-logo" src={kopf.logo} alt={b?.name ?? 'Logo'} /> : <span className="mm-kunde-name">{b?.name ?? 'Ihr Handwerksbetrieb'}</span>}
          {b?.telefon && tel && (
            <a href={tel} className="mm-btn mm-btn--sekundaer mm-btn--klein">
              <Icon name="telefon" size={16} />
              <span>{b.telefon}</span>
            </a>
          )}
        </div>
      </header>
      <main className="mm-kunde-inhalt" style={{ maxWidth: breite }}>
        {children}
      </main>
      {kopf.fusszeilen.length > 0 && (
        <footer className="mm-kunde-fuss" style={{ maxWidth: breite }}>
          {kopf.fusszeilen.map((z) => (
            <span key={z}>{z}</span>
          ))}
        </footer>
      )}
    </div>
  );
}
