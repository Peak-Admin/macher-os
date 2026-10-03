import { Link } from 'react-router-dom';
import { db } from '@core/db';
import { personName } from '@core/format';
import type { Betriebsmittel } from '@core/objects';
import { BeispielMarke, DateiKnopf, Icon, useToast } from '@ui/index';
import { Personenbild, titelbild, titelbildSetzen } from '../mitarbeiter/profilbild';
import { AMPEL_LABEL, lageVon, type Ampel } from './daten';
import './fahrzeuge.css';

export const FAHRZEUGBILD = 'fahrzeugbild';

export const fahrzeugbild = (f: Betriebsmittel) => titelbild({ typ: 'betriebsmittel', id: f.id }, FAHRZEUGBILD)?.url;

/** „Black Toyota Corolla“ – Hersteller nur, wenn er nicht schon im Namen steht */
export function modellText(f: Betriebsmittel): string {
  const h = f.hersteller?.trim();
  return h && !f.name.toLowerCase().includes(h.toLowerCase()) ? `${h} ${f.name}` : f.name;
}

/** Mini-Ampel: drei Lichter, eins leuchtet. Die Bedeutung steht immer daneben als Text. */
export function AmpelLicht({ ampel }: { ampel: Ampel }) {
  return (
    <span className="fz-ampel" aria-hidden>
      {(['gesperrt', 'belegt', 'frei'] as Ampel[]).map((a) => (
        <span key={a} className={`fz-licht fz-licht--${a}${a === ampel ? ' fz-licht--an' : ''}`} />
      ))}
    </span>
  );
}

/** Seitenansicht als Platzhalter, solange kein Foto da ist – kein Stockfoto */
function AutoSilhouette() {
  return (
    <svg className="fz-silhouette" viewBox="0 0 160 64" aria-hidden>
      <path className="fz-silhouette-karosserie" d="M8 44c0-6 4-10 12-11l24-3 18-14c4-3 8-4 14-4h42c6 0 10 2 13 6l11 13c8 1 12 5 12 11v4c0 2-2 4-4 4H11c-2 0-3-1-3-3z" />
      <path className="fz-silhouette-scheibe" d="M66 18 56 30h40V16H76c-5 0-8 0-10 2zM100 16v14h36l-10-12c-2-2-4-2-8-2z" />
      <circle className="fz-silhouette-rad" cx="38" cy="50" r="10" />
      <circle className="fz-silhouette-felge" cx="38" cy="50" r="4" />
      <circle className="fz-silhouette-rad" cx="126" cy="50" r="10" />
      <circle className="fz-silhouette-felge" cx="126" cy="50" r="4" />
    </svg>
  );
}

export function FahrzeugBild({ f }: { f: Betriebsmittel }) {
  const url = fahrzeugbild(f);
  return url ? <img className="fz-foto" src={url} alt={modellText(f)} /> : <AutoSilhouette />;
}

/**
 * Fahrzeugkarte wie bei Fahrdiensten: links Fahrer + Auto, rechts Kennzeichen, Modell und Ampel.
 * `to` gesetzt → ganze Karte ist ein Link.
 */
export function FahrzeugKarte({ f, to, jetzt }: { f: Betriebsmittel; to?: string; jetzt?: Date }) {
  const fahrer = f.mitarbeiterId ? db.mitarbeiter.get(f.mitarbeiterId) : undefined;
  const lage = lageVon(f, jetzt);
  const inhalt = (
    <>
      <div className="fz-links">
        <div className="fz-bildflaeche">
          <span className="fz-person">
            {fahrer ? (
              <Personenbild m={fahrer} groesse={64} />
            ) : (
              <span className="fz-person-leer">
                <Icon name="person" size={24} />
              </span>
            )}
          </span>
          <span className="fz-auto">
            <FahrzeugBild f={f} />
          </span>
        </div>
        <span className="fz-fahrer">{fahrer ? personName(fahrer) : 'Kein Fahrer'}</span>
      </div>
      <div className="fz-rechts">
        {f.kennzeichen ? <span className="fz-kennzeichen">{f.kennzeichen}</span> : <span className="fz-kennzeichen fz-kennzeichen--leer">Ohne Kennzeichen</span>}
        <span className="fz-modell">
          {modellText(f)} <BeispielMarke zeigen={f.beispiel} />
        </span>
        <span className={`fz-status fz-status--${lage.ampel}`} data-tipp={`Ampel ${AMPEL_LABEL[lage.ampel]}`}>
          <AmpelLicht ampel={lage.ampel} />
          {lage.text}
        </span>
        {lage.info && <span className="fz-info">{lage.info}</span>}
      </div>
    </>
  );
  return to ? (
    <Link to={to} className="fz-karte fz-karte--klickbar">
      {inhalt}
    </Link>
  ) : (
    <div className="fz-karte">{inhalt}</div>
  );
}

export function FahrzeugbildKnopf({ f }: { f: Betriebsmittel }) {
  const toast = useToast();
  db.dokumente.use();
  return (
    <DateiKnopf
      accept="image/*"
      klein
      variante="tertiaer"
      onDateien={async ([d]) => {
        try {
          await titelbildSetzen({ typ: 'betriebsmittel', id: f.id }, FAHRZEUGBILD, d, `Foto ${modellText(f)}`);
          toast('Foto gespeichert.');
        } catch (e) {
          toast(e instanceof Error ? e.message : 'Das Bild ließ sich nicht laden.', { ton: 'achtung' });
        }
      }}
    >
      {fahrzeugbild(f) ? 'Foto ändern' : 'Foto hinzufügen'}
    </DateiKnopf>
  );
}
