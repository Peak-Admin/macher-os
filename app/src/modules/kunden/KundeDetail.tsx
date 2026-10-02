import { useParams } from 'react-router-dom';
import { db } from '@core/db';
import { adresseText, mapsLink, telLink } from '@core/format';
import { BeispielMarke, Button, Karte, Leer, Meta, Seite, Stapel, ZweiSpalten } from '@ui/index';
import { ObjektPanels, ObjektTabs, Zeitstrahl } from '@ui/objekt';

export function KundeDetail() {
  const { id = '' } = useParams();
  const k = db.kunden.useOne(id);
  if (!k || k.geloeschtAm)
    return (
      <Seite titel="Kunde nicht gefunden" zurueck={{ to: '/auftraege/kunden', label: 'Kunden' }}>
        <Leer titel="Diesen Kunden gibt es nicht (mehr)." icon="person" />
      </Seite>
    );
  return (
    <Seite
      titel={k.name}
      oberzeile={k.nummer}
      status={<BeispielMarke zeigen={k.beispiel} />}
      zurueck={{ to: '/auftraege/kunden', label: 'Kunden' }}
      aktion={k.telefon ? <Button icon="telefon" variante="sekundaer" onClick={() => (window.location.href = telLink(k.telefon)!)}>Anrufen</Button> : undefined}
    >
      <ZweiSpalten
        haupt={<ObjektTabs objekt="kunden" id={k.id} eigene={[{ id: 'verlauf', titel: 'Verlauf', inhalt: <Zeitstrahl bezug={{ typ: 'kunden', id: k.id }} /> }]} />}
        seite={
          <>
            <Karte titel="Kontakt" kompakt>
              <Stapel abstand={8}>
                {k.telefon && <a href={telLink(k.telefon)}>{k.telefon}</a>}
                {k.email && <a href={`mailto:${k.email}`}>{k.email}</a>}
                {k.adresse && (
                  <a href={mapsLink(k.adresse)} target="_blank" rel="noreferrer">
                    {adresseText(k.adresse)}
                  </a>
                )}
                {!k.telefon && !k.email && !k.adresse && <Meta>Noch keine Kontaktdaten.</Meta>}
              </Stapel>
            </Karte>
            <ObjektPanels objekt="kunden" id={k.id} />
          </>
        }
      />
    </Seite>
  );
}
