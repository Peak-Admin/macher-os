/** Gemeinsamer Rahmen für Druck-/PDF-Ansichten (Abnahme, Berichte, Nachträge). */
import type { ReactNode } from 'react';
import { db } from '@core/db';
import { adresseText } from '@core/format';
import { BeispielMarke, Button, Leer, Meta } from '@ui/index';
import './druck.css';

export function DruckSeite({ titel, nummer, zurueck, beispiel, children }: { titel: string; nummer?: string; zurueck: string; beispiel?: boolean; children: ReactNode }) {
  const b = db.betrieb.useOne('betrieb');
  return (
    <div className="doku-druck-huelle">
      <div className="doku-druck-leiste doku-nicht-drucken">
        <Button variante="tertiaer" icon="zurueck" to={zurueck}>
          Zurück
        </Button>
        <Button icon="download" onClick={() => window.print()}>
          Drucken oder als PDF speichern
        </Button>
      </div>
      <p className="mm-meta doku-nicht-drucken" style={{ maxWidth: 820, margin: '0 auto 16px' }}>
        Für ein PDF wählst du im Druckdialog „Als PDF speichern“.
      </p>
      <article className="doku-druck">
        <header className="doku-druck-kopf">
          <div>
            <p className="mm-oberzeile">{b?.name ?? 'Dein Betrieb'}</p>
            <h1>
              {titel} <BeispielMarke zeigen={beispiel} />
            </h1>
            {nummer && <Meta>{nummer}</Meta>}
          </div>
          {b && (
            <div style={{ textAlign: 'right' }}>
              {b.adresse.strasse && <Meta>{adresseText(b.adresse)}</Meta>}
              {b.telefon && <Meta>{b.telefon}</Meta>}
              {b.email && <Meta>{b.email}</Meta>}
            </div>
          )}
        </header>
        {children}
      </article>
    </div>
  );
}

export function DruckNichtGefunden({ was, zurueck }: { was: string; zurueck: string }) {
  return (
    <div className="doku-druck-huelle">
      <div className="doku-druck">
        <Leer titel={`${was} nicht gefunden`} text="Vielleicht wurde es gelöscht." aktion={<Button to={zurueck}>Zurück</Button>} icon="dokument" />
      </div>
    </div>
  );
}

/** Kopfdaten: Auftrag, Kunde, Ort als Tabelle */
export function AuftragKopf({ auftragId, extra = [] }: { auftragId: string; extra?: [string, ReactNode][] }) {
  const a = db.auftraege.get(auftragId);
  const k = db.kunden.get(a?.kundeId);
  const o = db.orte.get(a?.ortId);
  const zeilen: [string, ReactNode][] = [
    ['Auftrag', a ? `${a.nummer} · ${a.titel}` : '–'],
    ['Kunde', k ? [k.name, k.adresse ? adresseText(k.adresse) : ''].filter(Boolean).join(', ') : '–'],
    ...(o ? ([['Einsatzort', `${o.bezeichnung}, ${adresseText(o.adresse)}`]] as [string, ReactNode][]) : []),
    ...extra,
  ];
  return (
    <table>
      <tbody>
        {zeilen.map(([k2, v]) => (
          <tr key={k2}>
            <th style={{ width: '30%' }}>{k2}</th>
            <td>{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
