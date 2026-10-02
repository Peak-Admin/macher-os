import { useParams } from 'react-router-dom';
import { db } from '@core/db';
import { adresseText, datum, euro, positionSumme, zahl } from '@core/format';
import type { Angebot } from '@core/objects';
import { Briefbogen, DruckNichtGefunden } from '@ui/index';
import { angebotSummen, optionalSumme, ustSatz } from './daten';

/** Druck-/PDF-Ansicht im gemeinsamen Briefbogen (`@ui`). „Drucken“ → im Browser „Als PDF speichern“. */
export function AngebotDruck() {
  const { id = '' } = useParams();
  const a = db.angebote.useOne(id);
  if (!a) return <DruckNichtGefunden was="Angebot" />;
  return <AngebotBrief a={a} />;
}

/** Das Angebot im Briefbogen – auch als Vorschau für ein noch nicht gespeichertes Angebot */
export function AngebotBrief({ a }: { a: Pick<Angebot, 'kundeId' | 'auftragId' | 'titel' | 'beispiel' | 'nummer' | 'version' | 'datum' | 'gueltigBis' | 'einleitung' | 'positionen' | 'rabattProzent'> }) {
  const ort = db.orte.get(db.auftraege.get(a.auftragId)?.ortId);
  const s = angebotSummen(a);
  const opt = optionalSumme(a);
  const ust = ustSatz();
  let nr = 0;

  return (
    <Briefbogen
      kundeId={a.kundeId}
      titel={a.titel}
      beispiel={a.beispiel}
      daten={[
        ['Angebot', `${a.nummer}${a.version > 1 ? ` · Version ${a.version}` : ''}`],
        ['Datum', datum(a.datum)],
        ['Gültig bis', datum(a.gueltigBis)],
        ['Ausführungsort', ort ? adresseText(ort.adresse) : ''],
      ]}
    >
      {a.einleitung && <p>{a.einleitung}</p>}
      <div className="mm-druck-tabelle-rahmen">
        <table>
          <thead>
            <tr>
              <th>Pos.</th>
              <th>Beschreibung</th>
              <th className="num">Menge</th>
              <th className="num">Einzelpreis</th>
              <th className="num">Gesamt</th>
            </tr>
          </thead>
          <tbody>
            {a.positionen.map((p) => {
              if (p.art === 'text')
                return (
                  <tr key={p.id}>
                    <td />
                    <td colSpan={4}>{p.text}</td>
                  </tr>
                );
              nr++;
              return (
                <tr key={p.id}>
                  <td>{nr}</td>
                  <td>
                    {p.text}
                    {p.optional && <div className="mm-druck-klein">Bedarfs-/Alternativposition – nicht in der Summe enthalten</div>}
                  </td>
                  <td className="num">
                    {zahl(p.menge)} {p.einheit}
                  </td>
                  <td className="num">{euro(p.einzelpreis)}</td>
                  <td className="num">{p.optional ? `(${euro(Math.round(p.menge * p.einzelpreis))})` : euro(positionSumme(p))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <table className="mm-druck-summen">
        <tbody>
          {s.rabatt > 0 && (
            <tr>
              <td>Rabatt {a.rabattProzent} %</td>
              <td className="num">− {euro(s.rabatt)}</td>
            </tr>
          )}
          <tr>
            <td>Summe netto</td>
            <td className="num">{euro(s.netto)}</td>
          </tr>
          <tr>
            <td>{ust ? `zzgl. ${ust} % USt.` : 'Keine USt. (Kleinunternehmer, § 19 UStG)'}</td>
            <td className="num">{euro(s.ust)}</td>
          </tr>
          <tr className="mm-druck-gesamt">
            <td>Gesamtbetrag</td>
            <td className="num">{euro(s.brutto)}</td>
          </tr>
        </tbody>
      </table>
      {opt > 0 && <p className="mm-druck-klein">Bedarfs-/Alternativpositionen über {euro(opt)} netto werden nur nach Beauftragung berechnet.</p>}
      <p>Wir freuen uns auf Ihren Auftrag. Dieses Angebot ist gültig bis {datum(a.gueltigBis)}.</p>
    </Briefbogen>
  );
}
