import { db } from '@core/db';
import { personName } from '@core/format';
import type { ID } from '@core/objects';
import { Auswahl, Icon } from '@ui/index';

/**
 * Mehrfachauswahl für Mitarbeiter: eine Auswahl „Mitarbeiter hinzufügen“, darunter die Gewählten als Chips (Klick entfernt).
 * Kein Hover, kein Drag – alles mit Tastatur und Daumen erreichbar.
 */
export function MitarbeiterWahl({ wert, onChange, label = 'Mitarbeiter', hilfe }: { wert: ID[]; onChange: (ids: ID[]) => void; label?: string; hilfe?: string }) {
  const alle = db.mitarbeiter.use((m) => m.aktiv || wert.includes(m.id), [wert.join(',')]);
  const gewaehlt = wert.map((id) => alle.find((m) => m.id === id)).filter((m): m is NonNullable<typeof m> => !!m);
  const rest = alle.filter((m) => !wert.includes(m.id)).sort((x, y) => personName(x).localeCompare(personName(y), 'de'));
  return (
    <div className="ak-mitarbeiter">
      <Auswahl
        label={label}
        hilfe={hilfe}
        optional
        icon="team"
        value=""
        leer={rest.length === 0 ? 'Alle sind ausgewählt' : gewaehlt.length ? 'Weitere hinzufügen' : 'Mitarbeiter hinzufügen'}
        disabled={rest.length === 0}
        optionen={rest.map((m) => ({ wert: m.id, label: personName(m) }))}
        onChange={(e) => e.target.value && onChange([...wert, e.target.value])}
      />
      {gewaehlt.length > 0 && (
        <ul className="ak-mitarbeiter-chips" aria-label={`${label}: ausgewählt`}>
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
    </div>
  );
}
