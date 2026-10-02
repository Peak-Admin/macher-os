/**
 * Smart View (`/ansicht/:id`): eine eigene Seite, die du dir aus denselben Bausteinen zusammenstellst wie „Heute“ –
 * z. B. „Geld“ mit offenen Rechnungen, Angeboten und Monat in Zahlen. Angelegt und benannt in deiner Seitenleiste.
 * Die Bausteine zeigen nur Verweise auf die echten Daten, nie Kopien. Gespeichert je Smart View.
 */
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDatenstand } from '@core/db';
import { useEinstellung } from '@core/einstellungen';
import { useIch } from '@core/session';
import type { Mitarbeiter } from '@core/objects';
import { Button, Eingabe, Leer } from '@ui/index';
import { HomeEditor, type EditorTexte } from './home/Editor';
import { HomeRaster } from './home/Raster';
import { normalisieren, zumSpeichern } from './home/layout';
import { erlaubteWidgets } from './home/registry';
import type { HomeLayout } from './home/typen';
import { ansichtSchluessel, useLeiste } from './favoriten';
import { aendern, finden } from './seitenleiste';
import './home/home.css';

const TEXTE: EditorTexte = {
  titel: 'Smart View einrichten',
  ort: 'dieser Ansicht',
  leer: 'Diese Ansicht ist noch leer. Zieh einen Baustein hierher oder tippe bei einem Baustein auf „Hinzufügen“.',
  tipp: 'Tipp: Stell zusammen, was du für eine Aufgabe auf einen Blick brauchst.',
  zuruecksetzen: {
    knopf: 'Alles herausnehmen',
    frage: 'Alle Bausteine herausnehmen?',
    text: 'Die Ansicht ist danach wieder leer. Der Eintrag in deiner Seitenleiste bleibt.',
    ansage: 'Alle Bausteine herausgenommen.',
  },
};

export function SmartViewSeite() {
  const { id = '' } = useParams();
  const ich = useIch();
  const { leiste } = useLeiste();
  const eintrag = finden(leiste.eintraege, id);
  if (!ich) return <Leer titel="Niemand angemeldet" text="Wähle unten im Profil, wer du bist." icon="person" />;
  if (!eintrag || eintrag.art !== 'smart')
    return (
      <div className="mm-seite">
        <Leer titel="Diese Ansicht gibt es nicht mehr" text="Vielleicht hast du sie aus deiner Seitenleiste entfernt. Leg über das Plus in der Seitenleiste eine neue an." icon="liste" />
      </div>
    );
  return <Ansicht key={`${ich.id}:${id}`} id={id} titel={eintrag.titel} ich={ich} />;
}

function Ansicht({ id, titel, ich }: { id: string; titel: string; ich: Mitarbeiter }) {
  useDatenstand(); // Rechte oder Module können sich ändern
  const defs = erlaubteWidgets(ich);
  const { aendern: leisteAendern } = useLeiste();
  const [gespeichert, setzen] = useEinstellung<HomeLayout | null>(ansichtSchluessel(id), null);
  const ids = defs.map((d) => d.id).join(',');
  const layout = useMemo(
    () => normalisieren(gespeichert ?? { widgets: [] }, defs, ich.rolle, ich.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gespeichert, ids, ich.rolle, ich.id],
  );
  const leer = !layout.widgets.some((w) => w.visible);
  // Neue Smart View: gleich im Einrichten-Modus öffnen
  const [bearbeiten, setBearbeiten] = useState(leer);
  const [name, setName] = useState(titel);

  const umbenennen = () => {
    const neu = name.trim();
    if (neu && neu !== titel) leisteAendern((l) => aendern(l, id, { titel: neu }));
    else setName(titel);
  };

  return (
    <div className={`mm-seite mm-seite--breit mm-home${bearbeiten ? ' mm-home--bearbeiten' : ''}`}>
      <header className="mm-home-kopf">
        <div>
          <p className="mm-oberzeile">Smart View</p>
          <h1 className="mm-home-gruss">{titel}</h1>
        </div>
        {!bearbeiten && (
          <Button variante="tertiaer" klein icon="einstellungen" onClick={() => setBearbeiten(true)}>
            Ansicht anpassen
          </Button>
        )}
      </header>

      {bearbeiten ? (
        <HomeEditor
          layout={layout}
          defs={defs}
          ich={ich}
          speichern={(l) => setzen(zumSpeichern(l))}
          zuruecksetzen={() => setzen({ ...zumSpeichern(layout), widgets: layout.widgets.map((w) => ({ ...w, visible: false })) })}
          fertig={() => (umbenennen(), setBearbeiten(false))}
          texte={TEXTE}
          kopf={
            <div className="mm-smartview-name">
              <Eingabe label="Name der Ansicht" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} onBlur={umbenennen} onKeyDown={(e) => e.key === 'Enter' && umbenennen()} />
            </div>
          }
        />
      ) : (
        <HomeRaster
          layout={layout}
          defs={defs}
          ich={ich}
          leer={
            <Leer
              titel="Diese Ansicht ist leer"
              text="Stell dir aus den Bausteinen zusammen, was du hier sehen willst."
              icon="liste"
              aktion={
                <Button variante="sekundaer" onClick={() => setBearbeiten(true)}>
                  Ansicht anpassen
                </Button>
              }
            />
          }
        />
      )}
    </div>
  );
}
