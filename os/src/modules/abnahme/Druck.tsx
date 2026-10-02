/** Druckbausteine für Protokolle (Abnahme, Berichte). Rahmen und Briefbogen kommen aus `@ui`. */
import type { ReactNode } from 'react';
import { db } from '@core/db';
import { adresseText } from '@core/format';

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
