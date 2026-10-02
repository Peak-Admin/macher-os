import { useState } from 'react';
import { db } from '@core/db';
import { passt } from '@core/format';
import { BeispielMarke, Button, Leer, Liste, ListenZeile, Seite, Stapel, Status, Suchfeld } from '@ui/index';
import { bestellungen, istUnterwegs } from '../bestellungen/daten';
import { lieferzeitText, lx } from './daten';

export function LieferantenListe() {
  const [q, setQ] = useState('');
  const liste = db.lieferanten.use((l) => !q || passt(q, l.name, l.kundennummer, l.email, l.telefon, l.adresse?.ort, ...(lx(l).ansprechpartner ?? []).map((a) => a.name)), [q]);
  const unterwegs = bestellungen.use(istUnterwegs);
  return (
    <Seite titel="Lieferanten" aktion={<Button icon="plus" to="/betrieb/lieferanten/neu">Lieferant anlegen</Button>}>
      <Stapel>
        <Suchfeld wert={q} onChange={setQ} platzhalter="Name, Kundennummer, Ort …" />
        <Liste
          leer={
            q ? (
              <Leer titel="Keine Treffer" text="Zu dieser Suche gibt es keinen Lieferanten." icon="suche" />
            ) : (
              <Leer titel="Noch keine Lieferanten" text="Leg deinen Großhändler an – mit Kundennummer, E-Mail für Bestellungen und Lieferzeit." icon="person" aktion={<Button to="/betrieb/lieferanten/neu">Lieferant anlegen</Button>} />
            )
          }
        >
          {[...liste]
            .sort((a, b) => a.name.localeCompare(b.name, 'de'))
            .map((l) => {
              const n = unterwegs.filter((b) => b.lieferantId === l.id).length;
              return (
                <ListenZeile
                  key={l.id}
                  to={`/betrieb/lieferanten/${l.id}`}
                  titel={
                    <>
                      {l.name} <BeispielMarke zeigen={l.beispiel} />
                    </>
                  }
                  untertitel={[l.kundennummer && `Kd.-Nr. ${l.kundennummer}`, lieferzeitText(l), l.telefon].filter(Boolean).join(' · ')}
                  rechts={n ? <Status ton="aktiv">{n} unterwegs</Status> : null}
                />
              );
            })}
        </Liste>
      </Stapel>
    </Seite>
  );
}
