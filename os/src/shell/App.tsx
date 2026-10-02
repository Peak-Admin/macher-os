import { Navigate, Route, Routes, BrowserRouter } from 'react-router-dom';
import { alleModule, modulPfad } from '@core/modul';
import { db } from '@core/db';
import { ToastProvider } from '@ui/index';
import { Shell } from './Shell';
import { Hub } from './Hub';
import { Erststart } from './Erststart';
import { NichtGefunden } from './NichtGefunden';

export function App() {
  const betrieb = db.betrieb.useOne('betrieb');
  const module = alleModule();
  const eingerichtet = !!betrieb?.onboardingFertig;
  const vollbild = module.flatMap((m) => m.vollbildRouten ?? []);
  const hatOnboarding = vollbild.some((r) => r.pfad === '/willkommen');

  return (
    <BrowserRouter>
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
                    <Route path="/heute" element={<Hub bereich="heute" />} />
                    <Route path="/auftraege" element={<Hub bereich="auftraege" />} />
                    <Route path="/plan" element={<Hub bereich="plan" />} />
                    <Route path="/betrieb" element={<Hub bereich="betrieb" />} />
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
