import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@core/db';
import { passt } from '@core/format';
import { Button, Filter, Leer, Seite, Stapel, Suchfeld } from '@ui/index';
import { AnlageDialog, AnlagenKompakt } from './AnlageBausteine';
import { gewaehrleistungStatus, wartungsStatus } from './daten';

type Ansicht = 'alle' | 'wartung' | 'gewaehrleistung';

export function AnlagenListe() {
  const [q, setQ] = useState('');
  const [ansicht, setAnsicht] = useState<Ansicht>('alle');
  const [anlegen, setAnlegen] = useState(false);
  const navigate = useNavigate();
  const anlagen = db.anlagen.use();
  const kunden = db.kunden.use();
  const orte = db.orte.use();

  const wartungFaellig = (a: (typeof anlagen)[number]) => ['ueberfaellig', 'bald'].includes(wartungsStatus(a));
  const gwEndet = (a: (typeof anlagen)[number]) => gewaehrleistungStatus(a) === 'endet_bald';

  const liste = anlagen
    .filter((a) => {
      const o = orte.find((x) => x.id === a.ortId);
      return !q || passt(q, a.typ, a.hersteller, a.modell, a.seriennummer, kunden.find((k) => k.id === a.kundeId)?.name, o?.adresse.strasse, o?.adresse.ort);
    })
    .filter((a) => (ansicht === 'wartung' ? wartungFaellig(a) : ansicht === 'gewaehrleistung' ? gwEndet(a) : true))
    .sort((a, b) => (a.naechsteWartung ?? '9999').localeCompare(b.naechsteWartung ?? '9999'));

  return (
    <Seite titel="Anlagen" untertitel="Was ihr eingebaut habt oder betreut – mit Wartung, Gewährleistung und Historie." aktion={<Button icon="plus" onClick={() => setAnlegen(true)}>Anlage anlegen</Button>}>
      <Stapel abstand={16}>
        <Suchfeld wert={q} onChange={setQ} platzhalter="Art, Hersteller, Seriennummer, Kunde …" />
        <Filter
          label="Anlagen filtern"
          wert={ansicht}
          onChange={setAnsicht}
          optionen={[
            { wert: 'alle', label: 'Alle', zaehler: anlagen.length },
            { wert: 'wartung', label: 'Wartung fällig', zaehler: anlagen.filter(wartungFaellig).length },
            { wert: 'gewaehrleistung', label: 'Gewährleistung endet', zaehler: anlagen.filter(gwEndet).length },
          ]}
        />
        {!liste.length && (q || ansicht !== 'alle') ? (
          <Leer titel="Keine Treffer" text="Zu dieser Suche oder diesem Filter gibt es keine Anlagen." icon="suche" aktion={<Button variante="sekundaer" onClick={() => (setQ(''), setAnsicht('alle'))}>Filter zurücksetzen</Button>} />
        ) : (
          <AnlagenKompakt anlagen={liste} leerText="Erfasse Heizungen, Wallboxen, Maschinen und Co. Dann weißt du beim nächsten Anruf sofort Typ, Baujahr und wann zuletzt gewartet wurde." />
        )}
      </Stapel>
      {anlegen && <AnlageDialog onSchliessen={() => setAnlegen(false)} onGespeichert={(a) => navigate(`/auftraege/anlagen/${a.id}`)} />}
    </Seite>
  );
}
