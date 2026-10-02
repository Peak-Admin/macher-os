/**
 * App-Rahmen: 4 Hauptbereiche (Heute · Aufträge · Plan · Betrieb), Topbar mit
 * Suche / Macher fragen / Neu, mobile Navigation unten. Alles Weitere kommt aus Modulen.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { BEREICHE, alleErstellen, modulPfad, moduleIn, type Bereich } from '@core/modul';
import { oeffne } from '@core/overlay';
import { db, useDatenstand } from '@core/db';
import { setzeIch, useIch } from '@core/session';
import { initialen, personName } from '@core/format';
import { Avatar, Icon } from '@ui/index';
import './shell.css';

const BEREICH_ICON: Record<string, string> = { heute: 'heute', auftraege: 'auftraege', plan: 'plan', betrieb: 'betrieb' };

export function Shell({ children }: { children: ReactNode }) {
  const ort = useLocation();
  const aktiverBereich = ort.pathname.split('/')[1] as Bereich;
  const [menueOffen, setMenueOffen] = useState(false);
  useEffect(() => setMenueOffen(false), [ort.pathname]);

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
      <aside className={`mm-sidebar ${menueOffen ? 'mm-sidebar--offen' : ''}`} aria-label="Hauptnavigation">
        <Link to="/heute" className="mm-logo">
          <span className="mm-logo-zeichen" aria-hidden>
            M
          </span>
          <span>
            Macher <strong>OS</strong>
          </span>
        </Link>
        <nav className="mm-nav">
          {BEREICHE.map((b) => (
            <div key={b.id} className="mm-nav-gruppe">
              <NavLink to={b.pfad} className={({ isActive }) => `mm-nav-haupt ${isActive || aktiverBereich === b.id ? 'mm-nav-haupt--aktiv' : ''}`}>
                <Icon name={BEREICH_ICON[b.id]} />
                {b.titel}
              </NavLink>
              {aktiverBereich === b.id && <UnterNavigation bereich={b.id} />}
            </div>
          ))}
        </nav>
        <NutzerWechsel />
      </aside>
      {menueOffen && <div className="mm-sidebar-schleier" onClick={() => setMenueOffen(false)} />}

      <div className="mm-hauptbereich">
        <header className="mm-topbar">
          <button type="button" className="mm-iconbtn mm-nur-mobil" aria-label="Menü öffnen" onClick={() => setMenueOffen(true)}>
            <Icon name="menue" />
          </button>
          <button type="button" className="mm-topbar-suche" onClick={() => oeffne('suche')}>
            <Icon name="suche" />
            <span>Suchen</span>
            <kbd className="mm-nur-desktop">Strg K</kbd>
          </button>
          <div className="mm-topbar-aktionen">
            <button type="button" className="mm-btn mm-btn--tertiaer" onClick={() => oeffne('macher')}>
              <Icon name="macher" />
              <span className="mm-nur-desktop">Macher fragen</span>
            </button>
            <Glocke />
            <NeuMenue />
          </div>
        </header>
        <main id="inhalt" className="mm-inhalt" tabIndex={-1}>
          {children}
        </main>
      </div>

      <nav className="mm-bottomnav" aria-label="Hauptnavigation mobil">
        {BEREICHE.slice(0, 2).map((b) => (
          <BottomLink key={b.id} pfad={b.pfad} titel={b.titel} icon={BEREICH_ICON[b.id]} />
        ))}
        <button type="button" className="mm-bottomnav-plus" aria-label="Schnell erfassen" onClick={() => oeffne('schnell')}>
          <Icon name="plus" size={24} />
        </button>
        {BEREICHE.slice(2).map((b) => (
          <BottomLink key={b.id} pfad={b.pfad} titel={b.titel} icon={BEREICH_ICON[b.id]} />
        ))}
      </nav>
    </div>
  );
}

function BottomLink({ pfad, titel, icon }: { pfad: string; titel: string; icon: string }) {
  return (
    <NavLink to={pfad} className={({ isActive }) => `mm-bottomnav-link ${isActive ? 'mm-bottomnav-link--aktiv' : ''}`}>
      <Icon name={icon} />
      <span>{titel}</span>
    </NavLink>
  );
}

function UnterNavigation({ bereich }: { bereich: Bereich }) {
  const ich = useIch();
  const module = moduleIn(bereich).filter((m) => m.navigation === 'haupt' && m.routen?.length && (!m.rollen || !ich || m.rollen.includes(ich.rolle)));
  if (!module.length) return null;
  return (
    <ul className="mm-nav-unter">
      {module.map((m) => (
        <li key={m.id}>
          <NavLink to={modulPfad(m)} className={({ isActive }) => `mm-nav-unterlink ${isActive ? 'mm-nav-unterlink--aktiv' : ''}`}>
            {m.titel}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

function Glocke() {
  useDatenstand();
  const ich = useIch();
  const ungelesen = db.benachrichtigungen.where((b) => !b.gelesen && (!b.fuerMitarbeiterId || b.fuerMitarbeiterId === ich?.id)).length;
  return (
    <button type="button" className="mm-iconbtn mm-glocke" aria-label={`Benachrichtigungen${ungelesen ? `, ${ungelesen} ungelesen` : ''}`} onClick={() => oeffne('benachrichtigungen')}>
      <Icon name="glocke" />
      {ungelesen > 0 && <span className="mm-glocke-zahl">{ungelesen > 9 ? '9+' : ungelesen}</span>}
    </button>
  );
}

function NeuMenue() {
  const [offen, setOffen] = useState(false);
  const navigate = useNavigate();
  const eintraege = alleErstellen();
  return (
    <div className="mm-neu">
      <button type="button" className="mm-btn mm-btn--primaer" aria-expanded={offen} aria-haspopup="menu" onClick={() => setOffen(!offen)}>
        <Icon name="plus" />
        <span className="mm-nur-desktop">Neu</span>
      </button>
      {offen && (
        <>
          <div className="mm-schleier-unsichtbar" onClick={() => setOffen(false)} />
          <ul className="mm-menue" role="menu">
            <li>
              <button type="button" role="menuitem" onClick={() => (setOffen(false), oeffne('schnell'))}>
                <Icon name="kamera" /> Schnell erfassen
              </button>
            </li>
            {eintraege.map((e) => (
              <li key={e.label}>
                <button type="button" role="menuitem" onClick={() => (setOffen(false), navigate(e.pfad))}>
                  <Icon name="plus" /> {e.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/** Für Vorführung und Test: als anderer Mitarbeiter arbeiten (Rolle wechseln) */
function NutzerWechsel() {
  const ich = useIch();
  const alle = db.mitarbeiter.use((m) => m.aktiv);
  if (!ich) return null;
  return (
    <div className="mm-nutzer">
      <Avatar text={initialen(ich)} farbe={ich.farbe} />
      <label className="mm-nutzer-wahl">
        <span className="sr-only">Angemeldet als</span>
        <select value={ich.id} onChange={(e) => setzeIch(e.target.value)}>
          {alle.map((m) => (
            <option key={m.id} value={m.id}>
              {personName(m)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
