import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
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
import { alleModule, registriereModule } from './core/modul';
import { ichId } from './core/session';
import { konfigAusUmgebung, starteCloud } from './core/cloud-supabase';
import kontoModul from './modules/konto/modul';
import { App } from './shell/App';

async function start() {
  await initDb();
  ladeModule();
  // Backend nur mit Schlüsseln: dann Konto-Modul + Supabase-Cloud. Ohne Schlüssel bleibt alles lokal wie bisher.
  const cloudKonfig = konfigAusUmgebung();
  if (cloudKonfig) {
    registriereModule([...alleModule(), kontoModul]);
    void starteCloud(cloudKonfig);
  }
  setAktuellerNutzer(ichId());
  starteAutomationen();
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void start();
