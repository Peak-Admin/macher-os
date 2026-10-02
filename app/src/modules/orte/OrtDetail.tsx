import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '@core/db';
import { pfadZu } from '@core/modul';
import { datum, telLink } from '@core/format';
import { useDarf } from '@core/session';
import { PHASEN, type ID } from '@core/objects';
import { BeispielMarke, Button, Karte, Leer, Liste, ListenZeile, Meta, Seite, Stapel, Status, ZweiSpalten, useBestaetigen, useToast } from '@ui/index';
import { ObjektLink, ObjektPanels, ObjektTabs, Zeitstrahl } from '@ui/objekt';
import { ortArtLabel } from './daten';
import { OrtDialog, VorOrtInfos } from './OrtBausteine';
import { OrtAnlegen } from './OrteListe';

const ZURUECK = { to: '/auftraege/orte', label: 'Orte & Baustellen' };

export function OrtDetail() {
  const { id = '' } = useParams();
  const o = db.orte.useOne(id);
  const kunde = db.kunden.useOne(o?.kundeId);
  const auftraege = db.auftraege.use((a) => a.ortId === id, [id]);
  const [bearbeiten, setBearbeiten] = useState(false);
  const [fragen, dialog] = useBestaetigen();
  const darfLoeschen = useDarf('loeschen');
  const navigate = useNavigate();
  const toast = useToast();

  if (!o || o.geloeschtAm)
    return (
      <Seite titel="Ort nicht gefunden" zurueck={ZURUECK}>
        <Leer titel="Diesen Ort gibt es nicht (mehr)." icon="ort" aktion={<Button variante="sekundaer" to="/auftraege/orte">Zu den Orten</Button>} />
      </Seite>
    );

  const loeschen = async () => {
    const offen = auftraege.filter((a) => !['erledigt', 'verloren'].includes(a.phase)).length;
    const ok = await fragen(
      `${o.bezeichnung} löschen?`,
      `${offen ? `Achtung: Hier laufen noch ${offen} Aufträge. ` : ''}Der Ort kommt in den Papierkorb. Aufträge und Anlagen bleiben erhalten.`,
      'In den Papierkorb',
    );
    if (!ok) return;
    db.orte.remove(o.id);
    toast(`${o.bezeichnung} liegt im Papierkorb.`, { aktion: { label: 'Rückgängig', onClick: () => db.orte.restore(o.id) } });
    navigate(kunde ? `/auftraege/kunden/${kunde.id}` : '/auftraege/orte', { replace: true });
  };

  return (
    <Seite
      titel={`${o.adresse.strasse}, ${o.adresse.ort}`}
      oberzeile={`${o.bezeichnung} · ${ortArtLabel(o.art)}`}
      status={<BeispielMarke zeigen={o.beispiel} />}
      zurueck={ZURUECK}
      aktion={
        <Button icon="stift" variante="sekundaer" onClick={() => setBearbeiten(true)}>
          Bearbeiten
        </Button>
      }
    >
      <ZweiSpalten
        haupt={
          <Stapel abstand={24}>
            <Karte titel="Vor Ort wichtig">
              <VorOrtInfos ort={o} onBearbeiten={() => setBearbeiten(true)} />
            </Karte>
            <ObjektTabs
              objekt="orte"
              id={o.id}
              eigene={[
                { id: 'auftraege', titel: 'Aufträge', zaehler: auftraege.length, inhalt: <AuftraegeAmOrt ortId={o.id} /> },
                { id: 'verlauf', titel: 'Verlauf', inhalt: <Zeitstrahl bezug={{ typ: 'orte', id: o.id }} /> },
              ]}
            />
          </Stapel>
        }
        seite={
          <>
            {kunde && (
              <Karte titel="Kunde" kompakt>
                <Stapel abstand={8}>
                  <ObjektLink bezug={{ typ: 'kunden', id: kunde.id }}>{kunde.name}</ObjektLink>
                  {kunde.telefon && <a href={telLink(kunde.telefon)}>{kunde.telefon}</a>}
                </Stapel>
              </Karte>
            )}
            <ObjektPanels objekt="orte" id={o.id} />
            {darfLoeschen && (
              <div>
                <Button variante="tertiaer" icon="muell" onClick={loeschen}>
                  Ort löschen
                </Button>
              </div>
            )}
          </>
        }
      />
      {bearbeiten && <OrtDialog ort={o} onSchliessen={() => setBearbeiten(false)} />}
      {dialog}
    </Seite>
  );
}

function AuftraegeAmOrt({ ortId }: { ortId: ID }) {
  const auftraege = db.auftraege.use((a) => a.ortId === ortId, [ortId]);
  if (!auftraege.length) return <Leer titel="Hier gab es noch keine Aufträge" text="Aufträge mit diesem Einsatzort erscheinen hier automatisch." icon="auftraege" />;
  return (
    <Liste>
      {[...auftraege]
        .sort((a, b) => b.erstelltAm.localeCompare(a.erstelltAm))
        .map((a) => (
          <ListenZeile
            key={a.id}
            to={pfadZu({ typ: 'auftraege', id: a.id })}
            titel={a.titel || a.nummer}
            untertitel={`${a.nummer} · ${datum(a.erstelltAm)}`}
            rechts={<Status ton={a.phase === 'erledigt' ? 'erfolg' : a.phase === 'verloren' ? 'neutral' : 'aktiv'}>{PHASEN.find((p) => p.id === a.phase)?.label}</Status>}
          />
        ))}
    </Liste>
  );
}

/** Tab „Orte“ am Kunden */
export function OrteAmKunden({ id }: { id: ID }) {
  const orte = db.orte.use((o) => o.kundeId === id, [id]);
  const [anlegen, setAnlegen] = useState(false);
  return (
    <Stapel abstand={12}>
      {orte.length ? (
        <Liste>
          {orte.map((o) => (
            <ListenZeile key={o.id} to={`/auftraege/orte/${o.id}`} titel={o.bezeichnung} untertitel={`${o.adresse.strasse}, ${o.adresse.plz} ${o.adresse.ort}`} rechts={o.hinweise ? <Meta>Zugangsinfos vorhanden</Meta> : null} />
          ))}
        </Liste>
      ) : (
        <Leer titel="Noch kein Ort" text="Lege an, wo ihr für diesen Kunden arbeitet – mit Zugang, Parken und Schlüssel." icon="ort" />
      )}
      <div>
        <Button variante="sekundaer" icon="plus" onClick={() => setAnlegen(true)}>
          Ort anlegen
        </Button>
      </div>
      {anlegen && <OrtAnlegen kundeId={id} onSchliessen={() => setAnlegen(false)} />}
    </Stapel>
  );
}
