/** „Was willst du als Erstes erledigen?“ – drei Karten, nach Arbeitsweise sortiert. Kein Tutorial. */
import { useNavigate } from 'react-router-dom';
import { db } from '@core/db';
import { messen } from '@core/messung';
import { useDarf } from '@core/session';
import { Button, Icon, Meldung, Seite } from '@ui/index';
import { KARTEN, kartenReihenfolge, type Wahl } from './daten';
import './start.css';

export function StartSeite() {
  const navigate = useNavigate();
  const geld = useDarf('geld');
  const b = db.betrieb.useOne('betrieb');
  const reihe = kartenReihenfolge(b?.arbeitsweisen);
  const sichtbar = geld ? reihe : reihe.filter((w) => w === 'planen');

  const waehlen = (w: Wahl, i: number) => {
    messen('erstwert.gewaehlt', { wahl: w, position: i + 1 });
    navigate(KARTEN[w].pfad);
  };

  return (
    <Seite titel="Was willst du als Erstes erledigen?" untertitel="Such dir eins aus. Den Rest richtet Macher nebenbei ein.">
      <div className="mm-start-karten">
        {sichtbar.map((w, i) => {
          const k = KARTEN[w];
          return (
            <button key={w} type="button" className={`mm-start-karte${i === 0 ? ' mm-start-karte--erste' : ''}`} onClick={() => waehlen(w, i)}>
              <span className="mm-auswahlkarte-icon" aria-hidden>
                <Icon name={k.icon} />
              </span>
              <strong>{k.titel}</strong>
              <span>{k.text}</span>
              <span className="mm-start-karte-weiter">
                Los geht's <Icon name="pfeilRechts" size={16} />
              </span>
            </button>
          );
        })}
      </div>
      {!geld && <Meldung ton="neutral">Angebote und Rechnungen schreibt bei euch das Büro. Du siehst deine Termine unter Heute.</Meldung>}
      <div>
        <Button variante="tertiaer" to="/heute" icon="heute">
          Später – erst mal zu Heute
        </Button>
      </div>
    </Seite>
  );
}
