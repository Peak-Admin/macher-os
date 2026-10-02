import { Navigate, Route, Routes, BrowserRouter } from 'react-router-dom';
import { BASIS } from '@core/basis';
import { alleModule, modulPfad } from '@core/modul';
import { db } from '@core/db';
import { ToastProvider } from '@ui/index';
import { Shell, pwaStarten } from './Shell';
import { HomeSeite } from './home/HomeSeite';
import { BetriebSeite, KategorieWeiter } from './Betrieb';
import { BereichWeiter } from './BereichWeiter';
import { Erststart } from './Erststart';
import { NichtGefunden } from './NichtGefunden';

// PWA: Service Worker und Installieren-Moment – einmal je Seitenaufruf, auch für Kundenbereich und Terminbuchung
pwaStarten();

export function App() {
  const betrieb = db.betrieb.useOne('betrieb');
  const module = alleModule();
  const eingerichtet = !!betrieb?.onboardingFertig;
  const vollbild = module.flatMap((m) => m.vollbildRouten ?? []);
  const hatOnboarding = vollbild.some((r) => r.pfad === '/willkommen');

  return (
    <BrowserRouter basename={BASIS}>
      <ToastProvider>
        <Routes>
          {vollbild.map((r) => (
            <Route key={r.pfad} path={r.pfad} element={<r.element />} />
          ))}
          {!hatOnboarding && <Route path="/willkommen" element={<Erststart />} />}
          <Route
            path="*"
            element={
              !eingerichtet ? (
                <Navigate to="/willkommen" replace />
              ) : (
                <Shell>
                  <Routes>
                    <Route path="/" element={<Navigate to="/heute" replace />} />
                    <Route path="/heute" element={<HomeSeite />} />
                    {/* Aufträge und Planen öffnen direkt ihre Standardansicht – keine Auswahlseite davor */}
                    <Route path="/auftraege" element={<BereichWeiter bereich="auftraege" />} />
                    <Route path="/plan" element={<BereichWeiter bereich="plan" />} />
                    <Route path="/betrieb" element={<BetriebSeite />} />
                    <Route path="/betrieb/module" element={<Navigate to="/betrieb" replace />} />
                    <Route path="/betrieb/:kategorie" element={<KategorieWeiter />} />
                    {/* frühere Macher-Leiste: führt jetzt an den neuen Ort */}
                    <Route path="/macher" element={<Navigate to="/heute/braucht-dich" replace />} />
                    {module.flatMap((m) =>
                      (m.routen ?? []).map((r) => {
                        const pfad = r.pfad.startsWith('/') ? r.pfad : modulPfad(m, r.pfad);
                        return <Route key={`${m.id}:${pfad}`} path={pfad} element={<r.element />} />;
                      }),
                    )}
                    <Route path="*" element={<NichtGefunden />} />
                  </Routes>
                  {module.map((m) => (m.global ? <m.global key={m.id} /> : null))}
                </Shell>
              )
            }
          />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
