/** Druck-/PDF-Ansicht der Rechnung im gemeinsamen Briefbogen (`@ui`). Über „Drucken → Als PDF speichern“ entsteht das PDF. */
import { useParams } from 'react-router-dom';
import { db } from '@core/db';
import { datum, euro } from '@core/format';
import { Briefbogen, DruckNichtGefunden, DruckPositionen, DruckSummen } from '@ui/index';
import { ART_LABEL, pflichtTexte, rechnungsSummen, summenZeilen } from './logik';
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
      beispiel={r.beispiel}
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
      <DruckPositionen positionen={r.positionen} />
      <DruckSummen zeilen={summenZeilen(s, b?.kleinunternehmer).map((z) => ({ label: z.label, wert: euro(z.wert), gesamt: z.gesamt, klein: z.klein }))} />
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
