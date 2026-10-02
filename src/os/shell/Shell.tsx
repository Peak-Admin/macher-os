/**
 * App-Rahmen: genau vier feste Hauptbereiche (Heute · Aufträge · Planen · Betrieb).
 * Desktop: nur die Seitenleiste, keine Topbar. Oben darin ein gemeinsames Feld „Suchen oder fragen“
 * (Suche und Macher in einem), darunter die Benachrichtigungen. Mobil: schmaler Kopf + untere Navigation. Keine Unterbäume, kein globales „Neu“,
 * kein Plus, kein Hamburger-Menü. Lokale Navigation (höchstens vier Ziele) steht im Inhaltsbereich.
 * Unter den vier Bereichen höchstens drei persönliche Favoriten (ausgewählt im Modulverzeichnis unter „Betrieb“),
 * mobil im Profilmenü.
 *
 * Monteur-App (Rolle Monteur/Azubi, Handy): unten genau drei Tabs – Heute · Erfassen · Aufträge.
 * Kein Geld, keine Planung anderer, keine Betrieb-Einstellungen. Chef und Büro sehen am Bereich „Aufträge“
 * die Zahl der neuen Einträge im Eingang.
 *
 * Außerdem hier: PWA (Service Worker registrieren, Installieren-Hinweis) und Offline-Hinweis.
 */
import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { oeffne } from '@core/overlay';
import { db, useDatenstand, useSpeicherStatus } from '@core/db';
import { setzeIch, useIch } from '@core/session';
import { initialen, personName } from '@core/format';
import { modulPfad } from '@core/modul';
import type { Mitarbeiter } from '@core/objects';
import { Avatar, Button, Icon, IconButton, Meldung } from '@ui/index';
import { useEingangsZahl } from '@modules/eingang/Eingang';
import { BASIS } from '@core/basis';
import { STRUKTUR, ortVonPfad } from './struktur';
import { LokaleNavigation } from './LokaleNavigation';
import { useFavoriten } from './favoriten';
import './shell.css';

/** Monteur und Azubi bekommen am Handy die schlanke Monteur-App */
export const istMonteurRolle = (m: Pick<Mitarbeiter, 'rolle'> | undefined) => m?.rolle === 'monteur' || m?.rolle === 'azubi';

export const MONTEUR_TABS = [
  { id: 'heute', titel: 'Heute', pfad: '/heute', icon: 'heute' },
  { id: 'erfassen', titel: 'Erfassen', pfad: '/erfassen', icon: 'kamera' },
  { id: 'auftraege', titel: 'Aufträge', pfad: '/auftraege', icon: 'auftraege' },
] as const;

export function monteurTab(pfad: string, hauptId: string | undefined): (typeof MONTEUR_TABS)[number]['id'] {
  if (pfad === '/erfassen' || pfad.startsWith('/erfassen/')) return 'erfassen';
  return hauptId === 'auftraege' ? 'auftraege' : 'heute';
}

export function Shell({ children }: { children: ReactNode }) {
  const pfad = useLocation().pathname;
  const ort = ortVonPfad(pfad);
  const aktiv = ort?.haupt.id;
  const ich = useIch();
  const monteur = istMonteurRolle(ich);
  const tab = monteurTab(pfad, aktiv);
  const eingang = useEingangsZahl();
  const titelMobil = monteur ? MONTEUR_TABS.find((t) => t.id === tab)!.titel : (ort?.haupt.titel ?? 'Macher OS');

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
              {b.id === 'auftraege' && <NeuZahl zahl={eingang} />}
            </Link>
          ))}
        </nav>
        <Favoriten />
        <Profil oben />
      </aside>

      <div className="mm-hauptbereich">
        <header className="mm-kopf-mobil">
          <span className="mm-kopf-mobil-titel">{titelMobil}</span>
          <SuchenOderFragen kompakt />
          <Profil />
        </header>
        <main id="inhalt" className="mm-inhalt" tabIndex={-1}>
          <OfflineHinweis />
          <InstallHinweis />
          <SpeicherWarnung />
          {ort && <LokaleNavigation ort={ort} />}
          {children}
        </main>
      </div>

      {monteur ? (
        <nav className="mm-bottomnav mm-bottomnav--monteur" aria-label="Monteur-App">
          {MONTEUR_TABS.map((t) => (
            <Link key={t.id} to={t.pfad} className={`mm-bottomnav-link ${tab === t.id ? 'mm-bottomnav-link--aktiv' : ''}`} aria-current={tab === t.id ? 'page' : undefined}>
              <Icon name={t.icon} />
              <span>{t.titel}</span>
            </Link>
          ))}
        </nav>
      ) : (
        <nav className="mm-bottomnav" aria-label="Hauptbereiche">
          {STRUKTUR.map((b) => (
            <Link key={b.id} to={b.pfad} className={`mm-bottomnav-link ${aktiv === b.id ? 'mm-bottomnav-link--aktiv' : ''}`} aria-current={aktiv === b.id ? 'page' : undefined}>
              <span className="mm-bottomnav-icon">
                <Icon name={b.icon} />
                {b.id === 'auftraege' && <NeuZahl zahl={eingang} klein />}
              </span>
              <span>{b.titel}</span>
            </Link>
          ))}
        </nav>
      )}
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
                {/* Monteur-App: keine Wege in Betrieb-Einstellungen */}
                {!istMonteurRolle(ich) && (
                  <>
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

/** Zahl neuer Einträge im Eingang am Bereich „Aufträge“ (nur Chef/Büro) */
function NeuZahl({ zahl, klein }: { zahl: number; klein?: boolean }) {
  if (!zahl) return null;
  return (
    <span className={`mm-nav-zahl ${klein ? 'mm-nav-zahl--klein' : ''}`} aria-label={`${zahl} neu im Eingang`}>
      {zahl > 9 ? '9+' : zahl}
    </span>
  );
}

// ------------------------------------------------------------------ Offline

function onlineAbo(f: () => void) {
  window.addEventListener('online', f);
  window.addEventListener('offline', f);
  return () => {
    window.removeEventListener('online', f);
    window.removeEventListener('offline', f);
  };
}

export function useOnline(): boolean {
  return useSyncExternalStore(
    onlineAbo,
    () => navigator.onLine,
    () => true,
  );
}

function OfflineHinweis() {
  const online = useOnline();
  if (online) return null;
  return (
    <div className="mm-offline" role="status">
      <Meldung ton="achtung" titel="Kein Netz">
        Du kannst weiterarbeiten – was du erfasst, bleibt auf diesem Gerät gespeichert.
      </Meldung>
    </div>
  );
}

// ------------------------------------------------------------------ PWA: Service Worker und Installieren

interface InstallEreignis extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let installEreignis: InstallEreignis | undefined;
const installHoerer = new Set<() => void>();
const INSTALL_AUS = 'macher-os:installieren-aus';

/** Einmal beim Start: Service Worker registrieren (nur im Build) und den Installieren-Moment merken */
export function pwaStarten() {
  if (typeof window === 'undefined') return;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installEreignis = e as InstallEreignis;
    installHoerer.forEach((f) => f());
  });
  window.addEventListener('appinstalled', () => {
    installAus();
    installEreignis = undefined;
    installHoerer.forEach((f) => f());
  });
  if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
  const registrieren = () =>
    navigator.serviceWorker
      .register(`${BASIS}/sw.js`, { scope: `${BASIS}/` })
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => {
        // Was beim ersten Besuch schon geladen war (Skripte, Schriften), gleich offline vorhalten
        const urls = performance.getEntriesByType('resource').map((r) => r.name);
        reg.active?.postMessage({ typ: 'merken', urls: [...urls, location.pathname] });
      })
      .catch(() => {
        /* ohne Service Worker geht alles weiter – nur nicht offline */
      });
  if (document.readyState === 'complete') void registrieren();
  else window.addEventListener('load', () => void registrieren(), { once: true });
}

function installAus() {
  try {
    localStorage.setItem(INSTALL_AUS, new Date().toISOString());
  } catch {
    /* egal */
  }
}

function installAusGesetzt() {
  try {
    return !!localStorage.getItem(INSTALL_AUS);
  } catch {
    return true;
  }
}

const istStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
const istIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);

/** Einmal, schließbar: „Macher OS aufs Handy holen“ – nur am Handy und nur, wenn es noch nicht installiert ist */
function InstallHinweis() {
  const [, neu] = useState(0);
  const [aus, setAus] = useState(installAusGesetzt);
  useEffect(() => {
    const f = () => neu((n) => n + 1);
    installHoerer.add(f);
    return () => void installHoerer.delete(f);
  }, []);
  const handy = window.matchMedia?.('(max-width: 1023px)').matches;
  if (aus || !handy || istStandalone() || (!installEreignis && !istIos())) return null;
  const schliessen = () => (installAus(), setAus(true));
  const installieren = async () => {
    if (!installEreignis) return;
    await installEreignis.prompt();
    await installEreignis.userChoice.catch(() => undefined);
    schliessen();
  };
  return (
    <section className="mm-installieren" aria-label="Macher OS installieren">
      <div className="mm-installieren-kopf">
        <strong>Macher OS aufs Handy holen</strong>
        <IconButton icon="x" label="Hinweis schließen" onClick={schliessen} />
      </div>
      <p>
        {installEreignis
          ? 'Einmal installieren – dann startet Macher OS wie eine App vom Startbildschirm und funktioniert auch ohne Netz.'
          : 'Tippe unten auf „Teilen“ und dann auf „Zum Home-Bildschirm“ – dann startet Macher OS wie eine App.'}
      </p>
      {installEreignis && (
        <div>
          <Button klein variante="sekundaer" icon="download" onClick={installieren}>
            Installieren
          </Button>
        </div>
      )}
    </section>
  );
}
