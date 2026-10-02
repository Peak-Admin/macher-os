import { useState } from 'react';
import { db } from '@core/db';
import type { ID } from '@core/objects';
import { Auswahl, Button, Leer, Liste, ListenZeile, Meta, Stapel, Status, Zeile, useToast } from '@ui/index';
import { checklisteAnlegen, checklistePfad, checklisten, checklistenVorlagen, passendeVorlagen, stand } from './daten';

/** Checklisten eines Auftrags (im Tab „Aufgaben & Checklisten“) */
export function ChecklistenAmAuftrag({ auftragId, terminId }: { auftragId: ID; terminId?: ID }) {
  const toast = useToast();
  const liste = checklisten.use((c) => c.auftragId === auftragId, [auftragId]);
  const vorlagen = checklistenVorlagen.use((v) => v.aktiv);
  const a = db.auftraege.get(auftragId);
  const gewerk = db.betrieb.get('betrieb')?.gewerk;
  const passend = a ? passendeVorlagen(vorlagen, gewerk, a.art) : [];
  const andere = vorlagen.filter((v) => !passend.includes(v));
  const [wahl, setWahl] = useState('');

  const hinzufuegen = () => {
    const id = wahl || passend[0]?.id || vorlagen[0]?.id;
    if (!id) return;
    const c = checklisteAnlegen(id, auftragId, terminId);
    if (c) toast(`Checkliste „${c.titel}“ hinzugefügt.`);
    setWahl('');
  };

  return (
    <Stapel abstand={12}>
      <Liste leer={<Meta>Noch keine Checkliste an diesem Auftrag.</Meta>}>
        {liste.map((c) => {
          const s = stand(c);
          return (
            <ListenZeile
              key={c.id}
              to={checklistePfad(c.id)}
              titel={c.titel}
              untertitel={`${s.erledigt} von ${s.gesamt} erledigt${s.offenePflicht ? ` · ${s.offenePflicht} Pflicht offen` : ''}`}
              rechts={s.fertig ? <Status ton="erfolg">Fertig</Status> : s.offenePflicht ? <Status ton="achtung">Offen</Status> : <Status ton="aktiv">Läuft</Status>}
            />
          );
        })}
      </Liste>
      {vorlagen.length > 0 ? (
        <Zeile abstand={8}>
          <div style={{ flex: '1 1 240px' }}>
            <Auswahl
              label="Checkliste hinzufügen"
              value={wahl || passend[0]?.id || ''}
              onChange={(e) => setWahl(e.target.value)}
              optionen={[...passend, ...andere].map((v) => ({ wert: v.id, label: passend.includes(v) ? v.name : `${v.name} (andere Auftragsart)` }))}
            />
          </div>
          <div style={{ alignSelf: 'flex-end' }}>
            <Button variante="sekundaer" icon="plus" onClick={hinzufuegen}>
              Hinzufügen
            </Button>
          </div>
        </Zeile>
      ) : (
        <Leer titel="Noch keine Vorlagen" text="Leg eine Checklisten-Vorlage an, dann kannst du sie an jedem Auftrag nutzen." icon="liste" aktion={<Button variante="sekundaer" to="/auftraege/checklisten/vorlage/neu">Vorlage anlegen</Button>} />
      )}
    </Stapel>
  );
}
