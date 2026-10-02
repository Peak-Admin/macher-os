/**
 * Anzeige einer Unterschrift (Abnahme, Berichte, Zusatzleistungen).
 * Das Feld zum Unterschreiben ist `UnterschriftFeld` aus `@ui`.
 */
import { db } from '@core/db';
import { datum, uhrzeit } from '@core/format';
import { Meta } from '@ui/index';
import type { UnterschriftDaten } from './unterschrift';

/** Anzeige einer geleisteten Unterschrift (Bildschirm und Druck) */
export function UnterschriftAnzeige({ daten, rolle }: { daten: UnterschriftDaten; rolle?: string }) {
  const bild = db.dokumente.useOne(daten.dokumentId);
  return (
    <div>
      {bild?.url ? (
        <img src={bild.url} alt={`Unterschrift von ${daten.name}`} style={{ maxWidth: 280, width: '100%', height: 90, objectFit: 'contain', objectPosition: 'left', display: 'block', borderBottom: '1px solid var(--mm-border-dark)' }} />
      ) : (
        <Meta>Unterschriftsbild nicht mehr vorhanden.</Meta>
      )}
      <Meta>
        {rolle ? `${rolle}: ` : ''}
        {daten.name}
        {daten.ort ? `, ${daten.ort}` : ''} · {datum(daten.zeitpunkt)}, {uhrzeit(daten.zeitpunkt)}
      </Meta>
    </div>
  );
}
