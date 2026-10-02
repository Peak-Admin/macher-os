import { Link } from 'react-router-dom';
import { db } from '@core/db';
import { datumKurz, heute, uhrzeit } from '@core/format';
import type { ID } from '@core/objects';
import { Button, Karte, Meta, Stapel, Zeile, useBestaetigen, useToast } from '@ui/index';
import { regelText } from './regel';
import { serieAktiv, serien, serienTermine, terminAuslassen, terminDatum } from './daten';

/** Panel an der Anlage: Serien für diese Anlage + nächster Termin */
export function AnlageSerienPanel({ id }: { id: ID }) {
  const liste = serien.use((s) => (s.anlageIds ?? []).includes(id) && serieAktiv(s), [id]);
  return (
    <Karte titel="Wiederkehrende Termine" kompakt>
      <Stapel abstand={8}>
        {liste.length ? (
          liste.map((s) => {
            const n = serienTermine(s.id).find((t) => terminDatum(t.start) >= heute());
            return (
              <div key={s.id}>
                <Link to={`/plan/wiederkehrend/${s.id}`}>{s.titel}</Link>
                <Meta>
                  {regelText(s.start, s.regel)}
                  {n ? ` · nächster ${datumKurz(n.start)}, ${uhrzeit(n.start)} Uhr` : ''}
                </Meta>
              </div>
            );
          })
        ) : (
          <Meta>Keine Serie. Leg eine an, damit die Wartungstermine automatisch im Kalender stehen.</Meta>
        )}
        <div>
          <Button klein variante="sekundaer" icon="wiederholen" to={`/plan/wiederkehrend/neu?anlageId=${id}`}>
            Serie anlegen
          </Button>
        </div>
      </Stapel>
    </Karte>
  );
}

/** Panel am Termin: gehört zu einer Serie → auslassen oder Serie öffnen */
export function TerminSeriePanel({ id }: { id: ID }) {
  const t = db.termine.useOne(id);
  const s = serien.useOne(t?.serieId);
  const toast = useToast();
  const [fragen, bestaetigung] = useBestaetigen();
  if (!t || !s) return null;
  return (
    <Karte titel="Teil einer Serie" kompakt>
      <Stapel abstand={8}>
        <Meta>
          {s.titel}: {regelText(s.start, s.regel)}, {s.uhrzeit} Uhr
        </Meta>
        <Zeile abstand={8}>
          <Button klein variante="sekundaer" to={`/plan/wiederkehrend/${s.id}`}>Serie öffnen</Button>
          {['geplant', 'bestaetigt'].includes(t.status) && (
            <Button
              klein
              variante="tertiaer"
              onClick={async () => {
                if (!(await fragen('Termin auslassen?', 'Nur dieser Termin fällt aus, die Serie läuft weiter.', 'Termin auslassen'))) return;
                terminAuslassen(t.id);
                toast('Termin ausgelassen.');
              }}
            >
              Diesen Termin auslassen
            </Button>
          )}
        </Zeile>
      </Stapel>
      {bestaetigung}
    </Karte>
  );
}
