import { useSearchParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { useIch } from '@core/session';
import { datumKurz, passt, uhrzeit } from '@core/format';
import type { Auftrag } from '@core/objects';
import { BeispielMarke, Button, Filter, Leer, Liste, ListenZeile, Meta, Seite, Segmente, Stapel, Status, Suchfeld } from '@ui/index';
import { Pipeline, meineAuftraege } from './Pipeline';
import { istOffen, kommendeEinsaetze, phaseLabel, phaseTon } from './logik';
import { auftragPfad, schrittFuer } from './daten';
import { useAbBreite } from './hooks';
import './auftraege.css';

type Sicht = 'aktiv' | 'meine' | 'abgeschlossen';
const SEITE = 30;

/**
 * Übersicht: eine einfache, durchsuchbare Liste mit drei Schnellfiltern und genau einer Hauptaktion.
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

/** Eine Zeile: Titel/Kunde, nächster Termin oder nächster Schritt, ein wichtiger Status */
function AuftragZeile({ a }: { a: Auftrag }) {
  const kunde = db.kunden.get(a.kundeId)?.name;
  const termin = istOffen(a) ? kommendeEinsaetze(db.termine.where((t) => t.auftragId === a.id))[0] : undefined;
  const naechstes = termin ? `Nächster Termin ${datumKurz(termin.start)}, ${uhrzeit(termin.start)} Uhr` : istOffen(a) ? schrittFuer(a)?.label : undefined;
  return (
    <ListenZeile
      to={auftragPfad(a.id)}
      titel={
        <>
          {a.titel} <BeispielMarke zeigen={a.beispiel} />
        </>
      }
      untertitel={[kunde, naechstes ?? a.nummer].filter(Boolean).join(' · ')}
      rechts={a.dringend && istOffen(a) ? <Status ton="achtung">Dringend</Status> : <Status ton={phaseTon(a.phase)}>{phaseLabel(a.phase)}</Status>}
    />
  );
}

export function PipelineWidget() {
  return <Pipeline imHub />;
}
