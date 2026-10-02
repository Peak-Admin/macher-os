/**
 * App-Rahmen: genau vier feste Hauptbereiche (Heute · Aufträge · Planen · Betrieb).
 * Desktop: schmale Seitenleiste, mobil: untere Navigation. Keine Unterbäume, kein globales „Neu“,
 * kein Plus, kein Hamburger-Menü. Lokale Navigation (höchstens vier Ziele) steht im Inhaltsbereich.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { oeffne } from '@core/overlay';
import { db, useDatenstand, useSpeicherStatus } from '@core/db';
import { setzeIch, useIch } from '@core/session';
import { initialen, personName } from '@core/format';
import { Avatar, Icon, Meldung } from '@ui/index';
import { STRUKTUR, ortVonPfad } from './struktur';
import { LokaleNavigation } from './LokaleNavigation';
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
        <nav className="mm-nav" aria-label="Hauptbereiche">
          {STRUKTUR.map((b) => (
            <Link key={b.id} to={b.pfad} className={`mm-nav-haupt ${aktiv === b.id ? 'mm-nav-haupt--aktiv' : ''}`} aria-current={aktiv === b.id ? 'page' : undefined}>
              <Icon name={b.icon} />
              {b.titel}
            </Link>
          ))}
        </nav>
        <Profil oben />
      </aside>

      <div className="mm-hauptbereich">
        <header className="mm-topbar">
          <span className="mm-topbar-titel mm-nur-mobil">{ort?.haupt.titel ?? 'Macher OS'}</span>
          <button type="button" className="mm-topbar-suche" onClick={() => oeffne('suche')} aria-label="Suchen">
            <Icon name="suche" />
            <span className="mm-nur-desktop">Suchen</span>
            <kbd className="mm-nur-desktop">Strg K</kbd>
          </button>
          <div className="mm-topbar-aktionen">
            <button type="button" className="mm-btn mm-btn--tertiaer mm-nur-desktop" onClick={() => oeffne('macher')}>
              <Icon name="macher" />
              <span>Macher fragen</span>
            </button>
            <span className="mm-nur-desktop">
              <Glocke />
            </span>
            <span className="mm-nur-mobil">
              <Profil />
            </span>
          </div>
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

function Glocke() {
  const ungelesen = useUngelesen();
  return (
    <button type="button" className="mm-iconbtn mm-glocke" aria-label={`Benachrichtigungen${ungelesen ? `, ${ungelesen} ungelesen` : ''}`} onClick={() => oeffne('benachrichtigungen')}>
      <Icon name="glocke" />
      {ungelesen > 0 && <span className="mm-glocke-zahl">{ungelesen > 9 ? '9+' : ungelesen}</span>}
    </button>
  );
}

/** Zurückhaltender Utility-Zugang: Benachrichtigungen, Macher fragen, Mitarbeiter wechseln (Vorführung) */
function Profil({ oben }: { oben?: boolean }) {
  const ich = useIch();
  const alle = db.mitarbeiter.use((m) => m.aktiv);
  const ungelesen = useUngelesen();
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
                <button type="button" onClick={() => (setOffen(false), oeffne('macher'))}>
                  <Icon name="macher" /> Macher fragen
                </button>
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
