import { useParams } from 'react-router-dom';
import { db } from '@core/db';
import { adresseText, datum, euro, positionSumme, zahl } from '@core/format';
import { Button, Leer } from '@ui/index';
import { angebotSummen, optionalSumme, ustSatz } from './daten';
import './angebote.css';

/** Druck-/PDF-Ansicht ohne App-Rahmen. „Drucken“ → im Browser „Als PDF speichern“. */
export function AngebotDruck() {
  const { id = '' } = useParams();
  const a = db.angebote.useOne(id);
  const b = db.betrieb.useOne('betrieb');
  if (!a)
    return (
      <div className="vt-druck">
        <Leer titel="Angebot nicht gefunden" icon="dokument" />
      </div>
    );
  const k = db.kunden.get(a.kundeId);
  const ort = db.orte.get(db.auftraege.get(a.auftragId)?.ortId);
  const s = angebotSummen(a);
  const opt = optionalSumme(a);
  const ust = ustSatz();
  let nr = 0;

  return (
    <div className="vt-druck">
      <div className="vt-nicht-drucken vt-druck-leiste">
        <Button icon="download" onClick={() => window.print()}>
          Drucken / als PDF speichern
        </Button>
        <Button variante="tertiaer" onClick={() => window.close()}>
          Schließen
        </Button>
      </div>
      <article className="vt-blatt">
        <header className="vt-blatt-kopf">
          <div>
            <strong className="vt-firma">{b?.name}</strong>
            {b?.adresse && (b.adresse.strasse || b.adresse.ort) && <div>{adresseText(b.adresse)}</div>}
            <div>{[b?.telefon, b?.email].filter(Boolean).join(' · ')}</div>
          </div>
          <div className="vt-rechts">
            <div>
              <strong>Angebot {a.nummer}</strong>
              {a.version > 1 ? ` · Version ${a.version}` : ''}
            </div>
            <div>Datum: {datum(a.datum)}</div>
            <div>Gültig bis: {datum(a.gueltigBis)}</div>
          </div>
        </header>
        <section className="vt-empfaenger">
          <div>{k?.firma ?? k?.name}</div>
          {k?.firma && k.ansprechpartner[0] && <div>z. Hd. {k.ansprechpartner[0].name}</div>}
          {k?.adresse && (
            <>
              <div>{k.adresse.strasse}</div>
              <div>
                {k.adresse.plz} {k.adresse.ort}
              </div>
            </>
          )}
        </section>
        <h1 className="vt-titel">{a.titel}</h1>
        {ort && <p>Ausführungsort: {adresseText(ort.adresse)}</p>}
        {a.einleitung && <p>{a.einleitung}</p>}
        <div className="vt-tabelle-rahmen">
        <table className="vt-tabelle">
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
                    {p.optional && <div className="vt-klein">Bedarfs-/Alternativposition – nicht in der Summe enthalten</div>}
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
        <table className="vt-summen">
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
            <tr className="vt-gesamt">
              <td>Gesamtbetrag</td>
              <td className="num">{euro(s.brutto)}</td>
            </tr>
          </tbody>
        </table>
        {opt > 0 && <p className="vt-klein">Bedarfs-/Alternativpositionen über {euro(opt)} netto werden nur nach Beauftragung berechnet.</p>}
        <p>Wir freuen uns auf Ihren Auftrag. Dieses Angebot ist gültig bis {datum(a.gueltigBis)}.</p>
        <footer className="vt-fuss">{[b?.name, b?.steuernummer ? `St.-Nr. ${b.steuernummer}` : null, b?.ustId ? `USt-IdNr. ${b.ustId}` : null, b?.iban ? `IBAN ${b.iban}` : null].filter(Boolean).join(' · ')}</footer>
      </article>
    </div>
  );
}
