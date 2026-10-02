import { useState } from 'react';
import { db, useDatenstand } from '@core/db';
import { datum, heute, passt, plusTage, relativ } from '@core/format';
import { BeispielMarke, Button, Filter, Leer, Liste, ListenZeile, Seite, Status, Suchfeld } from '@ui/index';
import { BEWERTUNG_TEXT, offen, reklamationen, STATUS_TEXT, type Reklamation } from './daten';

type F = 'offen' | 'frist' | 'erledigt';

/** Status einer Reklamation – Text + Ton */
export function ReklamationStatus({ r }: { r: Reklamation }) {
  if (offen(r) && r.fristBis && r.fristBis < heute()) return <Status ton="achtung">Frist überschritten</Status>;
  if (r.status === 'erledigt') return <Status ton="erfolg">Erledigt</Status>;
  if (r.status === 'abgelehnt') return <Status>Abgelehnt</Status>;
  return <Status ton={r.status === 'in_arbeit' ? 'aktiv' : 'neutral'}>{STATUS_TEXT[r.status]}</Status>;
}

export function ReklamationListe() {
  useDatenstand();
  const [q, setQ] = useState('');
  const alle = reklamationen.use();
  const t = heute();
  const offene = alle.filter(offen);
  const fristNah = offene.filter((r) => !!r.fristBis && r.fristBis <= plusTage(t, 3));
  const [filter, setFilter] = useState<F>(fristNah.length ? 'frist' : 'offen');
  const basis = filter === 'offen' ? offene : filter === 'frist' ? fristNah : alle.filter((r) => !offen(r));
  const liste = basis
    .filter((r) => !q || passt(q, r.nummer, r.titel, r.beschreibung, db.kunden.get(r.kundeId)?.name))
    .sort((a, b) => (a.fristBis ?? '9999').localeCompare(b.fristBis ?? '9999'));

  return (
    <Seite
      titel="Reklamationen"
      untertitel="Mängel aufnehmen, Gewährleistung prüfen lassen, Nacharbeit fristgerecht erledigen."
      aktion={<Button icon="plus" to="/auftraege/reklamationen/neu">Mangel aufnehmen</Button>}
    >
      {alle.length > 0 && (
        <>
          <Suchfeld wert={q} onChange={setQ} platzhalter="Kunde, Mangel, Nummer …" />
          <Filter
            label="Reklamationen filtern"
            wert={filter}
            onChange={setFilter}
            optionen={[
              { wert: 'frist', label: 'Frist in 3 Tagen', zaehler: fristNah.length },
              { wert: 'offen', label: 'Offen', zaehler: offene.length },
              { wert: 'erledigt', label: 'Abgeschlossen', zaehler: alle.length - offene.length },
            ]}
          />
        </>
      )}
      <Liste
        leer={
          alle.length ? (
            <Leer titel={filter === 'frist' ? 'Keine Frist läuft gerade ab' : 'Nichts in dieser Ansicht'} text={q ? 'Passe die Suche an.' : undefined} icon="check" />
          ) : (
            <Leer
              titel="Keine Reklamationen"
              text="Meldet ein Kunde einen Mangel, nimm ihn hier auf. Macher prüft die Gewährleistung und legt die Nacharbeit an."
              aktion={<Button to="/auftraege/reklamationen/neu">Mangel aufnehmen</Button>}
              icon="schild"
            />
          )
        }
      >
        {liste.map((r) => (
          <ListenZeile
            key={r.id}
            to={`/auftraege/reklamationen/${r.id}`}
            titel={
              <>
                {r.titel} <BeispielMarke zeigen={r.beispiel} />
              </>
            }
            untertitel={[
              db.kunden.get(r.kundeId)?.name ?? 'Kunde fehlt',
              BEWERTUNG_TEXT[r.bewertung],
              offen(r) && r.fristBis ? `Frist ${relativ(r.fristBis)}` : r.erledigtAm ? `erledigt ${datum(r.erledigtAm)}` : undefined,
              r.nummer,
            ]
              .filter(Boolean)
              .join(' · ')}
            rechts={<ReklamationStatus r={r} />}
          />
        ))}
      </Liste>
    </Seite>
  );
}

