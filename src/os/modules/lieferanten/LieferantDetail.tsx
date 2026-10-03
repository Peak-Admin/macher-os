import { useNavigate, useParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { adresseText, euro, mapsLink, telLink } from '@core/format';
import { useDarf } from '@core/session';
import { BeispielMarke, Button, Karte, Leer, Liste, ListenZeile, Meta, Seite, Stapel, Status, ZweiSpalten, useToast } from '@ui/index';
import { ObjektPanels, ObjektTabs, Zeitstrahl } from '@ui/objekt';
import { bestellungen, inEntwurfUebernehmen, kurzText, STATUS, ueberfaellig } from '../bestellungen/daten';
import { artikelVon, lieferzeitText, lx } from './daten';

export function LieferantDetail() {
  const { id = '' } = useParams();
  useDatenstand();
  const l = db.lieferanten.useOne(id);
  const geld = useDarf('geld');
  const navigate = useNavigate();
  const toast = useToast();
  if (!l || l.geloeschtAm)
    return (
      <Seite titel="Nicht gefunden" zurueck={{ to: '/betrieb/lieferanten', label: 'Lieferanten' }}>
        <Leer titel="Diesen Lieferanten gibt es nicht (mehr)." icon="person" aktion={<Button to="/betrieb/lieferanten">Zur Liste</Button>} />
      </Seite>
    );
  const artikel = artikelVon(l.id).sort((a, b) => a.name.localeCompare(b.name, 'de'));
  const best = bestellungen.where((b) => b.lieferantId === l.id).sort((a, b) => b.erstelltAm.localeCompare(a.erstelltAm));
  const ansprechpartner = lx(l).ansprechpartner ?? [];

  return (
    <Seite
      titel={l.name}
      oberzeile={l.kundennummer ? `Kd.-Nr. ${l.kundennummer}` : undefined}
      status={<BeispielMarke zeigen={l.beispiel} />}
      zurueck={{ to: '/betrieb/lieferanten', label: 'Lieferanten' }}
      aktion={
        <Button
          icon="paket"
          onClick={() => {
            const b = inEntwurfUebernehmen(l.id, []);
            toast('Bestellentwurf ist offen.');
            navigate(`/betrieb/bestellungen/${b.id}`);
          }}
        >
          Bestellung anlegen
        </Button>
      }
    >
      <ZweiSpalten
        haupt={
          <ObjektTabs
            objekt="lieferanten"
            id={l.id}
            eigene={[
              {
                id: 'bestellungen',
                titel: 'Bestellungen',
                zaehler: best.length,
                inhalt: (
                  <Liste leer={<Leer titel="Noch keine Bestellungen" text="Bestellungen bei diesem Lieferanten erscheinen hier." icon="paket" />}>
                    {best.map((b) => (
                      <ListenZeile key={b.id} to={`/betrieb/bestellungen/${b.id}`} titel={b.nummer} untertitel={kurzText(b, geld)} rechts={ueberfaellig(b) ? <Status ton="gefahr">Überfällig</Status> : <Status ton={STATUS[b.status].ton}>{STATUS[b.status].text}</Status>} />
                    ))}
                  </Liste>
                ),
              },
              {
                id: 'artikel',
                titel: 'Artikel',
                zaehler: artikel.length,
                inhalt: (
                  <Liste leer={<Leer titel="Keine Artikel zugeordnet" text="Ordne Artikeln diesen Lieferanten zu – beim Anlegen oder per CSV-Import." icon="paket" aktion={<Button variante="sekundaer" to="/betrieb/katalog/material/import">CSV importieren</Button>} />}>
                    {artikel.slice(0, 100).map((a) => (
                      <ListenZeile key={a.id} to={`/betrieb/katalog/material/${a.id}`} titel={a.name} untertitel={a.nummer} rechts={geld ? <span className="mm-number">EK {euro(a.ek)}</span> : undefined} />
                    ))}
                  </Liste>
                ),
              },
              { id: 'verlauf', titel: 'Verlauf', inhalt: <Zeitstrahl bezug={{ typ: 'lieferanten', id: l.id }} /> },
            ]}
          />
        }
        seite={
          <>
            <Karte titel="Kontakt" icon="telefon" kompakt>
              <Stapel abstand={8}>
                {l.telefon && <a href={telLink(l.telefon)}>{l.telefon}</a>}
                {l.email && <a href={`mailto:${l.email}`}>{l.email}</a>}
                {l.website && (
                  <a href={/^https?:/.test(l.website) ? l.website : `https://${l.website}`} target="_blank" rel="noreferrer">
                    {l.website}
                  </a>
                )}
                {l.adresse && (
                  <a href={mapsLink(l.adresse)} target="_blank" rel="noreferrer">
                    {adresseText(l.adresse)}
                  </a>
                )}
                {!l.telefon && !l.email && !l.adresse && <Meta>Noch keine Kontaktdaten. Ohne E-Mail kann Macher keine Bestellung vorbereiten.</Meta>}
              </Stapel>
            </Karte>
            <Karte titel="Konditionen" icon="euro" kompakt aktion={<Button klein variante="tertiaer" icon="stift" to={`/betrieb/lieferanten/${l.id}/bearbeiten`}>Bearbeiten</Button>}>
              <Stapel abstand={8}>
                <Meta>{lieferzeitText(l)}</Meta>
                <Meta>{l.konditionen ?? 'Keine Konditionen hinterlegt.'}</Meta>
                {l.notiz && <Meta>{l.notiz}</Meta>}
              </Stapel>
            </Karte>
            {ansprechpartner.length > 0 && (
              <Karte titel="Ansprechpartner" icon="person" kompakt>
                <Liste>
                  {ansprechpartner.map((a) => (
                    <ListenZeile key={a.id} titel={a.name} untertitel={[a.funktion, a.telefon, a.email].filter(Boolean).join(' · ')} rechts={a.telefon ? <a href={telLink(a.telefon)}>Anrufen</a> : undefined} />
                  ))}
                </Liste>
              </Karte>
            )}
            <ObjektPanels objekt="lieferanten" id={l.id} />
          </>
        }
      />
    </Seite>
  );
}
