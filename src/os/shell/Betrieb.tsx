/**
 * Betrieb: vier Türen – Geld, Team, Ausstattung, Unternehmen.
 * Jede Kachel: Titel, kurze Erklärung, höchstens ein Hinweis. Keine Unterlisten, keine Kennzahlen davor.
 *
 * Darunter das Verzeichnis aller Module (mit Suche): Hier wählt man jedes Modul aus, auch die aus Aufträge und
 * Planen, und legt es mit dem Stern in die eigene Seitenleiste.
 */
import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { modul, modulPfad, type ModulDef } from '@core/modul';
import { useDatenstand } from '@core/db';
import { istBuero, useIch } from '@core/session';
import { Abschnitt, Icon, Leer, Seite, SkizzenKachel, Status, Suchfeld, ThemenIcon } from '@ui/index';
import { STRUKTUR, modulVerzeichnis, sichtbareAnsichten, sichtbareZiele, zielPfad, type Kategorie } from './struktur';
import { useFavoriten } from './favoriten';
import type { Mitarbeiter } from '@core/objects';
import { NichtGefunden } from './NichtGefunden';

const KATEGORIEN = STRUKTUR.find((h) => h.id === 'betrieb')!.kategorien!;
/** Glas-Icon je Tür für die Fenster-Skizze (früher ein Objektfoto) – das Label bleibt die Information. */
const TUER_ICON: Record<string, string | undefined> = {
  geld: 'euro',
  team: 'team',
  ausstattung: 'werkzeug',
  unternehmen: 'einstellungen',
};

/** Der wichtigste Hinweis einer Kategorie (nur „Aufmerksamkeit“ – Routine bleibt still) */
function hinweisFuer(k: Kategorie, ich: Mitarbeiter | undefined) {
  for (const z of sichtbareZiele(k.ziele, ich)) {
    for (const a of sichtbareAnsichten(z, ich)) {
      for (const id of a.module) {
        try {
          const info = modul(id)?.kurzinfo?.();
          if (info?.ton === 'achtung') return info.text;
        } catch {
          /* Kurzinfo ist optional */
        }
      }
    }
  }
  return undefined;
}

export function BetriebSeite() {
  useDatenstand();
  const ich = useIch();
  const kategorien = KATEGORIEN.filter((k) => sichtbareZiele(k.ziele, ich).length > 0);
  const [suche, setSuche] = useState('');
  const sucht = suche.trim().length > 0;
  return (
    <Seite titel="Betrieb" untertitel="Alles, was dein Betrieb dauerhaft braucht. Hier findest du jedes Modul.">
      <div className="mm-modulsuche">
        <Suchfeld wert={suche} onChange={setSuche} platzhalter="Modul finden …" />
      </div>
      {!sucht && (
      <ul className="mm-tueren">
        {kategorien.map((k) => {
          // Hinweise zu Verwaltung und Freigaben betreffen Chef und Büro
          const hinweis = istBuero(ich) ? hinweisFuer(k, ich) : undefined;
          return (
            <li key={k.id}>
              <Link to={`/betrieb/${k.id}`} className="mm-tuer">
                <SkizzenKachel icon={TUER_ICON[k.id] ?? k.icon} groesse="mittel" />
                <span className="mm-tuer-text">
                  <strong>{k.titel}</strong>
                  <span className="mm-meta">{k.text}</span>
                  {hinweis && <Status ton="achtung">{hinweis}</Status>}
                </span>
                <Icon name="weiter" size={20} className="mm-modulzeile-pfeil" />
              </Link>
            </li>
          );
        })}
      </ul>
      )}
      <AlleModule suche={suche} />
    </Seite>
  );
}

/** Verzeichnis aller Module, die du sehen darfst – gruppiert, mit Stern für die Favoriten */
function AlleModule({ suche }: { suche: string }) {
  const ich = useIch();
  const favoriten = useFavoriten();
  const woerter = suche.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const passt = (m: ModulDef) => woerter.every((w) => `${m.titel} ${m.beschreibung}`.toLowerCase().includes(w));
  const gruppen = modulVerzeichnis(ich)
    .map((g) => ({ ...g, module: g.module.filter(passt) }))
    .filter((g) => g.module.length);

  return (
    <Abschnitt
      titel="Alle Module"
      hinweis="Mit dem Stern legst du ein Modul in deine Seitenleiste. Dort kannst du es umbenennen, sortieren und in Ordner stecken."
    >
      {gruppen.length ? (
        <div className="mm-verzeichnis">
          {gruppen.map((g) => (
            <section key={g.id} className="mm-verzeichnis-gruppe" aria-labelledby={`verzeichnis-${g.id}`}>
              <h3 id={`verzeichnis-${g.id}`} className="mm-verzeichnis-titel">
                {g.titel}
              </h3>
              <ul className="mm-liste">
                {g.module.map((m) => {
                  const an = favoriten.istFavorit(m.id);
                  const gesperrt = !an && favoriten.voll;
                  return (
                    <li key={m.id} className="mm-verzeichnis-eintrag">
                      <Link to={modulPfad(m)} className="mm-listenzeile mm-listenzeile--klickbar">
                        <span className="mm-verzeichnis-icon" aria-hidden>
                          <ThemenIcon name={m.icon ?? 'info'} size={36} />
                        </span>
                        <span className="mm-listenzeile-text">
                          <span className="mm-listenzeile-titel">{m.titel}</span>
                          <span className="mm-meta">{m.beschreibung}</span>
                        </span>
                      </Link>
                      <button
                        type="button"
                        className={`mm-iconbtn mm-favorit ${an ? 'mm-favorit--an' : ''}`}
                        aria-pressed={an}
                        aria-disabled={gesperrt}
                        aria-label={an ? `${m.titel} aus deiner Seitenleiste nehmen` : `${m.titel} in deine Seitenleiste legen`}
                        title={an ? 'Aus der Seitenleiste nehmen' : gesperrt ? 'Deine Seitenleiste ist voll. Entferne zuerst einen Eintrag.' : 'In die Seitenleiste legen'}
                        onClick={() => !gesperrt && favoriten.umschalten(m.id)}
                      >
                        <Icon name="stern" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <Leer titel="Kein Modul gefunden" text={`Zu „${suche.trim()}“ gibt es kein Modul. Versuch ein anderes Wort.`} />
      )}
    </Abschnitt>
  );
}

/** `/betrieb/<kategorie>` öffnet direkt die erste Arbeitsansicht – kein leerer Zwischen-Hub */
export function KategorieWeiter() {
  const { kategorie } = useParams();
  const ich = useIch();
  const k = KATEGORIEN.find((x) => x.id === kategorie);
  if (!k) return <NichtGefunden />;
  const z = sichtbareZiele(k.ziele, ich)[0];
  if (!z) return <Navigate to="/betrieb" replace />;
  return <Navigate to={zielPfad(z, ich)} replace />;
}
