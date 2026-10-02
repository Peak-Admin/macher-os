import { useState } from 'react';
import { db } from '@core/db';
import { passt } from '@core/format';
import { BeispielMarke, Button, Leer, Liste, ListenZeile, Seite, Suchfeld, Status } from '@ui/index';

export function KundenListe() {
  const [q, setQ] = useState('');
  const kunden = db.kunden.use((k) => !q || passt(q, k.name, k.firma, k.telefon, k.email, k.adresse?.ort), [q]);
  const offen = db.auftraege.use((a) => !['erledigt', 'verloren'].includes(a.phase));
  return (
    <Seite titel="Kunden" aktion={<Button icon="plus" to="/auftraege/kunden/neu">Kunde anlegen</Button>}>
      <Suchfeld wert={q} onChange={setQ} platzhalter="Name, Ort, Telefon …" />
      <Liste
        leer={
          q ? (
            <Leer titel="Keine Treffer" text="Zu dieser Suche gibt es keine Kunden. Passe die Eingabe an." icon="suche" />
          ) : (
            <Leer titel="Noch keine Kunden" text="Lege deinen ersten Kunden an. Er wird auch automatisch angelegt, wenn eine Anfrage reinkommt." aktion={<Button to="/auftraege/kunden/neu">Kunde anlegen</Button>} icon="person" />
          )
        }
      >
        {[...kunden]
          .sort((a, b) => a.name.localeCompare(b.name, 'de'))
          .map((k) => {
            const n = offen.filter((a) => a.kundeId === k.id).length;
            return (
              <ListenZeile
                key={k.id}
                to={`/auftraege/kunden/${k.id}`}
                titel={
                  <>
                    {k.name} <BeispielMarke zeigen={k.beispiel} />
                  </>
                }
                untertitel={[k.adresse ? `${k.adresse.plz} ${k.adresse.ort}` : null, k.telefon].filter(Boolean).join(' · ')}
                rechts={n ? <Status ton="aktiv">{n === 1 ? '1 offener Auftrag' : `${n} offene Aufträge`}</Status> : null}
              />
            );
          })}
      </Liste>
    </Seite>
  );
}
