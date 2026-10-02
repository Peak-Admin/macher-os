/** Notfall-Einstieg, solange kein Onboarding-Modul registriert ist. */
import { useNavigate } from 'react-router-dom';
import { einrichten } from '@core/seed';
import { Button, FensterSkizze, Seite } from '@ui/index';

export function Erststart() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: 32 }}>
      <Seite titel="Willkommen bei Macher OS" untertitel="Richte deinen Betrieb mit Beispieldaten ein.">
        <div className="mm-einstieg">
        <span className="mm-fenster" aria-hidden style={{ maxWidth: 480 }}>
          <FensterSkizze icon="start" />
        </span>
        <div>
          <Button
            onClick={() => {
              einrichten({ betriebName: 'Musterbetrieb', gewerk: 'elektro', arbeitsweisen: [], teamgroesse: 5, chefVorname: 'Max', chefNachname: 'Macher', beispiele: true });
              navigate('/heute');
            }}
          >
            Beispielbetrieb einrichten
          </Button>
        </div>
        </div>
      </Seite>
    </div>
  );
}
