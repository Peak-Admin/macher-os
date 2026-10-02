import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { euro, passt, zahl } from '@core/format';
import { useDarf } from '@core/session';
import type { ID } from '@core/objects';
import { BeispielMarke, Button, Dialog, Leer, Liste, ListenZeile, Seite, Stapel, Status, Suchfeld, useToast } from '@ui/index';
import { AuftragAuswahl } from '@ui/objekt';
import { KeinGeldRecht } from '@modules/angebote/AngebotDetail';
import { kalkulationen, rechne, type Kalkulation } from './daten';
import { kalkulationAnlegen } from './KalkulationEditor';

function KalkZeile({ k, mitKunde = true }: { k: Kalkulation; mitKunde?: boolean }) {
  const e = rechne(k);
  const kunde = db.kunden.get(db.auftraege.get(k.auftragId)?.kundeId);
  return (
    <ListenZeile
      to={`/auftraege/kalkulation/${k.id}`}
      titel={
        <>
          {k.titel} <BeispielMarke zeigen={k.beispiel} />
        </>
      }
      untertitel={[mitKunde ? kunde?.name : null, `${zahl(e.summe.stunden)} Std.`, `DB ${zahl(e.summe.dbProzent)} %`].filter(Boolean).join(' · ')}
      rechts={
        <>
          <span className="mm-number">{euro(e.summe.preis)}</span>
          {k.angebotId ? <Status ton="erfolg">Im Angebot</Status> : null}
        </>
      }
    />
  );
}

export function KalkulationListe() {
  useDatenstand();
  const geld = useDarf('geld');
  const [q, setQ] = useState('');
  const [neu, setNeu] = useState(false);
  if (!geld) return <KeinGeldRecht />;
  const liste = kalkulationen
    .all()
    .filter((k) => !q || passt(q, k.titel, db.kunden.get(db.auftraege.get(k.auftragId)?.kundeId)?.name))
    .sort((a, b) => b.geaendertAm.localeCompare(a.geaendertAm));
  return (
    <Seite titel="Kalkulation" untertitel="Stunden, Material, Zuschläge – und was am Ende übrig bleibt." aktion={<Button icon="plus" onClick={() => setNeu(true)}>Kalkulation anlegen</Button>}>
      <Stapel>
        <Suchfeld wert={q} onChange={setQ} platzhalter="Kunde, Titel …" />
        <Liste
          leer={
            q ? (
              <Leer titel="Keine Treffer" icon="suche" />
            ) : (
              <Leer skizze="rechner" titel="Noch keine Kalkulation" text="Kalkuliere größere Aufträge, bevor du anbietest – Lohnkosten und Zuschläge sind schon aus deinem Betrieb vorbelegt." aktion={<Button onClick={() => setNeu(true)}>Kalkulation anlegen</Button>} icon="euro" />
            )
          }
        >
          {liste.map((k) => (
            <KalkZeile key={k.id} k={k} />
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
      titel="Kalkulation anlegen"
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button
            onClick={() => {
              if (!auftragId) return setFehler('Wähle den Auftrag, den du kalkulierst.');
              const k = kalkulationAnlegen(auftragId);
              toast('Kalkulation angelegt.');
              onSchliessen();
              navigate(`/auftraege/kalkulation/${k.id}`);
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

/** Tab „Kalkulation“ in der Auftragsakte */
export function KalkulationTab({ id }: { id: ID }) {
  useDatenstand();
  const geld = useDarf('geld');
  const navigate = useNavigate();
  if (!geld) return <Leer titel="Preise siehst du mit deiner Rolle nicht." icon="schloss" />;
  const liste = kalkulationen.all().filter((k) => k.auftragId === id);
  const anlegen = () => navigate(`/auftraege/kalkulation/${kalkulationAnlegen(id).id}`);
  return (
    <Stapel abstand={12}>
      <Liste leer={<Leer skizze="rechner" titel="Noch keine Kalkulation" text="Rechne Stunden, Material und Zuschläge durch – der Preis geht direkt ins Angebot." aktion={<Button icon="plus" onClick={anlegen}>Kalkulation anlegen</Button>} icon="euro" />}>
        {liste.map((k) => (
          <KalkZeile key={k.id} k={k} mitKunde={false} />
        ))}
      </Liste>
    </Stapel>
  );
}
