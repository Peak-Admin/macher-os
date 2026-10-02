import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db } from '@core/db';
import { euro, passt, zahl } from '@core/format';
import { useDarf } from '@core/session';
import { Abschnitt, BeispielMarke, Button, Filter, Leer, Liste, ListenZeile, Seite, Stapel, Status, Suchfeld, Zeile } from '@ui/index';
import { kategorienVon, unterStundensatz } from './daten';

export function LeistungenListe() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const filter = params.get('filter') ?? 'aktiv';
  const geld = useDarf('geld');
  const alle = db.leistungen.use();
  const betrieb = db.betrieb.useOne('betrieb');
  const artikel = db.artikel.use();
  const artikelGet = (id: string) => artikel.find((a) => a.id === id);
  const unter = new Set(unterStundensatz(alle, betrieb?.stundensatz ?? 0, artikelGet).map((l) => l.id));

  const sichtbar = alle.filter((l) => {
    if (filter === 'aktiv' && !l.aktiv) return false;
    if (filter === 'inaktiv' && l.aktiv) return false;
    if (filter === 'unter' && !unter.has(l.id)) return false;
    return !q || passt(q, l.name, l.beschreibung, l.kategorie);
  });
  const kategorien = kategorienVon(sichtbar);

  const setFilter = (f: string) => setParams(f === 'aktiv' ? {} : { filter: f }, { replace: true });

  return (
    <Seite
      titel="Leistungen & Preise"
      untertitel="Dein Katalog für Angebote, Rechnungen und Planung."
      aktion={<Button icon="plus" to="/betrieb/leistungen/neu">Leistung anlegen</Button>}
    >
      <Stapel>
        {geld && (
          <Zeile>
            <Button variante="sekundaer" icon="euro" to="/betrieb/leistungen/preise">
              Preise anpassen
            </Button>
            <Button variante="sekundaer" icon="uhr" to="/betrieb/leistungen/stundensatz">
              Stundensatz berechnen
            </Button>
          </Zeile>
        )}
        <Suchfeld wert={q} onChange={setQ} platzhalter="Leistung oder Kategorie suchen …" />
        <Filter
          label="Leistungen filtern"
          wert={filter}
          onChange={setFilter}
          optionen={[
            { wert: 'aktiv', label: 'Aktiv', zaehler: alle.filter((l) => l.aktiv).length },
            ...(geld && unter.size ? [{ wert: 'unter', label: 'Unter Stundensatz', zaehler: unter.size }] : []),
            { wert: 'inaktiv', label: 'Inaktiv', zaehler: alle.filter((l) => !l.aktiv).length },
          ]}
        />
        {!alle.length ? (
          <Leer
            titel="Noch keine Leistungen"
            text="Lege an, was du anbietest – mit Preis und Zeit. Angebote und Rechnungen greifen dann darauf zurück."
            aktion={<Button to="/betrieb/leistungen/neu">Leistung anlegen</Button>}
            icon="liste"
          />
        ) : !sichtbar.length ? (
          <Leer titel="Keine Treffer" text="Zu dieser Suche oder diesem Filter gibt es keine Leistungen." icon="suche" />
        ) : (
          kategorien.map((k) => (
            <Abschnitt key={k} titel={k}>
              <Liste>
                {sichtbar
                  .filter((l) => (l.kategorie || 'Ohne Kategorie') === k)
                  .sort((a, b) => a.name.localeCompare(b.name, 'de'))
                  .map((l) => (
                    <ListenZeile
                      key={l.id}
                      to={`/betrieb/leistungen/${l.id}`}
                      titel={
                        <>
                          {l.name} <BeispielMarke zeigen={l.beispiel} />
                        </>
                      }
                      untertitel={[`je ${l.einheit}`, l.minuten ? `${zahl(l.minuten)} Min.` : null].filter(Boolean).join(' · ')}
                      rechts={
                        <Zeile abstand={8}>
                          {!l.aktiv && <Status>Inaktiv</Status>}
                          {geld && unter.has(l.id) && <Status ton="achtung">Unter Stundensatz</Status>}
                          {geld && <strong className="mm-number">{euro(l.preis)}</strong>}
                        </Zeile>
                      }
                    />
                  ))}
              </Liste>
            </Abschnitt>
          ))
        )}
      </Stapel>
    </Seite>
  );
}
