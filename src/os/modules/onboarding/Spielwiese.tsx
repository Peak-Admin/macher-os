import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEinstellung } from '@core/einstellungen';
import { hatGesicherteDaten, SPIELWIESE_KEY, spielwieseVerlassen } from '@core/seed';
import { Button, Status, useToast } from '@ui/index';

/** Hinweis als kompakte Zeile oben im Inhalt, solange die Spielwiese offen ist – Beispieldaten sind nie mit echten Daten gemischt. */
export function SpielwieseLeiste() {
  const [an] = useEinstellung<boolean>(SPIELWIESE_KEY, false);
  const navigate = useNavigate();
  const toast = useToast();
  const [laedt, setLaedt] = useState(false);
  const [gesichert, setGesichert] = useState(true);
  useEffect(() => {
    if (an === true) void hatGesicherteDaten().then(setGesichert);
  }, [an]);
  if (an !== true) return null;
  const verlassen = async () => {
    setLaedt(true);
    try {
      const r = await spielwieseVerlassen();
      if (r === 'zurueck') {
        navigate('/heute', { replace: true });
        toast('Deine Daten sind zurück. Die Spielwiese ist aufgeräumt.');
      } else navigate('/willkommen', { replace: true });
    } finally {
      setLaedt(false);
    }
  };
  return (
    <aside className="ob-spielwiese" aria-label="Spielwiese">
      <div className="ob-spielwiese-text">
        <Status ton="achtung">Spielwiese</Status>
        <span>Alles hier sind Beispieldaten.</span>
      </div>
      <Button klein variante="sekundaer" onClick={verlassen} laedt={laedt}>
        {gesichert ? 'Zu meinen echten Daten' : 'Eigenen Betrieb einrichten'}
      </Button>
    </aside>
  );
}
