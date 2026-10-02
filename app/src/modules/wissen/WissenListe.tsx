import { useState } from 'react';
import { passt } from '@core/format';
import { useDarf } from '@core/session';
import { Button, Filter, Leer, Liste, ListenZeile, Seite, Stapel, Suchfeld } from '@ui/index';
import { wissen } from './daten';

export function WissenListe() {
  const schreiben = useDarf('schreiben');
  const [q, setQ] = useState('');
  const [kat, setKat] = useState('alle');
  const alle = wissen.use();
  const kategorien = [...new Set(alle.map((a) => a.kategorie))].sort((a, b) => a.localeCompare(b, 'de'));
  const sichtbar = alle
    .filter((a) => (kat === 'alle' || a.kategorie === kat) && (!q || passt(q, a.titel, a.kategorie, a.text, ...(a.anlagentypen ?? []))))
    .sort((a, b) => a.titel.localeCompare(b.titel, 'de'));

  return (
    <Seite
      titel="Wissen & Anleitungen"
      untertitel="Was im Kopf des Meisters steckt – für alle griffbereit, auch auf der Baustelle."
      aktion={schreiben ? <Button icon="plus" to="/betrieb/wissen/neu">Anleitung schreiben</Button> : undefined}
    >
      <Stapel>
        <Suchfeld wert={q} onChange={setQ} platzhalter="Anleitung, Anlage oder Stichwort suchen …" />
        {kategorien.length > 1 && (
          <Filter
            label="Kategorie"
            wert={kat}
            onChange={setKat}
            optionen={[{ wert: 'alle', label: 'Alle', zaehler: alle.length }, ...kategorien.map((k) => ({ wert: k, label: k, zaehler: alle.filter((a) => a.kategorie === k).length }))]}
          />
        )}
        <Liste
          leer={
            alle.length ? (
              <Leer titel="Keine Treffer" text="Probier ein anderes Stichwort oder eine andere Kategorie." icon="suche" />
            ) : (
              <Leer
                titel="Noch kein Wissen hinterlegt"
                text="Schreib den ersten Ablauf auf, den neue Leute immer wieder fragen."
                icon="wissen"
                aktion={schreiben ? <Button to="/betrieb/wissen/neu">Anleitung schreiben</Button> : undefined}
              />
            )
          }
        >
          {sichtbar.map((a) => (
            <ListenZeile
              key={a.id}
              to={`/betrieb/wissen/${a.id}`}
              titel={a.titel}
              untertitel={[a.kategorie, a.anlagentypen?.length ? a.anlagentypen.slice(0, 3).join(', ') : null].filter(Boolean).join(' · ')}
            />
          ))}
        </Liste>
      </Stapel>
    </Seite>
  );
}
