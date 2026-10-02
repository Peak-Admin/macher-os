/** Druck-/PDF-Ansicht mit Briefkopf aus den Betriebsdaten. Über „Drucken → Als PDF speichern“ entsteht das PDF. */
import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '@core/db';
import { datum, euro, positionSumme } from '@core/format';
import { Button, Leer } from '@ui/index';
import { ART_LABEL, pflichtTexte, rechnungsSummen } from './logik';
import { rechnungX } from './typen';

const druckCss = `
.geld-druck { background: var(--mm-surface); color: var(--mm-text); font-family: var(--mm-font); max-width: 820px; margin: 0 auto; padding: 32px 24px 64px; font-size: 14px; line-height: 1.45; }
.geld-druck h1 { font-size: 24px; margin: 32px 0 8px; }
.geld-druck table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
.geld-druck th, .geld-druck td { text-align: left; padding: 8px 4px; border-bottom: 1px solid var(--mm-border); vertical-align: top; }
.geld-druck .num { text-align: right; white-space: nowrap; }
.geld-druck .kopf { display: flex; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
.geld-druck .absender { font-size: 11px; color: var(--mm-muted-on-white); border-bottom: 1px solid var(--mm-border); margin-bottom: 4px; }
.geld-druck .fuss { margin-top: 48px; padding-top: 12px; border-top: 1px solid var(--mm-border); font-size: 12px; color: var(--mm-muted-on-white); display: flex; gap: 24px; flex-wrap: wrap; }
.geld-druck .wasserzeichen { color: var(--mm-danger); font-weight: 800; letter-spacing: .1em; }
.geld-druck .leiste { display: flex; gap: 8px; justify-content: flex-end; margin-bottom: 16px; }
@media print { .geld-druck .leiste { display: none; } .geld-druck { padding: 0; } body { background: #fff; } }
@media (max-width: 480px) { .geld-druck { padding: 16px; font-size: 13px; } .geld-druck .nebensaechlich { display: none; } }
`;

/** Briefbogen: Absender, Empfänger, Datenblock, Inhalt, Fußzeile */
export function Briefbogen({ kundeId, daten, children, titel }: { kundeId: string; daten: [string, string][]; children: ReactNode; titel: string }) {
  const b = db.betrieb.get('betrieb');
  const k = db.kunden.get(kundeId);
  return (
    <div className="geld-druck">
      <style>{druckCss}</style>
      <div className="leiste">
        <Button variante="sekundaer" onClick={() => window.close()}>
          Schließen
        </Button>
        <Button icon="dokument" onClick={() => window.print()}>
          Drucken / als PDF speichern
        </Button>
      </div>
      <div className="kopf">
        <div>
          <div className="absender">
            {[b?.name, b?.adresse.strasse, `${b?.adresse.plz ?? ''} ${b?.adresse.ort ?? ''}`.trim()].filter(Boolean).join(' · ')}
          </div>
          <div>
            <strong>{k?.firma || k?.name}</strong>
            {k?.firma && k.firma !== k.name ? <div>{k.name}</div> : null}
            <div>{k?.adresse?.strasse}</div>
            <div>
              {k?.adresse?.plz} {k?.adresse?.ort}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <strong style={{ fontSize: 18 }}>{b?.name}</strong>
          <div>{b?.adresse.strasse}</div>
          <div>
            {b?.adresse.plz} {b?.adresse.ort}
          </div>
          {b?.telefon && <div>Tel. {b.telefon}</div>}
          {b?.email && <div>{b.email}</div>}
        </div>
      </div>
      <h1>{titel}</h1>
      <table style={{ width: 'auto', marginBottom: 24 }}>
        <tbody>
          {daten
            .filter(([, w]) => w)
            .map(([l, w]) => (
              <tr key={l}>
                <td style={{ border: 0, padding: '2px 16px 2px 0' }}>{l}</td>
                <td style={{ border: 0, padding: 2 }}>{w}</td>
              </tr>
            ))}
        </tbody>
      </table>
      {children}
      <div className="fuss">
        <div>
          {b?.name}
          <br />
          {[b?.adresse.strasse, `${b?.adresse.plz ?? ''} ${b?.adresse.ort ?? ''}`.trim()].filter(Boolean).join(', ')}
        </div>
        <div>
          {b?.steuernummer && <>Steuernummer {b.steuernummer}<br /></>}
          {b?.ustId && <>USt-IdNr. {b.ustId}</>}
        </div>
        <div>{b?.iban && <>IBAN {b.iban}</>}</div>
      </div>
    </div>
  );
}

export function RechnungDruck() {
  const { id = '' } = useParams();
  const r = rechnungX(id);
  if (!r) return <Leer titel="Rechnung nicht gefunden" icon="euro" />;
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
      {entwurf && <p className="wasserzeichen">ENTWURF – nicht versenden</p>}
      <p>
        <strong>{r.titel}</strong>
      </p>
      <table>
        <thead>
          <tr>
            <th>Pos.</th>
            <th>Beschreibung</th>
            <th className="num nebensaechlich">Menge</th>
            <th className="num nebensaechlich">Einzelpreis</th>
            <th className="num">Gesamt</th>
          </tr>
        </thead>
        <tbody>
          {r.positionen.map((p, i) => (
            <tr key={p.id}>
              <td>{i + 1}</td>
              <td style={{ whiteSpace: 'pre-wrap' }}>{p.text}</td>
              <td className="num nebensaechlich">{p.art === 'text' ? '' : `${String(p.menge).replace('.', ',')} ${p.einheit}`}</td>
              <td className="num nebensaechlich">{p.art === 'text' ? '' : euro(p.einzelpreis)}</td>
              <td className="num">{p.art === 'text' ? '' : euro(positionSumme(p))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <table style={{ width: 'auto', marginLeft: 'auto', marginTop: 16 }}>
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
