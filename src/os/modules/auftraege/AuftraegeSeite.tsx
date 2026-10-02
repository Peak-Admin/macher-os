import { Link, useSearchParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { useIch } from '@core/session';
import { datumKurz, passt, uhrzeit } from '@core/format';
import type { Auftrag } from '@core/objects';
import { BeispielMarke, Button, Filter, Leer, Liste, Meta, Seite, Segmente, Stapel, Status, Suchfeld } from '@ui/index';
import { Pipeline, meineAuftraege } from './Pipeline';
import { istOffen, kommendeEinsaetze, phaseLabel, phaseTon } from './logik';
import { auftragPfad, schrittFuer } from './daten';
import { useAbBreite } from './hooks';
import './auftraege.css';

type Sicht = 'aktiv' | 'meine' | 'abgeschlossen';
const SEITE = 30;

/**
 * Übersicht: eine einfache, durchsuchbare Liste mit drei Schnellfiltern und genau einer Hauptaktion.
 * Desktop: Suche und Statusfilter in einer Zeile, darunter Zeilen mit erkennbaren Spalten
 * (Auftrag und Kunde · nächster Schritt · Termin · Status). Handy: Auftrag und Kunde, darunter Schritt bzw. Termin.
 * Am Desktop gibt es optional die Board-Ansicht nach Phasen. Suche, Filter und Ansicht stehen in der URL,
 * damit „Zurück“ dorthin führt, wo man war.
 */
export function AuftraegeSeite() {
  useDatenstand();
  const ich = useIch();
  const breit = useAbBreite(1024);
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const sicht = (params.get('sicht') as Sicht) || 'aktiv';
  const board = breit && params.get('ansicht') === 'board';
  const anzahl = Number(params.get('n')) || SEITE;
  const setze = (k: string, v: string | undefined) => {
    const p = new URLSearchParams(params);
    if (v) p.set(k, v);
    else p.delete(k);
    if (k !== 'n') p.delete('n');
    setParams(p, { replace: true });
  };

  const alle = db.auftraege.all();
  const meine = meineAuftraege(ich?.id);
  const filter = (a: Auftrag) => (sicht === 'abgeschlossen' ? !istOffen(a) : istOffen(a) && (sicht === 'aktiv' || meine.has(a.id)));
  const treffer = alle
    .filter(filter)
    .filter((a) => !q || passt(q, a.nummer, a.titel, a.beschreibung, db.kunden.get(a.kundeId)?.name, db.orte.get(a.ortId)?.adresse.ort))
    .sort((x, y) =>
      sicht === 'abgeschlossen'
        ? (y.abgeschlossenAm ?? y.geaendertAm).localeCompare(x.abgeschlossenAm ?? x.geaendertAm)
        : Number(!!y.dringend) - Number(!!x.dringend) || y.geaendertAm.localeCompare(x.geaendertAm),
    );
  const zaehler = (s: Sicht) => alle.filter((a) => (s === 'abgeschlossen' ? !istOffen(a) : istOffen(a) && (s === 'aktiv' || meine.has(a.id)))).length;

  return (
    <Seite titel="Aufträge" breit aktion={<Button icon="plus" to="/auftraege/auftraege/neu">Auftrag anlegen</Button>}>
      {breit && (
        <Segmente
          label="Darstellung"
          wert={board ? 'board' : 'liste'}
          onChange={(v) => setze('ansicht', v === 'board' ? 'board' : undefined)}
          optionen={[
            { wert: 'liste', label: 'Liste' },
            { wert: 'board', label: 'Board nach Phasen' },
          ]}
        />
      )}
      {board ? (
        <Pipeline />
      ) : (
        <Stapel abstand={16}>
          <div className="ak-suche-filter">
            <Suchfeld wert={q} onChange={(v) => setze('q', v || undefined)} platzhalter="Nummer, Kunde, Ort, Titel …" />
            <Filter<Sicht>
              label="Welche Aufträge"
              wert={sicht}
              onChange={(v) => setze('sicht', v === 'aktiv' ? undefined : v)}
              optionen={[
                { wert: 'aktiv', label: 'Aktiv', zaehler: zaehler('aktiv') },
                { wert: 'meine', label: 'Meine', zaehler: zaehler('meine') },
                { wert: 'abgeschlossen', label: 'Abgeschlossen', zaehler: zaehler('abgeschlossen') },
              ]}
            />
          </div>
          {treffer.length > 0 && (
            <div className="ak-spalten" aria-hidden>
              <span>Auftrag und Kunde</span>
              <span>Nächster Schritt</span>
              <span>Termin</span>
              <span>Status</span>
            </div>
          )}
          <Liste
            leer={
              !alle.length ? (
                <Leer titel="Noch keine Aufträge" text="Leg deinen ersten Auftrag an. Anfragen aus dem Eingang werden hier automatisch zu Aufträgen." icon="auftraege" aktion={<Button icon="plus" to="/auftraege/auftraege/neu">Auftrag anlegen</Button>} />
              ) : (
                <Leer titel="Keine Treffer" text="Zu dieser Suche oder diesem Filter gibt es keine Aufträge." icon="suche" aktion={<Button variante="sekundaer" onClick={() => setParams({}, { replace: true })}>Filter zurücksetzen</Button>} />
              )
            }
          >
            {treffer.slice(0, anzahl).map((a) => (
              <AuftragZeile key={a.id} a={a} />
            ))}
          </Liste>
          {treffer.length > anzahl && (
            <div>
              <Button variante="sekundaer" onClick={() => setze('n', String(anzahl + SEITE))}>
                Weitere {Math.min(SEITE, treffer.length - anzahl)} zeigen
              </Button>
            </div>
          )}
          {treffer.length > 0 && (
            <Meta>
              {Math.min(anzahl, treffer.length)} von {treffer.length} {treffer.length === 1 ? 'Auftrag' : 'Aufträgen'}
            </Meta>
          )}
        </Stapel>
      )}
    </Seite>
  );
}

/**
 * Eine Zeile ist ein Link zum Auftrag (keine Buttons darin). Nur vorhandene Daten erscheinen:
 * Titel und Kunde, nächster Schritt, nächster Termin, ein Status. Lange Namen brechen um, nichts wird abgeschnitten.
 */
function AuftragZeile({ a }: { a: Auftrag }) {
  const kunde = db.kunden.get(a.kundeId)?.name;
  const offen = istOffen(a);
  const termin = offen ? kommendeEinsaetze(db.termine.where((t) => t.auftragId === a.id))[0] : undefined;
  const schritt = offen ? schrittFuer(a)?.label : undefined;
  return (
    <li>
      <Link to={auftragPfad(a.id)} className="ak-zeile">
        <span className="ak-zeile-titel">
          <strong>
            {a.titel} <BeispielMarke zeigen={a.beispiel} />
          </strong>
          <span className="mm-meta">{[kunde, a.nummer].filter(Boolean).join(' · ')}</span>
        </span>
        <span className="ak-zeile-schritt">
          {schritt && (
            <>
              <span className="sr-only">Nächster Schritt: </span>
              {schritt}
            </>
          )}
        </span>
        <span className="ak-zeile-termin mm-number">
          {termin && (
            <>
              <span className="sr-only">Nächster Termin: </span>
              {datumKurz(termin.start)}, {uhrzeit(termin.start)} Uhr
            </>
          )}
        </span>
        <span className="ak-zeile-status">
          {a.dringend && offen ? <Status ton="achtung">Dringend</Status> : <Status ton={phaseTon(a.phase)}>{phaseLabel(a.phase)}</Status>}
        </span>
      </Link>
    </li>
  );
}

export function PipelineWidget() {
  return <Pipeline imHub />;
}
