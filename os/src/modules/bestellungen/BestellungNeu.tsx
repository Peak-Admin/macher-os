import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '@core/db';
import { Auswahl, Button, Karte, Leer, Meta, Seite, Stapel, Zeile, useToast } from '@ui/index';
import { inEntwurfUebernehmen } from './daten';

export function BestellungNeu() {
  const [params] = useSearchParams();
  const lieferanten = db.lieferanten.use();
  const navigate = useNavigate();
  const toast = useToast();
  const [lid, setLid] = useState(params.get('lieferant') ?? lieferanten[0]?.id ?? '');
  const [fehler, setFehler] = useState<string>();

  if (!lieferanten.length)
    return (
      <Seite titel="Bestellung anlegen" zurueck={{ to: '/betrieb/bestellungen', label: 'Bestellungen' }}>
        <Leer titel="Noch kein Lieferant" text="Leg zuerst deinen Großhändler an – mit E-Mail und Kundennummer. Dann geht die Bestellung mit einem Klick raus." icon="person" aktion={<Button to="/betrieb/lieferanten/neu">Lieferant anlegen</Button>} />
      </Seite>
    );

  const anlegen = () => {
    if (!lid) return setFehler('Wähle einen Lieferanten.');
    const b = inEntwurfUebernehmen(lid, []);
    toast(b.positionen.length ? 'Es gab schon einen Entwurf für diesen Lieferanten – hier ist er.' : 'Entwurf angelegt. Füge jetzt die Positionen hinzu.');
    navigate(`/betrieb/bestellungen/${b.id}`, { replace: true });
  };

  return (
    <Seite titel="Bestellung anlegen" zurueck={{ to: '/betrieb/bestellungen', label: 'Bestellungen' }}>
      <Karte>
        <Stapel>
          <Auswahl label="Lieferant" value={lid} fehler={fehler} onChange={(e) => setLid(e.target.value)} optionen={lieferanten.map((l) => ({ wert: l.id, label: l.name }))} />
          <Meta>Pro Lieferant gibt es einen offenen Entwurf. Positionen aus dem Bedarf landen automatisch darin.</Meta>
          <Zeile>
            <Button onClick={anlegen}>Entwurf anlegen</Button>
            <Button variante="tertiaer" to="/betrieb/bedarf">
              Lieber aus dem Bedarf vorschlagen
            </Button>
          </Zeile>
        </Stapel>
      </Karte>
    </Seite>
  );
}
