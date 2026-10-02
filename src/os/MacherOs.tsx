'use client';
/** Einstieg der Software (nur im Browser): Datenbank öffnen, Module laden, App zeigen. */
import { useEffect, useState } from 'react';
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/500.css';
import '@fontsource/barlow/600.css';
import '@fontsource/barlow/700.css';
import '@fontsource/barlow/800.css';
import '@fontsource/barlow/900.css';
import '@fontsource/poppins/600.css';
import './ui/base.css';
import { ladeModule } from './shell/module';
import { starteAutomationen } from './core/macher';
import { initDb, setAktuellerNutzer } from './core/db';
import { ichId } from './core/session';
import { App } from './shell/App';

let start: Promise<void> | undefined;

function starte() {
  start ??= (async () => {
    await initDb();
    ladeModule();
    setAktuellerNutzer(ichId());
    starteAutomationen();
  })();
  return start;
}

export default function MacherOs() {
  const [bereit, setBereit] = useState(false);
  const [fehler, setFehler] = useState(false);

  useEffect(() => {
    starte().then(
      () => setBereit(true),
      (e) => {
        console.error('Macher OS konnte nicht starten', e);
        setFehler(true);
      },
    );
  }, []);

  if (fehler)
    return (
      <div className="mm-start" role="alert">
        <h1>Macher OS startet nicht.</h1>
        <p>Dein Browser lässt keine lokale Datenbank zu. Prüfe, ob du im privaten Modus bist, und lade die Seite neu.</p>
      </div>
    );
  if (!bereit)
    return (
      <div className="mm-start" aria-busy="true">
        <p>Macher OS wird geladen …</p>
      </div>
    );
  return <App />;
}
