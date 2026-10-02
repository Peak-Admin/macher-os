import { useEffect, useState } from 'react';
import { db } from '@core/db';
import { passt, personName } from '@core/format';
import { Button, Filter, Leer, Seite, Stapel, Suchfeld } from '@ui/index';
import { AMPEL_RANG, lageVon, type Ampel } from './daten';
import { FahrzeugKarte, modellText } from './FahrzeugKarte';

type AmpelFilter = 'alle' | Ampel;

/** Uhr für „frei ab …“ – einmal pro Minute neu rechnen */
function useJetzt() {
  const [jetzt, setJetzt] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setJetzt(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  return jetzt;
}

export function FahrzeugListe() {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<AmpelFilter>('alle');
  const jetzt = useJetzt();
  const alle = db.betriebsmittel.use((b) => b.art === 'fahrzeug' && b.status !== 'ausgemustert');
  db.mitarbeiter.use();
  db.termine.use();
  db.abwesenheiten.use();
  db.dokumente.use();

  const mitLage = alle.map((f) => ({ f, lage: lageVon(f, jetzt) }));
  const treffer = q ? mitLage.filter(({ f }) => passt(q, f.kennzeichen, modellText(f), f.mitarbeiterId ? personName(db.mitarbeiter.get(f.mitarbeiterId)) : undefined)) : mitLage;
  const liste = treffer
    .filter(({ lage }) => filter === 'alle' || lage.ampel === filter)
    .sort((a, b) => AMPEL_RANG[a.lage.ampel] - AMPEL_RANG[b.lage.ampel] || (a.f.kennzeichen ?? a.f.name).localeCompare(b.f.kennzeichen ?? b.f.name, 'de'));
  const z = (a: AmpelFilter) => treffer.filter(({ lage }) => a === 'alle' || lage.ampel === a).length;
  const neu = '/betrieb/werkzeuge/neu?art=fahrzeug';

  return (
    <Seite titel="Fahrzeuge" aktion={<Button icon="plus" to={neu}>Fahrzeug anlegen</Button>}>
      <Stapel>
        <Suchfeld wert={q} onChange={setQ} platzhalter="Kennzeichen, Modell, Fahrer …" />
        <Filter
          label="Ampel"
          wert={filter}
          onChange={setFilter}
          optionen={[
            { wert: 'alle', label: 'Alle', zaehler: z('alle') },
            { wert: 'frei', label: 'Verfügbar', zaehler: z('frei') },
            { wert: 'belegt', label: 'Im Einsatz', zaehler: z('belegt') },
            { wert: 'gesperrt', label: 'Nicht fahren', zaehler: z('gesperrt') },
          ]}
        />
        {liste.length ? (
          <div className="fz-raster">
            {liste.map(({ f }) => (
              <FahrzeugKarte key={f.id} f={f} jetzt={jetzt} to={`/betrieb/werkzeuge/${f.id}`} />
            ))}
          </div>
        ) : q || filter !== 'alle' ? (
          <Leer titel="Nichts gefunden" text="Prüfe die Schreibweise oder setze den Filter zurück." icon="suche" aktion={<Button variante="sekundaer" onClick={() => (setQ(''), setFilter('alle'))}>Suche zurücksetzen</Button>} />
        ) : (
          <Leer titel="Noch keine Fahrzeuge" text="Leg deine Fahrzeuge an – mit Kennzeichen, Fahrer und TÜV-Termin." icon="auto" aktion={<Button to={neu}>Fahrzeug anlegen</Button>} />
        )}
      </Stapel>
    </Seite>
  );
}
