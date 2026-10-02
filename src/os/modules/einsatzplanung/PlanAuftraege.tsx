/**
 * Gruppe „Aufträge“ über der Plantafel: Zeitraum je Auftrag als Balken auf derselben Zeitachse wie das Team.
 * Die Balken werden aus den Terminen abgeleitet (`auftragsBalken`) – am Auftrag wird nichts gespeichert.
 * Rendert Zellen direkt in das Raster der Plantafel (gleiche Spalten).
 */
import { Component, useDeferredValue, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { datumKurz } from '@core/format';
import { pfadZu } from '@core/modul';
import type { Datum, ID } from '@core/objects';
import { Button, Icon, Laden, Meldung, Status } from '@ui/index';
import { auftragsBalken, type AuftragsBalken } from './daten';
import './plantafel.css';

/** Wie viele Aufträge ohne Termin sofort sichtbar sind – der Rest auf Knopfdruck */
const OHNE_TERMIN_SICHTBAR = 5;

const tagKurz = (d: Datum) => datumKurz(d).split(', ')[1] ?? datumKurz(d);
export const zeitraumText = (b: Pick<AuftragsBalken, 'start' | 'ende'>) =>
  !b.start || !b.ende ? 'Noch kein Termin' : b.start === b.ende ? tagKurz(b.start) : `${tagKurz(b.start)} – ${tagKurz(b.ende)}`;

/** Kopfzeile einer Gruppe – per Knopf ein- und ausklappbar */
export function GruppenKopf({ titel, anzahl, offen, onUmschalten, id }: { titel: string; anzahl?: number; offen: boolean; onUmschalten: () => void; id: string }) {
  return (
    <div className="ep-gruppe" id={id}>
      <button type="button" className="ep-gruppe-knopf" aria-expanded={offen} onClick={onUmschalten}>
        <Icon name={offen ? 'runter' : 'weiter'} size={20} aria-hidden />
        <span>{titel}</span>
        {anzahl != null && <span className="ep-gruppe-zahl">{anzahl}</span>}
        <span className="sr-only">{offen ? '– einklappen' : '– ausklappen'}</span>
      </button>
    </div>
  );
}

/** Eine Zeile, die über die ganze Breite der Plantafel geht (Leer-, Lade-, Fehlerzustand) */
function BreiteZeile({ children }: { children: ReactNode }) {
  return (
    <div className="ep-breit">
      <div className="ep-breit-inhalt">{children}</div>
    </div>
  );
}

interface Props {
  /** sichtbare Tage – dieselben Spalten wie beim Team */
  tage: Datum[];
  /** Aufträge, die beauftragt sind, aber noch keinen Termin haben (aus `offenEinzuplanen`) */
  ohneTermin: ID[];
  markiert?: ID;
  onMarkieren: (id: ID | undefined) => void;
  darfPlanen: boolean;
  onEinplanen: (id: ID) => void;
}

/** Zeilen der Gruppe „Aufträge“ – mit Lade- und Leerzustand */
export function AuftragsZeilen({ tage, ohneTermin, markiert, onMarkieren, darfPlanen, onEinplanen }: Props) {
  useDatenstand();
  const schluessel = tage.join();
  // Beim Wochenwechsel rechnet React im Hintergrund – solange zeigen wir „Wird geladen“ statt alter Balken.
  const berechnetFuer = useDeferredValue(schluessel);
  const [alleOhne, setAlleOhne] = useState(false);
  const zeilen = berechnetFuer ? auftragsBalken(db.auftraege.all(), db.termine.all(), berechnetFuer.split(','), ohneTermin) : [];

  if (berechnetFuer !== schluessel) {
    return (
      <BreiteZeile>
        <Laden text="Aufträge werden geladen …" />
      </BreiteZeile>
    );
  }

  const mitBalken = zeilen.filter((z) => z.spalteVon >= 0);
  const ohne = zeilen.filter((z) => z.spalteVon < 0);
  const ohneSichtbar = alleOhne ? ohne : ohne.slice(0, OHNE_TERMIN_SICHTBAR);

  if (!zeilen.length) {
    return (
      <BreiteZeile>
        <span className="ep-leer">
          <Icon name="auftraege" size={20} aria-hidden />
          <span>
            <strong>In dieser Woche läuft kein Auftrag.</strong>{' '}
            <span className="mm-meta">
              {darfPlanen ? 'Wähl oben unter „Auftrag einplanen“ einen Auftrag aus, dann erscheint hier sein Zeitraum.' : 'Sobald Termine geplant sind, siehst du hier den Zeitraum je Auftrag.'}
            </span>
          </span>
        </span>
      </BreiteZeile>
    );
  }

  const zeile = (b: AuftragsBalken) => {
    const a = b.auftrag;
    const kunde = db.kunden.get(a.kundeId);
    const pfad = pfadZu({ typ: 'auftraege', id: a.id });
    const aktiv = markiert === a.id;
    const text = zeitraumText(b);
    return [
      <div key={`${a.id}-name`} className={`pl-tafel-name ep-auftrag-name ${aktiv ? 'ep-auftrag-name--aktiv' : ''}`}>
        {pfad ? (
          <Link to={pfad} className="ep-auftrag-link">
            {a.titel}
          </Link>
        ) : (
          <strong>{a.titel}</strong>
        )}
        <span className="mm-meta">
          {a.nummer}
          {kunde ? ` · ${kunde.name}` : ''}
        </span>
        <span className="ep-status">
          <Status ton={b.status.ton} icon={false}>
            {b.status.text}
          </Status>
          {a.dringend && <Status ton="achtung">Dringend</Status>}
        </span>
      </div>,
      <div key={`${a.id}-spur`} className="ep-spur">
        {tage.map((d, i) => (
          <span key={d} className="ep-spur-tag" style={{ gridColumn: i + 1 }} aria-hidden />
        ))}
        {b.spalteVon < 0 ? (
          <div className="ep-ohne">
            <span className="mm-meta">Noch kein Termin</span>
            {darfPlanen && (
              <Button variante="sekundaer" klein onClick={() => onEinplanen(a.id)}>
                Einplanen
              </Button>
            )}
          </div>
        ) : (
          <>
            <button
              type="button"
              className={`ep-balken ${b.beginntFrueher ? 'ep-balken--frueher' : ''} ${b.endetSpaeter ? 'ep-balken--spaeter' : ''}`}
              style={{ gridColumn: `${b.spalteVon + 1} / ${b.spalteBis + 2}` }}
              aria-pressed={aktiv}
              aria-label={`${a.titel}, ${text}: ${aktiv ? 'Hervorhebung aufheben' : 'Termine im Team hervorheben'}`}
              onClick={() => onMarkieren(aktiv ? undefined : a.id)}
            >
              {b.beginntFrueher && <Icon name="zurueck" size={16} aria-hidden />}
              <span className="ep-balken-text">{text}</span>
              {b.endetSpaeter && <Icon name="weiter" size={16} aria-hidden />}
              {aktiv && <Icon name="check" size={16} aria-hidden />}
            </button>
            {tage.map((d, i) =>
              b.proTag[d] ? (
                <span key={`${d}-n`} className="ep-tag-zahl" style={{ gridColumn: i + 1 }}>
                  {b.proTag[d] === 1 ? '1 Termin' : `${b.proTag[d]} Termine`}
                </span>
              ) : null,
            )}
          </>
        )}
      </div>,
    ];
  };

  return (
    <>
      {mitBalken.map(zeile)}
      {ohneSichtbar.map(zeile)}
      {ohne.length > OHNE_TERMIN_SICHTBAR && (
        <BreiteZeile>
          <Button variante="tertiaer" klein onClick={() => setAlleOhne(!alleOhne)}>
            {alleOhne ? 'Weniger zeigen' : `Alle ${ohne.length} Aufträge ohne Termin zeigen`}
          </Button>
        </BreiteZeile>
      )}
    </>
  );
}

/** Fehlergrenze: Geht bei den Aufträgen etwas schief, bleibt das Team darunter bedienbar. */
export class AuftragsFehlergrenze extends Component<{ children: ReactNode }, { fehler: boolean }> {
  state = { fehler: false };
  static getDerivedStateFromError() {
    return { fehler: true };
  }
  render() {
    if (!this.state.fehler) return this.props.children;
    return (
      <BreiteZeile>
        <Meldung
          ton="achtung"
          titel="Die Aufträge konnten nicht angezeigt werden."
          aktion={
            <Button variante="sekundaer" klein onClick={() => this.setState({ fehler: false })}>
              Erneut versuchen
            </Button>
          }
        >
          Dein Team darunter kannst du weiter planen.
        </Meldung>
      </BreiteZeile>
    );
  }
}
