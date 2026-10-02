/** Druck-/PDF-Ansicht der Rechnung im gemeinsamen Briefbogen (`@ui`). Über „Drucken → Als PDF speichern“ entsteht das PDF. */
import { useParams } from 'react-router-dom';
import { db } from '@core/db';
import { datum, euro, positionSumme } from '@core/format';
import { Briefbogen, DruckNichtGefunden } from '@ui/index';
import { ART_LABEL, pflichtTexte, rechnungsSummen } from './logik';
import { rechnungX } from './typen';

export function RechnungDruck() {
  const { id = '' } = useParams();
  const r = rechnungX(id);
  if (!r) return <DruckNichtGefunden was="Rechnung" />;
  const b = db.betrieb.get('betrieb');
  const k = db.kunden.get(r.kundeId);
  const s = rechnungsSummen(r, b);
  const entwurf = r.status === 'entwurf';
  const titel = `${r.stornoFuerId ? 'Stornorechnung' : ART_LABEL[r.art]} ${entwurf ? '' : r.nummer}`;
  const original = r.stornoFuerId ? rechnungX(r.stornoFuerId) : undefined;
  return (
    <Briefbogen
      kundeId={r.kundeId}
      titel={titel}
      daten={[
        ['Rechnungsnummer', entwurf ? 'wird beim Festschreiben vergeben' : r.nummer],
        ['Rechnungsdatum', datum(r.datum)],
        ['Leistungszeitraum', r.leistungszeitraum ?? ''],
        ['Kundennummer', k?.nummer ?? ''],
        ['Auftrag', db.auftraege.get(r.auftragId)?.nummer ?? ''],
        ['Bezug', original ? `Rechnung ${original.nummer} vom ${datum(original.datum)}` : ''],
      ]}
    >
      {entwurf && <p className="mm-druck-wasserzeichen">ENTWURF – nicht versenden</p>}
      <p>
        <strong>{r.titel}</strong>
      </p>
      <table>
        <thead>
          <tr>
            <th>Pos.</th>
            <th>Beschreibung</th>
            <th className="num mm-nebensaechlich">Menge</th>
            <th className="num mm-nebensaechlich">Einzelpreis</th>
            <th className="num">Gesamt</th>
          </tr>
        </thead>
        <tbody>
          {r.positionen.map((p, i) => (
            <tr key={p.id}>
              <td>{i + 1}</td>
              <td style={{ whiteSpace: 'pre-wrap' }}>{p.text}</td>
              <td className="num mm-nebensaechlich">{p.art === 'text' ? '' : `${String(p.menge).replace('.', ',')} ${p.einheit}`}</td>
              <td className="num mm-nebensaechlich">{p.art === 'text' ? '' : euro(p.einzelpreis)}</td>
              <td className="num">{p.art === 'text' ? '' : euro(positionSumme(p))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <table className="mm-druck-summen">
        <tbody>
          <tr>
            <td>Summe netto</td>
            <td className="num">{euro(s.netto)}</td>
          </tr>
          {!b?.kleinunternehmer && (
            <tr>
              <td>zzgl. USt {s.ustSatz} %</td>
              <td className="num">{euro(s.ust)}</td>
            </tr>
          )}
          <tr>
            <td>
              <strong>Gesamtbetrag</strong>
            </td>
            <td className="num">
              <strong>{euro(s.brutto)}</strong>
            </td>
          </tr>
          {s.abzuege.map((a) => (
            <tr key={a.id}>
              <td>
                abzüglich {a.nummer} vom {datum(a.datum)}
                <br />
                <span style={{ fontSize: 12 }}>
                  netto {euro(a.netto)}, USt {euro(a.ust)}
                </span>
              </td>
              <td className="num">{euro(-a.brutto)}</td>
            </tr>
          ))}
          {s.abzuege.length > 0 && (
            <tr>
              <td>
                <strong>Zahlbetrag</strong>
              </td>
              <td className="num">
                <strong>{euro(s.zahlbetrag)}</strong>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div style={{ marginTop: 24 }}>
        {r.art !== 'gutschrift' && (
          <p>
            Bitte überweisen Sie {euro(s.zahlbetrag)} bis zum {datum(r.faelligAm)}
            {b?.iban ? ` auf das Konto IBAN ${b.iban}` : ''} unter Angabe der Rechnungsnummer.
          </p>
        )}
        {pflichtTexte(r, b, k).map((t) => (
          <p key={t}>{t}</p>
        ))}
        {r.bemerkung && <p>{r.bemerkung}</p>}
        <p>Vielen Dank für Ihren Auftrag.</p>
      </div>
    </Briefbogen>
  );
}
