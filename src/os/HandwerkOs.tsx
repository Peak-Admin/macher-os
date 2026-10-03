'use client';
/** Einstieg der Software (nur im Browser): Datenbank öffnen, Module laden, App zeigen. */
import { useEffect, useState } from 'react';
import './ui/base.css';
import { ladeModule } from './shell/module';
import { starteAutomationen } from './core/macher';
import { initDb, setAktuellerNutzer } from './core/db';
import { ichId } from './core/session';
import { starteCloud } from './core/cloud-supabase';
import { App } from './shell/App';

let start: Promise<void> | undefined;

function starte() {
  start ??= (async () => {
    await initDb();
    ladeModule();
    // Backend nur mit Schlüsseln (NEXT_PUBLIC_SUPABASE_*): Supabase-Cloud + Messung an den Server.
    // Ohne Schlüssel passiert nichts – die App bleibt lokal im Browser.
    void starteCloud();
    setAktuellerNutzer(ichId());
    starteAutomationen();
  })();
  return start;
}

export default function HandwerkOs() {
  const [bereit, setBereit] = useState(false);
  const [fehler, setFehler] = useState(false);

  useEffect(() => {
    // Der Markenauftakt (src/components/auftakt) wartet auf dieses Signal – auch im Fehlerfall, damit die Meldung sichtbar wird.
    const melden = () => {
      document.documentElement.dataset.osBereit = 'ja';
      window.dispatchEvent(new Event('macher-os:bereit')); // = OS_BEREIT_EREIGNIS
    };
    starte().then(
      () => {
        setBereit(true);
        melden();
      },
      (e) => {
        console.error('Handwerk OS konnte nicht starten', e);
        setFehler(true);
        melden();
      },
    );
  }, []);

  if (fehler)
    return (
      <div className="mm-start" role="alert">
        <h1>Handwerk OS startet nicht.</h1>
        <p>Dein Browser lässt keine lokale Datenbank zu. Prüfe, ob du im privaten Modus bist, und lade die Seite neu.</p>
      </div>
    );
  if (!bereit)
    return (
      <div className="mm-start" aria-busy="true">
        <p>Handwerk OS wird geladen …</p>
      </div>
    );
  return <App />;
}
