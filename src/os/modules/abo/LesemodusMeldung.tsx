/**
 * Global: freundliche Meldung, sobald ein Schreibversuch im Lesemodus scheitert (`SchreibGesperrt`).
 * Fängt `error` und `unhandledrejection` – egal, aus welchem Modul der Versuch kam. Außerdem: Stand einmal
 * vom Server holen und den Wechsel in den Lesemodus melden.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cloudAktiv } from '@core/cloud';
import { useDatenstand } from '@core/db';
import { Button, Dialog, Stapel } from '@ui/index';
import { aboApi } from './api';
import { istSchreibGesperrt, standUebernehmen, statusPruefen } from './stand';

export function LesemodusMeldung() {
  const navigate = useNavigate();
  const [grund, setGrund] = useState<string | null>(null);
  const version = useDatenstand();

  useEffect(() => {
    const fangen = (fehler: unknown, e: Event) => {
      if (!istSchreibGesperrt(fehler)) return;
      e.preventDefault();
      setGrund(fehler.message);
    };
    const beiFehler = (e: ErrorEvent) => fangen(e.error, e);
    const beiAblehnung = (e: PromiseRejectionEvent) => fangen(e.reason, e);
    window.addEventListener('error', beiFehler);
    window.addEventListener('unhandledrejection', beiAblehnung);
    return () => {
      window.removeEventListener('error', beiFehler);
      window.removeEventListener('unhandledrejection', beiAblehnung);
    };
  }, []);

  useEffect(() => {
    if (!cloudAktiv()) return;
    void aboApi.stand().then((r) => r.ok && standUebernehmen(r.daten));
  }, []);

  // Zustandswechsel (z. B. Testphase heute abgelaufen) erkennen – auch bei offenem Tab
  useEffect(() => {
    try {
      statusPruefen();
    } catch {
      /* Meldung ist nie wichtiger als die App */
    }
  }, [version]);

  return (
    <Dialog
      offen={!!grund}
      onSchliessen={() => setGrund(null)}
      titel="Gerade nur lesen"
      aktionen={
        <>
          <Button variante="tertiaer" onClick={() => setGrund(null)}>
            Weiter lesen
          </Button>
          <Button
            onClick={() => {
              setGrund(null);
              navigate('/betrieb/abo');
            }}
          >
            Plan wählen
          </Button>
        </>
      }
    >
      <Stapel abstand={12}>
        <p>{grund}</p>
        <p className="mm-meta">Nichts geht verloren. Kundenbereich, offene Rechnungen und der Export laufen weiter.</p>
      </Stapel>
    </Dialog>
  );
}
