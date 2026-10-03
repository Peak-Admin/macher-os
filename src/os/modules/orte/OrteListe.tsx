import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@core/db';
import { passt } from '@core/format';
import type { ID } from '@core/objects';
import { BeispielMarke, Button, Dialog, Filter, Leer, Liste, ListenZeile, Seite, Stapel, Status, Suchfeld } from '@ui/index';
import { KundeAuswahl } from '@ui/objekt';
import { hatVorOrtInfos, ortArtLabel } from './daten';
import { OrtDialog } from './OrtBausteine';

type Ansicht = 'alle' | 'aktiv' | 'ohne';

export function OrteListe() {
  const [q, setQ] = useState('');
  const [ansicht, setAnsicht] = useState<Ansicht>('alle');
  const [anlegen, setAnlegen] = useState(false);
  const orte = db.orte.use();
  const kunden = db.kunden.use();
  const aktive = db.auftraege.use((a) => !['erledigt', 'verloren'].includes(a.phase));
  const aktiveOrte = new Set(aktive.map((a) => a.ortId).filter(Boolean));

  const liste = orte
    .filter((o) => {
      const k = kunden.find((x) => x.id === o.kundeId);
      return !q || passt(q, o.bezeichnung, o.adresse.strasse, o.adresse.plz, o.adresse.ort, k?.name, o.ansprechpartnerVorOrt);
    })
    .filter((o) => (ansicht === 'aktiv' ? aktiveOrte.has(o.id) : ansicht === 'ohne' ? !hatVorOrtInfos(o) : true))
    .sort((a, b) => Number(aktiveOrte.has(b.id)) - Number(aktiveOrte.has(a.id)) || a.adresse.ort.localeCompare(b.adresse.ort, 'de') || a.adresse.strasse.localeCompare(b.adresse.strasse, 'de'));

  return (
    <Seite titel="Orte & Baustellen" untertitel="Wo ihr arbeitet – mit allem, was man vor Ort wissen muss." aktion={<Button icon="plus" onClick={() => setAnlegen(true)}>Ort anlegen</Button>}>
      <Stapel abstand={16}>
        <Suchfeld wert={q} onChange={setQ} platzhalter="Straße, Ort, Kunde …" />
        <Filter
          label="Orte filtern"
          wert={ansicht}
          onChange={setAnsicht}
          optionen={[
            { wert: 'alle', label: 'Alle', zaehler: orte.length },
            { wert: 'aktiv', label: 'Mit laufendem Auftrag', zaehler: orte.filter((o) => aktiveOrte.has(o.id)).length },
            { wert: 'ohne', label: 'Ohne Zugangsinfos', zaehler: orte.filter((o) => !hatVorOrtInfos(o)).length },
          ]}
        />
        <Liste
          leer={
            q || ansicht !== 'alle' ? (
              <Leer titel="Keine Treffer" text="Zu dieser Suche oder diesem Filter gibt es keine Orte." icon="suche" aktion={<Button variante="sekundaer" onClick={() => (setQ(''), setAnsicht('alle'))}>Filter zurücksetzen</Button>} />
            ) : (
              <Leer titel="Noch keine Orte" text="Lege Häuser, Wohnungen und Baustellen an – mit Zugang, Parken und Schlüssel. Dann muss niemand mehr im Büro anrufen." icon="ort" aktion={<Button onClick={() => setAnlegen(true)}>Ort anlegen</Button>} />
            )
          }
        >
          {liste.map((o) => {
            const k = kunden.find((x) => x.id === o.kundeId);
            return (
              <ListenZeile
                key={o.id}
                to={`/auftraege/orte/${o.id}`}
                titel={
                  <>
                    {o.adresse.strasse}, {o.adresse.ort} <BeispielMarke zeigen={o.beispiel} />
                  </>
                }
                untertitel={[o.bezeichnung, ortArtLabel(o.art), k?.name].filter(Boolean).join(' · ')}
                rechts={aktiveOrte.has(o.id) ? <Status ton="aktiv">Laufender Auftrag</Status> : !hatVorOrtInfos(o) ? <Status ton="neutral">Ohne Zugangsinfos</Status> : null}
              />
            );
          })}
        </Liste>
      </Stapel>
      {anlegen && <OrtAnlegen onSchliessen={() => setAnlegen(false)} />}
    </Seite>
  );
}

/** Erst Kunde wählen (falls nicht bekannt), dann Ort erfassen */
export function OrtAnlegen({ kundeId, onSchliessen }: { kundeId?: ID; onSchliessen: () => void }) {
  const navigate = useNavigate();
  const [kunde, setKunde] = useState<ID | undefined>(kundeId);
  const [gewaehlt, setGewaehlt] = useState('');
  const [fehler, setFehler] = useState<string>();
  if (kunde) return <OrtDialog kundeId={kunde} onSchliessen={onSchliessen} onGespeichert={(o) => !kundeId && navigate(`/auftraege/orte/${o.id}`)} />;
  return (
    <Dialog
      offen
      titel="Ort anlegen"
      icon="ort"
      onSchliessen={onSchliessen}
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button onClick={() => (gewaehlt ? setKunde(gewaehlt) : setFehler('Wähle den Kunden, zu dem der Ort gehört.'))}>Weiter</Button>
        </>
      }
    >
      <Stapel abstand={8}>
        <KundeAuswahl label="Zu welchem Kunden gehört der Ort?" wert={gewaehlt} onChange={(id) => (setGewaehlt(id), setFehler(undefined))} />
        {fehler && (
          <p className="mm-fehlertext" role="alert">
            {fehler}
          </p>
        )}
      </Stapel>
    </Dialog>
  );
}
