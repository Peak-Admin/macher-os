import { db, useDatenstand } from '@core/db';
import { datumKurz, uhrzeit } from '@core/format';
import type { Auftrag, Termin } from '@core/objects';
import { Abschnitt, BeispielMarke, Button, Leer, Liste, ListenZeile, Seite, Stapel, Status } from '@ui/index';
import { Personen } from '@ui/person';
import { besichtigungenVon, istBesichtigung } from './daten';

function TerminZeile({ t }: { t: Termin }) {
  const k = db.kunden.get(t.kundeId);
  const o = db.orte.get(t.ortId);
  const jetzt = new Date().toISOString();
  const fotos = db.dokumente.where((d) => d.bezug?.typ === 'termine' && d.bezug.id === t.id).length;
  return (
    <ListenZeile
      to={`/auftraege/besichtigungen/${t.id}`}
      titel={
        <>
          {t.titel.replace(/^Besichtigung: /, '')} <BeispielMarke zeigen={t.beispiel} />
        </>
      }
      untertitel={
        <>
          {[`${datumKurz(t.start)}, ${uhrzeit(t.start)} Uhr`, k?.name, o?.adresse.ort].filter(Boolean).join(' · ')}
          {t.mitarbeiterIds.length > 0 && (
            <>
              {' · '}
              <Personen ids={t.mitarbeiterIds} namen />
            </>
          )}
          {fotos ? ` · ${fotos} Doku` : null}
        </>
      }
      rechts={t.status === 'erledigt' ? <Status ton="erfolg">Erledigt</Status> : t.ende < jetzt ? <Status ton="achtung">Ergebnis fehlt</Status> : t.start.slice(0, 10) === jetzt.slice(0, 10) ? <Status ton="aktiv">Heute</Status> : <Status>Geplant</Status>}
    />
  );
}

export function auftraegeOhneBesichtigung(): Auftrag[] {
  return db.auftraege.where((a) => a.phase === 'besichtigung' && besichtigungenVon(a.id).length === 0);
}

export function BesichtigungenListe() {
  useDatenstand();
  const jetzt = new Date().toISOString();
  const alle = db.termine.where((t) => istBesichtigung(t) && t.status !== 'abgesagt');
  const offen = alle.filter((t) => t.status !== 'erledigt');
  const ergebnisFehlt = offen.filter((t) => t.ende < jetzt).sort((a, b) => a.start.localeCompare(b.start));
  const kommend = offen.filter((t) => t.ende >= jetzt).sort((a, b) => a.start.localeCompare(b.start));
  const grenze = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const erledigt = alle.filter((t) => t.status === 'erledigt' && t.start >= grenze).sort((a, b) => b.start.localeCompare(a.start));
  const ohne = auftraegeOhneBesichtigung();

  return (
    <Seite titel="Besichtigungen" untertitel="Vor Ort ansehen, festhalten, Angebot vorbereiten." aktion={<Button icon="plus" to="/auftraege/besichtigungen/neu">Besichtigung planen</Button>}>
      <Stapel abstand={24}>
        {ohne.length > 0 && (
          <Abschnitt titel={`Noch kein Termin (${ohne.length})`}>
            <Liste>
              {ohne.map((a) => (
                <ListenZeile key={a.id} to={`/auftraege/besichtigungen/neu?auftrag=${a.id}`} titel={a.titel} untertitel={[db.kunden.get(a.kundeId)?.name, a.wunschtermin ? `Wunsch: ${a.wunschtermin}` : null].filter(Boolean).join(' · ')} rechts={<Status ton="achtung">Termin fehlt</Status>} />
              ))}
            </Liste>
          </Abschnitt>
        )}
        {ergebnisFehlt.length > 0 && (
          <Abschnitt titel="Ergebnis eintragen">
            <Liste>
              {ergebnisFehlt.map((t) => (
                <TerminZeile key={t.id} t={t} />
              ))}
            </Liste>
          </Abschnitt>
        )}
        <Abschnitt titel="Anstehend">
          <Liste leer={<Leer titel="Keine Besichtigung geplant" text="Plane eine Besichtigung direkt aus einer Anfrage – oder hier." aktion={<Button to="/auftraege/besichtigungen/neu">Besichtigung planen</Button>} icon="ort" />}>
            {kommend.map((t) => (
              <TerminZeile key={t.id} t={t} />
            ))}
          </Liste>
        </Abschnitt>
        {erledigt.length > 0 && (
          <Abschnitt titel="Erledigt (30 Tage)">
            <Liste>
              {erledigt.map((t) => (
                <TerminZeile key={t.id} t={t} />
              ))}
            </Liste>
          </Abschnitt>
        )}
      </Stapel>
    </Seite>
  );
}
