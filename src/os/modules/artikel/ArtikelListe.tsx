import { useState } from 'react';
import { db } from '@core/db';
import { euro, passt, zahl } from '@core/format';
import { useDarf } from '@core/session';
import type { Artikel } from '@core/objects';
import { BeispielMarke, Button, Filter, Leer, Liste, ListenZeile, Meta, Seite, Stapel, Status, Suchfeld, Zeile } from '@ui/index';
import { unterMindestbestand } from '../lager/daten';
import { kategorien } from './daten';
import { PreisTabelle } from './PreisTabelle';
import './artikel.css';

const MAX = 150;

export function ArtikelListe() {
  const [q, setQ] = useState('');
  const [kat, setKat] = useState('alle');
  const geld = useDarf('geld');
  const schreiben = useDarf('schreiben');
  const alle = db.artikel.use();
  db.lieferanten.use();
  const kats = kategorien();
  const treffer = alle
    .filter((a) => (kat === 'alle' ? true : kat === 'inaktiv' ? !a.aktiv : a.aktiv && a.kategorie === kat))
    .filter((a) => kat === 'inaktiv' || a.aktiv)
    .filter((a) => !q || passt(q, a.name, a.nummer, a.ean, a.herstellerNummer, a.kategorie))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));
  const inaktiv = alle.filter((a) => !a.aktiv).length;
  const leer =
    q || kat !== 'alle' ? (
      <Leer
        titel="Keine Treffer"
        text="Prüfe die Schreibweise oder wähle eine andere Kategorie."
        icon="suche"
        aktion={
          <Button variante="sekundaer" onClick={() => (setQ(''), setKat('alle'))}>
            Suche zurücksetzen
          </Button>
        }
      />
    ) : (
      <Leer
        titel="Noch keine Artikel"
        text="Lege dein Standardmaterial an oder importiere die Artikelliste deines Großhändlers als CSV."
        icon="paket"
        aktion={
          <Zeile>
            <Button to="/betrieb/katalog/material/neu">Artikel anlegen</Button>
            <Button variante="sekundaer" to="/betrieb/katalog/material/import">
              CSV importieren
            </Button>
          </Zeile>
        }
      />
    );

  return (
    <Seite
      titel="Material"
      untertitel="Dein Katalog: alles, was du als Material auf Angebote und Rechnungen ziehst."
      aktion={
        <Button icon="plus" to="/betrieb/katalog/material/neu">
          Artikel anlegen
        </Button>
      }
    >
      <Stapel>
        <Zeile zwischen>
          <div style={{ flex: '1 1 260px' }}>
            <Suchfeld wert={q} onChange={setQ} platzhalter="Name, Artikelnummer oder EAN …" />
          </div>
          <Button variante="sekundaer" icon="upload" to="/betrieb/katalog/material/import">
            CSV importieren
          </Button>
        </Zeile>
        {kats.length > 1 && (
          <Filter
            label="Kategorie"
            wert={kat}
            onChange={setKat}
            optionen={[
              { wert: 'alle', label: 'Alle' },
              ...kats.map((k) => ({
                wert: k,
                label: k,
                zaehler: alle.filter((a) => a.aktiv && a.kategorie === k).length,
              })),
              ...(inaktiv ? [{ wert: 'inaktiv', label: 'Inaktiv', zaehler: inaktiv }] : []),
            ]}
          />
        )}
        {!treffer.length ? (
          leer
        ) : geld ? (
          <>
            {/* Desktop: Preisspalten zum direkten Ändern · mobil: einfache Liste mit Name und VK */}
            <div className="art-nur-desktop">
              <PreisTabelle artikel={treffer.slice(0, MAX)} bearbeitbar={schreiben} />
            </div>
            <div className="art-nur-mobil">
              <MaterialListe artikel={treffer.slice(0, MAX)} vk />
            </div>
          </>
        ) : (
          <MaterialListe artikel={treffer.slice(0, MAX)} vk={false} />
        )}
        {treffer.length > MAX && <Meta>{treffer.length - MAX} weitere Artikel – verfeinere die Suche.</Meta>}
      </Stapel>
    </Seite>
  );
}

/** Einfache Liste – mobil und für Rollen ohne „Preise & Geld“ (dann ganz ohne Preise) */
function MaterialListe({ artikel, vk }: { artikel: Artikel[]; vk: boolean }) {
  return (
    <Liste>
      {artikel.map((a) => (
        <ListenZeile
          key={a.id}
          to={`/betrieb/katalog/material/${a.id}`}
          titel={
            <>
              {a.name} <BeispielMarke zeigen={a.beispiel} />
            </>
          }
          untertitel={[a.nummer, a.kategorie, db.lieferanten.get(a.lieferantId)?.name, a.bestand != null ? `Bestand ${zahl(a.bestand)} ${a.einheit}` : null].filter(Boolean).join(' · ')}
          rechts={
            <Zeile abstand={8}>
              {unterMindestbestand(a) && <Status ton="achtung">Nachbestellen</Status>}
              {vk && (
                <span className="mm-number">
                  {euro(a.vk)} / {a.einheit}
                </span>
              )}
            </Zeile>
          }
        />
      ))}
    </Liste>
  );
}
