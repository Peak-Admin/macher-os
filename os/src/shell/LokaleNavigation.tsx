/**
 * Lokale Navigation im Inhaltsbereich: höchstens vier Ziele des aktuellen Bereichs,
 * darunter – nur wenn nötig – höchstens vier Ansichten des gewählten Ziels.
 * Auf Detail-, Anlege- und Bearbeitungsseiten tritt sie zurück (die Seite hat dort ihren Zurück-Link).
 */
import { Link } from 'react-router-dom';
import { modul, modulPfad } from '@core/modul';
import { useDatenstand } from '@core/db';
import { useIch } from '@core/session';
import { Icon } from '@ui/index';
import { ansichtPfad, sichtbareAnsichten, sichtbareZiele, zielPfad, zieleVon, type Ort } from './struktur';

export function LokaleNavigation({ ort }: { ort: Ort }) {
  useDatenstand();
  const ich = useIch();
  if (ort.detail || ort.haupt.id === 'heute') return null;
  // Betrieb-Startseite (Kacheln) hat keine lokale Navigation
  if (ort.haupt.id === 'betrieb' && !ort.kategorie) return null;
  const ziele = sichtbareZiele(ort.kategorie ? ort.kategorie.ziele : zieleVon(ort.haupt), ich);
  if (!ort.ziel && !ort.kategorie) return null;
  const ansichten = ort.ziel ? sichtbareAnsichten(ort.ziel, ich) : [];
  const weitere = ort.ansicht && ort.ansicht.module.length > 1 ? ort.ansicht.module.filter((id) => id !== ort.modulId).map((id) => modul(id)).filter((m) => !!m) : [];

  return (
    <div className="mm-lokal">
      {ort.kategorie && (
        <nav className="mm-brotkrumen mm-lokal-pfad" aria-label="Brotkrumen">
          <Link to="/betrieb">
            <Icon name="zurueck" size={16} /> Betrieb
          </Link>
          <span className="mm-brotkrumen-trenner" aria-hidden>
            /
          </span>
          <span className="mm-brotkrumen-aktuell">{ort.kategorie.titel}</span>
        </nav>
      )}
      {ziele.length > 1 && (
        <nav className="mm-lokalnav" aria-label={ort.kategorie?.titel ?? ort.haupt.titel} style={{ gridTemplateColumns: `repeat(${ziele.length}, minmax(0, 1fr))` }}>
          {ziele.map((z) => {
            const an = ort.ziel?.id === z.id;
            return (
              <Link key={z.id} to={zielPfad(z, ich)} className={`mm-lokalnav-link ${an ? 'mm-lokalnav-link--an' : ''}`} aria-current={an ? 'page' : undefined}>
                <span className="mm-nur-desktop">{z.titel}</span>
                <span className="mm-nur-mobil">{z.kurz ?? z.titel}</span>
              </Link>
            );
          })}
        </nav>
      )}
      {ansichten.length > 1 && (
        <nav className={`mm-ansichten mm-ansichten--${ansichten.length}`} style={{ ['--n' as string]: ansichten.length }} aria-label={`Ansichten: ${ort.ziel!.titel}`}>
          {ansichten.map((a) => {
            const an = a === ort.ansicht;
            return (
              <Link key={a.titel} to={ansichtPfad(a)} className={`mm-segment ${an ? 'mm-segment--an' : ''}`} aria-current={an ? 'page' : undefined}>
                {a.titel}
              </Link>
            );
          })}
        </nav>
      )}
      {weitere.length > 0 && (
        <p className="mm-meta mm-lokal-weitere">
          Auch hier:{' '}
          {weitere.map((m, i) => (
            <span key={m.id}>
              {i > 0 && ' · '}
              <Link to={modulPfad(m)}>{m.titel}</Link>
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
