/**
 * Globales Blatt „Schnell erfassen“: ein Tipp → Foto, Zeit, Material, Aufgabe …
 * Die Aktionen liefern andere Module (`schnell` in defineModul). Wir wählen nur den
 * passenden Auftrag vor und reichen ihn als `auftragId` durch.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { alleSchnellAktionen, pfadZu, type SchnellAktion } from '@core/modul';
import { useOverlay } from '@core/overlay';
import { db, useDatenstand } from '@core/db';
import type { ID } from '@core/objects';
import { useIch } from '@core/session';
import { AuftragAuswahl } from '@ui/objekt';
import { Button, Dialog, Icon, Leer, Meta, Stapel } from '@ui/index';
import { aktuellerAuftrag } from '@modules/naechster-einsatz/logik';

export function startAuftrag(payload: unknown, mitarbeiterId: ID | undefined): ID | undefined {
  const p = payload as { auftragId?: ID } | undefined;
  if (p && 'auftragId' in p) return p.auftragId;
  return aktuellerAuftrag(mitarbeiterId);
}

export function SchnellErfassen() {
  useDatenstand();
  const { offen, payload, schliessen } = useOverlay('schnell');
  const ich = useIch();
  const navigate = useNavigate();
  const [auftragId, setAuftragId] = useState<ID | undefined>();
  const [aktiv, setAktiv] = useState<SchnellAktion | null>(null);

  useEffect(() => {
    if (offen) {
      setAuftragId(startAuftrag(payload, ich?.id));
      setAktiv(null);
    }
    // nur beim Öffnen vorbelegen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offen, payload]);

  const aktionen = alleSchnellAktionen();
  const auftrag = db.auftraege.get(auftragId);
  const auftragPfad = auftrag ? pfadZu({ typ: 'auftraege', id: auftrag.id }) : undefined;
  const fertig = () => {
    setAktiv(null);
    schliessen();
  };

  return (
    <Dialog offen={offen} onSchliessen={schliessen} titel={aktiv ? aktiv.label : 'Schnell erfassen'}>
      {aktiv ? (
        <Stapel abstand={16}>
          <Button variante="tertiaer" klein icon="zurueck" onClick={() => setAktiv(null)}>
            Andere Aktion wählen
          </Button>
          {auftrag && <Meta>Zum Auftrag {auftrag.nummer} · {auftrag.titel}</Meta>}
          <aktiv.component key={aktiv.id + (auftragId ?? '')} fertig={fertig} auftragId={auftragId} />
        </Stapel>
      ) : (
        <Stapel abstand={16}>
          <AuftragAuswahl wert={auftragId} onChange={(id) => setAuftragId(id || undefined)} label="Zu welchem Auftrag?" />
          {aktionen.length ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(140px, 100%), 1fr))', gap: 'var(--mm-space-3)' }}>
              {aktionen.map((a) => (
                <button key={a.id} type="button" className="mm-auswahlkarte" style={{ flexDirection: 'column', alignItems: 'flex-start', minHeight: 96 }} onClick={() => setAktiv(a)}>
                  <span className="mm-auswahlkarte-icon">
                    <Icon name={a.icon ?? 'plus'} />
                  </span>
                  <span className="mm-auswahlkarte-text">
                    <strong>{a.label}</strong>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <Leer
              icon="kamera"
              titel="Noch nichts zum Erfassen eingerichtet"
              text="Hier erscheinen Foto, Zeit, Material, Aufgabe und Notiz, sobald die passenden Bereiche aktiv sind."
              aktion={
                auftragPfad ? (
                  <Button
                    variante="sekundaer"
                    onClick={() => {
                      schliessen();
                      navigate(auftragPfad);
                    }}
                  >
                    Auftrag öffnen
                  </Button>
                ) : undefined
              }
            />
          )}
        </Stapel>
      )}
    </Dialog>
  );
}
