import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '@core/db';
import { pfadZu } from '@core/modul';
import { datum } from '@core/format';
import { useDarf } from '@core/session';
import { PHASEN, type ID } from '@core/objects';
import { BeispielMarke, Button, Karte, Leer, Liste, ListenZeile, Meta, Raster, Seite, Stapel, Status, ZweiSpalten, useBestaetigen, useToast } from '@ui/index';
import { ObjektLink, ObjektPanels, ObjektTabs, Zeitstrahl } from '@ui/objekt';
import { AnlageDialog, AnlagenKompakt, anlageName, wartungsauftragAnlegen } from './AnlageBausteine';
import { GEWAEHRLEISTUNG_TEXT, WARTUNG_TEXT, gewaehrleistungStatus, historie, naechsteWartungBerechnen, offenerWartungsauftrag, wartungsStatus } from './daten';

const ZURUECK = { to: '/auftraege/anlagen', label: 'Anlagen' };

function Angabe({ label, wert }: { label: string; wert?: string | number }) {
  return (
    <div>
      <p className="mm-label" style={{ marginBottom: 0 }}>
        {label}
      </p>
      <p>{wert ?? '–'}</p>
    </div>
  );
}

export function AnlageDetail() {
  const { id = '' } = useParams();
  const a = db.anlagen.useOne(id);
  const auftraege = db.auftraege.use();
  const ort = db.orte.useOne(a?.ortId);
  const kunde = db.kunden.useOne(a?.kundeId);
  const [bearbeiten, setBearbeiten] = useState(false);
  const [fragen, dialog] = useBestaetigen();
  const darfLoeschen = useDarf('loeschen');
  const navigate = useNavigate();
  const toast = useToast();

  if (!a || a.geloeschtAm)
    return (
      <Seite titel="Anlage nicht gefunden" zurueck={ZURUECK}>
        <Leer titel="Diese Anlage gibt es nicht (mehr)." icon="werkzeug" aktion={<Button variante="sekundaer" to="/auftraege/anlagen">Zu den Anlagen</Button>} />
      </Seite>
    );

  const w = wartungsStatus(a);
  const g = gewaehrleistungStatus(a);
  const offen = offenerWartungsauftrag(a.id, auftraege);
  const hist = historie(a.id, auftraege);
  const naechste = a.naechsteWartung ?? naechsteWartungBerechnen(a);

  const wartungAnlegen = () => {
    const neu = wartungsauftragAnlegen(a);
    toast(`Wartungsauftrag ${neu.nummer} ist angelegt.`);
    const p = pfadZu({ typ: 'auftraege', id: neu.id });
    if (p) navigate(p);
  };

  const loeschen = async () => {
    if (!(await fragen(`${a.typ} löschen?`, 'Die Anlage kommt in den Papierkorb. Aufträge bleiben erhalten.', 'In den Papierkorb'))) return;
    db.anlagen.remove(a.id);
    toast(`${a.typ} liegt im Papierkorb.`, { aktion: { label: 'Rückgängig', onClick: () => db.anlagen.restore(a.id) } });
    navigate('/auftraege/anlagen', { replace: true });
  };

  return (
    <Seite
      titel={anlageName(a)}
      oberzeile={ort ? `${ort.adresse.strasse}, ${ort.adresse.ort}` : undefined}
      status={<BeispielMarke zeigen={a.beispiel} />}
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
            <Karte
              titel="Wartung"
              aktion={<Status ton={WARTUNG_TEXT[w].ton}>{WARTUNG_TEXT[w].text}</Status>}
            >
              <Stapel abstand={16}>
                <Raster min={140}>
                  <Angabe label="Intervall" wert={a.wartungMonate ? `alle ${a.wartungMonate} Monate` : undefined} />
                  <Angabe label="Letzte Wartung" wert={a.letzteWartung ? datum(a.letzteWartung) : undefined} />
                  <Angabe label="Nächste Wartung" wert={naechste ? datum(naechste) : undefined} />
                </Raster>
                {offen ? (
                  <LaufenderAuftrag offen={offen.id} nummer={offen.nummer} phase={PHASEN.find((p) => p.id === offen.phase)?.label ?? ''} />
                ) : w === 'keine' ? (
                  <Meta>Trag ein Wartungsintervall ein, dann erinnert Macher rechtzeitig.</Meta>
                ) : (
                  <div>
                    <Button icon="plus" variante={w === 'ok' ? 'sekundaer' : 'primaer'} onClick={wartungAnlegen}>
                      Wartungsauftrag anlegen
                    </Button>
                  </div>
                )}
              </Stapel>
            </Karte>
            <ObjektTabs
              objekt="anlagen"
              id={a.id}
              eigene={[
                { id: 'historie', titel: 'Historie', zaehler: hist.length, inhalt: <Historie anlageId={a.id} /> },
                {
                  id: 'daten',
                  titel: 'Daten',
                  inhalt: (
                    <Raster min={160}>
                      <Angabe label="Hersteller" wert={a.hersteller} />
                      <Angabe label="Modell" wert={a.modell} />
                      <Angabe label="Seriennummer" wert={a.seriennummer} />
                      <Angabe label="Baujahr" wert={a.baujahr} />
                      <Angabe label="Eingebaut am" wert={a.eingebautAm ? datum(a.eingebautAm) : undefined} />
                      <Angabe label="Notiz" wert={a.notiz} />
                    </Raster>
                  ),
                },
                { id: 'verlauf', titel: 'Verlauf', inhalt: <Zeitstrahl bezug={{ typ: 'anlagen', id: a.id }} /> },
              ]}
            />
          </Stapel>
        }
        seite={
          <>
            <Karte titel="Gewährleistung" kompakt>
              <Stapel abstand={8}>
                <Status ton={GEWAEHRLEISTUNG_TEXT[g].ton}>{GEWAEHRLEISTUNG_TEXT[g].text}</Status>
                <Meta>{a.gewaehrleistungBis ? `bis ${datum(a.gewaehrleistungBis)}` : 'Kein Datum hinterlegt.'}</Meta>
              </Stapel>
            </Karte>
            <Karte titel="Steht bei" kompakt>
              <Stapel abstand={8}>
                {kunde && <ObjektLink bezug={{ typ: 'kunden', id: kunde.id }}>{kunde.name}</ObjektLink>}
                {ort && <ObjektLink bezug={{ typ: 'orte', id: ort.id }}>{`${ort.bezeichnung}, ${ort.adresse.strasse}`}</ObjektLink>}
              </Stapel>
            </Karte>
            <ObjektPanels objekt="anlagen" id={a.id} />
            {darfLoeschen && (
              <div>
                <Button variante="tertiaer" icon="muell" onClick={loeschen}>
                  Anlage löschen
                </Button>
              </div>
            )}
          </>
        }
      />
      {bearbeiten && <AnlageDialog anlage={a} onSchliessen={() => setBearbeiten(false)} onGespeichert={() => toast('Deine Änderungen sind gespeichert.')} />}
      {dialog}
    </Seite>
  );
}

function LaufenderAuftrag({ offen, nummer, phase }: { offen: ID; nummer: string; phase: string }) {
  return (
    <Meta>
      Wartungsauftrag läuft: <ObjektLink bezug={{ typ: 'auftraege', id: offen }}>{nummer}</ObjektLink> ({phase})
    </Meta>
  );
}

function Historie({ anlageId }: { anlageId: ID }) {
  const auftraege = db.auftraege.use();
  const hist = historie(anlageId, auftraege);
  if (!hist.length) return <Leer titel="Noch keine Einsätze an dieser Anlage" text="Aufträge, bei denen die Anlage verknüpft ist, erscheinen hier – Wartungen, Störungen, Reparaturen." icon="uhr" />;
  return (
    <Liste>
      {hist.map((x) => (
        <ListenZeile
          key={x.id}
          to={pfadZu({ typ: 'auftraege', id: x.id })}
          titel={x.titel || x.nummer}
          untertitel={`${x.nummer} · ${datum(x.abgeschlossenAm ?? x.erstelltAm)}`}
          rechts={<Status ton={x.phase === 'erledigt' ? 'erfolg' : x.phase === 'verloren' ? 'neutral' : 'aktiv'}>{PHASEN.find((p) => p.id === x.phase)?.label}</Status>}
        />
      ))}
    </Liste>
  );
}

// ------------------------------------------------------------------ Tabs in fremden Detailansichten

export function AnlagenAmKunden({ id }: { id: ID }) {
  const anlagen = db.anlagen.use((a) => a.kundeId === id, [id]);
  const [anlegen, setAnlegen] = useState(false);
  return (
    <Stapel abstand={12}>
      <AnlagenKompakt anlagen={anlagen} leerText="Bei diesem Kunden ist noch keine Anlage erfasst." />
      <div>
        <Button variante="sekundaer" icon="plus" onClick={() => setAnlegen(true)}>
          Anlage anlegen
        </Button>
      </div>
      {anlegen && <AnlageDialog kundeId={id} onSchliessen={() => setAnlegen(false)} />}
    </Stapel>
  );
}

export function AnlagenAmOrt({ id }: { id: ID }) {
  const anlagen = db.anlagen.use((a) => a.ortId === id, [id]);
  const [anlegen, setAnlegen] = useState(false);
  return (
    <Stapel abstand={12}>
      <AnlagenKompakt anlagen={anlagen} leerText="An diesem Ort ist noch keine Anlage erfasst." />
      <div>
        <Button variante="sekundaer" icon="plus" onClick={() => setAnlegen(true)}>
          Anlage anlegen
        </Button>
      </div>
      {anlegen && <AnlageDialog ortId={id} onSchliessen={() => setAnlegen(false)} />}
    </Stapel>
  );
}

/** Tab am Auftrag: verknüpfte Anlagen + Anlagen am Einsatzort zum Verknüpfen */
export function AnlagenAmAuftrag({ id }: { id: ID }) {
  const auftrag = db.auftraege.useOne(id);
  const anlagen = db.anlagen.use();
  const toast = useToast();
  const [anlegen, setAnlegen] = useState(false);
  if (!auftrag) return null;
  const ids = auftrag.anlageIds ?? [];
  const verknuepft = anlagen.filter((a) => ids.includes(a.id));
  const amOrt = anlagen.filter((a) => !ids.includes(a.id) && ((auftrag.ortId && a.ortId === auftrag.ortId) || (!auftrag.ortId && a.kundeId === auftrag.kundeId)));
  const setzen = (neu: ID[], text: string) => {
    db.auftraege.update(auftrag.id, { anlageIds: neu }, { text });
    toast(text);
  };
  return (
    <Stapel abstand={16}>
      <AnlagenKompakt
        anlagen={verknuepft}
        leerText="Mit diesem Auftrag ist keine Anlage verknüpft."
        aktion={(a) => (
          <Stapel abstand={4}>
            <Button klein variante="tertiaer" to={`/auftraege/anlagen/${a.id}`}>
              Öffnen
            </Button>
            <Button klein variante="tertiaer" onClick={() => setzen(ids.filter((x) => x !== a.id), `${a.typ} vom Auftrag gelöst.`)}>
              Lösen
            </Button>
          </Stapel>
        )}
      />
      {amOrt.length > 0 && (
        <Stapel abstand={8}>
          <Meta>Weitere Anlagen {auftrag.ortId ? 'an diesem Ort' : 'beim Kunden'}:</Meta>
          <AnlagenKompakt
            anlagen={amOrt}
            leerText=""
            aktion={(a) => (
              <Button klein variante="sekundaer" icon="link" onClick={() => setzen([...ids, a.id], `${a.typ} mit dem Auftrag verknüpft.`)}>
                Verknüpfen
              </Button>
            )}
          />
        </Stapel>
      )}
      <div>
        <Button variante="tertiaer" icon="plus" onClick={() => setAnlegen(true)}>
          Neue Anlage erfassen
        </Button>
      </div>
      {anlegen && (
        <AnlageDialog
          kundeId={auftrag.kundeId}
          ortId={auftrag.ortId}
          onSchliessen={() => setAnlegen(false)}
          onGespeichert={(a) => db.auftraege.update(auftrag.id, { anlageIds: [...ids, a.id] }, { text: `${a.typ} erfasst und verknüpft` })}
        />
      )}
    </Stapel>
  );
}
