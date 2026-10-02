import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '@core/db';
import { datum } from '@core/format';
import type { ID } from '@core/objects';
import { BeispielMarke, Button, Karte, Leer, Liste, ListenZeile, Meldung, Seite, Stapel, Status } from '@ui/index';
import { AuftragAuswahl } from '@ui/objekt';
import { abnahmeStarten, abnahmen, type Abnahme } from './daten';
import { AbnahmeStatus } from './AbnahmeDetail';

function AbnahmeZeile({ a, mitAuftrag = true }: { a: Abnahme; mitAuftrag?: boolean }) {
  const auftrag = db.auftraege.get(a.auftragId);
  const kunde = db.kunden.get(auftrag?.kundeId);
  return (
    <ListenZeile
      to={`/auftraege/abnahme/${a.id}`}
      titel={
        <>
          {mitAuftrag ? auftrag?.titel ?? 'Auftrag' : `Abnahme vom ${datum(a.datum)}`} <BeispielMarke zeigen={a.beispiel} />
        </>
      }
      untertitel={mitAuftrag ? [auftrag?.nummer, kunde?.name, datum(a.datum)].filter(Boolean).join(' · ') : a.unterschriftKunde ? `Unterschrieben von ${a.unterschriftKunde.name}` : undefined}
      rechts={<AbnahmeStatus a={a} />}
    />
  );
}

export function AbnahmeListe() {
  const navigate = useNavigate();
  const liste = abnahmen.use();
  const wartend = db.auftraege.use((x) => x.phase === 'abnahme' && !liste.some((a) => a.auftragId === x.id && a.status !== 'verweigert'), [liste]);
  const offen = liste.filter((a) => a.status === 'offen');
  const fertig = liste.filter((a) => a.status !== 'offen').sort((a, b) => b.datum.localeCompare(a.datum));
  return (
    <Seite titel="Abnahme & Unterschrift" untertitel="Fertig melden, Mängel festhalten, Kunde unterschreibt – direkt vor Ort." aktion={<Button icon="unterschrift" to="/auftraege/abnahme/neu">Abnahme starten</Button>}>
      <Stapel abstand={24}>
        {wartend.length > 0 && (
          <Karte titel="Warten auf Abnahme">
            <Liste>
              {wartend.map((x) => (
                <ListenZeile
                  key={x.id}
                  titel={x.titel}
                  untertitel={`${x.nummer} · ${db.kunden.get(x.kundeId)?.name ?? ''}`}
                  rechts={
                    <Button klein onClick={() => navigate(`/auftraege/abnahme/${abnahmeStarten(x.id).id}`)}>
                      Abnahme starten
                    </Button>
                  }
                />
              ))}
            </Liste>
          </Karte>
        )}
        {offen.length > 0 && (
          <Karte titel="Läuft gerade">
            <Liste>
              {offen.map((a) => (
                <AbnahmeZeile key={a.id} a={a} />
              ))}
            </Liste>
          </Karte>
        )}
        <Karte titel="Abgeschlossen">
          <Liste leer={<Leer skizze titel="Noch keine Abnahmen" text="Starte eine Abnahme, wenn die Arbeit fertig ist. Der Kunde unterschreibt direkt auf deinem Handy." icon="unterschrift" />}>
            {fertig.map((a) => (
              <AbnahmeZeile key={a.id} a={a} />
            ))}
          </Liste>
        </Karte>
      </Stapel>
    </Seite>
  );
}

export function AbnahmeNeu() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [auftrag, setAuftrag] = useState<ID | undefined>(params.get('auftrag') ?? undefined);
  const [fehler, setFehler] = useState<string>();
  return (
    <Seite titel="Abnahme starten" zurueck={{ to: '/auftraege/abnahme', label: 'Abnahmen' }}>
      <Karte>
        <form
          className="mm-stapel"
          style={{ gap: 16 }}
          onSubmit={(e) => {
            e.preventDefault();
            if (!auftrag) return setFehler('Wähle den Auftrag, der abgenommen wird.');
            navigate(`/auftraege/abnahme/${abnahmeStarten(auftrag).id}`, { replace: true });
          }}
        >
          <AuftragAuswahl label="Auftrag" wert={auftrag} onChange={(id) => (setAuftrag(id || undefined), setFehler(undefined))} />
          {fehler && <Meldung ton="achtung">{fehler}</Meldung>}
          <div>
            <Button type="submit" icon="unterschrift">
              Abnahme starten
            </Button>
          </div>
        </form>
      </Karte>
    </Seite>
  );
}

/** Tab „Abnahme“ in der Auftragsakte */
export function AbnahmeTab({ id }: { id: ID }) {
  const navigate = useNavigate();
  const liste = abnahmen.use((a) => a.auftragId === id, [id]);
  const auftrag = db.auftraege.useOne(id);
  const offen = liste.find((a) => a.status === 'offen');
  const unterschrieben = liste.some((a) => a.status === 'unterschrieben');
  return (
    <Stapel abstand={16}>
      {!unterschrieben && (
        <div>
          <Button icon="unterschrift" onClick={() => navigate(`/auftraege/abnahme/${abnahmeStarten(id).id}`)}>
            {offen ? 'Abnahme fortsetzen' : 'Abnahme starten'}
          </Button>
        </div>
      )}
      <Liste leer={<Leer skizze titel="Noch keine Abnahme" text={auftrag?.phase === 'abnahme' ? 'Die Arbeit ist fertig – hol dir jetzt die Unterschrift vom Kunden.' : 'Wenn die Arbeit fertig ist, startest du hier die Abnahme.'} icon="unterschrift" />}>
        {[...liste]
          .sort((a, b) => b.datum.localeCompare(a.datum))
          .map((a) => (
            <AbnahmeZeile key={a.id} a={a} mitAuftrag={false} />
          ))}
      </Liste>
      {unterschrieben && <Status ton="erfolg">Abnahme liegt vor</Status>}
    </Stapel>
  );
}
