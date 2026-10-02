import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { datum, euro, heute, passt, relativ } from '@core/format';
import { useDarf } from '@core/session';
import type { Angebot, ID } from '@core/objects';
import { BeispielMarke, Button, Dialog, Filter, Kennzahl, Leer, Liste, ListenZeile, Raster, Seite, Stapel, Status, Suchfeld, useToast } from '@ui/index';
import { AuftragAuswahl } from '@ui/objekt';
import { STATUS_TEXT, STATUS_TON, angebotSummen, istAktuelleVersion, laeuftBaldAb, nachfassenFaellig, nachfassenTage, neuesAngebot } from './daten';
import { KeinGeldRecht } from './AngebotDetail';

type Sicht = 'offen' | 'entwurf' | 'angenommen' | 'erledigt' | 'alle';

export function AngebotZeile({ a, ohneKunde }: { a: Angebot; ohneKunde?: boolean }) {
  const tag = heute();
  const k = db.kunden.get(a.kundeId);
  const hinweis = nachfassenFaellig(a, tag, nachfassenTage()) ? 'Nachfassen' : laeuftBaldAb(a, tag) ? `Läuft ${relativ(a.gueltigBis)} ab` : undefined;
  return (
    <ListenZeile
      to={`/auftraege/angebote/${a.id}`}
      titel={
        <>
          {a.titel} <BeispielMarke zeigen={a.beispiel} />
        </>
      }
      untertitel={[a.nummer + (a.version > 1 ? ` V${a.version}` : ''), ohneKunde ? null : k?.name, a.status === 'versendet' && a.versendetAm ? `versendet ${relativ(a.versendetAm)}` : datum(a.datum)].filter(Boolean).join(' · ')}
      rechts={
        <>
          <span className="mm-number">{euro(angebotSummen(a).brutto)}</span>
          {hinweis ? <Status ton="achtung">{hinweis}</Status> : <Status ton={STATUS_TON[a.status]}>{STATUS_TEXT[a.status]}</Status>}
        </>
      }
    />
  );
}

export function AngeboteListe() {
  useDatenstand();
  const geld = useDarf('geld');
  const [sicht, setSicht] = useState<Sicht>('offen');
  const [q, setQ] = useState('');
  const [params] = useSearchParams();
  const [neuOffen, setNeuOffen] = useState(false);
  const neuParam = params.get('neu') === '1';
  useEffect(() => {
    if (neuParam) setNeuOffen(true);
  }, [neuParam]);
  if (!geld) return <KeinGeldRecht />;

  const tag = heute();
  const alle = db.angebote.all();
  const aktuelle = alle.filter((a) => istAktuelleVersion(a, alle));
  const passend = (a: Angebot) => !q || passt(q, a.titel, a.nummer, db.kunden.get(a.kundeId)?.name);
  const nach: Record<Sicht, (a: Angebot) => boolean> = {
    offen: (a) => a.status === 'versendet',
    entwurf: (a) => a.status === 'entwurf',
    angenommen: (a) => a.status === 'angenommen',
    erledigt: (a) => a.status === 'abgelehnt' || a.status === 'abgelaufen',
    alle: () => true,
  };
  const liste = aktuelle.filter(nach[sicht]).filter(passend).sort((a, b) => b.geaendertAm.localeCompare(a.geaendertAm));
  const offen = aktuelle.filter(nach.offen);
  const nachfassen = offen.filter((a) => nachfassenFaellig(a, tag, nachfassenTage()));
  const summeOffen = offen.reduce((s, a) => s + angebotSummen(a).brutto, 0);
  const seit90 = new Date(Date.now() - 90 * 86_400_000).toISOString();
  const entschieden = aktuelle.filter((a) => (a.status === 'angenommen' || a.status === 'abgelehnt') && (a.entschiedenAm ?? '') >= seit90);
  const quote = entschieden.length >= 3 ? Math.round((entschieden.filter((a) => a.status === 'angenommen').length / entschieden.length) * 100) : undefined;

  return (
    <Seite titel="Angebote" untertitel="Schreiben, versenden, nachfassen – bis zum Auftrag." aktion={<Button icon="plus" onClick={() => setNeuOffen(true)}>Angebot erstellen</Button>}>
      <Stapel>
        <Raster min={200}>
          <Kennzahl label="Offen beim Kunden" wert={euro(summeOffen)} hinweis={offen.length === 1 ? '1 Angebot' : `${offen.length} Angebote`} />
          <Kennzahl label="Nachfassen fällig" wert={nachfassen.length} ton={nachfassen.length ? 'achtung' : undefined} hinweis={`ohne Antwort seit ${nachfassenTage()} Tagen`} />
          <Kennzahl label="Annahmequote" wert={quote != null ? `${quote} %` : null} zeitraum="letzte 90 Tage" hinweis={quote == null ? 'ab 3 Entscheidungen' : `${entschieden.length} entschieden`} />
        </Raster>
        <Filter
          label="Status"
          wert={sicht}
          onChange={setSicht}
          optionen={[
            { wert: 'offen', label: 'Versendet', zaehler: offen.length },
            { wert: 'entwurf', label: 'Entwürfe', zaehler: aktuelle.filter(nach.entwurf).length },
            { wert: 'angenommen', label: 'Angenommen' },
            { wert: 'erledigt', label: 'Abgelehnt & abgelaufen' },
            { wert: 'alle', label: 'Alle' },
          ]}
        />
        <Suchfeld wert={q} onChange={setQ} platzhalter="Kunde, Titel, Nummer …" />
        <Liste
          leer={
            q ? (
              <Leer titel="Keine Treffer" text="Zu dieser Suche gibt es kein Angebot." icon="suche" />
            ) : (
              <Leer
                titel={sicht === 'offen' ? 'Kein Angebot wartet auf Antwort' : 'Hier ist nichts'}
                text="Angebote entstehen aus einer Anfrage, einem Aufmaß oder einer Kalkulation – oder direkt hier."
                aktion={<Button onClick={() => setNeuOffen(true)}>Angebot erstellen</Button>}
                icon="dokument"
              />
            )
          }
        >
          {liste.map((a) => (
            <AngebotZeile key={a.id} a={a} />
          ))}
        </Liste>
      </Stapel>
      <NeuDialog offen={neuOffen} onSchliessen={() => setNeuOffen(false)} />
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
      titel="Angebot erstellen"
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button
            onClick={() => {
              if (!auftragId) return setFehler('Wähle den Auftrag oder die Anfrage, zu der das Angebot gehört.');
              const a = neuesAngebot(auftragId);
              toast('Angebotsentwurf angelegt.');
              onSchliessen();
              navigate(`/auftraege/angebote/${a.id}`);
            }}
          >
            Entwurf anlegen
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
      <p className="mm-meta">
        Neuer Kunde? Erfasse zuerst die <Link to="/auftraege/anfragen/neu" onClick={onSchliessen}>Anfrage</Link> – der Kunde wird dabei automatisch angelegt.
      </p>
    </Dialog>
  );
}

/** Tab „Angebote“ in der Auftragsakte und beim Kunden */
export function AngeboteTab({ id, kunde }: { id: ID; kunde?: boolean }) {
  useDatenstand();
  const geld = useDarf('geld');
  const navigate = useNavigate();
  const toast = useToast();
  if (!geld) return <Leer titel="Preise siehst du mit deiner Rolle nicht." icon="schloss" />;
  const alle = db.angebote.all();
  const liste = alle.filter((a) => (kunde ? a.kundeId === id : a.auftragId === id)).sort((a, b) => b.erstelltAm.localeCompare(a.erstelltAm));
  const erstellen = () => {
    const a = neuesAngebot(id);
    toast('Angebotsentwurf angelegt.');
    navigate(`/auftraege/angebote/${a.id}`);
  };
  return (
    <Stapel abstand={12}>
      <Liste leer={<Leer skizze="dokument" titel="Noch kein Angebot" text={kunde ? 'Angebote entstehen am Auftrag.' : 'Schreib das Angebot direkt aus diesem Auftrag.'} aktion={kunde ? undefined : <Button icon="plus" onClick={erstellen}>Angebot erstellen</Button>} icon="dokument" />}>
        {liste.map((a) => (
          <AngebotZeile key={a.id} a={a} ohneKunde={!kunde} />
        ))}
      </Liste>
      {!kunde && liste.length > 0 && (
        <div>
          <Button variante="sekundaer" icon="plus" onClick={erstellen}>
            Weiteres Angebot
          </Button>
        </div>
      )}
    </Stapel>
  );
}
