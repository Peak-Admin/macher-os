import { useMemo, useState } from 'react';
import { db, useDatenstand } from '@core/db';
import { passt } from '@core/format';
import { BeispielMarke, Button, Filter, Leer, Liste, ListenZeile, Meldung, Seite, Stapel, Status, Suchfeld } from '@ui/index';
import { aktuelleDubletten } from './daten';

type Ansicht = 'alle' | 'offen' | 'firmen';

export function KundenListe() {
  const [q, setQ] = useState('');
  const [ansicht, setAnsicht] = useState<Ansicht>('alle');
  const v = useDatenstand();
  const alle = db.kunden.use();
  const offen = db.auftraege.use((a) => !['erledigt', 'verloren'].includes(a.phase));
  const dubletten = useMemo(() => aktuelleDubletten(), [v]); // eslint-disable-line react-hooks/exhaustive-deps

  const offeneJeKunde = useMemo(() => {
    const m = new Map<string, number>();
    offen.forEach((a) => m.set(a.kundeId, (m.get(a.kundeId) ?? 0) + 1));
    return m;
  }, [offen]);

  const kunden = alle
    .filter((k) => !q || passt(q, k.name, k.firma, k.telefon, k.email, k.nummer, k.adresse?.ort, k.adresse?.strasse, ...k.ansprechpartner.map((a) => a.name)))
    .filter((k) => (ansicht === 'offen' ? offeneJeKunde.has(k.id) : ansicht === 'firmen' ? k.art !== 'privat' : true))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));

  return (
    <Seite titel="Kunden" aktion={<Button icon="plus" to="/auftraege/kunden/neu">Kunde anlegen</Button>}>
      <Stapel abstand={16}>
        {dubletten.length > 0 && (
          <Meldung
            ton="achtung"
            titel={dubletten.length === 1 ? 'Ein Kunde ist vermutlich doppelt angelegt' : `${dubletten.length} Kunden sind vermutlich doppelt angelegt`}
            aktion={
              <Button klein variante="sekundaer" to="/auftraege/kunden/dubletten">
                Prüfen
              </Button>
            }
          >
            Führe sie zusammen, damit Aufträge und Rechnungen an einer Stelle liegen.
          </Meldung>
        )}
        <Suchfeld wert={q} onChange={setQ} platzhalter="Name, Ort, Telefon, Ansprechpartner …" />
        <Filter
          label="Kunden filtern"
          wert={ansicht}
          onChange={setAnsicht}
          optionen={[
            { wert: 'alle', label: 'Alle', zaehler: alle.length },
            { wert: 'offen', label: 'Mit offenem Auftrag', zaehler: offeneJeKunde.size },
            { wert: 'firmen', label: 'Firmen & Verwaltungen', zaehler: alle.filter((k) => k.art !== 'privat').length },
          ]}
        />
        <Liste
          leer={
            q || ansicht !== 'alle' ? (
              <Leer
                titel="Keine Treffer"
                text="Zu dieser Suche oder diesem Filter gibt es keine Kunden."
                icon="suche"
                aktion={
                  <Button
                    variante="sekundaer"
                    onClick={() => {
                      setQ('');
                      setAnsicht('alle');
                    }}
                  >
                    Filter zurücksetzen
                  </Button>
                }
              />
            ) : (
              <Leer titel="Noch keine Kunden" text="Lege deinen ersten Kunden an. Er wird auch automatisch angelegt, wenn eine Anfrage reinkommt." aktion={<Button to="/auftraege/kunden/neu">Kunde anlegen</Button>} icon="person" />
            )
          }
        >
          {kunden.map((k) => {
            const n = offeneJeKunde.get(k.id) ?? 0;
            return (
              <ListenZeile
                key={k.id}
                to={`/auftraege/kunden/${k.id}`}
                titel={
                  <>
                    {k.name} <BeispielMarke zeigen={k.beispiel} />
                  </>
                }
                untertitel={[k.nummer, k.adresse ? `${k.adresse.plz} ${k.adresse.ort}` : null, k.telefon].filter(Boolean).join(' · ')}
                rechts={n ? <Status ton="aktiv">{n === 1 ? '1 offener Auftrag' : `${n} offene Aufträge`}</Status> : null}
              />
            );
          })}
        </Liste>
      </Stapel>
    </Seite>
  );
}
