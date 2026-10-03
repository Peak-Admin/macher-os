import { useState } from 'react';
import { db, useDatenstand } from '@core/db';
import { datumKurz, heute, uhrzeit } from '@core/format';
import { BeispielMarke, Button, Filter, Leer, Liste, ListenZeile, Meldung, Seite, Status, TypIcon } from '@ui/index';
import { TERMINART_ICON, TERMINART_TON } from '@core/zeichen';
import { TERMINART_LABEL } from '@modules/kalender/daten';
import { regelText } from './regel';
import { abwesenheitsKonflikte, mitarbeiterNamen, serieAktiv, serien, serienTermine, terminDatum } from './daten';

type F = 'aktiv' | 'beendet';

export function SerienListe() {
  useDatenstand();
  const [filter, setFilter] = useState<F>('aktiv');
  const alle = serien.use();
  const aktiv = alle.filter((s) => serieAktiv(s));
  const liste = (filter === 'aktiv' ? aktiv : alle.filter((s) => !serieAktiv(s))).sort((a, b) => a.titel.localeCompare(b.titel, 'de'));
  const konflikte = abwesenheitsKonflikte(heute(), 30);

  return (
    <Seite
      titel="Wiederkehrende Termine"
      untertitel="Einmal festlegen – Macher trägt die Termine für die nächsten Monate automatisch ein."
      aktion={<Button icon="plus" to="/plan/wiederkehrend/neu">Serie anlegen</Button>}
    >
      {konflikte.length > 0 && (
        <Meldung ton="achtung" titel={konflikte.length === 1 ? '1 Serientermin mit Abwesenheit' : `${konflikte.length} Serientermine mit Abwesenheit`}>
          Eingeteilte Leute sind an diesen Tagen nicht da. Öffne die Serie und verschiebe den Termin oder teile jemand anderen ein.
        </Meldung>
      )}
      {alle.length > 0 && (
        <Filter
          label="Serien filtern"
          wert={filter}
          onChange={setFilter}
          optionen={[
            { wert: 'aktiv', label: 'Laufend', zaehler: aktiv.length },
            { wert: 'beendet', label: 'Beendet', zaehler: alle.length - aktiv.length },
          ]}
        />
      )}
      <Liste
        leer={
          alle.length ? (
            <Leer titel={filter === 'aktiv' ? 'Keine laufenden Serien' : 'Keine beendeten Serien'} icon="wiederholen" />
          ) : (
            <Leer skizze
              titel="Noch keine wiederkehrenden Termine"
              text="Lege eine Serie an – z. B. die jährliche Heizungswartung oder die monatliche Sichtprüfung. Die Termine landen automatisch im Kalender."
              aktion={<Button to="/plan/wiederkehrend/neu">Serie anlegen</Button>}
              icon="wiederholen"
            />
          )
        }
      >
        {liste.map((s) => {
          const naechster = serienTermine(s.id).find((t) => terminDatum(t.start) >= heute() && t.status !== 'abgesagt');
          const kunde = db.kunden.get(s.kundeId);
          const konflikt = konflikte.some((k) => k.serieId === s.id);
          return (
            <ListenZeile
              key={s.id}
              to={`/plan/wiederkehrend/${s.id}`}
              links={<TypIcon name={TERMINART_ICON[s.terminArt]} label={TERMINART_LABEL[s.terminArt]} ton={TERMINART_TON[s.terminArt]} />}
              titel={
                <>
                  {s.titel} <BeispielMarke zeigen={s.beispiel} />
                </>
              }
              untertitel={[`${regelText(s.start, s.regel)}, ${s.uhrzeit} Uhr`, kunde?.name, mitarbeiterNamen(s.mitarbeiterIds)].filter(Boolean).join(' · ')}
              rechts={
                konflikt ? (
                  <Status ton="achtung">Abwesenheit</Status>
                ) : !serieAktiv(s) ? (
                  <Status>Beendet</Status>
                ) : naechster ? (
                  <Status ton="aktiv">{`Nächster: ${datumKurz(naechster.start)}, ${uhrzeit(naechster.start)}`}</Status>
                ) : (
                  <Status>Kein Termin geplant</Status>
                )
              }
            />
          );
        })}
      </Liste>
    </Seite>
  );
}
