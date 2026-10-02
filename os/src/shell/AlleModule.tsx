/**
 * Betrieb › Alle Module: das Verzeichnis aller Funktionen, geordnet nach ihrem Ort in der Struktur.
 * Hier findet man alles (mit Suche) und markiert Module mit dem Stern als Favorit für die Navigation.
 * Keine eigene Ebene in der Navigation – erreichbar über den Link unter den Betrieb-Kacheln.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { alleModule, modulPfad, type ModulDef } from '@core/modul';
import { useDatenstand } from '@core/db';
import { useIch } from '@core/session';
import { modulSichtbar, useFavoriten } from '@core/favoriten';
import { Icon, Leer, Seite, Suchfeld } from '@ui/index';
import { STRUKTUR, ortVonModul } from './struktur';

interface Gruppe {
  id: string;
  titel: string;
  module: { m: ModulDef; ort?: string }[];
}

/** Reihenfolge wie in der Struktur: Heute, Aufträge, Planen, dann die vier Betrieb-Kategorien */
const REIHENFOLGE = STRUKTUR.flatMap((h) => (h.kategorien ? h.kategorien.map((k) => `${h.id}/${k.id}`) : [h.id]));

export function AlleModuleSeite() {
  useDatenstand();
  const ich = useIch();
  const favoriten = useFavoriten();
  const [suche, setSuche] = useState('');
  const q = suche.trim().toLowerCase();

  const gruppen = new Map<string, Gruppe>();
  for (const m of alleModule()) {
    if (!modulSichtbar(m, ich)) continue;
    if (q && !`${m.titel} ${m.beschreibung}`.toLowerCase().includes(q)) continue;
    const o = ortVonModul(m.id);
    const id = o ? (o.kategorie ? `${o.haupt.id}/${o.kategorie.id}` : o.haupt.id) : 'weitere';
    const titel = o ? (o.kategorie ? `${o.haupt.titel} › ${o.kategorie.titel}` : o.haupt.titel) : 'Weitere';
    const g = gruppen.get(id) ?? { id, titel, module: [] };
    g.module.push({ m, ort: o?.ziel?.titel });
    gruppen.set(id, g);
  }
  const liste = [...gruppen.values()].sort((a, b) => rang(a.id) - rang(b.id));

  return (
    <Seite titel="Alle Module" untertitel="Hier findest du jede Funktion. Markiere deine wichtigsten mit dem Stern – sie stehen dann zusätzlich in deiner Navigation.">
      <div className="mm-modulsuche">
        <Suchfeld wert={suche} onChange={setSuche} platzhalter="Modul finden …" />
      </div>
      {liste.length ? (
        <div className="mm-modulgruppen">
          {liste.map((g) => (
            <section key={g.id} className="mm-modulgruppe" aria-labelledby={`gruppe-${g.id}`}>
              <h2 id={`gruppe-${g.id}`} className="mm-modulgruppe-titel">
                {g.titel}
              </h2>
              <ul className="mm-liste">
                {g.module.map(({ m, ort }) => {
                  const an = favoriten.istFavorit(m.id);
                  return (
                    <li key={m.id} className="mm-modulzeile-eintrag">
                      <Link to={modulPfad(m)} className="mm-listenzeile mm-listenzeile--klickbar">
                        <span className="mm-modulzeile-icon" aria-hidden>
                          <Icon name={m.icon ?? 'info'} size={20} />
                        </span>
                        <span className="mm-listenzeile-text">
                          <span className="mm-listenzeile-titel">{m.titel}</span>
                          <span className="mm-meta">{ort ? `${ort} · ${m.beschreibung}` : m.beschreibung}</span>
                        </span>
                      </Link>
                      <button
                        type="button"
                        className={`mm-iconbtn mm-favorit ${an ? 'mm-favorit--an' : ''}`}
                        aria-pressed={an}
                        aria-label={an ? `${m.titel} aus Favoriten entfernen` : `${m.titel} als Favorit markieren`}
                        title={an ? 'Aus Favoriten entfernen' : 'Als Favorit in die Navigation'}
                        onClick={() => favoriten.umschalten(m.id)}
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
    </Seite>
  );
}

function rang(id: string) {
  const i = REIHENFOLGE.indexOf(id);
  return i < 0 ? REIHENFOLGE.length : i;
}
