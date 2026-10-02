import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@core/db';
import { relativ, uhrzeit } from '@core/format';
import { pfadZu } from '@core/modul';
import { useIch } from '@core/session';
import { Button, Filter, Leer, Liste, ListenZeile, Stapel, Status, Zeile, useToast } from '@ui/index';
import { alleGelesen, fuerMich } from './daten';

/** Liste der Benachrichtigungen – im Glocken-Overlay und auf der Seite gleich. */
export function BenachrichtigungsListe({ onNavigiert }: { onNavigiert?: () => void }) {
  const ich = useIch();
  const navigate = useNavigate();
  const toast = useToast();
  const alle = fuerMich(db.benachrichtigungen.use(), ich?.id);
  const ungelesen = alle.filter((b) => !b.gelesen);
  const [zeigen, setZeigen] = useState<'neu' | 'alle'>(ungelesen.length ? 'neu' : 'alle');
  const liste = zeigen === 'neu' ? ungelesen : alle.slice(0, 50);

  const oeffnen = (id: string) => {
    const b = db.benachrichtigungen.get(id);
    if (!b) return;
    if (!b.gelesen) db.benachrichtigungen.update(id, { gelesen: true }, { leise: true });
    const pfad = pfadZu(b.bezug);
    if (pfad) {
      onNavigiert?.();
      navigate(pfad);
    }
  };

  return (
    <Stapel abstand={16}>
      <Zeile zwischen>
        <Filter
          label="Benachrichtigungen zeigen"
          wert={zeigen}
          onChange={setZeigen}
          optionen={[
            { wert: 'neu', label: 'Ungelesen', zaehler: ungelesen.length },
            { wert: 'alle', label: 'Alle' },
          ]}
        />
        {ungelesen.length > 0 && (
          <Button
            variante="tertiaer"
            klein
            icon="check"
            onClick={() => {
              alleGelesen(ungelesen);
              toast('Alles als gelesen markiert.');
            }}
          >
            Alle als gelesen markieren
          </Button>
        )}
      </Zeile>
      <Liste
        leer={
          <Leer
            icon="glocke"
            titel={zeigen === 'neu' ? 'Nichts Neues' : 'Noch keine Benachrichtigungen'}
            text="Macher meldet sich nur, wenn du reagieren solltest: neue Anfrage, Kundennachricht, Urlaubsantrag, angenommenes Angebot, Zahlungseingang oder eine Aufgabe für dich."
            aktion={zeigen === 'neu' && alle.length ? <Button variante="sekundaer" onClick={() => setZeigen('alle')}>Gelesene zeigen</Button> : undefined}
          />
        }
      >
        {liste.map((b) => (
          <ListenZeile
            key={b.id}
            titel={b.titel}
            untertitel={[b.text, `${relativ(b.erstelltAm)}, ${uhrzeit(b.erstelltAm)} Uhr`].filter(Boolean).join(' · ')}
            aktiv={!b.gelesen}
            rechts={!b.gelesen ? <Status ton={b.wichtig ? 'achtung' : 'aktiv'}>{b.wichtig ? 'Wichtig' : 'Neu'}</Status> : <Status>Gelesen</Status>}
            onClick={() => oeffnen(b.id)}
          />
        ))}
      </Liste>
    </Stapel>
  );
}
