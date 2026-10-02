/**
 * Erfassungsblatt für kontextuelle Aktionen: „Foto hinzufügen“, „Notiz schreiben“, „Material buchen“ …
 * Es gibt KEINE Auswahl „Was möchtest du erfassen?“ mehr: Der Knopf im Arbeitskontext öffnet direkt das
 * richtige Formular (`oeffne('schnell', { aktion: 'foto', auftragId })`). Der bekannte Auftrag wird
 * übernommen und sichtbar angezeigt; fehlt er, wird er im Ablauf gewählt.
 */
import { useEffect, useState } from 'react';
import { schnellAktion } from '@core/modul';
import { useOverlay } from '@core/overlay';
import { db, useDatenstand } from '@core/db';
import type { ID } from '@core/objects';
import { useIch } from '@core/session';
import { ERFASSEN_TITEL } from '@ui/objekt';
import { Dialog, Leer, Meta, Segmente, Stapel } from '@ui/index';
import { aktuellerAuftrag } from '@modules/naechster-einsatz/logik';

export interface ErfassenPayload {
  aktion: string;
  auftragId?: ID;
}

export function startAuftrag(payload: unknown, mitarbeiterId: ID | undefined): ID | undefined {
  const p = payload as { auftragId?: ID } | undefined;
  if (p && 'auftragId' in p) return p.auftragId;
  return aktuellerAuftrag(mitarbeiterId);
}

export function SchnellErfassen() {
  useDatenstand();
  const { offen, payload, schliessen } = useOverlay('schnell');
  const ich = useIch();
  const p = payload as ErfassenPayload | undefined;
  const [auftragId, setAuftragId] = useState<ID | undefined>();
  const [aktionId, setAktionId] = useState<string | undefined>();

  useEffect(() => {
    if (offen) {
      setAuftragId(startAuftrag(payload, ich?.id));
      setAktionId(p?.aktion);
    }
    // nur beim Öffnen vorbelegen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offen, payload]);

  if (!offen) return null;
  const aktion = aktionId ? schnellAktion(aktionId) : undefined;
  const auftrag = db.auftraege.get(auftragId);
  const notizArt = aktionId === 'notiz' || aktionId === 'sprachnotiz';

  return (
    <Dialog offen={offen} onSchliessen={schliessen} titel={(aktionId && ERFASSEN_TITEL[aktionId]) ?? aktion?.label ?? 'Erfassen'}>
      {aktion ? (
        <Stapel abstand={16}>
          {/* Bekannter Kontext wird sichtbar angezeigt; fehlt er, fragt das Formular selbst danach */}
          {auftrag && (
            <Meta>
              Zum Auftrag <strong>{auftrag.nummer}</strong> · {auftrag.titel}
            </Meta>
          )}
          {notizArt && schnellAktion('sprachnotiz') && (
            <Segmente
              label="Wie möchtest du die Notiz festhalten?"
              wert={aktionId === 'sprachnotiz' ? 'sprechen' : 'schreiben'}
              onChange={(v) => setAktionId(v === 'sprechen' ? 'sprachnotiz' : 'notiz')}
              optionen={[
                { wert: 'schreiben', label: 'Schreiben' },
                { wert: 'sprechen', label: 'Sprechen' },
              ]}
            />
          )}
          <aktion.component key={aktion.id + (auftragId ?? '')} fertig={schliessen} auftragId={auftragId} />
        </Stapel>
      ) : (
        <Leer icon="info" titel="Diese Aktion gibt es hier nicht" text="Schließe das Fenster und wähle die Aktion direkt am Auftrag oder in der passenden Liste." />
      )}
    </Dialog>
  );
}
