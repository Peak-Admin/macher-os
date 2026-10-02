import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { pfadZu } from '@core/modul';
import { passt, relativ } from '@core/format';
import type { Auftrag, ID } from '@core/objects';
import { Abschnitt, BeispielMarke, Button, Filter, Karte, Leer, Liste, ListenZeile, Seite, Stapel, Status, Suchfeld } from '@ui/index';
import { KANAL_TEXT, alterText, hatNaechstenSchritt, istUnbearbeitet, offeneAnfragen } from './daten';
import { QualiDialog } from './Qualifizieren';

type Sicht = 'offen' | 'erledigt';

function AnfrageStatus({ a }: { a: Auftrag }) {
  const naechster = hatNaechstenSchritt(a.id);
  if (istUnbearbeitet(a, naechster)) return <Status ton="achtung">Unbearbeitet</Status>;
  if (a.dringend) return <Status ton="achtung">Dringend</Status>;
  if (naechster) return <Status ton="aktiv">Rückruf geplant</Status>;
  return <Status>Neu</Status>;
}

export function AnfrageZeile({ a, onWahl }: { a: Auftrag; onWahl: (id: ID) => void }) {
  const k = db.kunden.get(a.kundeId);
  return (
    <ListenZeile
      onClick={() => onWahl(a.id)}
      titel={
        <>
          {a.titel} <BeispielMarke zeigen={a.beispiel} />
        </>
      }
      untertitel={[k?.name, a.quelle ? KANAL_TEXT[a.quelle] : null, alterText(a)].filter(Boolean).join(' · ')}
      rechts={<AnfrageStatus a={a} />}
    />
  );
}

export function AnfragenListe() {
  useDatenstand();
  const [sicht, setSicht] = useState<Sicht>('offen');
  const [q, setQ] = useState('');
  const [params, setParams] = useSearchParams();
  const wahl = params.get('anfrage') ?? undefined;
  const setWahl = (id: ID | undefined) => setParams(id ? { anfrage: id } : {}, { replace: true });
  const filter = (a: Auftrag) => !q || passt(q, a.titel, a.beschreibung, a.nummer, db.kunden.get(a.kundeId)?.name);
  const offen = offeneAnfragen().filter(filter);
  const grenze = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const weiter = db.auftraege
    .where((a) => a.phase !== 'anfrage' && !!a.quelle && a.erstelltAm >= grenze)
    .filter(filter)
    .sort((a, b) => b.geaendertAm.localeCompare(a.geaendertAm));

  return (
    <Seite titel="Anfragen" untertitel="Jede Anfrage bekommt einen nächsten Schritt – heute noch." aktion={<Button icon="plus" to="/auftraege/anfragen/neu">Anfrage erfassen</Button>}>
      <Stapel>
        <Filter
          label="Ansicht"
          wert={sicht}
          onChange={setSicht}
          optionen={[
            { wert: 'offen', label: 'Offen', zaehler: offeneAnfragen().length },
            { wert: 'erledigt', label: 'Weitergegeben (30 Tage)' },
          ]}
        />
        <Suchfeld wert={q} onChange={setQ} platzhalter="Kunde, Anliegen, Nummer …" />
        {sicht === 'offen' ? (
          <Liste
            leer={
              q ? (
                <Leer titel="Keine Treffer" text="Zu dieser Suche gibt es keine offene Anfrage." icon="suche" />
              ) : (
                <Leer titel="Keine offenen Anfragen" text="Alles beantwortet. Neue Anfragen erfasst du hier oder über „Anruf notieren“." aktion={<Button to="/auftraege/anfragen/neu">Anfrage erfassen</Button>} icon="check" />
              )
            }
          >
            {offen.map((a) => (
              <AnfrageZeile key={a.id} a={a} onWahl={setWahl} />
            ))}
          </Liste>
        ) : (
          <Liste leer={<Leer titel="Noch nichts weitergegeben" text="Sobald du Anfragen qualifizierst, siehst du sie hier." icon="auftraege" />}>
            {weiter.map((a) => (
              <ListenZeile
                key={a.id}
                to={pfadZu({ typ: 'auftraege', id: a.id })}
                titel={a.titel}
                untertitel={[db.kunden.get(a.kundeId)?.name, `geändert ${relativ(a.geaendertAm)}`].filter(Boolean).join(' · ')}
                rechts={a.phase === 'verloren' ? <Status>{`Abgesagt${a.verlorenGrund ? ': ' + a.verlorenGrund : ''}`}</Status> : <Status ton="erfolg">{phaseText(a.phase)}</Status>}
              />
            ))}
          </Liste>
        )}
      </Stapel>
      <QualiDialog auftragId={wahl} onSchliessen={() => setWahl(undefined)} />
    </Seite>
  );
}

export function phaseText(p: Auftrag['phase']) {
  return (
    {
      anfrage: 'Anfrage',
      besichtigung: 'Besichtigung',
      angebot: 'Angebot',
      beauftragt: 'Beauftragt',
      in_arbeit: 'In Arbeit',
      abnahme: 'Abnahme',
      abrechnung: 'Abrechnung',
      erledigt: 'Erledigt',
      verloren: 'Nicht zustande gekommen',
    } as const
  )[p];
}

/** Hub-Widget „Neue Anfragen“ auf der Aufträge-Seite */
export function NeueAnfragenWidget() {
  useDatenstand();
  const [wahl, setWahl] = useState<ID>();
  const offen = offeneAnfragen();
  const zeigen = offen.slice(0, 5);
  return (
    <Abschnitt
      titel={`Neue Anfragen${offen.length ? ` (${offen.length})` : ''}`}
      aktion={
        <Button klein variante="sekundaer" icon="plus" to="/auftraege/anfragen/neu">
          Anfrage erfassen
        </Button>
      }
    >
      {offen.length ? (
        <Stapel abstand={8}>
          <Liste>
            {zeigen.map((a) => (
              <AnfrageZeile key={a.id} a={a} onWahl={setWahl} />
            ))}
          </Liste>
          {offen.length > zeigen.length && (
            <div>
              <Button variante="tertiaer" to="/auftraege/anfragen" icon="pfeilRechts">
                Alle {offen.length} Anfragen
              </Button>
            </div>
          )}
        </Stapel>
      ) : (
        <Karte kompakt>
          <p className="mm-meta">Keine offenen Anfragen. Neue Anrufe notierst du über „Schnell erfassen“.</p>
        </Karte>
      )}
      <QualiDialog auftragId={wahl} onSchliessen={() => setWahl(undefined)} />
    </Abschnitt>
  );
}
