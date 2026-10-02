/**
 * App-Rahmen: genau vier feste Hauptbereiche (Heute · Aufträge · Planen · Betrieb).
 * Desktop: nur die Seitenleiste, keine Topbar. Oben darin der Betriebs-Wechsler, dann ein gemeinsames Feld „Suchen oder fragen“
 * (Suche und Macher in einem), darunter die Benachrichtigungen. Mobil: schmaler Kopf + untere Navigation. Keine Unterbäume, kein globales „Neu“,
 * kein Plus, kein Hamburger-Menü. Lokale Navigation (höchstens vier Ziele) steht im Inhaltsbereich.
 * Unter den vier Bereichen höchstens drei persönliche Favoriten (ausgewählt im Modulverzeichnis unter „Betrieb“),
 * mobil im Profilmenü.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { oeffne } from '@core/overlay';
import { db, useDatenstand, useSpeicherStatus } from '@core/db';
import { setzeIch, useIch } from '@core/session';
import { initialen, personName } from '@core/format';
import { modulPfad } from '@core/modul';
import { Avatar, Icon, Meldung } from '@ui/index';
import { STRUKTUR, ortVonPfad } from './struktur';
import { LokaleNavigation } from './LokaleNavigation';
import { BetriebWechsler } from './BetriebWechsler';
import { useFavoriten } from './favoriten';
import './shell.css';

export function Shell({ children }: { children: ReactNode }) {
  const pfad = useLocation().pathname;
  const ort = ortVonPfad(pfad);
  const aktiv = ort?.haupt.id;

  useEffect(() => {
    const taste = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        oeffne('suche');
      }
    };
    window.addEventListener('keydown', taste);
    return () => window.removeEventListener('keydown', taste);
  }, []);

  return (
    <div className="mm-app">
      <a href="#inhalt" className="mm-skip">
        Zum Inhalt springen
      </a>
      <aside className="mm-sidebar" aria-label="Hauptnavigation">
        <Link to="/heute" className="mm-logo">
          <span className="mm-logo-zeichen" aria-hidden>
            M
          </span>
          <span>
            Macher <strong>OS</strong>
          </span>
        </Link>
        <BetriebWechsler />
        <div className="mm-leiste-werkzeuge">
          <SuchenOderFragen />
          <Glocke />
        </div>
        <nav className="mm-nav" aria-label="Hauptbereiche">
          {STRUKTUR.map((b) => (
            <Link key={b.id} to={b.pfad} className={`mm-nav-haupt ${aktiv === b.id ? 'mm-nav-haupt--aktiv' : ''}`} aria-current={aktiv === b.id ? 'page' : undefined}>
              <span className="mm-nav-haupt-icon">
                <Icon name={b.icon} />
              </span>
              {b.titel}
            </Link>
          ))}
        </nav>
        <Favoriten />
        <Profil oben />
      </aside>

      <div className="mm-hauptbereich">
        <header className="mm-kopf-mobil">
          <BetriebWechsler kompakt />
          <span className="mm-kopf-mobil-titel">{ort?.haupt.titel ?? 'Macher OS'}</span>
          <SuchenOderFragen kompakt />
          <Profil />
        </header>
        <main id="inhalt" className="mm-inhalt" tabIndex={-1}>
          <SpeicherWarnung />
          {ort && <LokaleNavigation ort={ort} />}
          {children}
        </main>
      </div>

      <nav className="mm-bottomnav" aria-label="Hauptbereiche">
        {STRUKTUR.map((b) => (
          <Link key={b.id} to={b.pfad} className={`mm-bottomnav-link ${aktiv === b.id ? 'mm-bottomnav-link--aktiv' : ''}`} aria-current={aktiv === b.id ? 'page' : undefined}>
            <Icon name={b.icon} />
            <span>{b.titel}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

function useUngelesen() {
  useDatenstand();
  const ich = useIch();
  return db.benachrichtigungen.where((b) => !b.gelesen && (!b.fuerMitarbeiterId || b.fuerMitarbeiterId === ich?.id)).length;
}

/** Ein Einstieg für beides: Treffer in deinen Daten oder eine Frage an Macher (Strg K). */
function SuchenOderFragen({ kompakt }: { kompakt?: boolean }) {
  if (kompakt)
    return (
      <button type="button" className="mm-iconbtn" aria-label="Suchen oder Macher fragen" onClick={() => oeffne('suche')}>
        <Icon name="suche" />
      </button>
    );
  return (
    <button type="button" className="mm-leiste-suche" onClick={() => oeffne('suche')} aria-keyshortcuts="Control+K" title="Suchen oder Macher fragen (Strg K)">
      <Icon name="suche" size={18} />
      <span className="mm-leiste-suche-text">Suchen oder fragen</span>
    </button>
  );
}

function Glocke() {
  const ungelesen = useUngelesen();
  return (
    <button type="button" className="mm-leiste-zeile" aria-label={`Benachrichtigungen${ungelesen ? `, ${ungelesen} ungelesen` : ''}`} onClick={() => oeffne('benachrichtigungen')}>
      <span className="mm-nav-haupt-icon mm-glocke">
        <Icon name="glocke" />
        {ungelesen > 0 && <span className="mm-glocke-zahl">{ungelesen > 9 ? '9+' : ungelesen}</span>}
      </span>
      <span className="mm-leiste-zeile-text">Benachrichtigungen</span>
    </button>
  );
}

/** Profil: Mitarbeiter wechseln (Vorführung). Mobil zusätzlich Benachrichtigungen und Favoriten. */
function Profil({ oben }: { oben?: boolean }) {
  const ich = useIch();
  const alle = db.mitarbeiter.use((m) => m.aktiv);
  const ungelesen = useUngelesen();
  const favoriten = useFavoriten().module;
  const [offen, setOffen] = useState(false);
  const pfad = useLocation().pathname;
  useEffect(() => setOffen(false), [pfad]);
  if (!ich) return null;
  return (
    <div className={`mm-profil ${oben ? 'mm-profil--leiste' : ''}`}>
      <button
        type="button"
        className="mm-profil-knopf"
        aria-expanded={offen}
        aria-haspopup="true"
        aria-label={`Profil von ${personName(ich)}${ungelesen && !oben ? `, ${ungelesen} ungelesene Benachrichtigungen` : ''}`}
        onClick={() => setOffen(!offen)}
      >
        <Avatar text={initialen(ich)} farbe={ich.farbe} />
        {oben && <span className="mm-profil-name">{personName(ich)}</span>}
        {!oben && ungelesen > 0 && <span className="mm-glocke-zahl">{ungelesen > 9 ? '9+' : ungelesen}</span>}
      </button>
      {offen && (
        <>
          <div className="mm-schleier-unsichtbar" onClick={() => setOffen(false)} />
          <div className={`mm-menue ${oben ? 'mm-menue--oben' : ''}`}>
            {!oben && (
              <>
                <button type="button" onClick={() => (setOffen(false), oeffne('benachrichtigungen'))}>
                  <Icon name="glocke" /> Benachrichtigungen{ungelesen ? ` (${ungelesen})` : ''}
                </button>
                <p className="mm-nav-titel mm-menue-titel">Favoriten</p>
                {favoriten.map((m) => (
                  <Link key={m.id} to={modulPfad(m)} onClick={() => setOffen(false)}>
                    <Icon name={m.icon ?? 'stern'} /> {m.titel}
                  </Link>
                ))}
                <Link to="/betrieb" onClick={() => setOffen(false)}>
                  <Icon name="stern" /> {favoriten.length ? 'Favoriten ändern' : 'Favoriten auswählen'}
                </Link>
              </>
            )}
            <label className="mm-profil-wechsel">
              <span className="mm-meta">Arbeiten als</span>
              <select value={ich.id} onChange={(e) => (setzeIch(e.target.value), setOffen(false))}>
                {alle.map((m) => (
                  <option key={m.id} value={m.id}>
                    {personName(m)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </>
      )}
    </div>
  );
}

/** Höchstens drei persönliche Abkürzungen – flach, ein Klick. Auswahl im Modulverzeichnis unter „Betrieb“. */
function Favoriten() {
  const { module } = useFavoriten();
  const pfad = useLocation().pathname;
  return (
    <nav className="mm-nav-favoriten" aria-label="Favoriten">
      <h2 className="mm-nav-titel">Favoriten</h2>
      {module.length ? (
        <ul className="mm-nav-liste">
          {module.map((m) => {
            const ziel = modulPfad(m);
            const an = pfad === ziel || pfad.startsWith(`${ziel}/`);
            return (
              <li key={m.id}>
                <Link to={ziel} className={`mm-nav-favorit ${an ? 'mm-nav-favorit--an' : ''}`} aria-current={an ? 'page' : undefined}>
                  <Icon name={m.icon ?? 'stern'} size={18} />
                  <span>{m.titel}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mm-nav-leer">
          Markiere bis zu drei Module unter <Link to="/betrieb">Betrieb</Link> mit dem Stern.
        </p>
      )}
    </nav>
  );
}

function SpeicherWarnung() {
  const s = useSpeicherStatus();
  if (!s.fehler) return null;
  return (
    <div style={{ maxWidth: 1120, margin: '0 auto 24px' }}>
      <Meldung ton="achtung" titel="Nicht gespeichert">
        {s.fehler} Sichere deine Daten unter Betrieb › Unternehmen › Einstellungen und lösche nicht mehr benötigte Fotos oder Dateien.
      </Meldung>
    </div>
  );
}
