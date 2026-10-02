/**
 * Rahmen für öffentliche Seiten (Kundenbereich, Terminbuchung) – wie `KundenRahmen`, aber mit dem Betrieb-Kopf
 * aus der öffentlichen Sicht. So sieht der Kunde auf seinem eigenen Gerät denselben Absender wie im Büro-Browser.
 */
import type { ReactNode } from 'react';
import { telLink } from '@core/format';
import { Icon } from '@ui/index';
import type { BetriebKopf } from './oeffentlich';

export function OeffentlicherRahmen({ kopf, breite = 880, children }: { kopf?: BetriebKopf; breite?: number; children: ReactNode }) {
  const tel = kopf?.telefon ? telLink(kopf.telefon) : undefined;
  return (
    <div className="mm-kunde">
      <header className="mm-kunde-kopf">
        <div className="mm-kunde-kopf-innen" style={{ maxWidth: breite }}>
          {kopf?.logo ? <img className="mm-kunde-logo" src={kopf.logo} alt={kopf.name} /> : <span className="mm-kunde-name">{kopf?.name ?? 'Ihr Handwerksbetrieb'}</span>}
          {kopf?.telefon && tel && (
            <a href={tel} className="mm-btn mm-btn--sekundaer mm-btn--klein">
              <Icon name="telefon" size={16} />
              <span>{kopf.telefon}</span>
            </a>
          )}
        </div>
      </header>
      <main className="mm-kunde-inhalt" style={{ maxWidth: breite }}>
        {children}
      </main>
      {!!kopf?.fusszeilen.length && (
        <footer className="mm-kunde-fuss" style={{ maxWidth: breite }}>
          {kopf.fusszeilen.map((z) => (
            <span key={z}>{z}</span>
          ))}
        </footer>
      )}
    </div>
  );
}
