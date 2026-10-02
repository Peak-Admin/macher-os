import { useState } from 'react';
import { db, useDatenstand } from '@core/db';
import { datum, relativ } from '@core/format';
import { BeispielMarke, Button, Filter, Leer, Liste, ListenZeile, Meldung, Seite, Stapel, Status, Zeile } from '@ui/index';
import { berechneBedarf } from '../bedarf/daten';
import { bestellungen, istOffen, istUnterwegs, kurzText, STATUS, ueberfaellig, type Bestellung } from './daten';

type F = 'offen' | 'unterwegs' | 'geliefert' | 'alle';

export function BestellungenListe() {
  useDatenstand();
  const [f, setF] = useState<F>('offen');
  const alle = bestellungen.all().sort((a, b) => b.erstelltAm.localeCompare(a.erstelltAm));
  const passt = (b: Bestellung, x: F) => (x === 'offen' ? istOffen(b) : x === 'unterwegs' ? istUnterwegs(b) : x === 'geliefert' ? b.status === 'geliefert' : true);
  const liste = alle.filter((b) => passt(b, f));
  const zuSpaet = alle.filter((b) => ueberfaellig(b));
  const fehlt = berechneBedarf().length;

  return (
    <Seite titel="Bestellungen" aktion={<Button icon="plus" to="/betrieb/bestellungen/neu">Bestellung anlegen</Button>}>
      <Stapel>
        {zuSpaet.length > 0 && (
          <Meldung ton="achtung" titel={`${zuSpaet.length} ${zuSpaet.length === 1 ? 'Lieferung ist' : 'Lieferungen sind'} überfällig`}>
            Frag beim Lieferanten nach – oder buche den Wareneingang, falls die Ware schon da ist.
          </Meldung>
        )}
        {fehlt > 0 && (
          <Meldung ton="neutral" titel={`Im Bedarf fehlen ${fehlt} Artikel`} aktion={<Button klein variante="sekundaer" to="/betrieb/bedarf">Bedarf ansehen</Button>}>
            Macher kann daraus die Bestellungen vorschlagen.
          </Meldung>
        )}
        <Filter
          label="Status"
          wert={f}
          onChange={setF}
          optionen={(
            [
              ['offen', 'Offen'],
              ['unterwegs', 'Unterwegs'],
              ['geliefert', 'Geliefert'],
              ['alle', 'Alle'],
            ] as [F, string][]
          ).map(([w, l]) => ({ wert: w, label: l, zaehler: alle.filter((b) => passt(b, w)).length }))}
        />
        <Liste
          leer={
            alle.length ? (
              <Leer titel="Hier ist gerade nichts" text="In diesem Filter gibt es keine Bestellungen." icon="paket" aktion={<Button variante="sekundaer" onClick={() => setF('alle')}>Alle zeigen</Button>} />
            ) : (
              <Leer titel="Noch keine Bestellungen" text="Lass Macher die Bestellung aus dem Bedarf deiner Aufträge vorschlagen – oder leg selbst eine an." icon="paket" aktion={<Zeile><Button to="/betrieb/bedarf">Bedarf ansehen</Button><Button variante="sekundaer" to="/betrieb/bestellungen/neu">Bestellung anlegen</Button></Zeile>} />
            )
          }
        >
          {liste.map((b) => {
            const l = db.lieferanten.get(b.lieferantId);
            const spaet = ueberfaellig(b);
            return (
              <ListenZeile
                key={b.id}
                to={`/betrieb/bestellungen/${b.id}`}
                titel={
                  <>
                    {l?.name ?? 'Lieferant fehlt'} · {b.nummer} <BeispielMarke zeigen={b.beispiel} />
                  </>
                }
                untertitel={[kurzText(b), istUnterwegs(b) && b.erwartetAm ? `erwartet ${relativ(b.erwartetAm)}` : null, b.status === 'geliefert' && b.geliefertAm ? `geliefert am ${datum(b.geliefertAm)}` : null].filter(Boolean).join(' · ')}
                rechts={spaet ? <Status ton="achtung">Lieferung überfällig</Status> : <Status ton={STATUS[b.status].ton}>{STATUS[b.status].text}</Status>}
              />
            );
          })}
        </Liste>
      </Stapel>
    </Seite>
  );
}
