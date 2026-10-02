/**
 * App-Rahmen: genau vier feste Hauptbereiche (Heute · Aufträge · Planen · Betrieb).
 * Desktop: nur die Seitenleiste, keine Topbar. Oben darin der Betriebs-Wechsler, dann ein gemeinsames Feld „Suchen oder fragen“
 * (Suche und Macher in einem), darunter die Benachrichtigungen. Mobil: schmaler Kopf + untere Navigation. Keine Unterbäume, kein globales „Neu“,
 * kein Plus, kein Hamburger-Menü. Lokale Navigation (höchstens vier Ziele) steht im Inhaltsbereich.
 * Unter den vier Bereichen deine eigene Seitenleiste (`Seitenleiste.tsx`, nach Peak One): Module, Smart Views,
 * gemerkte Seiten und Ordner – frei eingerichtet über „+“ und „Anpassen“. Mobil im Profilmenü.
 * Die Seitenleiste lässt sich komplett einklappen (schmale Leiste nur mit Icons) und wieder ausklappen (Strg B);
 * die Wahl wird je Mitarbeiter gespeichert.
 *
 * Monteur-App (Rolle Monteur/Azubi): am Handy unten, am Desktop in der Seitenleiste genau drei Ziele –
 * Heute · Erfassen · Aufträge.
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
import { useEinstellung } from '@core/einstellungen';
import { personName } from '@core/format';
import { alleModule, modul } from '@core/modul';
import type { Mitarbeiter } from '@core/objects';
import { Auswahl, Button, Icon, IconButton, KiKugel, Meldung, ThemenIcon } from '@ui/index';
import { Personenbild } from '@ui/person';
import { useEingangsZahl } from '@modules/eingang/Eingang';
import { rueckmeldungLink } from '@modules/rueckmeldung/regeln';
import { useAbo } from '@modules/abo/stand';
import { BASIS } from '@core/basis';
import { STRUKTUR, ortVonPfad } from './struktur';
import { LokaleNavigation } from './LokaleNavigation';
import { BetriebWechsler } from './BetriebWechsler';
import { DeineLeiste, useLeistenZiele } from './Seitenleiste';
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
  const [eingeklappt, setzeEingeklappt] = useEinstellung<boolean>(`navigation.eingeklappt.${ich?.id ?? 'alle'}`, false);
  const umschalten = () => setzeEingeklappt(!eingeklappt);
  const monteur = istMonteurRolle(ich);
  const tab = monteurTab(pfad, aktiv);
  const eingang = useEingangsZahl();
  const titelMobil = monteur ? MONTEUR_TABS.find((t) => t.id === tab)!.titel : (ort?.haupt.titel ?? 'Macher OS');

  useEffect(() => {
    const taste = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      if (k === 'k') {
        e.preventDefault();
        oeffne('suche');
      } else if (k === 'b') {
        e.preventDefault();
        umschalten();
      }
    };
    window.addEventListener('keydown', taste);
    return () => window.removeEventListener('keydown', taste);
  });

  return (
    <div className={`mm-app ${eingeklappt ? 'mm-app--eingeklappt' : ''}`}>
      <a href="#inhalt" className="mm-skip">
        Zum Inhalt springen
      </a>
      <aside className="mm-sidebar" aria-label="Hauptnavigation">
        <div className="mm-leiste-kopf">
          <Link to="/heute" className="mm-logo" aria-label="Macher OS, zu Heute" title={eingeklappt ? 'Macher OS' : undefined}>
            <img className="mm-logo-zeichen" src="/os/icons/icon-192.png" alt="" width={32} height={32} />
            <span className="mm-leiste-text">
              Macher <strong>OS</strong>
            </span>
          </Link>
          <button
            type="button"
            className="mm-leiste-umschalter"
            aria-expanded={!eingeklappt}
            aria-keyshortcuts="Control+B"
            aria-label={eingeklappt ? 'Navigation ausklappen' : 'Navigation einklappen'}
            title={`${eingeklappt ? 'Navigation ausklappen' : 'Navigation einklappen'} (Strg B)`}
            onClick={umschalten}
          >
            <Icon name="leiste" />
          </button>
        </div>
        <BetriebWechsler kompakt={eingeklappt} />
        <div className="mm-leiste-werkzeuge">
          <SuchenOderFragen />
          <Glocke />
        </div>
        {/* Monteur und Azubi sehen auch am Desktop nur, was sie brauchen: dieselben drei Ziele wie in der Monteur-App */}
        <nav className="mm-nav" aria-label={monteur ? 'Monteur-App' : 'Hauptbereiche'}>
          {monteur
            ? MONTEUR_TABS.map((t) => (
                <Link
                  key={t.id}
                  to={t.pfad}
                  className={`mm-nav-haupt ${tab === t.id ? 'mm-nav-haupt--aktiv' : ''}`}
                  aria-current={tab === t.id ? 'page' : undefined}
                  title={eingeklappt ? t.titel : undefined}
                >
                  <span className="mm-nav-haupt-icon">
                    <ThemenIcon name={t.icon} size={28} />
                  </span>
                  <span className="mm-leiste-text">{t.titel}</span>
                </Link>
              ))
            : STRUKTUR.map((b) => (
                <Link
                  key={b.id}
                  to={b.pfad}
                  className={`mm-nav-haupt ${aktiv === b.id ? 'mm-nav-haupt--aktiv' : ''}`}
                  aria-current={aktiv === b.id ? 'page' : undefined}
                  title={eingeklappt ? b.titel : undefined}
                >
                  <span className="mm-nav-haupt-icon">
                    <ThemenIcon name={b.icon} size={28} />
                  </span>
                  <span className="mm-leiste-text">{b.titel}</span>
                  {b.id === 'auftraege' && <NeuZahl zahl={eingang} />}
                </Link>
              ))}
        </nav>
        {!monteur && <DeineLeiste eingeklappt={eingeklappt} />}
        <Profil oben />
      </aside>

      <div className="mm-hauptbereich">
        <header className="mm-kopf-mobil">
          <BetriebWechsler kompakt />
          <span className="mm-kopf-mobil-titel">{titelMobil}</span>
          <SuchenOderFragen kompakt />
          <Profil />
        </header>
        <main id="inhalt" className="mm-inhalt" tabIndex={-1}>
          {alleModule().map((m) => (m.leiste ? <m.leiste key={m.id} /> : null))}
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
              <ThemenIcon name={t.icon} size={28} strichGroesse={24} />
              <span>{t.titel}</span>
            </Link>
          ))}
        </nav>
      ) : (
        <nav className="mm-bottomnav" aria-label="Hauptbereiche">
          {STRUKTUR.map((b) => (
            <Link key={b.id} to={b.pfad} className={`mm-bottomnav-link ${aktiv === b.id ? 'mm-bottomnav-link--aktiv' : ''}`} aria-current={aktiv === b.id ? 'page' : undefined}>
              <span className="mm-bottomnav-icon">
                <ThemenIcon name={b.icon} size={28} strichGroesse={24} />
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

const istMac = () => typeof navigator !== 'undefined' && /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent);

/**
 * Ein Einstieg für beides: links „Suchen“ mit Lupe und Tastenkürzel, rechts die KI-Kugel. Beide öffnen dieselbe
 * KI-Leiste (Treffer in deinen Daten oder eine Frage an Macher, Strg K bzw. ⌘K).
 */
function SuchenOderFragen({ kompakt }: { kompakt?: boolean }) {
  if (kompakt)
    return (
      <button type="button" className="mm-iconbtn" aria-label="Suchen oder Macher fragen" onClick={() => oeffne('suche')}>
        <Icon name="suche" />
      </button>
    );
  const kuerzel = istMac() ? '⌘K' : 'Strg K';
  return (
    <div className="mm-leiste-suchzeile">
      <button type="button" className="mm-leiste-suche" onClick={() => oeffne('suche')} aria-keyshortcuts="Control+K Meta+K" title={`Suchen oder Macher fragen (${kuerzel})`}>
        <Icon name="suche" size={18} />
        <span className="mm-leiste-suche-text mm-leiste-text">Suchen</span>
        <kbd className="mm-leiste-kbd mm-leiste-text">{kuerzel}</kbd>
      </button>
      <button type="button" className="mm-leiste-ki" onClick={() => oeffne('suche')} aria-label="Macher fragen" title="Macher fragen">
        <KiKugel groesse={26} />
      </button>
    </div>
  );
}

function Glocke() {
  const ungelesen = useUngelesen();
  return (
    <button
      type="button"
      className="mm-leiste-zeile"
      aria-label={`Benachrichtigungen${ungelesen ? `, ${ungelesen} ungelesen` : ''}`}
      title="Benachrichtigungen"
      onClick={() => oeffne('benachrichtigungen')}
    >
      <span className="mm-nav-haupt-icon mm-glocke">
        <ThemenIcon name="glocke" size={28} />
        {ungelesen > 0 && <span className="mm-glocke-zahl">{ungelesen > 9 ? '9+' : ungelesen}</span>}
      </span>
      <span className="mm-leiste-zeile-text mm-leiste-text">Benachrichtigungen</span>
    </button>
  );
}

/** Profil: Mitarbeiter wechseln (Vorführung). Mobil zusätzlich Benachrichtigungen und Favoriten. */
function Profil({ oben }: { oben?: boolean }) {
  const ich = useIch();
  const alle = db.mitarbeiter.use((m) => m.aktiv);
  const ungelesen = useUngelesen();
  const favoriten = useLeistenZiele();
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
        <Personenbild m={ich} dekorativ />
        {oben && <span className="mm-profil-name mm-leiste-text">{personName(ich)}</span>}
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
                    {favoriten.map((z) => (
                      <Link key={z.id} to={z.pfad} onClick={() => setOffen(false)}>
                        <Icon name={z.icon} /> {z.titel}
                      </Link>
                    ))}
                    <Link to="/betrieb" onClick={() => setOffen(false)}>
                      <Icon name="stern" /> {favoriten.length ? 'Module hinzufügen' : 'Module auswählen'}
                    </Link>
                  </>
                )}
              </>
            )}
            {!istMonteurRolle(ich) && <UpgradeEintrag onWeg={() => setOffen(false)} />}
            <p className="mm-nav-titel mm-menue-titel">Du</p>
            {modul('konto') && (
              <Link to="/macher/konto" onClick={() => setOffen(false)}>
                <Icon name="schloss" /> Konto & Geräte
              </Link>
            )}
            {/* Einstellungen des Betriebs: Chef und Büro (die Monteur-App hat keine Wege dorthin) */}
            {modul('einstellungen') && !istMonteurRolle(ich) && (
              <Link to="/betrieb/einstellungen" onClick={() => setOffen(false)}>
                <Icon name="einstellungen" /> Einstellungen
              </Link>
            )}
            <p className="mm-nav-titel mm-menue-titel">Hilfe</p>
            <a href="/hilfe-center" target="_blank" rel="noreferrer" onClick={() => setOffen(false)}>
              <Icon name="info" /> Hilfe & Support
            </a>
            {modul('rueckmeldung') && (
              <Link to={rueckmeldungLink(pfad)} onClick={() => setOffen(false)}>
                <Icon name="chat" /> Rückmeldung geben
              </Link>
            )}
            <div className="mm-profil-wechsel">
              <Auswahl label="Arbeiten als" value={ich.id} onChange={(e) => (setzeIch(e.target.value), setOffen(false))} optionen={alle.map((m) => ({ wert: m.id, label: personName(m) }))} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * „Plan wählen“ im Profilmenü – nur in der kostenlosen Testphase (und im Lesemodus danach), nur für den Chef.
 * Wer einen Plan hat, sieht hier keine Werbung.
 */
function UpgradeEintrag({ onWeg }: { onWeg: () => void }) {
  const ich = useIch();
  const { zustand } = useAbo();
  if (!modul('abo') || ich?.rolle !== 'chef') return null;
  if (zustand.status !== 'test' && zustand.status !== 'lesemodus') return null;
  const rest = zustand.status === 'test' && zustand.tageUebrig != null ? `Noch ${zustand.tageUebrig} ${zustand.tageUebrig === 1 ? 'Tag' : 'Tage'} kostenlos` : 'Testphase vorbei';
  return (
    <Link to="/betrieb/abo" className="mm-menue-upgrade" onClick={onWeg}>
      <Icon name="stern" />
      <span className="mm-leiste-menue-text">
        Plan wählen
        <span className="mm-meta">{rest}</span>
      </span>
    </Link>
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
