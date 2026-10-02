/** „Dein Start“ auf Heute: drei Haken, verschwindet, sobald alles erledigt ist. Jeder offene Haken hat einen konkreten Schritt. */
import { db } from '@core/db';
import { useEinstellung } from '@core/einstellungen';
import { Button, Icon } from '@ui/index';
import { startHaken, TEAM_EINGELADEN, type Haken } from './daten';
import './start.css';

export function useStartHaken(): Haken[] {
  const angebote = db.angebote.use();
  const mitarbeiter = db.mitarbeiter.use();
  const termine = db.termine.use();
  const [teamEingeladen] = useEinstellung(TEAM_EINGELADEN, false);
  return startHaken({ angebote, mitarbeiter, termine, teamEingeladen });
}

/** Gleiche Gestalt wie die anderen Heute-Blöcke (`mm-heute-block`) */
export function StartKarte() {
  const haken = useStartHaken();
  if (haken.every((h) => h.erledigt)) return null;
  const offen = haken.filter((h) => !h.erledigt).length;
  return (
    <section className="mm-heute-block" aria-label="Dein Start">
      <h2 className="mm-heute-blocktitel">Dein Start · noch {offen} von 3</h2>
      <ul className="mm-start-haken">
        {haken.map((h) => (
          <li key={h.id} className={h.erledigt ? 'erledigt' : undefined}>
            <span className={`mm-start-haken-box${h.erledigt ? ' mm-start-haken-box--an' : ''}`} aria-hidden>
              {h.erledigt && <Icon name="check" size={16} />}
            </span>
            <span className="mm-start-haken-text">
              {h.titel}
              <span className="sr-only">{h.erledigt ? ' – erledigt' : ' – offen'}</span>
            </span>
            {!h.erledigt && (
              <Button variante={h === haken.find((x) => !x.erledigt) ? 'sekundaer' : 'tertiaer'} klein to={h.aktion.pfad} icon="pfeilRechts">
                {h.aktion.label}
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
