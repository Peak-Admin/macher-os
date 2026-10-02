/** Druck-/PDF-Ansicht für Auftragsbestätigung und Lieferschein im gemeinsamen Briefbogen */
import { useParams } from 'react-router-dom';
import { db } from '@core/db';
import { adresseText, datum, euro } from '@core/format';
import { Briefbogen, DruckNichtGefunden, DruckPositionen, DruckSummen } from '@ui/index';
import { ustSatz } from '@modules/angebote/daten';
import { UnterschriftAnzeige } from '@modules/abnahme/Unterschrift';
import { geschaeftsdokumente, GESCHAEFTS_LABEL, positionenVon, summeVon } from './daten';

export function DokumentDruck() {
  const { id = '' } = useParams();
  const d = geschaeftsdokumente.useOne(id);
  if (!d) return <DruckNichtGefunden was="Dokument" />;
  const a = db.auftraege.get(d.auftragId);
  const ort = db.orte.get(a?.ortId);
  const k = db.kunden.get(d.kundeId);
  const angebot = db.angebote.get(d.angebotId);
  const ab = d.art === 'auftragsbestaetigung';
  const ust = ustSatz();
  const s = ab ? summeVon(d, ust) : undefined;
  return (
    <Briefbogen
      kundeId={d.kundeId}
      titel={`${GESCHAEFTS_LABEL[d.art]} ${d.nummer}`}
      beispiel={d.beispiel}
      daten={[
        ['Nummer', d.nummer],
        ['Datum', datum(d.datum)],
        ['Kundennummer', k?.nummer ?? ''],
        ['Auftrag', a?.nummer ?? ''],
        ['Angebot', angebot ? `${angebot.nummer} vom ${datum(angebot.datum)}` : ''],
        ['Ausführungsort', ort ? adresseText(ort.adresse) : ''],
      ]}
    >
      {d.status === 'entwurf' && <p className="mm-druck-wasserzeichen">ENTWURF</p>}
      <p>
        <strong>{d.titel}</strong>
      </p>
      {d.text && <p style={{ whiteSpace: 'pre-wrap' }}>{d.text}</p>}
      <DruckPositionen positionen={positionenVon(d)} preise={ab} />
      {s && (
        <DruckSummen
          zeilen={[
            ...(s.rabatt > 0 ? [{ label: `Rabatt ${angebot?.rabattProzent ?? ''} %`, wert: `− ${euro(s.rabatt)}` }] : []),
            { label: 'Summe netto', wert: euro(s.netto) },
            { label: ust ? `zzgl. ${ust} % USt.` : 'Keine USt. (Kleinunternehmer, § 19 UStG)', wert: euro(s.ust) },
            { label: 'Gesamtbetrag', wert: euro(s.brutto), gesamt: true },
          ]}
        />
      )}
      {ab && d.ausfuehrung && <p>Geplante Ausführung: {d.ausfuehrung}</p>}
      {d.schluss && <p style={{ whiteSpace: 'pre-wrap' }}>{d.schluss}</p>}
      {!ab && (
        <>
          <p style={{ marginTop: 24 }}>Ware vollständig und ohne erkennbare Schäden erhalten.</p>
          <div className="mm-druck-unterschriften">
            {d.unterschrift ? (
              <UnterschriftAnzeige daten={d.unterschrift} rolle="Empfänger" />
            ) : (
              <div>
                <div style={{ height: 60, borderBottom: '1px solid var(--mm-border)' }} />
                <p className="mm-druck-klein">Datum, Unterschrift Empfänger</p>
              </div>
            )}
          </div>
        </>
      )}
    </Briefbogen>
  );
}
