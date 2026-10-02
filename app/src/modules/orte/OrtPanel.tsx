import { useState } from 'react';
import { db } from '@core/db';
import type { ID } from '@core/objects';
import { Button, Karte, Meta, Stapel } from '@ui/index';
import { OrtDialog, VorOrtInfos } from './OrtBausteine';
import { passenderOrt } from './daten';

/** Panel „Einsatzort“ am Auftrag und am Termin – Navigation, Ansprechpartner, Zugang auf einen Blick */
function EinsatzortKarte({ ortId, kundeId, onOrtGewaehlt }: { ortId?: ID; kundeId?: ID; onOrtGewaehlt?: (id: ID) => void }) {
  const ort = db.orte.useOne(ortId);
  const orte = db.orte.use((o) => o.kundeId === kundeId, [kundeId]);
  const [bearbeiten, setBearbeiten] = useState(false);
  const [anlegen, setAnlegen] = useState(false);

  if (ort && !ort.geloeschtAm)
    return (
      <Karte titel="Einsatzort" oberzeile={ort.bezeichnung} kompakt aktion={<Button klein variante="tertiaer" to={`/auftraege/orte/${ort.id}`}>Öffnen</Button>}>
        <VorOrtInfos ort={ort} onBearbeiten={() => setBearbeiten(true)} />
        {bearbeiten && <OrtDialog ort={ort} onSchliessen={() => setBearbeiten(false)} />}
      </Karte>
    );

  if (!kundeId || !onOrtGewaehlt) return null;
  const vorschlag = passenderOrt({ kundeId, ortId: undefined }, orte);
  return (
    <Karte titel="Einsatzort" kompakt>
      <Stapel abstand={8}>
        <Meta>Noch kein Einsatzort gewählt. Ohne Ort fehlt dem Monteur die Adresse.</Meta>
        {orte.map((o) => (
          <Button key={o.id} klein variante={o.id === vorschlag?.id ? 'primaer' : 'sekundaer'} icon="ort" onClick={() => onOrtGewaehlt(o.id)}>
            {o.bezeichnung}: {o.adresse.strasse}
          </Button>
        ))}
        <Button klein variante="tertiaer" icon="plus" onClick={() => setAnlegen(true)}>
          Neuen Ort anlegen
        </Button>
      </Stapel>
      {anlegen && <OrtDialog kundeId={kundeId} onSchliessen={() => setAnlegen(false)} onGespeichert={(o) => onOrtGewaehlt(o.id)} />}
    </Karte>
  );
}

export function OrtPanelAuftrag({ id }: { id: ID }) {
  const a = db.auftraege.useOne(id);
  if (!a) return null;
  return <EinsatzortKarte ortId={a.ortId} kundeId={a.kundeId} onOrtGewaehlt={(ortId) => db.auftraege.update(a.id, { ortId }, { text: 'Einsatzort gewählt' })} />;
}

export function OrtPanelTermin({ id }: { id: ID }) {
  const t = db.termine.useOne(id);
  const auftrag = db.auftraege.useOne(t?.auftragId);
  if (!t) return null;
  return <EinsatzortKarte ortId={t.ortId ?? auftrag?.ortId} />;
}
