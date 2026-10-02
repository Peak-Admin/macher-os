import { useParams } from 'react-router-dom';
import { datum } from '@core/format';
import { AuftragKopf, DruckNichtGefunden, DruckSeite } from '@modules/abnahme/Druck';
import { UnterschriftAnzeige } from '@modules/abnahme/Unterschrift';
import { artLabel, berichte } from './daten';
import { AufgabenListe, MaterialTabelle, ZeitenTabelle, useBerichtInhalt } from './Inhalt';

export function BerichtDruck() {
  const { id = '' } = useParams();
  const b = berichte.useOne(id);
  const { fotos } = useBerichtInhalt(b);
  if (!b) return <DruckNichtGefunden was="Bericht" zurueck="/auftraege/berichte" />;
  return (
    <DruckSeite titel={artLabel(b.art)} nummer={b.nummer} zurueck={`/auftraege/berichte/${b.id}`} beispiel={b.beispiel}>
      <AuftragKopf auftragId={b.auftragId} extra={[['Datum', datum(b.datum)]]} />
      <h2>Ausgeführte Arbeiten</h2>
      <p style={{ whiteSpace: 'pre-wrap' }}>{b.taetigkeiten || 'Keine Angaben.'}</p>
      {b.art === 'pruefprotokoll' && (
        <>
          <h2>Prüfpunkte</h2>
          <table>
            <thead>
              <tr>
                <th>Prüfpunkt</th>
                <th>Ergebnis</th>
                <th>Messwert / Bemerkung</th>
              </tr>
            </thead>
            <tbody>
              {(b.pruefpunkte ?? []).map((p) => (
                <tr key={p.id}>
                  <td>{p.text}</td>
                  <td>{p.ergebnis === 'ok' ? 'In Ordnung' : p.ergebnis === 'mangel' ? 'Mangel' : p.ergebnis === 'entfaellt' ? 'Entfällt' : 'Nicht geprüft'}</td>
                  <td>{p.wert || '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      <h2>Arbeitszeiten</h2>
      <ZeitenTabelle b={b} />
      <h2>Material</h2>
      <MaterialTabelle b={b} />
      <h2>Erledigte Aufgaben</h2>
      <AufgabenListe b={b} />
      {b.bemerkung && (
        <>
          <h2>Bemerkung</h2>
          <p>{b.bemerkung}</p>
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
      <div className="doku-druck-unterschriften">
        {b.unterschriftKunde ? <UnterschriftAnzeige daten={b.unterschriftKunde} rolle="Kunde" /> : <p className="mm-meta">Nicht vom Kunden unterschrieben.</p>}
      </div>
    </DruckSeite>
  );
}
