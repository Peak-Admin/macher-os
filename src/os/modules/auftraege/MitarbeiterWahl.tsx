import { db } from '@core/db';
import { personName } from '@core/format';
import type { ID } from '@core/objects';
import { Feld, Icon } from '@ui/index';

/**
 * Mehrfachauswahl für Mitarbeiter: Gewählte stehen als Chips da (Klick entfernt), darunter eine native Auswahl
 * „Mitarbeiter hinzufügen“. Kein Hover, kein Drag – alles mit Tastatur und Daumen erreichbar.
 */
export function MitarbeiterWahl({ wert, onChange, label = 'Mitarbeiter', hilfe }: { wert: ID[]; onChange: (ids: ID[]) => void; label?: string; hilfe?: string }) {
  const alle = db.mitarbeiter.use((m) => m.aktiv || wert.includes(m.id), [wert.join(',')]);
  const gewaehlt = wert.map((id) => alle.find((m) => m.id === id)).filter((m): m is NonNullable<typeof m> => !!m);
  const rest = alle.filter((m) => !wert.includes(m.id)).sort((x, y) => personName(x).localeCompare(personName(y), 'de'));
  return (
    <Feld label={label} hilfe={hilfe} optional>
      {(id, beschrieben) => (
        <div className="ak-mitarbeiter">
          {gewaehlt.length > 0 && (
            <ul className="ak-mitarbeiter-chips" aria-label="Ausgewählt">
              {gewaehlt.map((m) => (
                <li key={m.id}>
                  <button type="button" className="mm-chip mm-chip--an" aria-label={`${personName(m)} entfernen`} onClick={() => onChange(wert.filter((x) => x !== m.id))}>
                    {personName(m)}
                    <Icon name="x" size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {rest.length > 0 && (
            <div className="mm-feldrahmen">
              <Icon name="team" size={20} className="mm-feldrahmen-icon" aria-hidden />
              <select id={id} className="mm-input mm-input--icon mm-select" aria-describedby={beschrieben} value="" onChange={(e) => e.target.value && onChange([...wert, e.target.value])}>
                <option value="">{gewaehlt.length ? 'Weitere hinzufügen' : 'Mitarbeiter hinzufügen'}</option>
                {rest.map((m) => (
                  <option key={m.id} value={m.id}>
                    {personName(m)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </Feld>
  );
}
