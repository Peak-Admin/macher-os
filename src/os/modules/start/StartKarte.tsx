/** „Dein Start“ auf Heute: drei Haken, verschwindet, sobald alles erledigt ist. Jeder offene Haken hat einen konkreten Schritt. */
import { useState } from 'react';
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

/**
 * Kompakte Fortschrittszeile auf Heute: „Dein Start: 1 von 3 erledigt“ mit „Einrichtung fortsetzen“.
 * Die Schritte erscheinen erst nach dem Öffnen – so steht die Einrichtung nicht vor dem Tagesablauf.
 */
export function StartKarte() {
  const haken = useStartHaken();
  const [offen, setOffen] = useState(false);
  if (haken.every((h) => h.erledigt)) return null;
  const erledigt = haken.filter((h) => h.erledigt).length;
  const naechster = haken.find((x) => !x.erledigt);
  return (
    <details className="mm-start-zeile" open={offen} onToggle={(e) => setOffen(e.currentTarget.open)}>
      <summary>
        <span className="mm-start-zeile-text">
          <strong>Dein Start:</strong> {erledigt} von {haken.length} erledigt
        </span>
        <span className="mm-fortschritt-balken mm-start-zeile-balken" aria-hidden>
          <span style={{ width: `${(erledigt / haken.length) * 100}%` }} />
        </span>
        <span className="mm-start-zeile-knopf">
          {offen ? 'Schritte ausblenden' : 'Einrichtung fortsetzen'}
          <Icon name={offen ? 'hoch' : 'runter'} size={18} />
        </span>
      </summary>
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
              <Button variante={h === naechster ? 'sekundaer' : 'tertiaer'} klein to={h.aktion.pfad} icon="pfeilRechts">
                {h.aktion.label}
              </Button>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}
