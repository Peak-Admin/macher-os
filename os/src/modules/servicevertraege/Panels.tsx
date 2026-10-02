import { Link } from 'react-router-dom';
import { datum, heute } from '@core/format';
import type { ID } from '@core/objects';
import { Button, Karte, Meta, Stapel, Status } from '@ui/index';
import { intervallText } from '../wiederkehrend/regel';
import { laufzeitBis, servicevertraege, vertragFuerAnlage, zustand, ZUSTAND_TEXT } from './daten';

/** Am Kunden: seine Serviceverträge */
export function KundeVertraegePanel({ id }: { id: ID }) {
  const liste = servicevertraege.use((v) => v.kundeId === id, [id]);
  if (!liste.length) return null;
  return (
    <Karte titel="Serviceverträge" kompakt>
      <Stapel abstand={8}>
        {liste.map((v) => {
          const z = ZUSTAND_TEXT[zustand(v)];
          return (
            <div key={v.id}>
              <Link to={`/auftraege/servicevertraege/${v.id}`}>{v.titel}</Link>
              <Meta>
                {v.nummer} · Wartung {intervallText(v.intervallMonate)} · <Status ton={z.ton}>{z.text}</Status>
              </Meta>
            </div>
          );
        })}
      </Stapel>
    </Karte>
  );
}

/** An der Anlage: im Vertrag? sonst Vertrag anbieten */
export function AnlageVertragPanel({ id }: { id: ID }) {
  servicevertraege.use();
  const v = vertragFuerAnlage(id);
  return (
    <Karte titel="Servicevertrag" kompakt>
      {v ? (
        <Stapel abstand={8}>
          <Link to={`/auftraege/servicevertraege/${v.id}`}>
            {v.nummer} · {v.titel}
          </Link>
          <Meta>Wartung inklusive · läuft bis {datum(laufzeitBis(v, heute()))}</Meta>
        </Stapel>
      ) : (
        <Stapel abstand={8}>
          <Meta>Kein Vertrag. Mit einem Wartungsvertrag kommt die Wartung jedes Jahr von allein – und das Geld planbar.</Meta>
          <div>
            <Button klein variante="sekundaer" to={`/auftraege/servicevertraege/neu?anlageId=${id}`}>Vertrag anlegen</Button>
          </div>
        </Stapel>
      )}
    </Karte>
  );
}
