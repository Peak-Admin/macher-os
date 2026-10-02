import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { spielwieseStarten } from '@core/seed';
import { Button, Meldung, Oberzeile } from '@ui/index';
import { demoGewerk } from './daten';
import { Rahmen } from './Willkommen';

/**
 * Vollbild `/demo`: Einstieg von „Demo ansehen“ auf der Website. Öffnet die echte Software auf der Spielwiese –
 * ein Beispielbetrieb des gewählten Gewerks, getrennt von echten Daten – und führt direkt zu Heute.
 */
export function Demo() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const gewerk = demoGewerk(params.get('gewerk'));
  const [fehler, setFehler] = useState<string>();
  const [versuch, setVersuch] = useState(0);
  const gestartet = useRef(-1);

  useEffect(() => {
    if (gestartet.current === versuch) return;
    gestartet.current = versuch;
    spielwieseStarten(gewerk)
      .then(() => navigate('/heute', { replace: true }))
      .catch((e: unknown) => setFehler(e instanceof Error ? e.message : 'Die Demo konnte nicht geöffnet werden.'));
  }, [gewerk, navigate, versuch]);

  return (
    <Rahmen>
      <div className="ob-ablauf" aria-live="polite">
        <div className="ob-frage-kopf">
          <Oberzeile>Demo</Oberzeile>
          <h1>{fehler ? 'Die Demo startet gerade nicht' : 'Dein Beispielbetrieb wird eingerichtet'}</h1>
          <p>
            Du siehst gleich das echte Macher OS mit Beispieldaten: Aufträge, Plan, Team und Rechnungen. Klick dich frei durch – du
            kannst nichts kaputt machen.
          </p>
        </div>
        {fehler ? (
          <>
            <Meldung ton="achtung">{fehler}</Meldung>
            <div className="ob-navigation">
              <Button variante="tertiaer" href="/demo">
                Zurück zur Website
              </Button>
              <Button
                icon="weiter"
                onClick={() => {
                  setFehler(undefined);
                  setVersuch((v) => v + 1);
                }}
              >
                Erneut versuchen
              </Button>
            </div>
          </>
        ) : (
          <div>
            <Button laedt laedtText="Wird eingerichtet …">
              Wird eingerichtet …
            </Button>
          </div>
        )}
      </div>
    </Rahmen>
  );
}
