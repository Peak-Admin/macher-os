/**
 * Heute – das Home von Macher OS. Ruhig und persönlich statt Kennzahlen-Wand:
 * Begrüßung, höchstens eine Ankündigung, standardmäßig vier Widgets in zwei Spalten
 * (Dein nächster Schritt · Dein Ansprechpartner · Deine Arbeit · Neu für dich).
 * Über „Home anpassen“ stellt sich jeder sein Home aus der Widget-Bibliothek selbst zusammen.
 */
import { useEffect, useState } from 'react';
import { useIch } from '@core/session';
import { Button, Leer } from '@ui/index';
import { AnkuendigungBanner } from './Banner';
import { HomeEditor } from './Editor';
import { homeMessen } from './messen';
import { HomeRaster } from './Raster';
import { useHomeLayout } from './useHomeLayout';
import './home.css';

const tagFormat = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });

export function HomeSeite() {
  const ich = useIch();
  if (!ich) return <Leer titel="Niemand angemeldet" text="Wähle oben rechts im Profil, wer du bist." icon="person" />;
  return <Home key={ich.id} ich={ich} />;
}

function Home({ ich }: { ich: NonNullable<ReturnType<typeof useIch>> }) {
  const { defs, layout, speichern, zuruecksetzen } = useHomeLayout(ich);
  const [bearbeiten, setBearbeiten] = useState(false);

  useEffect(() => {
    homeMessen('home_viewed', { rolle: ich.rolle, widgets: layout.widgets.filter((w) => w.visible).length, angepasst: !!layout.angepasst });
    // nur einmal je Aufruf
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`mm-seite mm-seite--breit mm-home${bearbeiten ? ' mm-home--bearbeiten' : ''}`}>
      {!bearbeiten && <AnkuendigungBanner ich={ich} />}
      <header className="mm-home-kopf">
        <div>
          <h1 className="mm-home-gruss">
            Servus, {ich.vorname} <span aria-hidden>👋</span>
          </h1>
          <p className="mm-home-untertitel">
            Hier ist das Wichtigste für dich. <span className="mm-home-datum">{tagFormat.format(new Date())}</span>
          </p>
        </div>
        {!bearbeiten && (
          <Button
            variante="tertiaer"
            klein
            icon="einstellungen"
            onClick={() => {
              setBearbeiten(true);
              homeMessen('home_customize_opened');
            }}
          >
            Home anpassen
          </Button>
        )}
      </header>

      {bearbeiten ? (
        <HomeEditor layout={layout} defs={defs} ich={ich} speichern={speichern} zuruecksetzen={zuruecksetzen} fertig={() => setBearbeiten(false)} />
      ) : (
        <HomeRaster
          layout={layout}
          defs={defs}
          ich={ich}
          leer={
            <Leer
              titel="Dein Home ist leer"
              text="Du hast alle Widgets ausgeblendet. Hol dir zurück, was dir hilft."
              icon="heute"
              aktion={
                <Button variante="sekundaer" onClick={() => setBearbeiten(true)}>
                  Home anpassen
                </Button>
              }
            />
          }
        />
      )}
    </div>
  );
}
