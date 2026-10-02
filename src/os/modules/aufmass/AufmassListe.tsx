import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { datum, passt, zahl } from '@core/format';
import type { ID } from '@core/objects';
import { BeispielMarke, Button, Dialog, Leer, Liste, ListenZeile, Seite, Stapel, Status, Suchfeld, useToast } from '@ui/index';
import { AuftragAuswahl } from '@ui/objekt';
import { aufmasse, zusammenfassen, type Aufmass } from './daten';
import { aufmassAnlegen } from './AufmassEditor';

function AufmassZeile({ a, mitAuftrag = true }: { a: Aufmass; mitAuftrag?: boolean }) {
  const auftrag = db.auftraege.get(a.auftragId);
  const s = zusammenfassen(a);
  return (
    <ListenZeile
      to={`/auftraege/aufmass/${a.id}`}
      titel={
        <>
          {a.titel} <BeispielMarke zeigen={a.beispiel} />
        </>
      }
      untertitel={[mitAuftrag && auftrag ? `${db.kunden.get(auftrag.kundeId)?.name ?? ''}` : null, datum(a.datum), a.raeume.length === 1 ? '1 Raum' : `${a.raeume.length} Räume`, s.length ? s.slice(0, 2).map((x) => `${zahl(x.menge)} ${x.einheit}`).join(', ') : null].filter(Boolean).join(' · ')}
      rechts={a.angebotId ? <Status ton="erfolg">Im Angebot</Status> : s.length ? <Status ton="aktiv">Bereit</Status> : <Status>Leer</Status>}
    />
  );
}

export function AufmassListe() {
  useDatenstand();
  const [q, setQ] = useState('');
  const [neu, setNeu] = useState(false);
  const liste = aufmasse
    .all()
    .filter((a) => !q || passt(q, a.titel, db.kunden.get(db.auftraege.get(a.auftragId)?.kundeId)?.name, a.raeume.map((r) => r.name).join(' ')))
    .sort((a, b) => b.geaendertAm.localeCompare(a.geaendertAm));
  return (
    <Seite titel="Aufmaß" untertitel="Vor Ort messen, Mengen direkt ins Angebot." aktion={<Button icon="plus" onClick={() => setNeu(true)}>Aufmaß anlegen</Button>}>
      <Stapel>
        <Suchfeld wert={q} onChange={setQ} platzhalter="Kunde, Raum, Titel …" />
        <Liste
          leer={
            q ? (
              <Leer titel="Keine Treffer" icon="suche" />
            ) : (
              <Leer titel="Noch kein Aufmaß" text="Leg ein Aufmaß zum Auftrag an – am besten direkt vor Ort am Handy." aktion={<Button onClick={() => setNeu(true)}>Aufmaß anlegen</Button>} icon="liste" />
            )
          }
        >
          {liste.map((a) => (
            <AufmassZeile key={a.id} a={a} />
          ))}
        </Liste>
      </Stapel>
      <NeuDialog offen={neu} onSchliessen={() => setNeu(false)} />
    </Seite>
  );
}

function NeuDialog({ offen, onSchliessen }: { offen: boolean; onSchliessen: () => void }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [auftragId, setAuftragId] = useState<ID>();
  const [fehler, setFehler] = useState<string>();
  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel="Aufmaß anlegen"
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button
            onClick={() => {
              if (!auftragId) return setFehler('Wähle den Auftrag, zu dem du misst.');
              const a = aufmassAnlegen(auftragId);
              toast('Aufmaß angelegt.');
              onSchliessen();
              navigate(`/auftraege/aufmass/${a.id}`);
            }}
          >
            Anlegen
          </Button>
        </>
      }
    >
      <AuftragAuswahl wert={auftragId} onChange={(id) => (setAuftragId(id || undefined), setFehler(undefined))} label="Zu Auftrag oder Anfrage" />
      {fehler && (
        <p className="mm-fehlertext" role="alert">
          {fehler}
        </p>
      )}
    </Dialog>
  );
}

/** Tab „Aufmaß“ in der Auftragsakte */
export function AufmassTab({ id }: { id: ID }) {
  useDatenstand();
  const navigate = useNavigate();
  const liste = aufmasse.all().filter((a) => a.auftragId === id);
  const anlegen = () => navigate(`/auftraege/aufmass/${aufmassAnlegen(id).id}`);
  return (
    <Stapel abstand={12}>
      <Liste leer={<Leer skizze="lineal" titel="Noch kein Aufmaß" text="Miss vor Ort – die Mengen landen mit einem Klick im Angebot." aktion={<Button icon="plus" onClick={anlegen}>Aufmaß anlegen</Button>} icon="liste" />}>
        {liste.map((a) => (
          <AufmassZeile key={a.id} a={a} mitAuftrag={false} />
        ))}
      </Liste>
      {liste.length > 0 && (
        <div>
          <Button variante="sekundaer" icon="plus" onClick={anlegen}>
            Weiteres Aufmaß
          </Button>
        </div>
      )}
    </Stapel>
  );
}
