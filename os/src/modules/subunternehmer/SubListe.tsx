import { useState } from 'react';
import { db } from '@core/db';
import { euro, heute, passt } from '@core/format';
import { useDarf } from '@core/session';
import { BeispielMarke, Button, Filter, Leer, Liste, ListenZeile, Seite, Stapel, Status, Suchfeld, Zeile } from '@ui/index';
import { offeneEinsaetze, subStatus, subunternehmer } from './daten';

export function SubListe() {
  const geld = useDarf('geld');
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'aktiv' | 'achtung' | 'inaktiv'>('aktiv');
  const alle = subunternehmer.use();
  db.lieferanten.use();
  const t = heute();
  const name = (lid: string) => db.lieferanten.get(lid)?.name ?? 'Unbekannte Firma';
  const achtung = alle.filter((s) => s.aktiv && subStatus(s, t).ton !== 'erfolg');
  const sichtbar = alle
    .filter((s) => (filter === 'aktiv' ? s.aktiv : filter === 'inaktiv' ? !s.aktiv : achtung.includes(s)))
    .filter((s) => !q || passt(q, name(s.lieferantId), s.gewerk, s.ansprechpartner))
    .sort((a, b) => name(a.lieferantId).localeCompare(name(b.lieferantId), 'de'));

  return (
    <Seite titel="Subunternehmer" untertitel="Fremdfirmen, ihre Nachweise und Einsätze an deinen Aufträgen." aktion={<Button icon="plus" to="/betrieb/subunternehmer/neu">Subunternehmer anlegen</Button>}>
      <Stapel>
        <Suchfeld wert={q} onChange={setQ} platzhalter="Firma, Gewerk oder Ansprechpartner …" />
        <Filter
          label="Subunternehmer filtern"
          wert={filter}
          onChange={setFilter}
          optionen={[
            { wert: 'aktiv', label: 'Aktiv', zaehler: alle.filter((s) => s.aktiv).length },
            { wert: 'achtung', label: 'Nachweise prüfen', zaehler: achtung.length },
            { wert: 'inaktiv', label: 'Inaktiv', zaehler: alle.filter((s) => !s.aktiv).length },
          ]}
        />
        <Liste
          leer={
            alle.length ? (
              <Leer titel={filter === 'achtung' ? 'Alle Nachweise sind in Ordnung' : 'Keine Treffer'} icon={filter === 'achtung' ? 'check' : 'suche'} />
            ) : (
              <Leer titel="Noch keine Subunternehmer" text="Leg Firmen an, mit denen du zusammenarbeitest. Macher behält ihre Freistellungsbescheinigung im Blick." icon="team" aktion={<Button to="/betrieb/subunternehmer/neu">Subunternehmer anlegen</Button>} />
            )
          }
        >
          {sichtbar.map((s) => {
            const st = subStatus(s, t);
            const offen = offeneEinsaetze(s);
            return (
              <ListenZeile
                key={s.id}
                to={`/betrieb/subunternehmer/${s.id}`}
                titel={
                  <>
                    {name(s.lieferantId)} <BeispielMarke zeigen={s.beispiel} />
                  </>
                }
                untertitel={[s.gewerk, s.ansprechpartner, geld && s.stundensatz ? `${euro(s.stundensatz)} / h` : null].filter(Boolean).join(' · ')}
                rechts={
                  <Zeile abstand={8}>
                    {offen.length > 0 && <Status ton="aktiv">{offen.length === 1 ? '1 Einsatz offen' : `${offen.length} Einsätze offen`}</Status>}
                    <Status ton={st.ton}>{st.text}</Status>
                  </Zeile>
                }
              />
            );
          })}
        </Liste>
      </Stapel>
    </Seite>
  );
}
