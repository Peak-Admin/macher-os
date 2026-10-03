import { useState } from 'react';
import { db, useDatenstand } from '@core/db';
import { heute, passt, personName } from '@core/format';
import { istBuero, useDarf, useIch } from '@core/session';
import { ABWESENHEIT_EMOJI } from '@core/zeichen';
import { BeispielMarke, Button, Filter, Leer, Liste, ListenZeile, Seite, Stapel, Status, Suchfeld, mitEmoji } from '@ui/index';
import { abwesenheitAm, ART_LABEL } from '@modules/abwesenheiten/daten';
import { Personenbild } from './profilbild';
import { ROLLE_LABEL, istAktiv, sortiert } from './team';

type Ansicht = 'aktiv' | 'ausgetreten';

export function MitarbeiterListe() {
  useDatenstand();
  const ich = useIch();
  const personal = useDarf('personal');
  const [q, setQ] = useState('');
  const [ansicht, setAnsicht] = useState<Ansicht>('aktiv');
  const alle = db.mitarbeiter.all();
  const abw = db.abwesenheiten.all();
  const t = heute();
  const aktive = alle.filter((m) => istAktiv(m, t));
  const ehemalige = alle.filter((m) => !istAktiv(m, t));
  const liste = sortiert(ansicht === 'aktiv' ? aktive : ehemalige).filter((m) => !q || passt(q, m.vorname, m.nachname, m.telefon, m.email, m.team, ROLLE_LABEL[m.rolle]));
  const kannAnlegen = personal || istBuero(ich);

  return (
    <Seite titel="Mitarbeiter" aktion={kannAnlegen ? <Button icon="plus" to="/betrieb/mitarbeiter/neu">Mitarbeiter anlegen</Button> : undefined}>
      <Stapel abstand={12}>
        <Suchfeld wert={q} onChange={setQ} platzhalter="Name, Rolle, Telefon …" />
        {ehemalige.length > 0 && (
          <Filter
            label="Ansicht"
            wert={ansicht}
            onChange={setAnsicht}
            optionen={[
              { wert: 'aktiv', label: 'Im Team', zaehler: aktive.length },
              { wert: 'ausgetreten', label: 'Ausgetreten', zaehler: ehemalige.length },
            ]}
          />
        )}
      </Stapel>
      <Liste
        leer={
          q ? (
            <Leer titel="Keine Treffer" text="Zu dieser Suche gibt es niemanden im Team. Passe die Eingabe an." icon="suche" />
          ) : (
            <Leer
              titel="Noch niemand im Team"
              text="Lege deine Mitarbeiter an. Macher erstellt dazu automatisch einen Einarbeitungsplan."
              icon="team"
              aktion={kannAnlegen ? <Button to="/betrieb/mitarbeiter/neu">Mitarbeiter anlegen</Button> : undefined}
            />
          )
        }
      >
        {liste.map((m) => {
          const a = abwesenheitAm(m.id, t, abw);
          const darfArt = personal || istBuero(ich) || ich?.id === m.id;
          return (
            <ListenZeile
              key={m.id}
              to={`/betrieb/mitarbeiter/${m.id}`}
              links={<Personenbild m={m} groesse={40} />}
              titel={
                <>
                  {personName(m)} <BeispielMarke zeigen={m.beispiel} />
                </>
              }
              untertitel={[ROLLE_LABEL[m.rolle], m.team, m.telefon].filter(Boolean).join(' · ')}
              rechts={
                ansicht === 'ausgetreten' ? (
                  <Status>Ausgetreten</Status>
                ) : a ? (
                  <Status ton="aktiv">{darfArt ? mitEmoji(ABWESENHEIT_EMOJI[a.art], ART_LABEL[a.art]) : 'Abwesend'}</Status>
                ) : m.austritt ? (
                  <Status ton="achtung">Austritt geplant</Status>
                ) : null
              }
            />
          );
        })}
      </Liste>
    </Seite>
  );
}
