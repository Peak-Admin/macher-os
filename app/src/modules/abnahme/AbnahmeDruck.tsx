import { useParams } from 'react-router-dom';
import { db } from '@core/db';
import { datum } from '@core/format';
import { ERGEBNIS_TEXT, abnahmen, ergebnis } from './daten';
import { AuftragKopf, DruckNichtGefunden, DruckSeite } from './Druck';
import { UnterschriftAnzeige } from './Unterschrift';

export function AbnahmeDruck() {
  const { id = '' } = useParams();
  const a = abnahmen.useOne(id);
  const maengel = db.aufgaben.use((x) => !!a?.mangelAufgabeIds.includes(x.id), [a?.mangelAufgabeIds.join()]);
  const fotos = db.dokumente.use((d) => !!a?.fotoIds.includes(d.id), [a?.fotoIds.join()]);
  if (!a) return <DruckNichtGefunden was="Abnahme" zurueck="/auftraege/abnahme" />;
  return (
    <DruckSeite titel="Abnahmeprotokoll" zurueck={`/auftraege/abnahme/${a.id}`} beispiel={a.beispiel}>
      <AuftragKopf
        auftragId={a.auftragId}
        extra={[
          ['Datum der Abnahme', datum(a.datum)],
          ['Ort', a.ort || '–'],
          ['Anwesend', a.teilnehmer || '–'],
          ['Ergebnis', a.status === 'verweigert' ? `Abnahme verweigert: ${a.verweigertGrund}` : a.status === 'offen' ? 'Noch nicht unterschrieben' : ERGEBNIS_TEXT[ergebnis(a.mangelAufgabeIds)]],
        ]}
      />
      <h2>Mängel</h2>
      {maengel.length ? (
        <table>
          <thead>
            <tr>
              <th>Nr.</th>
              <th>Mangel</th>
              <th>Beseitigen bis</th>
            </tr>
          </thead>
          <tbody>
            {maengel.map((m, i) => (
              <tr key={m.id}>
                <td>{i + 1}</td>
                <td>{m.titel.replace(/^Mangel: /, '')}</td>
                <td>{datum(m.faellig)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Es wurden keine Mängel festgestellt.</p>
      )}
      {a.bemerkung && (
        <>
          <h2>Bemerkungen</h2>
          <p>{a.bemerkung}</p>
        </>
      )}
      {fotos.length > 0 && (
        <>
          <h2>Fotos</h2>
          <div className="doku-druck-fotos">
            {fotos.map((f) => (
              <figure key={f.id} style={{ margin: 0 }}>
                <img src={f.url} alt={f.titel} />
                <figcaption className="mm-meta">{[f.tags?.join(', '), f.titel].filter(Boolean).join(' · ')}</figcaption>
              </figure>
            ))}
          </div>
        </>
      )}
      <p style={{ marginTop: 24 }}>
        Der Auftraggeber bestätigt mit seiner Unterschrift die Abnahme der Leistung
        {a.mangelAufgabeIds.length ? ' unter Vorbehalt der oben aufgeführten Mängel.' : '.'}
      </p>
      <div className="doku-druck-unterschriften">
        {a.unterschriftKunde ? <UnterschriftAnzeige daten={a.unterschriftKunde} rolle="Auftraggeber" /> : <p className="mm-meta">Noch keine Unterschrift.</p>}
      </div>
    </DruckSeite>
  );
}
