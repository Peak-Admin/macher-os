import { useState } from 'react';
import { db, useDatenstand } from '@core/db';
import { datum, zahl } from '@core/format';
import { Filter, Leer, Liste, ListenZeile, Meta, Seite, Stapel, Status, TypIcon } from '@ui/index';
import { Person } from '@ui/person';
import { ART_ICON, ART_LABEL, ART_TON, lagerbewegungen, lagerortName, summenWirkung, type Lagerbewegung } from './daten';

type F = 'alle' | Lagerbewegung['art'];

export function Bewegungen() {
  useDatenstand();
  const [f, setF] = useState<F>('alle');
  const alle = lagerbewegungen.all().sort((a, b) => b.erstelltAm.localeCompare(a.erstelltAm));
  const liste = alle.filter((b) => f === 'alle' || b.art === f).slice(0, 200);
  return (
    <Seite titel="Lagerbewegungen" untertitel="Das Protokoll: jeder Zugang, jede Entnahme, Umbuchung und Inventur." zurueck={{ to: '/betrieb/lager', label: 'Lager' }}>
      <Stapel>
        <Filter label="Art" wert={f} onChange={setF} optionen={[{ wert: 'alle' as F, label: 'Alle' }, ...(Object.keys(ART_LABEL) as Lagerbewegung['art'][]).map((a) => ({ wert: a as F, label: ART_LABEL[a], zaehler: alle.filter((b) => b.art === a).length }))]} />
        <Liste leer={<Leer titel="Noch keine Bewegungen" text="Sobald du Material buchst, eine Lieferung eingeht oder Material am Auftrag verbraucht wird, steht es hier." icon="lager" />}>
          {liste.map((b) => {
            const a = db.artikel.get(b.artikelId);
            const wirkung = summenWirkung(b);
            const weg = b.art === 'umbuchung' ? `${lagerortName(b.von)} → ${lagerortName(b.nach)}` : lagerortName(b.nach ?? b.von);
            const auftrag = db.auftraege.get(b.auftragId);
            return (
              <ListenZeile
                key={b.id}
                to={a ? `/betrieb/katalog/material/${a.id}` : undefined}
                links={<TypIcon name={ART_ICON[b.art]} label={ART_LABEL[b.art]} ton={ART_TON[b.art]} />}
                titel={`${ART_LABEL[b.art]}: ${a?.name ?? 'Unbekannter Artikel'}`}
                untertitel={
                  <>
                    {[datum(b.datum), weg].join(' · ')}
                    {b.mitarbeiterId && (
                      <>
                        {' · '}
                        <Person m={b.mitarbeiterId} groesse={20} />
                      </>
                    )}
                    {[auftrag?.nummer, b.notiz].filter(Boolean).map((x) => ` · ${x}`)}
                  </>
                }
                rechts={
                  b.art === 'umbuchung' ? (
                    <Status>
                      {zahl(b.menge)} {a?.einheit}
                    </Status>
                  ) : (
                    <Status ton={wirkung > 0 ? 'erfolg' : 'neutral'} icon={false}>
                      {wirkung > 0 ? '+' : '−'}
                      {zahl(Math.abs(wirkung))} {a?.einheit}
                    </Status>
                  )
                }
              />
            );
          })}
        </Liste>
        {alle.filter((b) => f === 'alle' || b.art === f).length > 200 && <Meta>Es werden die letzten 200 Bewegungen gezeigt.</Meta>}
      </Stapel>
    </Seite>
  );
}
