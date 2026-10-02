/**
 * Betrieb: vier Türen – Geld, Team, Ausstattung, Unternehmen.
 * Jede Kachel: Titel, kurze Erklärung, höchstens ein Hinweis. Keine Unterlisten, keine Kennzahlen davor.
 * Darunter ein ruhiger Link zu „Alle Module“ (Verzeichnis mit Suche und Favoriten).
 */
import { Link, Navigate, useParams } from 'react-router-dom';
import { modul } from '@core/modul';
import { useDatenstand } from '@core/db';
import { istBuero, useIch } from '@core/session';
import { Icon, Seite, Status } from '@ui/index';
import { STRUKTUR, sichtbareAnsichten, sichtbareZiele, zielPfad, type Kategorie } from './struktur';
import type { Mitarbeiter } from '@core/objects';
import { NichtGefunden } from './NichtGefunden';

const KATEGORIEN = STRUKTUR.find((h) => h.id === 'betrieb')!.kategorien!;

/** Der wichtigste Hinweis einer Kategorie (nur „Aufmerksamkeit“ – Routine bleibt still) */
function hinweisFuer(k: Kategorie, ich: Mitarbeiter | undefined) {
  for (const z of sichtbareZiele(k.ziele, ich)) {
    for (const a of sichtbareAnsichten(z, ich)) {
      for (const id of a.module) {
        try {
          const info = modul(id)?.kurzinfo?.();
          if (info?.ton === 'achtung') return info.text;
        } catch {
          /* Kurzinfo ist optional */
        }
      }
    }
  }
  return undefined;
}

export function BetriebSeite() {
  useDatenstand();
  const ich = useIch();
  const kategorien = KATEGORIEN.filter((k) => sichtbareZiele(k.ziele, ich).length > 0);
  return (
    <Seite titel="Betrieb" untertitel="Alles, was dein Betrieb dauerhaft braucht.">
      <ul className="mm-tueren">
        {kategorien.map((k) => {
          // Hinweise zu Verwaltung und Freigaben betreffen Chef und Büro
          const hinweis = istBuero(ich) ? hinweisFuer(k, ich) : undefined;
          return (
            <li key={k.id}>
              <Link to={`/betrieb/${k.id}`} className="mm-tuer">
                <span className="mm-modulkachel-icon" aria-hidden>
                  <Icon name={k.icon} />
                </span>
                <span className="mm-tuer-text">
                  <strong>{k.titel}</strong>
                  <span className="mm-meta">{k.text}</span>
                  {hinweis && <Status ton="achtung">{hinweis}</Status>}
                </span>
                <Icon name="weiter" size={20} className="mm-modulzeile-pfeil" />
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="mm-alle-module-link">
        <Link to="/betrieb/module" className="mm-pfeillink">
          Alle Module ansehen und Favoriten wählen <Icon name="weiter" size={16} />
        </Link>
      </p>
    </Seite>
  );
}

/** `/betrieb/<kategorie>` öffnet direkt die erste Arbeitsansicht – kein leerer Zwischen-Hub */
export function KategorieWeiter() {
  const { kategorie } = useParams();
  const ich = useIch();
  const k = KATEGORIEN.find((x) => x.id === kategorie);
  if (!k) return <NichtGefunden />;
  const z = sichtbareZiele(k.ziele, ich)[0];
  if (!z) return <Navigate to="/betrieb" replace />;
  return <Navigate to={zielPfad(z, ich)} replace />;
}
