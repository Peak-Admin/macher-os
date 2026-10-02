import { useState } from 'react';
import { db } from '@core/db';
import { euro, passt, zahl } from '@core/format';
import { useDarf } from '@core/session';
import { BeispielMarke, Button, Filter, Leer, Liste, ListenZeile, Meta, Seite, Stapel, Status, Suchfeld, Zeile } from '@ui/index';
import { unterMindestbestand } from '../lager/daten';
import { kategorien } from './daten';

const MAX = 150;

export function ArtikelListe() {
  const [q, setQ] = useState('');
  const [kat, setKat] = useState('alle');
  const geld = useDarf('geld');
  const alle = db.artikel.use();
  db.lieferanten.use();
  const kats = kategorien();
  const treffer = alle
    .filter((a) => (kat === 'alle' ? true : kat === 'inaktiv' ? !a.aktiv : a.aktiv && a.kategorie === kat))
    .filter((a) => kat === 'inaktiv' || a.aktiv)
    .filter((a) => !q || passt(q, a.name, a.nummer, a.ean, a.herstellerNummer, a.kategorie))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));
  const inaktiv = alle.filter((a) => !a.aktiv).length;

  return (
    <Seite titel="Artikel & Material" aktion={<Button icon="plus" to="/betrieb/artikel/neu">Artikel anlegen</Button>}>
      <Stapel>
        <Zeile zwischen>
          <div style={{ flex: '1 1 260px' }}>
            <Suchfeld wert={q} onChange={setQ} platzhalter="Name, Artikelnummer oder EAN …" />
          </div>
          <Button variante="sekundaer" icon="upload" to="/betrieb/artikel/import">
            CSV importieren
          </Button>
        </Zeile>
        {kats.length > 1 && (
          <Filter
            label="Kategorie"
            wert={kat}
            onChange={setKat}
            optionen={[{ wert: 'alle', label: 'Alle' }, ...kats.map((k) => ({ wert: k, label: k, zaehler: alle.filter((a) => a.aktiv && a.kategorie === k).length })), ...(inaktiv ? [{ wert: 'inaktiv', label: 'Inaktiv', zaehler: inaktiv }] : [])]}
          />
        )}
        <Liste
          leer={
            q || kat !== 'alle' ? (
              <Leer titel="Keine Treffer" text="Prüfe die Schreibweise oder wähle eine andere Kategorie." icon="suche" aktion={<Button variante="sekundaer" onClick={() => (setQ(''), setKat('alle'))}>Suche zurücksetzen</Button>} />
            ) : (
              <Leer titel="Noch keine Artikel" text="Lege dein Standardmaterial an oder importiere die Artikelliste deines Großhändlers als CSV." icon="paket" aktion={<Zeile><Button to="/betrieb/artikel/neu">Artikel anlegen</Button><Button variante="sekundaer" to="/betrieb/artikel/import">CSV importieren</Button></Zeile>} />
            )
          }
        >
          {treffer.slice(0, MAX).map((a) => (
            <ListenZeile
              key={a.id}
              to={`/betrieb/artikel/${a.id}`}
              titel={
                <>
                  {a.name} <BeispielMarke zeigen={a.beispiel} />
                </>
              }
              untertitel={[a.nummer, a.kategorie, db.lieferanten.get(a.lieferantId)?.name, a.bestand != null ? `Bestand ${zahl(a.bestand)} ${a.einheit}` : null].filter(Boolean).join(' · ')}
              rechts={
                <Zeile abstand={8}>
                  {unterMindestbestand(a) && <Status ton="achtung">Nachbestellen</Status>}
                  {geld && (
                    <span className="mm-number">
                      {euro(a.vk)} / {a.einheit}
                    </span>
                  )}
                </Zeile>
              }
            />
          ))}
        </Liste>
        {treffer.length > MAX && <Meta>{treffer.length - MAX} weitere Artikel – verfeinere die Suche.</Meta>}
      </Stapel>
    </Seite>
  );
}
