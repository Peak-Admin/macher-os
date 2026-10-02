/** „Was möchtest du als Erstes erledigen?“ – drei Aktionen, Angebot vorn. Kein Tutorial, kein Profil-Fortschritt. */
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '@core/db';
import { messen } from '@core/messung';
import { useDarf } from '@core/session';
import { Button, Icon, Meldung, Seite, ThemenIcon } from '@ui/index';
import { KARTEN, startKarten, type Wahl } from './daten';
import './start.css';

export function StartSeite() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const geld = useDarf('geld');
  const b = db.betrieb.useOne('betrieb');
  const sichtbar = startKarten(geld);
  const frisch = (state as { setup?: string } | null)?.setup === 'fertig';

  const waehlen = (w: Wahl, i: number) => {
    messen('erstwert.gewaehlt', { wahl: w, position: i + 1 });
    navigate(KARTEN[w].pfad);
  };

  return (
    <Seite titel="Was möchtest du als Erstes erledigen?" untertitel="Such dir eins aus. Den Rest fragt Macher, wenn du ihn brauchst.">
      {frisch && b && (
        <p className="mm-start-fertig" role="status">
          <span className="mm-start-fertig-haken" aria-hidden>
            <Icon name="check" size={16} />
          </span>
          {b.name} ist eingerichtet.
        </p>
      )}
      <div className="mm-start-karten">
        {sichtbar.map((w, i) => {
          const k = KARTEN[w];
          return (
            <button key={w} type="button" className={`mm-start-karte${i === 0 ? ' mm-start-karte--erste' : ''}`} onClick={() => waehlen(w, i)}>
              <span className="mm-auswahlkarte-icon" aria-hidden>
                <ThemenIcon name={k.icon} size={44} />
              </span>
              <strong>{k.titel}</strong>
              <span>{k.text}</span>
              <span className="mm-start-karte-weiter">
                Los geht’s <Icon name="pfeilRechts" size={16} />
              </span>
            </button>
          );
        })}
      </div>
      {!geld && <Meldung ton="neutral">Angebote schreibt bei euch das Büro. Du siehst deine Termine unter Heute.</Meldung>}
      <div>
        <Button
          variante="tertiaer"
          to="/heute"
          icon="heute"
          onClick={() => messen('erstwert.gewaehlt', { wahl: 'umsehen' })}
        >
          Erstmal umsehen
        </Button>
      </div>
    </Seite>
  );
}
