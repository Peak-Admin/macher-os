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
import { setAktuellerNutzer } from './core/db';
import { ichId } from './core/session';
import { App } from './shell/App';

ladeModule();
setAktuellerNutzer(ichId());
starteAutomationen();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
